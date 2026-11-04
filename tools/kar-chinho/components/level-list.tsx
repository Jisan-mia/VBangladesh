'use client';
// The level list, a choice screen: four worlds in their own colours, numbered cards ১–১৪. Each card shows its sign on a
// dotted circle (a child who can't read yet knows the shape), the name and the stars. The next one to play says এটা খেলো.
// Everything is open, as before: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { bn } from '../../../shared/kids-kit';
import { Stars } from '../../../shared/game-ui';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, signsOf, WORLDS } from '../lib/levels';
import { dotted } from '../lib/words';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so the RECOMMENDED card is on screen without scrolling.
  // Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="kc-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="kc-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="kc-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="kc-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id), signs = signsOf(id);
          return <li key={id}>
            <button type="button" className={`kc-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="kc-card-n" aria-hidden="true">{bn(place)}</span>
              <span className="kc-card-sign" aria-hidden="true">{signs.length > 4 ? 'সব' : signs.map(dotted).join(' ')}</span>
              <span className="kc-card-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="kc-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
