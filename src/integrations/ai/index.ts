import { MockAiProvider } from "@/integrations/ai/mock";
import type { AiProvider } from "@/integrations/ai/types";

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;
  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
    default:
      cached = new MockAiProvider();
      return cached;
  }
}

export type {
  AiGenerateRequest,
  AiGenerateResult,
  AiGuideDraftOutput,
  AiProvider,
  GuideContentBlocks,
} from "@/integrations/ai/types";
