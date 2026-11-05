"use client";
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–১১. Each card shows what the level is about
// (weights, a fruit, a ★), the name and the stars; the next one to play says এটা খেলো (RECOMMENDED). Everything is open: a child never meets a lock.
// Opened from the pause menu in the middle of a round, picking a level asks first (the ask box, two picture buttons).
import { useEffect, useRef } from "react";
import { Stars } from "../../../shared/game-ui";
import { bn, levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS, type Kind } from "../lib/levels";
import { FRUIT_ART, StarBagArt, WeightArt } from "./art";

const KindArt = ({ kind }: { kind: Kind }) => <span className="dp-card-art" aria-hidden="true">{kind === "fill" ? WeightArt() : kind === "find" ? FRUIT_ART.kola() : StarBagArt()}</span>;

export function LevelList({ stars, current, ask, onPick, onClose, onLeave, onStay }: {
  stars: Record<number, number>; current: number; ask: number; onPick: (id: number) => void; onClose: () => void; onLeave: () => void; onStay: () => void;
}) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so the RECOMMENDED card is on screen without scrolling. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>("[data-next]");
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  const blurred = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  if (ask > 0) return <div className="dp-levels dp-ask" role="alertdialog" aria-label="এই দানটা ছেড়ে দেবে?">
    <p>এই দানটা ছেড়ে <b>{levelOf(ask).title}</b> খেলবে?</p>
    <div className="dp-ask-buttons">
      <button type="button" className="dp-big" onClick={blurred(onStay)} autoFocus>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10L16 24l14 14" /></svg><span>থাকি</span>
      </button>
      <button type="button" className="dp-big dp-big-go" onClick={blurred(onLeave)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 25l9 9 19-20" /></svg><span>চলো</span>
      </button>
    </div>
  </div>;
  return <div className="dp-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="dp-levels-head">
      <p>কোনটা খেলবে?</p>
      <button type="button" className="dp-close" onClick={blurred(onClose)} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="dp-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`dp-card${level.finale ? " finale" : ""}`} data-next={id === next || undefined} aria-current={id === current ? "true" : undefined}
              aria-label={`লেভেল ${bn(place)}, ${level.title}${earned ? `, ${bn(earned)} তারা` : ""}${id === next ? ", এটা খেলো" : ""}`}
              onClick={blurred(() => onPick(id))}>
              <span className="dp-card-n" aria-hidden="true">{bn(place)}</span>
              <KindArt kind={level.kind} />
              <span className="dp-card-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="dp-card-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
