import type { MetadataRoute } from 'next';
import { publicOrigin } from '../shared/seo';

// Search and AI-answer crawlers may read everything public; model-training crawlers also may, except /s/ share
// pages, which hold names and wishes people typed. Without a public SITE_URL (staging), everything stays blocked.
const training = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider', 'cohere-ai', 'Meta-ExternalAgent'];

export default function robots(): MetadataRoute.Robots {
  const origin = publicOrigin(process.env.SITE_URL);
  if (!origin) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      { userAgent: training, allow: '/', disallow: ['/api/', '/s/'] },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
