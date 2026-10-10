import type { CSSProperties } from "react";
import { wheelDigits } from "../lib/meter";

const DIGITS = "০১২৩৪৫৬৭৮৯";

/** The old disc meter: black bakelite, a round window, rolling number wheels, and the disc's red mark crossing its slot. */
export function MeterFace({ units, watts }: { units: number; watts: number }) {
  // A real meter's disc turns faster the more is switched on; this keeps the mark readable from a slow crawl to a blur.
  const spin = watts > 0 ? Math.min(8, Math.max(0.7, 2400 / watts)) : 0;
  return (
    <div className="bb-meter" aria-hidden="true">
      <div className="bb-window">
        <span className="bb-window-label">এ মাসে প্রায়</span>
        <span className="bb-wheels">
          {[...wheelDigits(units)].map((digit, index) => (
            <span className="bb-wheel" key={index}><span style={{ transform: `translateY(-${Number(digit) * 10}%)` }}>{[...DIGITS].map(d => <b key={d}>{d}</b>)}</span></span>
          ))}
        </span>
        <span className="bb-window-unit">ইউনিট</span>
        <span className="bb-slot" data-still={spin === 0 || undefined}><i style={{ "--spin": `${spin}s` } as CSSProperties} /></span>
        <span className="bb-spec">১ ফেজ · ২২০ ভোল্ট</span>
      </div>
      <span className="bb-seal" />
    </div>
  );
}
