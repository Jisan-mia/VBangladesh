import { FRACTIONS, bn } from "../lib/game";
import type { Layer } from "../lib/shapes";

/** Draws a picture from the shared path layers (the card paints the same layers on canvas). */
export function Pic({ layers, className }: { layers: Layer[]; className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
    {layers.map((layer, index) => <path key={index} d={layer.d} fill={layer.fill ?? "none"} stroke={layer.stroke} strokeWidth={layer.w} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>;
}

/** ১/২ written the school way, one over the other. */
export function Frac({ parts }: { parts: number }) {
  return <span className="sb-frac" role="img" aria-label={FRACTIONS[parts].word}><b>{bn(1)}</b><b>{bn(parts)}</b></span>;
}

export function Ghost() {
  return <svg className="sb-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
