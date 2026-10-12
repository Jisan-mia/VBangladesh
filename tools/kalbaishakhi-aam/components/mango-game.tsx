"use client";
// IP: what we avoided — no fruit-catching game's name, look or characters; our own ডালা, mango tree and Boishakh storm, drawn from scratch, with our own rule numbers.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { newSeed, useBest, useGameLoop, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, tickScene, type Scene } from "../lib/draw-scene";
import {
  bn, caption, cleanName, compareLine, createGame, humanLine, parseShareHash, shareHash, stepGame, windAt,
  BASKET_MAX, BASKET_MIN, FOLLOW_SPEED, MOVE_SPEED, STEP, W, type Game, type Shared,
} from "../lib/storm";

const TOOL = "kalbaishakhi-aam";
/** Slow mode runs the storm at this speed; the ডালা still moves at full speed. */
const SLOW_TIME = 0.7;
const TAP_SPEED = MOVE_SPEED * 1.6;
const HOLD_MS = 220;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { reason: 1 | 2; record: boolean };

const clampX = (x: number) => Math.min(BASKET_MAX, Math.max(BASKET_MIN, x));

function MangoIcon({ ripe }: { ripe: boolean }) {
  return <svg viewBox="-12 -15 24 27" aria-hidden="true">
    <path d="M-1 -9.2 Q-1.2 -11.2 0 -12.8" stroke="#5b3a1e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    {!ripe && <path d="M-0.4 -11.6 C1.2 -16.4 6 -17.2 8.4 -16 C6.4 -12.8 2.4 -11.2 -0.4 -11.6Z" fill="#3d7a2a" />}
    <path d="M-1 -9.6 C5 -11.2 8.4 -5.6 8 0 C7.6 6 3.6 10 -0.4 9.6 C-1.6 9.4 -2.8 9.2 -3.4 8.2 C-8 6 -7.6 -8.4 -1 -9.6Z" fill={ripe ? "#ffc93c" : "#86b23a"} stroke={ripe ? "#a9561a" : "#365a16"} strokeWidth="0.9" />
    {ripe && <circle cx="4.4" cy="-4.4" r="3.6" fill="#e2522b" opacity="0.55" />}
  </svg>;
}

function TwigIcon() {
  return <svg viewBox="-12 -9 24 18" aria-hidden="true">
    <path d="M-11 2 Q0 -1 11 -1 M-3 0 L-7 -6 M3 -0.5 L7 5 M8 -1 L10 -5" stroke="#3b2a1c" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    <path d="M-11 2 Q0 -1 11 -1 M-3 0 L-7 -6 M3 -0.5 L7 5 M8 -1 L10 -5" stroke="#8a6a48" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>;
}

export function MangoGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const seed = useRef(0);
  const finished = useRef(false);
  // One finger at a time. mode: 0 idle, 1 just pressed, 2 dragging, 3 holding to one side.
  const input = useRef({ id: -1, mode: 0, startX: 0, startBasket: W / 2, downAt: 0, side: 0, noStep: false, keys: 0, target: W / 2, speed: MOVE_SPEED });

  const card: Shared | null = result ? { seed: result.seed, score: result.score, count: result.count, name: cleanName(name) } : null;
  const state = card ? shareHash(card) : "";

  function start() {
    seed.current = friend ? friend.seed : newSeed();
    game.current = createGame(seed.current);
    finished.current = false;
    Object.assign(input.current, { mode: 0, keys: 0, target: W / 2, speed: MOVE_SPEED });
    setResult(null);
    setPhase("playing");
  }

  function stopInput() {
    Object.assign(input.current, { id: -1, mode: 0, keys: 0, target: game.current?.basket ?? W / 2 });
  }

  function pause() { stopInput(); setPhase(current => current === "playing" ? "paused" : current); }

  function finish(played: Game) {
    if (finished.current) return;
    finished.current = true;
    const record = submitBest(played.score) && played.score > 0;
    setResult({ seed: seed.current, score: played.score, count: played.caught, name: "", reason: played.over === 2 ? 2 : 1, record });
    stopInput();
    setPhase("over");
  }

  const step = (dt: number) => {
    const played = game.current, control = input.current;
    if (phase === "playing" && played && !played.over) {
      if (control.mode === 1 && performance.now() - control.downAt > HOLD_MS) control.mode = 3;
      if (control.mode === 3) { control.target = control.side < 0 ? BASKET_MIN : BASKET_MAX; control.speed = MOVE_SPEED; }
      else if (control.keys) { control.target = control.keys < 0 ? BASKET_MIN : BASKET_MAX; control.speed = MOVE_SPEED; }
      const lives = played.lives;
      stepGame(played, slow ? dt * SLOW_TIME : dt, control.target, control.speed * dt);
      if (played.lives < lives && !slow && "vibrate" in navigator) navigator.vibrate(12);
      if (played.over) finish(played);
    }
    const view = scene.current;
    if (view) tickScene(view, dt, played && phase !== "ready" ? windAt(played.storm.gusts, played.t) : 0.3 * Math.sin(view.clock * 0.5) + 0.1, slow);
  };
  const draw = () => { if (scene.current) drawScene(scene.current, phase === "ready" ? null : game.current, slow); };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  // The storm gathers on the ready screen too (not in slow mode); it stops when the game is over or paused.
  useGameLoop(step, draw, phase === "playing" || (phase === "ready" && !slow));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const build = () => { if (element.clientWidth > 0) { scene.current = makeScene(element, element.clientWidth, scene.current); drawRef.current(); } };
    build();
    loadCardFonts("কালবৈশাখী ০১২৩৪৫৬৭৮৯").then(() => drawRef.current()).catch(() => { /* the system font draws the numbers instead */ });
    const observer = new ResizeObserver(build);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // In-page anchors also change the hash, so only a real challenge counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      setPhase(current => current === "playing" ? current : "ready");
    };
    readFriend();
    setSite(window.location.host);
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);
  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const direction = (key: string) => key === "ArrowLeft" || key === "a" ? -1 : key === "ArrowRight" || key === "d" ? 1 : 0;
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const here = document.activeElement === document.body || Boolean(stage.current?.contains(document.activeElement));
      const dir = direction(event.key);
      if (dir && (phase === "playing" || (phase === "ready" && here))) {
        event.preventDefault();
        if (phase === "ready") start();
        input.current.keys = dir;
      } else if (phase === "playing" && (event.key === "p" || event.key === "Escape")) { event.preventDefault(); pause(); }
      else if (phase === "playing" && event.key === " ") event.preventDefault();
      else if ((event.key === " " || event.key === "Enter") && here && document.activeElement === document.body) {
        if (phase === "paused") { event.preventDefault(); setPhase("playing"); }
        else if (phase !== "playing") { event.preventDefault(); start(); }
      }
    };
    const up = (event: KeyboardEvent) => {
      if (direction(event.key) && direction(event.key) === input.current.keys) { input.current.keys = 0; input.current.target = game.current?.basket ?? W / 2; }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  useEffect(() => { if (phase === "over") again.current?.focus({ preventScroll: true }); }, [phase]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("কালবৈশাখী আম ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const toX = (clientX: number) => { const rect = canvas.current!.getBoundingClientRect(); return (clientX - rect.left) / rect.width * W; };

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const control = input.current;
    if (event.button > 0 || control.id !== -1 || phase === "over" || phase === "paused") return;
    const fresh = phase === "ready";
    if (fresh) start();
    const x = toX(event.clientX);
    Object.assign(control, { id: event.pointerId, mode: 1, startX: x, startBasket: game.current?.basket ?? W / 2, downAt: performance.now(), side: x < W / 2 ? -1 : 1, noStep: fresh });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone: moves still reach the stage */ }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const control = input.current;
    if (event.pointerId !== control.id) return;
    const x = toX(event.clientX);
    if (control.mode === 1 && Math.abs(x - control.startX) > 6) control.mode = 2;
    if (control.mode !== 2) return;
    // The ডালা follows the finger's movement, not its position, so the thumb never hides it. Re-anchor at the edges.
    let target = control.startBasket + (x - control.startX) * 1.2;
    if (target !== clampX(target)) { control.startBasket += clampX(target) - target; target = clampX(target); }
    control.target = target; control.speed = FOLLOW_SPEED;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const control = input.current;
    if (event.pointerId !== control.id) return;
    const basket = game.current?.basket ?? W / 2;
    if (control.mode === 1 && !control.noStep && !cancelled) {
      const from = control.speed === TAP_SPEED ? control.target : basket;
      control.target = clampX(from + control.side * STEP); control.speed = TAP_SPEED;
    } else if (control.mode === 3) control.target = basket;
    Object.assign(control, { id: -1, mode: 0, noStep: false });
  }

  const goToCard = () => document.getElementById("result")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const keepTap = (event: ReactPointerEvent) => event.stopPropagation();
  const friendName = friend?.name || "";

  return (
    <div className="ka">
      {friend && (
        <section className="ka-friend" aria-labelledby="ka-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName || "বন্ধুর"} ছবি: ${bn(friend.count)}টা আম, ${bn(friend.score)} পয়েন্ট`} />
          <div>
            <p className="ka-friend-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
            <h2 id="ka-friend-title">{friendName || "তোমার বন্ধু"} {bn(friend.score)} পয়েন্ট করেছে। <span>একই ঝড়, এবার তোমার পালা।</span></h2>
            <p>{friendName ? possessive(friendName) : "বন্ধুর"} নিজের ফোনের স্কোর, {bn(friend.count)}টা আম।</p>
          </div>
        </section>
      )}

      <div className="ka-stage" ref={stage} data-phase={phase} tabIndex={-1}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={event => onPointerUp(event, true)}>
        <canvas ref={canvas} role="img" aria-label="আমগাছের নিচে উঠান, কালবৈশাখীর ঝড়। নিচে একটা ডালা। বাঁ-ডান তীর বা আঙুল দিয়ে ডালা সরিয়ে আম ধরো, শুকনো ডাল এড়াও।" />
        {phase === "ready" && (
          <div className="ka-overlay ka-ready">
            <p className="ka-how">ডালা সরিয়ে আম ধরো</p>
            <ul className="ka-legend">
              <li><MangoIcon ripe={false} /><span>কাঁচা <b>+৫</b></span></li>
              <li><MangoIcon ripe /><span>পাকা <b>+১০</b></span></li>
              <li><TwigIcon /><span>ডাল <b>ধরো না</b></span></li>
            </ul>
            <button type="button" className="kit-primary ka-go" onPointerDown={keepTap} onClick={start}>শুরু করো</button>
            <p className="ka-sub">আঙুলে টেনে সরাও, নয়তো বাঁয়ে-ডানে চাপো</p>
          </div>
        )}
        {phase === "paused" && (
          <div className="ka-overlay ka-dim">
            <p className="ka-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary ka-go" onPointerDown={keepTap} onClick={() => setPhase("playing")}>চালিয়ে যাও</button>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `খেলা শেষ। ${bn(result.count)}টা আম, ${bn(result.score)} পয়েন্ট। ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
        {phase === "over" && result && (
          <div className="ka-overlay ka-dim ka-over">
            <p className="ka-kicker">{result.reason === 2 ? "তিনটা ডাল পড়ল ডালায়!" : "ঝড় থেমে গেল!"}</p>
            <p className="ka-big"><b>{bn(result.count)}টা আম</b><span>{bn(result.score)} পয়েন্ট</span></p>
            <p className="ka-best">{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা: ${bn(best)} পয়েন্ট` : ""}</p>
            {friend && <p className="ka-versus">{compareLine(result.score, friend.score, friendName)}</p>}
            <button type="button" ref={again} className="kit-primary ka-go" onPointerDown={keepTap} onClick={start}>আরেকবার</button>
            <button type="button" className="ka-to-card" onPointerDown={keepTap} onClick={goToCard}>ছবি বানাও, বন্ধুকে পাঠাও ↓</button>
          </div>
        )}
      </div>

      <div className="ka-bar">
        <button type="button" className="ka-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <i aria-hidden="true" />ধীরে খেলো<small>ঝিলিক, বৃষ্টি বন্ধ</small>
        </button>
        <button type="button" className="ka-pause" onClick={phase === "paused" ? () => setPhase("playing") : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>
      <p className="ka-safe">সত্যিকারের কালবৈশাখীতে গাছের নিচে যেয়ো না, বাজ পড়ে, ডাল ভাঙে। আম কুড়াও ঝড় থামলে।</p>

      {card && result && (
        <section className="ka-result" id="result" aria-labelledby="ka-result-title">
          <div className="ka-result-head">
            <h2 id="ka-result-title"><em>{bn(card.count)}টা আম</em>, {bn(card.score)} পয়েন্ট</h2>
            <p>{friend ? `${compareLine(card.score, friend.score, friendName)} ${humanLine(card.score)}` : humanLine(card.score)}</p>
          </div>
          <div className="ka-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ka-card-summary" />
              <figcaption id="ka-card-summary" className="ka-sr">কালবৈশাখী আম{card.name && ` · ${card.name}`}: {bn(card.count)}টা আম, {bn(card.score)} পয়েন্ট। {humanLine(card.score)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ka-controls">
              <label className="ka-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="kalbaishakhi-aam.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই ঝড়টাই পাবে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
