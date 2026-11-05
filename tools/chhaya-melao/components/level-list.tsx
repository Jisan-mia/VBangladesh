'use client';
// The level list, a choice screen: four worlds on their own walls, numbered cards ১–১১. Each card is a tiny wall (the shadows on
// top, the toys under them), so a child who can't read sees what changes. The next one to play carries a gold arrow. Everything is
// open: a child never meets a lock. It is the only place a level is chosen, so a stray tap in play can't restart a round.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { MiniWall, worldStyle } from './pieces';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so it is on screen without scrolling. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="cs-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="cs-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="cs-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="cs-band" style={worldStyle(world.id)} aria-label={world.name}>
      <h3>{world.name}<small>{world.idea}</small></h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`cs-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.finale ?? level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="cs-card-n" aria-hidden="true">{bn(place)}</span>
              <MiniWall level={id} />
              <span className="cs-card-name">{level.finale ?? level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="cs-card-next" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg></span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
