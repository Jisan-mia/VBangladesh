"use client";
// The level list, a choice screen: three worlds in their own colours, numbered cards ১–৯. Each card shows the dinosaurs that level holds
// (in colour once found, a shadow before), the name and the stars. The next one to play carries a ▶ and a ring. Everything is open.
import { useEffect, useRef } from "react";
import { Stars } from "../../../shared/game-ui";
import { bn } from "../../../shared/kids-kit";
import { dinosOf } from "../lib/round";
import { levelOf, levelsOfWorld, nextToPlay, placeOf, WORLDS } from "../lib/worlds";
import { DinoArt } from "./pieces";

export function LevelList({ stars, book, current, onPick, onClose }: { stars: Record<number, number>; book: readonly string[]; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars), box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so it is on screen without scrolling. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>("[data-next]");
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="dn-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="dn-levels-head">
      <p>কোনটা খুঁড়বে?</p>
      <button type="button" className="dn-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="dn-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {levelsOfWorld(world.id).map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, dinos = dinosOf(id);
          return <li key={id}>
            <button type="button" className={`dn-lcard${level.finale ? " finale" : ""}`} data-next={id === next || undefined} aria-current={id === current ? "true" : undefined}
              aria-label={`লেভেল ${bn(placeOf(id))}, ${level.title}: ${dinos.map(dino => dino.name).join(", ")}${earned ? `, ${bn(earned)} তারা` : ""}${id === next ? ", এটা খেলো" : ""}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="dn-lcard-n" aria-hidden="true">{bn(placeOf(id))}</span>
              <span className="dn-lcard-dinos" data-n={dinos.length}>{dinos.map(dino => <span key={dino.id}><DinoArt dino={dino} tint={book.includes(dino.id) ? undefined : "#a89a8a"} /></span>)}</span>
              <span className="dn-lcard-name">{level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <svg className="dn-lcard-next" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" /></svg>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
