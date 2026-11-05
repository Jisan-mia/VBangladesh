'use client';
// The level list, a choice screen: four worlds in their own colours, numbered cards ১–১৬. Each card shows the picture of
// what it teaches, its name and its stars. The next one to play says এটা খেলো. Everything is open: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { Icon, Instrument } from './pictures';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="sb-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="sb-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="sb-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><Icon id="back" className="sb-ic" /></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="sb-band" data-world={world.id} aria-label={world.name}>
      <h3><Instrument sound={world.sound < 0 ? 0 : world.sound} className="sb-band-inst" />{world.name}<small>{world.idea}</small></h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`sb-lcard${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="sb-lcard-n" aria-hidden="true">{bn(place)}</span>
              <Icon id={level.icon} className="sb-lcard-ic" />
              <span className="sb-lcard-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="sb-lcard-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
