// POST /api/analyze/message. POST handlers are never cached; with Cache Components enabled, route
// segment config such as `dynamic` / `runtime` must not be exported (Node.js runtime is the default).
import { z } from "zod";
import type { MessageRequest } from "@/lib/types";
import { LIMITS } from "@/lib/types";
import { analyzeMessage } from "@/lib/analysis/pipeline";
import { handleAnalyzePost } from "@/lib/server/http";

export const maxDuration = 30;

const schema = z.object({
  text: z
    .string()
    .max(LIMITS.messageMaxChars)
    .refine((t) => t.trim().length >= LIMITS.messageMinChars),
  lang: z.enum(["en", "hi"]).optional(),
  simulateOutage: z.boolean().optional(),
}) satisfies z.ZodType<MessageRequest>;

export async function POST(request: Request): Promise<Response> {
  return handleAnalyzePost(request, {
    event: "api.message",
    family: "analyze",
    maxBodyBytes: 64 * 1024,
    schema,
    run: (input) => analyzeMessage(input.text, { simulateOutage: input.simulateOutage === true }),
  });
}
