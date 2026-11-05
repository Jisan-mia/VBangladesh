"use client";
// The tin plate: ঘুঁটি as buttons placed by CSS (--c, --r), a drag that moves the whole line under the finger by writing
// one CSS variable on the well (--drag), and the shuffle flight. The maths of a drag lives in lib/drag.hot.ts; the rules
// of a move belong to the caller (onLine, onSwipe), which says whether the move happened.
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { Board, Dir } from "../lib/board";
import { moveDrag, pressDrag, releaseDrag, releaseOf, swipeDir, Release } from "../lib/drag.hot";
import { cellAt, lineOf, makeDrag } from "../lib/input";
import type { Look } from "../lib/levels";
import { bn } from "../lib/link";
import { SHUFFLE_MS } from "../lib/session";

/** How long a slide takes, in ms: a longer line is heavier. */
export const slideMs = (count: number, calm: boolean) => calm ? 160 : 105 + 30 * Math.min(4, Math.max(1, count) - 1);

type Props = {
  board: Board;
  level: number;
  look: Look;
  picture: string | null;
  calm: boolean;
  won: boolean;
  /** Bumped for every fresh plate: the ঘুঁটি fly from solved to the start. */
  flight: number;
  /** True while a move may happen (playing, past the shuffle). */
  live: () => boolean;
  /** The first press after coming back only wakes the game: true when it did. */
  wake: () => boolean;
  /** A press on a ঘুঁটি in the gap's line (tap, drag or keyboard click). False when the move was refused. */
  onLine: (cell: number, steps: Dir[], ms: number) => boolean;
  /** A swipe that isn't a line drag: the ঘুঁটি next to the gap moves the finger's way (gap direction given). */
  onSwipe: (gapDir: Dir) => void;
  onBlocked: (cell: number) => void;
  onLift: () => void;
  away: boolean;
};

export function Plate({ board, level, look, picture, calm, won, flight, live, wake, onLine, onSwipe, onBlocked, onLift, away }: Props) {
  const { size, cells, gap } = board;
  const well = useRef<HTMLDivElement>(null);
  const drag = useRef(makeDrag()).current;
  const dragged = useRef<HTMLElement[]>([]);
  const line = useRef<{ cell: number; steps: Dir[]; count: number } | null>(null);
  const lifted = useRef(false);
  const landing = useRef(false);
  const before = useRef(board);
  const flightTimer = useRef(0);

  /** Lets go of the dragged line: with `animate` it springs back to its cell. */
  function clearDrag() {
    for (const element of dragged.current) element.removeAttribute("data-drag");
    dragged.current = [];
    well.current?.style.setProperty("--drag", "0");
    line.current = null;
    lifted.current = false;
  }
  function drop() { releaseDrag(drag); landing.current = false; clearDrag(); }

  // Blur, a hidden tab or the player's pause: nothing counts as held, and a line in the air springs back.
  useEffect(() => {
    const leave = () => drop();
    const hide = () => { if (document.hidden) drop(); };
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", hide); window.clearTimeout(flightTimer.current); };
  }, []);
  useEffect(() => { if (away) drop(); }, [away]);

  // A landed drag keeps its place until the new board is on screen, then the transition carries it the rest of the way.
  // Each ঘুঁটি that moved gets a small squash as it lands (none in slow mode).
  useLayoutEffect(() => {
    const was = before.current;
    before.current = board;
    if (landing.current) { landing.current = false; clearDrag(); }
    if (calm || was === board || was.size !== board.size || !well.current) return;
    const ms = Number(well.current.style.getPropertyValue("--slide").replace("ms", "")) || 120;
    for (let cell = 0; cell < board.cells.length; cell++) {
      const tile = board.cells[cell];
      if (!tile || was.cells[cell] === tile) continue;
      well.current.querySelector<HTMLElement>(`[data-tile="${tile}"] .pg-face`)?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.05, .93)" }, { transform: "scale(1)" }],
        { duration: 170, delay: ms * 0.75, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
    }
  }, [board]);

  // The shuffle flight: the ঘুঁটি start at home, then fly to the level's start, one a moment after another.
  useLayoutEffect(() => {
    const element = well.current;
    if (!flight || !element || calm) return;
    element.setAttribute("data-scatter", "");
    void element.offsetWidth;
    element.removeAttribute("data-scatter");
    element.setAttribute("data-flying", "");
    window.clearTimeout(flightTimer.current);
    flightTimer.current = window.setTimeout(() => element.removeAttribute("data-flying"), SHUFFLE_MS);
  }, [flight]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || drag.id >= 0) return;
    if (wake()) { event.preventDefault(); return; }
    if (won || !live() || !well.current) return;
    const box = well.current.getBoundingClientRect();
    const cell = cellAt(size, event.clientX, event.clientY, box.left, box.top, box.width, box.height);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    const found = cell >= 0 ? lineOf(board, cell) : null;
    pressDrag(drag, event.pointerId, cell, found ? found.axis : -1, found ? found.sign : 1, found ? found.cells.length : 0, event.clientX, event.clientY, event.timeStamp);
    if (!found) return;
    line.current = { cell, steps: found.steps, count: found.cells.length };
    well.current.style.setProperty("--sx", found.axis === 0 ? String(found.sign) : "0");
    well.current.style.setProperty("--sy", found.axis === 1 ? String(found.sign) : "0");
    well.current.style.setProperty("--drag", "0");
    for (const at of found.cells) {
      const element = well.current.querySelector<HTMLElement>(`[data-cell="${at}"]`);
      if (element) { element.setAttribute("data-drag", ""); dragged.current.push(element); }
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== drag.id || !well.current) return;
    const offset = moveDrag(drag, event.clientX, event.clientY, event.timeStamp, well.current.clientWidth / size);
    if (!line.current) return;
    if (!lifted.current && offset > 0.06) { lifted.current = true; onLift(); }
    well.current.style.setProperty("--drag", offset.toFixed(3));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== drag.id) return;
    const outcome = releaseOf(drag), held = line.current, cell = drag.cell, finger = swipeDir(drag);
    releaseDrag(drag);
    if (outcome === Release.Tap) {
      clearDrag();
      if (held) {
        const ms = slideMs(held.count, calm);
        setSlide(ms);
        onLine(held.cell, held.steps, ms);
      } else if (cell >= 0 && cell !== gap) onBlocked(cell);
      return;
    }
    if (outcome === Release.Land && held) {
      const ms = slideMs(1, calm);
      setSlide(ms);
      landing.current = true;
      if (!onLine(held.cell, held.steps, ms)) { landing.current = false; clearDrag(); }
      return;
    }
    clearDrag();
    if (outcome === Release.Swipe) { setSlide(slideMs(1, calm)); onSwipe((finger ^ 1) as Dir); }
  }

  function setSlide(ms: number) { well.current?.style.setProperty("--slide", `${ms}ms`); }

  const home = (tile: number) => ({ c: (tile - 1) % size, r: Math.floor((tile - 1) / size) });
  const rowDone = (row: number) => { for (let col = 0; col < size; col++) { const at = row * size + col; if (cells[at] !== (at + 1) % (size * size)) return false; } return true; };
  const where: number[] = [];
  cells.forEach((tile, cell) => { where[tile] = cell; });
  const tiles = [];
  for (let tile = 1; tile < size * size; tile++) {
    const cell = where[tile], row = Math.floor(cell / size), col = cell % size, h = home(tile);
    const movable = !won && lineOf(board, cell) !== null;
    const face: CSSProperties | undefined = picture ? { backgroundImage: `url(${picture})`, backgroundPosition: `${(h.c / (size - 1)) * 100}% ${(h.r / (size - 1)) * 100}%` } : undefined;
    tiles.push(
      <button key={`${level}-${tile}`} type="button" className="pg-tile" data-cell={cell} data-tile={tile}
        data-home={cell === tile - 1 || undefined} data-done={rowDone(row) || undefined}
        style={{ "--c": col, "--r": row, "--hc": h.c, "--hr": h.r, "--i": tile } as CSSProperties}
        aria-label={`${bn(tile)}${movable ? ", সরানো যায়" : ""}`} aria-disabled={!movable} tabIndex={movable ? 0 : -1}
        onClick={event => { if (event.detail !== 0) return; const found = lineOf(board, cell); if (found && live()) { setSlide(slideMs(found.cells.length, calm)); onLine(cell, found.steps, slideMs(found.cells.length, calm)); } }}>
        <span className="pg-face" style={face}>
          {look === "digits" ? bn(tile) : look === "only" ? null : <small>{bn(tile)}</small>}
        </span>
      </button>,
    );
  }

  return (
    <div className="pg-well" ref={well} role="group" style={{ "--n": size } as CSSProperties} data-look={look} data-won={won || undefined}
      aria-label={`${bn(size)}×${bn(size)} প্লেট। ফাঁকা ঘরের সারি বা কলামের ঘুঁটি চাপো বা টানো। কিবোর্ডে তীর চাপলে ফাঁকা ঘরের পাশের ঘুঁটি সরে।`}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={drop} onLostPointerCapture={event => { if (event.pointerId === drag.id) drop(); }}>
      {tiles}
      {won && picture && (
        <span className="pg-tile pg-last" aria-hidden="true" style={{ "--c": size - 1, "--r": size - 1 } as CSSProperties}>
          <span className="pg-face" style={{ backgroundImage: `url(${picture})`, backgroundPosition: "100% 100%" }} />
        </span>
      )}
      {won && !calm && <span className="pg-sweep" aria-hidden="true" />}
    </div>
  );
}
