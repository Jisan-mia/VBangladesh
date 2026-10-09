import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShare } from '../../../lib/server/store';
import { toolShare } from '../../../lib/share-registry';
import { getToolContent } from '../../../lib/tool-content';
import { siteMetadata } from '../../../shared/seo';
import { HubFrame } from '../../../shared/site-shell';
import { OpenShared } from './open-shared';

type Props = { params: Promise<{ id: string }> };

async function load({ params }: Props) {
  const { id } = await params;
  const row = getShare(id);
  const share = row ? toolShare(row.tool) : null;
  const site = row ? getToolContent(row.tool) : undefined;
  if (!row || !share || !site) notFound();
  return { id, site, href: `/${row.tool}#${row.state}`, preview: share.preview(row.state) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, site, preview } = await load(props);
  // Personal previews are for chat apps, not search results.
  return { ...siteMetadata({ title: preview.title, description: preview.description, path: `/s/${id}`, image: site.socialImage }), robots: { index: false, follow: false } };
}

export default async function SharedCard(props: Props) {
  const { site, href, preview } = await load(props);
  return <HubFrame><section className="container prose hub-prose">
    <OpenShared href={href} />
    <p className="eyebrow">{site.name}</p>
    <h1>{preview.title}</h1>
    <p>{preview.description}</p>
    <a className="button" href={href}>খুলে দেখো <span aria-hidden="true">→</span></a>
  </section></HubFrame>;
}
