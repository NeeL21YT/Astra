// GET /api/health: booleans only (which providers are configured), never keys.
import { connection } from "next/server";
import { isAiConfigured } from "@/lib/ai/provider";
import { llmProviderStatus } from "@/lib/ai/llm";
import { isIpqsConfigured } from "@/lib/phone/providers/ipqs";
import { configuredProviders } from "@/lib/urls/providers";
import { jsonResponse } from "@/lib/server/http";

export async function GET(): Promise<Response> {
  await connection(); // read env at request time, not at build/prerender time
  const p = configuredProviders();
  const ai = llmProviderStatus();
  return jsonResponse({
    ok: true,
    providers: {
      ai: isAiConfigured(),
      // Which language-model providers are set up. They are tried in this order unless
      // AI_PROVIDER_ORDER says otherwise: gemini, openrouter, opencode.
      gemini: ai.gemini,
      openrouter: ai.openrouter,
      opencode: ai.opencode,
      aiVision: ai.vision,
      virustotal: p.virustotal,
      apivoid: p.apivoid,
      ipqs: isIpqsConfigured(),
    },
  });
}
