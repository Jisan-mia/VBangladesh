"use client";
// The level list, a choice screen: four worlds in their own colours, numbered cards ১–১২. A card shows a tiny map (rocks gold,
// craters dark, the start white) and the stars. The next one to play carries a gold arrow and a steady ring. Everything is
// open: a child never meets a lock. Nothing runs under it.
import { useEffect, useRef } from "react";
import { bn } from "../../../shared/kids-kit";
import { LEARNS, WORLDS, badgeName, isFinale, levelOf, nextToPlay } from "../lib/levels";
import { ICONS, MiniStars } from "./pieces";

function MiniMap({ id }: { id: number }) {
  const level = levelOf(id);
  return <svg className="mr-minimap" viewBox={`0 0 ${level.w} ${level.h}`} aria-hidden="true">
    <rect width={level.w} height={level.h} className="mr-mini-ground" />
    {level.craters.map((c, i) => <circle key={`c${i}`} cx={c.x + 0.5} cy={c.y + 0.5} r={0.42} className="mr-mini-crater" />)}
    {level.samples.map((c, i) => <circle key={`s${i}`} cx={c.x + 0.5} cy={c.y + 0.5} r={0.3} className="mr-mini-rock" />)}
    <circle cx={level.start.x + 0.5} cy={level.start.y + 0.5} r={0.28} className="mr-mini-start" />
  </svg>;
}

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars);
  const box = useRef<HTMLDivElement>(null);
  // Start at the level that's ready, so it is on screen without scrolling. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>("[data-next]");
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="mr-levels" ref={box} role="dialog" aria-label="লেভেল বেছে নাও">
    <div className="mr-levels-head">
      <p>কোনটা চালাবে?</p>
      <button type="button" className="mr-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও">{ICONS.back}</button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="mr-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name}</h3>
      <ol>
        {world.ids.map(id => {
          const earned = stars[id] ?? 0;
          return <li key={id}>
            <button type="button" className={`mr-card${isFinale(id) ? " finale" : ""}`} data-next={id === next || undefined} aria-current={id === current ? "true" : undefined}
              aria-label={`লেভেল ${bn(id)}, ${badgeName(id)}: ${LEARNS[id - 1]}${earned ? `, ${bn(earned)} তারা` : ""}${id === next ? ", এটা চালাও" : ""}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="mr-card-n" aria-hidden="true">{bn(id)}</span>
              <MiniMap id={id} />
              <span className="mr-card-name">{badgeName(id)}</span>
              <MiniStars count={earned} />
              {id === next && <span className="mr-card-next" aria-hidden="true">{ICONS.play}</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}

