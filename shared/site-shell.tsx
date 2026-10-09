import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { brand } from '../lib/brand';
import { catalog } from '../lib/catalog';
import { BrandMark } from '../components/brand-mark';
import type { SiteContent } from './site-types';
import { serializeSchema, websiteSchema } from './seo';

export function HubHeader() {
  return <header className="hub-header"><div className="container hub-header-inner">
    <Link className="hub-brand" href="/" aria-label="একটুখানি — প্রথম পাতা"><BrandMark />{brand.name}<span>ছোট ছোট আনন্দ</span></Link>
    <nav aria-label="মূল মেনু"><Link href="/#tools">সবগুলো দেখুন <span aria-hidden="true">↗</span></Link><Link href="/about">আমাদের কথা</Link></nav>
  </div></header>;
}

export function HubFooter() {
  return <footer className="hub-footer"><div className="container hub-footer-inner"><div><Link className="hub-brand" href="/">{brand.name}</Link><p>একটু আঁকা, একটু খেলা, একটু কাজ গুছিয়ে নেওয়া।</p></div><nav aria-label="আরও জানুন"><Link href="/#tools">সবগুলো</Link><Link href="/about">আমাদের কথা</Link><Link href="/privacy">গোপনীয়তা</Link></nav></div></footer>;
}

export function HubFrame({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#main">মূল অংশে যান</a><HubHeader /><main id="main">{children}</main><HubFooter /></>;
}

export function PageFrame({ site, children }: { site: SiteContent; children: ReactNode }) {
  const path = `/${site.slug}`;
  const category = catalog.find(tool => tool.slug === site.slug)?.category;
  const related = catalog.filter(tool => tool.slug !== site.slug).sort((left, right) => Number(right.category === category) - Number(left.category === category)).slice(0, 3);
  return <div className="site-frame" style={{ '--accent': site.accent } as CSSProperties}>
    <a className="skip-link" href="#main">মূল অংশে যান</a><HubHeader />
    <div className="container tool-navigation"><Link href={path} className="tool-current">{site.name}</Link><nav aria-label={`${site.name} সম্পর্কে`}><Link href={`${path}/guide`}>ব্যবহারের নিয়ম</Link><Link href={`${path}/privacy`}>গোপনীয়তা</Link></nav></div>
    <main id="main">{children}<section className="container related-tools" aria-labelledby="related-heading"><div><p className="eyebrow">আরেকটু সময় আছে?</p><h2 id="related-heading">এগুলোও দেখতে পারেন</h2></div><div className="related-tools-list">{related.map(tool => <Link key={tool.slug} href={`/${tool.slug}`} prefetch={false}><span>{tool.name}</span><span aria-hidden="true">↗</span></Link>)}</div><Link className="related-all" href="/#tools">সবগুলো একসঙ্গে দেখুন →</Link></section></main>
    <footer className="hub-footer"><div className="container hub-footer-inner"><div><Link className="hub-brand" href="/">{brand.name}</Link><p>সবগুলো বিনামূল্যে। নিবন্ধন লাগে না।</p></div><nav aria-label="আরও জানুন"><Link href={`${path}/guide`}>ব্যবহারের নিয়ম</Link><Link href={`${path}/privacy`}>গোপনীয়তা</Link><Link href={`${path}#questions`}>সাধারণ প্রশ্ন</Link></nav></div></footer>
  </div>;
}

export function Faq({ items }: { items: SiteContent['faq'] }) {
  return <section className="section faq-section container" id="questions" aria-labelledby="faq-heading"><div className="section-heading"><p className="eyebrow">আরও জানুন</p><h2 id="faq-heading">সাধারণ প্রশ্ন</h2></div><div className="faq-list">{items.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>;
}

export function JsonLd({ site }: { site: SiteContent }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(websiteSchema(site)) }} />;
}
