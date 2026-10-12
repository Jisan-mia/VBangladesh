export type SiteContent = {
  slug: string;
  socialImage?: string;
  /** ISO date (YYYY-MM-DD) the tool's facts were last checked against their source; only for tools that show one. */
  verified?: string;
  name: string;
  /** Warmer H1 for StudioPage tools; the tool name then shows as a small label above it. */
  headline?: string;
  title: string;
  description: string;
  lead: string;
  cta: string;
  guideTitle: string;
  guideIntro: string;
  steps: string[];
  privacy: string[];
  faq: Array<{ question: string; answer: string }>;
  accent: string;
};
