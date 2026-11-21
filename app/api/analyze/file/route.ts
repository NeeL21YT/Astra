import { z } from "zod";
import type { FileRequest } from "@/lib/types";
import { analyzeFile } from "@/lib/analysis/pipeline";
import { handleAnalyzePost } from "@/lib/server/http";

export const maxDuration = 20;

// Only the 64-character fingerprint is accepted; the file itself is never uploaded.
// fileType is a hint from the browser (guessed from the file name) that only tailors the advice.
const schema = z.object({
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  fileType: z.enum(["app", "program", "archive", "document", "other"]).optional(),
  simulateOutage: z.boolean().optional(),
}) satisfies z.ZodType<FileRequest>;

export async function POST(request: Request): Promise<Response> {
  return handleAnalyzePost(request, {
    event: "api.file",
    family: "analyze",
    maxBodyBytes: 2 * 1024,
    schema,
    run: (input) =>
      analyzeFile(input.sha256, {
        simulateOutage: input.simulateOutage === true,
        fileType: input.fileType,
      }),
  });
}
