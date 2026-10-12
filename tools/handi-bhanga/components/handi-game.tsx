"use client";
// IP: what we avoided — no "Breakout"/"Arkanoid" or any arcade name, no rainbow wall of bricks, no lettered power-up capsules, no capsule spaceship paddle, no space setting or arcade bleeps; ours is a মেলা stall with painted clay pots on ropes, a cloth ball and a bamboo লাঠি, and nobody is blindfolded.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, fitCanvas, hiss, newSeed, readLevels, sfx, shake, tone, totalStars, unlockedLevel, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawAim, drawBall, drawPot, drawStall, drawStick, palette, DESIGN_BODY, DESIGN_PAINT } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { banner, bn, caption, migrateBest, nearLine, parseShared, sharedHash, starsOf, tallyLine, CHANCES, LEVEL_COUNT, LEVELS, POTS, type Shared } from "../lib/link";
import {
  compareLine, createGame, humanLine, launch, launchDir, moveStick, nudge, potTop, potX, step, swayOf, windOf,
  BALL_R, CELL, COLS, DESIGNS, H, POT_DROP, POT_H, POT_W, STICK_H, STICK_W, STICK_Y, W, type Game, type GameEvent,
} from "../lib/game";

const TOOL = "handi-bhanga";
type Phase = "ready" | "playing" | "paused" | "over";
type Result = { seed: number; score: number; record: boolean; won: boolean; level: number; stars: number; before: number | null };
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

/** The লাঠি's swish as the ball goes up. */
const swish = () => hiss(0.18, 0.12, 2600, "bandpass");
/** The cloth ball on the bamboo. */
const tock = () => tone(480, 0.05, 0.09, "triangle", 0, 300);
/** The signature sound: a tough clay pot rings when it cracks. */
const ring = () => { tone(420, 0.3, 0.1, "sine"); tone(840, 0.18, 0.035, "sine", 0.01); };
/** A pot breaking: a burst of clay over a low knock. */
const smash = () => { hiss(0.28, 0.22, 2200, "bandpass"); tone(150, 0.12, 0.14, "sine", 0, 60); };

const MAX_WIDTH = 420;
const TAP_SLOP = 10;
/** The stick travels a little further than the thumb, so a short slide anywhere covers the whole stall. */
const GAIN = 1.25;
/** A keyboard "click" on ◀ or ▶ moves the stick this far. */
const KEY_STEP = 40;
const SHARDS = 36;
/** One pot sprite: a cell wide, rim to belly plus a margin for the tough pots' taller lip. */
const SPRITE_H = 42;
const SPRITE_TOP = 3;
const SWING = 0.9;
const SHARD_COLORS = [...DESIGN_BODY, ...DESIGN_PAINT, palette.toughBody, palette.white];

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, height: 0, scale: 1,
    background: null as HTMLCanvasElement | null,
    atlas: null as HTMLCanvasElement | null,
    ball: null as HTMLCanvasElement | null,
    stick: null as HTMLCanvasElement | null,
    cw: 0, ch: 0,
    clock: 0, spin: 0, squashAt: -10,
    swingAt: new Float32Array(POTS).fill(-10),
    sx: new Float32Array(SHARDS), sy: new Float32Array(SHARDS), vx: new Float32Array(SHARDS), vy: new Float32Array(SHARDS),
    rot: new Float32Array(SHARDS), vr: new Float32Array(SHARDS), life: new Float32Array(SHARDS), color: new Uint8Array(SHARDS),
    calm: false, reduced: false,
    /** Pots broken since the ball last touched the stick: a run climbs in pitch. */
    run: 0,
    held: { left: false, right: false, button: 0 },
    gesture: { id: -1, lastX: 0, startX: 0, startY: 0, moved: false },
  };
}

export function HandiGame() {
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [chances, setChances] = useState(CHANCES);
  const [resting, setResting] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  // Level 1 keeps the key the one-stall game used, so the old best stays level 1's best.
  const [best, submitBest] = useBest(level === 1 ? TOOL : `${TOOL}-${level}`);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const levelRef = useRef(1);
  levelRef.current = level;
  const timers = useRef<number[]>([]);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [restartReady, setRestartReady] = useState(true);
  const [settling, setSettling] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [live] = useState(makeLive);
  const play = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const phaseRef = useRef<Phase>("ready");
  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const [firstGame] = useState(() => createGame(1));
  const game = useRef<Game>(firstGame);
  const seed = useRef(1);
  const boardInView = useInView(board);

  const card = result ? { score: result.score, name: cleanName(name), level: result.level } : null;
  const state = result ? sharedHash({ seed: result.seed, score: result.score, name, level: result.level }) : "";
  const stall = LEVELS[level - 1];
  const allStars = totalStars(levels.stars);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const rivalCard = friend && friend.level === level ? friend : null;

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }

  function reset(nextSeed: number, nextLevel = levelRef.current) {
    timers.current.forEach(clearTimeout); timers.current = [];
    game.current = createGame(nextSeed, nextLevel);
    seed.current = nextSeed;
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    live.run = 0;
    live.life.fill(0);
    live.swingAt.fill(-10);
    setScore(0);
    setChances(CHANCES);
    setResting(true);
    draw();
  }

  /** A tap, Space or the start button: sends a resting ball up. */
  function throwBall() {
    const now = phaseRef.current;
    if (now !== "ready" && now !== "playing") return;
    if (!launch(game.current)) return;
    swish();
    setResting(false);
    if (now !== "ready") return;
    go("playing");
    // On a short laptop screen the stick can sit below the fold; bring the whole stall into view once.
    const box = play.current;
    if (box && box.getBoundingClientRect().bottom > window.innerHeight) box.scrollIntoView({ block: "end", behavior: live.reduced ? "auto" : "smooth" });
  }
  function pause() { if (phaseRef.current === "playing") { live.held.button = 0; go("paused"); } }
  function resume() { if (phaseRef.current === "paused") go("playing"); }
  function restart() {
    if (phaseRef.current !== "over" || !restartReady) return;
    reset(rivalCard ? rivalCard.seed : newSeed());
    go("playing");
  }
  /** The level picker and "পরের লেভেল": a fresh stall on the ready screen (the friend's, when it's their level). */
  function pick(nextLevel: number) {
    reset(friend && friend.level === nextLevel ? friend.seed : newSeed(), nextLevel);
    go("ready");
    if ((play.current?.getBoundingClientRect().top ?? 0) < 0) play.current?.scrollIntoView({ behavior: live.reduced ? "auto" : "smooth", block: "center" });
  }

  /** Vibration follows the site's sound switch (the kit's buzz) and stays off in slow mode. */
  const shakePhone = (ms: number) => { if (!slowRef.current) buzz(ms); };

  function burst(index: number) {
    const g = game.current, cx = potX(g, index) + POT_W / 2, cy = potTop(index) + POT_H * 0.55;
    const body = g.tough[index] ? 12 : g.design[index], paint = g.tough[index] ? 13 : 6 + g.design[index];
    for (let i = 0, made = 0; i < SHARDS && made < 6; i++) {
      if (live.life[i] > 0) continue;
      live.sx[i] = cx + (Math.random() - 0.5) * 16; live.sy[i] = cy + (Math.random() - 0.5) * 12;
      live.vx[i] = (Math.random() - 0.5) * 170; live.vy[i] = -50 - Math.random() * 90;
      live.rot[i] = Math.random() * 6.3; live.vr[i] = (Math.random() - 0.5) * 14;
      live.life[i] = 0.7; live.color[i] = made % 3 === 2 ? paint : body;
      made++;
    }
  }

  function finish(won: boolean) {
    const g = game.current;
    go("over");
    setScore(g.score);
    setResting(false);
    const stars = starsOf(g.score, g.level), record = best !== null && g.score > best;
    if (stars) levels.record(g.level, stars);
    setResult({ seed: seed.current, score: g.score, record, won, level: g.level, stars, before: best });
    submitBest(g.score);
    // The stars chime in one by one (StarReveal); the fanfare follows them, confetti only for 3 stars or a new best.
    const after = (stars + 1) * 260;
    if (stars === 3 || record) timers.current.push(window.setTimeout(() => { sfx.levelUp(); confetti(); }, after));
    else if (stars) timers.current.push(window.setTimeout(sfx.good, after));
    else sfx.lose();
    // Thumbs are still on the stick when the last ball drops; don't let that tap skip the result.
    setRestartReady(false);
    window.setTimeout(() => setRestartReady(true), 700);
    // Let the last shards land before the loop stops.
    setSettling(true);
    window.setTimeout(() => setSettling(false), 900);
  }

  function onEvent(event: GameEvent, pot: number) {
    const g = game.current;
    if (event === "break") {
      setScore(g.score); if (!live.calm) burst(pot); shakePhone(8);
      smash();
      if (++live.run >= 2) sfx.combo(live.run - 2);
    }
    else if (event === "crack") { live.swingAt[pot] = live.clock; shakePhone(4); ring(); }
    else if (event === "stick") { live.squashAt = live.clock; live.run = 0; tock(); }
    else if (event === "lost") {
      live.run = 0;
      setChances(g.chances);
      if (!g.over) { setResting(true); sfx.wrong(); shake(board.current); }
    }
    else if (event === "win" || event === "over") finish(event === "win");
  }

  function tick(dt: number) {
    live.clock += dt;
    for (let i = 0; i < SHARDS; i++) {
      if (live.life[i] <= 0) continue;
      live.sx[i] += live.vx[i] * dt; live.sy[i] += live.vy[i] * dt; live.vy[i] += 700 * dt; live.rot[i] += live.vr[i] * dt; live.life[i] -= dt;
    }
    const now = phaseRef.current;
    if (now !== "playing" && now !== "ready") return;
    const g = game.current, held = (live.held.right ? 1 : 0) - (live.held.left ? 1 : 0) + live.held.button;
    if (held) nudge(g, Math.sign(held), dt);
    const wasX = g.x;
    step(g, dt, slowRef.current, onEvent);
    live.spin += (g.x - wasX) / BALL_R;
  }

  function draw() {
    const c = live.context, atlas = live.atlas, ball = live.ball, stick = live.stick;
    if (!c || !live.background || !atlas || !ball || !stick) return;
    const g = game.current, calm = live.calm, t = live.clock, { cw, ch } = live;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(live.background, 0, 0, W, H);
    for (let i = 0; i < POTS; i++) {
      const hits = g.hits[i];
      if (hits <= 0) continue;
      const sx = g.design[i] * cw, sy = (g.tough[i] ? (hits === 2 ? 1 : 2) : 0) * ch;
      const sway = swayOf(g, Math.floor(i / COLS));
      const cx = potX(g, i) + POT_W / 2 - sway, top = potTop(i) - 1 - SPRITE_TOP;
      const since = t - live.swingAt[i];
      if ((!calm && since < SWING) || sway) {
        // A cracked pot swings on its string about its knot; on a breezy stall the whole rope sways (the pot's middle sits `sway` off).
        const knot = potTop(i) - POT_DROP;
        c.save();
        c.translate(cx, knot); c.rotate((!calm && since < SWING ? 0.22 * Math.exp(-since * 4) * Math.sin(since * 16) : 0) - sway / 24);
        c.drawImage(atlas, sx, sy, cw, ch, -CELL / 2, top - knot, CELL, SPRITE_H);
        c.restore();
      } else c.drawImage(atlas, sx, sy, cw, ch, cx - CELL / 2, top, CELL, SPRITE_H);
    }

    // The pennant on the awning leans with the wind, so the ball's bend is never a surprise.
    const wind = windOf(g);
    if (wind) {
      const lean = Math.max(-1, Math.min(1, wind / 0.25)), flap = calm ? 0 : Math.sin(t * 9) * 1.5;
      c.fillStyle = palette.white; c.strokeStyle = palette.rope; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(W / 2, 14); c.lineTo(W / 2, 40); c.stroke();
      c.beginPath(); c.moveTo(W / 2, 15); c.lineTo(W / 2 + lean * 22, 20 + flap); c.lineTo(W / 2, 27); c.closePath(); c.fill(); c.stroke();
    }

    const squash = !calm && t - live.squashAt < 0.14 ? 1 - (t - live.squashAt) / 0.14 : 0;
    const sw = (STICK_W + 4) * (1 + 0.06 * squash), sh = (STICK_H + 4) * (1 - 0.3 * squash);
    c.drawImage(stick, g.stick - sw / 2, STICK_Y + STICK_H + 2 - sh, sw, sh);

    const now = phaseRef.current;
    if (g.resting && now !== "over") { const ax = launchDir(g.stick); drawAim(c, g.x, g.y, ax, -Math.sqrt(1 - ax * ax)); }
    if (!g.over || g.won) {
      const size = BALL_R * 2 + 4;
      c.save();
      c.translate(g.x, g.y); c.rotate(calm ? 0 : live.spin);
      c.drawImage(ball, -size / 2, -size / 2, size, size);
      c.restore();
    }

    for (let i = 0; i < SHARDS; i++) {
      const life = live.life[i];
      if (life <= 0) continue;
      const x = live.sx[i], y = live.sy[i], cos = Math.cos(live.rot[i]) * 3.6, sin = Math.sin(live.rot[i]) * 3.6;
      c.globalAlpha = Math.min(1, life * 2.5);
      c.fillStyle = SHARD_COLORS[live.color[i]];
      c.beginPath();
      c.moveTo(x + cos, y + sin);
      c.lineTo(x - sin * 0.8 - cos * 0.5, y + cos * 0.8 - sin * 0.5);
      c.lineTo(x + sin * 0.7 - cos * 0.8, y - cos * 0.7 - sin * 0.8);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d")!;
    b.setTransform(k, 0, 0, k, 0, 0);
    drawStall(b);

    const cw = Math.ceil(CELL * k), ch = Math.ceil(SPRITE_H * k);
    const atlas = live.atlas ??= document.createElement("canvas");
    atlas.width = cw * DESIGNS; atlas.height = ch * 3;
    const a = atlas.getContext("2d")!;
    for (let d = 0; d < DESIGNS; d++) for (let row = 0; row < 3; row++) {
      a.setTransform(k, 0, 0, k, d * cw, row * ch);
      drawPot(a, CELL / 2, SPRITE_TOP, POT_W, d, row > 0, row === 2);
    }
    Object.assign(live, { cw, ch });

    const size = BALL_R * 2 + 4;
    const ball = live.ball ??= document.createElement("canvas");
    ball.width = ball.height = Math.ceil(size * k);
    const bc = ball.getContext("2d")!;
    bc.setTransform(k, 0, 0, k, 0, 0);
    drawBall(bc, size / 2, size / 2, BALL_R);

    const stick = live.stick ??= document.createElement("canvas");
    stick.width = Math.ceil((STICK_W + 4) * k); stick.height = Math.ceil((STICK_H + 4) * k);
    const sc = stick.getContext("2d")!;
    sc.setTransform(k, 0, 0, k, 0, 0);
    drawStick(sc, (STICK_W + 4) / 2, 2, STICK_W, STICK_H);
  }

  useGameLoop(tick, draw, phase === "playing" || (phase === "ready" && boardInView) || settling);

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    live.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const scale = width / W, height = Math.round(H * scale);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      Object.assign(live, { width, height, scale, context: fitCanvas(element, width, height) });
      paint();
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // In-page jumps don't touch the hash, so only a real challenge link counts.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      reset(shared.seed, shared.level);
      go("ready");
    };
    setSite(window.location.host);
    // Before levels this phone kept one best score; it becomes level 1's stars once.
    let saved = readLevels(stored(`ektukhani-levels-${TOOL}`), LEVEL_COUNT);
    const moved = migrateBest(saved, stored(`ektukhani-best-${TOOL}`));
    if (moved) { levels.record(1, moved); saved = { 1: moved }; }
    if (!parseShared(window.location.hash)) reset(newSeed(), unlockedLevel(saved, LEVEL_COUNT));
    readFriend();
    const letGo = () => { live.held.left = live.held.right = false; live.held.button = 0; };
    const hide = () => { if (document.hidden) { letGo(); pause(); } };
    window.addEventListener("hashchange", readFriend);
    window.addEventListener("blur", letGo);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); window.removeEventListener("blur", letGo); document.removeEventListener("visibilitychange", hide); timers.current.forEach(clearTimeout); };
  }, []);

  // Scrolling the stall away mid-game pauses it, so no ball drops off-screen.
  useEffect(() => { if (!boardInView) pause(); }, [boardInView]);
  // A drag or a slow-mode switch while nothing is running still has to show.
  useEffect(() => { draw(); }, [slow]);

  const keyHandler = useRef<(event: KeyboardEvent, down: boolean) => void>(() => {});
  keyHandler.current = (event, down) => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key, now = phaseRef.current, active = now === "ready" || now === "playing";
    const left = key === "ArrowLeft" || key === "a" || key === "A", right = key === "ArrowRight" || key === "d" || key === "D";
    if (left || right) {
      if (left) live.held.left = down; else live.held.right = down;
      if (active && boardInView) event.preventDefault();
      return;
    }
    if (!down || !boardInView) return;
    if (key === "Escape" || key === "p" || key === "P") { if (now === "playing") pause(); else resume(); return; }
    if (key !== " " && key !== "Enter" && key !== "ArrowUp") return;
    if (key !== "ArrowUp" && target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (active) throwBall(); else if (now === "paused") resume(); else if (key !== "ArrowUp") restart();
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keyHandler.current(event, true);
    const up = (event: KeyboardEvent) => keyHandler.current(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("হাঁড়িভাঙা ৩৫টার ১২৩৪").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // Keep following a finger that slides off the element; a pointer that is already gone can't be captured, and that's fine.
  const capture = (event: ReactPointerEvent<HTMLElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ } };
  // Drag anywhere on the stall or the strip under it: the stick follows the thumb's sideways slide, never under it. A still tap throws.
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.target as Element).closest("button:not(.hb-pad)")) return;
    const now = phaseRef.current;
    if (now !== "ready" && now !== "playing") return;
    Object.assign(live.gesture, { id: event.pointerId, lastX: event.clientX, startX: event.clientX, startY: event.clientY, moved: false });
    capture(event);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.lastX;
    gesture.lastX = event.clientX;
    if (!gesture.moved && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > TAP_SLOP) gesture.moved = true;
    const now = phaseRef.current;
    if (now === "ready" || now === "playing") moveStick(game.current, game.current.stick + (dx * GAIN) / live.scale);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    gesture.id = -1;
    if (!gesture.moved) throwBall();
  }
  // ◀ ▶ move the stick while held; a keyboard "click" (detail 0) steps it.
  const holdButton = (dir: -1 | 1) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (!event.isPrimary) return; live.held.button = dir; capture(event); },
    onPointerUp: () => { live.held.button = 0; },
    onPointerLeave: () => { live.held.button = 0; },
    onPointerCancel: () => { live.held.button = 0; },
    onLostPointerCapture: () => { live.held.button = 0; },
    onClick: (event: { detail: number }) => {
      const now = phaseRef.current;
      if (event.detail === 0 && (now === "ready" || now === "playing")) { moveStick(game.current, game.current.stick + dir * KEY_STEP); draw(); }
    },
  });
  function seeCard() {
    resultBox.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  function playFromCard() {
    reset(rivalCard ? rivalCard.seed : newSeed());
    go("ready");
    play.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  const rival = friend ? possessive(friend.name || "বন্ধু") : "";
  const over = phase === "over" && result;
  const won = Boolean(result && result.stars > 0);
  const hasNext = phase === "over" && won && level < LEVEL_COUNT;
  const near = result ? nearLine(result.score, result.level, result.before) : "";
  const versus = result && rivalCard && rivalCard.seed === result.seed ? compareLine(result.score, rivalCard.score, rivalCard.name) : "";
  const hint = chances === CHANCES ? "চাপ দাও, বল ছোড়ো" : chances === 1 ? "শেষ চান্স! চাপ দাও, বল ছোড়ো" : `${bn(chances)}টা চান্স বাকি। চাপ দাও, বল ছোড়ো`;

  return (
    <div className="hb">
      {friend && (
        <section className="hb-friend" aria-labelledby="hb-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${rival} কার্ড: লেভেল ${bn(friend.level)}, ${bn(friend.score)} পয়েন্ট`} />
          <div>
            <h2 id="hb-friend-title">{banner(friend)}</h2>
            <p>{rival} নিজের ফোনের স্কোর</p>
          </div>
        </section>
      )}

      <p className="hb-level"><span><b>লেভেল {bn(level)}</b> · {stall.name}</span><span>{best !== null && <small>সেরা {bn(best)} · </small>}<span aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></span></p>
      <div className="hb-hud">
        <p className="hb-score"><span>স্কোর</span><b>{bn(score)}</b></p>
        <p className="hb-chances">
          <span className="hb-sr">চান্স বাকি {bn(chances)}টা</span>
          {[0, 1, 2].map(i => <i key={i} data-on={i < chances} aria-hidden="true" />)}
        </p>
        <button type="button" className="hb-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="12" r="5.5" /><path d="M10 12a2 2 0 1 0 2-2M2.5 18h15a3 3 0 0 0 3-3v-4m0 0-1.2-3m1.2 3 1.8-2.4" /></svg>ধীরে খেলো
        </button>
        <SoundToggle compact className="hb-sound" />
        <button type="button" className="hb-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"} aria-label={phase === "paused" ? "চালিয়ে যাও" : "একটু থামাও"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{phase === "paused" ? <path d="M8 5v14l11-7z" className="hb-fill" /> : <path d="M9 5v14M15 5v14" />}</svg>
        </button>
      </div>

      <div className="hb-play" ref={play} data-phase={phase} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { live.gesture.id = -1; }}>
        <div className="hb-board" ref={board}>
          <canvas ref={canvas} role="img" aria-label={`মেলার দোকানে দড়িতে ঝোলানো হাঁড়ি। স্কোর ${bn(score)}, চান্স বাকি ${bn(chances)}টা।`} />
          {phase === "ready" && (
            <div className="hb-overlay" data-at="middle">
              <div className="hb-note">
                <p className="hb-howto">{level === 1 ? <><b>আঙুল সরাও</b>, হাঁড়ি ভাঙো</> : <><b>লেভেল {bn(level)}</b> · {stall.name}</>}</p>
                {level > 1 && <p className="hb-note-line">{stall.note}</p>}
                <button type="button" className="kit-primary" onClick={throwBall}>শুরু করো</button>
              </div>
            </div>
          )}
          {phase === "playing" && resting && <p className="hb-hint" aria-live="polite">{hint}</p>}
          {phase === "paused" && (
            <div className="hb-overlay hb-block">
              <div className="hb-note">
                <p className="hb-howto">থেমে আছে। তৈরি হলে চাপো।</p>
                <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
              </div>
            </div>
          )}
          <p className="screen-reader-only" aria-live="polite">{over && result ? `খেলা শেষ। ${bn(result.score)} পয়েন্ট। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${near} ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
          {over && (
            <div className="hb-overlay hb-block">
              <div className="hb-note hb-slip">
                <h2>{result.won ? "দোকান সাফ!" : "চান্স শেষ!"}</h2>
                {result.stars > 0 && <StarReveal count={result.stars} />}
                <p className="hb-tally">{tallyLine(result.score)}</p>
                <p className="hb-final"><b>{bn(result.score)}</b> পয়েন্ট</p>
                {near && <p className="hb-near">{near}</p>}
                <p className="hb-record">{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && best > result.score ? `এই লেভেলে সেরা ${bn(best)}` : humanLine(result.score)}</p>
                {versus && <p className="hb-versus">{versus}</p>}
                <button type="button" className="kit-link hb-see" onClick={seeCard}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
              </div>
            </div>
          )}
        </div>

        <div className="hb-controls">
          {phase === "over" ? (
            <>
              {hasNext && <button type="button" className="kit-primary hb-again" onClick={() => pick(level + 1)} disabled={!restartReady}>পরের লেভেল</button>}
              <button type="button" className={hasNext ? "kit-secondary hb-again" : "kit-primary hb-again"} onClick={restart} disabled={!restartReady}>{won ? "আবার খেলো" : "আরেকবার"}</button>
            </>
          ) : (
            <>
              <button type="button" className="hb-move" aria-label="লাঠি বাঁয়ে সরাও" {...holdButton(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
              </button>
              <button type="button" className="hb-pad" aria-label="বল ছোড়ো" onClick={event => { if (event.detail === 0) throwBall(); }}>
                <span aria-hidden="true">{phase === "paused" ? "থেমে আছে" : resting ? "চাপো, বল ছোড়ো" : <><svg viewBox="0 0 24 24"><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" /></svg>এখানেও টানো</>}</span>
              </button>
              <button type="button" className="hb-move" aria-label="লাঠি ডানে সরাও" {...holdButton(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      <details className="hb-levels">
        <summary>সব লেভেল <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>দশটা মেলার দোকান। পরের দোকানে মোটা হাঁড়ি বেশি, দড়ি দোলে, বাতাসে বল বাঁকে। পার হলে পরেরটা খোলে, খোলা দোকান খোলাই থাকে।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={pick} />
      </details>

      <section className="hb-result" id="result" ref={resultBox} aria-labelledby="hb-result-title">
        <div className="hb-result-head">
          <h2 id="hb-result-title">{result ? <><em>{tallyLine(result.score)}</em>, কার্ড তৈরি</> : "খেলা শেষে তোমার হাঁড়িভাঙার কার্ড"}</h2>
          <p>{result ? versus || humanLine(result.score) : "একবার খেললেই এখানে স্কোরসহ একটা কার্ড আসবে। বন্ধুকে পাঠালে সে ঠিক একই হাঁড়ির সারি পাবে।"}</p>
        </div>
        {card && (
          <div className="hb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="hb-card-summary" />
              <figcaption id="hb-card-summary" className="hb-sr">হাঁড়িভাঙার কার্ড: {card.name && `${card.name}, `}লেভেল {bn(card.level)}, {tallyLine(card.score)}, {bn(card.score)} পয়েন্ট। {humanLine(card.score)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="hb-share">
              <label className="hb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="handi-bhanga.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক একই হাঁড়ির সারি পাবে, একই জায়গায় একই মোটা হাঁড়ি।" />
              <button type="button" className="kit-link hb-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
