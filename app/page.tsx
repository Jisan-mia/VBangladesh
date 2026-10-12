import { HomePage } from '../components/home-page';
import { brand } from '../lib/brand';
import { catalog } from '../lib/catalog';
import { faqSchema, publicOrigin, serializeSchema, siteMetadata } from '../shared/seo';

export const metadata = siteMetadata({ ...brand, path: '/' });
export default function Home() {
  const origin = publicOrigin(process.env.SITE_URL);
  const schema = { '@context': 'https://schema.org', '@graph': [
    // alternateName gives Google a Latin-script site name; Organization + logo is how it picks the logo in results.
    { '@type': 'WebSite', name: brand.name, alternateName: 'Ektukhani', description: brand.description, inLanguage: 'bn-BD', ...(origin ? { '@id': `${origin}/#website`, url: `${origin}/`, publisher: { '@id': `${origin}/#org` } } : {}) },
    ...(origin ? [{ '@type': 'Organization', '@id': `${origin}/#org`, name: brand.name, alternateName: 'Ektukhani', url: `${origin}/`, logo: `${origin}/icon-512.png` }] : []),
    { '@type': 'CollectionPage', name: brand.title, description: brand.description, inLanguage: 'bn-BD', ...(origin ? { url: origin } : {}), mainEntity: { '@type': 'ItemList', itemListElement: catalog.map((tool, index) => ({ '@type': 'ListItem', position: index + 1, name: tool.name, ...(origin ? { url: `${origin}/${tool.slug}` } : {}) })) } },
    faqSchema(brand.faq),
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(schema) }}/><HomePage /></>;
}
