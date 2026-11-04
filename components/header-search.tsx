'use client';

import { useId, useRef, useState } from 'react';
import type { Hit } from './search-index';

type Finder = (query: string) => Hit[];
let finder: Promise<Finder> | undefined;
const loadFinder = () => (finder ??= import('./search-index').then(module => module.findTools));

/**
 * The header search. Without JS it is a plain form that opens /tools?q=…; with JS it suggests games and tools
 * as you type, in Bangla, Banglish or English. Arrow keys move, Enter opens, Esc closes.
 */
export function HeaderSearch() {
  const id = useId();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const asked = useRef(0);

  const update = async (value: string) => {
    setQuery(value);
    const ticket = ++asked.current;
    const find = await loadFinder();
    if (ticket !== asked.current) return;
    setHits(find(value));
    setActive(-1);
    setOpen(true);
  };
  const go = (slug: string) => { window.location.assign(`/${slug}`); };
  const shown = open && query.trim() !== '';

  return <form className="hs" action="/tools" role="search" onSubmit={event => { if (active >= 0 && hits[active]) { event.preventDefault(); go(hits[active].slug); } }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <label htmlFor={`${id}-q`} className="screen-reader-only">গেম বা টুল খোঁজো</label>
    <svg className="hs-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
    <input id={`${id}-q`} name="q" type="search" value={query} autoComplete="off" enterKeyHint="search" maxLength={60}
      placeholder="গেম খোঁজো: ক্যারম, ludu…"
      role="combobox" aria-expanded={shown} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
      onFocus={() => { void loadFinder(); setOpen(true); }}
      onChange={event => { void update(event.target.value); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' && hits.length) { event.preventDefault(); setOpen(true); setActive(index => (index + 1) % hits.length); }
        else if (event.key === 'ArrowUp' && hits.length) { event.preventDefault(); setActive(index => (index <= 0 ? hits.length : index) - 1); }
        else if (event.key === 'Escape') { setOpen(false); setActive(-1); }
      }} />
    {shown && <div className="hs-pop">
      {hits.length ? <ul id={`${id}-list`} role="listbox" aria-label="খুঁজে পাওয়া">
        {hits.map((hit, index) => <li key={hit.slug} id={`${id}-${index}`} role="option" aria-selected={index === active}>
          <a href={`/${hit.slug}`} tabIndex={-1} onMouseEnter={() => setActive(index)}>
            {/* Games have a square tile; other tools show the top of their share card. */}
            <img src={hit.game ? `/tiles/${hit.slug}.webp` : `/previews/${hit.slug}.webp`} alt="" width={44} height={44} loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
            <span><b>{hit.name}</b><small>{hit.label}</small></span>
          </a>
        </li>)}
      </ul> : <p id={`${id}-list`} className="hs-none">“{query.trim()}” মেলেনি। অন্য বানানে লিখে দেখো।</p>}
      <a className="hs-all" href={`/tools?q=${encodeURIComponent(query.trim())}`}>সব টুলের মধ্যে খোঁজো →</a>
    </div>}
  </form>;
}
