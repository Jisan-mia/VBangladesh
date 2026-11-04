"use client";
// The start card: a booklet page over the stage. The biggest thing on it is the ink stamp that starts the clock; the
// grid stays hidden until then, so nothing is found while the clock reads zero.
import type { CSSProperties, RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { DIRS, type Dir, type Level } from "../lib/grid";
import { STAGES, WORLDS, finaleName, stageAt, worldOf } from "../lib/levels";
import { bn, clock, feat, levelName, pageLabel, bannerNote, type Shared } from "../lib/link";
import { PACKS, type PackId } from "../lib/packs";
import { PALETTES } from "../lib/art";
import { Motif } from "./motif";

/** What each free-play difficulty means, in the player's words. */
export const FREE_LINES: Readonly<Record<Level, string>> = {
  0: "পাশাপাশি, ওপর-নিচে আর কোনাকুনি, সব সোজা দিকে।",
  1: "আট দিকেই লুকায়, উল্টো দিকেও।",
};
const ORDER: readonly Dir[] = ["R", "DR", "D", "DL", "L", "UL", "U", "UR"];

/** The directions this page hides words in, as a little compass; the one this level adds is marked. */
function Compass({ dirs, fresh }: { dirs: readonly Dir[]; fresh: readonly Dir[] }) {
  return (
    <svg className="sk-compass" viewBox="-12 -12 24 24" aria-hidden="true">
      <circle r="2" className="hub" />
      {ORDER.map(dir => {
        const [dr, dc] = DIRS[dir], len = dr && dc ? 7 : 9;
        const on = dirs.includes(dir), add = fresh.includes(dir);
        return (
          <g key={dir} className={add ? "new" : on ? "on" : "off"} transform={`rotate(${Math.atan2(dr, dc) * 180 / Math.PI})`}>
            <path d={`M3 0H${len}`} />
            {on && <path d={`M${len - 2.6} -2.2L${len} 0L${len - 2.6} 2.2`} />}
          </g>
        );
      })}
    </svg>
  );
}

/** The start card's art: this page's empty frame (no letters, so nothing is solved before the clock runs) and a pen. */
function PageArt({ size, pack }: { size: number; pack: PackId }) {
  const step = 100 / size, lines = [];
  for (let i = 1; i < size; i++) lines.push(<path key={i} d={`M0 ${i * step}H100M${i * step} 0V100`} />);
  return (
    <svg className="sk-art" viewBox="-4 -4 108 108" aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" rx="2" className="sheet" />
      <g className="rules">{lines}</g>
      <rect x={step * 0.12} y={step * 1.18} width={step * 2.76} height={step * 0.64} rx={step * 0.32} className="stroke" />
      <g transform="translate(70 66) scale(1.25)"><Motif pack={pack} className="watermark" /></g>
      <g className="pen" transform="translate(58 58) rotate(-35)"><rect x="0" y="-3" width="40" height="6" rx="2" /><path d="M0 -3 L-7 0 L0 3z" /></g>
    </svg>
  );
}

export type StartProps = {
  mode: "page" | "free";
  page: number;
  free: { pack: PackId; level: Level };
  stars: number;
  open: number;
  visit: number;
  friend: Shared | null;
  friendHere: boolean;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onStart: () => void;
  onLevel: (page: number) => void;
  onMode: (mode: "page" | "free") => void;
  onFree: (pack: PackId, level: Level) => void;
  onSheet: () => void;
};

export function StartCard(props: StartProps) {
  const { mode, page, free, friend, friendHere } = props;
  const at = mode === "page" ? stageAt(page) : null;
  const pack = at ? at.pack : free.pack;
  const palette = PALETTES[pack], world = at ? WORLDS[worldOf(page)] : null;
  const finale = at ? finaleName(page) : "";
  const before = at && page > 1 ? STAGES[page - 2].dirs : at?.dirs ?? [];
  const dirs = at ? at.dirs : free.level ? (["R", "D", "DR", "UR", "L", "U", "UL", "DL"] as const) : (["R", "D", "DR"] as const);
  const fresh = at ? at.dirs.filter(dir => !before.includes(dir)) : [];
  const next = page + 1, nextOpen = at && next <= STAGES.length && (next <= props.open || next === props.visit);
  const size = at ? at.size : 7, words = at ? at.words : 6;

  return (
    <section className="sk-start" aria-labelledby="sk-start-title" data-finale={finale ? "" : undefined}
      style={{ "--world": palette.ink, "--world-deep": palette.deep, "--paper": palette.paper, "--sheet": palette.sheet, "--edge": palette.edge, "--motif": palette.motif } as CSSProperties}>
      <header className="sk-mast">
        <p>একটুখানি <span aria-hidden="true">·</span> শব্দ খোঁজার বই</p>
        <nav className="sk-tabs" aria-label="কীভাবে খেলবে">
          <button type="button" aria-pressed={mode === "page"} onClick={() => props.onMode("page")}>লেভেল</button>
          <button type="button" aria-pressed={mode === "free"} onClick={() => props.onMode("free")}>নিজের মতো</button>
        </nav>
      </header>

      {friend && friendHere && (
        <div className="sk-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}।</b> {bannerNote(friend)}</p>
        </div>
      )}

      {at && world ? (
        <>
          <div className="sk-pick">
            <button type="button" className="sk-step" onClick={() => props.onLevel(page - 1)} disabled={page <= 1} aria-label="আগের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="sk-pick-name">
              {finale && <p className="sk-badge-finale">শেষ পাতা</p>}
              <h2 id="sk-start-title"><Motif pack={pack} />{pageLabel(page)}</h2>
              <p>{finale ? `লেভেল ${bn(page)} · ` : ""}{world.page} · {bn(size)}×{bn(size)} · {bn(words)}টা শব্দ</p>
            </div>
            <button type="button" className="sk-step" onClick={() => props.onLevel(next)} disabled={!nextOpen} aria-label="পরের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <p className="sk-lesson"><b>{finale ? "শেষ পাতা" : "নতুন"}</b> {at.lesson}</p>
        </>
      ) : (
        <>
          <div className="sk-pick sk-pick-free">
            <div className="sk-pick-name">
              <h2 id="sk-start-title"><Motif pack={pack} />নিজের মতো</h2>
              <p>৭×৭ পাতা · ছয়টা শব্দ · তারা নেই, শুধু সেরা সময়</p>
            </div>
          </div>
          <div className="sk-chips" role="radiogroup" aria-label="কোন প্যাক">
            {PACKS.map(choice => (
              <button key={choice.id} type="button" role="radio" aria-checked={free.pack === choice.id}
                style={{ "--chip": PALETTES[choice.id].paper } as CSSProperties} onClick={() => props.onFree(choice.id, free.level)}>{choice.name}</button>
            ))}
          </div>
          <div className="sk-kinds" role="radiogroup" aria-label="কতটা কঠিন">
            {([0, 1] as const).map(level => (
              <button key={level} type="button" role="radio" aria-checked={free.level === level} onClick={() => props.onFree(free.pack, level)}>
                <small aria-hidden="true">{bn(level + 1)}</small><b>{levelName(level)}</b><span>{FREE_LINES[level]}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sk-art-row">
        <PageArt size={size} pack={pack} />
        <div className="sk-art-side">
          <Compass dirs={dirs} fresh={fresh} />
          <p>{fresh.length ? "নতুন দিক" : "যে দিকে লুকায়"}</p>
        </div>
      </div>

      {at && (
        <p className="sk-par">
          <span className="sk-par-stars" aria-hidden="true">★★★</span> {clock(at.three)}-এর মধ্যে
          {props.stars > 0 && <span className="sk-got"> · তোমার {bn(props.stars)} তারা</span>}
        </p>
      )}

      <button type="button" className="sk-go" onClick={props.onStart} data-first>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z" /><path d="M14 6l4 4" /></svg>
        <span>খোঁজা শুরু<small>{friendHere ? "বন্ধুর গ্রিড, একই অক্ষর" : at ? `${bn(words)}টা ${PACKS.find(p => p.id === pack)?.name ?? ""}` : `${PACKS.find(p => p.id === pack)?.name ?? ""}, ${levelName(free.level)}`}</small></span>
      </button>
      <p className="sk-start-foot">
        {mode === "page" && <button type="button" className="kit-link" onClick={props.onSheet}>সব লেভেল</button>}
      </p>
    </section>
  );
}
