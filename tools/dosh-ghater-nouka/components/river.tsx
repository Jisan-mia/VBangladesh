"use client";
// The river: the far hills, two water lanes with the boats, and the bank of numbered ghats you tap. One wide strip that
// slides under a window; the camera follows the boat in hand. Going back, the strip is the same and the boats sail left.
import type { CSSProperties, MutableRefObject, RefObject } from "react";
import { BOAT, BOATS } from "../lib/art";
import { bn, ghatAt, progressOf, WORDS, type Level } from "../lib/levels";
import type { Race } from "../lib/sim";
import { expected, hintOf } from "../lib/sim";
import { Ghost, press } from "./spinner";

export type Pop = { ghat: number; who: 0 | 1; key: number };

function Boat({ player, left, flip, slow, lane, G, name }: { player: 0 | 1; left: number; flip: boolean; slow: boolean; lane: "near" | "far"; G: number; name: string }) {
  const colors = BOATS[player], width = lane === "near" ? Math.min(92, G - 8) : Math.min(68, G - 34);
  return <span className={`dg-boat dg-boat-${lane}`} style={{ width, transform: `translateX(${left - width / 2}px)`, transition: slow ? "none" : undefined, "--flip": flip ? -1 : 1 } as CSSProperties}>
    <svg viewBox="0 0 100 60" role="img" aria-label={name}>
      <path d={BOAT.roof} fill={colors.roof} /><path d={BOAT.hull} fill={colors.hull} />
      <path d={BOAT.pole} stroke="#5b4636" strokeWidth="2.5" /><path d={BOAT.flag} fill={colors.flag} />
    </svg>
  </span>;
}

export function River({ race, level, view, G, cam, slow, pops, ghostK, rivalName, ghats, onGhat, far, sky }: {
  race: Race; level: Level; view: number; G: number; cam: number; slow: boolean; pops: [Pop | null, Pop | null]; ghostK: number; rivalName: string;
  ghats: MutableRefObject<(HTMLButtonElement | null)[]>; onGhat: (k: number, element: HTMLElement) => void; far: string; sky: RefObject<HTMLCanvasElement | null>;
}) {
  const n = race.n, total = (n + 2) * G, want = expected(race), help = hintOf(race);
  const x = (k: number) => (ghatAt(level, k) + 0.5) * G;
  const meX = x(race.pos[0]), otherX = x(race.pos[1]);
  const flip = level.dir < 0;
  const hasOther = level.rival;
  // An edge signal for the other boat when it has sailed out of view.
  const side = hasOther ? (otherX < cam + 14 ? "left" : otherX > cam + view - 14 ? "right" : null) : null;
  return <div className="dg-river" style={{ "--g": `${G}px` } as CSSProperties}>
    <canvas ref={sky} className="dg-sky" aria-hidden="true" />
    <div className="dg-far" style={{ backgroundImage: `url(${far})`, width: view + Math.max(0, total - view) * 0.35, transform: `translateX(${-cam * 0.35}px)`, transition: slow ? "none" : undefined }} aria-hidden="true" />
    <div className="dg-view" style={{ width: view }}>
      <div className="dg-track" style={{ width: total, transform: `translateX(${-cam}px)`, transition: slow ? "none" : undefined }}>
        <div className="dg-water" style={{ width: total }}>
          <span className="dg-jetty" style={{ left: x(0) }} aria-hidden="true" />
          <span className={`dg-goal${level.finale ? " finale" : ""}`} style={{ left: x(n) }} aria-hidden="true"><i /><b /></span>
          {hasOther && <Boat player={1} left={otherX} flip={flip} slow={slow} lane="far" G={G} name={rivalName} />}
          <Boat player={0} left={meX} flip={flip} slow={slow} lane="near" G={G} name="তোমার নৌকা" />
          {pops[0] && <span key={pops[0].key} className="dg-pop" style={{ left: x(progressOf(level, pops[0].ghat)) }} aria-hidden="true">{bn(pops[0].ghat)}<small>{WORDS[pops[0].ghat]}</small></span>}
          {pops[1] && <span key={pops[1].key} className="dg-pop dg-pop-1" style={{ left: x(progressOf(level, pops[1].ghat)) }} aria-hidden="true">{bn(pops[1].ghat)}</span>}
        </div>
        <div className="dg-bank" style={{ gridTemplateColumns: `repeat(${n + 2}, ${G}px)` }}>
          <span className="dg-shore" aria-hidden="true" />
          {Array.from({ length: n }, (_, index) => {
            const ghat = index + 1, k = progressOf(level, ghat);
            const target = k === want;
            const cls = ["dg-ghat", k <= race.pos[0] ? "is-past" : "", k === race.pos[0] ? "is-here" : "", k === n ? "is-goal" : "", target && help === 2 ? "is-next" : "", target && help === 1 ? "is-hint" : ""].filter(Boolean).join(" ");
            return <button type="button" key={ghat} ref={node => { ghats.current[k] = node; }} className={cls} data-k={k} aria-label={`${bn(ghat)} নম্বর ঘাট, ${WORDS[ghat]}`} {...press(element => onGhat(k, element))}>
              <span className="dg-tile"><b>{bn(ghat)}</b><small>{WORDS[ghat]}</small></span>
              {ghostK === k && <Ghost />}
            </button>;
          })}
          <span className="dg-shore" aria-hidden="true" />
        </div>
      </div>
      {side && <span className={`dg-edge dg-edge-${side}`} aria-hidden="true"><svg viewBox="0 0 100 60"><path d={BOAT.roof} fill={BOATS[1].roof} /><path d={BOAT.hull} fill={BOATS[1].hull} /></svg><i /></span>}
    </div>
  </div>;
}
