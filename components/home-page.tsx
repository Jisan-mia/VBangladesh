import Link from 'next/link';
import { homeFaq } from '../lib/brand';
import { allGames, bigTiles, featured, gridOrder, kidsGames, newestGames, otherTools, tagsOf, toolBySlug } from '../lib/portal';
import { previewSlugs } from '../lib/previews';
import { tileSlugs } from '../lib/tiles';
import { HubFrame } from '../shared/site-shell';
import { GameTile, tileImage } from './game-tile';
import { CategoryTile, portalCategories } from './portal-categories';
import { RecentRow } from './recent-row';

const bn = new Intl.NumberFormat('bn-BD');
// The first screenful loads at once; everything below it waits until it scrolls near.
const EAGER = 12;
// Non-game tools people open most, for the compact টুলস row.
const toolPicks = ['amar-chhotobela', 'desh-cheno', 'komon-porlo', 'eta-na-ota', 'banan', 'daknam', 'shubhechha', 'salami-chek', 'jomi', 'bidyut-bill', 'boyos', 'gpa'];

function Arrow() {
  return <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function HomePage() {
  const tiles = new Set(tileSlugs());
  const previews = new Set(previewSlugs());
  const picks = featured.map(toolBySlug).filter(tool => tool !== undefined);
  const fresh = newestGames(10);
  const grid = gridOrder();
  // Big tiles take turns against the left and right edge, so the grid doesn't lean one way.
  const bigOnes = grid.filter(tool => bigTiles.has(tool.slug)).map(tool => tool.slug);
  const side = (slug: string) => bigOnes.includes(slug) ? (bigOnes.indexOf(slug) % 2 ? 'right' as const : 'left' as const) : undefined;
  const categories = portalCategories();
  const tools = toolPicks.map(toolBySlug).filter(tool => tool !== undefined);
  return <HubFrame current="/">
    <div className="pt">
      <div className="pt-wrap">
        <section className="pt-intro" aria-labelledby="pt-title">
          <h1 id="pt-title">বাংলা গেম খেলো ফ্রিতে</h1>
          <p>{bn.format(allGames.length)}টা গেম, ফোনের ব্রাউজারেই চলে। নামাতে হয় না কিছুই।</p>
        </section>

        <RecentRow entries={allGames.map(tool => ({ slug: tool.slug, name: tool.name, tile: tiles.has(tool.slug) }))} />

        <section className="pt-section" aria-labelledby="pt-picks-title">
          <div className="pt-head"><h2 id="pt-picks-title">সেরা বাছাই</h2><Link href="/games" prefetch={false}>সব গেম <Arrow /></Link></div>
          <ul className="pt-row pt-row-big">{picks.map((tool, index) => <GameTile key={tool.slug} tool={tool} image={tileImage(tool.slug, tiles, previews)} eager={index < EAGER} />)}</ul>
        </section>

        <section className="pt-section" aria-labelledby="pt-cats-title">
          <h2 id="pt-cats-title" className="screen-reader-only">ধরন বেছে নাও</h2>
          <ul className="pc-list">{categories.map(category => <CategoryTile key={category.id} category={category} />)}</ul>
        </section>

        <section className="pt-section" aria-labelledby="pt-new-title">
          <div className="pt-head"><h2 id="pt-new-title">নতুন এসেছে</h2></div>
          <ul className="pt-row pt-row-small">{fresh.map(tool => <GameTile key={tool.slug} tool={tool} image={tileImage(tool.slug, tiles, previews)} />)}</ul>
        </section>

        <section className="pt-section" aria-labelledby="pt-all-title">
          <div className="pt-head"><h2 id="pt-all-title">সব গেম</h2><Link href="/games" prefetch={false}>ধরন ধরে দেখো <Arrow /></Link></div>
          <ul className="pt-grid">
            {grid.map(tool => <GameTile key={tool.slug} tool={tool} image={tileImage(tool.slug, tiles, previews)} big={side(tool.slug)} tags={tagsOf(tool.slug)} />)}
            {categories.filter(category => category.id === 'chhotoder' || category.id === 'quiz').map(category => <CategoryTile key={category.id} category={category} />)}
          </ul>
        </section>

        <section className="pt-section" aria-labelledby="pt-kids-title">
          <div className="pt-head"><h2 id="pt-kids-title">ছোটদের খেলাঘর</h2><Link href="/chhotoder" prefetch={false}>সব {bn.format(kidsGames.length)}টা <Arrow /></Link></div>
          <ul className="pt-row pt-row-small">{[...kidsGames].reverse().slice(0, 10).map(tool => <GameTile key={tool.slug} tool={tool} image={tileImage(tool.slug, tiles, previews)} />)}</ul>
        </section>

        <section className="pt-section pt-tools" aria-labelledby="pt-tools-title">
          <div className="pt-head"><h2 id="pt-tools-title">খেলার বাইরেও আছে</h2><Link href="/tools" prefetch={false}>সব টুল ({bn.format(otherTools.length)}টা) <Arrow /></Link></div>
          <p className="pt-tools-lead">কুইজ, উৎসবের কার্ড, ছোটবেলার স্মৃতি আর রোজকার হিসাব। <Link href="/quiz">কুইজ</Link> · <Link href="/hishab">হিসাব</Link> · <Link href="/utsob">উৎসব</Link></p>
          <ul className="pt-tool-row">{tools.map(tool => <li key={tool.slug}>
            <Link href={`/${tool.slug}`} prefetch={false}>
              {/* Share cards are tall; the box shows their top, where the title and art sit. */}
              <span className="pt-tool-art">{previews.has(tool.slug) && <img src={`/previews/${tool.slug}.webp`} alt="" width={540} height={720} loading="lazy" decoding="async" />}</span>
              <span className="pt-tool-name">{tool.name}<small>{tool.category}</small></span>
            </Link>
          </li>)}</ul>
        </section>

        <section className="pt-section pt-faq" aria-labelledby="pt-faq-title">
          <h2 id="pt-faq-title">যা জানতে চাইতে পারো</h2>
          <div className="home-faq-list">{homeFaq.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
          <p className="pt-trust">কোনো অ্যাকাউন্ট নেই, বিজ্ঞাপন নেই। <Link href="/privacy">তোমার তথ্য কোথায় থাকে</Link> · <Link href="/about">আমাদের কথা</Link></p>
        </section>
      </div>
    </div>
  </HubFrame>;
}
