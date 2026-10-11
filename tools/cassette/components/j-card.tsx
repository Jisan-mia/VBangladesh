import type { CSSProperties } from "react";
import { SIDE, bn, credit, inlays, seasonLabel, shownTitle, slotLabel, songs, type Tape } from "../lib/cassette";

/** A small cassette with a pencil pushed into the left hub. `spin` replays the rewind whenever a new song lands. */
export function CassetteArt({ spin = 0 }: { spin?: number }) {
  return (
    <svg className="cs-art" viewBox="0 0 150 82" aria-hidden="true">
      <rect x="36" y="6" width="110" height="70" rx="7" fill="#1d1c20" />
      <rect x="42" y="11" width="98" height="44" rx="3" fill="var(--paper)" />
      <rect x="45" y="14" width="92" height="15" fill="#ffffff8c" />
      <text x="48" y="27" fill="#1d1c20" fontSize="13" fontWeight="800" fontFamily="var(--font-display)">A</text>
      <rect x="58" y="34" width="66" height="18" rx="5" fill="#3b322d" />
      <circle cx="70" cy="43" r="10" fill="#5a3522" />
      <circle cx="112" cy="43" r="6.5" fill="#5a3522" />
      <path d="M57 76l5-11h58l5 11" fill="#29282d" />
      <g key={`r${spin}`} className="cs-reels">
        <circle className="cs-reel" cx="70" cy="43" r="4.6" fill="#f4f1ea" stroke="#2a2520" strokeWidth="2.6" strokeDasharray="2.2 1.4" />
        <circle className="cs-reel" cx="112" cy="43" r="4.6" fill="#f4f1ea" stroke="#2a2520" strokeWidth="2.6" strokeDasharray="2.2 1.4" />
      </g>
      <g key={`p${spin}`} className="cs-pencil">
        <path d="M70 43L22 26.5" stroke="#b8261f" strokeWidth="6.5" />
        <path d="M70 43L22 26.5" stroke="#1a1a1a" strokeWidth="2.2" />
        <path d="M22.9 23.4l-12.4 -1 7.9 9.6z" fill="#e7c793" />
        <path d="M13.6 22.6l-4.4 -.4 2.8 3.4z" fill="#2b2b2b" />
      </g>
    </svg>
  );
}

type Props = {
  tape: Tape;
  /** Opens the picker for a slot; leave out for a read-only J-card (a friend's tape). */
  onPick?: (slot: number) => void;
  /** Songs to mark "দুজনেরই". */
  common?: readonly number[];
  spin?: number;
};

export function JCard({ tape, onPick, common, spin }: Props) {
  const inlay = inlays.find(item => item.id === tape.color) ?? inlays[0];
  const season = seasonLabel(tape.when);
  return (
    <div className="cs-jcard" style={{ "--paper": inlay.paper, "--rule": inlay.rule } as CSSProperties}>
      <div className="cs-spine">
        <CassetteArt spin={spin} />
        <p className="cs-name"><b>{shownTitle(tape)}</b>{season && <small>{season}</small>}</p>
      </div>
      {[0, 1].map(side => (
        <div className="cs-side" key={side}>
          <p className="cs-side-head">সাইড <span>{side ? "B" : "A"}</span></p>
          <ol>
            {tape.slots.slice(side * SIDE, side * SIDE + SIDE).map((song, index) => {
              const slot = side * SIDE + index;
              const item = songs[song];
              const body = <>
                <span className="cs-num" aria-hidden="true">{bn(index + 1)}.</span>
                <span className="cs-track"><b>{item.title}</b><small>{credit(item)}</small></span>
                {common?.includes(song) && <em className="cs-both">দুজনেরই</em>}
              </>;
              return (
                <li key={`${slot}-${song}`} style={{ "--i": slot } as CSSProperties}>
                  {onPick
                    ? <button type="button" aria-haspopup="dialog" aria-label={`${slotLabel(slot)}: ${item.title}, ${credit(item)}। বদলাতে ট্যাপ করো`} onClick={() => onPick(slot)}>{body}</button>
                    : <div className="cs-row">{body}</div>}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
