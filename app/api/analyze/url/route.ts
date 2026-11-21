import { z } from "zod";
import type { UrlRequest } from "@/lib/types";
import { LIMITS } from "@/lib/types";
import { analyzeUrl } from "@/lib/analysis/pipeline";
import { handleAnalyzePost } from "@/lib/server/http";

export const maxDuration = 20;

const schema = z.object({
  url: z.string().max(LIMITS.urlMaxChars).refine((u) => u.trim().length > 0),
  simulateOutage: z.boolean().optional(),
}) satisfies z.ZodType<UrlRequest>;

export async function POST(request: Request): Promise<Response> {
  return handleAnalyzePost(request, {
    event: "api.url",
    family: "analyze",
    maxBodyBytes: 16 * 1024,
    schema,
    run: (input) => analyzeUrl(input.url, { simulateOutage: input.simulateOutage === true }),
  });
}
