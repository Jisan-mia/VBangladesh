"use client";
// IP: what we avoided — no racket or shuttle brand, no real player, club, tournament or broadcast look, and no sports-game HUD; ours is a made-up গলি at night with a bare bulb, a net tied between two windows, monkey caps and five invented neighbours.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { armAngle, drawAlley, drawFog, drawMoths, drawNeighbour, drawPlayer, drawRing, drawShadow, drawShuttle, drawWashing, SIGH_WINDOW } from "../lib/art";
import { cardBlob, drawCard, ME } from "../lib/draw-card";
import { opponentOf, LEVEL_COUNT, NIGHT_NAME, OPPONENTS } from "../lib/levels";
import {
  bannerNote, bn, caption, clearLine, compareLine, feat, hitLine, humanLine, levelLabel, lossLine, nearMissLine, parseShared, pointLine, score, sharedHash,
  type Shared,
} from "../lib/link";
import {
  heading, newGame, posX, posY, ringRadius, ringShows, starsOf, step, swing, timeToHit, windOf,
  GROUND, H, HIT_Y, PERFECT, POINTS, W, type Game, type LandReason,
} from "../lib/rally";
import { airSwing, farPing, netFlap, racketPing, sigh, swish, windLoop } from "../lib/sound";

const TOOL = "golir-badminton";
const MAX_WIDTH = 480;
/** Slow mode runs the whole game at this speed: slower shuttles, a wider window in real seconds. */
const SLOW = 0.6;
const SIGH_TIME = 1.4;

type Phase = "ready" | "play" | "won" | "lost";
type Result = { them: number; us: number; rally: number; stars: number; improved: boolean; reason: LandReason | null; newBest: boolean };

function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    scale: 1,
    background: null as HTMLCanvasElement | null,
    fog: null as HTMLCanvasElement | null,
    game: newGame(1, 1) as Game,
    running: false, paused: false, cocked: false, calm: false, reduced: false,
    sighAt: -9, flashAt: -9, flashX: 0, flashY: 0, lastReason: null as LandReason | null,
    wind: null as ReturnType<typeof windLoop> | null,
  };
}

export function BadmintonGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [points, setPoints] = useState({ us: 0, them: 0 });
  const [rally, setRally] = useState(0);
  const [streak, setStreak] = useState(0);
  const [call, setCall] = useState("");
  const [callKey, setCallKey] = useState(0);
  const [sighing, setSighing] = useState(0);
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
  const [best, submitBest] = useBest(TOOL);
  const [live] = useState(makeLive);

  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const chosen = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = result && phase === "won" ? { level, seed, them: result.them, rally: Math.max(1, result.rally), name } : null;
  const state = shared ? sharedHash(shared) : "";
  const opp = opponentOf(level);

  function stopWind() { live.wind?.stop(); live.wind = null; }

  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const make = (existing: HTMLCanvasElement | null) => {
      const layer = existing ?? document.createElement("canvas");
      layer.width = Math.round(W * k); layer.height = Math.round(H * k);
      const context = layer.getContext("2d");
      context?.setTransform(k, 0, 0, k, 0, 0);
      return { layer, context };
    };
    const back = make(live.background);
    live.background = back.layer;
    if (back.context) drawAlley(back.context, live.game.night);
    const fog = make(live.fog);
    live.fog = fog.layer;
    if (fog.context) drawFog(fog.context);
  }

  function say(text: string) { setCall(text); setCallKey(key => key + 1); }

  /** A fresh game at `next`. Restarting takes one frame. */
  function startLevel(next: number, gameSeed = newSeed(), play = true) {
    stopWind();
    const before = live.game.night;
    live.game = newGame(next, gameSeed);
    Object.assign(live, { paused: false, cocked: false, sighAt: -9, flashAt: -9, lastReason: null });
    if (live.game.night !== before && live.context) paint();
    setLevel(next); setSeed(gameSeed); setPoints({ us: 0, them: 0 }); setRally(0); setStreak(0); setCall(""); setResult(null); setPaused(false); setSighing(0);
    setPhaseState(play ? "play" : "ready");
    if (!play) draw();
  }

  function pickLevel(next: number) { chosen.current = true; startLevel(next); }

  function begin() {
    if (phase !== "ready") return;
    chosen.current = true;
    sfx.tap();
    setPhaseState("play");
  }

  function finish() {
    stopWind();
    const game = live.game, stars = starsOf(game.us, game.them);
    const before = best;
    const newBest = submitBest(game.longest) && before !== null && game.longest > 0;
    if (!stars) {
      setResult({ them: game.them, us: game.us, rally: game.longest, stars: 0, improved: false, reason: live.lastReason, newBest });
      setPhaseState("lost");
      sfx.lose();
      return;
    }
    const had = levels.stars[game.level] ?? 0;
    levels.record(game.level, stars);
    setResult({ them: game.them, us: game.us, rally: game.longest, stars, improved: had > 0 && stars > had, reason: null, newBest });
    setPhaseState("won");
    const colors = ["#ffd23f", "#e07a2e", "#f3ede1", "#4f86c6", "#c2571a"];
    if (game.level === LEVEL_COUNT) { sfx.levelUp(); confetti({ colors }); }
    else if (stars === 3 || newBest) { sfx.win(); confetti({ colors }); }
    else sfx.good();
  }

  /** Preview images only (`&og=1` on a link): a fixed 5–1 so the card draws without playing. Saves nothing on the phone. */
  function demo(found: Shared) {
    live.game.us = POINTS; live.game.them = 1;
    setPoints({ us: POINTS, them: 1 });
    setResult({ them: 1, us: POINTS, rally: found.rally, stars: 3, improved: false, reason: null, newBest: false });
    setPhaseState("won");
  }

  function handleEvents() {
    const game = live.game;
    for (const event of game.events) {
      if (event.type === "serve") { if (event.who === 1) farPing(); else racketPing(false); swish(); }
      else if (event.type === "hit" && event.who === 1) { farPing(); swish(); }
      else if (event.type === "hit") {
        const strong = event.kind === "smash";
        racketPing(strong);
        swish(strong || event.kind === "drive");
        if (strong) Object.assign(live, { flashAt: game.clock, flashX: game.flight.x0, flashY: game.flight.y0 });
        setRally(game.rally);
        setStreak(game.streak);
        if (game.streak >= 2) sfx.combo(game.streak - 2);
        if (event.kind !== "net" && game.rally > 0 && game.rally % 10 === 0) { say(`এক র‍্যালিতে ${bn(game.rally)} বার!`); sfx.coin(); }
        else say(hitLine(event.kind));
      }
      else if (event.type === "whiff") { airSwing(); say("ফসকে গেল।"); }
      else if (event.type === "net") netFlap();
      else if (event.type === "land") {
        setPoints({ us: game.us, them: game.them });
        setStreak(game.streak);
        say(pointLine(event.winner, event.reason, game.level));
        if (event.winner === 0) sfx.good();
        else {
          live.lastReason = event.reason;
          live.sighAt = game.clock;
          setSighing(n => n + 1);
          sigh();
          shake(scoreRef.current);
        }
      }
      else if (event.type === "done") finish();
    }
    game.events.length = 0;
  }

  function tick(dt: number) {
    if (live.paused) return;
    const game = live.game;
    step(game, dt * (slowRef.current ? SLOW : 1));
    if (game.events.length) handleEvents();
    if (game.night === "wind" && game.phase !== "done") {
      live.wind ??= windLoop();
      live.wind.set(windPush(game));
    }
  }

  /** How hard the wind pushes the shuttle on its way to you right now, 0..1. */
  function windPush(game: Game) {
    const f = game.flight;
    if (game.phase !== "flight" || f.toward !== 0 || game.t > f.T) return 0;
    return Math.min(1, Math.abs(f.bend) / windOf(game.level)) * Math.sin(Math.PI * (game.t / f.T));
  }

  function draw() {
    const c = live.context, background = live.background, game = live.game;
    if (!c || !background) return;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, W, H);
    const clock = game.clock, calm = live.calm;
    drawMoths(c, clock, calm);
    if (game.night === "wind") {
      const f = game.flight;
      drawWashing(c, game.phase === "flight" && f.toward === 0 ? Math.sign(-f.bend) * windPush(game) : calm ? 0 : Math.sin(clock * 0.7) * 0.15);
    }
    const since = clock - live.sighAt;
    if (since < SIGH_TIME) drawNeighbour(c, Math.min(1, since * 6, (SIGH_TIME - since) * 3));
    const bob = calm ? 0 : Math.sin(clock * 3.2) * 0.8;
    drawPlayer(c, game.playerX, 1, ME, armAngle(clock - game.playerSwingAt, live.cocked), bob);
    drawPlayer(c, game.botX, -1, game.opp.shirt, armAngle(clock - game.botSwingAt, false), calm ? 0 : Math.sin(clock * 3.2 + 1.3) * 0.8);

    let sx: number, sy: number, angle = 0;
    if (game.phase === "flight") {
      const f = game.flight;
      sx = posX(f, game.t); sy = Math.min(GROUND - 2, posY(f, game.t)); angle = heading(f, game.t);
    } else if (game.us + game.them > 0 && (game.phase === "gap" && game.t < 0.6 || game.phase === "done")) {
      sx = game.landX; sy = GROUND - 2; angle = Math.PI * 0.6;
    } else {
      // In the server's hand, about to go.
      sx = game.server === 1 ? game.botX - 12 : game.playerX + 12; sy = HIT_Y + 30; angle = Math.PI / 2;
    }
    drawShadow(c, sx, sy);
    drawShuttle(c, sx, sy, angle);
    if (game.night === "fog" && live.fog) c.drawImage(live.fog, 0, 0, W, H);
    if (ringShows(game)) {
      const left = timeToHit(game) ?? 0;
      drawRing(c, game.flight.x1, game.flight.y1, ringRadius(left), Math.abs(left) <= PERFECT * game.opp.window);
    }
    const flash = clock - live.flashAt;
    if (!calm && flash < 0.22) {
      c.strokeStyle = "#ffd23f"; c.globalAlpha = 1 - flash / 0.22; c.lineWidth = 2;
      c.beginPath(); c.arc(live.flashX, live.flashY, 8 + flash * 90, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = 1;
    }
    c.restore();
  }

  const looping = !paused && phase === "play" && boardInView;
  useGameLoop(tick, draw, looping);

  useEffect(() => {
    if (!looping) stopWind();
  }, [looping]);

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
      Object.assign(live, { scale, context: fitCanvas(element, width, height) });
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
      chosen.current = true;
      setFriend(found);
      startLevel(found.level, found.seed, false);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(found);
    };
    const hide = () => {
      if (!document.hidden) return;
      stopWind();
      live.cocked = false;
      if (live.game.phase !== "done") { live.paused = true; setPaused(true); }
    };
    setSite(window.location.host);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopWind();
    };
  }, []);

  // Open at the furthest level reached once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    startLevel(levels.unlocked, newSeed(), false);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`গলির ব্যাডমিন্টন লেভেল ১২৩ রাফি ${opp.object} ${levelLabel(level)}`).then(() => {
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
  }

  function raise() {
    if (live.paused) return;
    live.cocked = true;
    if (!looping) draw();
  }
  function hit() {
    if (!live.cocked) return;
    live.cocked = false;
    if (phase !== "play" || live.paused) return;
    swing(live.game);
  }

  // ---- keys: Space, Enter or ↑ held raises the racket, released swings ----
  const keys = useRef<{ down: (event: KeyboardEvent) => void; up: (event: KeyboardEvent) => void }>({ down: () => {}, up: () => {} });
  keys.current = {
    down(event) {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], button, a, summary") || !boardInView) return;
      if (event.key !== " " && event.key !== "Enter" && event.key !== "ArrowUp") return;
      event.preventDefault();
      if (event.repeat) return;
      if (live.paused) { resume(); return; }
      if (phase === "ready") begin();
      else if (phase === "play") raise();
      else if (phase === "lost") startLevel(level, rival ? seed : newSeed());
      else if (phase === "won") startLevel(level < LEVEL_COUNT ? level + 1 : level);
    },
    up(event) {
      if (event.key !== " " && event.key !== "Enter" && event.key !== "ArrowUp") return;
      if (live.cocked) { event.preventDefault(); hit(); }
    },
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current.down(event), up = (event: KeyboardEvent) => keys.current.up(event);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ---- pointer: press anywhere on the court (or the big button) to raise the racket, lift to swing ----
  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!event.isPrimary || (event.target as Element).closest(".gb-overlay")) return;
    if (phase === "ready") { begin(); return; }
    if (phase !== "play") return;
    raise();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!event.isPrimary) return;
    hit();
  }
  function onPointerCancel() { live.cocked = false; }

  const total = totalStars(levels.stars);
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const newcomer = !levels.stars[1] && level === 1 && !friend;
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });

  function statusLine() {
    if (phase === "ready") {
      if (live.game.night === "fog") return "কুয়াশায় শাটল ঢাকা পড়ে। নিচে ছায়া দেখো, রিং আসে শেষে।";
      if (live.game.night === "wind") return "বাতাসে শাটল বেঁকে যায়। দড়ির কাপড় দেখো, রিং ঠিক জায়গাতেই থাকে।";
      return "শাটল এলে রিংটা ছোট হবে। সোনালি হলেই চাপো।";
    }
    if (newcomer && points.us + points.them === 0) return "রিং সোনালি হলেই চাপো।";
    return "চেপে ধরলে র‍্যাকেট ওঠে, ছাড়লে মার।";
  }

  const sighStyle = { left: `${((SIGH_WINDOW.x + SIGH_WINDOW.w / 2) / W) * 100}%`, top: `${((SIGH_WINDOW.y - 6) / H) * 100}%` };

  return (
    <div className="gb" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="gb-friend" aria-labelledby="gb-friend-title">
          <h2 id="gb-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend.name)}</p>
        </section>
      )}

      <div className="gb-hud">
        <p className="gb-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        {streak >= 2 && phase === "play" ? <p className="gb-chip" key={streak}><span className="gx-pop">টানা {bn(streak)}টা জোরালো</span></p> : null}
      </div>

      <div className="gb-score" ref={scoreRef} role="group" aria-label={`পয়েন্ট: তুমি ${bn(points.us)}, ${opp.short} ${bn(points.them)}। ${bn(POINTS)} পয়েন্টে খেলা।`}>
        <p className="gb-me"><span className="gb-shirt" style={{ background: ME }} aria-hidden="true" /><b>তুমি</b><strong>{bn(points.us)}</strong></p>
        <p className="gb-rally" aria-label={`এই র‍্যালিতে ${bn(rally)} বার`}>র‍্যালি <b>{bn(rally)}</b></p>
        <p className="gb-them"><strong>{bn(points.them)}</strong><b>{opp.short}</b><span className="gb-shirt" style={{ background: opp.shirt }} aria-hidden="true" /></p>
      </div>

      <div className="gb-board" ref={board} data-phase={phase} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        <canvas ref={canvas} role="img" aria-label={`শীতের রাতে গলিতে বাল্বের নিচে ব্যাডমিন্টন। ${NIGHT_NAME[live.game.night]}, প্রতিপক্ষ ${opp.name}। পয়েন্ট ${bn(points.us)}–${bn(points.them)}।`} />
        {call && phase === "play" && <p className="gb-call" aria-hidden="true" key={callKey}>{call}</p>}
        {sighing > 0 && phase !== "ready" && <p className="gb-sigh" aria-hidden="true" key={`s${sighing}`} style={sighStyle}>আহা</p>}
        {phase === "ready" && <p className="gb-hint" aria-hidden="true">চাপলেই খেলা শুরু</p>}
        {paused && (
          <div className="gb-overlay">
            <p>খেলা থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {phase === "won" && result ? (
        <div className="gb-end" role="status">
          <StarReveal count={result.stars} />
          <p className="gb-end-line">{clearLine(level)}</p>
          <p className="gb-end-note">
            {score(result.them)} পয়েন্টে জয়।{" "}
            {rival ? compareLine(result, rival, rival.name)
              : result.newBest ? `নতুন রেকর্ড: এক র‍্যালিতে ${bn(result.rally)} বার!`
              : result.improved ? `এই লেভেলে নতুন রেকর্ড, ${bn(result.stars)} তারা!` : nearMissLine(result.them)}
          </p>
          <div className="gb-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => pickLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => pickLevel(level)}>আবার খেলো</button>
          </div>
          {shared && <button type="button" className="kit-link gb-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
        </div>
      ) : phase === "lost" && result ? (
        <div className="gb-end gb-lost" role="status">
          <p className="gb-lost-title">{opp.short} জিতল {bn(POINTS)}–{bn(result.us)}</p>
          <p className="gb-lost-line">{lossLine(result.us, result.reason)}</p>
          <p className="gb-end-note">
            {rival ? `${rival.name || "বন্ধু"} এই খেলা ${score(rival.them)} পয়েন্টে জিতেছিল। ` : ""}
            {best !== null && best > 0 ? `এই ফোনে সবচেয়ে লম্বা র‍্যালি ${bn(best)} বার।` : ""}
          </p>
          <button type="button" className="kit-primary gb-again" onClick={() => startLevel(level, rival ? seed : newSeed())}>আরেকবার</button>
        </div>
      ) : (
        <>
          <p className="gb-status">{statusLine()}</p>
          <p className="gb-sr" role="status" aria-live="polite">{phase === "play" ? call : ""}</p>
          <button type="button" className="gb-swing" data-ready={phase === "ready" || undefined} disabled={paused}
            onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
            onClick={event => { if (event.detail !== 0) return; if (phase === "ready") begin(); else { live.cocked = true; hit(); } }}>
            {phase === "ready" ? "শুরু করো" : "মারো"}
          </button>
        </>
      )}

      <div className="gb-prefs">
        <button type="button" className="gb-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={() => { live.wind = null; }} />
        {best !== null && best > 0 && <p className="gb-best">সবচেয়ে লম্বা র‍্যালি: <b>{bn(best)}</b></p>}
      </div>

      <details className="gb-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="gb-stages">{OPPONENTS.map((o, index) => `${bn(index * 3 + 1)}–${bn(index * 3 + 3)} ${o.name}`).join(" · ")}। প্রতিজনের সঙ্গে শান্ত, বাতাসের আর কুয়াশার রাত।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} onPick={pick => { pickLevel(pick); toTop(); }} />
      </details>

      <section className="gb-result" id="result" ref={resultBox} aria-labelledby="gb-result-title">
        <h2 id="gb-result-title">{shared ? <><em>{score(shared.them)}</em> পয়েন্টে {opp.object} হারালে</> : "জিতলে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared) : "খেলা জিতলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই রাতে একই খেলোয়াড় পাবে।"}</p>
        {shared && result && (
          <div className="gb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`গলির ব্যাডমিন্টনের কার্ড: ${levelLabel(level)}, ${opp.object} ${score(shared.them)} পয়েন্টে হারানো, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="gb-share">
              <label className="gb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`golir-badminton-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই রাতে একই খেলোয়াড় পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
