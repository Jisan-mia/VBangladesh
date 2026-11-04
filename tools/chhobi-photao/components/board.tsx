"use client";
// The board: the clue gutters, the cells, and the finger. It owns the drag (one stroke along a row or column) and the
// keyboard cursor; every change goes to `onStitch`, which answers with what happened. Pointer events are taken on
// pointerdown, so a stitch shows in the same frame. A stroke ends at pointerup, cancel, lost capture, blur, and a mouse
// move with no button held; it also ends the moment a stitch is refused (the thread snaps).
import { memo, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { lineStates, markFor, puzzleOf, type Mark, type Mode } from "../lib/game";
import type { Tools } from "../lib/levels";
import { bn } from "../lib/link";
import { rippleMs } from "../lib/anim.hot";
import { strokeOrder, type Play, type Stitched } from "../lib/play";

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
const MARK_WORD = ["ফাঁকা", "ভরাট", "খালি দাগ"] as const;

type Stroke = { id: number; start: number; from: Mark; to: Mark; axis: "row" | "col" | null; snapshot: Mark[]; count: number; last: number; dead: boolean };

export type BoardApi = { release: () => void };
export type Fit = { cell: number; font: number; clueW: number; clueH: number };

const Cell = memo(function Cell({ index, size, mark, given, tab, hinted, teach, refused, bloom, color, delay }: {
  index: number; size: number; mark: Mark; given: boolean; tab: boolean; hinted: boolean; teach: boolean; refused: number;
  bloom: boolean; color: string; delay: number;
}) {
  const row = Math.floor(index / size), col = index % size;
  return (
    <button type="button" tabIndex={tab ? 0 : -1} data-index={index} className="cp-cell" data-mark={mark} data-given={given || undefined} data-hint={hinted || undefined} data-teach={teach || undefined}
      data-edge={`${col % 5 === 4 && col < size - 1 ? "r" : ""}${row % 5 === 4 && row < size - 1 ? "b" : ""}` || undefined}
      style={bloom ? { "--c": color, "--d": `${delay}ms` } as CSSProperties : undefined}
      aria-label={`সারি ${bn(row + 1)}, কলাম ${bn(col + 1)}: ${given ? "নানির ফোঁড়" : MARK_WORD[mark]}`}>
      {refused > 0 && <i key={refused} className="cp-refused" aria-hidden="true" />}
    </button>
  );
});

export function Board({ play, fit, mode, tools, slow, solved, hintCell, refused, teaching, live, wake, onStitch, onLocked, api }: {
  play: Play; fit: Fit; mode: Mode; tools: Tools; slow: boolean; solved: boolean; hintCell: number;
  refused: { index: number; key: number } | null; teaching: boolean;
  live: () => boolean; wake: () => boolean;
  onStitch: (indices: readonly number[], to: Mark, record: boolean, soFar: number) => Stitched | null;
  onLocked: (index: number) => void;
  api: { current: BoardApi | null };
}) {
  const { level, cells, given } = play;
  const { size, rows, cols, picture } = puzzleOf(level);
  const [cursor, setCursor] = useState(-1);
  const [focus, setFocus] = useState(0);
  const [badge, setBadge] = useState<{ index: number; n: number } | null>(null);
  const [struck, setStruck] = useState<ReadonlySet<string>>(new Set());
  const stroke = useRef<Stroke | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(play);
  latest.current = play;

  const states = lineStates(play);
  const cursorRow = cursor >= 0 ? Math.floor(cursor / size) : -1, cursorCol = cursor >= 0 ? cursor % size : -1;

  function release() { stroke.current = null; setBadge(null); setCursor(-1); }
  useEffect(() => { api.current = { release }; return () => { api.current = null; }; });

  function cellAt(event: ReactPointerEvent) {
    const rect = box.current!.getBoundingClientRect();
    const col = Math.min(size - 1, Math.max(0, Math.floor((event.clientX - rect.left) / (rect.width / size))));
    const row = Math.min(size - 1, Math.max(0, Math.floor((event.clientY - rect.top) / (rect.height / size))));
    return row * size + col;
  }

  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!live()) { wake(); return; }
    if (solved || (event.button !== 0 && event.button !== 2) || (event.button === 2 && !tools.cross)) return;
    event.preventDefault();
    const index = cellAt(event), current = latest.current;
    setCursor(index); setFocus(index);
    if (current.given.includes(index)) { onLocked(index); return; }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or already gone: the stroke still works */ }
    const from = current.cells[index], to = markFor(from, event.button === 2 || mode === "cross" ? "cross" : "fill");
    const s: Stroke = { id: event.pointerId, start: index, from, to, axis: null, snapshot: current.cells, count: 0, last: index, dead: false };
    stroke.current = s;
    const result = onStitch([index], to, true, 0);
    if (!result) { stroke.current = null; return; }
    s.count += result.moved;
    if (result.refused >= 0) s.dead = true;
  }

  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const s = stroke.current;
    if (!s || event.pointerId !== s.id) return;
    if ((event.pointerType === "mouse" && event.buttons === 0) || !live()) { release(); return; }
    const index = cellAt(event);
    if (index === s.last) return;
    s.last = index;
    setCursor(index);
    if (s.dead) return;
    if (!s.axis) {
      const sameRow = Math.floor(index / size) === Math.floor(s.start / size);
      s.axis = sameRow ? "row" : index % size === s.start % size ? "col" : Math.abs(index % size - s.start % size) >= Math.abs(Math.floor(index / size) - Math.floor(s.start / size)) ? "row" : "col";
    }
    const reach = strokeOrder(size, s.start, index, s.axis).filter(cell => s.snapshot[cell] === s.from);
    const result = onStitch(reach, s.to, false, s.count);
    if (!result) return;
    s.count += result.moved;
    if (result.refused >= 0) s.dead = true;
    setBadge(s.count >= 2 ? { index, n: s.count } : null);
  }

  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (stroke.current?.id !== event.pointerId) return;
    stroke.current = null;
    setBadge(null);
    if (event.pointerType !== "mouse") setCursor(-1);
  }

  // Arrows walk the grid; Space or Enter fills, X marks ✕, Backspace wipes.
  function onKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    // The cell the key went to (the focus state can lag a frame behind a fresh focus()).
    const at = Number((event.target as HTMLElement).dataset?.index), here = Number.isInteger(at) ? at : focus;
    const step = ARROWS[event.key];
    if (step) {
      event.preventDefault();
      const row = Math.min(size - 1, Math.max(0, Math.floor(here / size) + step[0])), col = Math.min(size - 1, Math.max(0, here % size + step[1]));
      const next = row * size + col;
      setFocus(next); setCursor(next);
      box.current?.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus();
      return;
    }
    if (!live() || solved || event.repeat || given.includes(here)) return;
    const mark = cells[here];
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); onStitch([here], markFor(mark, "fill"), true, 0); }
    else if ((event.key === "x" || event.key === "X") && tools.cross) { event.preventDefault(); onStitch([here], markFor(mark, "cross"), true, 0); }
    else if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); onStitch([here], 0, true, 0); }
  }

  function strike(event: { target: EventTarget | null }) {
    const target = (event.target as Element).closest<HTMLElement>("[data-k]");
    if (!target || !tools.strike) return;
    const key = target.dataset.k!;
    setStruck(old => { const next = new Set(old); if (!next.delete(key)) next.add(key); return next; });
  }

  const gutter = (clue: number[], line: string) => (clue.length ? clue : [0]).map((run, index) => {
    const key = `${line}${index}`;
    return tools.strike
      ? <button key={index} type="button" className="cp-num" data-k={key} data-struck={struck.has(key) || undefined} tabIndex={-1} aria-pressed={struck.has(key)}>{bn(run)}</button>
      : <span key={index}>{bn(run)}</span>;
  });
  const spoken = (clue: number[]) => (clue.length ? clue.map(bn).join(" ") : "০");

  const style = { "--cell": `${fit.cell}px`, "--clue-w": `${fit.clueW}px`, "--clue-h": `${fit.clueH}px`, "--font": `${fit.font}px`, "--pic-bg": picture.bg } as CSSProperties;
  const badgeRow = badge ? Math.floor(badge.index / size) : 0;
  const badgeAt = badge && { left: (badge.index % size) * (fit.cell + 1) + fit.cell / 2, top: badgeRow === 0 ? (badgeRow + 1) * (fit.cell + 1) + 2 : badgeRow * (fit.cell + 1) - fit.cell * 0.5 };

  return (
    <div className="cp-board" style={style} data-solved={solved} data-slow={slow || undefined}>
      <div className="cp-corner" aria-hidden="true" />
      <div className="cp-colclues" style={{ gridTemplateColumns: `repeat(${size}, var(--cell))` }} onClick={strike}>
        {cols.map((clue, col) => (
          <div key={col} role="group" aria-label={`কলাম ${bn(col + 1)}: ${spoken(clue)}`} className="cp-clue" data-state={states.cols[col]} data-cursor={col === cursorCol || undefined}>{gutter(clue, `c${col}.`)}</div>
        ))}
      </div>
      <div className="cp-rowclues" style={{ gridTemplateRows: `repeat(${size}, var(--cell))` }} onClick={strike}>
        {rows.map((clue, row) => (
          <div key={row} role="group" aria-label={`সারি ${bn(row + 1)}: ${spoken(clue)}`} className="cp-clue" data-state={states.rows[row]} data-cursor={row === cursorRow || undefined} data-teach={teaching && row === 0 ? (slow ? "still" : "pulse") : undefined}>{gutter(clue, `r${row}.`)}</div>
        ))}
      </div>
      <div className="cp-cells" ref={box} role="group" aria-label={`ছবির ঘর, ${bn(size)}×${bn(size)}`} style={{ gridTemplateColumns: `repeat(${size}, var(--cell))` }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}
        onContextMenu={event => event.preventDefault()} onKeyDown={onKey} onFocus={event => { const at = Number((event.target as HTMLElement).dataset.index); if (Number.isInteger(at)) setFocus(at); }}>
        {cells.map((mark, index) => {
          const row = Math.floor(index / size), col = index % size, letter = picture.art[row][col];
          return (
            <Cell key={index} index={index} size={size} mark={mark} given={given.includes(index)} tab={index === focus} hinted={index === hintCell} teach={teaching && row === 0}
              refused={refused && refused.index === index ? refused.key : 0} bloom={solved} color={letter === "." ? picture.bg : picture.colors[letter]} delay={slow ? 0 : rippleMs(row, col)} />
          );
        })}
        {teaching && !slow && <span className="cp-finger" aria-hidden="true" />}
        {badge && badgeAt && <span className="cp-badge" data-below={badgeRow === 0 || undefined} style={badgeAt} aria-hidden="true">{bn(badge.n)}</span>}
      </div>
    </div>
  );
}
