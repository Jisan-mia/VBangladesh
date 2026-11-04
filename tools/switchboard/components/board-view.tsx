"use client";
// The wooden board: bulbs with their round switches, line switches in the gutters with their strings of fairy lights, and the
// tape. Pure view: the game passes what to show and gets presses back on pointerdown (under 50 ms), or on a keyboard click.
import type { CSSProperties, HTMLAttributes, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { isLit, isTaped, lineOf, switchCount, cellsOf, type Board } from "../lib/board";
import { BULB, TAPE_PATH, TAPE_STREAKS } from "../lib/art";
import { bn } from "../lib/link";
import type { Hint } from "../lib/play";

export type BoardProps = {
  board: Board;
  lit: number;
  /** Presses so far: each switch's lever sits by its own press count, and the last one clacks. */
  moves: readonly number[];
  cursor?: number;
  hint?: Hint | null;
  /** A first lesson's switch, pulsing until the first press. */
  guide?: number;
  /** The taped switch you just tried, and a counter so its wiggle replays. */
  wiggle?: { id: number; key: number };
  won?: boolean;
  /** The start card's preview: no input, unpowered look. */
  preview?: boolean;
  onPress?: (id: number) => void;
};

/** Where a switch sits in the board's grid (1-based CSS lines), with the gutters for line switches. */
export function gridSpot(board: Board, id: number) {
  const rows = board.lines.some(line => line.kind === "row"), cols = board.lines.some(line => line.kind === "col");
  const x0 = rows ? 2 : 1, y0 = cols ? 2 : 1;
  if (id < cellsOf(board)) return { row: y0 + Math.floor(id / board.size), col: x0 + (id % board.size) };
  const line = lineOf(board, id);
  return line.kind === "row" ? { row: y0 + line.at, col: 1 } : { row: 1, col: x0 + line.at };
}

const ms = (value: number) => `${Math.round(value)}ms`;

export function BoardView({ board, lit, moves, cursor = -1, hint = null, guide = -1, wiggle, won = false, preview = false, onPress }: BoardProps) {
  const { size } = board, cells = cellsOf(board), total = switchCount(board);
  const rows = board.lines.some(line => line.kind === "row"), cols = board.lines.some(line => line.kind === "col");
  const last = moves.length ? moves[moves.length - 1] : -1;
  const presses = new Array<number>(total).fill(0);
  for (const id of moves) presses[id]++;
  // The bloom runs out from the switch: its own bulb first, the neighbours a beat later; a line runs bulb by bulb.
  const delayOf = (index: number) => {
    if (preview) return 0;
    if (last < 0) return rippleOf(index) / 2; // the power coming on: from the middle outwards
    if (last < cells) return index === last ? 0 : 45;
    const line = lineOf(board, last);
    return (line.kind === "row" ? index % size : Math.floor(index / size)) * 38;
  };
  const origin: number = last < 0 ? Math.floor(cells / 2) : last < cells ? last : lineOf(board, last).kind === "row" ? lineOf(board, last).at * size : lineOf(board, last).at;
  const rippleOf = (index: number) => (Math.abs(Math.floor(index / size) - Math.floor(origin / size)) + Math.abs((index % size) - (origin % size))) * 60;

  const down = (id: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button > 0) return;
    onPress?.(id);
  };
  const style: CSSProperties = {
    gridTemplateColumns: `${rows ? "minmax(0,.62fr) " : ""}repeat(${size}, minmax(0,1fr))`,
    gridTemplateRows: `${cols ? "auto " : ""}repeat(${size}, auto)`,
  };
  // A switch: a real button on the board, a plain span in the start card's preview (that sits inside the start button).
  // A plain function, not a component: a component made inside render would remount every switch on each render and kill the bloom.
  const sw = (id: number, props: HTMLAttributes<HTMLElement> & Record<string, unknown>, children: ReactNode) => preview
    ? <span key={id} {...props}>{children}</span>
    : <button key={id} type="button" {...props} onPointerDown={down(id)} onClick={(event: ReactMouseEvent) => { if (event.detail === 0) onPress?.(id); }}>{children}</button>;

  return (
    <div className="sb-board" data-size={size} data-won={won || undefined} data-preview={preview || undefined} data-rows={rows || undefined} data-cols={cols || undefined}
      role={preview ? undefined : "group"} aria-hidden={preview || undefined}
      aria-label={preview ? undefined : `কাঠের সুইচবোর্ড, ${bn(size)}×${bn(size)}। সব বাতি জ্বালাও।`} style={style}>
      {board.lines.map((line, k) => {
        const at = gridSpot(board, cells + k);
        return <span key={`w${k}`} className="sb-wire" data-kind={line.kind} aria-hidden="true"
          style={line.kind === "row" ? { gridRow: at.row, gridColumn: `${at.col} / -1` } : { gridColumn: at.col, gridRow: `${at.row} / -1` }} />;
      })}
      {Array.from({ length: total }, (_, id) => {
        const at = gridSpot(board, id), spot = { gridRow: at.row, gridColumn: at.col };
        const clack = id === last && !preview ? (moves.length % 2 ? "a" : "b") : undefined;
        const hinted = hint?.id === id || (guide === id && !hint) || undefined;
        if (id >= cells) {
          const line = lineOf(board, id), word = line.kind === "row" ? `সারি ${bn(line.at + 1)}` : `কলাম ${bn(line.at + 1)}`;
          return (
            sw(id, { className: "sb-line", "data-kind": line.kind, "data-on": presses[id] % 2 === 1 || undefined,
              "data-clack": clack, "data-hint": hinted, "data-cursor": cursor === id || undefined, style: spot,
              "aria-label": preview ? undefined : `${word}-এর লম্বা সুইচ, পুরো লাইন উল্টায়${hinted ? ", এটা চাপো" : ""}` },
              <span className="sb-rocker" aria-hidden="true"><i /></span>)
          );
        }
        const on = !preview && isLit(lit, id), taped = isTaped(board, id);
        const will = hint ? (hint.on & (1 << id) ? "on" : hint.off & (1 << id) ? "off" : undefined) : undefined;
        const cellStyle = { ...spot, "--d": ms(delayOf(id)), "--w": ms(rippleOf(id)) } as CSSProperties;
        return (
          sw(id, { className: "sb-cell", "data-lit": on, "data-taped": taped || undefined, "data-on": presses[id] % 2 === 1 || undefined,
            "data-clack": clack, "data-hint": hinted, "data-will": will, "data-only": hint?.only === id || undefined, "data-cursor": cursor === id || undefined,
            "data-wiggle": wiggle && wiggle.id === id ? (wiggle.key % 2 ? "a" : "b") : undefined, style: cellStyle,
            "aria-label": preview ? undefined : `সুইচ ${bn(Math.floor(id / size) + 1)}-${bn(id % size + 1)}, বাতি ${on ? "জ্বলছে" : "নিভে আছে"}${taped ? ", কসটেপ মারা, চাপা যায় না" : ""}${hinted ? ", এটা চাপো" : ""}` }, <>
            <span className="sb-bulb" aria-hidden="true">
              <span className="sb-glow" />
              <svg viewBox="0 0 40 48">
                <g className="sb-rays"><path d={BULB.rays} /></g>
                <path className="sb-glass" d={BULB.glass} />
                <path className="sb-filament" d={BULB.filament} />
                <path className="sb-base" d={BULB.base} />
              </svg>
            </span>
            <span className="sb-switch" aria-hidden="true">
              <span className="sb-lever" />
              {taped && <svg className="sb-tape" viewBox="0 0 40 40"><path d={TAPE_PATH} /><path className="sb-tape-streak" d={TAPE_STREAKS} /></svg>}
            </span>
          </>)
        );
      })}
    </div>
  );
}
