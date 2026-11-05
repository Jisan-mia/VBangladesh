'use client';
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–৯. Each card shows its picture, its
// name and the stars. The next one to play says এটা খেলো. Everything is open: a child never meets a lock. Opened over a trip
// (from the pause menu), the trip waits and ফিরে যাও gives it back.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { BackIcon, LevelIcon } from './pictures';

export function LevelList({ stars, current, overTrip, onPick, onClose }: { stars: Record<number, number>; current: number; overTrip: boolean; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="pg-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="pg-levels-head">
      <p>{overTrip ? 'সফর চলছে। ফিরে যাবে?' : 'কোনটা খেলবে?'}</p>
      <button type="button" className="pg-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><BackIcon /></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="pg-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`pg-lcard${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="pg-lcard-n" aria-hidden="true">{bn(place)}</span>
              <LevelIcon icon={level.icon} className="pg-lcard-icon" />
              <span className="pg-lcard-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="pg-lcard-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
