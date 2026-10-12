import type { Metadata } from 'next';
import { brand } from '../lib/brand';
import { catalog } from '../lib/catalog';
import { hubOf } from '../lib/hubs';
import { searchKeywords } from '../lib/search-keywords';
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

// noindex: still followable (links count), just kept out of search results, e.g. per-tool privacy pages.
type PageDescription = { title: string; description: string; path: string; image?: string; noindex?: boolean };

export function siteMetadata(page: PageDescription): Metadata {
  const origin = publicOrigin(process.env.SITE_URL);
  const image = { url: page.image ?? '/social/ektukhani.png', width: 1200, height: 630, alt: page.image ? page.title : 'একটুখানি — ছোটবেলার স্মৃতির খাতা আর বাংলায় ছোট ছোট টুল' };
  return {
    title: page.title,
    description: page.description,
    applicationName: brand.name,
    metadataBase: new URL(origin ?? 'http://127.0.0.1:3100'),
    ...(origin ? { alternates: { canonical: page.path } } : {}),
    robots: { index: Boolean(origin) && !page.noindex, follow: Boolean(origin) },
    openGraph: { title: page.title, description: page.description, type: 'website', locale: 'bn_BD', siteName: brand.name, images: [image], ...(origin ? { url: origin + page.path } : {}) },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [image] },
    icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: '48x48' }], apple: '/apple-icon.png' },
    manifest: '/manifest.webmanifest',
  };
}

export function pageMetadata(site: SiteContent, page?: Omit<PageDescription, 'image'>): Metadata {
  return siteMetadata({
    title: `${page?.title ?? site.title} | ${brand.name}`,
    description: page?.description ?? site.description,
    path: `/${site.slug}${page?.path ?? ''}`,
    image: site.socialImage,
    noindex: page?.noindex,
  });
}

export function faqSchema(items: SiteContent['faq']) {
  return { '@type': 'FAQPage', inLanguage: 'bn-BD', mainEntity: items.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) };
}

// schema.org application types by catalog category (accuracy only; no ratings are ever invented).
const applicationCategory: Record<string, string> = { 'গেম': 'GameApplication', 'হিসাব-নিকাশ': 'UtilitiesApplication', 'ভাষা আর পড়াশোনা': 'EducationalApplication' };

const crumbHub = (origin: string, slug: string) => { const hub = hubOf(slug); return hub ? [{ '@type': 'ListItem', position: 2, name: hub.name, item: `${origin}/${hub.slug}` }] : []; };

export function websiteSchema(site: SiteContent) {
  const origin = publicOrigin(process.env.SITE_URL);
  const category = catalog.find(tool => tool.slug === site.slug)?.category ?? '';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': category === 'গেম' ? ['WebApplication', 'VideoGame'] : 'WebApplication', name: site.name, description: site.description, applicationCategory: applicationCategory[category] ?? 'EntertainmentApplication', ...(origin ? { '@id': `${origin}/${site.slug}#app`, publisher: { '@id': `${origin}/#org` } } : {}), ...(site.socialImage && origin ? { image: origin + site.socialImage } : {}), ...(site.verified ? { dateModified: site.verified } : {}), ...(searchKeywords[site.slug] ? { alternateName: searchKeywords[site.slug].slice(0, 3) } : {}), operatingSystem: 'Any', inLanguage: 'bn-BD', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'BDT' }, ...(origin ? { url: `${origin}/${site.slug}` } : {}) },
      ...(origin ? [{ '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: brand.name, item: `${origin}/` },
        ...crumbHub(origin, site.slug),
        { '@type': 'ListItem', position: hubOf(site.slug) ? 3 : 2, name: site.name, item: `${origin}/${site.slug}` },
      ] }] : []),
      faqSchema(site.faq),
    ],
  };
}
