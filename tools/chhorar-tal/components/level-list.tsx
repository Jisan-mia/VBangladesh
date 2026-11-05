// The ছড়া list, a choice screen: three worlds in their own colours, a card for each ছড়া with its finished picture, its
// name and its stars. The next one to play says এটা খেলো. Everything is open: a child never meets a lock.
import { useEffect, useRef } from "react";
import { Stars } from "../../../shared/game-ui";
import { bn } from "../../../shared/kids-kit";
import { WORLDS, levelOf, nextToPlay, placeOf, rhymeForLevel } from "../lib/levels";
import { Scene } from "./scene";

export function LevelList({ stars, current, onPick, onClose }: { stars: Record<number, number>; current: number; onPick: (id: number) => void; onClose: () => void }) {
  const next = nextToPlay(stars), box = useRef<HTMLDivElement>(null);
  // Start at the one that's ready. Scrolls the list itself, never the page.
  useEffect(() => {
    const list = box.current, card = list?.querySelector<HTMLElement>("[data-next]");
    if (list && card) list.scrollTop = Math.max(0, card.offsetTop - list.clientHeight / 2 + card.offsetHeight / 2);
  }, []);
  return <div className="ct-levels" ref={box} role="dialog" aria-label="ছড়া বেছে নাও">
    <div className="ct-levels-head">
      <p>কোনটা বাজাবে?</p>
      <button type="button" className="ct-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
    </div>
    {WORLDS.map(world => <section key={world.id} className="ct-band" data-world={world.id} aria-label={world.name}>
      <h3>{world.name} <small>{world.line}</small></h3>
      <ol>
        {world.ids.map(id => {
          const level = levelOf(id), earned = stars[id] ?? 0, place = placeOf(id);
          return <li key={id}>
            <button type="button" className={`ct-lcard${level.finale ? " finale" : ""}`} data-next={id === next || undefined} aria-current={id === current ? "true" : undefined}
              aria-label={`ছড়া ${bn(place)}, ${rhymeForLevel(id).name}${level.finale ? `, ফাইনাল: ${level.finale}` : ""}${earned ? `, ${bn(earned)} তারা` : ""}${id === next ? ", এটা খেলো" : ""}`}
              onClick={event => { event.currentTarget.blur(); onPick(id); }}>
              <span className="ct-lcard-art" aria-hidden="true"><Scene id={level.rhyme} full className="ct-lcard-svg" /></span>
              <span className="ct-lcard-n" aria-hidden="true">{bn(place)}</span>
              <span className="ct-lcard-name">{level.finale ?? level.title}</span>
              <Stars count={earned} label={false} />
              {id === next && <span className="ct-lcard-next" aria-hidden="true">এটা খেলো</span>}
            </button>
          </li>;
        })}
      </ol>
    </section>)}
  </div>;
}
