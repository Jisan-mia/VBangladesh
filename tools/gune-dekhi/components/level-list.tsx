'use client';
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–১২ in play order. Each card shows
// its world's picture, the name and the stars; a finale is a wider card. The next one to play says এটা খেলো. Everything is
// open: a child never meets a lock. It pauses play, and closing it goes back to where it came from.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { BackIcon, WorldIcon } from './pictures';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so the RECOMMENDED card is on screen without scrolling. Scrolls the list, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="gd-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="gd-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="gd-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><BackIcon /></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="gd-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name} <small>{world.idea}</small></h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`gd-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="gd-card-n" aria-hidden="true">{bn(place)}</span>
              <WorldIcon world={world.id} />
              <span className="gd-card-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="gd-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
