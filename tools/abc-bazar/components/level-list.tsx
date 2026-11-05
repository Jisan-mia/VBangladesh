'use client';
// The level list, a choice screen: four worlds in their own colours, numbered cards ১–৯. A card shows its letters or a
// b d drawing (a child who can't read yet knows the shape), the name and the stars. The next one to play carries a
// gold arrow and glows. Everything is open: a child never meets a lock.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn } from '../../../shared/kids-kit';
import { isMirrorLevel, levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from '../lib/levels';
import { Glyph } from './pieces';

function Mark({ id }: { id: number }) {
  if (isMirrorLevel(id)) return <span className="ab-card-mark"><Glyph letter="b" className="ab-glyph" /><Glyph letter="d" className="ab-glyph" /></span>;
  const level = levelOf(id), first = level.letters[0], last = level.letters[level.letters.length - 1];
  // A level about big and small shows the pair; the others show the span of letters they use.
  const text = level.kinds.includes('small') || level.kinds.includes('capital') ? 'A a' : `${first}…${last}`;
  return <span className="ab-card-mark ab-card-letters" lang="en">{text}</span>;
}

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so it is on screen without scrolling. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>('[data-next]');
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="ab-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="ab-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="ab-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="ab-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`ab-card${level.finale ? ' finale' : ''}`} data-next={id === next || undefined} aria-current={id === current ? 'true' : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.finale ?? level.title}${earned ? `, ${bn(earned)} তারা` : ''}${id === next ? ', এটা খেলো' : ''}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="ab-card-n" aria-hidden="true">{bn(place)}</span>
              <Mark id={id} />
              <span className="ab-card-name">{level.finale ?? level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="ab-card-next" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg></span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
