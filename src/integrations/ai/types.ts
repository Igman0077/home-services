export type GuideContentBlocks = {
  body: string;
  sections?: { heading: string; body: string }[];
};

export type AiGuideDraftOutput = {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  contentBlocks: GuideContentBlocks;
  faqs: { question: string; answer: string }[];
  disclaimer: string;
};

export type AiGenerateRequest = {
  type: "guide_draft";
  topic: string;
  serviceName?: string;
  locationName?: string;
  audience?: string;
};

export type AiGenerateResult = {
  provider: string;
  model: string;
  prompt: string;
  output: AiGuideDraftOutput;
  qualityScore: number;
};

export interface AiProvider {
  generateGuideDraft(request: AiGenerateRequest): Promise<AiGenerateResult>;
}
