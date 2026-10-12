"use client";
// IP: what we avoided — no BTV or any real channel's logo, ident, test card, programme or presenter; no TV brand on the set; channels are just চ্যানেল ১–৫ showing our own cartoon drawings.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, MAX_NAME, newSeed, useBest, useGameLoop, useSlowMode } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import {
  angDiff, bn, caption, CELEBRATE, channelName, compareLine, createGame, friendClaim, friendLine, humanLine, parseShared, ROUNDS, seconds,
  sharedHash, SHOWS, shout, signal, SLUG, stepGame, tenthsOf, type Game, type Hint, type Shared,
} from "../lib/antenna";
import { buildLayers, drawFrame, SCENE_H, SCENE_W, type FrameState, type Layers } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";

/** Degrees per tap on ◀ ▶; holding turns 70°/s, then 120°/s after a second (35°/s in slow mode). */
const TAP_STEP = 2;
const HOLD_DELAY = 0.22;
const TICKS = Array.from({ length: 24 }, (_, index) => index * 15);
/** The antenna from above on the dial: [y, half-length], short directors at the front (top). */
const ELEMENTS = [[38, 30], [24, 27], [10, 23], [-6, 20], [-22, 17], [-38, 14]] as const;

type Phase = "ready" | "playing" | "over";

const labelsFor = (game: Game) => game.rounds.flatMap((round, index) => [channelName(index), `${channelName(index)} · ${SHOWS[round.picture]}`]);

export function AntennaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<SVGGElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLCanvasElement>(null);
  const friendCardRef = useRef<HTMLCanvasElement>(null);
  const layersRef = useRef<Layers | null>(null);
  const gameRef = useRef<Game>(createGame(1));
  const labelsRef = useRef<string[]>(labelsFor(gameRef.current));
  const view = useRef({ quality: 0, time: 0, shownTenths: -1, shownAngle: -1, hint: "start" as Hint, index: 0 });
  const frame = useRef<FrameState>({ angle: 0, quality: 0, picture: "cricket", time: 0, frozen: false, label: "" });
  const control = useRef({ pending: 0, hold: 0, holdTime: 0, drag: null as null | { id: number; last: number; cx: number; cy: number } });

  const [phase, setPhase] = useState<Phase>("ready");
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState<Hint>("start");
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<number | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(SLUG, false);
  const live = useRef({ phase, paused, slow });
  live.current = { phase, paused, slow };

  const shared: Shared | null = result === null ? null : { seed, tenths: result, name: cleanName(name) };
  const state = shared ? sharedHash(shared) : "";
  const done = index + (hint === "got" || hint === "done" ? 1 : 0);

  function reset(nextSeed: number) {
    const game = createGame(nextSeed);
    gameRef.current = game;
    labelsRef.current = labelsFor(game);
    Object.assign(view.current, { quality: signal(game.rounds[0], 0), shownTenths: -1, shownAngle: -1, hint: "start", index: 0 });
    Object.assign(control.current, { pending: 0, hold: 0, drag: null });
    setSeed(nextSeed); setPhase("ready"); setPaused(false); setHint("start"); setIndex(0); setResult(null);
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
    const game = gameRef.current, current = frame.current, seen = view.current;
    const locked = game.phase === "got" || game.phase === "over";
    current.angle = game.angle;
    current.quality = seen.quality;
    current.picture = game.rounds[game.index].picture;
    current.time = seen.time;
    current.frozen = live.current.slow;
    current.label = labelsRef.current[game.index * 2 + (locked ? 1 : 0)];
    drawFrame(canvas.getContext("2d")!, layers, current);
    const tenths = Math.round(game.time * 10);
    if (tenths !== seen.shownTenths && clockRef.current) { seen.shownTenths = tenths; clockRef.current.textContent = seconds(tenths); }
    const angle = Math.round(game.angle) % 360;
    if (angle !== seen.shownAngle) {
      seen.shownAngle = angle;
      dialRef.current?.setAttribute("transform", `rotate(${angle})`);
      if (sliderRef.current) sliderRef.current.value = String(angle);
    }
  }

  function step(dt: number) {
    const game = gameRef.current, input = control.current, seen = view.current, slowNow = live.current.slow;
    if (input.hold) {
      input.holdTime += dt;
      if (input.holdTime > HOLD_DELAY) input.pending += input.hold * (slowNow ? 35 : input.holdTime > 1.2 ? 120 : 70) * dt;
    }
    const turn = input.pending;
    input.pending = 0;
    const before = game.phase;
    stepGame(game, turn, dt, slowNow ? 2 : CELEBRATE);
    const target = game.phase === "got" || game.phase === "over" ? 1 : signal(game.rounds[game.index], game.angle);
    seen.quality += (target - seen.quality) * Math.min(1, dt * 7);
    seen.time += dt;
    if (game.hint !== seen.hint) { seen.hint = game.hint; setHint(game.hint); }
    if (game.index !== seen.index) { seen.index = game.index; setIndex(game.index); }
    if (before === game.phase) return;
    if (before === "ready") setPhase("playing");
    if (game.phase === "got" && !slowNow && "vibrate" in navigator) navigator.vibrate(15);
    if (game.phase === "over") {
      const tenths = tenthsOf(game.time);
      setPreviousBest(best);
      submitBest(tenths);
      setResult(tenths);
      setPhase("over");
    }
  }

  useGameLoop(step, draw, !paused && phase !== "over");

  // Size the canvas to its box and pre-render the static layers for that size.
  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const size = () => {
      const width = stage.clientWidth;
      if (!width) return;
      fitCanvas(canvas, width, width * SCENE_H / SCENE_W);
      layersRef.current = buildLayers(width, Math.min(2, window.devicePixelRatio || 1));
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(stage);
    document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, []);

  // A phone put in a pocket never plays on: hiding the tab pauses with "চালিয়ে যাও".
  useEffect(() => {
    const hide = () => { if (document.hidden && live.current.phase === "playing") setPaused(true); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  const playable = () => !live.current.paused && live.current.phase !== "over";
  function press(direction: number) {
    if (!playable()) return;
    Object.assign(control.current, { pending: control.current.pending + direction * TAP_STEP, hold: direction, holdTime: 0 });
  }
  const release = () => { control.current.hold = 0; };
  function resume() {
    Object.assign(control.current, { pending: 0, hold: 0, drag: null });
    setPaused(false);
  }
  function again() {
    reset(friend ? friend.seed : newSeed());
    stageRef.current?.scrollIntoView({ block: "nearest" });
  }

  // Desktop: hold ← → to turn; Space or Enter to carry on after a pause or play again.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (!playable()) return;
        event.preventDefault();
        if (!event.repeat) press(event.key === "ArrowLeft" ? -1 : 1);
      } else if ((event.key === " " || event.key === "Enter") && !target.closest?.("button, a, summary")) {
        if (paused) { event.preventDefault(); resume(); } else if (phase === "over") { event.preventDefault(); again(); }
      }
    };
    const up = (event: KeyboardEvent) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") release(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // Turning the dial: follow the finger's angle around the centre, wherever it grabbed.
  const fingerAngle = (event: ReactPointerEvent, cx: number, cy: number) => Math.atan2(event.clientX - cx, cy - event.clientY) * 180 / Math.PI;
  function dialDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!playable()) return;
    const box = event.currentTarget.getBoundingClientRect(), cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    event.currentTarget.setPointerCapture(event.pointerId);
    control.current.drag = { id: event.pointerId, last: fingerAngle(event, cx, cy), cx, cy };
  }
  function dialMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = control.current.drag;
    if (!drag || drag.id !== event.pointerId || !playable()) return;
    // Right at the centre the angle jumps about; ignore it there.
    if (Math.hypot(event.clientX - drag.cx, event.clientY - drag.cy) < 14) return;
    const angle = fingerAngle(event, drag.cx, drag.cy);
    control.current.pending += angDiff(angle, drag.last);
    drag.last = angle;
  }
  const dialUp = () => { control.current.drag = null; };

  const turnButton = (direction: -1 | 1) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); press(direction); },
    onPointerUp: release, onPointerCancel: release, onLostPointerCapture: release,
    onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
    // Enter or Space on a focused button arrives as a click with no pointer.
    onClick: (event: ReactMouseEvent) => { if (event.detail === 0 && playable()) control.current.pending += direction * TAP_STEP * 2; },
  });

  useEffect(() => {
    if (!shared && !friend) return;
    let cancelled = false;
    loadCardFonts("অ্যান্টেনা ঠিক করো ৪৭.৩ সেকেন্ডে").then(() => {
      if (cancelled) return;
      if (shared && cardRef.current) drawCard(cardRef.current, shared, format, site);
      if (friend && friendCardRef.current) drawCard(friendCardRef.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const bestLine = result === null ? "" : previousBest === null ? "এই ফোনে এটাই প্রথম রেকর্ড। ভাঙতে পারবে?"
    : result < previousBest ? `নতুন রেকর্ড! আগের সেরা ছিল ${seconds(previousBest)} সেকেন্ড।` : `এই ফোনে সেরা: ${seconds(best ?? previousBest)} সেকেন্ড`;

  return (
    <div className="at" data-slow={slow}>
      {friend && (
        <section className="at-friend" aria-labelledby="at-friend-title">
          <canvas ref={friendCardRef} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${seconds(friend.tenths)} সেকেন্ড`} />
          <div>
            <p className="at-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
            <h2 id="at-friend-title">{friendLine(friend)}</h2>
            <p className="at-claim">{friendClaim(friend)}</p>
          </div>
        </section>
      )}

      <div className="at-bar">
        <ol className="at-dots" aria-label={`${bn(ROUNDS)}টার মধ্যে ${bn(done)}টা চ্যানেল এসেছে`}>
          {Array.from({ length: ROUNDS }, (_, at) => <li key={at} data-done={at < done} data-now={at === index && phase !== "over"} />)}
        </ol>
        <p className="at-clock" aria-hidden="true"><span ref={clockRef}>০.০</span> সে.</p>
      </div>

      <div className="at-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="at-canvas" role="img" aria-label="ছাদে অ্যান্টেনা, নিচের ঘরে ঝিরঝির টিভি" />
        <p className="at-shout" aria-live="polite"><span key={`${hint}-${index}`} data-hint={hint}>{shout(hint, index)}</span></p>
        {paused && (
          <div className="at-pause">
            <p>খেলা থেমে আছে</p>
            <button type="button" className="kit-primary" onClick={resume} autoFocus>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {phase === "over" && result !== null ? (
        <div className="at-over">
          <p className="at-over-kicker">{bn(ROUNDS)}টা চ্যানেলই ঝকঝকে!</p>
          <p className="at-over-time"><b>{seconds(result)}</b> সেকেন্ড</p>
          <p className="at-over-line">{friend ? compareLine(result, friend) : humanLine(result)}</p>
          <p className="at-over-best">{bestLine}</p>
          <button type="button" className="kit-primary at-again" onClick={again}>আরেকবার</button>
          <button type="button" className="kit-link" onClick={() => document.getElementById("result")?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "start" })}>কার্ডটা দেখো ↓</button>
        </div>
      ) : (
        <>
          <div className="at-controls">
            <button type="button" className="at-turn" aria-label="বাঁয়ে ঘোরাও" {...turnButton(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>বাঁয়ে
            </button>
            <div className="at-dial" onPointerDown={dialDown} onPointerMove={dialMove} onPointerUp={dialUp} onPointerCancel={dialUp}>
              <svg viewBox="-80 -80 160 160" aria-hidden="true">
                <circle className="at-dial-ring" r="77" />
                {TICKS.map(angle => <line key={angle} className="at-dial-tick" x1="0" y1="-73" x2="0" y2={angle % 90 ? -68 : -63} transform={`rotate(${angle})`} />)}
                <g ref={dialRef}>
                  <circle className="at-dial-plate" r="58" />
                  <line className="at-dial-boom" x1="0" y1="46" x2="0" y2="-48" />
                  {ELEMENTS.map(([y, half]) => <line key={y} className="at-dial-element" x1={-half} y1={y} x2={half} y2={y} />)}
                  <path className="at-dial-tip" d="M0 -70 6 -59H-6Z" />
                  <circle className="at-dial-hub" r="9" />
                </g>
              </svg>
              {phase === "ready" && <span className="at-dial-hint" aria-hidden="true">ঘোরাও</span>}
            </div>
            <button type="button" className="at-turn" aria-label="ডানে ঘোরাও" {...turnButton(1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>ডানে
            </button>
          </div>
          <label className="at-slider">
            <span className="at-sr">অ্যান্টেনার দিক, ০ থেকে ৩৫৯ ডিগ্রি</span>
            <input ref={sliderRef} type="range" min={0} max={359} step={1} defaultValue={0}
              onChange={event => { if (playable()) control.current.pending += angDiff(Number(event.currentTarget.value), gameRef.current.angle + control.current.pending); }} />
          </label>
          <div className="at-options">
            <button type="button" className="at-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>ধীরে খেলো
            </button>
            {best !== null && <p>এই ফোনে সেরা: {seconds(best)} সে.</p>}
          </div>
        </>
      )}

      {shared && (
        <section className="at-result" id="result" aria-labelledby="at-result-title">
          <h2 id="at-result-title">তোমার <em>ছবি এল</em> কার্ড</h2>
          <div className="at-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={cardRef} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="at-card-summary" />
              <figcaption id="at-card-summary" className="at-sr">{shared.name && `${shared.name}, `}{bn(ROUNDS)}টা চ্যানেল {seconds(shared.tenths)} সেকেন্ডে। {humanLine(shared.tenths)}</figcaption>
              {cardError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="at-share">
              <label className="at-name">
                <span>নাম <small>ডাকনাম দিতে পারো, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={SLUG} fileName="antenna-thik-koro.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared.tenths)} state={state} hint={`লিংক খুললে বন্ধু একই ${bn(ROUNDS)}টা চ্যানেল, একই জায়গায় পাবে।`} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
