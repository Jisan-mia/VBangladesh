"use client";
// IP: what we avoided — no trademarked puzzle name or its card set, no red car escaping at a right-edge exit, no 6×6 board; ours is a 6×7 Dhaka street with a green CNG leaving through a gap in the top footpath, our own 40 solver-made jams, and no ambulance stuck in the jam.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { fitCanvas, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { boardHeight, boardWidth, cellX, cellY, drawPicked, drawStreet, drawVehicle, SIDE, TOP } from "../lib/art";
import { COLS, ROWS, occupancy, type Car, type Kind } from "../lib/board";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { fewest, hint, readProgress, recordWin, reachOf, slide, startGame, undo, unlocked, LEVEL_COUNT, MAX_LINK_MOVES, type Game, type Progress } from "../lib/game";
import { bn, caption, compareLine, feat, fromGame, humanLine, parseShared, sharedHash, type Shared } from "../lib/link";

const TOOL = "jam-chharao";
const SAVE_KEY = "ektukhani-jam-chharao-progress";
const NAMES: Record<Kind, string> = { cng: "তোমার CNG", rickshaw: "রিকশা", van: "ভ্যান", bus: "বাস", truck: "ট্রাক" };
const SPRITES: Array<Pick<Car, "kind" | "len" | "down">> = [
  { kind: "cng", len: 2, down: true },
  ...(["rickshaw", "van"] as const).flatMap(kind => [{ kind, len: 2, down: true }, { kind, len: 2, down: false }]),
  ...(["bus", "truck"] as const).flatMap(kind => [{ kind, len: 3, down: true }, { kind, len: 3, down: false }]),
];
const SPEED = 16; // cells a second when a vehicle glides into place
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
const readSaved = () => { try { return localStorage.getItem(SAVE_KEY); } catch { return null; } };
const save = (progress: Progress) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* private mode: fine */ } };

type Drag = { car: number; id: number; x: number; y: number; from: number; low: number; high: number; moved: boolean };

export function JamGame() {
  const [game, setGame] = useState<Game>(() => startGame(1));
  const [picked, setPicked] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [record, setRecord] = useState<number | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const gameRef = useRef(game), pickedRef = useRef(picked), slowRef = useRef(slow);
  gameRef.current = game; pickedRef.current = picked; slowRef.current = slow;
  const view = useRef({ cell: 0, width: 0, height: 0, context: null as CanvasRenderingContext2D | null, street: null as HTMLCanvasElement | null, sprites: {} as Record<string, HTMLCanvasElement[]> });
  const shown = useRef<number[]>(game.pos.slice());
  const shownLevel = useRef(game.level);
  const drag = useRef<Drag | null>(null);
  const frame = useRef(0), last = useRef(0);
  const finished = useRef<Game | null>(null);
  const boardInView = useInView(wrap);

  const { level, won } = game;
  const best = fewest(level);
  const open = Math.max(unlocked(progress), friend?.level ?? 1);
  const phase = won ? "over" : paused ? "paused" : game.moves.length ? "playing" : "ready";
  const rival = friend && friend.level === level ? friend : null;
  const pickedCar = picked >= 0 ? game.cars[picked] : null;
  const [low, high] = picked >= 0 && !won ? reachOf(game, picked) : [0, 0];
  const result: CardData | null = won ? { level, count: game.moves.length, helped: game.helped, name } : null;
  const state = won && game.moves.length <= MAX_LINK_MOVES ? sharedHash(fromGame(game, name)) : "";

  // ---- drawing: a cached street, cached vehicle sprites, and frames only while something moves ----
  function draw() {
    const { context: c, street, sprites, cell, width, height } = view.current;
    if (!c || !street) return;
    const current = gameRef.current;
    c.drawImage(street, 0, 0, width, height);
    for (let i = 0; i < current.cars.length; i++) {
      const car = current.cars[i], at = shown.current[i];
      const x = cellX(car.down ? car.line : at, cell), y = cellY(car.down ? at : car.line, cell);
      c.drawImage(sprites[car.kind][car.down ? 0 : 1], x, y, (car.down ? 1 : car.len) * cell, (car.down ? car.len : 1) * cell);
    }
    const chosen = pickedRef.current;
    if (chosen >= 0 && !current.won) {
      const car = current.cars[chosen], at = shown.current[chosen];
      drawPicked(c, car, cellX(car.down ? car.line : at, cell), cellY(car.down ? at : car.line, cell), cell);
    }
  }

  /** Where each vehicle should rest; once out, your CNG keeps driving up the গলি (unless slow mode keeps it parked at the gap). */
  const target = (i: number) => {
    const current = gameRef.current;
    return i === 0 && current.won && !slowRef.current ? -TOP - 2.2 : current.pos[i];
  };

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last.current) / 1000);
    last.current = now;
    let moving = false;
    const positions = shown.current;
    for (let i = 0; i < positions.length; i++) {
      if (drag.current?.car === i) continue;
      const goal = target(i), gap = goal - positions[i];
      if (gap === 0) continue;
      const stepSize = (i === 0 && gameRef.current.won ? SPEED * 0.6 : SPEED) * dt;
      positions[i] = Math.abs(gap) <= stepSize || slowRef.current ? goal : positions[i] + Math.sign(gap) * stepSize;
      moving ||= positions[i] !== goal;
    }
    draw();
    frame.current = moving ? requestAnimationFrame(tick) : 0;
  }

  function kick() {
    if (frame.current) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }

  // A new level brings new vehicles: snap to their places instead of gliding.
  if (shownLevel.current !== game.level || shown.current.length !== game.pos.length) {
    shownLevel.current = game.level;
    shown.current = game.pos.slice();
  }
  useEffect(() => { kick(); }, [game, picked, slow]);

  useEffect(() => {
    const box = wrap.current, board = canvas.current;
    if (!box || !board) return;
    const resize = () => {
      const cell = Math.floor(box.clientWidth / (COLS + 2 * SIDE) * 4) / 4;
      if (!cell || cell === view.current.cell) return;
      const width = boardWidth(cell), height = boardHeight(cell), ratio = Math.min(2, window.devicePixelRatio || 1);
      const paint = (w: number, h: number, art: (c: CanvasRenderingContext2D) => void) => {
        const sheet = document.createElement("canvas");
        sheet.width = Math.ceil(w * ratio); sheet.height = Math.ceil(h * ratio);
        const c = sheet.getContext("2d")!;
        c.scale(ratio, ratio);
        art(c);
        return sheet;
      };
      board.style.height = `${height}px`;
      view.current = {
        cell, width, height,
        context: fitCanvas(board, width, height),
        street: paint(width, height, c => drawStreet(c, cell)),
        sprites: {} as Record<string, HTMLCanvasElement[]>,
      };
      for (const car of SPRITES) (view.current.sprites[car.kind] ??= [])[car.down ? 0 : 1] = paint((car.down ? 1 : car.len) * cell, (car.down ? car.len : 1) * cell, c => drawVehicle(c, car, 0, 0, cell));
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); frame.current = 0; };
  }, []);

  // ---- moves ----
  function play(next: Game | null, help = false) {
    if (!next) return false;
    setGame(next);
    if (!help) setNote("");
    if (next.won && !slowRef.current && typeof navigator.vibrate === "function") navigator.vibrate(20);
    return true;
  }

  function nudge(step: -1 | 1) {
    if (picked < 0 || phase === "paused" || won) return;
    if (!play(slide(game, picked, game.pos[picked] + step))) setNote("ওদিকে রাস্তা বন্ধ। অন্য গাড়ি সরাও।");
  }

  function showHint() {
    if (won || paused) return;
    const move = hint(game);
    if (!move) return;
    setPicked(move.car);
    play(slide(game, move.car, move.to, true), true);
    setNote(`${NAMES[game.cars[move.car].kind]} সরিয়ে দিলাম। আবার চাপলে পরের চাল।`);
  }

  function takeBack() {
    if (!game.moves.length || won) return;
    setGame(undo(game));
    setNote("");
  }

  function goTo(next: number) {
    if (next < 1 || next > LEVEL_COUNT) return;
    setGame(startGame(next));
    setPicked(-1);
    setPaused(false);
    setNote("");
    setRecord(null);
  }

  function cycle(step: 1 | -1) {
    const count = game.cars.length;
    setPicked(current => current < 0 ? 0 : (current + step + count) % count);
  }

  // ---- the end of a level: save this phone's progress once ----
  useEffect(() => {
    if (!won || finished.current === game) return;
    finished.current = game;
    const before = progress[level];
    const next = recordWin(progress, game);
    setRecord(!game.helped && before !== undefined && before > 0 && game.moves.length < before ? before : null);
    setProgress(next);
    save(next);
    setPicked(-1);
  }, [game]);

  useEffect(() => {
    const saved = readProgress(readSaved());
    setProgress(saved);
    setSite(window.location.host);
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared);
      goTo(shared.level);
      return true;
    };
    if (!readFriend()) goTo(unlocked(saved));
    const onHash = () => { readFriend(); };
    const hide = () => { const current = gameRef.current; if (document.hidden && current.moves.length && !current.won) setPaused(true); };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", onHash); document.removeEventListener("visibilitychange", hide); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("জ্যাম ছাড়াও রাফি ১২৩ চালে").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` and `name` cover everything the card draws.
  }, [state, name, format, site, friend, won]);

  // ---- keyboard: Enter picks the next vehicle, arrows slide it, H shows a move, Z takes one back ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key;
    if (key.startsWith("Arrow")) {
      event.preventDefault();
      if (phase === "paused" || won) return;
      if (picked < 0) { setPicked(0); return; }
      const car = game.cars[picked], vertical = key === "ArrowUp" || key === "ArrowDown";
      if (vertical === car.down) nudge(key === "ArrowUp" || key === "ArrowLeft" ? -1 : 1);
      else cycle(key === "ArrowUp" || key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (key === "h" || key === "H") { event.preventDefault(); showHint(); return; }
    if (key === "z" || key === "Z" || key === "Backspace") { event.preventDefault(); takeBack(); return; }
    if (key === "Escape") { setPicked(-1); return; }
    if (key !== " " && key !== "Enter") return;
    if (element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (phase === "paused") setPaused(false);
    else if (won) goTo(level < LEVEL_COUNT ? level + 1 : level);
    else cycle(1);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: drag a vehicle along its lane, or tap it to pick it for the arrow buttons ----
  function carAt(event: ReactPointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect(), { cell } = view.current;
    const col = Math.floor((event.clientX - box.left) / cell - SIDE), row = Math.floor((event.clientY - box.top) / cell - TOP);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return occupancy(game.cars, game.pos)[row * COLS + col];
  }
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || won || paused) return;
    const car = carAt(event);
    if (car < 0) { setPicked(-1); return; }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    const [from, to] = reachOf(game, car);
    drag.current = { car, id: event.pointerId, x: event.clientX, y: event.clientY, from: game.pos[car], low: from, high: to, moved: false };
  }
  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const held = drag.current;
    if (!held || event.pointerId !== held.id) return;
    const dx = event.clientX - held.x, dy = event.clientY - held.y;
    if (!held.moved && Math.hypot(dx, dy) < 8) return;
    held.moved = true;
    const along = (game.cars[held.car].down ? dy : dx) / view.current.cell;
    shown.current[held.car] = Math.min(held.high, Math.max(held.low, held.from + along));
    draw();
  }
  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const held = drag.current;
    if (!held || event.pointerId !== held.id) return;
    drag.current = null;
    if (!held.moved) { setPicked(current => current === held.car ? -1 : held.car); return; }
    setPicked(held.car);
    if (!play(slide(game, held.car, Math.round(shown.current[held.car])))) kick();
  }
  function onPointerCancel() {
    drag.current = null;
    kick();
  }

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFromCard(next: number) {
    goTo(next);
    wrap.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function status() {
    if (note) return note;
    if (pickedCar) return `${NAMES[pickedCar.kind]} ধরেছ। তীর চাপো, বা টেনে সরাও।`;
    if (phase === "ready") return "★ দেওয়া সবুজ CNG তোমার। গাড়ি টেনে সরাও, নয়তো গাড়িতে চেপে নিচের তীর চাপো।";
    return "গাড়ি টেনে সরাও, নয়তো চেপে তীর চাপো।";
  }

  const mine = progress[level];
  const arrows = pickedCar && !pickedCar.down ? (["বাঁয়ে", "ডানে"] as const) : (["ওপরে", "নিচে"] as const);
  const arrowTurn = pickedCar && !pickedCar.down ? [-90, 90] : [0, 180];

  return (
    <div className="jc" data-calm={slow}>
      {friend && (
        <section className="jc-friend" aria-labelledby="jc-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="jc-friend-title">{feat(friend)}।</h2>
            <p>একই জ্যাম, এবার তোমার পালা। চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।</p>
          </div>
        </section>
      )}

      <div className="jc-bar">
        <button type="button" className="jc-step" onClick={() => goTo(level - 1)} disabled={level <= 1} aria-label="আগের জ্যাম">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="jc-level"><b>জ্যাম {bn(level)}</b><span>সেরা {bn(best)} চাল</span></p>
        <button type="button" className="jc-step" onClick={() => goTo(level + 1)} disabled={level >= open || level >= LEVEL_COUNT} aria-label="পরের জ্যাম">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <p className="jc-moves" aria-live="off"><span>চাল</span><b>{bn(game.moves.length)}</b></p>
      </div>

      <div className="jc-board" ref={wrap} data-phase={phase}>
        <canvas
          ref={canvas} role="application"
          aria-label={`জ্যাম ${bn(level)}: সবুজ CNG-টাকে ওপরের ফাঁক দিয়ে বের করো। গাড়ি টেনে সরাও, বা চেপে নিচের তীর চাপো। কিবোর্ডে এন্টার দিয়ে গাড়ি বাছো, তীর দিয়ে সরাও, H চাপলে সমাধানের এক চাল।`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
        />
        {phase === "paused" && (
          <div className="jc-overlay">
            <div className="jc-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {won ? (
        <div className="jc-over" role="status">
          <p className="jc-over-score">জ্যাম ছাড়ল! <em>{bn(game.moves.length)} চালে</em></p>
          <p className="jc-over-line">
            {rival ? compareLine(game.moves.length, rival.count, rival.name)
              : record ? `নতুন রেকর্ড! আগে লেগেছিল ${bn(record)} চাল।`
              : game.helped ? `${bn(game.helped)} বার সাহায্য নিয়ে। সেরা সমাধান ${bn(best)} চাল।`
              : game.moves.length <= best ? "একদম সেরা সমাধান!"
              : `সেরা সমাধান ${bn(best)} চাল${mine ? ` · এই ফোনে তোমার সেরা ${bn(mine)}` : ""}`}
          </p>
          <div className="jc-over-actions">
            <button type="button" className="kit-secondary jc-again" onClick={() => goTo(level)}>আরেকবার</button>
            {level < LEVEL_COUNT
              ? <button type="button" className="kit-primary jc-next" onClick={() => goTo(level + 1)}>পরের জ্যাম</button>
              : <p className="jc-all">সব জ্যাম ছাড়িয়েছ!</p>}
          </div>
          <button type="button" className="kit-link jc-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="jc-status" role="status" aria-live="polite">{status()}</p>
          <div className="jc-pad">
            {([-1, 1] as const).map((step, index) => (
              <button
                key={step} type="button" className="jc-arrow" onClick={() => nudge(step)}
                disabled={!pickedCar || phase === "paused" || (step < 0 ? game.pos[picked] <= low : game.pos[picked] >= high)}
                aria-label={pickedCar ? `${NAMES[pickedCar.kind]} ${arrows[index]} সরাও` : `${arrows[index]} সরাও (আগে একটা গাড়ি চাপো)`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${arrowTurn[index]}deg)` }}><path d="M5 15l7-7 7 7" /></svg>
                {arrows[index]}
              </button>
            ))}
            <button type="button" className="jc-help" onClick={showHint} disabled={phase === "paused"}>সমাধান দেখাও</button>
          </div>
          <div className="jc-tools">
            <button type="button" className="jc-tool" onClick={takeBack} disabled={!game.moves.length}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
            </button>
            <button type="button" className="jc-tool" onClick={() => goTo(level)} disabled={!game.moves.length}>আবার শুরু</button>
            <button type="button" className="jc-tool jc-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          </div>
        </>
      )}

      <details className="jc-levels">
        <summary>সব জ্যাম <span>{bn(Object.keys(progress).length)}/{bn(LEVEL_COUNT)} ছাড়ানো</span></summary>
        <ol>
          {Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).map(n => {
            const done = progress[n];
            return (
              <li key={n}>
                <button type="button" onClick={() => playFromCard(n)} disabled={n > open} aria-current={n === level ? "true" : undefined}
                  aria-label={`জ্যাম ${bn(n)}${done ? `, ${bn(done)} চালে ছাড়িয়েছ` : done === 0 ? ", সাহায্য নিয়ে ছাড়িয়েছ" : n > open ? ", এখনো বন্ধ" : ""}`}>
                  {bn(n)}{done !== undefined && <small aria-hidden="true">{done ? bn(done) : "✓"}</small>}
                </button>
              </li>
            );
          })}
        </ol>
      </details>

      {result && (
        <section className="jc-result" id="result" ref={resultBox} aria-labelledby="jc-result-title">
          <h2 id="jc-result-title"><em>{bn(level)} নম্বর জ্যাম</em> {bn(result.count)} চালে ছাড়ল</h2>
          <p>{rival ? compareLine(result.count, rival.count, rival.name) : humanLine(result.count, best, result.helped)}</p>
          <div className="jc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="jc-card-summary" />
              <figcaption id="jc-card-summary" className="jc-sr">কার্ড: {bn(level)} নম্বর জ্যাম {bn(result.count)} চালে, সেরা {bn(best)}। {humanLine(result.count, best, result.helped)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="jc-share">
              <label className="jc-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`jam-chharao-${level}.png`} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${name}|${format}`}
                caption={caption(result)} state={state || undefined}
                hint={state ? "বন্ধু লিংক খুললে এই জ্যামটাই পাবে। চালগুলো মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" : "চাল অনেক বেশি হয়ে গেছে, লিংকে ধরছে না। কম চালে ছাড়িয়ে আবার শেয়ার করো।"}
              />
              <button type="button" className="kit-link jc-again-link" onClick={() => playFromCard(level < LEVEL_COUNT ? level + 1 : level)}>{level < LEVEL_COUNT ? "পরের জ্যাম খেলো" : "আবার খেলো"}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
