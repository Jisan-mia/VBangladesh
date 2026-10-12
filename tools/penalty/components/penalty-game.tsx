"use client";
// IP: what we avoided — no real club, national team, league, kit, player, trophy or stadium, and no football-game brand's look or HUD; ours is a made-up পাড়ার দল in plain orange on a school field with a bamboo goal and a fishing-net mesh, against eight invented local teams in plain single colours.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { aimFrom, powerFrom, spotShot, swipeShot, toScreenX, toScreenY, BALL_R, GTOP, GW, GX, GY, H, SPOT_X, SPOT_Y, W } from "../lib/aim";
import { drawBall, drawCrosshair, drawField, drawGoalFrame, drawKeeper, drawKicker, drawMeter, drawNet, drawRipple, drawTrail } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  bannerNote, bn, caption, clearLine, compareLine, feat, humanLine, kickLine, levelLabel, lossLine, nearMissLine, parseShared, realWin, score, sharedHash,
  type Shared,
} from "../lib/link";
import {
  decided, makePlans, nextSide, resolveSave, resolveShot, roundOf, shotTarget, starsOf, suddenDeath, tally, DIVE, KICKS, MAX_ROUNDS,
  type Kick, type KickResult, type Plans, type Shot, type Zone,
} from "../lib/match";
import { bambooKnock, crowd, gloveSave, kickThump, murmur, netSwish, whistle } from "../lib/sound";
import { opponentOf, LEVEL_COUNT, STAGES, US } from "../lib/teams";

const TOOL = "penalty";
const ACCENT = "#1f6f43";
const MAX_WIDTH = 480;
const TAP_SLOP = 10;
const TRAIL = 48;
/** Seconds, at normal speed; slow mode stretches them. */
const READY = 0.7, RUN = 1.5, AFTER = 1.15, METER_PERIOD = 1.5, SLOW = 0.6;
const DEFAULT_AIM = { x: GX, y: GY - 26 };

type Phase = "play" | "won" | "lost";
type Stage = "aim" | "ready" | "run" | "fly" | "after";
type AimMode = "idle" | "swipe" | "meter" | "keys";
type Result = { us: number; them: number; stars: number; improved: boolean; sudden: boolean; frame: number };

const wave = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period);
const ease = (t: number) => 1 - (1 - t) * (1 - t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, scale: 1,
    background: null as HTMLCanvasElement | null,
    level: 1, seed: 1, plans: null as Plans | null, kicks: [] as Kick[],
    stage: "aim" as Stage, side: 0 as 0 | 1, t: 0, clock: 0, flyTime: 0.5,
    aim: "idle" as AimMode, aimX: DEFAULT_AIM.x, aimY: DEFAULT_AIM.y, aimed: false, power: 0.5, meterFrom: 0,
    // the ball's flight: start, bend, end, then where it rolls after
    fromX: SPOT_X, fromY: SPOT_Y, ctrlX: SPOT_X, ctrlY: SPOT_Y, toX: SPOT_X, toY: SPOT_Y, endX: SPOT_X, endY: SPOT_Y,
    ballX: SPOT_X, ballY: SPOT_Y, ballR: BALL_R, spin: 0,
    result: null as KickResult | null, dive: null as Zone | null, ripple: 0,
    // the swipe, in board units and ms
    xs: new Float32Array(TRAIL), ys: new Float32Array(TRAIL), ts: new Float64Array(TRAIL), count: 0, pointer: -1, downX: 0, downY: 0, moved: false,
    streak: 0, paused: false, calm: false, reduced: false,
    hum: null as ReturnType<typeof murmur> | null,
  };
}

export function PenaltyGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhaseState] = useState<Phase>("play");
  const [stage, setStageState] = useState<Stage>("aim");
  const [aim, setAimState] = useState<AimMode>("idle");
  const [kicks, setKicks] = useState<Kick[]>([]);
  const [dive, setDiveState] = useState<Zone | null>(null);
  const [side, setSideState] = useState<0 | 1>(0);
  const [call, setCall] = useState("");
  const [note, setNote] = useState("");
  const [streak, setStreak] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [seed, setSeed] = useState(1);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [live] = useState(makeLive);

  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const chosen = useRef(false);
  const kicked = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = result && phase === "won" && realWin(result.us, result.them) ? { level, seed, us: result.us, them: result.them, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const opponent = opponentOf(level);

  function setStage(next: Stage) { live.stage = next; live.t = 0; setStageState(next); }
  function setAim(next: AimMode) { live.aim = next; setAimState(next); }
  function setDive(next: Zone | null) { live.dive = next; setDiveState(next); }
  function stopHum() { live.hum?.stop(); live.hum = null; }

  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d");
    if (!b) return;
    b.setTransform(k, 0, 0, k, 0, 0);
    drawField(b);
    drawNet(b);
    drawGoalFrame(b);
  }

  /** A fresh match. Restarting takes one frame. */
  function startMatch(next: number, matchSeed = newSeed(), byPlayer = true) {
    if (byPlayer) chosen.current = true;
    stopHum();
    Object.assign(live, { level: next, seed: matchSeed, plans: makePlans(next, matchSeed), kicks: [], streak: 0, paused: false, ripple: 0, result: null, pointer: -1, count: 0, aimed: false, aimX: DEFAULT_AIM.x, aimY: DEFAULT_AIM.y });
    setDive(null);
    setLevel(next); setSeed(matchSeed); setKicks([]); setCall(""); setNote(""); setStreak(0); setResult(null); setPaused(false);
    setPhaseState("play");
    toAim();
  }

  function toAim() {
    live.side = 0; setSideState(0);
    resetBall();
    setAim("idle");
    setStage("aim");
  }

  function resetBall() { Object.assign(live, { ballX: SPOT_X, ballY: SPOT_Y, ballR: BALL_R, spin: 0, result: null }); }

  /** Sets up the ball's path from the spot to (x, y) in goal units, bending by `curve`. */
  function flight(x: number, y: number, curve: number, power: number) {
    const tx = toScreenX(x), ty = toScreenY(y);
    const mx = (SPOT_X + tx) / 2, my = (SPOT_Y + ty) / 2, dx = tx - SPOT_X, dy = ty - SPOT_Y, length = Math.hypot(dx, dy) || 1;
    // The swipe bowed right of travel → the ball's path bows right too, then comes back to the target.
    Object.assign(live, {
      fromX: SPOT_X, fromY: SPOT_Y, toX: tx, toY: ty,
      ctrlX: mx + (-dy / length) * curve * 70, ctrlY: my + (dx / length) * curve * 70 - 14,
      endX: tx, endY: ty, flyTime: 0.62 - 0.24 * power,
    });
  }

  function shoot(shot: Shot) {
    if (live.stage !== "aim" || live.paused || !live.plans) return;
    kicked.current = true;
    const round = roundOf(live.kicks) % MAX_ROUNDS;
    const res = resolveShot(live.level, live.plans.keeper[round], shot);
    live.result = res;
    flight(res.outcome === "saved" ? res.bx : shot.x, res.outcome === "saved" ? res.by : Math.max(0.04, res.by), shot.curve, shot.power);
    if (res.outcome === "post" || res.outcome === "bar") {
      Object.assign(live, res.outcome === "post" ? { endX: live.toX + Math.sign(shot.x) * 34, endY: live.toY + 46 } : { endX: live.toX + shot.x * 20, endY: live.toY - 30 });
    } else if (res.outcome === "saved") {
      Object.assign(live, { endX: live.toX + (res.keeper === 1 ? (shot.x < 0 ? -18 : 18) : (res.keeper === 0 ? -24 : 24)), endY: live.toY + 34 });
    } else if (res.outcome === "goal") {
      Object.assign(live, { endX: live.toX, endY: live.toY + 6 });
    }
    live.count = 0;
    setAim("idle");
    setNote("");
    kickThump();
    setStage("fly");
  }

  /** The opponent's turn: whistle, run-up (with the lean), kick. */
  function toKeep() {
    live.side = 1; setSideState(1);
    resetBall();
    setDive(null);
    setCall("");
    setStage("ready");
    whistle();
  }

  function land() {
    const res = live.result;
    if (!res) return;
    const ours = live.side === 0, scored = res.outcome === "goal";
    const kick: Kick = { side: live.side, scored, result: res };
    live.kicks = [...live.kicks, kick];
    setKicks(live.kicks);
    setCall(kickLine(live.side, res, live.dive));
    const good = ours ? scored : !scored;
    if (scored) { netSwish(); live.ripple = 1; }
    if (res.outcome === "saved") gloveSave();
    if (res.outcome === "post" || res.outcome === "bar") bambooKnock();
    if (good) {
      crowd(true);
      live.streak++;
      if (live.streak >= 2) sfx.combo(live.streak - 2);
    } else {
      if (ours && res.close) crowd(false);
      live.streak = 0;
      if (ours) shake(scoreRef.current);
    }
    setStreak(live.streak);
    setStage("after");
  }

  function next() {
    const t = tally(live.kicks);
    if (decided(t)) { finish(); return; }
    if (nextSide(live.kicks) === 0) { whistle(); setCall(""); toAim(); }
    else toKeep();
  }

  function finish() {
    stopHum();
    const t = tally(live.kicks), stars = starsOf(t.us, t.them), sudden = live.kicks.length > KICKS * 2;
    const frame = live.kicks.filter(kick => kick.side === 0 && (kick.result.outcome === "post" || kick.result.outcome === "bar")).length;
    whistle(true);
    if (!stars) {
      setResult({ us: t.us, them: t.them, stars: 0, improved: false, sudden, frame });
      setPhaseState("lost");
      sfx.lose();
      return;
    }
    const before = levels.stars[live.level] ?? 0;
    levels.record(live.level, stars);
    setResult({ us: t.us, them: t.them, stars, improved: before > 0 && stars > before, sudden, frame });
    setPhaseState("won");
    if (live.level === LEVEL_COUNT) { sfx.levelUp(); confetti({ colors: ["#e8682a", "#1f6f43", "#ffd23f", "#ffffff", "#3a86c8"] }); }
    else if (stars === 3) { sfx.win(); confetti({ colors: ["#e8682a", "#1f6f43", "#ffd23f", "#ffffff"] }); }
    else sfx.good();
  }

  function pickSide(zone: Zone) {
    if (live.paused || (live.stage !== "ready" && live.stage !== "run")) return;
    if (live.dive !== zone) sfx.tap();
    setDive(zone);
  }

  function tick(dt: number) {
    const k = slowRef.current ? SLOW : 1;
    live.clock += dt;
    if (live.ripple > 0) live.ripple = Math.max(0, live.ripple - dt * 1.6);
    if (live.paused) return;
    live.t += dt * k;
    const t = live.t;
    switch (live.stage) {
      case "aim":
        if (live.aim === "meter") live.power = 0.1 + 0.9 * wave(live.clock - live.meterFrom, (slowRef.current ? 1 / SLOW : 1) * METER_PERIOD);
        return;
      case "ready":
        if (t >= READY) { setStage("run"); live.hum ??= murmur(); }
        return;
      case "run": {
        live.hum?.set(t / RUN);
        if (t < RUN || !live.plans) return;
        stopHum();
        const plan = live.plans.shots[roundOf(live.kicks) % MAX_ROUNDS], target = shotTarget(plan);
        const res = resolveSave(plan, live.dive);
        live.result = res;
        flight(res.outcome === "saved" ? res.bx : target.x, res.outcome === "saved" ? res.by : target.y, 0, 0.7);
        if (res.outcome === "saved") Object.assign(live, { endX: live.toX + (target.x < 0 ? -22 : 22), endY: live.toY + 36 });
        else if (res.outcome === "post") Object.assign(live, { endX: live.toX + Math.sign(target.x) * 34, endY: live.toY + 46 });
        else if (res.outcome === "goal") Object.assign(live, { endX: live.toX, endY: live.toY + 6 });
        kickThump();
        setStage("fly");
        return;
      }
      case "fly": {
        const p = clamp01(t / live.flyTime), q = 1 - p;
        live.ballX = q * q * live.fromX + 2 * q * p * live.ctrlX + p * p * live.toX;
        live.ballY = q * q * live.fromY + 2 * q * p * live.ctrlY + p * p * live.toY;
        live.ballR = BALL_R - (BALL_R - 5.5) * p;
        if (!live.calm) live.spin += dt * 14;
        if (p >= 1) land();
        return;
      }
      case "after": {
        const p = ease(clamp01(t / 0.45));
        live.ballX = live.toX + (live.endX - live.toX) * p;
        live.ballY = live.toY + (live.endY - live.toY) * p;
        if (t >= AFTER) next();
        return;
      }
    }
  }

  /** The keeper on screen this frame: hips x, lift, tilt and crouch. */
  function keeperPose(c: CanvasRenderingContext2D) {
    const ours = live.side === 1, kit = ours ? US.keeperKit : opponentOf(live.level).keeperKit;
    let zone: Zone | null = null, progress = 0;
    if (live.stage === "fly" || live.stage === "after") {
      zone = live.result ? live.result.keeper : null;
      if (ours && live.dive === null) zone = null;
      // Their keeper reacts a beat after the kick; ours goes as the ball is struck.
      const start = ours ? 0 : live.flyTime * 0.12, length = 0.28;
      progress = live.stage === "after" ? 1 : ease(clamp01((live.t - start) / length));
    }
    if (zone === null) {
      const sway = live.calm ? 0 : Math.sin(live.clock * 1.8) * 3;
      const lean = ours && live.dive !== null && live.stage !== "fly" && live.stage !== "after" ? (live.dive - 1) * 8 : 0;
      const hop = progress > 0 ? Math.sin(progress * Math.PI) * 8 : 0;
      drawKeeper(c, GX + sway + lean, GY, 0, hop, live.calm ? 0.5 : 0.5 + Math.sin(live.clock * 3) * 0.3, kit);
      return;
    }
    const [kx, ky] = DIVE[zone];
    const side = zone === 0 ? -1 : zone === 2 ? 1 : 0;
    drawKeeper(c, GX + kx * GW * progress, GY, side * 1.2 * progress, (side ? ky * 70 : 14) * Math.sin(progress * Math.PI * 0.85), 0, kit);
  }

  function draw() {
    const c = live.context, background = live.background;
    if (!c || !background) return;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, W, H);
    const flying = live.stage === "fly" || live.stage === "after";
    // A ball past the goal line sits behind the keeper; one still on its way is in front.
    const behind = flying && live.ballY < GY - 2 && (live.result?.outcome === "goal" || live.result?.outcome === "over");
    if (live.ripple > 0) drawRipple(c, live.toX, live.toY, live.ripple);
    if (behind) drawBall(c, live.ballX, live.ballY, live.ballR, live.spin);
    keeperPose(c);
    if (live.side === 1) {
      const plan = live.plans?.shots[roundOf(live.kicks) % MAX_ROUNDS];
      const step = live.stage === "ready" ? 0 : live.stage === "run" ? live.t / RUN : 1;
      const tellAt = opponentOf(live.level).shooter.tellAt;
      const lean = plan ? plan.lean * ease(clamp01((step - tellAt) / 0.18)) : 0;
      const swing = live.stage === "fly" ? clamp01(live.t / 0.12) : live.stage === "after" ? 1 : 0;
      if (!behind) drawBall(c, live.ballX, live.ballY, live.ballR, live.spin);
      drawKicker(c, step, lean, swing, opponentOf(live.level).kit, opponentOf(live.level).shorts);
    } else {
      const swing = live.stage === "fly" ? clamp01(live.t / 0.12) : live.stage === "after" ? 1 : 0;
      drawKicker(c, 0.94, 0, swing, US.kit, US.shorts);
      if (!behind) drawBall(c, live.ballX, live.ballY, live.ballR, live.spin);
      if (live.stage === "aim") {
        if (live.aim === "swipe") drawTrail(c, live.xs, live.ys, live.count);
        if (live.aimed || live.aim !== "idle") drawCrosshair(c, live.aimX, live.aimY, ACCENT, false);
        if (live.aim === "meter" || live.aim === "swipe") drawMeter(c, live.power);
      }
    }
    c.restore();
  }

  const looping = !paused && phase === "play" && boardInView;
  useGameLoop(tick, draw, looping);

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
      Object.assign(live, { width, scale, context: fitCanvas(element, width, height) });
      paint();
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      setFriend(found);
      startMatch(found.level, found.seed);
    };
    const hide = () => {
      if (!document.hidden) return;
      stopHum();
      live.pointer = -1;
      if (live.aim === "swipe") { live.count = 0; setAim("idle"); }
      if (live.stage !== "aim") { live.paused = true; setPaused(true); }
    };
    setSite(window.location.host);
    if (!live.plans) startMatch(1, newSeed(), false);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopHum();
    };
  }, []);

  // Open at the next match to win once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current || kicked.current) return;
    startMatch(levels.unlocked, newSeed(), false);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`পেনাল্টি কিক ম্যাচ ১২৩ রাফি ${opponent.name} ${levelLabel(level)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  function resume() {
    live.paused = false;
    setPaused(false);
    if (live.stage === "run") live.hum ??= murmur();
  }

  /** A tap on the meter path: the first starts the power bar at the aim, the second kicks. */
  function tapKick() {
    if (live.stage !== "aim" || live.paused) return;
    if (live.aim === "meter") { shoot(spotShot(live.aimX, live.aimY, live.power)); return; }
    live.meterFrom = live.clock;
    live.aimed = true;
    setAim("meter");
    sfx.tap();
  }

  // ---- keys: arrows move the aim (or pick a side when keeping), Space/Enter: power bar, then kick ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]") || !boardInView) return;
    const key = event.key, arrow = key.startsWith("Arrow");
    if (phase === "play" && live.side === 1 && (arrow || key === " ")) {
      event.preventDefault();
      if (live.paused) { resume(); return; }
      pickSide(key === "ArrowLeft" ? 0 : key === "ArrowRight" ? 2 : 1);
      return;
    }
    if (phase === "play" && live.stage === "aim" && arrow && !live.paused) {
      event.preventDefault();
      if (live.aim !== "keys") setAim("keys");
      live.aimed = true;
      if (key === "ArrowLeft") live.aimX = Math.max(GX - GW * 1.3, live.aimX - 6);
      if (key === "ArrowRight") live.aimX = Math.min(GX + GW * 1.3, live.aimX + 6);
      if (key === "ArrowUp") live.aimY = Math.max(GTOP - 24, live.aimY - 5);
      if (key === "ArrowDown") live.aimY = Math.min(GY - 4, live.aimY + 5);
      return;
    }
    if (key !== " " && key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (live.paused) resume();
    else if (phase === "play") tapKick();
    else if (phase === "lost") startMatch(level, rival ? seed : newSeed());
    else if (phase === "won") startMatch(level < LEVEL_COUNT ? level + 1 : level);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: swipe from anywhere to kick; a still tap on the goal aims there (then a tap on the bar kicks) ----
  function boardPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / live.scale, y: (event.clientY - rect.top) / live.scale };
  }
  function addPoint(x: number, y: number, time: number) {
    if (live.count === TRAIL) { live.xs.copyWithin(0, 1); live.ys.copyWithin(0, 1); live.ts.copyWithin(0, 1); live.count--; }
    live.xs[live.count] = x; live.ys[live.count] = y; live.ts[live.count] = time; live.count++;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || phase !== "play" || live.paused || (event.target as Element).closest("button")) return;
    const { x, y } = boardPoint(event);
    Object.assign(live, { pointer: event.pointerId, downX: x, downY: y, moved: false, count: 0 });
    addPoint(x, y, event.timeStamp);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== live.pointer) return;
    const { x, y } = boardPoint(event);
    addPoint(x, y, event.timeStamp);
    if (!live.moved && Math.hypot(x - live.downX, y - live.downY) * live.scale > TAP_SLOP) live.moved = true;
    if (!live.moved || live.side !== 0 || live.stage !== "aim") return;
    if (live.aim !== "swipe") setAim("swipe");
    const target = aimFrom(x - live.downX, y - live.downY);
    if (target) { live.aimX = toScreenX(target.x); live.aimY = toScreenY(target.y); live.aimed = true; }
    // Live power from the last stretch of the path, so the bar shows what a release now would do.
    let from = live.count - 1;
    while (from > 0 && event.timeStamp - live.ts[from - 1] <= 120) from--;
    const span = Math.max(16, event.timeStamp - live.ts[from]);
    live.power = powerFrom(Math.hypot(x - live.xs[from], y - live.ys[from]) / span);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== live.pointer) return;
    live.pointer = -1;
    const { x, y } = boardPoint(event);
    if (live.side === 1) {
      // Keeping: a swipe picks its side, a tap picks the third of the goal it lands in.
      const dx = x - live.downX;
      if (live.moved && Math.abs(dx) > 18) pickSide(dx < 0 ? 0 : 2);
      else if (!live.moved) pickSide(x < GX - GW / 3 ? 0 : x > GX + GW / 3 ? 2 : 1);
      return;
    }
    if (live.stage !== "aim") return;
    if (!live.moved) {
      if (live.aim !== "meter" && y < GY + 14 && y > GTOP - 36) {
        // A tap on the goal: aim there and start the power bar.
        live.aimX = Math.min(GX + GW * 1.3, Math.max(GX - GW * 1.3, x)); live.aimY = y;
        live.aimed = false;
      }
      tapKick();
      return;
    }
    addPoint(x, y, event.timeStamp);
    const shot = swipeShot(live.xs, live.ys, live.ts, live.count);
    if (!shot) { live.count = 0; setAim("idle"); setNote("গোলের দিকে, মানে ওপরের দিকে টেনে ছাড়ো।"); return; }
    shoot(shot);
  }
  function onPointerCancel() { live.pointer = -1; live.count = 0; if (live.aim === "swipe") setAim("idle"); }

  const total = totalStars(levels.stars);
  const t = tally(kicks), sudden = suddenDeath(kicks), keeping = side === 1;
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const newcomer = !levels.stars[1] && level === 1 && !friend;
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });

  function statusLine() {
    if (stage === "after" || stage === "fly") return call || "…";
    if (stage === "ready" || stage === "run") {
      if (newcomer && kicks.length === 1) return "এবার তুমি কিপার। ও যেদিকে ঝোঁকে, প্রায়ই সেদিকে মারে। মারার আগে একদিকে চাপো।";
      return dive === null ? "মারার আগে একদিকে চাপো: বাঁয়ে, মাঝে বা ডানে।" : "ঠিক আছে। মারার আগ পর্যন্ত বদলাতে পারো।";
    }
    if (aim === "swipe") return "ছেড়ে দিলেই শট। শেষে জোরে টানলে জোরে যাবে।";
    if (aim === "meter") return "জোর ওঠানামা করছে, আবার চাপো। লাল দাগে বল ওপরে ওঠে।";
    if (aim === "keys") return "তীর দিয়ে জায়গা ঠিক করো। Enter চাপলে জোরের দাগ।";
    if (note) return note;
    if (newcomer && kicks.length === 0) return "বল থেকে গোলের যেখানে মারবে, সেদিকে আঙুল টেনে ছাড়ো।";
    return "টেনে ছাড়ো, নয়তো গোলের যেখানে মারবে সেখানে চাপো।";
  }

  function dots(side: 0 | 1) {
    const mine = kicks.filter(kick => kick.side === side);
    const slots = Math.max(KICKS, Math.ceil(kicks.length / 2));
    const shown = Math.min(7, slots), from = Math.max(0, slots - shown);
    return Array.from({ length: shown }, (_, i) => {
      const kick = mine[from + i];
      return <i key={i} data-k={kick ? (kick.scored ? "goal" : "miss") : "wait"} aria-hidden="true">{kick ? (kick.scored ? "✓" : "✕") : ""}</i>;
    });
  }

  const buttonLabel = aim === "meter" ? "মারো" : "জোর ঠিক করো";
  const sideButtons: Array<[Zone, string]> = [[0, "◀ বাঁয়ে"], [1, "মাঝে"], [2, "ডানে ▶"]];

  return (
    <div className="pk" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="pk-friend" aria-labelledby="pk-friend-title">
          <h2 id="pk-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend.name)}</p>
        </section>
      )}

      <div className="pk-hud">
        <p className="pk-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        {sudden && phase === "play" ? <p className="pk-chip">সাডেন ডেথ</p> : streak >= 2 ? <p className="pk-chip pk-streak" key={streak}><span className="gx-pop">টানা {bn(streak)}</span></p> : null}
      </div>

      <div className="pk-score" ref={scoreRef} role="group" aria-label={`স্কোর: আমরা ${bn(t.us)}, ${opponent.name} ${bn(t.them)}`}>
        <p><span className="pk-kit" style={{ background: US.kit }} aria-hidden="true" /><b>{US.name}</b><span className="pk-dots">{dots(0)}</span><strong>{bn(t.us)}</strong></p>
        <p><span className="pk-kit" style={{ background: opponent.kit }} aria-hidden="true" /><b>{opponent.name}</b><span className="pk-dots">{dots(1)}</span><strong>{bn(t.them)}</strong></p>
      </div>

      <div className="pk-board" ref={board} data-stage={stage} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        <canvas ref={canvas} role="img" aria-label={`স্কুলমাঠে বাঁশের গোলপোস্ট। ${keeping ? "ওদের শট, তুমি কিপার।" : "তোমার শট।"} স্কোর ${score(t.us, t.them)}।`} />
        {call && stage === "after" && <p className="pk-call" aria-hidden="true" key={kicks.length}>{call}</p>}
        {newcomer && kicks.length === 0 && stage === "aim" && aim === "idle" && <p className="pk-hint" aria-hidden="true"><span>⬆</span> টেনে ছাড়ো</p>}
        {paused && (
          <div className="pk-overlay">
            <p>খেলা থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {phase === "won" && result ? (
        <div className="pk-end" role="status">
          <StarReveal count={result.stars} />
          <p className="pk-end-line">{clearLine(level)}</p>
          <p className="pk-end-note">
            {score(result.us, result.them)} গোলে জয়।{" "}
            {rival ? compareLine(result, rival, rival.name)
              : result.improved ? `এই ম্যাচে নতুন রেকর্ড, ${bn(result.stars)} তারা!` : nearMissLine(result.us, result.them)}
          </p>
          <div className="pk-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => startMatch(level + 1)}>পরের ম্যাচ</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => startMatch(level, rival ? seed : newSeed())}>আবার খেলো</button>
          </div>
          {shared && <button type="button" className="kit-link pk-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
        </div>
      ) : phase === "lost" && result ? (
        <div className="pk-end pk-lost" role="status">
          <p className="pk-lost-title">{opponent.name} জিতল</p>
          <p className="pk-lost-line">{lossLine(result.us, result.them, result.sudden, result.frame)}</p>
          {rival && <p className="pk-end-note">{rival.name || "বন্ধু"} এই ম্যাচ {score(rival.us, rival.them)} গোলে জিতেছিল।</p>}
          <button type="button" className="kit-primary pk-again" onClick={() => startMatch(level, rival ? seed : newSeed())}>আরেকবার</button>
        </div>
      ) : (
        <>
          <p className="pk-status" role="status" aria-live="polite">{statusLine()}</p>
          {keeping ? (
            <div className="pk-sides" role="group" aria-label="কোন দিকে ঝাঁপ দেবে">
              {sideButtons.map(([zone, label]) => (
                <button key={zone} type="button" aria-pressed={dive === zone} disabled={paused || (stage !== "ready" && stage !== "run")} onClick={() => pickSide(zone)}>{label}</button>
              ))}
            </div>
          ) : (
            <button type="button" className="pk-tap" data-armed={aim === "meter" || undefined} disabled={stage !== "aim" || paused} onClick={tapKick}>{buttonLabel}</button>
          )}
        </>
      )}

      <div className="pk-prefs">
        <button type="button" className="pk-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={on => { if (!on) live.hum = null; }} />
      </div>

      <details className="pk-drawer">
        <summary>সব ম্যাচ <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="pk-stages">{STAGES.map((stageName, index) => `${bn(index * 2 + 1)}–${bn(index * 2 + 2)} ${stageName}`).join(" · ")}</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} noun="ম্যাচ" onPick={pick => { startMatch(pick); toTop(); }} />
      </details>

      <section className="pk-result" id="result" ref={resultBox} aria-labelledby="pk-result-title">
        <h2 id="pk-result-title">{shared ? <><em>{score(shared.us, shared.them)}</em> গোলে {opponent.name}কে হারালে</> : "ম্যাচ জিতলে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared) : "টাইব্রেকার জিতলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই কিপার আর একই শট পাবে।"}</p>
        {shared && result && (
          <div className="pk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`পেনাল্টি কিকের কার্ড: ${levelLabel(level)}, ${opponent.name}কে ${score(shared.us, shared.them)} গোলে হারানো, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pk-share">
              <label className="pk-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`penalty-match-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই কিপার আর একই শট পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
