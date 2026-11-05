'use client';
// The set list, a choice screen: four worlds in their own cover colours with numbered cards. A card shows the letters
// themselves (a child who can't read yet knows the shapes) and the stars. The next one to play says এটা খেলো.
// Everything is open, as before: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn, levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the set that's ready, so the এটা খেলো card is on screen without scrolling. Scrolls the list, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="bl-levels" ref={box} role="dialog" aria-label="সেট বেছে নাও">
    <div className="bl-levels-head">
      <p>কোনটা লিখবে?</p>
      <button type="button" className="bl-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="bl-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0;
          return <li key={id}>
            <button type="button" className={`bl-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`সেট ${bn(placeOf(id))}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="bl-card-n" aria-hidden="true">{bn(placeOf(id))}</span>
              <span className="bl-card-letters" aria-hidden="true">{level.letters.map(char => <span key={char}>{char}</span>)}</span>
              {level.finale && <span className="bl-card-name">{level.finale}</span>}
              <Stars count={earned} label={false} />
              {id === next && <span className="bl-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
