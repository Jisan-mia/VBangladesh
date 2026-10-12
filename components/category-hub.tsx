import Link from 'next/link';
import { brand } from '../lib/brand';
import { catalog } from '../lib/catalog';
import type { Hub } from '../lib/hubs';
import { previewSlugs } from '../lib/previews';
import { publicOrigin, serializeSchema, siteMetadata } from '../shared/seo';
import { HubFrame } from '../shared/site-shell';
import { ToolCard } from './tool-card';

export const hubMetadata = (hub: Hub) => siteMetadata({ title: `${hub.title} | ${brand.name}`, description: hub.description, path: `/${hub.slug}` });

/** A server-rendered category page: keyword H1, a short intro, and every tool in the hub as a card. */
export function CategoryHub({ hub }: { hub: Hub }) {
  const origin = publicOrigin(process.env.SITE_URL);
  const tools = hub.tools.map(slug => catalog.find(tool => tool.slug === slug)).filter(tool => tool !== undefined);
  const withPreview = new Set(previewSlugs());
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: hub.h1, description: hub.description, inLanguage: 'bn-BD', ...(origin ? { url: `${origin}/${hub.slug}`, isPartOf: { '@id': `${origin}/#website` } } : {}),
      mainEntity: { '@type': 'ItemList', itemListElement: tools.map((tool, index) => ({ '@type': 'ListItem', position: index + 1, name: tool.name, ...(origin ? { url: `${origin}/${tool.slug}` } : {}) })) } },
    ...(origin ? [{ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: brand.name, item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: hub.name, item: `${origin}/${hub.slug}` },
    ] }] : []),
  ] };
  return <HubFrame>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(schema) }} />
    <section className="container all-tools-page">
      <nav aria-label="তুমি এখানে" className="hub-crumbs"><Link href="/">একটুখানি</Link> / <span aria-current="page">{hub.name}</span></nav>
      <h1>{hub.h1}</h1>
      {hub.intro.map(paragraph => <p className="all-tools-lead" key={paragraph}>{paragraph}</p>)}
      <ul className="home-tool-grid">{tools.map(tool => <li className="home-tool" key={tool.slug}><ToolCard tool={tool} hasPreview={withPreview.has(tool.slug)} level={2} /></li>)}</ul>
      <p className="hub-more"><Link href="/tools">সব টুল একসাথে দেখো →</Link></p>
    </section>
  </HubFrame>;
}
