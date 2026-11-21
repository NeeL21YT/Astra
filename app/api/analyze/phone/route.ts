import { z } from "zod";
import { LIMITS } from "@/lib/types";
import { analyzePhone } from "@/lib/analysis/pipeline";
import { handleAnalyzePost } from "@/lib/server/http";

export const maxDuration = 30;

const schema = z.object({
  number: z.string().max(40).refine((n) => n.trim().length > 0),
  context: z
    .object({
      channel: z.enum(["call", "sms", "whatsapp", "other"]).optional(),
      description: z.string().max(LIMITS.phoneDescriptionMaxChars).nullish().transform((d) => d ?? undefined),
    })
    .nullish()
    .transform((c) => c ?? undefined),
  simulateOutage: z.boolean().optional(),
});

export async function POST(request: Request): Promise<Response> {
  return handleAnalyzePost(request, {
    event: "api.phone",
    family: "analyze",
    maxBodyBytes: 16 * 1024,
    schema,
    run: (input) =>
      analyzePhone(input.number, input.context, { simulateOutage: input.simulateOutage === true }),
  });
}
