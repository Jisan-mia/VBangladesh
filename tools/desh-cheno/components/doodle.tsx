import { doodles, starPath, type DoodleKey } from "../lib/doodles";

export function Doodle({ name, className }: { name: DoodleKey; className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    {doodles[name].map((part, index) => <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.line ?? "none"} strokeWidth={part.width ?? 2.5} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>;
}

/** A star sticker: gold when earned, a dashed outline when missed, faint while still to come. */
export function Star({ state }: { state: "right" | "wrong" | "now" | "" }) {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d={starPath(50, 54, 44)} data-state={state} /></svg>;
}
