'use client';
// The picture list, a choice screen: four worlds in their own colours, each picture as a thumbnail (its colours when done, a
// dark shadow when not), with its number and stars. The next one to play says এটা খেলো and each world's last picture is a
// wide শেষ ছবি. Everything is open: a child never meets a lock. ← ফিরে যাও changes nothing.
import { useEffect, useRef } from 'react';
import { bn } from '../../../shared/kids-kit';
import { Stars } from '../../../shared/game-ui';
import { WORLDS, figureOf, levelsOfWorld, nextToPlay, specOf } from '../lib/levels';
import { FigureArt } from './figure-art';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the picture that's ready; scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="st-levels" ref={box} role="dialog" aria-label="ছবি বেছে নাও">
    <div className="st-levels-head">
      <button type="button" className="st-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
      <p>কোনটা বানাবে?</p>
    </div>
    {WORLDS.map(world => <section key={world.id} className="st-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const figure = figureOf(id), earned = stars[id] ?? 0, spec = specOf(id);
          return <li key={id} data-finale={spec.finale || undefined}>
            <button type="button" className="st-card" data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`ছবি ${bn(id)}, ${figure.name}${spec.finale ? ', শেষ ছবি' : ''}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="st-card-n" aria-hidden="true">{bn(id)}</span>
              <FigureArt figure={figure} size={spec.finale ? 84 : 64} shadow={!earned} label={false} className="st-card-art" />
              <span className="st-card-name">{figure.name}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="st-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
