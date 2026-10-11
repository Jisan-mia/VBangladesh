"use client";
// IP: what we avoided — nothing from the famous red-light/green-light series (no doll, song, track suits, numbered players or elimination); no real school, uniform badge or textbook; the teacher is kind (no cane, no scolding past a raised eyebrow) and the chit is never about exams.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, MAX_NAME, newSeed, useBest, useGameLoop, useSlowMode } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { buildLayers, drawFrame, makeView, refreshBoard, SCENE_H, SCENE_W, type Layers } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  BENCHES, benchesReached, bn, createGame, kindOf, parseShared, REPLIES, seconds, sharedHash, SLUG, statusOf, stepGame, tenthsOf, TITLE,
  type Game, type Shared, type Status,
} from "../lib/game";
import { caption, caughtLine, compareLine, friendClaim, friendLine, humanLine, statusLine } from "../lib/words";

/** Slow mode runs the whole class at this speed (the clock still counts real seconds). */
const SLOW_RATE = 0.7;

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
  const [result, setResult] = useState<{ tenths: number; catches: number } | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(SLUG, false);
  const live = useRef({ phase, paused, slow, tapMode });
  live.current = { phase, paused, slow, tapMode };
  viewRef.current.slow = slow;

  const teacher = gameRef.current.klass.teacher;
  const who = TITLE[teacher];
  const shared: Shared | null = result === null ? null : { seed, tenths: result.tenths, catches: result.catches, name: cleanName(name) };
  const state = shared ? sharedHash(shared) : "";

  function setHolding(next: boolean) {
    if (holding.current === next) return;
    holding.current = next;
    setHeld(next);
  }

  function reset(nextSeed: number) {
    const game = createGame(nextSeed);
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
    reset(friendLink ? friendLink.seed : newSeed());
  }, []);

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

  function step(dt: number) {
    const game = gameRef.current, marks = seen.current, slowNow = live.current.slow;
    const before = game.phase;
    stepGame(game, holding.current, dt, slowNow ? SLOW_RATE : 1);
    const kind = kindOf(game);
    if (kind !== marks.kind) {
      marks.kind = kind;
      // A tiny buzz when the teacher starts to turn while the chit is moving: a cue that isn't only visual.
      if ((kind === "tell" || kind === "peek") && holding.current && !slowNow && "vibrate" in navigator) navigator.vibrate(12);
    }
    if (game.catches !== marks.catches) {
      marks.catches = game.catches;
      if (live.current.tapMode) setHolding(false);
      if (!slowNow && "vibrate" in navigator) navigator.vibrate(30);
    }
    const nextStatus = statusOf(game, holding.current);
    if (nextStatus !== marks.status) { marks.status = nextStatus; setStatus(nextStatus); }
    const reached = benchesReached(game.pos);
    if (reached !== marks.bench) { marks.bench = reached; setBench(reached); }
    if (before === game.phase) return;
    if (before === "ready") setPhase("playing");
    if (game.phase === "over") {
      const tenths = tenthsOf(game.time);
      holding.current = false;
      setHeld(false);
      setPreviousBest(best);
      submitBest(tenths);
      setResult({ tenths, catches: game.catches });
      setPhase("over");
    }
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
    setHolding(live.current.tapMode ? !holding.current : true);
  }
  function release() { if (!live.current.tapMode) setHolding(false); }
  function resume() { setHolding(false); setPaused(false); }
  function again() {
    reset(friend ? friend.seed : newSeed());
    stageRef.current?.scrollIntoView({ block: "nearest" });
  }

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
      if (phase === "over") { if (event.key === "Enter") { event.preventDefault(); again(); } return; }
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
      if (shared && cardRef.current) drawCard(cardRef.current, shared, format, site);
      if (friend && friendCardRef.current) drawCard(friendCardRef.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const bestLine = result === null ? "" : previousBest === null ? "এই ফোনে এটাই প্রথম রেকর্ড। ভাঙতে পারবে?"
    : result.tenths < previousBest ? `নতুন রেকর্ড! আগের সেরা ছিল ${seconds(previousBest)} সেকেন্ড।` : `এই ফোনে সেরা: ${seconds(best ?? previousBest)} সেকেন্ড`;

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

      <div className="sg-bar">
        <ol className="sg-benches" aria-label={`${bn(BENCHES)}টা বেঞ্চের ${bn(bench)} নম্বরে চিরকুট`}>
          {Array.from({ length: BENCHES }, (_, at) => <li key={at} data-done={at < bench} data-now={at === bench - 1 && phase !== "over"} />)}
        </ol>
        <p className="sg-clock" aria-hidden="true"><span ref={clockRef}>০.০</span> সে.</p>
      </div>

      <div className="sg-stage" ref={stageRef} {...(phase === "over" ? {} : holdHandlers)} data-play={phase !== "over"}>
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
          <p className="sg-over-kicker">{bn(BENCHES)} বেঞ্চ পার · {caughtLine(result.catches)}</p>
          <p className="sg-over-time"><b>{seconds(result.tenths)}</b> সেকেন্ড</p>
          <p className="sg-over-line">{friend ? compareLine(result.tenths, friend) : humanLine(result.tenths, teacher)}</p>
          <p className="sg-over-best">{bestLine}</p>
          <button type="button" className="kit-primary sg-again" onClick={again}>আরেকবার</button>
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
            {best !== null && <p>এই ফোনে সেরা: {seconds(best)} সে.</p>}
          </div>
        </>
      )}

      {shared && (
        <section className="sg-result" id="result" aria-labelledby="sg-result-title">
          <h2 id="sg-result-title">তোমার <em>চিরকুট</em> কার্ড</h2>
          <div className="sg-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={cardRef} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sg-card-summary" />
              <figcaption id="sg-card-summary" className="sg-sr">{shared.name && `${shared.name}, `}{bn(BENCHES)} বেঞ্চ {seconds(shared.tenths)} সেকেন্ডে। {humanLine(shared.tenths, teacher)}</figcaption>
              {cardError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sg-share">
              <label className="sg-name">
                <span>নাম <small>ডাকনামই যথেষ্ট, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={SLUG} fileName="sir-ghurlei-thamo.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared.tenths, teacher)} state={state} hint="লিংক খুললে বন্ধু একই ক্লাস পাবে: একই শিক্ষক, একই সময়ে ঘোরা।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
