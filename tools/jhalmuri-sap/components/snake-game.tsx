"use client";
// IP: what we avoided — no "Snake"/"Snake II"/"Xenzia" or phone-maker name, no phone silhouette or keypad, no green LCD palette, pixel font, blocky pixel snake or ringtone; ours is a round teal cartoon snake on newsprint inside a tin fence, eating ঝালমুড়ি.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, fitCanvas, hiss, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawFood, drawHead, drawTin, palette } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { chilliesIn, levelInterval, levelOf, levelStars, LEVEL_COUNT } from "../lib/levels";
import { banner, bn, caption, parseShared, sharedHash, type Shared } from "../lib/link";
import { compareLine, createGame, humanLine, interval, levelLine, nearMiss, speedStep, step, turn, turnSide, BONUS_LIFE, CELLS, COLS, FOODS, ROWS, type Dir, type Game } from "../lib/snake";

const TOOL = "jhalmuri-sap";
type Phase = "ready" | "playing" | "paused" | "over";
/** level 0: the classic endless game. */
type Result = { seed: number; score: number; record: boolean; won: boolean; level: number; golden: number; eaten: number; stars: number; before: number; best: number | null };

// The game's sounds, all made in code by the shared kit: a মুড়ি crunch that climbs with the combo, a tin clang, a speed-up chime.
const crunch = (combo: number) => { hiss(0.05, 0.16, 2600, "bandpass"); hiss(0.05, 0.11, 1700, "bandpass", 0.05); if (combo > 1) sfx.combo(combo - 2); };
const clang = () => { tone(330, 0.32, 0.06, "square", 0, 262); hiss(0.18, 0.08, 3200, "highpass"); sfx.wrong(); };
const faster = () => { tone(784, 0.1, 0.08, "triangle"); tone(1175, 0.16, 0.07, "triangle", 0.08); };

/** Stars that pop in one by one, each with its own note. */
function StarReveal({ count }: { count: number }) {
  useEffect(() => {
    const timers = [0, 1, 2].filter(index => index < count).map(index => window.setTimeout(() => sfx.star(index), 300 + index * 240));
    return () => timers.forEach(window.clearTimeout);
  }, [count]);
  return <span className="gx-stars js-stars" role="img" aria-label={`৩টার মধ্যে ${bn(count)}টা তারা`}>
    {[0, 1, 2].map(index => <span key={index} className={index < count ? "on gx-pop" : ""} style={{ animationDelay: `${300 + index * 240}ms` }}>★</span>)}
  </span>;
}

const SWIPE = 22;
const TAP_SLOP = 14;
const KEYS: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3 };
const SPRITES = [...FOODS, "sonali"] as const;
const PARTICLES = 18;
const MAX_WIDTH = 420;

const centerX = (cell: number, fence: number, size: number) => fence + (cell % COLS + 0.5) * size;
const centerY = (cell: number, fence: number, size: number) => fence + (Math.floor(cell / COLS) + 0.5) * size;

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, height: 0, fence: 0, cell: 0,
    background: null as HTMLCanvasElement | null,
    sprites: null as HTMLCanvasElement | null,
    spriteSize: 0,
    font: "",
    acc: 0,
    // No moves before this time: a breath after resuming or restarting.
    hold: 0,
    prev: new Int16Array(CELLS), prevLength: 0,
    points: new Float32Array(CELLS * 2),
    bulges: new Int16Array(4).fill(-1),
    px: new Float32Array(PARTICLES), py: new Float32Array(PARTICLES), vx: new Float32Array(PARTICLES), vy: new Float32Array(PARTICLES), life: new Float32Array(PARTICLES),
    floatAt: -1, floatText: "", floatX: 0, floatY: 0, floatGold: false,
    shakeUntil: 0, crashAt: 0,
    gesture: { id: -1, x: 0, y: 0, startX: 0, startY: 0, swiped: false },
  };
}

export function SnakeGame() {
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [eaten, setEaten] = useState(0);
  const [golden, setGolden] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  // 0 is the classic endless game; levels start at 1.
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const chosen = useRef(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [restartReady, setRestartReady] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [live] = useState(makeLive);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const phaseRef = useRef<Phase>("ready");
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const [firstGame] = useState(() => createGame(1));
  const game = useRef<Game>(firstGame);
  const seed = useRef(1);
  const boardInView = useInView(board);

  const card = result ? { score: result.score, name: cleanName(name), level: result.level, golden: result.golden } : null;
  const state = result ? sharedHash({ seed: result.seed, score: result.score, name, level: result.level, golden: result.golden }) : "";

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }

  function reset(nextSeed: number, nextLevel = levelRef.current) {
    const repaint = nextLevel !== levelRef.current;
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    game.current = createGame(nextSeed, nextLevel);
    seed.current = nextSeed;
    if (repaint && live.context) paintBoard();
    live.acc = 0;
    live.prevLength = 0;
    live.bulges.fill(-1);
    live.life.fill(0);
    live.floatAt = -1;
    setScore(0); setEaten(0); setGolden(0);
    draw();
  }

  function start() { if (phaseRef.current === "ready") { live.acc = 0; go("playing"); } }
  function pause() { if (phaseRef.current === "playing") go("paused"); }
  // A breath after resuming, to see where the snake is heading before it moves again.
  function resume() { if (phaseRef.current === "paused") { live.hold = performance.now() + 600; go("playing"); } }
  function restart(nextLevel = levelRef.current) {
    if (phaseRef.current !== "over" || !restartReady) return;
    reset(friend && friendFits(nextLevel) ? friend.seed : newSeed(), nextLevel);
    live.hold = performance.now() + 350;
    go("playing");
    sfx.tap();
  }
  const friendFits = (forLevel: number) => Boolean(friend) && (friend!.level ?? 0) === forLevel;

  /** Picks a level or the classic game from the menu: back to the ready screen, board in view. */
  function choose(nextLevel: number) {
    chosen.current = true;
    reset(friendFits(nextLevel) ? friend!.seed : newSeed(), nextLevel);
    setResult(null);
    go("ready");
    board.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  /** A swipe or an arrow key: an absolute direction. */
  function press(dir: Dir) {
    const now = phaseRef.current;
    if (now === "ready") start();
    else if (now === "paused") resume();
    else if (now !== "playing") return;
    if (turn(game.current, dir)) sfx.tap();
  }

  /** A tap on one half of the board, or a turn button. A tap on the board in "ready" only starts, so the first touch never steers by surprise. */
  function side(towards: -1 | 1, steerAtStart: boolean) {
    const now = phaseRef.current;
    if (now === "ready") { start(); if (!steerAtStart) return; }
    else if (now === "paused") { resume(); return; }
    else if (now !== "playing") return;
    if (turnSide(game.current, towards)) sfx.tap();
  }

  function feedback(golden: boolean, sped: boolean) {
    const g = game.current, { fence, cell } = live;
    setScore(g.score);
    setEaten(g.eaten); setGolden(g.golden);
    crunch(g.combo);
    if (golden) sfx.coin();
    if (sped) faster();
    const x = centerX(g.body[0], fence, cell), y = centerY(g.body[0], fence, cell);
    live.floatAt = performance.now(); live.floatX = x; live.floatY = y - cell * 0.6; live.floatGold = golden || sped;
    live.floatText = sped ? `গতি ${bn(speedStep(g.eaten))}` : `${golden ? "+৩০" : "+১০"}${g.combo > 2 ? ` ×${bn(g.combo)}` : ""}`;
    const slot = live.bulges.indexOf(-1);
    live.bulges[slot < 0 ? 0 : slot] = 0;
    if (slowRef.current) return;
    for (let i = 0, made = 0; i < PARTICLES && made < 7; i++) {
      if (live.life[i] > 0) continue;
      live.px[i] = x; live.py[i] = y;
      live.vx[i] = (Math.random() - 0.5) * cell * 9; live.vy[i] = -(0.4 + Math.random()) * cell * 6;
      live.life[i] = 0.45; made++;
    }
  }

  function finish(won: boolean) {
    const g = game.current, at = levelRef.current;
    live.crashAt = performance.now();
    if (!won && !slowRef.current) live.shakeUntil = live.crashAt + 260;
    go("over");
    setScore(g.score);
    const stars = at && won ? levelStars(at, g.golden) : 0, before = at ? levels.stars[at] ?? 0 : 0;
    const record = at ? false : best !== null && g.score > best;
    setResult({ seed: seed.current, score: g.score, record, won, level: at, golden: g.golden, eaten: g.eaten, stars, before, best });
    if (at) { if (stars) levels.record(at, stars); }
    else submitBest(g.score);
    if (!won) clang();
    else if (!at) sfx.win();
    // Three stars, a better result on a level or a new best: confetti (the kit skips it in ধীরে খেলো). A plain clear gets the stars' own notes.
    if (record || stars === 3 || (stars && at === LEVEL_COUNT)) window.setTimeout(() => { if (record) sfx.win(); else sfx.levelUp(); confetti(); }, record ? 150 : 1100);
    else if (stars) window.setTimeout(sfx.good, 1100);
    // Fingers are still tapping the turn buttons when the snake crashes; don't let those taps skip the result.
    setRestartReady(false);
    window.setTimeout(() => setRestartReady(true), 700);
  }

  function tick(dt: number) {
    for (let i = 0; i < PARTICLES; i++) {
      if (live.life[i] <= 0) continue;
      live.px[i] += live.vx[i] * dt; live.py[i] += live.vy[i] * dt; live.vy[i] += live.cell * 30 * dt; live.life[i] -= dt;
    }
    if (phaseRef.current !== "playing" || performance.now() < live.hold) return;
    const g = game.current, every = g.goal ? levelInterval(levelRef.current, slowRef.current) : interval(g.eaten, slowRef.current);
    live.acc += dt * 1000;
    if (live.acc < every) return;
    live.acc = Math.min(live.acc - every, every);
    live.prev.set(g.body);
    live.prevLength = g.body.length;
    const speed = speedStep(g.eaten);
    const event = step(g);
    for (let i = 0; i < live.bulges.length; i++) if (live.bulges[i] >= 0 && ++live.bulges[i] >= g.body.length) live.bulges[i] = -1;
    if (event === "eat" || event === "bonus") feedback(event === "bonus", !g.goal && speedStep(g.eaten) > speed);
    else if (event === "win" && g.goal) { feedback(false, false); finish(true); }
    else if (event === "crash" || event === "win") finish(event === "win");
  }

  function draw() {
    const c = live.context, sprites = live.sprites;
    if (!c || !live.background || !sprites) return;
    const { width, height, fence, cell, spriteSize } = live, g = game.current, now = performance.now();
    const current = phaseRef.current, calm = slowRef.current;
    c.save();
    if (now < live.shakeUntil) c.translate(Math.sin(now * 0.09) * 4 * (live.shakeUntil - now) / 260, 0);
    c.drawImage(live.background, 0, 0, width, height);
    const half = cell / 2;
    if (g.food >= 0) c.drawImage(sprites, FOODS.indexOf(g.kind) * spriteSize, 0, spriteSize, spriteSize, centerX(g.food, fence, cell) - half, centerY(g.food, fence, cell) - half, cell, cell);
    if (g.bonus >= 0) {
      const bx = centerX(g.bonus, fence, cell), by = centerY(g.bonus, fence, cell), grow = calm ? 1 : 1 + 0.07 * Math.sin(now / 240);
      c.drawImage(sprites, 5 * spriteSize, 0, spriteSize, spriteSize, bx - half * grow, by - half * grow, cell * grow, cell * grow);
      c.strokeStyle = "#b07d00"; c.lineWidth = Math.max(2, cell * 0.08); c.lineCap = "round";
      c.beginPath(); c.arc(bx, by, cell * 0.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.bonusLife / BONUS_LIFE); c.stroke();
    }

    // The snake slides smoothly between cells: each segment eases from where it was to where it is.
    const length = g.body.length, points = live.points;
    const t = current === "playing" ? Math.max(0, Math.min(1, live.acc / (g.goal ? levelInterval(levelRef.current, calm) : interval(g.eaten, calm)))) : 1;
    for (let i = 0; i < length; i++) {
      const to = g.body[i], from = i < live.prevLength ? live.prev[i] : to;
      let x = centerX(from, fence, cell) + (centerX(to, fence, cell) - centerX(from, fence, cell)) * t;
      const y = centerY(from, fence, cell) + (centerY(to, fence, cell) - centerY(from, fence, cell)) * t;
      if (current === "ready" && !calm) x += Math.sin(now / 260 + i * 1.4) * cell * 0.09;
      points[i * 2] = x; points[i * 2 + 1] = y;
    }
    c.fillStyle = palette.snakeEdge;
    for (let i = 0; i < live.bulges.length; i++) {
      const b = live.bulges[i];
      if (b > 0 && b < length) { c.beginPath(); c.arc(points[b * 2], points[b * 2 + 1], cell * 0.5, 0, Math.PI * 2); c.fill(); }
    }
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(points[0], points[1]);
    for (let i = 1; i < length; i++) c.lineTo(points[i * 2], points[i * 2 + 1]);
    c.lineWidth = cell * 0.86; c.strokeStyle = palette.snakeEdge; c.stroke();
    c.lineWidth = cell * 0.68; c.strokeStyle = palette.snake; c.stroke();
    c.fillStyle = palette.snake;
    for (let i = 0; i < live.bulges.length; i++) {
      const b = live.bulges[i];
      if (b > 0 && b < length) { c.beginPath(); c.arc(points[b * 2], points[b * 2 + 1], cell * 0.4, 0, Math.PI * 2); c.fill(); }
    }
    c.fillStyle = palette.spot;
    c.beginPath();
    for (let i = 1; i < length; i += 2) { c.moveTo(points[i * 2] + cell * 0.12, points[i * 2 + 1]); c.arc(points[i * 2], points[i * 2 + 1], cell * 0.12, 0, Math.PI * 2); }
    c.fill();

    const crashed = current === "over" && !g.won;
    const bump = crashed ? Math.max(0, 1 - (now - live.crashAt) / 220) * cell * 0.16 : 0;
    const angle = (g.dir - 1) * Math.PI / 2;
    const hx = points[0] + Math.cos(angle) * bump, hy = points[1] + Math.sin(angle) * bump;
    drawHead(c, hx, hy, cell * 0.5, angle, crashed, !crashed && now % 1700 < 280);
    if (crashed && !calm) {
      // Steam from a too-hot bite; slow loops (about one puff a second) so nothing flickers.
      for (let k = 0; k < 3; k++) {
        const p = (now / 1100 + k / 3) % 1;
        c.globalAlpha = 0.75 * (1 - p);
        c.fillStyle = "#ffffff";
        c.beginPath(); c.arc(hx + (k - 1) * cell * 0.38, hy - cell * 0.55 - p * cell * 1.1, cell * (0.12 + p * 0.14), 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    }

    c.fillStyle = palette.mustard;
    for (let i = 0; i < PARTICLES; i++) if (live.life[i] > 0) c.fillRect(live.px[i] - 2, live.py[i] - 2, 4, 4);
    if (live.floatAt >= 0 && now - live.floatAt < 700) {
      const p = (now - live.floatAt) / 700;
      c.globalAlpha = 1 - p;
      c.font = live.font; c.textAlign = "center";
      c.lineWidth = 4; c.strokeStyle = "#fffaf0"; c.fillStyle = live.floatGold ? "#9a6a00" : palette.chilli;
      const fy = live.floatY - (calm ? 0 : p * cell * 0.9);
      c.strokeText(live.floatText, live.floatX, fy); c.fillText(live.floatText, live.floatX, fy);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  function paintBoard() {
    const { width, height, fence, cell } = live, ratio = Math.min(2, window.devicePixelRatio || 1);
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(width * ratio); background.height = Math.round(height * ratio);
    const b = background.getContext("2d")!;
    b.setTransform(ratio, 0, 0, ratio, 0, 0);
    b.fillStyle = palette.paper;
    b.fillRect(fence, fence, width - fence * 2, height - fence * 2);
    b.fillStyle = palette.paperAlt;
    for (let y = 0; y < ROWS; y++) for (let x = (y + 1) % 2; x < COLS; x += 2) b.fillRect(fence + x * cell, fence + y * cell, cell, cell);
    // Faint newspaper columns: abstract lines, no words.
    b.fillStyle = "#0000000c";
    for (let column = 0; column < 3; column++) {
      const left = fence + column * cell * 4 + cell * 0.3, span = cell * 3.4;
      for (let line = 0, y = fence + cell * 0.35; y < height - fence - 4; line++, y += cell / 3) {
        const run = span * (line % 7 === 6 ? 0.45 : 0.82 + ((line * 37 + column * 11) % 18) / 100);
        b.fillRect(left, y, run, 1.5);
      }
    }
    // This level's tin walls, painted into the background once.
    for (const [x, y, w, h] of levelRef.current ? levelOf(levelRef.current).walls : []) {
      drawTin(b, fence + x * cell, fence + y * cell, w * cell, h * cell, w >= h ? "x" : "y");
      b.strokeStyle = "#00000040"; b.lineWidth = 1.5; b.strokeRect(fence + x * cell + 0.75, fence + y * cell + 0.75, w * cell - 1.5, h * cell - 1.5);
    }
    drawTin(b, 0, 0, width, fence, "x");
    drawTin(b, 0, height - fence, width, fence, "x");
    drawTin(b, 0, fence, fence, height - fence * 2, "y");
    drawTin(b, width - fence, fence, fence, height - fence * 2, "y");
    b.fillStyle = palette.rust;
    for (const [x, y] of [[0.18, 0], [0.71, 1], [0, 0.42], [1, 0.8], [0.45, 1], [1, 0.12]]) {
      b.beginPath(); b.arc(x * (width - fence) + fence / 2, y * (height - fence) + fence / 2, fence * 0.22, 0, Math.PI * 2); b.fill();
    }
    b.fillStyle = "#4d565b";
    for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { b.beginPath(); b.arc(x * (width - fence) + fence / 2, y * (height - fence) + fence / 2, fence * 0.2, 0, Math.PI * 2); b.fill(); }
    b.strokeStyle = "#00000033"; b.lineWidth = 2;
    b.strokeRect(fence - 1, fence - 1, width - fence * 2 + 2, height - fence * 2 + 2);

    const size = Math.ceil(cell * ratio);
    const sprites = live.sprites ??= document.createElement("canvas");
    sprites.width = size * SPRITES.length; sprites.height = size;
    const s = sprites.getContext("2d")!;
    SPRITES.forEach((kind, index) => drawFood(s, kind, index * size + size / 2, size / 2, size * 0.4));
    live.spriteSize = size;
    live.font = `800 ${Math.round(cell * 0.62)}px Display, Bangla, sans-serif`;
  }

  useGameLoop(tick, draw, phase === "playing" || (boardInView && !slow && (phase === "ready" || phase === "over")));

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const fence = Math.max(10, Math.round(width * 0.034)), cell = (width - fence * 2) / COLS, height = Math.round(fence * 2 + cell * ROWS);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      Object.assign(live, { width, height, fence, cell, context: fitCanvas(element, width, height) });
      paintBoard();
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
      chosen.current = true;
      reset(shared.seed, shared.level ?? 0);
      go("ready");
    };
    setSite(window.location.host);
    if (!parseShared(window.location.hash)) reset(newSeed());
    readFriend();
    const hide = () => { if (document.hidden) pause(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);

  // Scrolling the board away mid-game pauses it, so nobody crashes off-screen.
  useEffect(() => { if (!boardInView) pause(); }, [boardInView]);

  // Saved stars load after the first paint: open at the furthest level reached, unless a level was already picked or a friend's link chose one.
  useEffect(() => {
    if (chosen.current || phaseRef.current !== "ready" || levelRef.current === levels.unlocked || !levelRef.current) return;
    reset(seed.current, levels.unlocked);
  }, [levels.unlocked]);

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const dir = KEYS[event.key], now = phaseRef.current;
    if (dir !== undefined) { if (now !== "over") { event.preventDefault(); press(dir); } return; }
    if (event.key === "Escape" || event.key === "p" || event.key === "P") { if (now === "playing") pause(); else resume(); return; }
    if (event.key !== " " && event.key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (now === "ready") start(); else if (now === "playing") pause(); else if (now === "paused") resume(); else restart();
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
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
  }, [state, format, site, friend]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.target as Element).closest("button")) return;
    Object.assign(live.gesture, { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, swiped: false });
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
    press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    // Re-anchor, so one finger can draw an L and queue two turns.
    gesture.x = event.clientX; gesture.y = event.clientY; gesture.swiped = true;
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    gesture.id = -1;
    if (gesture.swiped || Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > TAP_SLOP) return;
    const box = event.currentTarget.getBoundingClientRect();
    side(event.clientX - box.left < box.width / 2 ? -1 : 1, false);
  }
  // Turn buttons react on touch-down for speed; a keyboard "click" (detail 0) still works.
  const turnButton = (towards: -1 | 1) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary) side(towards, true); },
    onClick: (event: { detail: number }) => { if (event.detail === 0) side(towards, true); },
  });
  function seeCard() {
    resultBox.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  const rival = friend ? possessive(friend.name || "বন্ধু") : "";
  // Notes sit in the half away from the snake's head, so nobody resumes blind.
  const noteAt = Math.floor(game.current.body[0] / COLS) >= ROWS / 2 ? "top" : "bottom";
  const over = phase === "over" && result;
  const goal = level ? levelOf(level).goal : 0, offered = level ? chilliesIn(level) : 0;
  const cleared = Boolean(result?.level && result.won);
  const nextLevel = result && result.level && result.level < LEVEL_COUNT ? result.level + 1 : 0;
  const miss = result ? nearMiss({ ...result, best: result.best }) : "";
  const resultLine = result ? (result.level ? levelLine(result.level, result.stars, result.eaten) : humanLine(result.score)) : "";

  return (
    <div className="js">
      {friend && (
        <section className="js-friend" aria-labelledby="js-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${rival} কার্ড: ${bn(friend.score)} পয়েন্ট`} />
          <div>
            <h2 id="js-friend-title">{banner(friend)}</h2>
            <p>{rival} নিজের ফোনের স্কোর</p>
          </div>
        </section>
      )}

      <div className="js-top">
        <p className="js-where">{level ? <>লেভেল {bn(level)} <span>· ★ {bn(totalStars(levels.stars))}/{bn(LEVEL_COUNT * 3)}</span></> : <>ক্লাসিক <span>· যত খুশি লম্বা হও</span></>}</p>
        <div className="js-modes" role="group" aria-label="খেলার ধরন">
          <button type="button" aria-pressed={level > 0} onClick={() => { if (!level) choose(levels.unlocked); }}>লেভেল</button>
          <button type="button" aria-pressed={level === 0} onClick={() => { if (level) choose(0); }}>ক্লাসিক</button>
        </div>
      </div>

      <div className="js-hud">
        <p className="js-score"><span>স্কোর</span><b>{bn(score)}</b></p>
        {level ? <>
          <p className="js-best"><span>খাওয়া</span><b>{bn(eaten)}/{bn(goal)}</b></p>
          <p className="js-best js-gold"><span>সোনালি</span><b>{bn(golden)}/{bn(offered)}</b></p>
        </> : <>
          {best !== null && <p className="js-best"><span>সেরা</span><b>{bn(best)}</b></p>}
          <p className="js-best"><span>গতি</span><b>{bn(speedStep(eaten))}</b></p>
        </>}
        <button type="button" className="js-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"} aria-label={phase === "paused" ? "চালিয়ে যাও" : "একটু থামাও"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{phase === "paused" ? <path d="M8 5v14l11-7z" className="js-fill" /> : <path d="M9 5v14M15 5v14" />}</svg>
        </button>
      </div>

      <div className="js-board" ref={board} data-phase={phase} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { live.gesture.id = -1; }}>
        <canvas ref={canvas} role="img" aria-label={`ঝালমুড়ি সাপের মাঠ। স্কোর ${bn(score)}।`} />
        {phase === "ready" && (
          <div className="js-overlay" data-at={noteAt}>
            <div className="js-note">
              {level > 0 && <p className="js-goal">{bn(goal)}টা খেলেই পার<span>{bn(offered)}টা সোনালি মরিচ পেলে ৩ তারা</span></p>}
              <p className="js-howto">সোয়াইপ করো, বা <b>বাঁ-ডান</b> পাশে চাপো</p>
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); start(); }}>শুরু করো</button>
            </div>
          </div>
        )}
        {phase === "paused" && (
          <div className="js-overlay" data-at={noteAt}>
            <div className="js-note">
              <p className="js-howto">থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{over && result ? `খেলা শেষ। ${bn(result.score)} পয়েন্ট। ${cleared ? `লেভেল ${bn(result.level)} পার, ${bn(result.stars)} তারা।` : ""}${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""} ${miss}` : ""}</p>
        {over && (
          <div className="js-overlay">
            <div className="js-note js-slip">
              <h2>{cleared ? `লেভেল ${bn(result.level)} পার!` : result.won ? "পুরো ঠোঙা সাবাড়!" : "ঝাল লেগে গেল!"}</h2>
              {cleared && <StarReveal count={result.stars} />}
              <p className="js-final"><b>{bn(result.score)}</b> পয়েন্ট</p>
              <p className="js-record">{result.record ? "এই ফোনে নতুন রেকর্ড!" : result.level ? resultLine : best !== null && best > result.score ? `এই ফোনে সেরা ${bn(best)}` : humanLine(result.score)}</p>
              {miss && <p className="js-miss">{miss}</p>}
              {friend && (friend.level ?? 0) === result.level && <p className="js-versus">{compareLine(result.score, friend.score, friend.name)}</p>}
              <button type="button" className="kit-link js-see" onClick={seeCard}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
            </div>
          </div>
        )}
      </div>

      <div className="js-controls">
        {phase === "over" ? (
          cleared && nextLevel ? <>
            <button type="button" className="kit-secondary js-again" onClick={() => restart()} disabled={!restartReady}>আবার খেলো</button>
            <button type="button" className="kit-primary js-again" onClick={() => restart(nextLevel)} disabled={!restartReady}>পরের লেভেল</button>
          </> : <button type="button" className="kit-primary js-again js-wide" onClick={() => restart()} disabled={!restartReady}>আরেকবার</button>
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

      <div className="js-bar">
        <SoundToggle className="js-sound" />
        <button type="button" className="js-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="12" r="5.5" /><path d="M10 12a2 2 0 1 0 2-2M2.5 18h15a3 3 0 0 0 3-3v-4m0 0-1.2-3m1.2 3 1.8-2.4" /></svg>ধীরে খেলো
        </button>
      </div>

      <details className="js-levels">
        <summary>সব লেভেল <span>★ {bn(totalStars(levels.stars))}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, friend?.level ?? 1)} current={level || undefined} onPick={choose} />
        <p>প্রতি লেভেলে নির্দিষ্ট কয়টা খেলেই পার। সবগুলো সোনালি মরিচ খেলে ৩ তারা, অর্ধেক খেলে ২। লেভেল ৩ থেকে মাঠে টিনের দেয়াল।</p>
      </details>

      <section className="js-result" id="result" ref={resultBox} aria-labelledby="js-result-title">
        <div className="js-result-head">
          <h2 id="js-result-title">{result ? <><em>{bn(result.score)}</em> পয়েন্ট, ঠোঙার কার্ড তৈরি</> : "খেলা শেষে তোমার ঠোঙার কার্ড"}</h2>
          <p>{result ? friend && (friend.level ?? 0) === result.level ? compareLine(result.score, friend.score, friend.name) : resultLine : "একবার খেললেই এখানে স্কোরসহ একটা কার্ড আসবে। বন্ধুকে পাঠালে সে ঠিক একই ঠোঙা পাবে।"}</p>
        </div>
        {card && result && (
          <div className="js-result-body">
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
              <button type="button" className="kit-link js-again-link" onClick={() => choose(cleared && nextLevel ? nextLevel : result.level)}>{cleared && nextLevel ? "পরের লেভেল খেলো" : "আরেকবার খেলো"}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
