import type { FileKindHint } from "@/lib/types";
import { Sha256Stream } from "@/lib/client/sha256-stream";

export type FileHashErrorKind = "no_crypto" | "memory" | "read" | "too_big";

export class FileHashError extends Error {
  kind: FileHashErrorKind;
  constructor(kind: FileHashErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

/** Largest file we will fingerprint. Beyond this it would take too long on a phone. */
export const MAX_FILE_BYTES = 2 * 1024 ** 3;
/** Up to this size the browser's fast built-in hashing is used (it needs the whole file in memory). */
const WEB_CRYPTO_MAX_BYTES = 64 * 1024 ** 2;
const CHUNK_BYTES = 8 * 1024 ** 2;

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

function readErrorKind(err: unknown): FileHashErrorKind {
  const name = err instanceof Error ? err.name : "";
  if (name === "NotReadableError" || name === "NotFoundError" || name === "SecurityError") return "read";
  return "memory"; // RangeError and anything else while reading a big file
}

/**
 * SHA-256 of any file, computed in the browser. The file is never uploaded.
 *
 * Small files use the browser's built-in hashing. Large files are read in 8 MB pieces and hashed
 * piece by piece, so a big program or archive does not have to fit in memory. `onProgress`
 * receives a number from 0 to 1.
 */
export async function sha256OfFile(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new FileHashError("too_big");
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;

  if (subtle && file.size <= WEB_CRYPTO_MAX_BYTES) {
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (err) {
      throw new FileHashError(readErrorKind(err));
    }
    try {
      const out = hex(await subtle.digest("SHA-256", buffer));
      onProgress?.(1);
      return out;
    } catch {
      throw new FileHashError("memory");
    }
  }

  // Large file (or a page without Web Crypto, such as plain http): hash it piece by piece.
  const hasher = new Sha256Stream();
  try {
    for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
      const chunk = new Uint8Array(await file.slice(offset, offset + CHUNK_BYTES).arrayBuffer());
      hasher.update(chunk);
      onProgress?.(Math.min(1, (offset + chunk.length) / file.size));
      // Let the page repaint so the progress bar moves and the browser does not look frozen.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } catch (err) {
    throw new FileHashError(readErrorKind(err));
  }
  onProgress?.(1);
  return hasher.digestHex();
}

const APP = new Set(["apk", "xapk", "apks", "aab"]);
const PROGRAM = new Set([
  "exe", "msi", "bat", "cmd", "scr", "dll", "com", "jar", "ps1", "vbs", "js", "wsf", "lnk", "sh", "dmg", "pkg", "deb", "rpm", "appimage",
]);
const ARCHIVE = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "iso", "img", "cab"]);
const DOCUMENT = new Set(["pdf", "doc", "docx", "docm", "xls", "xlsx", "xlsm", "ppt", "pptx", "pptm", "rtf", "odt", "ods", "txt"]);

/** A rough guess from the file name, used only to tailor the advice. Never trusted for safety. */
export function guessFileKind(fileName: string): FileKindHint {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (APP.has(ext)) return "app";
  if (PROGRAM.has(ext)) return "program";
  if (ARCHIVE.has(ext)) return "archive";
  if (DOCUMENT.has(ext)) return "document";
  return "other";
}
