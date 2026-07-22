import { slugify } from "@/lib/utils";
import type {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
} from "@/integrations/ai/types";

/**
 * Deterministic mock AI — never invents licenses, ratings, or exact prices.
 * All drafts require human review before publish.
 */
export class MockAiProvider implements AiProvider {
  async generateGuideDraft(
    request: AiGenerateRequest,
  ): Promise<AiGenerateResult> {
    const topic = request.topic.trim();
    const service = request.serviceName?.trim() || "home services";
    const location = request.locationName?.trim() || "Northern New York";
    const title = `${topic} — ${location} homeowner guide`;
    const slugBase = slugify(`${topic}-${location}`).slice(0, 80) || "guide-draft";

    const prompt = [
      `Write an educational home-maintenance guide.`,
      `Topic: ${topic}`,
      `Service focus: ${service}`,
      `Location context: ${location}`,
      `Audience: ${request.audience ?? "homeowners"}`,
      `Rules: no invented ratings, licenses, or exact contractor prices; include seasonal Northern NY notes; label estimates as ranges.`,
    ].join("\n");

    const output = {
      title,
      slug: slugBase,
      excerpt: `Practical ${topic.toLowerCase()} guidance for homeowners in ${location}, with seasonal notes and clear “when to call a pro” advice.`,
      seoTitle: `${title} | Educational guide`,
      seoDescription: `Learn about ${topic.toLowerCase()} in ${location}. Educational only — not a substitute for a licensed inspection or quote.`,
      contentBlocks: {
        body: [
          `${topic} matters in ${location}, where freeze-thaw cycles, lake-effect snow, and older housing stock create predictable maintenance pressure.`,
          ``,
          `This guide explains what homeowners typically watch for, which DIY checks are reasonable, and when it is safer to request quotes from licensed local professionals. It is educational content — not a diagnosis, warranty, or bid.`,
        ].join("\n"),
        sections: [
          {
            heading: "What to check first",
            body: `Walk the property when it is safe to do so. Note moisture stains, ice dams, unusual noises from ${service.toLowerCase()} equipment, and any recent storm damage. Photograph issues before they are covered by snow or foliage.`,
          },
          {
            heading: "Northern New York seasonal notes",
            body: `Late fall through early spring is high risk for freeze damage and roof ice. Schedule furnace/filter attention before peak heating demand. Spring melt often reveals foundation seepage and gutter failures that winter hid.`,
          },
          {
            heading: "When to call a professional",
            body: `Call a pro for structural concerns, electrical work, gas appliances, roof work at height, or anything that requires a licensed trade. Use the directory to request multiple quotes rather than relying on a single unverified claim.`,
          },
          {
            heading: "Cost expectations",
            body: `Published “average costs” online are often national and outdated. Local material access, roof pitch, access, and code requirements change ranges widely. Treat any online figure as a starting range only, then confirm with on-site estimates.`,
          },
        ],
      },
      faqs: [
        {
          question: `Is this ${topic.toLowerCase()} guide a substitute for an inspection?`,
          answer:
            "No. It is educational. A licensed professional should inspect active leaks, structural movement, gas appliances, and electrical hazards.",
        },
        {
          question: `Do Northern NY winters change ${service.toLowerCase()} priorities?`,
          answer:
            "Yes. Snow load, ice dams, freeze bursts, and heating reliability are common seasonal concerns. Prioritize prevention before deep freeze whenever possible.",
        },
        {
          question: "How should I use cost ranges?",
          answer:
            "Use ranges only to plan conversations with contractors. Final pricing depends on site conditions, materials, and scope — never treat a calculator or article figure as a bid.",
        },
      ],
      disclaimer:
        "AI-assisted draft. Must be human-reviewed before publishing. Educational only — not professional advice.",
    };

    return {
      provider: "mock",
      model: "mock-guide-v1",
      prompt,
      output,
      qualityScore: 72,
    };
  }
}
