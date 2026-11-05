'use client';
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–৯. Each card shows its scene's
// picture, the name and the stars. The next one to play says এটা খেলো. Everything is open: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { Icon } from './pictures';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="nt-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="nt-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="nt-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="nt-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`nt-lcard${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="nt-lcard-n" aria-hidden="true">{bn(place)}</span>
              <span className="nt-lcard-icons" aria-hidden="true">{level.icons.map(icon => <Icon key={icon} id={icon} className="nt-lcard-icon" />)}</span>
              <span className="nt-lcard-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="nt-lcard-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
