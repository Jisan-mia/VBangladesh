"use client";
// IP: what we avoided — no named maze game, mascot or level map from any app; our own seeded mazes, a round walker of our own, a house and a জিলাপির দোকান drawn fresh, and our own bell and footstep sounds.

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, fitCanvas, readLevels, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { boardPx, centerX, centerY, drawMaze, drawTrail, drawWalker, THEMES } from "../lib/art";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { clean, here, startWalk, stepTo, type Walk } from "../lib/game";
import { dailyMaze, dailyWorld, dhakaDate, levelMaze, openingLevel, parFor, starsForTime, worldOf, LEVEL_COUNT, SLOW_SPEED, SPEED, WORLDS } from "../lib/levels";
import { bn, caption, compareLine, feat, humanLine, mazeLabel, nearMiss, parseShared, seconds, sharedHash, dayLabel, MAX_TENTHS, type Shared } from "../lib/link";
import { dirTo, run, straightTo, E, N, S, W, type Dir } from "../lib/maze";

const TOOL = "golokdhadha";
const MIN_CELL = 22, MAX_CELL = 72; // below 22px a cell is too small for a thumb, so the view pans instead
const LOOK: Record<Dir, readonly [number, number]> = { 1: [0, -1], 2: [1, 0], 4: [0, 1], 8: [-1, 0] };
const KEYS: Record<string, Dir> = { ArrowUp: N, ArrowRight: E, ArrowDown: S, ArrowLeft: W, w: N, d: E, s: S, a: W, W: N, D: E, S: S, A: W };
const PAD: ReadonlyArray<readonly [Dir, string, number]> = [[W, "বাঁয়ে", -90], [N, "ওপরে", 0], [S, "নিচে", 180], [E, "ডানে", 90]];
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
const readSaved = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

type Mode = { level: number; seed: number };
type Phase = "ready" | "playing" | "paused" | "over";
type Result = { tenths: number; stars: number; clean: boolean; record: number | null; firstClear: boolean };

const levelMode = (level: number): Mode => ({ level, seed: levelMaze(level).seed });

/** The footstep: two soft alternating ticks, like chappals on a lane. */
const footstep = (count: number) => tone(count % 2 ? 540 : 470, 0.03, 0.035, "triangle");
const bumpSound = () => tone(150, 0.12, 0.12, "sine", 0, 85);
/** The signature: a sweet-shop bell, টুং-টাং. */
const shopBell = () => { tone(1760, 0.5, 0.07, "triangle"); tone(2637, 0.35, 0.035, "sine"); tone(1568, 0.6, 0.07, "triangle", 0.16); tone(2349, 0.4, 0.03, "sine", 0.16); };

export function MazeGame() {
  const [mode, setMode] = useState<Mode>(() => levelMode(1));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<Result | null>(null);
  const [shownStars, setShownStars] = useState(0);
  const [note, setNote] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [today, setToday] = useState(0);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${mode.level ? `l${mode.level}` : `d${mode.seed}`}`, false);

  const { level, seed } = mode;
  const maze = useMemo(() => level ? levelMaze(level) : dailyMaze(seed), [level, seed]);
  const world = level ? worldOf(level) : dailyWorld(seed), theme = THEMES[world];
  const speed = slow ? SLOW_SPEED : SPEED;
  const par = useMemo(() => parFor(maze, speed), [maze, speed]);

  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timer = useRef<HTMLSpanElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(wrap);
  const lastLevel = useRef(1);
  const timeouts = useRef<number[]>([]);

  // Everything the loop touches lives in refs, so a frame never waits on React.
  const live = useRef({
    maze, theme, speed, phase: "ready" as Phase,
    walk: startWalk(maze) as Walk,
    queue: [] as number[], progress: 0, pending: 0 as Dir | 0, heading: S as Dir,
    elapsed: 0, shownTenths: -1, bump: 0, bumpDir: S as Dir,
    view: { side: 0, cell: 0, board: 0, camX: 0, camY: 0, context: null as CanvasRenderingContext2D | null, art: null as HTMLCanvasElement | null },
  });
  const state = live.current;
  state.theme = theme; state.speed = speed;

  // ---- drawing: the maze art is cached; each frame draws it, the pencil line and the walker ----
  function walkerAt() {
    const { walk, queue, progress, maze: m, view } = state;
    const from = here(walk), to = queue.length ? queue[0] : from;
    const x = centerX(m.size, view.cell, from) + (centerX(m.size, view.cell, to) - centerX(m.size, view.cell, from)) * progress;
    const y = centerY(m.size, view.cell, from) + (centerY(m.size, view.cell, to) - centerY(m.size, view.cell, from)) * progress;
    return [x, y] as const;
  }

  function draw() {
    const { view, maze: m, walk } = state;
    const c = view.context;
    if (!c || !view.art) return;
    c.fillStyle = state.theme.floor;
    c.fillRect(0, 0, view.side, view.side);
    c.save();
    c.translate(-view.camX, -view.camY);
    c.drawImage(view.art, 0, 0, view.board, view.board);
    const [x, y] = walkerAt();
    drawTrail(c, m, view.cell, state.theme, walk.trail, walk.seen, x, y);
    const [lx, ly] = LOOK[state.heading];
    // A bump nudges the walker into the wall and back (6px, 200ms).
    const push = state.bump > 0 ? Math.sin((state.bump / 0.2) * Math.PI) * 6 : 0, [bx, by] = LOOK[state.bumpDir];
    drawWalker(c, x + bx * push, y + by * push, view.cell, lx, ly);
    c.restore();
    const tenths = Math.min(MAX_TENTHS, Math.floor(state.elapsed * 10));
    if (timer.current && tenths !== state.shownTenths) { state.shownTenths = tenths; timer.current.textContent = seconds(tenths); }
  }

  /** Keeps the walker in view when a big maze is wider than the screen (slides there smoothly unless `snap`). */
  function follow(dt: number, snap = false) {
    const { view } = state;
    const spare = view.board - view.side;
    if (spare <= 0) { view.camX = view.camY = spare / 2; return; }
    const [x, y] = walkerAt();
    const goalX = Math.max(0, Math.min(spare, x - view.side / 2)), goalY = Math.max(0, Math.min(spare, y - view.side / 2));
    const k = snap ? 1 : Math.min(1, dt * 7);
    view.camX += (goalX - view.camX) * k;
    view.camY += (goalY - view.camY) * k;
  }

  // ---- moving ----
  function finish() {
    const tenths = Math.min(MAX_TENTHS, Math.max(1, Math.round(state.elapsed * 10)));
    const stars = starsForTime(tenths, par), walkedClean = clean(state.walk);
    state.phase = "over";
    setPhase("over");
    shopBell();
    if (!slow) buzz([20, 40, 20]);
    let record: number | null = null, firstClear = false;
    if (level) {
      firstClear = !levels.stars[level];
      levels.record(level, stars);
    }
    if (best !== null && tenths < best) record = best;
    submitBest(tenths);
    setResult({ tenths, stars, clean: walkedClean, record, firstClear });
    setShownStars(0);
    const worldDone = level > 0 && level % 10 === 0 && firstClear;
    for (let i = 0; i < stars; i++) {
      timeouts.current.push(window.setTimeout(() => { setShownStars(i + 1); sfx.star(i); }, 450 + i * 300));
    }
    timeouts.current.push(window.setTimeout(() => {
      if (worldDone) { sfx.levelUp(); confetti(); }
      else if (stars === 3 || record !== null) { sfx.win(); confetti(); }
    }, 450 + stars * 300 + 100));
  }

  function arrive(cell: number) {
    state.heading = (dirTo(state.maze.size, here(state.walk), cell) || state.heading) as Dir;
    stepTo(state.walk, cell);
    footstep(state.walk.steps);
    if (cell === state.maze.exit) finish();
  }

  function go(dir: Dir, direct: boolean) {
    if (state.phase === "over" || state.phase === "paused") return;
    if (state.queue.length) { state.pending = dir; return; }
    const cells = run(state.maze, here(state.walk), dir);
    if (!cells.length) {
      if (!direct) return;
      bumpSound();
      if (!slow) { buzz(12); state.bump = 0.2; state.bumpDir = dir; }
      state.heading = dir;
      setNote("ওদিকে দেয়াল।");
      if (state.phase !== "playing") draw();
      return;
    }
    state.queue.push(...cells);
    state.heading = dir;
    setNote("");
    begin();
  }

  function walkTo(cells: number[]) {
    if (state.queue.length || state.phase === "over" || state.phase === "paused") return;
    state.queue.push(...cells);
    setNote("");
    begin();
  }

  function begin() {
    if (state.phase === "ready") { state.phase = "playing"; setPhase("playing"); }
  }

  function step(dt: number) {
    if (state.phase !== "playing") return;
    state.elapsed += dt;
    if (state.bump > 0) state.bump = Math.max(0, state.bump - dt);
    if (state.queue.length) {
      state.progress += dt * state.speed;
      while (state.progress >= 1 && state.queue.length) {
        state.progress -= 1;
        arrive(state.queue.shift()!);
        if ((state.phase as Phase) === "over") { state.queue.length = 0; state.progress = 0; return; }
      }
      if (!state.queue.length) {
        state.progress = 0;
        const pending = state.pending;
        state.pending = 0;
        if (pending) go(pending, false);
      }
    }
    follow(dt);
  }

  useGameLoop(step, draw, phase === "playing");

  // ---- a new maze (or the same one again): fresh walk, fresh clock, art redrawn ----
  useEffect(() => {
    for (const id of timeouts.current) clearTimeout(id);
    timeouts.current = [];
    Object.assign(state, { maze, walk: startWalk(maze), queue: [], progress: 0, pending: 0, heading: S, elapsed: 0, shownTenths: -1, bump: 0, phase: "ready" });
    setPhase("ready");
    setResult(null);
    setShownStars(0);
    setNote("");
    paint();
  }, [maze, round]);

  function paint() {
    const box = wrap.current, board = canvas.current;
    if (!box || !board) return;
    const side = Math.floor(box.clientWidth), m = state.maze;
    if (!side) return;
    const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(side / (m.size + 0.2))));
    const px = boardPx(m.size, cell), ratio = Math.min(2, window.devicePixelRatio || 1);
    const art = document.createElement("canvas");
    art.width = Math.ceil(px * ratio); art.height = Math.ceil(px * ratio);
    const a = art.getContext("2d")!;
    a.scale(ratio, ratio);
    drawMaze(a, m, cell, state.theme);
    state.view = { ...state.view, side, cell, board: px, context: fitCanvas(board, side, side), art };
    board.style.height = `${side}px`;
    follow(0, true);
    draw();
  }

  useEffect(() => {
    const box = wrap.current;
    if (!box) return;
    let width = 0;
    const observer = new ResizeObserver(() => { if (box.clientWidth !== width) { width = box.clientWidth; paint(); } });
    observer.observe(box);
    return () => { observer.disconnect(); for (const id of timeouts.current) clearTimeout(id); };
  }, []);

  // ---- opening: a friend's link, or where this phone left off; pause when the tab hides ----
  useEffect(() => {
    setSite(window.location.host);
    setToday(dhakaDate());
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared);
      setMode({ level: shared.level, seed: shared.seed });
      return true;
    };
    // useLevels fills in after the first render, so the opening level reads this phone's saved stars once, through the kit's parser.
    if (!readFriend()) { const start = openingLevel(readLevels(readSaved(`ektukhani-levels-${TOOL}`), LEVEL_COUNT)); lastLevel.current = start; setMode(levelMode(start)); }
    const onHash = () => { readFriend(); };
    const hide = () => { if (document.hidden && state.phase === "playing") { state.phase = "paused"; setPhase("paused"); } };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", onHash); document.removeEventListener("visibilitychange", hide); };
  }, []);

  function resume() { state.phase = "playing"; setPhase("playing"); }

  function goTo(next: number) {
    if (next < 1 || next > LEVEL_COUNT) return;
    lastLevel.current = next;
    if (next === level) setRound(r => r + 1); else setMode(levelMode(next));
  }
  function playDaily() {
    const date = today || dhakaDate();
    if (!level && seed === date) setRound(r => r + 1); else setMode({ level: 0, seed: date });
  }
  const again = () => setRound(r => r + 1);

  // ---- keyboard: arrows or WASD walk, Enter/Space resumes or goes on ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const dir = KEYS[event.key];
    if (dir) { event.preventDefault(); go(dir, true); return; }
    if (event.key !== " " && event.key !== "Enter") return;
    if (element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (phase === "paused") resume();
    else if (phase === "over") { if (level && level < LEVEL_COUNT) goTo(level + 1); else again(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: a swipe walks to the next junction; a drag keeps steering; a tap walks a straight lane ----
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || phase === "over" || phase === "paused") return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }
  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const held = drag.current;
    if (!held || event.pointerId !== held.id) return;
    const dx = event.clientX - held.x, dy = event.clientY - held.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < Math.min(28, Math.max(14, state.view.cell * 0.45))) return;
    held.moved = true;
    held.x = event.clientX; held.y = event.clientY;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? E : W) : (dy > 0 ? S : N), true);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const held = drag.current;
    if (!held || event.pointerId !== held.id) return;
    drag.current = null;
    if (held.moved || state.queue.length) return;
    const box = event.currentTarget.getBoundingClientRect(), { view, maze: m } = state, off = (view.board - m.size * view.cell) / 2;
    const col = Math.floor((event.clientX - box.left + view.camX - off) / view.cell), row = Math.floor((event.clientY - box.top + view.camY - off) / view.cell);
    if (col < 0 || row < 0 || col >= m.size || row >= m.size) return;
    const target = row * m.size + col;
    if (target === here(state.walk)) return;
    const cells = straightTo(m, here(state.walk), target);
    if (cells) { state.heading = dirTo(m.size, here(state.walk), cells[0]) as Dir; walkTo(cells); }
    else setNote("সোজা গলির কোনো ঘরে চাপো, নয়তো আঙুল টানো।");
  }
  function onPointerCancel() { drag.current = null; }

  // ---- friend's link and the result card ----
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = result ? { level, seed, tenths: result.tenths, stars: result.stars, clean: result.clean, name } : null;
  const link = shared ? sharedHash(shared) : "";
  const card: CardData | null = shared;

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("গোলকধাঁধা রাফি ১২.৪ সেকেন্ডে দোকানে পৌঁছেছে").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `link` and `name` cover everything the card draws.
  }, [link, name, format, site, friend]);

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFromList(next: number) {
    goTo(next);
    wrap.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const earned = totalStars(levels.stars);
  const isToday = !level && seed === today;
  const placeLine = level ? WORLDS[world].clear : isToday ? "আজকের গোলকধাঁধা শেষ। কাল নতুন একটা আসবে।" : WORLDS[world].clear;
  const status = note || (phase === "ready"
    ? "বাসা থেকে জিলাপির দোকানে যাও। বোর্ডে আঙুল টানো, নয়তো নিচের তীর চাপো।"
    : "মোড়ে এসে থামবে। তারপর দিক বেছে নাও।");
  const resultLine = result && (rival ? compareLine(result.tenths, rival.tenths, rival.name)
    : result.record !== null ? `নতুন রেকর্ড! আগে লেগেছিল ${seconds(result.record)} সেকেন্ড।`
    : nearMiss(result.tenths, par) ?? (best !== null && best < result.tenths ? `এই ফোনে তোমার সেরা ${seconds(best)} সেকেন্ড।` : humanLine(3, result.clean)));

  return (
    <div className="gd" data-calm={slow}>
      {friend && (
        <section className="gd-friend" aria-labelledby="gd-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="gd-friend-title">{feat(friend)}।</h2>
            <p>একই গোলকধাঁধা, এবার তোমার পালা। সময়টা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের মাপা।</p>
          </div>
        </section>
      )}

      <div className="gd-bar">
        {level ? (
          <button type="button" className="gd-step" onClick={() => goTo(level - 1)} disabled={level <= 1} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        ) : (
          <button type="button" className="gd-step" onClick={() => goTo(lastLevel.current)} aria-label="লেভেলে ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        <p className="gd-level">
          <b>{level ? `লেভেল ${bn(level)}` : isToday ? "আজকের গোলকধাঁধা" : `${possessive(dayLabel(seed))} ধাঁধা`}</b>
          <span><span className="gd-world">{level ? WORLDS[world].name : dayLabel(seed)} · </span><span className="gd-goal" aria-label="৩ তারা">★★★</span> {seconds(par.three)} সে.</span>
        </p>
        <button type="button" className="gd-step" onClick={() => goTo(level + 1)} disabled={!level || level >= open || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <p className="gd-clock"><span className="gd-sr">সময় </span><span ref={timer}>{seconds(0)}</span><small>সে.</small></p>
      </div>

      <div className="gd-board" ref={wrap} data-phase={phase}>
        <canvas
          ref={canvas} role="application"
          aria-label={`${level ? `লেভেল ${bn(level)}` : "আজকের গোলকধাঁধা"}, ${bn(maze.size)}×${bn(maze.size)} ঘর। ওপরের বাঁ কোণের বাসা থেকে নিচের ডান কোণের জিলাপির দোকানে যাও। আঙুল টানো, নিচের তীর চাপো, বা কিবোর্ডের তীর চাপো। মোড় পর্যন্ত নিজেই হাঁটবে।`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
        />
        {phase === "paused" && (
          <div className="gd-overlay">
            <div className="gd-note">
              <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {phase === "over" && result ? (
        <div className="gd-over" role="status">
          <div className="gd-over-head">
            <p className="gd-over-time">পৌঁছে গেছ! <em>{seconds(result.tenths)} সেকেন্ড</em></p>
            <span className="gx-stars gd-over-stars" role="img" aria-label={`৩টার মধ্যে ${bn(result.stars)}টা তারা`}>
              {[0, 1, 2].map(i => <span key={i} className={i < shownStars ? `on${slow ? "" : " gx-pop"}` : ""}>★</span>)}
            </span>
          </div>
          <p className="gd-over-line">{placeLine}</p>
          <p className="gd-over-line gd-over-strong">{resultLine}</p>
          <div className="gd-over-actions">
            <button type="button" className="kit-secondary" onClick={again}>আবার খেলো</button>
            {level && level < LEVEL_COUNT
              ? <button type="button" className="kit-primary" onClick={() => goTo(level + 1)}>পরের লেভেল</button>
              : level
                ? <button type="button" className="kit-primary" onClick={playDaily}>আজকের ধাঁধা</button>
                : <button type="button" className="kit-primary" onClick={() => goTo(lastLevel.current)}>লেভেলে ফেরো</button>}
          </div>
          <button type="button" className="kit-link gd-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="gd-status" role="status" aria-live="polite">{status}</p>
          <div className="gd-pad">
            {PAD.map(([dir, label, turn]) => (
              <button key={dir} type="button" className="gd-arrow" onClick={() => go(dir, true)} disabled={phase === "paused"} aria-label={`${label} হাঁটো`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${turn}deg)` }}><path d="M5 15l7-7 7 7" /></svg>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="gd-tools">
        <button type="button" className="gd-tool" onClick={again} disabled={phase === "ready"}>আবার শুরু</button>
        <button type="button" className="gd-tool" onClick={playDaily} aria-pressed={!level}>আজকের ধাঁধা</button>
        <button type="button" className="gd-tool" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle className="gd-tool" />
      </div>

      <details className="gd-levels">
        <summary>সব লেভেল <span>★ {bn(earned)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="gd-worlds">{WORLDS.map((w, i) => <span key={w.name}>{bn(i * 10 + 1)}–{bn(i * 10 + 10)} {w.name}</span>)}</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level || undefined} onPick={playFromList} />
      </details>

      {result && card && (
        <section className="gd-result" id="result" ref={resultBox} aria-labelledby="gd-result-title">
          <h2 id="gd-result-title"><em>{mazeLabel(card)}</em> পার, {seconds(result.tenths)} সেকেন্ডে</h2>
          <p>{rival ? compareLine(result.tenths, rival.tenths, rival.name) : humanLine(result.stars, result.clean)}</p>
          <div className="gd-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="gd-card-summary" />
              <figcaption id="gd-card-summary" className="gd-sr">কার্ড: {mazeLabel(card)}, {seconds(result.tenths)} সেকেন্ড, {bn(result.stars)} তারা। {humanLine(result.stars, result.clean)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="gd-share">
              <label className="gd-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`golokdhadha-${level || seed}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${link}|${format}`}
                caption={caption(card)} state={link}
                hint="বন্ধু লিংক খুললে এই ধাঁধাটাই পাবে, আর দেখবে তোমার সময়।"
              />
              <button type="button" className="kit-link gd-again-link" onClick={() => level && level < LEVEL_COUNT ? playFromList(level + 1) : playFromList(lastLevel.current)}>
                {level && level < LEVEL_COUNT ? "পরের লেভেল খেলো" : "লেভেলে ফেরো"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
