import type { MetadataRoute } from 'next';
import { hubs } from '../lib/hubs';
import { getToolContent, toolSlugs } from '../lib/tool-content';
import { publicOrigin } from '../shared/seo';
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicOrigin(process.env.SITE_URL);
  if (!origin) return [];
  const paths = ['/', '/tools', ...hubs.map(hub => `/${hub.slug}`), '/about', '/privacy', ...toolSlugs.map(slug => `/${slug}`)];
  // lastModified only where a tool shows a real verification date, never the build time.
  return paths.map(path => { const verified = getToolContent(path.slice(1))?.verified; return { url: origin + path, ...(verified ? { lastModified: verified } : {}) }; });
}
