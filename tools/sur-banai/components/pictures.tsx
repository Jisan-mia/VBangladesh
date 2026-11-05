// The game's pictures: icons and instruments drawn in code (lib/art.ts), the ghost finger, and a tune as a small picture.
import type { CSSProperties } from "react";
import { FINGER, ICONS, SOUND_ART, type IconId } from "../lib/art";
import { has, ROWS, ROW_COLORS, type Tune } from "../lib/music";

export const ROW_ORDER = Array.from({ length: ROWS }, (_, i) => ROWS - 1 - i);

export function Icon({ id, className = "" }: { id: IconId; className?: string }) {
  return <svg className={`sb-ic ${className}`} viewBox="0 0 48 48" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[id] }} />;
}

export function Instrument({ sound, className = "sb-inst" }: { sound: number; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SOUND_ART[sound] }} />;
}

export function Finger() {
  return <span className="sb-ghost-at" aria-hidden="true"><svg className="sb-ghost" viewBox="0 0 40 52" dangerouslySetInnerHTML={{ __html: FINGER }} /></span>;
}

/** A tune as a small picture: a kept tune on the shelf, and the picture on the end screens. `head` lights one column. */
export function MiniTune({ tune, className = "sb-mini", head = -1, pop = false }: { tune: Tune; className?: string; head?: number; pop?: boolean }) {
  return <svg className={className} viewBox={`0 0 ${tune.length * 10} ${ROWS * 10}`} aria-hidden="true" data-pop={pop || undefined}>
    {ROW_ORDER.map((row, y) => tune.map((_, step) => {
      const on = has(tune, step, row);
      return <rect key={`${row}-${step}`} className={on ? (head === step ? "on lit" : "on") : "off"} style={{ "--s": step } as CSSProperties} x={step * 10 + 1} y={y * 10 + 1} width="8" height="8" rx="1.5" fill={on ? ROW_COLORS[row] : undefined} />;
    }))}
  </svg>;
}
