import type { MetadataRoute } from 'next';
import { toolSlugs } from '../lib/tool-content';
import { publicOrigin } from '../shared/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicOrigin(process.env.SITE_URL);
  if (!origin) return [];
  const paths = ['/', '/tools', '/about', '/privacy', ...toolSlugs.flatMap(slug => [`/${slug}`, `/${slug}/guide`, `/${slug}/privacy`])];
  return paths.map(path => ({ url: origin + path }));
}
