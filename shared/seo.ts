import type { Metadata } from 'next';
import { brand } from '../lib/brand';
import type { SiteContent } from './site-types';

export function publicOrigin(value: string | undefined) {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be a public HTTPS origin without credentials, a path or query.');
  }
  return url.origin;
}

export function serializeSchema(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

type PageDescription = { title: string; description: string; path: string; image?: string };

export function siteMetadata(page: PageDescription): Metadata {
  const origin = publicOrigin(process.env.SITE_URL);
  const image = { url: page.image ?? '/social/ektukhani.png', alt: page.image ? page.title : 'একটুখানি — আঁকা, খেলা আর দরকারি ছোট কাজ' };
  return {
    title: page.title,
    description: page.description,
    applicationName: brand.name,
    metadataBase: new URL(origin ?? 'http://127.0.0.1:3100'),
    ...(origin ? { alternates: { canonical: page.path } } : {}),
    robots: { index: Boolean(origin), follow: Boolean(origin) },
    openGraph: { title: page.title, description: page.description, type: 'website', locale: 'bn_BD', siteName: brand.name, images: [image], ...(origin ? { url: origin + page.path } : {}) },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [image] },
    icons: { icon: '/icon.svg' },
  };
}

export function pageMetadata(site: SiteContent, page?: Omit<PageDescription, 'image'>): Metadata {
  return siteMetadata({
    title: `${page?.title ?? site.title} | ${brand.name}`,
    description: page?.description ?? site.description,
    path: `/${site.slug}${page?.path ?? ''}`,
    image: site.socialImage,
  });
}

export function faqSchema(items: SiteContent['faq']) {
  return { '@type': 'FAQPage', inLanguage: 'bn-BD', mainEntity: items.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) };
}

export function websiteSchema(site: SiteContent) {
  const origin = publicOrigin(process.env.SITE_URL);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebApplication', name: site.name, description: site.description, applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', inLanguage: 'bn-BD', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'BDT' }, ...(origin ? { url: `${origin}/${site.slug}` } : {}) },
      ...(origin ? [{ '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: brand.name, item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: site.name, item: `${origin}/${site.slug}` },
      ] }] : []),
      faqSchema(site.faq),
    ],
  };
}
