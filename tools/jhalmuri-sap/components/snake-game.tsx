"use client";
// IP: what we avoided — no "Snake"/"Snake II"/"Xenzia" or phone-maker name, no phone silhouette or keypad, no green LCD palette, pixel font, blocky pixel snake or ringtone; ours is a round teal cartoon snake on newsprint inside a tin fence, eating ঝালমুড়ি.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, fitCanvas, hiss, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { StarReveal } from "../../../shared/game-ui";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { layout, paintLevel } from "../lib/board";
import { cardBlob, drawCard } from "../lib/draw-card";
import { beforeMove, burst, drawFrame, moveParticles, resetMotion } from "../lib/draw.hot";
import { drawStartArt, drawStoryPanel, STORY } from "../lib/intro";
import { chilliesIn, levelOf, levelStars, worldOf, LEVEL_COUNT, LEVELS, LEVELS_PER_WORLD, WORLDS } from "../lib/levels";
import { banner, bn, caption, parseShared, sharedHash, type Shared } from "../lib/link";
import { afterClear, playable, readUnlock, recommended, INTRO_KEY, UNLOCK_KEY } from "../lib/progress";
import { again as sessionAgain, back, canPlay, cheerMayPlay, createSession, finish as sessionFinish, moving, pause as sessionPause, pick as sessionPick, reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, GUARD_MS, type Phase } from "../lib/session";
import { compareLine, crashLine, createGame, gateWarning, headCell, humanLine, levelLine, moveMs, nearMiss, speedStep, step, turn, turnSide, COLS, HOT_MOVES, type Crash, type Dir, type Game } from "../lib/snake";
import { Look, makeView } from "../lib/view";
import { worldPalettes } from "../lib/art";

const TOOL = "jhalmuri-sap";
/** level 0: the classic endless game. */
type Result = { seed: number; score: number; record: boolean; won: boolean; level: number; golden: number; eaten: number; length: number; seconds: number; stars: number; best: number | null; crash: Crash };

// The game's sounds, all made in code by the shared kit. Long ones use tone()'s delay, so the player's pause can cut them.
const crunch = (combo: number) => { hiss(0.05, 0.16, 2600, "bandpass"); hiss(0.05, 0.11, 1700, "bandpass", 0.05); if (combo > 1) sfx.combo(combo - 2); };
const clang = () => { tone(330, 0.32, 0.06, "square", 0, 262); hiss(0.18, 0.08, 3200, "highpass"); sfx.wrong(); };
const faster = () => { tone(784, 0.1, 0.08, "triangle"); tone(1175, 0.16, 0.07, "triangle", 0.08); };
const caw = () => { tone(840, 0.09, 0.05, "sawtooth", 0, 560); tone(780, 0.12, 0.05, "sawtooth", 0.14, 500); };
const bell = () => { tone(1320, 0.4, 0.05, "sine"); tone(1320, 0.4, 0.045, "sine", 0.3); };
const sizzle = () => { hiss(0.35, 0.09, 5200, "highpass"); tone(520, 0.2, 0.05, "sawtooth", 0, 1040); };
/** The signature: the ঝালমুড়িওয়ালা's tin shaker, ঝাঁক-ঝাঁক-ঝাঁক, then the world's four notes. */
const MOTIFS = [[523, 659, 784, 659], [440, 554, 659, 880], [392, 494, 587, 784]] as const;
function shaker(world: number) {
  for (let i = 0; i < 3; i++) { hiss(0.06, 0.13, 5200, "highpass", i * 0.12); hiss(0.04, 0.08, 2400, "bandpass", i * 0.12 + 0.03); }
  MOTIFS[world].forEach((frequency, i) => tone(frequency, 0.16, 0.06, "triangle", 0.42 + i * 0.13));
}

const SWIPE = 22;
const TAP_SLOP = 14;
const HOLD_SKIP = 600;
/** The HUD row above the board, with its gap (px). */
const HUD_H = 42;
const PANEL_MS = 3200;
const KEYS: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3 };

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const calmPhone = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

/** A number that counts up from 0 over 0.7 s (at once in ধীরে খেলো). */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (calmPhone()) { setShown(value); return; }
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / 700);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{bn(shown)}</>;
}

/** The pre-drawn art canvas for the start button and the story panels; redrawn when its box or panel changes. */
function Art({ draw, label, className }: { draw: (canvas: HTMLCanvasElement, width: number, height: number) => void; label: string; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => { if (element.clientWidth) drawRef.current(element, element.clientWidth, element.clientHeight); };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { const element = ref.current; if (element?.clientWidth) draw(element, element.clientWidth, element.clientHeight); });
  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}

export function SnakeGame() {
  const [session] = useState(createSession);
  const [view] = useState(makeView);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [world, setWorld] = useState(0);
  const [cardOpen, setCardOpen] = useState(false);
  const [panel, setPanel] = useState(0);
  const [score, setScore] = useState(0);
  const [eaten, setEaten] = useState(0);
  const [golden, setGolden] = useState(0);
  const [hot, setHot] = useState(false);
  const [pop, setPop] = useState({ id: 0, text: "" });
  const [result, setResult] = useState<Result | null>(null);
  const [ready, setReady] = useState(true);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [unlock, setUnlock] = useState(1);
  const unlockRef = useRef(1);
  // 0 is the classic endless game; levels start at 1.
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const chosen = useRef(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [board, setBoard] = useState({ width: 0, height: 0 });
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const [firstGame] = useState(() => createGame(1, 1));
  const game = useRef<Game>(firstGame);
  const seed = useRef(1);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  view.calm = slow;
  const timers = useRef<number[]>([]);
  const gesture = useRef({ id: -1, x: 0, y: 0, startX: 0, startY: 0, swiped: false });
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const playMs = useRef(0);
  const inView = useInView(root, 0.35);

  const card = result ? { score: result.score, name: cleanName(name), level: result.level, golden: result.golden } : null;
  const state = result ? sharedHash({ seed: result.seed, score: result.score, name, level: result.level, golden: result.golden }) : "";

  const sync = () => {
    setPhase(session.phase);
    setPicking(session.picking);
    view.look = session.phase === "playing" ? Look.Playing : session.phase === "story" ? Look.Story : session.phase === "paused" ? Look.Paused : session.phase === "over" ? Look.Over : Look.Title;
  };
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const friendFits = (forLevel: number) => Boolean(friend) && (friend!.level ?? 0) === forLevel;
  const draw = () => drawFrame(view, game.current, performance.now());

  /** A fresh board for `nextLevel` (no phase change). Celebration timers from the last run are cleared here. */
  function deal(nextSeed: number, nextLevel: number) {
    clearTimers();
    const repaint = nextLevel !== levelRef.current || !view.background;
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    game.current = createGame(nextSeed, nextLevel);
    seed.current = nextSeed;
    if (repaint && view.width) paintLevel(view, nextLevel);
    resetMotion(view, game.current);
    view.every = moveMs(game.current, slowRef.current);
    playMs.current = 0;
    setScore(0); setEaten(0); setGolden(0); setHot(false);
    setResult(null); setCardOpen(false); setReady(true);
    draw();
  }
  /** নতুন করে শুরু, a level picked, a friend's link: back to the title with a fresh board. */
  function reset(nextLevel = levelRef.current, nextSeed = friendFits(nextLevel) ? friend!.seed : newSeed()) {
    sessionReset(session);
    deal(nextSeed, nextLevel);
    sync();
  }

  function start() {
    const firstStory = !story.current.seen && levelRef.current === 1 && !friend;
    if (!sessionStart(session, firstStory)) return;
    shaker(worldOf(levelRef.current));
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    view.hold = performance.now() + 450;
    sync();
  }
  function endStory() {
    if (!storyDone(session)) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    view.hold = performance.now() + 500;
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sfx.tap(); return current + 1; });
  }
  function pause() { if (sessionPause(session)) sync(); }
  // A breath after resuming, to see where the snake is heading before it moves again.
  function resume() { if (sessionResume(session)) { view.hold = performance.now() + 600; sync(); } }
  /** আবার খেলো or পরের লেভেল from the end screen: straight into play, on a fresh board. */
  function again(nextLevel = levelRef.current, key?: { at: number; repeat: boolean }) {
    if (!result || !playable(nextLevel, unlockRef.current, levels.stars, friend?.level) && nextLevel !== 0) return;
    if (!sessionAgain(session, performance.now(), key)) return;
    deal(friendFits(nextLevel) ? friend!.seed : newSeed(), nextLevel);
    view.hold = performance.now() + 350;
    shaker(worldOf(nextLevel));
    sync();
  }
  /** The level পরের লেভেল opens: the next one, if this clear (or an earlier one) made it playable; a friend's far-ahead clear opens nothing. */
  const nextAfter = (done: Result | null) => done && done.level && done.won && done.level < LEVEL_COUNT && playable(done.level + 1, unlockRef.current, levels.stars, friend?.level) ? done.level + 1 : 0;
  // The player's menu pauses and resumes the snake; নতুন করে শুরু deals a fresh ঠোঙা on the same level.
  useGamePlayer({ onPause: pause, onResume: resume, onRestart: () => reset() });

  function choose(nextLevel: number) {
    chosen.current = true;
    sfx.tap();
    reset(nextLevel);
  }
  function openPicker(open: boolean) {
    if (!sessionPick(session, open)) return;
    if (open) setWorld(worldOf(levelRef.current || recommended(unlockRef.current, levels.stars)));
    sfx.tap();
    sync();
  }

  /** A swipe or an arrow key: an absolute direction. On the title it starts the run that way. */
  function press(dir: Dir) {
    if (session.phase === "title" && !session.picking) { start(); if ((session.phase as Phase) !== "playing") return; }
    else if (session.phase !== "playing") return;
    if (turn(game.current, dir)) sfx.tap();
  }
  /** A tap on one half of the board, or a turn button. */
  function side(towards: -1 | 1) {
    if (session.phase !== "playing") return;
    if (turnSide(game.current, towards)) sfx.tap();
  }

  function feedback(goldenBite: boolean, sped: boolean, hotStart: boolean) {
    const g = game.current, head = headCell(g);
    setScore(g.score); setEaten(g.eaten); setGolden(g.golden);
    setPop(current => ({ id: current.id + 1, text: sped ? `গতি ${bn(speedStep(g.eaten))}` : `${goldenBite ? "+৩০" : "+১০"}${g.combo > 2 ? ` ×${bn(g.combo)}` : ""}` }));
    crunch(g.combo);
    if (goldenBite) sfx.coin();
    if (sped) faster();
    if (hotStart) { sizzle(); setHot(true); }
    const slot = view.bulges.indexOf(-1);
    view.bulges[slot < 0 ? 0 : slot] = 0;
    burst(view, view.fence + (head % COLS + 0.5) * view.cell, view.fence + (Math.floor(head / COLS) + 0.5) * view.cell, goldenBite ? 10 : 7, goldenBite ? 1 : 0);
  }

  function finish(won: boolean) {
    const g = game.current, at = levelRef.current, now = performance.now();
    if (!sessionFinish(session, now)) return;
    view.crashAt = now;
    if (!won && !slowRef.current) view.shakeUntil = now + 260;
    setScore(g.score); setHot(false);
    const stars = at && won ? levelStars(at, g.golden) : 0, before = at ? levels.stars[at] ?? 0 : 0;
    const record = at ? false : best !== null && g.score > best;
    setResult({ seed: seed.current, score: g.score, record, won, level: at, golden: g.golden, eaten: g.eaten, length: g.length, seconds: Math.round(playMs.current / 1000), stars, best, crash: g.crash });
    if (at && stars) {
      levels.record(at, stars);
      const next = afterClear(unlockRef.current, at, LEVEL_COUNT);
      if (next !== unlockRef.current) { unlockRef.current = next; setUnlock(next); write(UNLOCK_KEY, String(next)); }
    } else if (!at) submitBest(g.score);
    if (!won) clang();
    else shaker(worldOf(at));
    // Three stars, a better result on a level or a new best: confetti (the kit skips it in ধীরে খেলো). The run id drops it after you move on.
    const run = session.run;
    if (record || stars === 3 || (stars > before && levelOf(at).finale)) later(() => { if (cheerMayPlay(session, run)) { if (record) sfx.win(); else sfx.levelUp(); confetti(); } }, record ? 150 : 1000);
    // Fingers are still tapping the turn buttons when the snake crashes; don't let those taps skip the result.
    setReady(false);
    later(() => setReady(true), GUARD_MS);
    sync();
  }

  function tick(dt: number) {
    moveParticles(view, dt);
    const now = performance.now();
    if (session.phase === "story") {
      story.current.clock += dt * 1000;
      if (story.current.holdAt >= 0 && now - story.current.holdAt >= HOLD_SKIP) { story.current.holdAt = -1; endStory(); }
      else if (story.current.clock >= PANEL_MS) nextPanel();
      return;
    }
    if (!moving(session) || now < view.hold) return;
    const g = game.current;
    playMs.current += dt * 1000;
    view.every = moveMs(g, slowRef.current);
    view.acc += dt * 1000;
    if (view.acc < view.every) return;
    view.acc = Math.min(view.acc - view.every, view.every);
    beforeMove(view, g);
    const speed = speedStep(g.eaten), warned = gateWarning(g), wasHot = g.hot > 0;
    const event = step(g);
    for (let i = 0; i < view.bulges.length; i++) if (view.bulges[i] >= 0 && ++view.bulges[i] >= g.length) view.bulges[i] = -1;
    if (g.crows && g.crowTurned === g.moves) {
      const head = headCell(g);
      for (let i = 0; i < g.crows; i++) if (Math.abs(g.crowAt[i] % COLS - head % COLS) + Math.abs(Math.floor(g.crowAt[i] / COLS) - Math.floor(head / COLS)) <= 3) { caw(); break; }
    }
    if (!warned && gateWarning(g)) bell();
    if (wasHot && g.hot === 0) setHot(false);
    if (event === "eat" || event === "bonus") feedback(event === "bonus", !g.goal && speedStep(g.eaten) > speed, g.hot === HOT_MOVES);
    else if (event === "pipe") sfx.whoosh();
    else if (event === "win" && g.goal) { feedback(false, false, false); finish(true); }
    else if (event === "crash" || event === "win") finish(event === "win");
  }

  const looping = phase === "playing" || phase === "story" || (inView && !slow && (phase === "title" || phase === "over"));
  useGameLoop(tick, draw, looping);

  // The board fills the space between the HUD and the buttons: whole cells, laid out again whenever the stage changes size.
  useEffect(() => {
    const box = field.current, element = canvas.current;
    if (!box || !element) return;
    let laid = "";
    const fit = () => {
      const width = box.clientWidth, height = box.clientHeight;
      if (!width || !height || laid === `${width}×${height}`) return;
      laid = `${width}×${height}`;
      layout(view, width, height - HUD_H);
      element.style.width = `${view.width}px`;
      element.style.height = `${view.height}px`;
      view.context = fitCanvas(element, view.width, view.height);
      paintLevel(view, levelRef.current);
      setBoard({ width: view.width, height: view.height });
      draw();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    story.current.seen = read(INTRO_KEY) === "1";
    // In-page jumps don't touch the hash, so only a real challenge link counts.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      chosen.current = true;
      sessionReset(session);
      deal(shared.seed, shared.level ?? 0);
      sync();
    };
    setSite(window.location.host);
    if (!parseShared(window.location.hash)) deal(newSeed(), 1);
    readFriend();
    // The player pauses on blur and hide; these keep the session's own flags, release a swipe, and stop a story hold.
    const blur = () => { session.focused = false; gesture.current.id = -1; story.current.holdAt = -1; };
    const focus = () => back(session, "focus");
    const visibility = () => { if (document.hidden) { session.visible = false; session.focused = false; pause(); } else back(session, "show"); };
    window.addEventListener("hashchange", readFriend);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimers();
      window.removeEventListener("hashchange", readFriend);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // The stage scrolled away: nothing may start (the player pauses a running snake itself).
  useEffect(() => { session.inView = inView; if (!inView) pause(); }, [inView]);

  // Saved stars load after the first paint: migrate the unlock once, then open at the level to play next.
  useEffect(() => {
    if (!levels.loaded) return;
    const saved = readUnlock(read(UNLOCK_KEY), levels.stars, LEVEL_COUNT);
    if (saved.migrated) write(UNLOCK_KEY, String(saved.unlock));
    unlockRef.current = Math.max(unlockRef.current, saved.unlock);
    setUnlock(unlockRef.current);
    if (chosen.current || session.phase !== "title" || !levelRef.current) return;
    const next = recommended(unlockRef.current, levels.stars);
    if (next !== levelRef.current) deal(seed.current, next);
  }, [levels.loaded]);

  useEffect(() => { view.every = moveMs(game.current, slow); draw(); }, [slow]);
  // Dev only: lets the Orca autopilot read the board (ai_docs/statecharts/jhalmuri-sap/README.md, "Live checks").
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __jhalmuri?: unknown }).__jhalmuri = { game: () => game.current, session };
  }, []);

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], .js-cardpanel, .js-picker")) return;
    if (!session.inView || session.phase === "paused") return;
    const now = session.phase, dir = KEYS[event.key], enter = event.key === "Enter" || event.key === " ";
    if (session.picking) {
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 9 && playable(digit, unlockRef.current, levels.stars, friend?.level)) { event.preventDefault(); choose(digit); }
      return;
    }
    if (now === "story") {
      if (!enter && dir === undefined) return;
      event.preventDefault();
      if (event.repeat) { if (story.current.holdAt < 0) story.current.holdAt = performance.now(); return; }
      nextPanel();
      return;
    }
    if (event.key === "p" || event.key === "P") {
      if (now === "playing") root.current?.closest(".gp-screen")?.querySelector<HTMLButtonElement>(".gp-fab")?.click();
      return;
    }
    if (dir !== undefined) { if (now !== "over") { event.preventDefault(); press(dir); } return; }
    if (!enter) return;
    // Enter and Space belong to the game, never to the last focused button.
    event.preventDefault();
    if (now === "title") start();
    else if (now === "over" && result) {
      again(nextAfter(result) || result.level, { at: event.timeStamp, repeat: event.repeat });
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    const release = (event: KeyboardEvent) => { if (event.key === " " || event.key === "Enter") story.current.holdAt = -1; };
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", release);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", release); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ঝালমুড়ি সাপ ১২৩৪").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend, cardOpen, phase]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.target as Element).closest("button")) return;
    Object.assign(gesture.current, { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, swiped: false });
    if (session.phase === "story") story.current.holdAt = performance.now();
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (event.pointerId !== g.id || session.phase === "story") return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
    press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    // Re-anchor, so one finger can draw an L and queue two turns.
    g.x = event.clientX; g.y = event.clientY; g.swiped = true;
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (event.pointerId !== g.id) return;
    g.id = -1;
    if (session.phase === "story") { const held = story.current.holdAt >= 0; story.current.holdAt = -1; if (held) nextPanel(); return; }
    if (g.swiped || Math.hypot(event.clientX - g.startX, event.clientY - g.startY) > TAP_SLOP) return;
    const box = event.currentTarget.getBoundingClientRect();
    side(event.clientX - box.left < box.width / 2 ? -1 : 1);
  }
  const cancelGesture = () => { gesture.current.id = -1; story.current.holdAt = -1; };
  // Turn buttons react on touch-down for speed; a keyboard "click" (detail 0) still works.
  const turnButton = (towards: -1 | 1) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary) side(towards); },
    onClick: (event: { detail: number; currentTarget: HTMLButtonElement }) => { if (event.detail === 0) side(towards); event.currentTarget.blur(); },
  });
  /** A game button: act, then give the focus back so Enter and Space reach the game. */
  const act = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };

  const rival = friend ? possessive(friend.name || "বন্ধু") : "";
  const data = level ? levelOf(level) : null;
  const goal = data ? data.goal : 0, offered = level ? chilliesIn(level) : 0;
  const over = phase === "over" && result;
  const cleared = Boolean(result?.level && result.won);
  const nextLevel = nextAfter(result);
  const miss = result ? nearMiss({ ...result, best: result.best }) : "";
  const resultLine = result ? (result.level ? levelLine(result.level, result.stars, result.eaten) : humanLine(result.score)) : "";
  const allStars = totalStars(levels.stars);
  const suggest = recommended(unlock, levels.stars);
  const colors = worldPalettes[WORLDS[worldOf(level)].palette];
  const boardStyle = board.width ? { width: board.width, height: board.height } : undefined;

  return (
    <div className="js" ref={root} data-phase={phase} data-night={colors.night || undefined} data-slow={slow || undefined}>
      <div className="js-field" ref={field} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={cancelGesture}>
        <div className="js-frame" style={board.width ? { width: board.width } : undefined}>
        <div className="js-hud" aria-hidden={phase === "title" || undefined}>
          <p className="js-badge">
            {level ? <><b>{bn(level)}</b><span>{data!.finale ? "ফাইনাল · " : ""}{data!.name}</span></> : <><b>∞</b><span>ক্লাসিক · গতি {bn(speedStep(eaten))}</span></>}
          </p>
          <p className="js-score" aria-live="off">
            {level > 0 && <span className="js-chips" aria-label={`সোনালি মরিচ ${bn(golden)}/${bn(offered)}`}><i className="js-chilli" aria-hidden="true" />{bn(golden)}/{bn(offered)}</span>}
            {hot && <span className="js-hot">ঝাল!</span>}
            <b>{bn(score)}</b>
            {pop.id > 0 && phase === "playing" && <em key={pop.id} className="js-pop">{pop.text}</em>}
          </p>
        </div>
        <div className="js-board" style={boardStyle}>
          {level > 0 && <i className="js-progress" style={{ "--done": eaten / goal } as CSSProperties} aria-hidden="true" />}
          <canvas ref={canvas} role="img" aria-label={`ঝালমুড়ি সাপের মাঠ। স্কোর ${bn(score)}।${level ? ` ${bn(goal)}টার মধ্যে ${bn(eaten)}টা খাওয়া।` : ""}`} />
          {over && (
            <div className="js-slip" role="group" aria-labelledby="js-over-title">
              <h2 id="js-over-title">{cleared ? `লেভেল ${bn(result.level)} পার!` : result.won ? "পুরো ঠোঙা সাবাড়!" : "ঝাল লেগে গেল!"}</h2>
              {!result.won && result.crash && <p className="js-why">{crashLine[result.crash]}</p>}
              {cleared && <StarReveal count={result.stars} />}
              <dl className="js-stats">
                <div><dt>স্কোর</dt><dd className="js-big"><CountUp value={result.score} /></dd></div>
                <div><dt>খাওয়া</dt><dd><CountUp value={result.eaten} />{result.level ? `/${bn(levelOf(result.level).goal)}` : ""}</dd></div>
                <div><dt>সোনালি</dt><dd><CountUp value={result.golden} /></dd></div>
                <div><dt>লম্বা</dt><dd><CountUp value={result.length} /> ঘর</dd></div>
                <div><dt>সময়</dt><dd><CountUp value={result.seconds} /> সে.</dd></div>
              </dl>
              <p className="js-record">{result.record ? "এই ফোনে নতুন রেকর্ড!" : result.level ? resultLine : best !== null && best > result.score ? `এই ফোনে সেরা ${bn(best)}` : humanLine(result.score)}</p>
              {miss && <p className="js-miss">{miss}</p>}
              {friend && (friend.level ?? 0) === result.level && <p className="js-versus">{compareLine(result.score, friend.score, friend.name)}</p>}
              <div className="js-slip-links">
                <button type="button" className="kit-link" onClick={act(() => { sfx.tap(); setCardOpen(true); })}>কার্ড বানাও, বন্ধুকে পাঠাও</button>
                <button type="button" className="kit-link" onClick={act(() => openPicker(true))}>সব লেভেল</button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="js-controls">
        {phase === "over" && result ? (
          nextLevel ? <>
            <button type="button" className="kit-secondary js-again" onClick={act(() => again(result.level))} disabled={!ready}>আবার খেলো</button>
            <button type="button" className="kit-primary js-again" onClick={act(() => again(nextLevel))} disabled={!ready}>পরের লেভেল</button>
          </> : <button type="button" className="kit-primary js-again js-wide" onClick={act(() => again(result.level))} disabled={!ready}>আবার খেলো</button>
        ) : (
          <>
            <button type="button" className="js-turn" aria-label="সাপকে তার বাঁয়ে ঘোরাও" {...turnButton(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-7a4 4 0 0 0-4-4H6" /><path d="M9 5 5 9l4 4" /></svg>বাঁয়ে
            </button>
            <button type="button" className="js-turn" aria-label="সাপকে তার ডানে ঘোরাও" {...turnButton(1)}>
              ডানে<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20v-7a4 4 0 0 1 4-4h6" /><path d="m15 5 4 4-4 4" /></svg>
            </button>
          </>
        )}
      </div>

      {phase === "title" && !picking && (
        <div className="js-title">
          {friend && (
            <section className="js-friend" aria-labelledby="js-friend-title">
              <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${rival} কার্ড: ${bn(friend.score)} পয়েন্ট`} />
              <div>
                <h2 id="js-friend-title">{banner(friend)}</h2>
                <p>{rival} নিজের ফোনের স্কোর</p>
              </div>
            </section>
          )}
          <button type="button" className="js-start" onClick={act(start)} disabled={!inView}>
            <Art className="js-start-art" draw={drawStartArt} label="ঝালমুড়ির ঠোঙা থেকে উঁকি দিচ্ছে সাপ" />
            <span>খেলো</span>
          </button>
          <div className="js-modes" role="group" aria-label="খেলার ধরন">
            <button type="button" aria-pressed={level > 0} onClick={act(() => { if (level) openPicker(true); else choose(suggest); })}>লেভেল{level ? ` ${bn(level)}` : ""}</button>
            <button type="button" aria-pressed={level === 0} onClick={act(() => { if (level) choose(0); })}>ক্লাসিক</button>
          </div>
          <p className="js-line">
            {data ? <><b>{data.finale ? "ফাইনাল: " : ""}{data.name}।</b> {data.teach} <span>{bn(goal)}টা খেলেই পার, {bn(offered)}টা সোনালি মরিচে ৩ তারা।</span></>
              : <><b>যত খুশি লম্বা হও।</b> <span>{best !== null ? `এই ফোনে সেরা ${bn(best)}।` : "প্রতি ৫টায় সাপ একটু জোরে চলে।"}</span></>}
          </p>
          {slow && <p className="js-note">ধীরে খেলো চালু: সাপ ধীরে চলে, তারার নিয়ম একই।</p>}
          <button type="button" className="kit-link js-all" onClick={act(() => openPicker(true))}>সব লেভেল · ★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</button>
        </div>
      )}

      {phase === "story" && (
        <div className="js-story" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={cancelGesture} aria-live="polite">
          <Art className="js-panel" draw={(element, width, height) => drawStoryPanel(element, width, height, panel, worldPalettes.paper)} label={STORY[panel]} />
          <p key={panel} className="js-caption">{STORY[panel]}</p>
          <p className="js-dots" aria-hidden="true">{STORY.map((line, index) => <i key={line} data-on={index <= panel || undefined} />)}</p>
          <p className="js-skip">চেপে ধরো: বাদ দাও</p>
        </div>
      )}

      {picking && (
        <div className="js-picker" role="dialog" aria-modal="false" aria-labelledby="js-picker-title">
          <div className="js-picker-card">
            <h2 id="js-picker-title">লেভেল বাছো <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></h2>
            <div className="js-worlds" role="tablist" aria-label="জগৎ">
              {WORLDS.map((each, index) => <button key={each.name} type="button" role="tab" aria-selected={world === index} onClick={() => setWorld(index)}>{bn(index + 1)}. {each.name}</button>)}
            </div>
            <ol className="js-levels" start={world * LEVELS_PER_WORLD + 1}>
              {LEVELS.slice(world * LEVELS_PER_WORLD, (world + 1) * LEVELS_PER_WORLD).map((each, index) => {
                const number = world * LEVELS_PER_WORLD + index + 1, open = playable(number, unlock, levels.stars, friend?.level), earned = levels.stars[number] ?? 0;
                return <li key={number}>
                  <button type="button" disabled={!open} aria-current={number === level || undefined} onClick={() => choose(number)}>
                    <b className="js-num">{open ? bn(number) : <svg viewBox="0 0 24 24" aria-label="বন্ধ"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}</b>
                    <span className="js-what"><strong>{each.finale ? "ফাইনাল: " : ""}{each.name}</strong><small>{each.teach}</small></span>
                    {number === suggest && open ? <em className="js-rec">এটা খেলো</em> : <span className="gx-stars" aria-label={`${bn(earned)} তারা`}>{[0, 1, 2].map(star => <span key={star} className={star < earned ? "on" : ""}>★</span>)}</span>}
                  </button>
                </li>;
              })}
            </ol>
            <button type="button" className="js-classic" aria-current={level === 0 || undefined} onClick={() => choose(0)}><b className="js-num">∞</b><span className="js-what"><strong>ক্লাসিক</strong><small>দেয়াল নেই, শেষ নেই। শুধু সেরা স্কোর।</small></span></button>
            <button type="button" className="js-back" onClick={() => openPicker(false)}>ফিরে যাও</button>
          </div>
        </div>
      )}

      {cardOpen && card && result && (
        <div className="js-cardpanel" role="dialog" aria-modal="false" aria-labelledby="js-result-title">
          <div className="js-cardpanel-head">
            <h2 id="js-result-title"><em>{bn(result.score)}</em> পয়েন্ট, ঠোঙার কার্ড তৈরি</h2>
            <button type="button" className="kit-secondary" onClick={() => setCardOpen(false)}>ফিরে যাও</button>
          </div>
          <p className="js-cardpanel-line">{friend && (friend.level ?? 0) === result.level ? compareLine(result.score, friend.score, friend.name) : resultLine}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="js-card-summary" />
            <figcaption id="js-card-summary" className="js-sr">ঝালমুড়ি সাপের কার্ড: {card.name && `${card.name}, `}{result.level ? `লেভেল ${bn(result.level)}, ` : ""}{bn(card.score)} পয়েন্ট। {resultLine}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="js-share">
            <label className="js-name">
              <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="jhalmuri-sap.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক একই ঠোঙা পাবে, একই খাবার একই ক্রমে।" />
          </div>
        </div>
      )}

      <p className="js-sr" aria-live="polite">{over && result ? `খেলা শেষ। ${bn(result.score)} পয়েন্ট। ${cleared ? `লেভেল ${bn(result.level)} পার, ${bn(result.stars)} তারা।` : ""}${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""} ${miss}` : ""}</p>
    </div>
  );
}
