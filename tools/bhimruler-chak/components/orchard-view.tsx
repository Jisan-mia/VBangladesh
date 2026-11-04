"use client";
// The orchard grid: one button per bush, drawn in CSS (product.css) in its world's palette. Cells are memoised, so a tap
// re-renders only the bushes it changed. Pointer events are handled once on the grid and passed up with the bush index.
import { memo, type CSSProperties, type PointerEvent } from "react";
import { MANGO, POST, type Orchard } from "../lib/orchard";
import { COVERED, OPEN, STUNG, TIED, type Status } from "../lib/play";
import { bn } from "../lib/challenge";

type Look = "covered" | "open" | "tied" | "stung" | "nest" | "boom" | "wrong";

export type Marks = {
  /** Gold rings: the lesson's bushes, the hint's bush, the hint's numbers (`clue`) and the nests it relied on. */
  teach?: ReadonlySet<number>;
  hint?: number;
  clues?: ReadonlySet<number>;
};

export type GridHandlers = {
  onDown?: (cell: number, event: PointerEvent<HTMLDivElement>) => void;
  onMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onUp?: (event: PointerEvent<HTMLDivElement>) => void;
  onKeyCell?: (cell: number) => void;
};

const cellOf = (target: EventTarget | null) => Number((target as HTMLElement | null)?.closest?.("[data-index]")?.getAttribute("data-index") ?? -1);

const Bush = memo(function Bush({ index, look, n, kind, v, delay, teach, hint, clue, held, focus, label }: {
  index: number; look: Look; n: number; kind: number; v: number; delay: number;
  teach: boolean; hint: boolean; clue: boolean; held: boolean; focus: boolean; label: string;
}) {
  const shown = look === "open";
  return (
    <button type="button" className="bc-cell" data-index={index} data-state={look} data-v={v}
      data-kind={shown ? (kind === MANGO ? "mango" : kind === POST ? "post" : undefined) : undefined}
      data-n={shown && kind !== MANGO && n ? n : undefined}
      data-teach={teach || undefined} data-hint={hint || undefined} data-clue={clue || undefined} data-held={held || undefined}
      style={shown && delay ? { "--d": `${delay}ms` } as CSSProperties : undefined}
      tabIndex={focus ? 0 : -1} aria-label={label}>
      {shown && kind !== MANGO && n ? bn(n) : null}
    </button>
  );
});

export function OrchardView({ orchard, cells, status, delays, marks, hold = -1, cursor = -1, hit = -1, preview = false, handlers }: {
  orchard: Orchard; cells: Uint8Array; status: Status; delays?: Int16Array; marks?: Marks;
  hold?: number; cursor?: number; hit?: number; preview?: boolean; handlers?: GridHandlers;
}) {
  const { cols, rows } = orchard, over = status === "lost" || status === "won";
  const style = { "--cols": cols, "--rows": rows } as CSSProperties;
  const lookOf = (cell: number): Look => {
    const state = cells[cell];
    if (status === "lost") {
      if (cell === hit) return "boom";
      if (state === TIED && !orchard.nest[cell]) return "wrong";
      if (state === COVERED && orchard.nest[cell]) return "nest";
    }
    return state === OPEN ? "open" : state === TIED ? "tied" : state === STUNG ? "stung" : "covered";
  };
  const labelOf = (cell: number, look: Look) => {
    const where = `সারি ${bn(Math.floor(cell / cols) + 1)}, কলাম ${bn(cell % cols + 1)}`;
    if (look === "open") {
      const kind = orchard.kind[cell], n = orchard.count[cell];
      if (kind === MANGO) return `${where}: ঝরা আম, সংখ্যা ঢাকা`;
      return `${where}: ${kind === POST ? "খুঁটি, চার পাশে" : "সাফ, পাশে"} ${n ? `${bn(n)}টা চাক` : "চাক নেই"}`;
    }
    if (look === "tied") return `${where}: গামছা বাঁধা`;
    if (look === "stung") return `${where}: জেগে ওঠা চাক`;
    if (look === "boom") return `${where}: এখানেই চাক ছিল`;
    if (look === "nest") return `${where}: চাক`;
    if (look === "wrong") return `${where}: ভুল গামছা, চাক ছিল না`;
    return `${where}: ঝোপ`;
  };
  if (preview) {
    return (
      <span className="bc-grid" data-preview style={style} aria-hidden="true">
        {Array.from(cells, (_, cell) => <i key={cell} className="bc-cell" data-state="covered" data-v={(Math.floor(cell / cols) * 2 + (cell % cols) * 3) % 3} />)}
      </span>
    );
  }
  return (
    <div className="bc-grid" role="group" aria-label={`${bn(cols)}×${bn(rows)} বাগান, ${bn(orchard.nests)}টা চাক লুকানো`} style={style} data-over={over || undefined}
      onPointerDown={event => { const cell = cellOf(event.target); if (cell >= 0) handlers?.onDown?.(cell, event); }}
      onPointerMove={handlers?.onMove} onPointerUp={handlers?.onUp} onPointerCancel={handlers?.onUp}
      // A mouse's right click ties on pointerdown, and a touch's long press ties itself: the browser's menu never opens.
      onContextMenu={event => event.preventDefault()}
      onClick={event => { if (event.detail === 0) { const cell = cellOf(event.target); if (cell >= 0) handlers?.onKeyCell?.(cell); } }}>
      {Array.from(cells, (_, cell) => {
        const look = lookOf(cell);
        return (
          <Bush key={cell} index={cell} look={look} n={orchard.count[cell]} kind={orchard.kind[cell]} v={(Math.floor(cell / cols) * 2 + (cell % cols) * 3) % 3}
            delay={delays?.[cell] ?? 0} teach={marks?.teach?.has(cell) ?? false} hint={marks?.hint === cell} clue={marks?.clues?.has(cell) ?? false}
            held={hold === cell} focus={cursor === cell || (cursor < 0 && cell === orchard.start)} label={labelOf(cell, look)} />
        );
      })}
    </div>
  );
}
