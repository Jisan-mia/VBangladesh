/**
 * <GamePage>: the page every game uses, Poki-style. The game opens big in the shared player, related games sit beside it,
 * and the words (guide, FAQ, schema) live below the fold.
 *
 *   export default function Page() {
 *     return <GamePage site={site} kicker="পুরোনো দিনের সাপের গেম" title="সাপটা ঝালমুড়ি খাবে">
 *       <SnakeGame />
 *     </GamePage>;
 *   }
 *
 * Props: site (content.ts), title (the H1; defaults to site.headline ?? site.name), kicker (optional first line of the H1),
 * kids (defaults to category ছোটদের জন্য), note (kids' ParentNote), shape ('portrait' | 'wide'), more (extra text under the guide).
 * Inside the game, useGamePlayer() from ./game-player-client gives pause, resume, restart and the stage size.
 * Full guide and the per-game checklist: ai_docs/game-dev/game-player.md.
 */
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { brand } from '../lib/brand';
import { catalog, type ToolListing } from '../lib/catalog';
import { hubOf, hubs } from '../lib/hubs';
import { previewSlugs } from '../lib/previews';
import { BrandMark } from '../components/brand-mark';
import { GamePlayer } from './game-player-client';
import type { StageShape } from './game-player-core';
import { Faq, HubFooter, HubHeader, JsonLd } from './site-shell';
import type { SiteContent } from './site-types';

const KIDS = 'ছোটদের জন্য';
const bn = new Intl.NumberFormat('bn-BD');
const firstLetter = (name: string) => [...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(name)][0]?.segment ?? '';

/** Starts right after `slug` and wraps round, so every game is linked from its neighbours, not just the first few. */
function after<T extends { slug: string }>(list: T[], slug: string) {
  const at = list.findIndex(item => item.slug === slug);
  return [...list.slice(at + 1), ...list.slice(0, Math.max(at, 0))].filter(item => item.slug !== slug);
}

/** Games to show around this one. Kids get only kids' tools; everyone else gets same-category tools, then every game. */
export function relatedGames(slug: string, kids: boolean): ToolListing[] {
  const bySlug = new Map<string, ToolListing>(catalog.map(tool => [tool.slug, tool]));
  if (kids) {
    const hub = hubs.find(item => item.slug === 'chhotoder');
    const slugs = [...new Set([...(hub?.tools ?? []), ...(hub?.more?.tools ?? []), ...catalog.filter(tool => tool.category === KIDS).map(tool => tool.slug)])];
    return after(slugs.map(item => bySlug.get(item)).filter(tool => tool !== undefined), slug);
  }
  const category = bySlug.get(slug)?.category;
  const peers = category && category !== 'গেম' ? after(catalog.filter(tool => tool.category === category), slug) : [];
  const games = after(catalog.filter(tool => tool.category === 'গেম'), slug);
  return [...new Map([...peers, ...games].map(tool => [tool.slug, tool])).values()];
}

function GameTile({ tool, preview, eager = false }: { tool: ToolListing; preview: boolean; eager?: boolean }) {
  return <li className="gp-tile">
    <Link href={`/${tool.slug}`} prefetch={false} title={tool.description}>
      <span className="gp-tile-art" aria-hidden="true">
        {preview ? <Image src={`/previews/${tool.slug}.webp`} alt="" fill sizes="132px" loading={eager ? 'eager' : 'lazy'} /> : <b>{firstLetter(tool.name)}</b>}
      </span>
      <span className="gp-tile-name">{tool.name}</span>
    </Link>
  </li>;
}

const RAIL = 12;
const GRID = 18;

export function GamePage({ site, title, kicker, kids, note, shape = 'portrait', more, children }: {
  site: SiteContent;
  title?: ReactNode;
  kicker?: ReactNode;
  kids?: boolean;
  note?: ReactNode;
  shape?: StageShape;
  more?: ReactNode;
  children: ReactNode;
}) {
  const path = `/${site.slug}`;
  const forKids = kids ?? catalog.find(tool => tool.slug === site.slug)?.category === KIDS;
  const previews = new Set(previewSlugs());
  const pool = relatedGames(site.slug, forKids);
  const hub = forKids ? hubs.find(item => item.slug === 'chhotoder') : hubOf(site.slug);
  // The first rows of each rail are above the fold on a desktop; on a phone the same images open the grid below, so they're not wasted.
  const tiles = (list: ToolListing[], eager = 0) => <ul>{list.map((tool, index) => <GameTile key={tool.slug} tool={tool} preview={previews.has(tool.slug)} eager={index < eager} />)}</ul>;

  const head = <>
    {!kicker && <p className="gp-kicker">{site.name}</p>}
    <h1 className="gp-title">{kicker && <span className="gp-kicker">{kicker}</span>} {title ?? site.headline ?? site.name}</h1>
  </>;
  const art = previews.has(site.slug)
    ? <Image src={`/previews/${site.slug}.webp`} alt="" fill sizes="(max-width: 899px) 240px, 56px" loading="eager" fetchPriority="high" />
    : <b>{firstLetter(site.name)}</b>;

  return <div className="site-frame gp-page" data-kids={forKids || undefined} style={{ '--accent': site.accent } as CSSProperties}>
    <a className="skip-link" href="#main">মূল অংশে যাও</a>
    {forKids ? <KidsHeader /> : <HubHeader current={site.slug} />}
    <main id="main">
      <JsonLd site={site} />
      <GamePlayer slug={site.slug} name={site.name} head={head} lead={site.lead} art={art} steps={site.steps} guideTitle={site.guideTitle}
        kids={forKids} shape={shape} note={note} railLeft={tiles(pool.slice(0, RAIL), 6)} railRight={tiles(pool.slice(RAIL, RAIL * 2), 6)}>
        {children}
      </GamePlayer>

      <div className="gp-below">
        <nav className="container gp-crumbs" aria-label="তুমি এখানে">
          {!forKids && <><Link href="/">{brand.name}</Link><span aria-hidden="true">/</span></>}
          {hub && <><Link href={`/${hub.slug}`}>{hub.name}</Link><span aria-hidden="true">/</span></>}
          <Link href={path} aria-current="page">{site.name}</Link>
          <span className="gp-crumbs-more"><Link href={`${path}/guide`}>কীভাবে খেলবে</Link><Link href={`${path}/privacy`}>গোপনীয়তা</Link></span>
        </nav>

        <section className="container gp-more" aria-labelledby="gp-more-title">
          <h2 id="gp-more-title">{forKids ? 'ছোটদের আরও খেলা' : 'আরও খেলো'}</h2>
          {tiles(pool.slice(0, RAIL * 2 + GRID))}
          <Link className="gp-more-all" href={forKids ? '/chhotoder' : '/games'}>{forKids ? 'ছোটদের খেলাঘরের সব খেলা →' : `সব বাংলা গেম, ${bn.format(catalog.filter(tool => tool.category === 'গেম').length)}টা →`}</Link>
        </section>

        <section className="container section gp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          {site.guideIntro && <p>{site.guideIntro}</p>}
          <ol>{site.steps.map((text, index) => <li key={text}><span aria-hidden="true">{bn.format(index + 1)}</span><p>{text}</p></li>)}</ol>
          {more}
        </section>
        <Faq items={site.faq} />
      </div>
    </main>
    {forKids ? <KidsFooter path={path} /> : <HubFooter />}
  </div>;
}

/** Kids' pages lead only to other kids' pages: the brand goes to ছোটদের খেলাঘর, not the grown-up home page. */
function KidsHeader() {
  return <header className="hub-header gp-kids-header"><div className="container hub-header-inner">
    <Link className="hub-brand" href="/chhotoder" aria-label="ছোটদের খেলাঘর, একটুখানি"><BrandMark />ছোটদের খেলাঘর</Link>
  </div></header>;
}

function KidsFooter({ path }: { path: string }) {
  return <footer className="hub-footer"><div className="container hub-footer-inner">
    <div><Link className="hub-brand" href="/chhotoder"><BrandMark />ছোটদের খেলাঘর</Link><p>বিজ্ঞাপন নেই, নাম লাগে না। খেলার কিছু ফোনের বাইরে যায় না।</p></div>
    <nav aria-label="বড়দের জন্য"><Link href={`${path}/guide`}>কীভাবে খেলবে</Link><Link href={`${path}/privacy`}>গোপনীয়তা</Link><Link href="/chhotoder">সব খেলা</Link></nav>
  </div></footer>;
}
