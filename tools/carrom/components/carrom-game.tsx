"use client";
// IP: what we avoided — no "Carrom Pool"-style name, menus, coin shop, glossy 3D pieces or neon board; the board (walnut frame, honey surface, green paint, alpona rosette) and the flat discs are drawn fresh, and they share nothing with আড্ডায় তুমি কে?'s maple club board.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, fitCanvas, hiss, loop, newSeed, sfx, shake, tone, totalStars, unlockedLevel, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { paintBoard, paintDisc, type DiscKind } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  banner, bn, caption, compareLine, duoLine, humanLine, migrateBest, nearLine, noteText, parseShared, piecesLine, playerName, sharedHash, startLevel, starsOf,
  LEVEL_COUNT, LEVELS, RULES, SIDE_NAME, SIDE_OF, SOLO_RULE, type Shared,
} from "../lib/link";
import { firstHit, shoot, step, BASE_MAX, BASE_MIN, BIG_STRIKER_R, BOARD, COUNT, POCKET_X, POCKET_Y, QUEEN, RAIL, STEP, STRIKER, TOTAL, type Hit } from "../lib/physics";
import {
  duoPoints, nearestFree, newGame, onBoard, placeStriker, setStrikerSize, settle, soloPoints, strikerFree,
  PER_SIDE, STRIKES, type Game, type Mode, type Note, type Side,
} from "../lib/rules";

const TOOL = "carrom";
type Phase = "ready" | "playing" | "paused" | "over";
type Hint = "pulling" | "backward" | "cancel" | "blocked" | null;
type Hud = { mode: Mode; strikes: number; points: number; white: number; black: number; turn: Side; queen: Game["queen"]; queenBy: Side | -1; note: Note; gained: number };
type Result = { shared: Shared; record: boolean; stars: number; before: number | null };
type Loop = ReturnType<typeof loop>;

const HINTS: Record<Exclude<Hint, null>, string> = {
  pulling: "ছাড়লেই টোকা। ফিরিয়ে এনে ছাড়লে বাতিল।",
  backward: "নিচের দিকে টানো, স্ট্রাইকার ওপরে যাবে",
  cancel: "টোকা বাতিল। আরেকটু বেশি টেনে ছাড়ো।",
  blocked: "এখানে গুটি আছে, স্ট্রাইকারটা একটু সরাও",
};

const MAX_WIDTH = 440;
const TAP_SLOP = 8;
const MIN_POWER = 0.06;
/** Aim stays within 80° of straight ahead: no flicking backwards at your own side. */
const AIM_MAX = 1.4;
const FALL_TIME = 0.32;
const POP_TIME = 0.9;
const TAU = Math.PI * 2;
const SPRITE_R = BIG_STRIKER_R;
const SPRITE_PAD = 1.25;
const DASH = [7, 7];
const DOTS = [2, 9];
const SOLID: number[] = [];
const INK = "rgba(36,20,10,.72)";
const INK_SOLID = "#24140a";
const GLOW = "#fff1c4";
const FONT_POP = '800 40px "Display", "Bangla"';
const POP_TEXT = ["+১", "কুইন! +৩", "ফাউল!", "কুইন!"];
const KINDS: DiscKind[] = ["white", "black", "queen", "striker"];
const ASSIST_KEY = "ektukhani-carrom-assist";
const BIG_KEY = "ektukhani-carrom-big";

const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

/** The striker leaves the finger: a sharp wooden click. */
const click = () => { tone(1800, 0.025, 0.08, "square"); tone(420, 0.06, 0.1, "triangle", 0, 260); };
/** Disc on disc: a short clack, louder for a harder hit (k 0–1). */
const clack = (k: number) => { tone(1250, 0.035, 0.03 + 0.08 * k, "square", 0, 700); hiss(0.025, 0.04 + 0.08 * k, 3800, "highpass"); };
/** Into a pocket: টুপ, a hollow drop. */
const toop = () => { tone(560, 0.13, 0.14, "sine", 0, 190); tone(150, 0.12, 0.1, "sine", 0.05, 70); };
/** Off the cushion: a soft thump. */
const cushion = (k: number) => tone(120, 0.08, 0.04 + 0.09 * k, "sine", 0, 70);

const kindOf = (i: number) => i < PER_SIDE ? 0 : i < 2 * PER_SIDE ? 1 : i === QUEEN ? 2 : 3;
const clampAim = (a: number) => Math.max(-AIM_MAX, Math.min(AIM_MAX, a));

function readHud(g: Game): Hud {
  const w = g.world;
  return { mode: g.mode, strikes: g.strikes, points: soloPoints(w), white: PER_SIDE - onBoard(w, 0), black: PER_SIDE - onBoard(w, 1), turn: g.turn, queen: g.queen, queenBy: g.queenBy, note: g.note, gained: g.gained };
}

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, scale: 1,
    background: null as HTMLCanvasElement | null,
    sprites: [null, null, null, null] as Array<HTMLCanvasElement | null>,
    clock: 0, calm: false, reduced: false, assist: true,
    /** Aim, as an angle from straight ahead in the shooter's own view, and power 0–1 while pulling or holding মারো. */
    aim: 0, power: 0, pulling: false, charging: false, chargeAt: 0, turnDir: 0,
    simCarry: 0, seen: 0, flip: false, blocked: false,
    fallAt: new Float64Array(COUNT).fill(-10),
    popAt: new Float64Array(4).fill(-10),
    popKind: new Uint8Array(4),
    gesture: { id: -1, startX: 0, startY: 0, mode: 0, onStriker: false, u0: 0 },
    hint: null as Hint,
    hit: { t: 0, disc: -1 } as Hit,
    /** The pull's hum (pitch follows power) while aiming; null when quiet. */
    hum: null as Loop | null,
    lastClack: 0, lastBump: 0, tickU: 0.5,
    /** Pieces pocketed by the current strike, for the rising combo. */
    pots: 0,
  };
}

export function CarromGame() {
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [mode, setMode] = useState<Mode>("solo");
  const [firstGame] = useState(() => newGame("solo", LEVELS[0].seed));
  const [hud, setHud] = useState<Hud>(() => readHud(firstGame));
  const [u, setU] = useState(0.5);
  const [hint, setHintState] = useState<Hint>(null);
  const [charging, setCharging] = useState(false);
  const [moving, setMoving] = useState(false);
  const [turnBanner, setTurnBanner] = useState<Side | null>(null);
  const [assist, setAssist] = useState(true);
  const [big, setBig] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  // 0 is a friend's board from a link made before boards existed.
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  levelRef.current = level;
  const levels = useLevels(TOOL, LEVEL_COUNT);
  // Each board keeps its own best; a pre-boards friend's board keeps the old one-key best.
  const [best, submitBest] = useBest(level ? `${TOOL}-${level}` : TOOL);
  const timers = useRef<number[]>([]);
  const chosen = useRef(false);
  const [name, setName] = useState("");
  const [names, setNames] = useState<[string, string]>(["", ""]);
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
  const bigRef = useRef(big);
  bigRef.current = big;
  live.calm = slow || live.reduced;
  live.assist = assist;
  const game = useRef<Game>(firstGame);
  const bannerTimer = useRef(0);
  const boardInView = useInView(board);

  const card: Shared | null = result
    ? result.shared.mode === "solo"
      ? { ...result.shared, name: cleanName(name) }
      : { ...result.shared, name: cleanName(names[result.shared.winner]), other: cleanName(names[1 - result.shared.winner]) }
    : null;
  const state = card ? sharedHash(card) : "";

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }
  function later(run: () => void, ms: number) { timers.current.push(window.setTimeout(run, ms)); }
  function stopHum() { live.hum?.stop(); live.hum = null; }
  /** Vibration follows the site's sound switch (the kit's buzz) and stays off in slow mode. */
  const shakePhone = (ms: number) => { if (!slowRef.current) buzz(ms); };
  function setHint(next: Hint) { if (live.hint !== next) { live.hint = next; setHintState(next); } }

  function letGo() {
    live.pulling = live.charging = false;
    live.power = 0;
    live.turnDir = 0;
    live.gesture.id = -1;
    stopHum();
    setCharging(false);
  }

  function sync() {
    const g = game.current;
    live.flip = g.mode === "duo" && g.turn === 1;
    live.blocked = g.phase === "aim" && !strikerFree(g);
    setU(g.u);
    setHud(readHud(g));
  }

  function reset(nextMode: Mode, nextSeed: number, nextLevel = levelRef.current) {
    timers.current.forEach(clearTimeout); timers.current = [];
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    game.current = newGame(nextMode, nextSeed, bigRef.current);
    Object.assign(live, { aim: 0, seen: 0, simCarry: 0 });
    live.fallAt.fill(-10);
    live.popAt.fill(-10);
    letGo();
    setHint(null);
    setTurnBanner(null);
    setMoving(false);
    sync();
    draw();
  }

  function start() {
    if (phaseRef.current !== "ready") return;
    go("playing");
    // On a short screen the controls can sit below the fold; bring the board and its buttons into view once.
    const box = play.current;
    if (box && box.getBoundingClientRect().bottom > window.innerHeight) box.scrollIntoView({ block: "end", behavior: live.reduced ? "auto" : "smooth" });
  }
  function pause() { if (phaseRef.current === "playing") { letGo(); go("paused"); } }
  function resume() { if (phaseRef.current === "paused") go("playing"); }
  /** A solo board's seed: the level's own, or the friend's pre-boards board. */
  function soloSeed(atLevel: number) { return atLevel ? LEVELS[atLevel - 1].seed : friend?.mode === "solo" ? friend.seed : newSeed(); }
  function restart() {
    if (phaseRef.current !== "over" || !restartReady) return;
    reset(mode, mode === "solo" ? soloSeed(levelRef.current) : newSeed());
    go("playing");
  }
  /** The board picker and "পরের বোর্ড": that board on the ready screen. */
  function pick(nextLevel: number) {
    const g = game.current;
    if (g.mode === "duo" && g.strikes > 0 && g.phase !== "over" && !window.confirm("এই বোর্ডটা বাদ দিয়ে নতুন খেলা শুরু হবে। ঠিক আছে?")) return;
    setMode("solo");
    reset("solo", LEVELS[nextLevel - 1].seed, nextLevel);
    go("ready");
    if ((play.current?.getBoundingClientRect().top ?? 0) < 0) play.current?.scrollIntoView({ behavior: live.reduced ? "auto" : "smooth", block: "center" });
  }

  function finish() {
    const g = game.current, w = g.world;
    go("over");
    letGo();
    if (g.mode === "solo") {
      const points = soloPoints(w), at = levelRef.current, stars = starsOf(points, at), record = best !== null && points > best;
      if (stars) levels.record(at, stars);
      setResult({ shared: { mode: "solo", seed: g.seed, points, queen: !w.on[QUEEN], name: "", ...(at ? { level: at } : {}) }, record, stars, before: best });
      submitBest(points);
      // The stars chime in one by one (StarReveal); the fanfare follows them, confetti only for 3 stars or a new best.
      const after = (stars + 1) * 260;
      if (stars === 3 || record) later(() => { sfx.levelUp(); confetti(); }, after);
      else if (stars || (!at && points > 0)) later(sfx.good, after);
      else sfx.lose();
    } else {
      const winner = g.winner === -1 ? 0 : g.winner;
      setResult({ shared: { mode: "duo", seed: g.seed, points: duoPoints(g), queen: g.queen === "covered" && g.queenBy === winner, winner, name: "", other: "" }, record: false, stars: 0, before: null });
      sfx.win();
      confetti();
    }
    // A thumb may still be on মারো; don't let that press skip the result.
    setRestartReady(false);
    window.setTimeout(() => setRestartReady(true), 700);
    setSettling(true);
    window.setTimeout(() => setSettling(false), POP_TIME * 1000);
  }

  function afterShot() {
    const g = game.current, before = g.turn;
    settle(g);
    setMoving(false);
    sync();
    setHint(null);
    if (g.phase === "over") { finish(); return; }
    if (g.mode === "duo" && g.turn !== before) {
      sfx.pick();
      live.aim = 0;
      setTurnBanner(g.turn);
      window.clearTimeout(bannerTimer.current);
      bannerTimer.current = window.setTimeout(() => setTurnBanner(null), 1500);
    }
  }

  function fire(power: number) {
    const g = game.current, now = phaseRef.current;
    letGo();
    if (g.phase !== "aim" || (now !== "ready" && now !== "playing")) return;
    if (power < MIN_POWER) { setHint("cancel"); return; }
    if (!strikerFree(g)) { setHint("blocked"); sfx.wrong(); shake(board.current); return; }
    const dx = Math.sin(live.aim), dy = -Math.cos(live.aim);
    shoot(g.world, live.flip ? -dx : dx, live.flip ? -dy : dy, power);
    g.phase = "moving";
    click();
    live.pots = 0;
    setMoving(true);
    live.seen = 0;
    live.simCarry = 0;
    setHint(null);
    setTurnBanner(null);
    start();
  }

  function moveStriker(next: number) {
    const g = game.current;
    if (g.phase !== "aim" || phaseRef.current === "paused" || phaseRef.current === "over") return;
    live.blocked = !placeStriker(g, next);
    setU(g.u);
    if (Math.abs(g.u - live.tickU) > 0.04) { sfx.tick(); live.tickU = g.u; }
    if (live.hint === "blocked" && !live.blocked) setHint(null);
  }

  function tick(dt: number) {
    live.clock += dt;
    const now = phaseRef.current;
    if (now !== "playing" && now !== "ready") return;
    const g = game.current;
    if (g.phase === "aim") {
      if (live.turnDir) live.aim = clampAim(live.aim + live.turnDir * (slowRef.current ? 0.3 : 0.6) * dt);
      if (live.charging) {
        const x = ((live.clock - live.chargeAt) / (slowRef.current ? 2.4 : 1.2)) % 2;
        live.power = x < 1 ? x : 2 - x;
      }
      // The pull hums higher the harder it will hit (the ring shows the same).
      if (live.power > 0 && (live.pulling || live.charging)) {
        live.hum ??= loop("hum", 110);
        live.hum.set(0.3); live.hum.pitch(110 + 330 * live.power);
      } else if (live.hum) stopHum();
      return;
    }
    if (g.phase !== "moving") return;
    const w = g.world;
    // Slow mode runs the very same 60 Hz steps, just fewer per second, so results never depend on it.
    live.simCarry += dt * (slowRef.current ? 0.5 : 1);
    while (live.simCarry >= STEP && w.moving) { step(w, STEP); live.simCarry -= STEP; }
    // At most one clack and one cushion thump per ~50 ms, however many discs touch.
    if (w.clack > 60 && live.clock - live.lastClack > 0.045) { clack(Math.min(1, w.clack / 2000)); live.lastClack = live.clock; }
    if (w.bump > 150 && live.clock - live.lastBump > 0.06) { cushion(Math.min(1, w.bump / 2500)); live.lastBump = live.clock; }
    w.clack = w.bump = 0;
    while (live.seen < w.sunkCount) {
      const i = w.sunk[live.seen++], p = w.pocket[i];
      live.fallAt[i] = live.clock;
      live.popAt[p] = live.clock;
      live.popKind[p] = i === STRIKER ? 2 : i === QUEEN ? (g.mode === "solo" ? 1 : 3) : 0;
      if (i === STRIKER) { sfx.wrong(); shake(board.current); continue; }
      toop();
      if (i === QUEEN) sfx.coin();
      // Two or more in one strike climb in pitch.
      if (++live.pots >= 2) sfx.combo(live.pots - 2);
      shakePhone(10);
    }
    if (!w.moving) afterShot();
  }

  // --- drawing ---------------------------------------------------------------------------------------------
  const X = (x: number) => live.flip ? BOARD - x : x;
  const Y = (y: number) => live.flip ? BOARD - y : y;

  function sprite(c: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number) {
    const s = live.sprites[kind];
    if (!s) return;
    const half = r * SPRITE_PAD;
    c.drawImage(s, x - half, y - half, half * 2, half * 2);
  }

  function arrowHead(c: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, size: number) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - dx * size - dy * size * 0.6, y - dy * size + dx * size * 0.6);
    c.lineTo(x - dx * size + dy * size * 0.6, y - dy * size - dx * size * 0.6);
    c.closePath();
    c.fill();
  }

  function drawAim(c: CanvasRenderingContext2D, g: Game) {
    const w = g.world, r = w.r[STRIKER];
    const sx = X(w.x[STRIKER]), sy = Y(w.y[STRIKER]);
    const dx = Math.sin(live.aim), dy = -Math.cos(live.aim);
    const ready = phaseRef.current === "ready" && !live.pulling && !live.charging;

    // First screen: a ghost finger showing the pull.
    if (ready) {
      const t = live.calm ? 0.75 : (live.clock % 1.8) / 1.8, reach = 30 + 110 * Math.min(1, t * 1.4);
      c.strokeStyle = "rgba(255,248,232,.85)"; c.lineWidth = 4; c.setLineDash(DASH);
      c.beginPath(); c.moveTo(sx, sy + r + 4); c.lineTo(sx, sy + reach); c.stroke();
      c.setLineDash(SOLID);
      c.fillStyle = "rgba(255,248,232,.9)";
      c.beginPath(); c.arc(sx, sy + reach, 9, 0, TAU); c.fill();
    }

    // The pull line behind the striker and a power ring round it.
    if (live.power > 0) {
      const back = r + 10 + live.power * 150;
      c.strokeStyle = "rgba(36,20,10,.55)"; c.lineWidth = 7; c.lineCap = "round";
      c.beginPath(); c.moveTo(sx - dx * r, sy - dy * r); c.lineTo(sx - dx * back, sy - dy * back); c.stroke();
      c.lineCap = "butt";
      c.strokeStyle = live.power < 0.45 ? "#2f8f5b" : live.power < 0.8 ? "#e0a020" : "#d0412f";
      c.lineWidth = 5;
      c.beginPath(); c.arc(sx, sy, r + 7, -Math.PI / 2, -Math.PI / 2 + live.power * TAU); c.stroke();
    }

    // Aim: a short arrow always; with নিশানা রেখা, dots to the first touch, a ghost striker, and where the hit disc will go.
    c.fillStyle = INK; c.strokeStyle = INK;
    if (!live.assist) {
      c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(sx + dx * (r + 4), sy + dy * (r + 4)); c.lineTo(sx + dx * (r + 58), sy + dy * (r + 58)); c.stroke();
      arrowHead(c, sx + dx * (r + 72), sy + dy * (r + 72), dx, dy, 15);
      return;
    }
    const wdx = live.flip ? -dx : dx, wdy = live.flip ? -dy : dy;
    const hit = firstHit(w, w.x[STRIKER], w.y[STRIKER], wdx, wdy, live.hit);
    const hx = X(w.x[STRIKER] + wdx * hit.t), hy = Y(w.y[STRIKER] + wdy * hit.t);
    c.lineWidth = 4; c.lineCap = "round"; c.setLineDash(DOTS);
    c.beginPath(); c.moveTo(sx + dx * (r + 4), sy + dy * (r + 4)); c.lineTo(hx, hy); c.stroke();
    c.lineCap = "butt";
    c.lineWidth = 2.5; c.setLineDash(DASH);
    c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.stroke();
    c.setLineDash(SOLID);
    if (hit.disc >= 0) {
      const cx = X(w.x[hit.disc]), cy = Y(w.y[hit.disc]);
      let nx = cx - hx, ny = cy - hy;
      const length = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= length; ny /= length;
      // Where the coin goes: a light arrow with a dark edge, readable on light wood and dark coins alike.
      for (let pass = 0; pass < 2; pass++) {
        c.strokeStyle = c.fillStyle = pass ? GLOW : INK_SOLID;
        c.lineWidth = pass ? 3.5 : 7.5;
        c.beginPath(); c.moveTo(cx + nx * 19, cy + ny * 19); c.lineTo(cx + nx * 86, cy + ny * 86); c.stroke();
        arrowHead(c, cx + nx * (pass ? 99 : 102), cy + ny * (pass ? 99 : 102), nx, ny, pass ? 13 : 17);
      }
    } else {
      // Off the cushion: a short dotted bounce.
      const ex = w.x[STRIKER] + wdx * hit.t, ey = w.y[STRIKER] + wdy * hit.t;
      const bx = ex <= r + 0.5 || ex >= BOARD - r - 0.5 ? -dx : dx, by = ey <= r + 0.5 || ey >= BOARD - r - 0.5 ? -dy : dy;
      c.setLineDash(DOTS); c.lineWidth = 3.5; c.globalAlpha = 0.55; c.lineCap = "round";
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + bx * 110, hy + by * 110); c.stroke();
      c.setLineDash(SOLID); c.globalAlpha = 1; c.lineCap = "butt";
    }
  }

  function draw() {
    const c = live.context, background = live.background;
    if (!c || !background) return;
    const g = game.current, w = g.world, t = live.clock, now = phaseRef.current;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, TOTAL, TOTAL);
    c.translate(RAIL, RAIL);

    // A ring at a pocket when something drops in: it grows, or in slow mode just fades.
    for (let p = 0; p < 4; p++) {
      const since = t - live.popAt[p];
      if (since < 0 || since > POP_TIME) continue;
      const px = X(POCKET_X[p]), py = Y(POCKET_Y[p]), k = since / POP_TIME;
      c.globalAlpha = 1 - k;
      c.strokeStyle = live.popKind[p] === 2 ? "#ff8a7a" : "#fff3d6"; c.lineWidth = 4;
      c.beginPath(); c.arc(px, py, 26 + (live.calm ? 6 : k * 34), 0, TAU); c.stroke();
      c.globalAlpha = 1;
    }

    for (let i = 0; i < COUNT; i++) {
      if (w.on[i]) {
        if (i === STRIKER && g.phase === "over") continue;
        sprite(c, kindOf(i), X(w.x[i]), Y(w.y[i]), w.r[i]);
        continue;
      }
      const since = t - live.fallAt[i], p = w.pocket[i];
      if (since < 0 || since > FALL_TIME || p < 0) continue;
      const k = since / FALL_TIME;
      c.globalAlpha = 1 - k;
      sprite(c, kindOf(i), X(w.x[i] + (POCKET_X[p] - w.x[i]) * k), Y(w.y[i] + (POCKET_Y[p] - w.y[i]) * k), w.r[i] * (1 - 0.45 * k));
      c.globalAlpha = 1;
    }

    if (g.phase === "aim" && (now === "ready" || now === "playing")) {
      if (live.blocked) {
        c.strokeStyle = "#d0412f"; c.lineWidth = 4;
        c.beginPath(); c.arc(X(w.x[STRIKER]), Y(w.y[STRIKER]), w.r[STRIKER] + 4, 0, TAU); c.stroke();
      }
      drawAim(c, g);
    }

    // +১, কুইন!, ফাউল! rise from the pocket towards the middle.
    c.font = FONT_POP; c.textAlign = "center"; c.lineJoin = "round";
    for (let p = 0; p < 4; p++) {
      const since = t - live.popAt[p], kind = live.popKind[p];
      if (since < 0 || since > POP_TIME || (kind === 0 && g.mode === "duo")) continue;
      const px = X(POCKET_X[p]), py = Y(POCKET_Y[p]), lift = live.calm ? 0 : since * 30;
      const tx = px + (px < BOARD / 2 ? 80 : -80), ty = py + (py < BOARD / 2 ? 92 - lift : -66 - lift);
      c.globalAlpha = since < 0.6 ? 1 : 1 - (since - 0.6) / (POP_TIME - 0.6);
      c.lineWidth = 7; c.strokeStyle = "#2a1a10"; c.strokeText(POP_TEXT[kind], tx, ty);
      c.fillStyle = kind === 2 ? "#ff9a8a" : kind === 0 ? "#fff3d6" : "#ffd36b";
      c.fillText(POP_TEXT[kind], tx, ty);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(TOTAL * k); background.height = Math.round(TOTAL * k);
    const b = background.getContext("2d")!;
    b.setTransform(k, 0, 0, k, 0, 0);
    paintBoard(b);
    const side = Math.ceil(SPRITE_R * SPRITE_PAD * 2 * k);
    KINDS.forEach((kind, index) => {
      const s = live.sprites[index] ??= document.createElement("canvas");
      s.width = s.height = side;
      const sc = s.getContext("2d")!;
      sc.setTransform(side / (SPRITE_R * SPRITE_PAD * 2), 0, 0, side / (SPRITE_R * SPRITE_PAD * 2), 0, 0);
      sc.clearRect(0, 0, SPRITE_R * SPRITE_PAD * 2, SPRITE_R * SPRITE_PAD * 2);
      paintDisc(sc, kind, SPRITE_R * SPRITE_PAD, SPRITE_R * SPRITE_PAD, SPRITE_R);
    });
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
      element.style.width = `${width}px`;
      element.style.height = `${width}px`;
      Object.assign(live, { width, scale: width / TOTAL, context: fitCanvas(element, width, width) });
      paint();
      draw();
    };
    layout();
    // The pops are canvas text: draw again once the Bangla font is in.
    loadCardFonts("কুইন! ফাউল! +১ +৩").then(() => draw()).catch(() => {});
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // In-page jumps don't touch the hash, so only a real challenge link counts.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared);
      setMode(shared.mode);
      reset(shared.mode, shared.mode === "solo" ? shared.seed : newSeed(), shared.mode === "solo" ? shared.level ?? 0 : levelRef.current);
      go("ready");
      return true;
    };
    setSite(window.location.host);
    try {
      if (localStorage.getItem(ASSIST_KEY) === "0") setAssist(false);
      if (localStorage.getItem(BIG_KEY) === "1") { setBig(true); bigRef.current = true; }
    } catch { /* private mode: fine */ }
    // Without a link, the board waits for the saved stars (the effect below picks the board).
    readFriend();
    const onHash = () => { readFriend(); };
    const hide = () => { if (document.hidden) { pause(); letGo(); } };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("blur", letGo);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", onHash); window.removeEventListener("blur", letGo); document.removeEventListener("visibilitychange", hide); window.clearTimeout(bannerTimer.current); timers.current.forEach(clearTimeout); stopHum(); };
  }, []);

  // Once the stars are read: a pre-boards best becomes board 1's stars (once), then a new visitor opens on the furthest board without three stars.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    chosen.current = true;
    let stars = levels.stars;
    const moved = migrateBest(stars, stored(`ektukhani-best-${TOOL}`));
    if (moved) { levels.record(1, moved); stars = { 1: moved }; }
    if (friend || phaseRef.current !== "ready" || game.current.mode !== "solo" || game.current.strikes > 0) return;
    const at = startLevel(stars, unlockedLevel(stars, LEVEL_COUNT));
    if (at !== levelRef.current) reset("solo", LEVELS[at - 1].seed, at);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow, assist]);

  const keyHandler = useRef<(event: KeyboardEvent, down: boolean) => void>(() => {});
  keyHandler.current = (event, down) => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key, now = phaseRef.current, active = now === "ready" || now === "playing";
    if (key === "ArrowLeft" || key === "ArrowRight") {
      if (!active || !boardInView) return;
      event.preventDefault();
      const dir = key === "ArrowLeft" ? -1 : 1;
      if (event.shiftKey) { if (down) moveStriker(game.current.u + dir * 0.02); return; }
      if (down && !event.repeat) live.aim = clampAim(live.aim + dir * 0.02);
      live.turnDir = down ? dir : 0;
      return;
    }
    if (key === " " || key === "Enter") {
      const onShoot = Boolean(target?.closest?.(".cr-shoot"));
      if (!onShoot && (target?.closest?.("button, a, summary") || !boardInView)) return;
      event.preventDefault();
      if (now === "paused") { if (down) resume(); return; }
      if (now === "over") { if (down && !onShoot) restart(); return; }
      if (!active || game.current.phase !== "aim") return;
      if (down && !event.repeat && !live.charging) { live.charging = true; live.chargeAt = live.clock; setCharging(true); }
      else if (!down && live.charging) fire(live.power);
      return;
    }
    if (!down || !boardInView) return;
    if (key === "Escape" || key === "p" || key === "P") { if (now === "playing") pause(); else resume(); }
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
    loadCardFonts("ক্যারম ১০ চালে ৭ পয়েন্ট জিতল").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // --- pointer: drag back anywhere on the board to aim and set power; slide the striker itself sideways; a still tap aims at that spot.
  const capture = (event: ReactPointerEvent<HTMLElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ } };
  const toView = (clientX: number, clientY: number) => {
    const box = canvas.current!.getBoundingClientRect();
    return { x: (clientX - box.left) / live.scale - RAIL, y: (clientY - box.top) / live.scale - RAIL };
  };

  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    const now = phaseRef.current, g = game.current;
    if (event.button > 0 || (event.target as Element).closest("button") || live.gesture.id !== -1 || live.charging) return;
    if ((now !== "ready" && now !== "playing") || g.phase !== "aim") return;
    const at = toView(event.clientX, event.clientY), w = g.world;
    const near = Math.hypot(at.x - X(w.x[STRIKER]), at.y - Y(w.y[STRIKER])) * live.scale < Math.max(26, w.r[STRIKER] * live.scale + 14);
    Object.assign(live.gesture, { id: event.pointerId, startX: event.clientX, startY: event.clientY, mode: 0, onStriker: near, u0: g.u });
    capture(event);
    // A touch answers at once (and wakes the audio for the pull's hum).
    sfx.tick();
  }
  function onBoardMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    const dx = gesture.startX - event.clientX, dy = gesture.startY - event.clientY;
    if (gesture.mode === 0) {
      if (Math.hypot(dx, dy) < TAP_SLOP) return;
      gesture.mode = gesture.onStriker && Math.abs(dx) > Math.abs(dy) * 1.2 ? 2 : 1;
      if (gesture.mode === 1) live.pulling = true;
    }
    if (gesture.mode === 2) { moveStriker(gesture.u0 - dx / (live.scale * (BASE_MAX - BASE_MIN))); return; }
    // Slingshot: the shot goes opposite to the pull.
    const backward = dy > 4;
    live.aim = clampAim(Math.atan2(dx, -dy));
    live.power = backward ? 0 : Math.min(1, Math.hypot(dx, dy) / Math.max(90, live.width * 0.36));
    setHint(backward ? "backward" : "pulling");
  }
  function onBoardUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    gesture.id = -1;
    if (gesture.mode === 1) { fire(live.power); return; }
    if (gesture.mode === 0) {
      // A still tap aims at that spot.
      const at = toView(event.clientX, event.clientY), w = game.current.world;
      const tx = at.x - X(w.x[STRIKER]), ty = at.y - Y(w.y[STRIKER]);
      if (ty < -8) live.aim = clampAim(Math.atan2(tx, -ty));
    }
  }
  function onBoardCancel() { live.gesture.id = -1; live.pulling = false; live.power = 0; setHint(null); }

  // মারো: hold and the power swings up and down; let go to flick.
  function onShootDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button > 0 || game.current.phase !== "aim") return;
    const now = phaseRef.current;
    if (now !== "ready" && now !== "playing") return;
    capture(event);
    sfx.tap();
    live.charging = true;
    live.chargeAt = live.clock;
    setCharging(true);
  }
  function onShootUp() { if (live.charging) fire(live.power); }
  function onShootCancel() { if (live.charging) { letGo(); } }

  function onTurnDown(event: ReactPointerEvent<HTMLButtonElement>, dir: number) {
    if (event.button > 0) return;
    capture(event);
    sfx.tick();
    live.aim = clampAim(live.aim + dir * 0.0175);
    live.turnDir = dir;
  }
  const onTurnUp = () => { live.turnDir = 0; };

  function switchMode(next: Mode) {
    if (next === mode) return;
    const g = game.current;
    if (g.mode === "duo" && g.strikes > 0 && g.phase !== "over" && !window.confirm("এই বোর্ডটা বাদ দিয়ে নতুন খেলা শুরু হবে। ঠিক আছে?")) return;
    setMode(next);
    reset(next, next === "solo" ? soloSeed(levelRef.current) : newSeed());
    go("ready");
  }
  function toggleAssist() {
    const next = !assist;
    setAssist(next);
    try { localStorage.setItem(ASSIST_KEY, next ? "1" : "0"); } catch { /* private mode: fine */ }
  }
  function toggleBig() {
    const next = !big, g = game.current;
    setBig(next);
    bigRef.current = next;
    try { localStorage.setItem(BIG_KEY, next ? "1" : "0"); } catch { /* private mode: fine */ }
    setStrikerSize(g, next);
    if (g.phase === "aim") { placeStriker(g, nearestFree(g, g.u)); sync(); draw(); }
  }
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFromCard() {
    reset(mode, mode === "solo" ? soloSeed(levelRef.current) : newSeed());
    go("ready");
    play.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  const over = phase === "over" && result;
  const aiming = (phase === "ready" || phase === "playing") && !moving;
  // Compare with the friend only on the friend's own board.
  const soloFriend = friend?.mode === "solo" && game.current.seed === friend.seed ? friend : null;
  const spec = level ? LEVELS[level - 1] : null;
  const allStars = totalStars(levels.stars);
  const open = Math.max(levels.unlocked, level);
  const won = Boolean(result && result.stars > 0);
  const hasNext = phase === "over" && mode === "solo" && won && level > 0 && level < LEVEL_COUNT;
  const near = result?.shared.mode === "solo" ? nearLine(result.shared.points, level, result.before) : "";
  // The next target on this board, always in view while playing.
  const goal = !spec ? "" : hud.points < spec.one ? `পার হতে ${bn(spec.one)}` : hud.points < spec.two ? `★★ ${bn(spec.two)}` : hud.points < spec.three ? `★★★ ${bn(spec.three)}` : "★★★ হয়ে গেছে";
  const line = phase === "paused" ? "থেমে আছে। তৈরি হলে চালিয়ে যাও।"
    : phase === "over" ? (mode === "solo" ? "দশ চাল শেষ!" : "বোর্ড শেষ!")
    : hint ? HINTS[hint] : moving ? "গুটি গড়াচ্ছে…" : noteText(hud.note, hud);
  const tone = hint === "blocked" || hint === "backward" || hud.note === "foul" ? "bad" : hud.note === "pocket" || hud.note === "queen" || hud.note === "cover" || hud.note === "again" ? "good" : "plain";
  const queenChip = hud.queen === "pending" ? "কুইন: কভার করো!" : hud.queen === "covered" && hud.queenBy !== -1 ? `কুইন ${SIDE_OF[hud.queenBy]}` : "";

  return (
    <div className="cr">
      {friend && (
        <section className="cr-friend" aria-labelledby="cr-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={friend.mode === "solo" ? `${possessive(friend.name || "বন্ধু")} কার্ড: ${bn(friend.points)} পয়েন্ট` : "দুজনের ক্যারম বোর্ডের কার্ড"} />
          <div>
            <h2 id="cr-friend-title">{banner(friend)}</h2>
            {friend.mode === "solo" && <p>{possessive(friend.name || "বন্ধু")} নিজের ফোনের ফল</p>}
          </div>
        </section>
      )}

      <div className="cr-top">
        <div className="cr-modes" role="group" aria-label="কীভাবে খেলবে">
          <button type="button" aria-pressed={mode === "solo"} onClick={() => switchMode("solo")}>একা · দশ চাল</button>
          <button type="button" aria-pressed={mode === "duo"} onClick={() => switchMode("duo")}>দুজনে</button>
        </div>
        <button type="button" className="cr-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <button type="button" className="cr-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"} aria-label={phase === "paused" ? "চালিয়ে যাও" : "একটু থামাও"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{phase === "paused" ? <path d="M8 5v14l11-7z" className="cr-fill" /> : <path d="M9 5v14M15 5v14" />}</svg>
        </button>
      </div>

      {mode === "solo" && (
        <p className="cr-level"><span><b>{level ? `বোর্ড ${bn(level)}` : "বন্ধুর বোর্ড"}</b>{spec && ` · ${spec.name}`}</span>{level > 0 && <span aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span>}</p>
      )}
      {mode === "solo" ? (
        <div className="cr-status">
          <p><span>চাল</span><b>{bn(Math.min(hud.strikes + (phase === "over" ? 0 : 1), STRIKES))}</b><span>/{bn(STRIKES)}</span></p>
          <p><span>পয়েন্ট</span><b>{bn(hud.points)}</b></p>
          {best !== null && <p className="cr-best"><span>সেরা</span><b>{bn(best)}</b></p>}
          {goal && <p className="cr-goal">{goal}</p>}
        </div>
      ) : (
        <div className="cr-status">
          {([0, 1] as const).map(side => (
            <p key={side} className="cr-side" data-on={hud.turn === side && phase !== "over"} aria-current={hud.turn === side && phase !== "over" ? "true" : undefined}>
              <i data-side={side} aria-hidden="true" /><span>{SIDE_NAME[side]}</span><b>{bn(side === 0 ? hud.white : hud.black)}</b><span>/{bn(PER_SIDE)}</span>
            </p>
          ))}
          {queenChip && <p className="cr-queen" data-pending={hud.queen === "pending"}>{queenChip}</p>}
        </div>
      )}

      <div className="cr-play" ref={play} data-phase={phase}>
        <div className="cr-board" ref={board} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp} onPointerCancel={onBoardCancel} onContextMenu={event => event.preventDefault()}>
          <canvas ref={canvas} role="img" aria-label={mode === "solo" ? `ক্যারম বোর্ড${level ? ` ${bn(level)}` : ""}। চাল ${bn(hud.strikes)}/${bn(STRIKES)}, ${bn(hud.points)} পয়েন্ট।` : `ক্যারম বোর্ড। ${SIDE_OF[hud.turn]} পালা। সাদা ${bn(hud.white)}টা, কালো ${bn(hud.black)}টা ঢুকিয়েছে।`} />
          {phase === "ready" && !hint && !charging && <p className="cr-pill" aria-hidden="true">টেনে ছাড়ো</p>}
          {turnBanner !== null && phase === "playing" && (
            <div className="cr-overlay" aria-live="polite">
              <p className="cr-turn-note"><i data-side={turnBanner} aria-hidden="true" />{SIDE_OF[turnBanner]} পালা</p>
            </div>
          )}
          {phase === "paused" && (
            <div className="cr-overlay cr-block">
              <div className="cr-note">
                <p>থেমে আছে। তৈরি হলে চাপো।</p>
                <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
              </div>
            </div>
          )}
          {over && (
            <div className="cr-overlay cr-block">
              <div className="cr-note cr-slip" role="status">
                {result.shared.mode === "solo" ? (
                  <>
                    <h2>{won ? `বোর্ড ${bn(level)} পার!` : "দশ চাল শেষ"}</h2>
                    {result.stars > 0 && <StarReveal count={result.stars} />}
                    <p className="cr-final"><b>{bn(result.shared.points)}</b> পয়েন্ট</p>
                    {near && <p className="cr-near">{near}</p>}
                    <p className="cr-small">{piecesLine(result.shared.points, result.shared.queen)}</p>
                    <p className="cr-small">{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && best > result.shared.points ? `${level ? "এই বোর্ডে" : "এই ফোনে"} সেরা ${bn(best)}` : humanLine(result.shared.points)}</p>
                    {soloFriend && <p className="cr-versus">{compareLine(result.shared.points, soloFriend.points, soloFriend.name)}</p>}
                  </>
                ) : (
                  <>
                    <h2>{SIDE_NAME[result.shared.winner]} জিতল!</h2>
                    <p className="cr-final"><b>{bn(result.shared.points)}</b> পয়েন্ট</p>
                    <p className="cr-small">{duoLine(result.shared.points)}</p>
                  </>
                )}
                <button type="button" className="kit-link cr-see" onClick={seeCard}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
              </div>
            </div>
          )}
        </div>

        <p className="cr-hint" data-tone={tone} aria-live="polite">{line}</p>

        <label className="cr-slide">
          <span>স্ট্রাইকার সরাও</span>
          <input type="range" aria-label="স্ট্রাইকার সরাও" min={0} max={1000} step={1} value={Math.round(u * 1000)} disabled={!aiming} onChange={event => moveStriker(Number(event.target.value) / 1000)} />
        </label>

        <div className="cr-controls" data-two={hasNext}>
          {phase === "over" ? (
            <>
              {hasNext && <button type="button" className="kit-primary cr-again" onClick={() => pick(level + 1)} disabled={!restartReady}>পরের বোর্ড</button>}
              <button type="button" className={hasNext ? "kit-secondary cr-again" : "kit-primary cr-again"} onClick={restart} disabled={!restartReady}>{mode === "solo" ? won ? "আবার খেলো" : "আরেকবার" : "নতুন বোর্ড"}</button>
            </>
          ) : (
            <>
              <button type="button" className="cr-turn" aria-label="নিশানা বাঁয়ে" disabled={!aiming}
                onPointerDown={event => onTurnDown(event, -1)} onPointerUp={onTurnUp} onPointerCancel={onTurnUp} onLostPointerCapture={onTurnUp}
                onClick={event => { if (event.detail === 0) live.aim = clampAim(live.aim - 0.035); }} onContextMenu={event => event.preventDefault()}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
              </button>
              <button type="button" className="cr-shoot" data-on={charging} disabled={!aiming}
                onPointerDown={onShootDown} onPointerUp={onShootUp} onPointerCancel={onShootCancel}
                onClick={event => { if (event.detail === 0 && !live.charging) fire(0.6); }} onContextMenu={event => event.preventDefault()}>
                <b>মারো</b><span>{charging ? "ছাড়লেই টোকা" : "চেপে ধরো"}</span>
              </button>
              <button type="button" className="cr-turn" aria-label="নিশানা ডানে" disabled={!aiming}
                onPointerDown={event => onTurnDown(event, 1)} onPointerUp={onTurnUp} onPointerCancel={onTurnUp} onLostPointerCapture={onTurnUp}
                onClick={event => { if (event.detail === 0) live.aim = clampAim(live.aim + 0.035); }} onContextMenu={event => event.preventDefault()}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="cr-options">
        <button type="button" aria-pressed={assist} onClick={toggleAssist}>নিশানা রেখা</button>
        <button type="button" aria-pressed={big} onClick={toggleBig}>বড় স্ট্রাইকার</button>
        <SoundToggle compact className="cr-sound" onChange={stopHum} />
      </div>

      <details className="cr-levels">
        <summary>সব বোর্ড <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>একা খেলার দশটা বোর্ড, পাড়ার ক্লাবঘর থেকে টুর্নামেন্টের ফাইনাল। প্রতিটায় দশ চাল, পয়েন্ট যত বেশি, তারা তত বেশি। পার হলে পরের বোর্ড খোলে, খোলা বোর্ড খোলাই থাকে।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={mode === "solo" ? level : undefined} onPick={pick} noun="বোর্ড" />
      </details>

      <details className="cr-rules" open={mode === "duo"}>
        <summary>আমাদের নিয়ম</summary>
        <p><b>একা:</b> {SOLO_RULE}</p>
        <p><b>দুজনে:</b></p>
        <ol>{RULES.map(rule => <li key={rule}>{rule}</li>)}</ol>
      </details>

      <section className="cr-result" id="result" ref={resultBox} aria-labelledby="cr-result-title">
        <div className="cr-result-head">
          <h2 id="cr-result-title">{result ? result.shared.mode === "solo" ? <><em>{bn(result.shared.points)} পয়েন্ট</em>, কার্ড তৈরি</> : <><em>{SIDE_NAME[result.shared.winner]} জিতল</em>, কার্ড তৈরি</> : "খেলা শেষে তোমার ক্যারমের কার্ড"}</h2>
          <p>{result ? result.shared.mode === "solo" ? soloFriend ? compareLine(result.shared.points, soloFriend.points, soloFriend.name) : humanLine(result.shared.points) : duoLine(result.shared.points) : "দশ চাল খেললেই এখানে পয়েন্টসহ একটা কার্ড আসবে। বন্ধুকে পাঠালে সে একই জায়গায় ছড়ানো গুটি পাবে।"}</p>
        </div>
        {card && (
          <div className="cr-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cr-card-summary" />
              <figcaption id="cr-card-summary" className="cr-sr">{card.mode === "solo" ? `ক্যারমের কার্ড${card.level ? `, বোর্ড ${bn(card.level)}` : ""}: ${bn(STRIKES)} চালে ${bn(card.points)} পয়েন্ট, ${piecesLine(card.points, card.queen)}। ${humanLine(card.points)}` : `ক্যারমের কার্ড: ${playerName(card.winner, card.name)} জিতল, ${bn(card.points)} পয়েন্টে।`}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cr-share">
              {card.mode === "solo" ? (
                <label className="cr-name">
                  <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
                </label>
              ) : (
                <div className="cr-names">
                  {([0, 1] as const).map(side => (
                    <label className="cr-name" key={side}>
                      <span>{SIDE_OF[side]} নাম <small>না দিলেও চলবে</small></span>
                      <input value={names[side]} maxLength={MAX_NAME} onChange={event => setNames(side === 0 ? [event.target.value, names[1]] : [names[0], event.target.value])} placeholder={side === 0 ? "যেমন: রাফি" : "যেমন: মিতু"} />
                    </label>
                  ))}
                </div>
              )}
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="carrom.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint={card.mode === "solo" ? "বন্ধু লিংক খুললে একই জায়গায় ছড়ানো গুটি পাবে। পয়েন্টটা তোমার নিজের ফোনের ফল।" : "লিংক খুললে কার্ডটা দেখবে, তারপর ওরাও দুজনে খেলতে পারবে।"} />
              <button type="button" className="kit-link cr-again-link" onClick={playFromCard}>{mode === "solo" ? "আরেকবার খেলো" : "নতুন বোর্ড খেলো"}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

