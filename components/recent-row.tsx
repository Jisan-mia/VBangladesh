'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { parseRecent, RECENT_KEY } from '../lib/recent';

type Entry = { slug: string; name: string; tile: boolean };

const subscribe = (change: () => void) => { window.addEventListener('storage', change); return () => window.removeEventListener('storage', change); };
const read = () => { try { return window.localStorage.getItem(RECENT_KEY); } catch { return null; } };

/** "আবার খেলো": the games this phone played last, from what the game player stores. Hidden until there is one. */
export function RecentRow({ entries }: { entries: Entry[] }) {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const bySlug = useMemo(() => new Map(entries.map(entry => [entry.slug, entry])), [entries]);
  const recent = parseRecent(raw, slug => bySlug.has(slug)).map(slug => bySlug.get(slug)!);
  if (!recent.length) return null;
  return <section className="pt-section pt-recent" aria-labelledby="pt-recent-title">
    <div className="pt-head"><h2 id="pt-recent-title">আবার খেলো</h2></div>
    <ul className="pt-row pt-row-small">{recent.map(entry => <li className="gt" key={entry.slug}>
      <a href={`/${entry.slug}`}>
        <span className="gt-art">{entry.tile && <img src={`/tiles/${entry.slug}.webp`} alt="" width={320} height={320} decoding="async" />}</span>
        <span className="gt-name">{entry.name}</span>
      </a>
    </li>)}</ul>
  </section>;
}
