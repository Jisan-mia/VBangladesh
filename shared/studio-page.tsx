import type { ReactNode } from 'react';
import type { SiteContent } from './site-types';
import { Faq, JsonLd, PageFrame } from './site-shell';
import './studio.css';

export function StudioPage({ site, children }: { site: SiteContent; children: ReactNode }) {
  return <PageFrame site={site}><JsonLd site={site}/><section className="container studio-hero"><div><p className="eyebrow">একটুখানি / {site.name}</p><h1>{site.name}</h1><p>{site.lead}</p><a className="button" href="#tool">{site.cta} <span aria-hidden="true">↓</span></a></div><p className="studio-promise">নিজের মতো করে দেখুন।<br/><span>বিনামূল্যে · নিবন্ধন লাগে না</span></p></section><section id="tool" className="container studio-workbench" aria-label={site.name}>{children}</section><section className="container studio-how"><h2>যেভাবে ব্যবহার করবেন</h2><ol>{site.steps.slice(0,3).map(step=><li key={step}>{step}</li>)}</ol></section><Faq items={site.faq}/></PageFrame>;
}
