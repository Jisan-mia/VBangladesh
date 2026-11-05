// The bells in a rack, drawn as SVG (one set of paths shared with the card canvas). A bell is a button as tall as its
// cell, so a tap anywhere under the beam rings it. Lighting and swinging are done straight on the elements by the game
// (data-lit, the swing animation), so a tap shows within the same frame without waiting for React.
import type { CSSProperties, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";
import { BELL, BELL_COLORS, BELL_SCALE } from "../lib/art";
import { bn } from "../lib/links";

export function BellArt({ index, label }: { index: number; label?: string }) {
  return (
    <svg className="gs-bellsvg" viewBox="0 0 100 130" preserveAspectRatio="xMidYMin meet" aria-hidden="true" style={{ "--c": BELL_COLORS[index] } as CSSProperties}>
      <path className="gs-rope" d={BELL.rope} />
      <circle className="gs-hook" cx="50" cy="16" r="4.5" />
      <path className="gs-clapper" d={BELL.clapper} />
      <circle className="gs-knob" cx="50" cy="123" r="6" />
      <path className="gs-body" d={BELL.body} />
      <path className="gs-lip" d={BELL.band} />
      <path className="gs-shine" d={BELL.shine} />
      <g className="gs-badge"><circle cx="50" cy="70" r="13" /><text x="50" y="71">{label ?? bn(index + 1)}</text></g>
    </svg>
  );
}

export function Rack({ count, answer, wrong, setBell, onDown, onClick }: {
  count: number; answer: number; wrong: number;
  setBell: (index: number, element: HTMLButtonElement | null) => void;
  onDown: (index: number) => (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onClick: (index: number) => (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="gs-bells" data-count={count} role="group" aria-label={`${bn(count)}টা ঘণ্টা, ১ থেকে ${bn(count)}। ঘণ্টা যে ক্রমে বাজে, সেই ক্রমে চাপো।`}>
      {Array.from({ length: count }, (_, index) => (
        <button key={index} type="button" className="gs-bell" ref={element => setBell(index, element)}
          style={{ "--c": BELL_COLORS[index], "--s": BELL_SCALE[index], "--i": index } as CSSProperties}
          data-answer={answer === index || undefined} data-wrong={wrong === index || undefined}
          aria-label={`ঘণ্টা ${bn(index + 1)}`} onPointerDown={onDown(index)} onClick={onClick(index)}>
          <BellArt index={index} />
          <i className="gs-halo" aria-hidden="true" />
          <em className="gs-grade" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
