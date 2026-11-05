'use client';
// The level list, a choice screen: four worlds in their own colours, numbered cards ১–১২. Each card shows the যুক্তবর্ণ it is
// about, whether it breaks (ভাঙি) or joins (জুড়ি) them, and its stars. The next one to play says এটা খেলো. Under the worlds
// sits the খাতা: every যুক্তবর্ণ made so far. Everything is open: a child never meets a lock. Nothing runs under the list.
import { useEffect, useRef } from 'react';
import { bn } from '../../../shared/kids-kit';
import { Stars } from '../../../shared/game-ui';
import { ALL_JOINTS, emblemOf, levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';

export function LevelList({ stars, current, book, onPick, onClose }: { stars: Record<number, number>; current: number; book: readonly string[]; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so the RECOMMENDED card is on screen without scrolling. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="jb-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="jb-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="jb-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="jb-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          const mode = level.mode === 'mixed' ? 'সব মিলিয়ে' : level.mode === 'bhangi' ? 'ভাঙি' : 'জুড়ি';
          return <li key={id}>
            <button type="button" className={`jb-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="jb-card-n" aria-hidden="true">{bn(place)}</span>
              <span className="jb-card-sign" aria-hidden="true">{emblemOf(id).join(' ')}</span>
              <span className="jb-card-name">{mode}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="jb-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
    <section className="jb-book-band" aria-label="যুক্তবর্ণের খাতা">
      <h3>যুক্তবর্ণের খাতা · {bn(book.length)}/{bn(ALL_JOINTS.length)}</h3>
      <ul className="jb-book">{ALL_JOINTS.map(joint => <li key={joint} className={book.includes(joint) ? 'is-got' : ''} aria-label={book.includes(joint) ? joint : 'এখনো পাওনি'}>{book.includes(joint) ? joint : ''}</li>)}</ul>
    </section>
  </div>;
}
