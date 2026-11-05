'use client';
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–৯. Each card pictures what it asks (hollow dots hide,
// eyes are the looks you have), with the name and the stars. The next one to play says এটা খেলো. Everything is open: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { Back, MiniLevel } from './pictures';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="am-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="am-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="am-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><Back /></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="am-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`am-lcard${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${level.finale ? ', ফাইনাল' : ''}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="am-lcard-n" aria-hidden="true">{bn(place)}</span>
              <MiniLevel hide={level.hide} pieces={level.pieces} eyes={level.eyes} className="am-lcard-mini" />
              <span className="am-lcard-name">{level.finale ?? level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="am-lcard-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
