/**
 * Browser-side picture preparation for "read text from a picture".
 *
 * Re-drawing the picture on a canvas and saving it again as JPEG:
 *  - removes hidden metadata (EXIF), such as GPS location and camera details;
 *  - shrinks big phone photos so they upload quickly and fit the server limit;
 *  - turns almost any picture format the browser can show (including iPhone photos
 *    in Safari) into a plain JPEG.
 */
import { LIMITS } from "@/lib/types";

export type PreparedImage = { image: string; mimeType: "image/jpeg" };
export type PrepareResult = { ok: true; value: PreparedImage } | { ok: false; reason: "not_image" | "too_big" | "unreadable" };

const MAX_FILE_BYTES = 25 * 1024 * 1024; // refuse absurd files before decoding
const MAX_SIDE = 1800; // long enough to keep small message text readable

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // fall through to the <img> route
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1)); // drop "data:image/jpeg;base64,"
    };
    reader.readAsDataURL(blob);
  });
}

export async function prepareImage(file: File): Promise<PrepareResult> {
  if (!file.type.startsWith("image/") && file.type !== "") return { ok: false, reason: "not_image" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: "too_big" };

  let decoded: Awaited<ReturnType<typeof decode>> | null = null;
  try {
    decoded = await decode(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, reason: "unreadable" };
    ctx.fillStyle = "#ffffff"; // flatten transparency
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded.source, 0, 0, width, height);

    // Keep it under the server limit; lower the quality a little if needed.
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= LIMITS.ocrMaxImageBytes) {
        return { ok: true, value: { image: await blobToBase64(blob), mimeType: "image/jpeg" } };
      }
    }
    return { ok: false, reason: "too_big" };
  } catch {
    return { ok: false, reason: "unreadable" };
  } finally {
    decoded?.close();
  }
}
