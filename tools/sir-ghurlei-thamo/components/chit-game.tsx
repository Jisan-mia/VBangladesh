"use client";
// IP: what we avoided — nothing from the famous red-light/green-light series (no doll, song, track suits, numbered players or elimination); no real school, uniform badge or textbook; the teacher is kind (no cane, no scolding past a raised eyebrow) and the chit is never about exams.

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, fitCanvas, hiss, loop, MAX_NAME, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { buildLayers, drawFrame, makeView, refreshBoard, SCENE_H, SCENE_W, type Layers } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  BENCHES, benchesReached, bn, classStars, CLASSIC, createGame, kindOf, LEVEL_COUNT, levelOf, parseShared, REPLIES, seconds, sharedHash, SLUG, starTargets, statusOf, stepGame, tenthsOf, TITLE,
  type Game, type Shared, type Status,
} from "../lib/game";
import { caption, caughtLine, clearLine, compareLine, friendClaim, friendLine, humanLine, migrateLevels, nearMiss, statusLine } from "../lib/words";

/** Slow mode runs the whole class at this speed (the clock still counts real seconds). */
const SLOW_RATE = 0.7;
const LEVELS_KEY = `ektukhani-levels-${SLUG}`, BEST_KEY = `ektukhani-best-${SLUG}`;

// The classroom's sounds, made in code: chalk on the board while the teacher writes, two footsteps when they start to turn,
// a cough, a dropped chalk, and a soft tone that climbs while the chit is moving.
const chalkScratch = (pitch: number) => hiss(0.08, 0.05, 3000 + pitch * 900, "bandpass");
const footsteps = () => { tone(95, 0.08, 0.16, "sine", 0, 60); tone(90, 0.08, 0.14, "sine", 0.2, 58); };
const cough = () => { hiss(0.09, 0.12, 700, "bandpass"); hiss(0.09, 0.1, 650, "bandpass", 0.17); };
const chalkDrop = () => { tone(1900, 0.03, 0.05, "square"); tone(1700, 0.025, 0.035, "square", 0.12); tone(1600, 0.02, 0.025, "square", 0.2); };
type Loop = ReturnType<typeof loop>;

type Phase = "ready" | "playing" | "over";

export function ChitGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLCanvasElement>(null);
  const friendCardRef = useRef<HTMLCanvasElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Layers | null>(null);
  const gameRef = useRef<Game>(createGame(1));
  const viewRef = useRef(makeView());
  const holding = useRef(false);
  const seen = useRef({ status: "ready" as Status, bench: 1, catches: 0, kind: "write", shownTenths: -1, lastDraw: 0 });

  const [phase, setPhase] = useState<Phase>("ready");
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<Status>("ready");
  const [bench, setBench] = useState(1);
  const [held, setHeld] = useState(false);
  const [tapMode, setTapMode] = useState(false);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<{ tenths: number; catches: number; stars: number; record: boolean } | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  // Before the level store is read: an old phone's best time from the original routine (class 5) opens classes up to 6, once.
  useEffect(() => {
    try {
      const moved = migrateLevels(localStorage.getItem(LEVELS_KEY), localStorage.getItem(BEST_KEY));
      if (moved) localStorage.setItem(LEVELS_KEY, moved);
    } catch { /* storage blocked: nothing to move */ }
  }, []);
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const [level, setLevel] = useState(1);
  const chosen = useRef(false);
  const slowUsed = useRef(false);
  const ear = useRef<{ hum: Loop | null; moving: number; scratch: number; stroke: number }>({ hum: null, moving: 0, scratch: 0, stroke: 0 });
  const [shake, setShake] = useState(0);
  // Each class keeps its own best time; the original class keeps the key old phones already have.
  const [best, submitBest] = useBest(level === CLASSIC ? SLUG : `${SLUG}-${level}`, false);
  const live = useRef({ phase, paused, slow, tapMode });
  live.current = { phase, paused, slow, tapMode };
  viewRef.current.slow = slow;

  const teacher = gameRef.current.klass.teacher;
  const who = TITLE[teacher];
  const targets = useMemo(() => starTargets({ seed, level }), [seed, level]);
  const shared: Shared | null = result === null ? null : { seed, tenths: result.tenths, catches: result.catches, name: cleanName(name), ...(level !== CLASSIC ? { level } : {}) };
  const state = shared ? sharedHash(shared) : "";

  function stopHum() { ear.current.hum?.stop(); ear.current.hum = null; }

  function setHolding(next: boolean) {
    if (holding.current === next) return;
    holding.current = next;
    setHeld(next);
  }

  function reset(nextSeed: number, nextLevel: number) {
    stopHum();
    slowUsed.current = false;
    setLevel(nextLevel);
    const game = createGame(nextSeed, nextLevel);
    gameRef.current = game;
    if (layersRef.current) refreshBoard(layersRef.current, game.klass);
    Object.assign(seen.current, { status: "ready", bench: 1, catches: 0, kind: "write", shownTenths: -1 });
    viewRef.current.seenCatches = 0;
    holding.current = false;
    setHeld(false); setSeed(nextSeed); setPhase("ready"); setPaused(false); setStatus("ready"); setBench(1); setResult(null);
  }

  useEffect(() => {
    const friendLink = parseShared(window.location.hash);
    setFriend(friendLink);
    setSite(window.location.host);
    if (friendLink) chosen.current = true;
    reset(friendLink ? friendLink.seed : newSeed(), friendLink ? friendLink.level ?? CLASSIC : 1);
    return stopHum;
  }, []);

  // Saved stars load after the first paint: open the furthest class reached, unless a friend's link chose one.
  useEffect(() => {
    if (!levels.loaded || chosen.current || live.current.phase !== "ready") return;
    chosen.current = true;
    reset(seed, levels.unlocked);
  }, [levels.loaded]);

  function draw() {
    const canvas = canvasRef.current, layers = layersRef.current;
    if (!canvas || !layers) return;
    const now = performance.now(), marks = seen.current;
    const dt = marks.lastDraw ? Math.min(0.1, (now - marks.lastDraw) / 1000) : 0;
    marks.lastDraw = now;
    const context = canvas.getContext("2d")!;
    drawFrame(context, layers, gameRef.current, viewRef.current, dt);
    const tenths = Math.round(gameRef.current.time * 10);
    if (tenths !== marks.shownTenths && clockRef.current) { marks.shownTenths = tenths; clockRef.current.textContent = seconds(tenths); }
  }

  /** What the class sounds like this step: chalk while the teacher writes, and the chit's tone climbing the longer it moves. */
  function listen(game: Game, dt: number) {
    const sound = ear.current;
    if (game.phase === "playing" && kindOf(game) === "write" && game.scold === 0) {
      if ((sound.scratch -= dt) <= 0) { sound.stroke = (sound.stroke + 1) % 5; chalkScratch(sound.stroke % 3); sound.scratch = 0.28 + (sound.stroke % 2) * 0.16; }
    }
    sound.moving = game.moving ? sound.moving + dt : 0;
    sound.hum?.set(game.moving ? 0.28 : 0);
    if (game.moving) sound.hum?.pitch(150 + Math.min(1, sound.moving / 3) * 170);
  }

  function step(dt: number) {
    const game = gameRef.current, marks = seen.current, slowNow = live.current.slow;
    const before = game.phase;
    if (slowNow && game.phase === "playing") slowUsed.current = true;
    stepGame(game, holding.current, dt, slowNow ? SLOW_RATE : 1);
    const kind = kindOf(game);
    if (kind !== marks.kind) {
      marks.kind = kind;
      if (game.phase === "playing" && game.scold === 0) {
        // Two footsteps as the teacher starts to turn (the drawing and the status strip show it too), and a buzz if the chit is moving.
        if (kind === "tell" || kind === "peek") { footsteps(); if (holding.current) buzz(12); }
        else if (kind === "cough") cough();
        else if (kind === "drop") chalkDrop();
      }
    }
    if (game.catches !== marks.catches) {
      marks.catches = game.catches;
      if (live.current.tapMode) setHolding(false);
      sfx.wrong();
      setShake(count => count + 1);
    }
    listen(game, dt);
    const nextStatus = statusOf(game, holding.current);
    if (nextStatus !== marks.status) { marks.status = nextStatus; setStatus(nextStatus); }
    const reached = benchesReached(game.pos);
    if (reached !== marks.bench) {
      // Each new bench rings one note higher; sliding back after a catch is silent.
      if (reached > marks.bench && reached < BENCHES) sfx.combo(reached - 2);
      marks.bench = reached; setBench(reached);
    }
    if (before === game.phase) return;
    if (before === "ready") setPhase("playing");
    if (game.phase === "over") finish(game);
  }

  /** The chit reached the last bench: stars, a best, and the right sound after the stars' own chimes. */
  function finish(game: Game) {
    const tenths = tenthsOf(game.time);
    holding.current = false;
    setHeld(false);
    stopHum();
    const stars = classStars(tenths, targets, slowUsed.current ? SLOW_RATE : 1);
    levels.record(level, stars);
    setPreviousBest(best);
    const record = submitBest(tenths) && best !== null;
    setResult({ tenths, catches: game.catches, stars, record });
    setPhase("over");
    const party = stars === 3 || record || level === LEVEL_COUNT;
    window.setTimeout(() => { if (party) { if (record) sfx.win(); else sfx.levelUp(); confetti(); } else sfx.good(); }, 300 + stars * 260);
  }

  useGameLoop(step, draw, !paused && phase !== "over");

  // Size the canvas to its box and paint the still layers for that size.
  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let built = 0;
    const size = (force?: unknown) => {
      const width = stage.clientWidth;
      // The status strip under the canvas can change the stage's height; only a new width needs fresh layers.
      if (!width || (width === built && force !== true)) return;
      built = width;
      fitCanvas(canvas, width, (width * SCENE_H) / SCENE_W);
      layersRef.current = buildLayers(width, Math.min(2, window.devicePixelRatio || 1), gameRef.current.klass);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(stage);
    // The board's chalk is painted with the display font; repaint once it has loaded.
    document.fonts?.ready.then(() => size(true));
    return () => observer.disconnect();
  }, []);

  // A phone put in a pocket never plays on: hiding the tab lets go of the chit and pauses with "চালিয়ে যাও".
  useEffect(() => {
    const hide = () => {
      if (!document.hidden) return;
      holding.current = false;
      stopHum();
      setHeld(false);
      if (live.current.phase === "playing") setPaused(true);
    };
    const blur = () => { if (!live.current.tapMode) { holding.current = false; setHeld(false); } };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", blur);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("blur", blur); };
  }, []);

  const playable = () => !live.current.paused && live.current.phase !== "over";
  function press() {
    if (!playable()) return;
    // The chit's tone starts from inside a press (browsers allow audio only then), and again after a pause or the sound switch.
    ear.current.hum ??= loop("hum", 150);
    sfx.tap();
    setHolding(live.current.tapMode ? !holding.current : true);
  }
  function release() { if (!live.current.tapMode) setHolding(false); }
  function resume() { setHolding(false); setPaused(false); }
  const friendFits = (forLevel: number) => Boolean(friend) && (friend!.level ?? CLASSIC) === forLevel;
  /** The same class again with a fresh routine (a friend's class stays theirs), or another class from the grid or after a clear. */
  function again(to = level) {
    chosen.current = true;
    reset(friendFits(to) ? friend!.seed : newSeed(), to);
    stageRef.current?.scrollIntoView({ block: "nearest", behavior: slow ? "auto" : "smooth" });
  }
  const nextLevel = phase === "over" && level < LEVEL_COUNT ? level + 1 : 0;

  // Desktop: hold Space, ↓ or Enter to pass (or press once in one-tap mode); Space or Enter carries on after a pause, Enter plays again.
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = Boolean(target.closest?.("input, textarea, select, [contenteditable]"));
      const other = Boolean(target.closest?.("button, a, summary")) && !target.closest?.(".sg-pass");
      return { typing, other, pass: event.key === " " || event.key === "ArrowDown" || event.key === "Enter" };
    };
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const { typing, other, pass } = keys(event);
      if (typing || other || !pass) return;
      if (paused) { if (event.key !== "ArrowDown") { event.preventDefault(); resume(); } return; }
      if (phase === "over") { if (event.key === "Enter") { event.preventDefault(); again(nextLevel || level); } return; }
      // preventDefault on both key events also stops the focused button from firing a click.
      event.preventDefault();
      if (!event.repeat) press();
    };
    const up = (event: KeyboardEvent) => {
      const { typing, other, pass } = keys(event);
      if (typing || other || !pass) return;
      event.preventDefault();
      release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  const holdHandlers = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      // Leave other buttons (like চালিয়ে যাও over the stage) alone: capturing here would swallow their click.
      if (event.button > 0 || !playable() || (event.target as Element).closest("button:not(.sg-pass)")) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      press();
    },
    onPointerUp: release, onPointerCancel: release, onLostPointerCapture: release,
    onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
  };

  // Bring the time and আরেকবার fully on screen when the chit arrives.
  useEffect(() => { if (phase === "over") overRef.current?.scrollIntoView({ block: "nearest", behavior: slow ? "auto" : "smooth" }); }, [phase]);

  useEffect(() => {
    if (!shared && !friend) return;
    let cancelled = false;
    loadCardFonts("স্যার ঘুরলেই থামো ২২.৪ সেকেন্ডে টিফিনে ঝালমুড়ি?").then(() => {
      if (cancelled) return;
      if (shared && cardRef.current) drawCard(cardRef.current, shared, format, site, result?.stars ?? 0);
      if (friend && friendCardRef.current) drawCard(friendCardRef.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend, result?.stars]);

  const bestLine = result === null ? "" : previousBest === null ? "এই ক্লাসে এটাই প্রথম রেকর্ড। ভাঙতে পারবে?"
    : result.tenths < previousBest ? `নতুন রেকর্ড! আগের সেরা ছিল ${seconds(previousBest)} সেকেন্ড।` : `এই ক্লাসে সেরা: ${seconds(best ?? previousBest)} সেকেন্ড`;
  const miss = result ? nearMiss({ tenths: result.tenths, stars: result.stars, ...targets, rate: slowUsed.current ? SLOW_RATE : 1, best: previousBest }) : "";

  const passLabel = phase === "ready"
    ? (tapMode ? ["একবার চাপো", `চিরকুট চলবে, ${who} ঘুরলে আবার চাপো`] : ["ধরে রাখো", `${who} ঘুরলে ছাড়ো`])
    : (status === "scold" || status === "lift") && held ? ["আঙুল তুলে নাও", "তারপর আবার চেপে ধরো"]
      : held ? (tapMode ? ["চাপো, থামবে", "চিরকুট যাচ্ছে…"] : ["যাচ্ছে…", `${who} ঘুরলেই ছেড়ে দাও`])
        : (tapMode ? ["চাপো, চলবে", "চিরকুট থেমে আছে"] : ["ধরে রাখো", "চিরকুট থেমে আছে"]);

  return (
    <div className="sg" data-slow={slow}>
      {friend && (
        <section className="sg-friend" aria-labelledby="sg-friend-title">
          <canvas ref={friendCardRef} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${seconds(friend.tenths)} সেকেন্ড`} />
          <div>
            <p className="sg-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
            <h2 id="sg-friend-title">{friendLine(friend)}</h2>
            <p className="sg-claim">{friendClaim(friend)}</p>
          </div>
        </section>
      )}

      <div className="sg-top">
        <p className="sg-where">ক্লাস {bn(level)} <i>· {levelOf(level).name} </i><span>· ★ {bn(totalStars(levels.stars))}/{bn(LEVEL_COUNT * 3)}</span></p>
        <SoundToggle compact onChange={stopHum} />
      </div>

      <div className="sg-bar">
        <ol className="sg-benches" aria-label={`${bn(BENCHES)}টা বেঞ্চের ${bn(bench)} নম্বরে চিরকুট`}>
          {Array.from({ length: BENCHES }, (_, at) => <li key={at} data-done={at < bench} data-now={at === bench - 1 && phase !== "over"} />)}
        </ol>
        <p className="sg-clock" aria-hidden="true"><span ref={clockRef}>০.০</span> সে.</p>
      </div>

      <div className="sg-stage" ref={stageRef} {...(phase === "over" ? {} : holdHandlers)} data-play={phase !== "over"} data-shake={shake ? shake % 2 : undefined}>
        <canvas ref={canvasRef} className="sg-canvas" role="img" aria-label={`ক্লাসঘর: ${who} বোর্ডে লিখছেন, সারি সারি বেঞ্চে ছাত্রছাত্রী, প্রথম বেঞ্চে একটা চিরকুট`} />
        <p className="sg-status" aria-live="polite"><span key={status} data-status={status}>{statusLine(status, teacher, tapMode, REPLIES[gameRef.current.klass.reply])}</span></p>
        {paused && (
          <div className="sg-pause">
            <p>খেলা থেমে আছে</p>
            <button type="button" className="kit-primary" onClick={resume} autoFocus>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {phase === "over" && result !== null ? (
        <div className="sg-over" ref={overRef}>
          <p className="sg-over-kicker">{clearLine(level)}</p>
          <StarReveal count={result.stars} />
          <p className="sg-over-time"><b>{seconds(result.tenths)}</b> সেকেন্ড</p>
          <p className="sg-over-best">{bn(BENCHES)} বেঞ্চ · {caughtLine(result.catches)}</p>
          <p className="sg-over-line">{friend && friendFits(level) ? compareLine(result.tenths, friend) : humanLine(result.tenths, teacher)}</p>
          {miss && <p className="sg-miss">{miss}</p>}
          <p className="sg-over-best">{bestLine}</p>
          <div className="sg-actions">
            {nextLevel > 0 && <button type="button" className="kit-secondary sg-again2" onClick={() => again()}>আবার খেলো</button>}
            <button type="button" className="kit-primary sg-again" onClick={() => again(nextLevel || level)}>{nextLevel ? "পরের ক্লাস" : "আরেকবার"}</button>
          </div>
          <button type="button" className="kit-link" onClick={() => document.getElementById("result")?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "start" })}>কার্ডটা দেখো ↓</button>
        </div>
      ) : (
        <>
          <button type="button" className="sg-pass" data-held={held} aria-pressed={tapMode ? held : undefined} {...holdHandlers}
            onClick={event => { if (event.detail === 0 && playable()) setHolding(!holding.current); }}>
            <svg viewBox="0 0 48 36" aria-hidden="true"><path d="M4 6h40v24H4z" /><path d="m4 6 20 14L44 6" /></svg>
            <span><b>{passLabel[0]}</b><small>{passLabel[1]}</small></span>
          </button>
          <div className="sg-options">
            <button type="button" className="sg-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>ধীরে খেলো
            </button>
            <button type="button" className="sg-toggle" aria-pressed={tapMode} onClick={() => { setHolding(false); setTapMode(!tapMode); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5a2 2 0 0 1 4 0v6m0-1a2 2 0 0 1 4 0v3a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2-3a1.6 1.6 0 0 1 2.6-2L9 15" /></svg>চেপে না ধরে খেলো
            </button>
            <p>★★★ {seconds(targets.three)} সে.-এ{best !== null ? ` · সেরা ${seconds(best)}` : ""}</p>
          </div>
        </>
      )}

      <details className="sg-levels">
        <summary>সব ক্লাস <span>★ {bn(totalStars(levels.stars))}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, friend?.level ?? 1)} current={level} onPick={to => again(to)} noun="ক্লাস" />
        <p>প্রতিটা ক্লাসে শিক্ষক একটু অন্যভাবে লেখেন আর ঘোরেন। চিরকুট পৌঁছালেই ১ তারা। ক্লাসের লক্ষ্য সময়ের মধ্যে পৌঁছালে ৩ তারা, আরও ৫ সেকেন্ডের মধ্যে ২।</p>
      </details>

      {shared && (
        <section className="sg-result" id="result" aria-labelledby="sg-result-title">
          <h2 id="sg-result-title">তোমার <em>চিরকুট</em> কার্ড</h2>
          <div className="sg-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={cardRef} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sg-card-summary" />
              <figcaption id="sg-card-summary" className="sg-sr">{shared.name && `${shared.name}, `}ক্লাস {bn(level)}, {bn(BENCHES)} বেঞ্চ {seconds(shared.tenths)} সেকেন্ডে{result ? `, ${bn(result.stars)} তারা` : ""}। {humanLine(shared.tenths, teacher)}</figcaption>
              {cardError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sg-share">
              <label className="sg-name">
                <span>নাম <small>ডাকনাম দিতে পারো, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={SLUG} fileName="sir-ghurlei-thamo.png" makeImage={() => cardBlob(shared, format, site, result?.stars ?? 0)} imageKey={`${state}|${format}|${result?.stars ?? 0}`} caption={caption(shared.tenths, teacher)} state={state} hint="লিংক খুললে বন্ধু একই ক্লাস পাবে: একই শিক্ষক, একই সময়ে ঘোরা।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
