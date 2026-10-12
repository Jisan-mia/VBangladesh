"use client";
// IP: what we avoided — no jigsaw brand's name, box art, piece cut or app layout; every painting is our own Bangladeshi village scene composed in code, with our own sounds.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, sfx, shake, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  boardOf, cellAt, ghostOf, isDone, isUpright, judgeDrop, levelSeed, makePuzzle, pieceCount, placePiece, reslot, startLevel, startTable, starsFor, turnPiece, worldOf,
  LEVEL_COUNT, type Table,
} from "../lib/game";
import { bannerNote, bn, caption, cardLine, clearLine, clockText, compareLine, feat, gridText, levelLabel, nearMiss, paintingName, parseShared, sharedHash, timeText, type Shared } from "../lib/link";
import { drawPainting, paintingOf } from "../lib/painting";
import { tracePiece, MARGIN, SPAN } from "../lib/pieces";
import { finished, lift, slide, snap, turn } from "../lib/sound";

const TOOL = "chhobir-tukro";
const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

type Phase = "ready" | "playing" | "paused" | "done";
type Grab = { id: number; pointer: number; startX: number; startY: number; x: number; y: number; lift: number; moved: boolean };
type Press = { pointer: number; x: number; y: number };

/** The board, piece and tray sizes for a board `board` px wide. */
function layoutFor(board: number, n: number) {
  const cell = board / n, cols = board >= 340 ? 6 : 5, slot = board / cols, trayTop = board + 12;
  return { board, n, cell, piece: SPAN * cell, cols, slots: cols * 2, slot, trayTop, height: trayTop + slot * 2, trayScale: (0.96 * slot) / (SPAN * cell) };
}

export function JigsawGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>("ready");
  const [width, setWidth] = useState(358);
  const puzzle = useMemo(() => makePuzzle(level), [level]);
  const layout = useMemo(() => layoutFor(width, puzzle.n), [width, puzzle.n]);
  const [table, setTable] = useState<Table>(() => startTable(makePuzzle(1), 12));
  const [selected, setSelected] = useState(-1);
  const [dragging, setDragging] = useState(-1);
  const [status, setStatus] = useState("");
  const [flash, setFlash] = useState<{ key: number; cell: number; good: boolean } | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [record, setRecord] = useState(false);
  const [artReady, setArtReady] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);

  const live = useRef({ phase, table, selected, level, layout });
  live.current = { phase, table, selected, level, layout };
  const clock = useRef<{ since: number | null; spent: number }>({ since: null, spent: 0 });
  const streak = useRef(0);
  const flashKey = useRef(0);
  const grab = useRef<Grab | null>(null);
  const press = useRef<Press | null>(null);
  const chosen = useRef(false);
  const art = useRef<{ key: string; painting: HTMLCanvasElement; pieces: HTMLCanvasElement[] } | null>(null);
  const pieceEls = useRef(new Map<number, HTMLDivElement>());
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const boardCanvas = useRef<HTMLCanvasElement>(null);
  const finalCanvas = useRef<HTMLCanvasElement>(null);
  const thumb = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const artKey = `${level}:${width}`;
  const earned = result ? starsFor(level, result) : 0;
  const rival = friend && friend.level === level ? friend : null;
  const shared: Shared | null = result ? { level, seconds: result, name } : null;
  const shareState = shared ? sharedHash(shared) : "";
  const left = table.placed.filter(placed => !placed).length;

  const elapsed = () => clock.current.spent + (clock.current.since === null ? 0 : performance.now() - clock.current.since);
  function stopClock() { clock.current.spent = elapsed(); clock.current.since = null; }
  function commit(next: Table) { live.current.table = next; setTable(next); }
  function choose(id: number) { live.current.selected = id; setSelected(id); }

  function goLevel(next: number, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    streak.current = 0; grab.current = null; press.current = null;
    clock.current = { since: null, spent: 0 };
    const fresh = startTable(makePuzzle(next), live.current.layout.slots);
    live.current.table = fresh;
    setLevel(next); setTable(fresh); choose(-1); setDragging(-1); setResult(null); setRecord(false); setFlash(null); setCursor(null); setNow(0);
    setPhase("ready");
    setStatus("");
  }

  /** The clock starts on the first touch of a piece. */
  function wake() {
    const { phase: at } = live.current;
    if (at === "ready" || at === "paused") {
      clock.current.since = performance.now();
      live.current.phase = "playing";
      setPhase("playing");
      if (at === "paused") setStatus("চলছে আবার।");
    }
    return live.current.phase === "playing";
  }

  function finish() {
    stopClock();
    const seconds = Math.max(1, Math.round(clock.current.spent / 1000)), stars = starsFor(level, seconds), firstClear = !levels.stars[level];
    levels.record(level, stars);
    const hadBest = best !== null, beaten = submitBest(seconds);
    setRecord(hadBest && beaten);
    setResult(seconds);
    live.current.phase = "done";
    setPhase("done"); choose(-1); setCursor(null);
    setStatus(`পুরো ছবি, ${timeText(seconds)}ে।`);
    window.setTimeout(finished, 250);
    if (stars === 3 || (hadBest && beaten) || (firstClear && level % 10 === 0)) window.setTimeout(() => confetti({ colors: ["#f2b52c", "#e8875e", "#5f9440", "#8fb8d8", "#fbf4e4"] }), 900);
  }

  function showFlash(cell: number, good: boolean) { flashKey.current += 1; setFlash({ key: flashKey.current, cell, good }); }

  /** Sends a piece back to its tray slot with a short glide. */
  function glideBack(id: number) {
    const element = pieceEls.current.get(id);
    if (!element) return;
    element.style.transition = slow ? "none" : "transform .2s cubic-bezier(.2,.8,.3,1)";
    window.setTimeout(() => { element.style.transition = ""; }, 230);
  }

  /** What a drop or a slot tap does with piece `id` at board point (x, y). */
  function settle(id: number, x: number, y: number) {
    const { table: now, layout: size } = live.current, { n } = size;
    const landed = judgeDrop(n, id, now.turns[id], x, y, size.board);
    if (landed === "snap") {
      const next = placePiece(now, id), remaining = next.placed.filter(placed => !placed).length;
      streak.current += 1;
      commit(next); choose(-1);
      snap(streak.current);
      showFlash(id, true);
      if (!remaining) { finish(); return; }
      setStatus(streak.current >= 3 ? `পরপর ${bn(streak.current)}টা! ${remaining === 1 ? "আর ১টা!" : `আর ${bn(remaining)}টা।`}` : `জোড়া লাগছে। ${remaining === 1 ? "আর ১টা!" : `আর ${bn(remaining)}টা।`}`);
      return;
    }
    streak.current = 0;
    if (landed === "away") { glideBack(id); return; }
    slide();
    glideBack(id);
    shake(pieceEls.current.get(id)?.firstElementChild);
    choose(id);
    const cell = cellAt(n, x, y, size.board);
    if (cell >= 0) showFlash(cell, false);
    setStatus(landed === "turn" ? "জায়গা ঠিক, টুকরোটা শুধু ঘোরানো। টুকরোয় চাপ দিয়ে সোজা করো।" : "এটা ওই ঘরের টুকরো না। ছবির সাথে মিলিয়ে দেখো।");
  }

  function tapPiece(id: number) {
    if (!wake()) return;
    const { selected: picked, table: now } = live.current;
    if (picked !== id) {
      choose(id); lift();
      setStatus(puzzle.rotate ? "আবার চাপলে ঘুরবে। সোজা হলে ছবির ঘরে চাপো।" : "এবার ছবির যে ঘরে বসবে, সেখানে চাপো।");
    } else if (puzzle.rotate) {
      commit(turnPiece(now, id)); turn();
      setStatus(isUpright(now.turns[id] + 1) ? "সোজা হয়েছে। এবার ঘরে চাপো।" : "আরেকবার চাপো, আরও ঘুরবে।");
    } else {
      choose(-1); sfx.tap();
      setStatus("");
    }
  }

  function tapCell(cell: number) {
    if (cell < 0 || live.current.phase === "done") return;
    const { selected: picked, table: now, layout: size } = live.current;
    if (now.placed[cell]) { sfx.tap(); return; }
    if (picked < 0) { setStatus("আগে নিচ থেকে একটা টুকরো বেছে নাও।"); return; }
    if (!wake()) return;
    const n = size.n;
    settle(picked, (cell % n + 0.5) * size.cell, (Math.floor(cell / n) + 0.5) * size.cell);
  }

  function rotateSelected() {
    const { selected: picked } = live.current;
    if (picked >= 0 && puzzle.rotate) tapPiece(picked);
  }

  // Pointer input on the whole play area: a press on a tray piece becomes a drag once it moves, or a tap if it doesn't.
  function local(event: ReactPointerEvent) {
    const box = stage.current!.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || grab.current || live.current.phase === "done" || live.current.phase === "paused") return;
    const { x, y } = local(event), { layout: size, table: now } = live.current;
    if (y >= size.trayTop) {
      const slot = Math.floor(x / size.slot) + size.cols * Math.floor((y - size.trayTop) / size.slot), id = now.slots[slot] ?? -1;
      if (id < 0) return;
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer tracks */ }
      const center = slotCenter(slot);
      grab.current = { id, pointer: event.pointerId, startX: x, startY: y, x: center.x, y: center.y, lift: event.pointerType === "mouse" ? 0 : Math.min(36, size.cell * 0.5), moved: false };
    } else if (y < size.board) {
      press.current = { pointer: event.pointerId, x, y };
    }
  }

  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const held = grab.current;
    if (!held || held.pointer !== event.pointerId) return;
    const { x, y } = local(event);
    if (!held.moved) {
      if (Math.hypot(x - held.startX, y - held.startY) < 8) return;
      if (!wake()) { grab.current = null; return; }
      held.moved = true;
      choose(held.id); setDragging(held.id); lift();
    }
    held.x = x; held.y = y - held.lift;
    position(held.id);
  }

  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const held = grab.current, tap = press.current;
    if (held && held.pointer === event.pointerId) {
      grab.current = null;
      if (held.moved) { setDragging(-1); settle(held.id, held.x, held.y); }
      else tapPiece(held.id);
      return;
    }
    press.current = null;
    if (tap && tap.pointer === event.pointerId) {
      const { x, y } = local(event), { layout: size } = live.current;
      if (Math.hypot(x - tap.x, y - tap.y) < 14) tapCell(cellAt(size.n, tap.x, tap.y, size.board));
    }
  }

  function onCancel() {
    const held = grab.current;
    grab.current = null; press.current = null;
    if (held?.moved) { setDragging(-1); glideBack(held.id); }
  }

  function onBoardKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = ARROWS[event.key], n = puzzle.n, at = cursor ?? Math.floor(n * n / 2);
    if (step) {
      event.preventDefault();
      const col = Math.min(n - 1, Math.max(0, at % n + step[0])), row = Math.min(n - 1, Math.max(0, Math.floor(at / n) + step[1]));
      setCursor(row * n + col);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault(); event.stopPropagation();
      setCursor(at); tapCell(at);
    }
  }

  function slotCenter(slot: number) {
    const size = live.current.layout;
    return { x: (slot % size.cols + 0.5) * size.slot, y: size.trayTop + (Math.floor(slot / size.cols) + 0.5) * size.slot };
  }

  /** Puts a piece's element where it belongs right now: under the finger, or in its tray slot (lifted a little when picked). */
  function position(id: number) {
    const element = pieceEls.current.get(id);
    if (!element) return;
    const { layout: size, table: now, selected: picked } = live.current, held = grab.current;
    const inHand = held && held.id === id && held.moved;
    const slot = now.slots.indexOf(id), home = slot >= 0 ? slotCenter(slot) : { x: -999, y: -999 };
    const x = inHand ? held.x : home.x, y = inHand ? held.y : home.y - (picked === id ? 4 : 0);
    element.style.transform = `translate3d(${x - size.piece / 2}px,${y - size.piece / 2}px,0)`;
    const inner = element.querySelector<HTMLElement>(".ct-turn");
    if (inner) inner.style.transform = `rotate(${now.turns[id] * 90}deg) scale(${inHand ? 1 : size.trayScale * (picked === id ? 1.12 : 1)})`;
  }

  // Paint the picture and cut its pieces once per level and width; drags then only move ready-made canvases.
  useEffect(() => {
    const ratio = Math.min(2, window.devicePixelRatio || 1), { board, cell, piece, n } = layout;
    const painting = document.createElement("canvas");
    painting.width = painting.height = Math.round(board * ratio);
    const paint = painting.getContext("2d");
    if (!paint) return;
    drawPainting(paint, paintingOf(levelSeed(level), worldOf(level)), 0, 0, painting.width);
    const margin = MARGIN * cell, side = Math.ceil(piece * ratio);
    const pieces = Array.from({ length: n * n }, (_, id) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = side;
      const c = canvas.getContext("2d")!;
      c.scale(ratio, ratio);
      const col = id % n, row = Math.floor(id / n);
      const outline = () => { c.beginPath(); tracePiece(c, puzzle.edges, n, id, margin, margin, cell); };
      // Baked once here, never per frame: a soft shadow under the cardboard.
      c.save(); c.shadowColor = "rgba(40,25,10,0.38)"; c.shadowBlur = 5; c.shadowOffsetY = 2; c.fillStyle = "#6b5a44"; outline(); c.fill(); c.restore();
      c.save(); outline(); c.clip();
      c.drawImage(painting, margin - col * cell, margin - row * cell, board, board);
      c.lineWidth = 2.2;
      c.translate(1, 1); c.strokeStyle = "rgba(255,255,255,0.45)"; outline(); c.stroke();
      c.translate(-2, -2); c.strokeStyle = "rgba(0,0,0,0.28)"; outline(); c.stroke();
      c.restore();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(40,25,10,0.5)"; outline(); c.stroke();
      return canvas;
    });
    art.current = { key: artKey, painting, pieces };
    pieceEls.current.forEach(element => { const canvas = element.querySelector("canvas"); if (canvas) canvas.dataset.key = ""; });
    setArtReady(artKey);
  }, [artKey]);

  // The board: the faint painting to follow, the empty places, and every piece already in. Redrawn only when a piece goes in.
  useLayoutEffect(() => {
    const canvas = boardCanvas.current, ready = art.current;
    if (!canvas || !ready || ready.key !== artKey) return;
    const { board, cell, n } = layout, c = fitCanvas(canvas, board, board);
    const look = boardOf(level);
    c.fillStyle = look.fill; c.fillRect(0, 0, board, board);
    c.globalAlpha = ghostOf(level); c.drawImage(ready.painting, 0, 0, board, board); c.globalAlpha = 1;
    const trace = (pick: (placed: boolean) => boolean) => {
      c.beginPath();
      table.placed.forEach((placed, id) => { if (pick(placed)) tracePiece(c, puzzle.edges, n, id, (id % n) * cell, Math.floor(id / n) * cell, cell); });
    };
    c.lineWidth = 1; c.strokeStyle = look.line; trace(placed => !placed); c.stroke();
    if (table.placed.some(Boolean)) {
      c.save(); trace(placed => placed); c.clip(); c.drawImage(ready.painting, 0, 0, board, board); c.restore();
      c.strokeStyle = "rgba(30,20,10,0.22)"; trace(placed => placed); c.stroke();
    }
    const final = finalCanvas.current;
    if (final) fitCanvas(final, board, board).drawImage(ready.painting, 0, 0, board, board);
    const small = thumb.current;
    if (small) fitCanvas(small, 52, 52).drawImage(ready.painting, 0, 0, 52, 52);
  }, [table.placed, artReady, artKey]);

  // Every render: pieces go where the state says (the DOM transform is ours, not React's, so a drag never fights a re-render).
  useLayoutEffect(() => { pieceEls.current.forEach((_, id) => position(id)); });

  // A new tray size (the phone turned) keeps the same pieces in the same order.
  useEffect(() => {
    if (live.current.table.slots.length !== layout.slots) commit(reslot(live.current.table, layout.slots));
  }, [layout.slots]);

  // Open where you left off once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    const next = startLevel(levels.stars, levels.unlocked);
    if (next !== level) goLevel(next, false);
  }, [levels.loaded]);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      setFriend(found);
      goLevel(found.level);
    };
    setSite(window.location.host);
    readFriend();
    const hide = () => {
      if (!document.hidden || live.current.phase !== "playing") return;
      stopClock(); onCancel();
      live.current.phase = "paused";
      setPhase("paused");
    };
    const box = wrap.current;
    const measure = (value: number) => setWidth(Math.max(260, Math.min(460, Math.round(value))));
    const watch = box ? new ResizeObserver(([entry]) => measure(entry.contentRect.width)) : null;
    if (box) { watch!.observe(box); measure(box.getBoundingClientRect().width); }
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      watch?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setNow(Math.floor(elapsed() / 1000)), 500);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ছবির টুকরো লেভেল ১২৩ টুকরো জোড়া লাগালাম ${name}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `shareState` encodes everything the card draws.
  }, [shareState, format, site]);

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key === "r" || event.key === "R") { rotateSelected(); return; }
    if (event.key === "Escape" && live.current.selected >= 0) { choose(-1); setStatus(""); return; }
    if ((event.key === "Enter" || event.key === " ") && !target?.closest?.("button, a, summary, [role=application]")) {
      if (phase === "paused") { event.preventDefault(); wake(); }
      else if (phase === "done" && level < LEVEL_COUNT) { event.preventDefault(); goLevel(level + 1); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const stars = totalStars(levels.stars);
  const seconds = phase === "done" && result ? result : now;
  const tray = table.slots.map((id, slot) => ({ id, slot })).filter(({ id }) => id >= 0);
  const pieceSize = layout.piece;

  return (
    <div className="ct" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="ct-friend" aria-labelledby="ct-friend-title">
          <h2 id="ct-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="ct-hud">
        <canvas ref={thumb} className="ct-thumb" role="img" aria-label={`যে ছবিটা জোড়া লাগাবে: ${paintingName(level)}`} />
        <div className="ct-hud-text">
          <p className="ct-level">{levelLabel(level)}</p>
          <p className="ct-sub">{gridText(level)} · ★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</p>
        </div>
        <p className="ct-clock" aria-label={`সময় ${timeText(seconds)}`}>{clockText(seconds)}</p>
      </div>

      <div className="ct-stage" ref={stage} style={{ height: phase === "done" ? layout.board + 4 : layout.height }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
        <div className="ct-board" data-n={puzzle.n} style={{ width: layout.board, height: layout.board }} role="application" tabIndex={0}
          aria-label={`ছবির বোর্ড, ${bn(puzzle.n)}×${bn(puzzle.n)} ঘর। তীরচিহ্ন দিয়ে ঘর বাছো, এন্টার চাপলে বাছাই করা টুকরো সেখানে বসবে।`}
          onKeyDown={onBoardKey} onBlur={() => setCursor(null)}>
          <canvas ref={boardCanvas} aria-hidden="true" />
          <canvas ref={finalCanvas} className="ct-final" data-on={phase === "done" || undefined} aria-hidden="true" />
          {flash && (
            <span key={flash.key} className={flash.good ? "ct-flash" : "ct-flash ct-miss"} aria-hidden="true"
              style={{ left: (flash.cell % puzzle.n) * layout.cell, top: Math.floor(flash.cell / puzzle.n) * layout.cell, width: layout.cell, height: layout.cell }} />
          )}
          {cursor !== null && (
            <span className="ct-cursor" aria-hidden="true" style={{ left: (cursor % puzzle.n) * layout.cell, top: Math.floor(cursor / puzzle.n) * layout.cell, width: layout.cell, height: layout.cell }} />
          )}
        </div>

        {phase !== "done" && <div className="ct-tray" style={{ top: layout.trayTop, height: layout.slot * 2, gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }} aria-hidden="true">
          {Array.from({ length: layout.slots }, (_, slot) => <span key={slot} className={table.slots[slot] >= 0 && table.slots[slot] === selected ? "on" : ""} />)}
        </div>}

        {phase !== "done" && tray.map(({ id }, index) => (
          <div key={`${level}-${id}`} data-piece={id} className={`ct-piece${dragging === id ? " ct-drag" : ""}`} style={{ width: pieceSize, height: pieceSize }}
            ref={element => { if (element) pieceEls.current.set(id, element); else pieceEls.current.delete(id); }}>
            <div className="ct-shake">
              <button type="button" className="ct-turn" tabIndex={0} aria-pressed={selected === id}
                aria-label={`টুকরো ${bn(index + 1)}${puzzle.rotate && !isUpright(table.turns[id]) ? ", ঘোরানো" : ""}`}
                onClick={event => { if (event.detail === 0) tapPiece(id); }}>
                <canvas width={1} height={1} ref={canvas => {
                  const ready = art.current;
                  if (!canvas || !ready || ready.key !== artKey || canvas.dataset.key === artKey) return;
                  const source = ready.pieces[id];
                  canvas.width = source.width; canvas.height = source.height;
                  canvas.getContext("2d")?.drawImage(source, 0, 0);
                  canvas.dataset.key = artKey;
                }} />
              </button>
            </div>
          </div>
        ))}

        {phase === "paused" && (
          <button type="button" className="ct-veil" onClick={() => wake()}>
            <span className="ct-veil-text">থেমে আছে, ঘড়িও থেমে আছে</span>
            <span className="kit-primary ct-veil-go">চালিয়ে যাও</span>
          </button>
        )}
      </div>

      {phase !== "done" && table.queue.length > 0 && <p className="ct-more">ট্রেতে জায়গা হলে আসবে আরও {bn(table.queue.length)}টা টুকরো</p>}

      {phase === "done" && result ? (
        <div className="ct-clear" role="status">
          <StarReveal count={earned} />
          <p className="ct-clear-line">{clearLine(level)}</p>
          <p className="ct-clear-note">
            ‘{paintingName(level)}’, {timeText(result)}।{" "}
            {rival ? compareLine(result, rival.seconds, rival.name) : record ? "এই লেভেলে তোমার নতুন রেকর্ড!" : nearMiss(level, result)}
          </p>
          <div className="ct-clear-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => goLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => goLevel(level)}>আবার খেলো</button>
          </div>
          <button type="button" className="kit-link ct-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="ct-status" role="status" aria-live="polite">{status || (phase === "ready" ? "নিচ থেকে টুকরো টেনে ছবিতে বসাও। চাইলে আগে টুকরোয় চাপো, তারপর ঘরে।" : `আর ${bn(left)}টা টুকরো।`)}</p>
          <div className="ct-tools">
            {puzzle.rotate && <button type="button" className="ct-tool" onClick={rotateSelected} disabled={selected < 0}>ঘোরাও ↻</button>}
            {phase === "playing" && left < pieceCount(level) && <button type="button" className="ct-tool" onClick={() => goLevel(level)}>শুরু থেকে</button>}
          </div>
        </>
      )}

      <div className="ct-prefs">
        <button type="button" className="ct-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
      </div>

      <details className="ct-drawer">
        <summary>সব লেভেল <span>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level}
          onPick={next => { goLevel(next); wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }} />
      </details>

      <section className="ct-result" id="result" ref={resultBox} aria-labelledby="ct-result-title">
        <h2 id="ct-result-title">{shared ? <>লেভেল {bn(level)}: <em>{bn(pieceCount(level))} টুকরো</em> জোড়া লেগেছে</> : "ছবি পুরো হলে তোমার কার্ড"}</h2>
        <p>{shared ? cardLine(shared) : "শেষ টুকরোটা বসলেই কার্ডটা এখানে আসবে। বন্ধুকে পাঠালে সে একই ছবি, একই টুকরো পাবে।"}</p>
        {shared && (
          <div className="ct-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
                aria-label={`ছবির টুকরোর কার্ড: ${levelLabel(level)}, ${timeText(shared.seconds)}, ${bn(earned)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ct-share">
              <label className="ct-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="chhobir-tukro.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${shareState}|${format}`} caption={caption(shared)} state={shareState}
                hint="বন্ধু লিংক খুললে একই ছবি, একই টুকরো পাবে। সময়টা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
