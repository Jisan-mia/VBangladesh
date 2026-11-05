'use client';
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–১১. Each card shows a little sign of what
// the level is, its name and its stars. The next one to play says এটা খেলো. Everything is open: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/course';
import { LevelIcon } from './pics';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Starts at the level that's ready, so the glowing card is on screen. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="uk-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="uk-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="uk-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="uk-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}<small>{world.about}</small></h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`uk-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.finale ?? level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="uk-card-n" aria-hidden="true">{bn(place)}</span>
              <span className="uk-card-icon" aria-hidden="true"><LevelIcon kind={level.kind} bell={!!level.run} /></span>
              <span className="uk-card-name">{level.finale ?? level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="uk-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
