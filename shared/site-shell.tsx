import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { brand } from '../lib/brand';
import { catalog, flagship } from '../lib/catalog';
import { BrandMark } from '../components/brand-mark';
import type { SiteContent } from './site-types';
import { serializeSchema, websiteSchema } from './seo';

export function HubHeader() {
  return <header className="hub-header"><div className="container hub-header-inner">
    <Link className="hub-brand" href="/" aria-label="একটুখানি, প্রথম পাতা"><BrandMark />{brand.name}</Link>
    <nav aria-label="মূল মেনু"><Link className="hub-flagship" href={`/${flagship}`}>আমার ছোটবেলা</Link><Link href="/tools">সব টুল</Link></nav>
  </div></header>;
}

function HubFooterInner({ links }: { links: ReactNode }) {
  return <footer className="hub-footer"><div className="container hub-footer-inner"><div><Link className="hub-brand" href="/"><BrandMark />{brand.name}</Link><p>সব টুল ফ্রি। অ্যাকাউন্ট লাগে না, বিজ্ঞাপনও নেই।</p></div><nav aria-label="আরও জানো">{links}</nav></div></footer>;
}

export function HubFooter() {
  return <HubFooterInner links={<><Link href="/tools">সব টুল</Link><Link href="/about">আমাদের কথা</Link><Link href="/privacy">গোপনীয়তা</Link></>} />;
}

export function HubFrame({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#main">মূল অংশে যাও</a><HubHeader /><main id="main">{children}</main><HubFooter /></>;
}

export function PageFrame({ site, children }: { site: SiteContent; children: ReactNode }) {
  const path = `/${site.slug}`;
  const category = catalog.find(tool => tool.slug === site.slug)?.category;
  // The flagship goes first everywhere else: it's the one most people come back to share.
  const others = catalog.filter(tool => tool.slug !== site.slug && tool.slug !== flagship).sort((left, right) => Number(right.category === category) - Number(left.category === category));
  const related = site.slug === flagship ? others.slice(0, 4) : [catalog.find(tool => tool.slug === flagship)!, ...others.slice(0, 3)];
  return <div className="site-frame" style={{ '--accent': site.accent } as CSSProperties}>
    <a className="skip-link" href="#main">মূল অংশে যাও</a><HubHeader />
    <div className="container tool-navigation"><nav aria-label="তুমি এখানে" className="tool-crumbs"><Link href="/">একটুখানি</Link><span aria-hidden="true">/</span><Link href={path} className="tool-current">{site.name}</Link></nav><nav aria-label={`${site.name} সম্পর্কে`}><Link href={`${path}/guide`}>কীভাবে করবে</Link><Link href={`${path}/privacy`}>গোপনীয়তা</Link></nav></div>
    <main id="main">{children}<section className="container related-tools" aria-labelledby="related-heading"><h2 id="related-heading">এগুলোও ভালো লাগতে পারে</h2><ul className="related-tools-list">{related.map(tool => <li key={tool.slug}><Link href={`/${tool.slug}`} prefetch={false}><strong>{tool.name}</strong><span>{tool.description}</span></Link></li>)}</ul><Link className="related-all" href="/tools">সব টুল একসাথে দেখো →</Link></section></main>
    <HubFooterInner links={<><Link href={`${path}/guide`}>কীভাবে করবে</Link><Link href={`${path}/privacy`}>গোপনীয়তা</Link><Link href={`${path}#questions`}>প্রশ্ন-উত্তর</Link><Link href="/about">আমাদের কথা</Link></>} />
  </div>;
}

export function Faq({ items }: { items: SiteContent['faq'] }) {
  return <section className="section faq-section container" id="questions" aria-labelledby="faq-heading"><div className="section-heading"><h2 id="faq-heading">যা জানতে চাইতে পারো</h2></div><div className="faq-list">{items.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>;
}

export function JsonLd({ site }: { site: SiteContent }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(websiteSchema(site)) }} />;
}
