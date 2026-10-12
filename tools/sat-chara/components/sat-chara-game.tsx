"use client";
// IP: what we avoided — no angry-bird-style slingshot, birds, pigs, wooden towers or any genre leader's look or sounds; ours is a red rubber ball thrown by hand at seven flat clay pieces in a গলি, a school ground and a courtyard, never at a person or an animal.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, sfx, shake, totalStars, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawBackground, drawBall, drawDots, drawMeter, drawPull, drawStone, drawStones, powerRing, STONE_SHADES } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { layoutOf, seedOf, worldIndex, LEVEL_COUNT, WORLDS } from "../lib/levels";
import {
  bannerNote, bn, caption, clearLine, compareLine, feat, humanLine, levelLabel, missLine, nearMissLine, parseShared, sharedHash, starsOf, throwLine,
  BALLS, type Shared,
} from "../lib/link";
import {
  clampAngle, clampPower, createWorld, downCount, downThisThrow, nextThrow, previewPath, settled, step, throwBall,
  BALL_R, HAND_X, HAND_Y, H, STONES, W,
} from "../lib/physics";
import { bounce, clatter, farDog, release, stretch, thwack } from "../lib/sound";

const TOOL = "sat-chara";
const ACCENT = "#b4472a";
const MAX_WIDTH = 480;
const DOTS = 9;
const PUFFS = 24;
const TAP_SLOP = 10;
const DEG = Math.PI / 180;
/** The sweeping aim of the tap path: angle between 5° and 60°, power 0.15–1. */
const SWEEP = { from: 5 * DEG, to: 60 * DEG, period: 2.6, slowPeriod: 4.4 };
const METER = { from: 0.15, period: 1.8, slowPeriod: 3.2 };
const PREVIEW_POWER = 0.62;

type Phase = "aim" | "flying" | "clear" | "fail";
type Aim = "sweep" | "power" | "drag" | "keys";
type Result = { balls: number; stars: number; improved: boolean; firstBall: number };

const wave = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period);

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, height: 0, scale: 1, unit: 1,
    background: null as HTMLCanvasElement | null,
    sprites: Array.from({ length: STONES }, () => null as HTMLCanvasElement | null),
    world: createWorld(layoutOf(1)),
    level: 1,
    aim: "sweep" as Aim, angle: 30 * DEG, power: PREVIEW_POWER, clock: 0, since: 0,
    dots: new Float32Array(DOTS * 2),
    pull: { id: -1, sx: 0, sy: 0, x: 0, y: 0, moved: false },
    seen: { ballHits: 0, lands: 0, bounces: 0, down: 0 },
    combo: 0, carry: 0, paused: false, calm: false, reduced: false,
    hum: null as ReturnType<typeof stretch> | null,
    px: new Float32Array(PUFFS), py: new Float32Array(PUFFS), pvx: new Float32Array(PUFFS), pvy: new Float32Array(PUFFS), plife: new Float32Array(PUFFS),
  };
}

export function SatCharaGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhaseState] = useState<Phase>("aim");
  const [aim, setAimState] = useState<Aim>("sweep");
  const [down, setDown] = useState(0);
  const [ballsUsed, setBallsUsed] = useState(0);
  const [note, setNote] = useState("");
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [left, setLeft] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [live] = useState(makeLive);

  const phaseRef = useRef<Phase>("aim");
  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const firstBall = useRef(0);
  const chosen = useRef(false);
  const friendRef = useRef<Shared | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<HTMLParagraphElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const rival = friend && friend.level === level ? friend : null;
  const shared: Shared | null = result ? { level, balls: result.balls, name } : null;
  const state = shared ? sharedHash(shared) : "";

  function setPhase(next: Phase) { phaseRef.current = next; setPhaseState(next); }
  function setAim(next: Aim) { live.aim = next; setAimState(next); }
  function stopHum() { live.hum?.stop(); live.hum = null; }

  /** Pre-renders the place and the seven stones at the current size. */
  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d");
    if (!b) return;
    b.setTransform(k, 0, 0, k, 0, 0);
    drawBackground(b, worldIndex(live.level), live.world.blocks);
    const w = live.world;
    for (let i = 0; i < STONES; i++) {
      const sprite = live.sprites[i] ?? document.createElement("canvas");
      sprite.width = Math.ceil((w.w[i] + 4) * k); sprite.height = Math.ceil((w.h[i] + 4) * k);
      const s = sprite.getContext("2d");
      if (!s) continue;
      s.setTransform(k, 0, 0, k, sprite.width / 2, sprite.height / 2);
      drawStone(s, w.w[i], w.h[i], STONE_SHADES[i], seedOf(live.level) + i);
      live.sprites[i] = sprite;
    }
    live.unit = k;
  }

  /** A fresh pile for a level. Restarting takes one frame. */
  function startLevel(next: number, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    stopHum();
    live.level = next;
    live.world = createWorld(layoutOf(next));
    Object.assign(live.seen, { ballHits: 0, lands: 0, bounces: 0, down: 0 });
    live.plife.fill(0);
    live.combo = 0; live.carry = 0; live.since = live.clock; live.pull.id = -1;
    live.paused = false;
    firstBall.current = 0;
    setLevel(next); setDown(0); setBallsUsed(0); setNote(""); setResult(null); setPaused(false); setLeft(0);
    setAim("sweep");
    setPhase("aim");
    if (live.context) { paint(); draw(); }
  }

  function launch(angle: number, power: number) {
    if (phaseRef.current !== "aim" || live.paused) return;
    stopHum();
    if (!throwBall(live.world, clampAngle(angle), clampPower(power))) return;
    release();
    live.combo = 0; live.carry = 0;
    setNote("");
    setPhase("flying");
  }

  /** A tap (on the play area, the big button, Space or Enter): first it fixes the direction, then the power and throws. */
  function tap() {
    if (phaseRef.current !== "aim" || live.paused) return;
    if (live.aim === "power" || live.aim === "keys") { launch(live.angle, live.power); return; }
    live.since = live.clock;
    setAim("power");
    sfx.tap();
  }

  function settle() {
    const w = live.world, knocked = downThisThrow(w), total = downCount(w), used = w.throwNo + 1;
    if (w.throwNo === 0) firstBall.current = knocked;
    setDown(total); setBallsUsed(used);
    if (total === STONES) { win(used); return; }
    if (!knocked) { farDog(); shake(ballsRef.current); }
    if (used >= BALLS) {
      setLeft(STONES - total);
      setPhase("fail");
      sfx.lose();
      return;
    }
    setNote(throwLine(knocked, STONES - total, BALLS - used));
    nextThrow(w);
    live.since = live.clock;
    setAim("sweep");
    setPhase("aim");
  }

  function win(balls: number) {
    const stars = starsOf(balls), before = levels.stars[level] ?? 0;
    levels.record(level, stars);
    setResult({ balls, stars, improved: before > 0 && stars > before, firstBall: firstBall.current });
    setPhase("clear");
    if (stars === 3 || (!before && level % 10 === 0)) {
      sfx.levelUp();
      confetti({ colors: ["#b4472a", "#e0a23a", "#d8473a", "#ffffff", "#5f8f3e", "#2f4a8a"] });
    } else sfx.good();
  }

  function puff(x: number, y: number) {
    if (live.calm) return;
    for (let i = 0, made = 0; i < PUFFS && made < 4; i++) {
      if (live.plife[i] > 0) continue;
      live.px[i] = x + (made - 1.5) * 3; live.py[i] = y - 1;
      live.pvx[i] = (made - 1.5) * 14; live.pvy[i] = -10 - made * 4;
      live.plife[i] = 0.45;
      made++;
    }
  }

  function tick(dt: number) {
    live.clock += dt * (slowRef.current ? 0.6 : 1);
    for (let i = 0; i < PUFFS; i++) {
      if (live.plife[i] <= 0) continue;
      live.px[i] += live.pvx[i] * dt; live.py[i] += live.pvy[i] * dt; live.pvy[i] += 30 * dt; live.plife[i] -= dt;
    }
    if (live.paused) return;
    const now = phaseRef.current, w = live.world;
    if (now === "aim") {
      const t = live.clock - live.since;
      if (live.aim === "sweep") { live.angle = SWEEP.from + (SWEEP.to - SWEEP.from) * wave(t, slowRef.current ? SWEEP.slowPeriod : SWEEP.period); live.power = PREVIEW_POWER; }
      else if (live.aim === "power") live.power = METER.from + (1 - METER.from) * wave(t, slowRef.current ? METER.slowPeriod : METER.period);
      return;
    }
    if (now !== "flying") return;
    // Slow mode runs the same fixed steps, just fewer per second, so the result is identical.
    live.carry += slowRef.current ? 0.55 : 1;
    while (live.carry >= 1 && !settled(w)) { step(w); live.carry -= 1; }
    const seen = live.seen;
    if (w.ballHits > seen.ballHits) { thwack(); if (!live.calm) puff(w.hitX, w.hitY); }
    if (w.lands > seen.lands) { clatter(w.lands); puff(w.landX, w.landY); }
    if (w.bounces > seen.bounces) bounce();
    const fallen = downCount(w);
    if (fallen > seen.down) {
      for (let k = seen.down; k < fallen; k++) sfx.combo(live.combo++);
      setDown(fallen);
      if (live.combo === 4) shake(board.current);
    }
    Object.assign(seen, { ballHits: w.ballHits, lands: w.lands, bounces: w.bounces, down: fallen });
    if (settled(w)) settle();
  }

  function draw() {
    const c = live.context, background = live.background;
    if (!c || !background) return;
    const w = live.world, now = phaseRef.current;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, W, H);
    drawStones(c, w, live.sprites, live.unit);
    for (let i = 0; i < PUFFS; i++) {
      const life = live.plife[i];
      if (life <= 0) continue;
      c.globalAlpha = Math.min(0.55, life * 1.6);
      c.fillStyle = "#e9dcc4";
      c.beginPath(); c.arc(live.px[i], live.py[i], 2.5 + (0.45 - life) * 9, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    if (now === "aim") {
      previewPath(live.angle, live.power, live.dots, DOTS);
      drawDots(c, live.dots, DOTS);
      if (live.aim === "drag") {
        const p = live.pull, k = 1 / live.scale;
        // The pull line points back toward the finger, capped so it stays near the ball.
        const dx = (p.x - p.sx) * k, dy = (p.y - p.sy) * k, length = Math.hypot(dx, dy) || 1, reach = Math.min(length, 40);
        drawPull(c, HAND_X + (dx / length) * reach, HAND_Y + (dy / length) * reach, live.power, ACCENT);
      } else if (live.aim === "power") { drawMeter(c, live.power, ACCENT); powerRing(c, live.power, ACCENT); }
      else if (live.aim === "keys") powerRing(c, live.power, ACCENT);
      drawBall(c, HAND_X, HAND_Y, 0);
    } else if (w.ball === 1 || (w.ball === 2 && w.bx > -BALL_R)) drawBall(c, w.bx, w.by, live.calm ? 0 : w.spin);
    c.restore();
  }

  const looping = !paused && (phase === "flying" || (phase === "aim" && boardInView));
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
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      friendRef.current = found;
      setFriend(found);
      startLevel(found.level);
    };
    const hide = () => {
      if (!document.hidden) return;
      stopHum();
      live.pull.id = -1;
      if (live.aim === "drag") setAim("sweep");
      if (phaseRef.current === "flying") { live.paused = true; setPaused(true); }
    };
    setSite(window.location.host);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopHum();
    };
  }, []);

  // Open where the player left off once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    startLevel(levels.unlocked, false);
  }, [levels.loaded]);

  // A slow-mode switch while nothing runs still has to show.
  useEffect(() => { draw(); }, [slow]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`সাত চাড়া লেভেল ১২৩ রাফি ${levelLabel(level)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  function resume() { live.paused = false; setPaused(false); }

  // ---- keys: ↑↓ direction, ←→ power, Space/Enter tap or throw; Enter moves on after a level ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]") || !boardInView) return;
    const now = phaseRef.current, key = event.key;
    if (now === "aim" && !live.paused && (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight")) {
      event.preventDefault();
      if (live.aim !== "keys") { live.power = PREVIEW_POWER; setAim("keys"); }
      if (key === "ArrowUp" || key === "ArrowDown") live.angle = clampAngle(live.angle + (key === "ArrowUp" ? 2 : -2) * DEG);
      else live.power = clampPower(live.power + (key === "ArrowRight" ? 0.04 : -0.04));
      draw();
      return;
    }
    if (key !== " " && key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (live.paused) resume();
    else if (now === "aim") tap();
    else if (now === "fail") startLevel(level);
    else if (now === "clear") startLevel(level < LEVEL_COUNT ? level + 1 : level);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: drag back from anywhere on the play area to aim and set power; a still tap is the two-tap path ----
  function pullAim() {
    // The throw goes opposite the pull: a finger dragged down and left sends the ball up and right.
    const p = live.pull, dx = p.sx - p.x, dy = p.sy - p.y, length = Math.hypot(dx, dy);
    live.angle = clampAngle(Math.atan2(-dy, dx));
    live.power = clampPower(length / Math.max(90, live.width * 0.36));
    return length;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || phaseRef.current !== "aim" || live.paused || (event.target as Element).closest("button")) return;
    Object.assign(live.pull, { id: event.pointerId, sx: event.clientX, sy: event.clientY, x: event.clientX, y: event.clientY, moved: false });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const p = live.pull;
    if (event.pointerId !== p.id) return;
    p.x = event.clientX; p.y = event.clientY;
    if (!p.moved && Math.hypot(p.x - p.sx, p.y - p.sy) > TAP_SLOP) {
      p.moved = true;
      setAim("drag");
      live.hum ??= stretch();
    }
    if (p.moved) { pullAim(); live.hum?.set(live.power); }
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const p = live.pull;
    if (event.pointerId !== p.id) return;
    p.id = -1;
    if (!p.moved) { tap(); return; }
    // Pulled back to where it started: no throw.
    if (pullAim() < 14) { stopHum(); live.since = live.clock; setAim("sweep"); return; }
    launch(live.angle, live.power);
  }
  function onPointerCancel() { live.pull.id = -1; stopHum(); if (live.aim === "drag") setAim("sweep"); }

  const total = totalStars(levels.stars);
  const ballsLeft = BALLS - ballsUsed, ballsInHand = phase === "flying" ? ballsLeft - 1 : ballsLeft;
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const newcomer = !levels.stars[1] && level === 1 && ballsUsed === 0 && !friend;
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });

  function statusLine() {
    if (phase === "flying") return "দেখো কয়টা পড়ে।";
    if (aim === "drag") return "ছেড়ে দিলেই বল যাবে।";
    if (aim === "power") return "জোর ওঠানামা করছে। ঠিক সময়ে আবার চাপো।";
    if (aim === "keys") return "↑↓ দিক, ←→ জোর। Enter চাপলে বল যাবে।";
    if (note) return note;
    if (newcomer) return "বল পেছনে টেনে ছেড়ে দাও। চাড়ার গোড়ায় লাগলে সব পড়বে।";
    return "পেছনে টেনে ছাড়ো, নয়তো দুবার চাপো: আগে দিক, পরে জোর।";
  }
  const buttonLabel = phase === "flying" ? "বল যাচ্ছে" : aim === "power" || aim === "keys" ? "ছোড়ো" : "দিক ঠিক করো";

  return (
    <div className="sc" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="sc-friend" aria-labelledby="sc-friend-title">
          <h2 id="sc-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="sc-hud">
        <p className="sc-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        <p className="sc-balls" ref={ballsRef} aria-label={`বল বাকি ${bn(ballsInHand)}টা`}>
          {Array.from({ length: BALLS }, (_, i) => <i key={i} data-on={i < ballsInHand} aria-hidden="true" />)}
        </p>
        <p className="sc-down" aria-label={`পড়েছে ${bn(down)}টা, মোট ${bn(STONES)}টা`}>
          <span className="sc-chip" aria-hidden="true" /><span><b key={down} className={down ? "gx-pop" : ""}>{bn(down)}</b>/{bn(STONES)}</span>
        </p>
      </div>

      <div className="sc-board" ref={board} data-phase={phase} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        <canvas ref={canvas} role="img" aria-label={`গলিতে সাজানো সাতটা চাড়া। পড়েছে ${bn(down)}টা, বল বাকি ${bn(ballsLeft)}টা।`} />
        {newcomer && phase === "aim" && aim === "sweep" && <p className="sc-hint" aria-hidden="true"><span>⟵</span> টেনে ছাড়ো</p>}
        {paused && (
          <div className="sc-overlay">
            <p>থেমে আছে। বল মাঝপথে ঝুলে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {phase === "clear" && result ? (
        <div className="sc-clear" role="status">
          <StarReveal count={result.stars} />
          <p className="sc-clear-line">{clearLine(level)}</p>
          <p className="sc-clear-note">
            ৭টা চাড়া {result.balls === 1 ? "এক বলে" : `${bn(result.balls)} বলে`}।{" "}
            {rival ? compareLine(result.balls, rival.balls, rival.name)
              : result.improved ? `এই লেভেলে নতুন সেরা, ${bn(result.stars)} তারা!` : nearMissLine(result.balls, result.firstBall)}
          </p>
          <div className="sc-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => startLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => startLevel(level)}>আবার খেলো</button>
          </div>
          <button type="button" className="kit-link sc-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : phase === "fail" ? (
        <div className="sc-lost" role="status">
          <p className="sc-lost-title">তিনটা বলই শেষ</p>
          <p className="sc-lost-line">{missLine(left)}</p>
          <button type="button" className="kit-primary sc-again" onClick={() => startLevel(level)}>আরেকবার</button>
        </div>
      ) : (
        <>
          <p className="sc-status" role="status" aria-live="polite">{statusLine()}</p>
          <button type="button" className="sc-tap" data-armed={aim === "power" || aim === "keys" || undefined} disabled={phase !== "aim" || paused} onClick={tap}>{buttonLabel}</button>
        </>
      )}

      <div className="sc-prefs">
        <button type="button" className="sc-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={on => { if (!on) live.hum = null; }} />
      </div>

      <details className="sc-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="sc-worlds">{WORLDS.map((world, index) => `${bn(index * 10 + 1)}–${bn(index * 10 + 10)} ${world.name}`).join(" · ")}</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} onPick={pick => { startLevel(pick); toTop(); }} />
      </details>

      <section className="sc-result" id="result" ref={resultBox} aria-labelledby="sc-result-title">
        <h2 id="sc-result-title">{shared ? <><em>লেভেল {bn(level)}</em>, সাতটাই {shared.balls === 1 ? "এক বলে" : `${bn(shared.balls)} বলে`}</> : "সাতটা চাড়া ফেললে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared.balls) : "তিন বলের মধ্যে সাতটাই ফেললে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই সাজানো চাড়া পাবে।"}</p>
        {shared && result && (
          <div className="sc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`সাত চাড়ার কার্ড: ${levelLabel(level)}, ৭টা চাড়া ${bn(shared.balls)} বলে, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sc-share">
              <label className="sc-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`sat-chara-level-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই সাজানো চাড়া পাবে। কয় বলে পেরেছ, সেটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
