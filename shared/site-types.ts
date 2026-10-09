export type SiteContent = {
  slug: string;
  socialImage?: string;
  name: string;
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
