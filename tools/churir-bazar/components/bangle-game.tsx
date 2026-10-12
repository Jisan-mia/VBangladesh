"use client";
// IP: what we avoided — no sweets, wrappers or candy shapes and no candy-shop palette; no word callouts popping over the board, no "sweet!"-style voice and no
// jingles borrowed from anyone; ours is round glass bangles on a tufted velvet stall tray (7×7, not 9×9), each colour with its own pattern, our own
// specials (four lifted together leave a gold-rimmed ঝিকমিক bangle that clears two cells each way; any five leave a রংধনু bangle), and a tap-to-shake
// "চুড়ি ঝাঁকাও" when no swap is left. Sounds are synthesized glass clinks.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, fitCanvas, loop, sfx, shake, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawBangle, drawTray, glint, GLASS, GOLD } from "../lib/art";
import { colourOf, neighbours, sparkleReach, CELLS, EMPTY, RAINBOW, SIZE, SPARKLE, type Outcome, type Step } from "../lib/board";
import { bestMove } from "../lib/bot";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { levelOf, levelStars, move, progress, shortBy, startGame, startLevel, BONUS, LEVEL_COUNT, type Game } from "../lib/game";
import { bn, caption, clearLine, compareLine, feat, fromGame, goalLabel, goalLine, missLine, parseShared, sharedHash, worldOf, WORLDS, type Shared } from "../lib/link";

const TOOL = "churir-bazar";
const PIECES = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, RAINBOW];
const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? ("auto" as const) : ("smooth" as const));
const easeOut = (p: number) => 1 - (1 - p) ** 3;
const easeBack = (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;

// ---- sounds ----
/** A glass clink: a bright partial over the note, pitched up with each step of a cascade. */
const clink = (step: number) => { const f = 1180 * 2 ** ((Math.min(step, 7) * 2) / 12); tone(f, 0.24, 0.05, "sine"); tone(f * 2.76, 0.13, 0.02, "sine", 0.004); tone(f * 4.07, 0.07, 0.01, "sine", 0.008); };
/** The signature: a wrist of glass bangles shaken, রিনিঝিনি. */
const jingle = () => [2093, 2637, 2349, 3136, 2794, 3520].forEach((f, i) => { tone(f, 0.16, 0.034, "sine", i * 0.05); tone(f * 2.4, 0.08, 0.012, "sine", i * 0.05 + 0.003); });
const shimmer = () => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, 0.12, 0.04, "triangle", i * 0.035));
const sweep = () => [523, 659, 784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.14, 0.045, "triangle", i * 0.03));

type Phase =
  | { kind: "swap"; a: number; b: number; back: boolean }
  | { kind: "pop"; step: Step; index: number; rainbow: boolean }
  | { kind: "fall"; step: Step }
  | { kind: "shake"; order: number[]; cells: number[]; primed?: boolean };

const MAX_BITS = 180;
const KEYS: Record<string, number> = { ArrowUp: -SIZE, ArrowDown: SIZE, ArrowLeft: -1, ArrowRight: 1 };

/** Counts a number up quickly once it's shown (no animation in slow mode). */
function useCountUp(value: number, run: boolean, slow: boolean) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!run || slow || value < 10) { setShown(value); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => { const t = Math.min(1, (now - start) / 700); setShown(Math.round(value * easeOut(t))); if (t < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, run, slow]);
  return shown;
}

export function BangleGame() {
  const [game, setGameState] = useState<Game>(() => startGame(1));
  const [hud, setHud] = useState({ score: 0, left: game.left });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needShake, setNeedShake] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [streak, setStreak] = useState(0);
  const [paused, setPaused] = useState(false);
  const [boardPx, setBoardPx] = useState(0);
  const [chips, setChips] = useState<string[]>([]);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [improved, setImproved] = useState<number | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const levels = useLevels(TOOL, LEVEL_COUNT);
  const { level } = game, spec = levelOf(level), world = worldOf(level);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`);
  const gameRef = useRef(game), slowRef = useRef(slow), busyRef = useRef(false), pausedRef = useRef(false);
  gameRef.current = game; slowRef.current = slow; pausedRef.current = paused;
  const frame = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const opened = useRef(false);
  const finished = useRef<Game | null>(null);
  const rattle = useRef<ReturnType<typeof loop> | null>(null);
  const press = useRef<{ id: number; cell: number; x: number; y: number } | null>(null);
  const needShakeRef = useRef(false);
  const boardInView = useInView(frame);

  // Everything the frame loop reads lives here, so drawing never allocates or waits on React.
  const view = useRef({
    cells: game.cells.slice(), offX: new Float32Array(CELLS), offY: new Float32Array(CELLS), vel: new Float32Array(CELLS),
    pop: new Float32Array(CELLS), grow: new Float32Array(CELLS).fill(1), from: new Float32Array(CELLS * 2),
    queue: [] as Phase[], t: 0, started: false, blasts: [] as number[],
    bits: { x: new Float32Array(MAX_BITS), y: new Float32Array(MAX_BITS), vx: new Float32Array(MAX_BITS), vy: new Float32Array(MAX_BITS), life: new Float32Array(MAX_BITS), colour: new Uint8Array(MAX_BITS), next: 0, alive: 0 },
    floats: [{ text: "", x: 0, y: 0, t: 9 }, { text: "", x: 0, y: 0, t: 9 }, { text: "", x: 0, y: 0, t: 9 }, { text: "", x: 0, y: 0, t: 9 }], floatNext: 0,
    selected: -1, cursor: 24, keyboard: false, hint: null as [number, number] | null, idleSince: 0, shakeX: 0,
    tray: null as HTMLCanvasElement | null, sprites: [] as HTMLCanvasElement[], trayKey: "",
  });

  const setGame = (next: Game) => { gameRef.current = next; setGameState(next); };
  const setBusyBoth = (value: boolean) => { busyRef.current = value; setBusy(value); };

  const count = game.moves.length, movesLeft = spec.moves - count;
  const phase = done ? "over" : paused ? "paused" : count ? "playing" : "ready";
  const rival = friend && friend.level === level ? friend : null;
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const shared = done ? fromGame(game, name) : null;
  const state = shared ? sharedHash(shared) : "";
  const result: CardData | null = done && game.won ? { level, score: game.score, count, name } : null;
  const earned = game.won ? levelStars(level, game.score) : 0;
  const shownScore = useCountUp(game.score, done && game.won, slow);

  // ---- the board's size, sprites and tray ----
  useEffect(() => {
    const box = frame.current;
    if (!box) return;
    const observer = new ResizeObserver(() => setBoardPx(Math.floor(box.clientWidth)));
    observer.observe(box);
    setBoardPx(Math.floor(box.clientWidth));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!boardPx) return;
    const v = view.current, ratio = Math.min(2, window.devicePixelRatio || 1), px = Math.round(boardPx * ratio), key = `${px}|${world}`;
    if (v.trayKey === key) return;
    v.trayKey = key;
    const tray = v.tray ?? document.createElement("canvas");
    tray.width = tray.height = px;
    const c = tray.getContext("2d");
    if (!c) return;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawTray(c, boardPx, world);
    v.tray = tray;
    const cellPx = Math.ceil((boardPx / SIZE) * ratio);
    for (const piece of PIECES) {
      const sprite = v.sprites[piece] ?? document.createElement("canvas");
      sprite.width = sprite.height = cellPx;
      const s = sprite.getContext("2d");
      if (!s) continue;
      s.clearRect(0, 0, cellPx, cellPx);
      drawBangle(s, piece, 0, 0, cellPx);
      v.sprites[piece] = sprite;
    }
    draw();
  }, [boardPx, world]);

  // small bangle pictures for the goal chips
  useEffect(() => {
    const sheet = document.createElement("canvas");
    sheet.width = sheet.height = 72;
    const c = sheet.getContext("2d");
    if (!c) return;
    const out: string[] = [];
    for (const piece of [...PIECES, SPARKLE + 3]) { c.clearRect(0, 0, 72, 72); drawBangle(c, piece, 0, 0, 72); out[piece] = sheet.toDataURL(); }
    setChips(out);
  }, []);

  // ---- starting a level ----
  function begin(next: Game) {
    const v = view.current;
    v.queue.length = 0; v.t = 0; v.started = false; v.blasts = [];
    v.cells = next.cells.slice();
    v.offX.fill(0); v.offY.fill(0); v.vel.fill(0); v.pop.fill(0); v.grow.fill(1); v.bits.alive = 0; v.bits.life.fill(0);
    for (const float of v.floats) float.t = 9;
    v.selected = -1; v.idleSince = performance.now(); v.hint = bestMove(next, levelOf(next.level));
    rattle.current?.stop(); rattle.current = null; needShakeRef.current = false;
    finished.current = null;
    setGame(next);
    setHud({ score: 0, left: next.left });
    setDone(false); setBusyBoth(false); setNeedShake(false); setShaking(false); setStreak(0); setPaused(false); setImproved(null);
  }
  const playLevel = (next: number) => { if (next >= 1 && next <= LEVEL_COUNT) begin(startGame(next)); };

  // After useLevels has read this phone's stars: open a friend's level, or where this phone left off.
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    setSite(window.location.host);
    const readFriend = () => {
      const read = parseShared(window.location.hash);
      if (!read) return false;
      setFriend(read);
      playLevel(read.level);
      return true;
    };
    if (!readFriend()) playLevel(startLevel(levels.stars, levels.unlocked));
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, [levels.loaded]);

  // ---- a swap ----
  function trySwap(a: number, b: number) {
    const current = gameRef.current, v = view.current;
    if (busyRef.current || pausedRef.current || current.over || !neighbours(a, b)) return;
    v.selected = -1; v.idleSince = performance.now();
    const next = move(current, a, b);
    setBusyBoth(true);
    if (!next) {
      v.queue.push({ kind: "swap", a, b, back: true });
      sfx.wrong();
      shake(frame.current);
      return;
    }
    sfx.tap();
    queueOutcome(a, b, next.outcome);
    setGame(next.game);
  }

  function queueOutcome(a: number, b: number, outcome: Outcome) {
    const v = view.current, rainbow = v.cells[a] === RAINBOW || v.cells[b] === RAINBOW;
    v.queue.push({ kind: "swap", a, b, back: false });
    outcome.steps.forEach((step, index) => v.queue.push({ kind: "pop", step, index, rainbow: rainbow && index === 0 }, { kind: "fall", step }));
    if (outcome.shuffle) v.queue.push({ kind: "shake", order: outcome.shuffle, cells: outcome.cells });
  }

  /** The tray is still: show the real numbers, and end the level if it's over. */
  function settle() {
    const current = gameRef.current, v = view.current;
    setBusyBoth(false); setStreak(0);
    setHud({ score: current.score, left: current.left });
    v.idleSince = performance.now();
    v.hint = current.over ? null : bestMove(current, levelOf(current.level));
    if (current.over) setDone(true);
  }

  function spawnBits(cell: number, colour: number, many: number) {
    if (slowRef.current || !boardPx) return;
    const bits = view.current.bits, size = boardPx / SIZE, x = (cell % SIZE + 0.5) * size, y = (Math.floor(cell / SIZE) + 0.5) * size;
    for (let k = 0; k < many; k++) {
      const i = bits.next; bits.next = (bits.next + 1) % MAX_BITS;
      const angle = (k / many) * Math.PI * 2 + cell, speed = size * (2.2 + ((cell * 7 + k * 13) % 10) / 4);
      bits.x[i] = x; bits.y[i] = y; bits.vx[i] = Math.cos(angle) * speed; bits.vy[i] = Math.sin(angle) * speed - size * 2; bits.life[i] = 0.5; bits.colour[i] = colour;
    }
  }

  function addFloat(text: string, cells: readonly number[]) {
    if (!cells.length || !boardPx) return;
    const v = view.current, size = boardPx / SIZE, float = v.floats[v.floatNext];
    v.floatNext = (v.floatNext + 1) % v.floats.length;
    let x = 0, y = 0;
    for (const cell of cells) { x += cell % SIZE; y += Math.floor(cell / SIZE); }
    float.text = text; float.x = (x / cells.length + 0.5) * size; float.y = (y / cells.length + 0.5) * size; float.t = 0;
  }

  // ---- the frame loop: advance the animation queue ----
  function step(dt: number) {
    const v = view.current, calm = slowRef.current, bits = v.bits;
    let alive = 0;
    for (let i = 0; i < MAX_BITS; i++) {
      if (bits.life[i] <= 0) continue;
      bits.life[i] -= dt; bits.vy[i] += (boardPx / SIZE) * 14 * dt; bits.x[i] += bits.vx[i] * dt; bits.y[i] += bits.vy[i] * dt; alive++;
    }
    bits.alive = alive;
    for (const float of v.floats) if (float.t < 9) float.t += dt;
    const phase = v.queue[0];
    if (!phase) { if (busyRef.current && !alive && !needShakeRef.current) settle(); return; }
    const pace = calm ? 0.6 : 1, first = !v.started;
    v.started = true;
    v.t += dt * pace;
    let finishedPhase = false;
    if (phase.kind === "swap") {
      const { a, b, back } = phase, dx = (b % SIZE) - (a % SIZE), dy = Math.floor(b / SIZE) - Math.floor(a / SIZE), length = back ? 0.26 : 0.13;
      const p = Math.min(1, v.t / length), e = back ? Math.sin(p * Math.PI) * 0.45 : easeOut(p);
      v.offX[a] = dx * e; v.offY[a] = dy * e; v.offX[b] = -dx * e; v.offY[b] = -dy * e;
      if (p >= 1) {
        v.offX[a] = v.offY[a] = v.offX[b] = v.offY[b] = 0;
        if (!back) [v.cells[a], v.cells[b]] = [v.cells[b], v.cells[a]];
        finishedPhase = true;
      }
    } else if (phase.kind === "pop") {
      const { step: s, index } = phase;
      if (first) {
        clink(index); sfx.combo(index);
        if (s.blasts.length) sfx.whoosh();
        if (phase.rainbow || s.made.some(item => item.piece === RAINBOW)) { sweep(); buzz(14); }
        else if (s.made.length) { shimmer(); buzz(10); }
        v.blasts = s.blasts;
        for (const cell of s.cleared) { v.pop[cell] = 0.001; spawnBits(cell, Math.max(0, colourOf(v.cells[cell])), index ? 4 : 5); }
        for (const { cell, piece } of s.made) { v.cells[cell] = piece; v.grow[cell] = 0; }
        addFloat(`+${bn(s.points)}`, s.cleared.length ? s.cleared : s.made.map(item => item.cell));
        setStreak(index + 1);
        const specials = s.made.filter(item => item.piece !== RAINBOW).length;
        const gained = progress(levelOf(gameRef.current.level).goals, { lifted: s.lifted, made: [specials, s.made.length - specials] });
        setHud(h => ({ score: h.score + s.points, left: h.left.map((n, i) => Math.max(0, n - gained[i])) }));
      }
      const p = Math.min(1, v.t / 0.2);
      for (const cell of s.cleared) v.pop[cell] = Math.max(0.001, p);
      for (const { cell } of s.made) v.grow[cell] = p;
      if (p >= 1) {
        for (const cell of s.cleared) { v.pop[cell] = 0; v.cells[cell] = EMPTY; }
        for (const { cell } of s.made) v.grow[cell] = 1;
        v.blasts = [];
        finishedPhase = true;
      }
    } else if (phase.kind === "fall") {
      const s = phase.step;
      if (first) { v.cells = s.cells.slice(); for (let i = 0; i < CELLS; i++) { v.offY[i] = -s.fall[i]; v.vel[i] = 0; } }
      let moving = false;
      for (let i = 0; i < CELLS; i++) {
        if (v.offY[i] >= 0) continue;
        v.vel[i] += 55 * dt * pace; v.offY[i] = Math.min(0, v.offY[i] + v.vel[i] * dt * pace);
        moving = true;
      }
      if (!moving || v.t > 1.5) { v.offY.fill(0); finishedPhase = true; }
    } else {
      if (first) { needShakeRef.current = true; setNeedShake(true); }
      if (needShakeRef.current) { v.t = 0; return; }
      if (!phase.primed) {
        phase.primed = true; v.t = 0;
        for (let i = 0; i < CELLS; i++) { const old = phase.order[i]; v.from[i * 2] = (old % SIZE) - (i % SIZE); v.from[i * 2 + 1] = Math.floor(old / SIZE) - Math.floor(i / SIZE); }
        v.cells = phase.cells.slice();
      }
      const length = 0.75, p = Math.min(1, v.t / length), e = easeOut(Math.max(0, (p - 0.25) / 0.75));
      v.shakeX = calm || p > 0.3 ? 0 : Math.sin(p * 60) * 5 * (1 - p / 0.3);
      for (let i = 0; i < CELLS; i++) { v.offX[i] = v.from[i * 2] * (1 - e); v.offY[i] = v.from[i * 2 + 1] * (1 - e); }
      rattle.current?.pitch(3600 + 2400 * Math.sin(p * 18));
      if (p >= 1) {
        v.offX.fill(0); v.offY.fill(0); v.shakeX = 0;
        rattle.current?.stop(); rattle.current = null;
        setShaking(false);
        finishedPhase = true;
      }
    }
    if (finishedPhase) { v.queue.shift(); v.t = 0; v.started = false; }
  }
  function shakeTray() {
    if (!needShakeRef.current) return;
    needShakeRef.current = false; setNeedShake(false); setShaking(true);
    jingle();
    rattle.current = loop("static", 3600);
    rattle.current.set(slowRef.current ? 0.15 : 0.3);
    window.setTimeout(() => { rattle.current?.stop(); rattle.current = null; }, 800);
  }

  // ---- drawing ----
  function draw() {
    const canvas = canvasRef.current, v = view.current;
    if (!canvas || !boardPx || !v.tray) return;
    const c = fitCanvas(canvas, boardPx, boardPx), size = boardPx / SIZE, now = performance.now();
    c.clearRect(0, 0, boardPx, boardPx);
    c.save();
    c.translate(v.shakeX, 0);
    c.drawImage(v.tray, 0, 0, boardPx, boardPx);
    c.beginPath(); c.rect(0, 0, boardPx, boardPx); c.clip();

    const hinting = v.hint && !busyRef.current && !gameRef.current.over && (gameRef.current.level === 1 && !gameRef.current.moves.length ? true : now - v.idleSince > 6000);
    if (v.selected >= 0) {
      c.fillStyle = "rgba(255,240,190,0.28)";
      c.beginPath(); c.roundRect((v.selected % SIZE) * size + 2, Math.floor(v.selected / SIZE) * size + 2, size - 4, size - 4, size * 0.2); c.fill();
    }
    // blast lanes: a gold cross that fades as the pop runs
    if (v.blasts.length) {
      const fade = 1 - Math.min(1, v.t / 0.2);
      c.fillStyle = `rgba(255,214,110,${(0.45 * fade).toFixed(3)})`;
      for (const cell of v.blasts) {
        const col = cell % SIZE, row = Math.floor(cell / SIZE), left = Math.max(0, col - 2), top = Math.max(0, row - 2);
        c.fillRect(left * size, (row + 0.3) * size, (Math.min(SIZE - 1, col + 2) - left + 1) * size, size * 0.4);
        c.fillRect((col + 0.3) * size, top * size, size * 0.4, (Math.min(SIZE - 1, row + 2) - top + 1) * size);
      }
    }
    for (let i = 0; i < CELLS; i++) {
      const piece = v.cells[i];
      if (piece < 0 || !v.sprites[piece]) continue;
      const x = (i % SIZE + v.offX[i]) * size, y = (Math.floor(i / SIZE) + v.offY[i]) * size;
      if (y <= -size) continue;
      let scale = 1, alpha = 1;
      if (v.pop[i] > 0) { scale = 1 + 0.4 * v.pop[i]; alpha = 1 - v.pop[i]; }
      else if (v.grow[i] < 1) scale = 0.3 + 0.7 * easeBack(v.grow[i]);
      if (hinting && (i === v.hint![0] || i === v.hint![1])) scale *= 1 + 0.07 * Math.sin(now / 160);
      if (i === v.selected) scale *= 1.08;
      if (scale === 1 && alpha === 1) c.drawImage(v.sprites[piece], x, y, size, size);
      else {
        const s = size * scale;
        c.globalAlpha = Math.max(0, alpha);
        c.drawImage(v.sprites[piece], x + (size - s) / 2, y + (size - s) / 2, s, s);
        c.globalAlpha = 1;
      }
      // a glint that breathes on the special bangles
      if ((piece >= SPARKLE) && !slowRef.current && alpha === 1) glint(c, x + size * 0.78, y + size * 0.22, size * (0.08 + 0.06 * Math.abs(Math.sin(now / 300 + i))));
    }
    // glass bits
    const bits = v.bits;
    if (bits.alive) for (let i = 0; i < MAX_BITS; i++) {
      if (bits.life[i] <= 0) continue;
      c.globalAlpha = Math.min(1, bits.life[i] * 2.5);
      c.fillStyle = GLASS[bits.colour[i]][1];
      c.fillRect(bits.x[i] - 2, bits.y[i] - 2, 4, 4);
    }
    c.globalAlpha = 1;
    // points rising from each lift
    c.textAlign = "center"; c.font = `800 ${Math.round(size * 0.36)}px "Display", "Bangla", sans-serif`;
    for (const float of v.floats) {
      if (float.t >= 0.8) continue;
      c.globalAlpha = 1 - float.t / 0.8;
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillText(float.text, float.x + 1, float.y - float.t * size * 0.9 + 2);
      c.fillStyle = GOLD; c.fillText(float.text, float.x, float.y - float.t * size * 0.9);
    }
    c.globalAlpha = 1;
    if (v.keyboard && !gameRef.current.over) {
      c.strokeStyle = "#fff"; c.lineWidth = 3;
      c.beginPath(); c.roundRect((v.cursor % SIZE) * size + 3, Math.floor(v.cursor / SIZE) * size + 3, size - 6, size - 6, size * 0.2); c.stroke();
    }
    c.restore();
  }

  useGameLoop(step, draw, boardPx > 0 && !paused && (busy || !done));

  // ---- the end of a level: save once, celebrate what's real ----
  useEffect(() => {
    if (!done || finished.current === game) return;
    finished.current = game;
    if (!game.won) { window.setTimeout(sfx.lose, 150); return; }
    const better = levels.record(level, earned), newBest = best !== null && game.score > best;
    submitBest(game.score);
    setImproved(newBest ? best : null);
    window.setTimeout(jingle, 120);
    window.setTimeout((better && (earned === 3 || level % 10 === 0)) || newBest
      ? () => { sfx.win(); confetti({ colors: [GLASS[0][0], GLASS[1][0], GLASS[2][0], GLASS[3][0], GLASS[4][0], GOLD] }); }
      : sfx.good, 450 + 260 * earned);
  }, [done]);

  // pause when the tab is hidden; stop the rattle on the way out
  useEffect(() => {
    const hide = () => {
      if (!document.hidden) return;
      rattle.current?.stop(); rattle.current = null;
      const current = gameRef.current;
      if (current.moves.length && !current.over) setPaused(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); rattle.current?.stop(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("চুড়ির বাজার রাফি ৩২৪০ পয়েন্ট লেভেল").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `done`, `count` and `name` cover everything the card draws.
  }, [done, count, name, format, site, friend]);

  // ---- keyboard: arrows move the frame, Enter or Space holds a bangle, an arrow then swaps ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null, v = view.current;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key in KEYS && !done && !paused) {
      event.preventDefault();
      v.keyboard = true;
      const delta = KEYS[event.key], target = v.cursor + delta;
      if (!neighbours(v.cursor, target)) return;
      if (v.selected === v.cursor) trySwap(v.cursor, target);
      v.cursor = target;
      draw();
      return;
    }
    if ((event.key !== " " && event.key !== "Enter") || element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (paused) setPaused(false);
    else if (needShake) shakeTray();
    else if (done && game.won && level < LEVEL_COUNT) playLevel(level + 1);
    else if (done) playLevel(level);
    else { v.keyboard = true; v.selected = v.selected === v.cursor ? -1 : v.cursor; if (v.selected >= 0) sfx.pick(); draw(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: drag a bangle onto its neighbour, or tap one and then the other ----
  function cellAt(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE), row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    return col >= 0 && col < SIZE && row >= 0 && row < SIZE ? row * SIZE + col : -1;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const v = view.current, cell = cellAt(event);
    if (!event.isPrimary || cell < 0 || done || paused || busyRef.current) return;
    v.keyboard = false; v.idleSince = performance.now();
    if (v.selected >= 0 && v.selected !== cell && neighbours(v.selected, cell)) { trySwap(v.selected, cell); return; }
    if (v.selected === cell) { v.selected = -1; return; }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    press.current = { id: event.pointerId, cell, x: event.clientX, y: event.clientY };
    v.selected = cell; v.cursor = cell;
    sfx.pick();
  }
  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id) return;
    const dx = event.clientX - held.x, dy = event.clientY - held.y, reach = event.currentTarget.getBoundingClientRect().width / SIZE * 0.35;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < reach) return;
    press.current = null;
    trySwap(held.cell, held.cell + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? SIZE : -SIZE)));
  }

  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  function pickLevel(next: number) { playLevel(next); frame.current?.scrollIntoView({ behavior: smooth(), block: "center" }); }

  function status() {
    if (needShake) return "বদলানোর মতো আর কিছু নেই। চুড়িগুলো ঝাঁকিয়ে নাও।";
    if (phase === "ready") return level === 1 ? "দুলছে যে দুটো চুড়ি, টেনে বদলে দাও।" : "পাশাপাশি দুটো বদলাও, এক রঙের তিনটা মেলাও।";
    if (movesLeft <= 3 && !game.over) return `আর ${bn(movesLeft)} চাল বাকি।`;
    return "চারটা একসঙ্গে তুললে ঝিকমিক চুড়ি, পাঁচটায় রংধনু।";
  }

  const near = game.won ? shortBy(level, game.score) : 0;

  return (
    <div className="cb" data-calm={slow} data-world={world}>
      {friend && (
        <section className="cb-friend" aria-labelledby="cb-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="cb-friend-title">{feat(friend)}।</h2>
            <p>একই লেভেল, একই সাজানো চুড়ি। এবার তোমার পালা। চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।</p>
          </div>
        </section>
      )}

      <div className="cb-bar">
        <div className="cb-level">
          <button type="button" className="cb-step" onClick={() => pickLevel(level - 1)} disabled={level <= 1 || busy} aria-label="আগের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <p><b>লেভেল {bn(level)}</b><span>{WORLDS[world]}</span></p>
          <button type="button" className="cb-step" onClick={() => pickLevel(level + 1)} disabled={level >= open || level >= LEVEL_COUNT || busy} aria-label="পরের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <p className="cb-count" data-low={movesLeft <= 3 && !done || undefined} aria-label={`চাল বাকি ${bn(Math.max(0, movesLeft))}`}><span>চাল</span><b>{bn(Math.max(0, movesLeft))}</b></p>
        <p className="cb-count cb-points" aria-label={`পয়েন্ট ${bn(hud.score)}`}><span>পয়েন্ট</span><b key={hud.score} className={hud.score && !slow ? "cb-bump" : ""}>{bn(hud.score)}</b></p>
      </div>

      <ul className="cb-goals" aria-label={`লক্ষ্য: ${goalLine(level)}`}>
        {spec.goals.map((goal, index) => {
          const left = hud.left[index] ?? goal[1], piece = goal[0] === SPARKLE ? SPARKLE + 3 : goal[0];
          return (
            <li key={`${level}-${index}`} data-done={!left || undefined} aria-label={goalLabel(goal, left)}>
              {chips[piece] ? <img src={chips[piece]} alt="" /> : <i aria-hidden="true" />}
              <b key={left} className={!slow && left !== goal[1] ? "cb-bump" : ""}>{left ? bn(left) : "✓"}</b>
            </li>
          );
        })}
      </ul>

      <div className="cb-tray" ref={frame} data-phase={phase}>
        <canvas
          ref={canvasRef} role="img" tabIndex={0}
          aria-label={`চুড়ির ট্রে, ${bn(SIZE)}×${bn(SIZE)}। পাশাপাশি দুটো চুড়ি টেনে বা পরপর ছুঁয়ে বদলাও। কিবোর্ডে তীর দিয়ে ঘর বাছো, এন্টার চেপে ধরো, তীর চেপে বদলাও।`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { press.current = null; }} onPointerCancel={() => { press.current = null; }}
        />
        {streak > 1 && busy && <p className="cb-streak" aria-hidden="true">পরপর ×{bn(streak)}</p>}
        {(needShake || shaking) && (
          <div className="cb-shake-note">
            {needShake ? <button type="button" className="kit-primary" onClick={shakeTray}>চুড়ি ঝাঁকাও</button> : <p aria-hidden="true">রিনিঝিনি</p>}
          </div>
        )}
        {phase === "paused" && (
          <div className="cb-overlay">
            <div className="cb-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {done ? (
        <div className="cb-over" role="status">
          {!game.won ? (
            <>
              <p className="cb-over-score">চাল শেষ</p>
              <p className="cb-over-near">{missLine(level, game.left)}</p>
              <p className="cb-over-line">কিছু হারাওনি। একই সাজানো চুড়ি দিয়ে আবার শুরু।</p>
              <div className="cb-over-actions one"><button type="button" className="kit-primary" onClick={() => playLevel(level)}>আরেকবার</button></div>
            </>
          ) : (
            <>
              <p className="cb-over-score">লেভেল {bn(level)} পার, <em>{bn(shownScore)} পয়েন্ট</em></p>
              <p className="cb-over-stars"><StarReveal count={earned} />{game.bonus > 0 && <span className="cb-bonus">বাকি {bn(game.bonus / BONUS)} চাল × {bn(BONUS)} = {bn(game.bonus)}</span>}</p>
              <p className="cb-over-line">
                {rival ? compareLine(game.score, rival.score, rival.name) : improved !== null ? `এই লেভেলে নতুন সেরা! আগে ছিল ${bn(improved)}।` : clearLine(level)}
                {!rival && improved === null && best !== null && best > game.score && <> এই লেভেলে তোমার সেরা {bn(best)}।</>}
              </p>
              {earned < 3 && <p className="cb-over-near">আর {bn(near)} পয়েন্ট হলে {bn(earned + 1)} তারা।</p>}
              <div className="cb-over-actions">
                {level < LEVEL_COUNT
                  ? <><button type="button" className="kit-secondary" onClick={() => playLevel(level)}>আবার খেলো</button><button type="button" className="kit-primary" onClick={() => playLevel(level + 1)}>পরের লেভেল</button></>
                  : <button type="button" className="kit-primary cb-wide" onClick={() => playLevel(level)}>আরেকবার</button>}
              </div>
              <button type="button" className="kit-link cb-see" onClick={seeCard}>কার্ড দেখো ↓</button>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="cb-status" role="status" aria-live="polite">{status()}</p>
          <div className="cb-tools">
            <button type="button" className="cb-tool" onClick={() => playLevel(level)} disabled={!count || busy}>আবার শুরু</button>
            <button type="button" className="cb-tool" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
            <SoundToggle compact className="cb-sound" onChange={on => { if (!on) { rattle.current?.stop(); rattle.current = null; } }} />
          </div>
        </>
      )}

      <details className="cb-levels">
        <summary>সব লেভেল <span>★ {bn(totalStars(levels.stars))}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>১–১০ গ্রামের মেলা, ১১–২০ বৈশাখী মেলা (রংধনু চুড়ি আসে), ২১–৩০ চুড়িপট্টি (ছয় রঙের চুড়ি), ৩১–৪০ রাতের মেলা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={pickLevel} />
      </details>

      {result && (
        <section className="cb-result" id="result" ref={resultBox} aria-labelledby="cb-result-title">
          <h2 id="cb-result-title"><em>লেভেল {bn(level)}</em> পার, {bn(game.score)} পয়েন্ট</h2>
          <p>{rival ? compareLine(game.score, rival.score, rival.name) : clearLine(level)}</p>
          <div className="cb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cb-card-summary" />
              <figcaption id="cb-card-summary" className="cb-sr">কার্ড: লেভেল {bn(level)}, {bn(game.score)} পয়েন্ট, {bn(count)} চালে, {bn(earned)} তারা।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cb-share">
              <label className="cb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`churir-bazar-level-${level}.png`} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${name}|${format}`}
                caption={caption(result)} state={state || undefined}
                hint="বন্ধু লিংক খুললে একই লেভেলে একই সাজানো চুড়ি পাবে। তোমার চালগুলো আবার খেলে মিলিয়ে দেখা হয়, তাই পয়েন্টটা সত্যি।"
              />
              <button type="button" className="kit-link cb-again-link" onClick={() => (level < LEVEL_COUNT ? pickLevel(level + 1) : pickLevel(level))}>
                {level < LEVEL_COUNT ? "পরের লেভেল খেলো" : "আবার খেলো"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
