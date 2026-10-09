import type { ReactNode } from 'react';
import type { SiteContent } from './site-types';
import { Faq, JsonLd, PageFrame } from './site-shell';
import './studio.css';

export function StudioPage({ site, children }: { site: SiteContent; children: ReactNode }) {
  return <PageFrame site={site}><JsonLd site={site}/><section className="container studio-hero">{site.headline && <p className="studio-kicker">{site.name}</p>}<h1>{site.headline ?? site.name}</h1><p>{site.lead}</p><p className="studio-promise">ফ্রি · অ্যাকাউন্ট লাগে না · খুললেই শুরু</p></section><section id="tool" className="container studio-workbench" aria-label={site.name}>{children}</section><section className="container studio-how"><h2>যেভাবে করবে</h2><ol>{site.steps.slice(0,3).map(step=><li key={step}>{step}</li>)}</ol></section><Faq items={site.faq}/></PageFrame>;
}
