import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShare } from '../../../lib/server/store';
import { toolShare } from '../../../lib/share-registry';
import { getToolContent } from '../../../lib/tool-content';
import { siteMetadata } from '../../../shared/seo';
import { HubFrame } from '../../../shared/site-shell';

type Props = { params: Promise<{ id: string }> };

async function find({ params }: Props) {
  const { id } = await params;
  const row = getShare(id);
  const share = row ? toolShare(row.tool) : null;
  const site = row ? getToolContent(row.tool) : undefined;
  return row && share && site ? { id, site, href: `/${row.tool}#${row.state}`, preview: share.preview(row.state) } : null;
}

async function load(props: Props) {
  const found = await find(props);
  if (!found) notFound();
  return found;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  // A missing card gets plain metadata here; the page itself shows the friendly not-found screen.
  const found = await find(props);
  if (!found) return { title: 'কার্ডটা আর নেই | একটুখানি', robots: { index: false, follow: true } };
  const { id, site, preview } = found;
  // Personal previews are for chat apps, not search results: noindex, no canonical, links still followed.
  const metadata = siteMetadata({ title: preview.title, description: preview.description, path: `/s/${id}`, image: site.socialImage, noindex: true });
  return { ...metadata, alternates: undefined };
}

export default async function SharedCard(props: Props) {
  const { site, href, preview } = await load(props);
  return <HubFrame><section className="container prose hub-prose">
    {/* Runs as soon as the HTML arrives, before any JS bundle; crawlers still read the preview tags. */}
    <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(href).replace(/</g, '\\u003c')})` }} />
    <p className="eyebrow">{site.name}</p>
    <h1>{preview.title}</h1>
    <p>{preview.description}</p>
    <a className="button" href={href}>খুলে দেখো <span aria-hidden="true">→</span></a>
  </section></HubFrame>;
}
