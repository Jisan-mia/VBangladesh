import Link from 'next/link';
import type { Hub } from '../lib/hubs';
import { catalog } from '../lib/catalog';
import type { Filter } from '../lib/portal';
import { tagsOf } from '../lib/portal';
import { previewSlugs } from '../lib/previews';
import { tileSlugs } from '../lib/tiles';
import { serializeSchema } from '../shared/seo';
import { HubFrame } from '../shared/site-shell';
import { hubSchema, hubTools } from './category-hub';
import { GameTile, tileImage } from './game-tile';
import { CategoryTile, portalCategories } from './portal-categories';

const bn = new Intl.NumberFormat('bn-BD');
const EAGER = 12;

/**
 * /games and /chhotoder: the hub's games as square tiles with filter chips.
 * The filters are plain links to #id and CSS `:target` hides the rest, so they need no JS and
 * a link from the home page (/games#dhadha) opens already filtered.
 */
export function GameHub({ hub, filters, aboutHeading, extraTiles = [] }: { hub: Hub; filters: Filter<string>[]; aboutHeading: string; extraTiles?: string[] }) {
  const tools = hubTools(hub);
  const tiles = new Set(tileSlugs());
  const previews = new Set(previewSlugs());
  const categories = portalCategories().filter(category => extraTiles.includes(category.id));
  return <HubFrame current={`/${hub.slug}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(hubSchema(hub, tools)) }} />
    <div className="pt">
      <div className="pt-wrap">
        <nav aria-label="তুমি এখানে" className="hub-crumbs pt-crumbs"><Link href="/">একটুখানি</Link> / <span aria-current="page">{hub.name}</span></nav>
        <section className="pt-intro" aria-labelledby="pt-title">
          <h1 id="pt-title">{hub.h1}</h1>
          <p>{bn.format(tools.length)}টা খেলা, ফোনের ব্রাউজারেই চলে।</p>
        </section>
        <div className={`gf gf-${hub.slug}`}>
          <span className="gf-target" id="all" />
          {filters.map(filter => <span className="gf-target" id={filter.id} key={filter.id} />)}
          <nav className="gf-chips" aria-label="ধরন বেছে নাও">
            <a href="#all" className="gf-chip-all">সব <small>{bn.format(tools.length)}</small></a>
            {filters.map(filter => <a href={`#${filter.id}`} key={filter.id}>{filter.name} <small>{bn.format(tools.filter(tool => tagsOf(tool.slug).includes(filter.id)).length)}</small></a>)}
          </nav>
          <ul className="pt-grid">
            {tools.map((tool, index) => <GameTile key={tool.slug} tool={tool} image={tileImage(tool.slug, tiles, previews)} eager={index < EAGER} tags={tagsOf(tool.slug)} />)}
            {categories.map(category => <CategoryTile key={category.id} category={category} />)}
          </ul>
        </div>
        {hub.more && <section className="pt-section" aria-labelledby="pt-more-title">
          <div className="pt-head"><h2 id="pt-more-title">{hub.more.heading}</h2></div>
          <ul className="pt-grid">{hub.more.tools.flatMap(slug => catalog.filter(tool => tool.slug === slug)).map(tool => <GameTile key={tool.slug} tool={tool} image={tileImage(tool.slug, tiles, previews)} />)}</ul>
        </section>}
        <section className="pt-section pt-about" aria-labelledby="pt-about-title">
          <h2 id="pt-about-title">{aboutHeading}</h2>
          {hub.intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <p><Link href="/tools">সব টুল একসাথে দেখো →</Link></p>
        </section>
      </div>
    </div>
  </HubFrame>;
}
