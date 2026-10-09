import type { MetadataRoute } from 'next';
import { publicOrigin } from '../shared/seo';
export default function robots(): MetadataRoute.Robots {
  const origin = publicOrigin(process.env.SITE_URL);
  return origin ? { rules: { userAgent: '*', allow: '/' }, sitemap: `${origin}/sitemap.xml` } : { rules: { userAgent: '*', disallow: '/' } };
}
