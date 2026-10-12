"use client";
// IP: what we avoided — no famous racing game's name, cars, track or look, no post office name, logo, uniform, badge or letterbox; ours is a plain-shirted village letter carrier on an old roadster, a dusty three-lane village road drawn from scratch in warm dawn colours (the only nod to the old handhelds is a faint cell grid and cell-style lane dashes), and our own rule numbers.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, newSeed, useBest, useGameLoop, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { banner, bn, bumpLine, caption, compareLine, detailLine, humanLine, parseShareHash, shareHash, type Shared } from "../lib/result";
import { createRun, steer, stepRun, SLOW_CAP, TOP, type Run } from "../lib/ride";
import { absorb, drawScene, makeScene, resetScene, setFriendName, tickScene, BELL_RANG, LETTER_TAKEN, type Scene } from "../lib/scene";
import { bell, blip, unlock } from "../lib/sound";

const TOOL = "peoner-cycle";
/** Slow mode runs the road at this speed (and SLOW_CAP stops it getting faster). */
const SLOW_TIME = 0.75;
/** After "চালিয়ে যাও" the road waits this long, so nobody resumes blind. */
const RESUME_GRACE = 0.6;
/** How long the wobble and the flying letters play after a bump. */
const SETTLE_MS = 2400;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { kind: number; record: boolean };

export function CycleGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [sound, setSound] = useState(false);
  const [best, submitBest] = useBest(TOOL);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [settling, setSettling] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const run = useRef<Run | null>(null);
  const grace = useRef(0);
  const overAt = useRef(0);
  const settleTimer = useRef(0);
  const stageInView = useInView(stage);

  const card: Shared | null = result ? { seed: result.seed, score: result.score, meters: result.meters, letters: result.letters, name: cleanName(name) } : null;
  const state = card ? shareHash(card) : "";

  function start() {
    run.current = createRun(friend ? friend.seed : newSeed(), slow ? SLOW_CAP : TOP);
    if (scene.current) resetScene(scene.current);
    grace.current = 0;
    setResult(null);
    setSettling(false);
    setPhase("playing");
  }
  function pause() { setPhase(current => current === "playing" ? "paused" : current); }
  function resume() { grace.current = RESUME_GRACE; setPhase(current => current === "paused" ? "playing" : current); }
  function restart() { if (performance.now() - overAt.current > 450) start(); }

  function finish(played: Run) {
    const record = submitBest(played.score) && played.score > 0;
    overAt.current = performance.now();
    setResult({ seed: played.seed, score: played.score, meters: played.meters, letters: played.letters, name: "", kind: played.hitKind, record });
    setSettling(true);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettling(false), SETTLE_MS);
    setPhase("over");
  }

  /** A tap on one side, a button or an arrow: the ready screen starts; a ride moves one lane. */
  function side(towards: -1 | 1) {
    if (phase === "ready") start();
    else if (phase === "playing" && run.current) steer(run.current, towards);
  }

  const step = (dt: number) => {
    const played = run.current, view = scene.current;
    if (phase === "playing" && played && !played.over) {
      if (grace.current > 0) grace.current -= dt;
      else { played.cap = slow ? SLOW_CAP : TOP; stepRun(played, slow ? dt * SLOW_TIME : dt); }
      if (view) {
        const happened = absorb(view, played);
        if (happened & LETTER_TAKEN) { if (sound) blip(); if (!slow && typeof navigator.vibrate === "function") navigator.vibrate(8); }
        if (happened & BELL_RANG && sound) bell();
      }
      if (played.over) finish(played);
    }
    if (view) tickScene(view, slow ? dt * SLOW_TIME : dt, slow, phase === "ready" && !slow);
  };
  const draw = () => { if (scene.current) drawScene(scene.current, phase === "ready" ? null : run.current, slow, friend?.meters ?? 0); };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  // The ready screen rolls the road by (not in slow mode, and only while it's on screen); the bump plays out, then the loop rests.
  useGameLoop(step, draw, phase === "playing" || (!slow && ((phase === "ready" && stageInView) || (phase === "over" && settling))));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let laidOut = 0;
    const build = () => {
      const width = element.clientWidth;
      if (width <= 0 || width === laidOut) return;
      laidOut = width;
      scene.current = makeScene(element, width, scene.current);
      drawRef.current();
    };
    build();
    loadCardFonts("পিয়নের সাইকেল চিঠি মি ০১২৩৪৫৬৭৮৯").then(() => drawRef.current()).catch(() => { /* the system font draws the numbers instead */ });
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
      if (scene.current) setFriendName(scene.current, shared.name || "বন্ধু");
      setPhase(current => current === "playing" ? current : "ready");
    };
    readFriend();
    setSite(window.location.host);
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);

  // The scene may be built after the link was read (or rebuilt on a resize): keep the friend's flag name on it.
  useEffect(() => { if (scene.current && friend) setFriendName(scene.current, friend.name || "বন্ধু"); });

  // Scrolling the road away mid-ride pauses it, so nobody crashes off-screen.
  useEffect(() => { if (!stageInView) pause(); }, [stageInView]);

  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.altKey || event.ctrlKey || event.metaKey || !stageInView) return;
      const key = event.key;
      const towards = key === "ArrowLeft" || key === "a" || key === "A" ? -1 : key === "ArrowRight" || key === "d" || key === "D" ? 1 : 0;
      if (towards && phase !== "over") { event.preventDefault(); if (!event.repeat) side(towards); return; }
      if (phase === "playing") {
        if (key === "p" || key === "P" || key === "Escape") { event.preventDefault(); pause(); }
        else if (key === " ") event.preventDefault();
        return;
      }
      if (key !== " " && key !== "Enter") return;
      if (event.target instanceof HTMLElement && event.target.closest("button, a, summary")) return;
      event.preventDefault();
      if (phase === "ready") start();
      else if (phase === "paused") resume();
      else if (phase === "over") restart();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // "আরেকবার" takes focus a moment after a bump, so a tap at the instant of the bump doesn't restart at once.
  useEffect(() => {
    if (phase !== "over") return;
    const timer = window.setTimeout(() => again.current?.focus({ preventScroll: true }), 600);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("পিয়নের সাইকেল মিটার চিঠি ক্রিং ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function onStageDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button")) return;
    const box = event.currentTarget.getBoundingClientRect();
    side(event.clientX - box.left < box.width / 2 ? -1 : 1);
  }
  // The lane buttons answer on touch-down for speed; a keyboard "click" (detail 0) still works.
  const laneButton = (towards: -1 | 1) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button <= 0) side(towards); },
    onClick: (event: { detail: number }) => { if (event.detail === 0) side(towards); },
  });
  const keepTap = (event: ReactPointerEvent) => event.stopPropagation();
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const goToCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  function playFromCard() {
    setPhase("ready");
    stage.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }
  function toggleSound() {
    if (!sound) unlock();
    setSound(!sound);
  }

  const friendName = friend?.name || "";
  const whose = friendName ? possessive(friendName) : "বন্ধুর";

  return (
    <div className="pc">
      {friend && (
        <section className="pc-friend" aria-labelledby="pc-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${whose} কার্ড: ${bn(friend.score)}, ${detailLine(friend)}`} />
          <div>
            <h2 id="pc-friend-title">{banner(friend)}</h2>
            <p>{whose} নিজের ফোনের স্কোর। রাস্তার বাঁ পাশে পতাকা দেখলে বুঝবে, ওখানেই থেমেছিল।</p>
          </div>
        </section>
      )}

      <div className="pc-stage" ref={stage} data-phase={phase} onPointerDown={onStageDown}>
        <canvas ref={canvas} role="img" aria-label="ভোরের মেঠো পথে চিঠির ঝোলা নিয়ে সাইকেলে পিয়ন। রাস্তার বাঁ বা ডান পাশে চাপলে এক লেন সরে যায়। কিবোর্ডে বাঁ-ডান তীর।" />
        {phase === "ready" && (
          <div className="pc-overlay pc-ready">
            <p className="pc-how">বাঁয়ে-ডানে চাপো</p>
            <p className="pc-sub">গরু-ছাগল, কাদা বাঁচাও, চিঠি তোলো</p>
            <button type="button" className="kit-primary pc-go" onPointerDown={keepTap} onClick={start}>শুরু করো</button>
          </div>
        )}
        {phase === "paused" && (
          <div className="pc-overlay pc-dim">
            <p className="pc-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary pc-go" onPointerDown={keepTap} onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `খেলা শেষ। ${bn(result.score)} পয়েন্ট। ${detailLine(result)} ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
        {phase === "over" && result && (
          <div className="pc-overlay pc-bump">
            <p className="pc-kicker">{bumpLine(result.kind)}</p>
            <p className="pc-headline">চিঠি উড়ে গেল!</p>
          </div>
        )}
      </div>

      {phase === "over" && result ? (
        <div className="pc-over">
          <p className="pc-score"><b>{bn(result.score)}</b><span>{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা: ${bn(best)}` : ""}</span></p>
          <p className="pc-detail">{detailLine(result)}</p>
          {friend && <p className="pc-versus">{compareLine(result.score, friend.score, friendName)}</p>}
          <div className="pc-over-actions">
            <button type="button" ref={again} className="kit-primary pc-again" onClick={restart}>আরেকবার</button>
            <button type="button" className="pc-to-card" onClick={goToCard}>ছবি বানাও ↓</button>
          </div>
        </div>
      ) : (
        <div className="pc-pad" aria-label="লেন বদলানোর বোতাম">
          <button type="button" className="pc-lane" aria-label="এক লেন বাঁয়ে" disabled={phase === "paused"} {...laneButton(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>বাঁয়ে
          </button>
          <button type="button" className="pc-lane" aria-label="এক লেন ডানে" disabled={phase === "paused"} {...laneButton(1)}>
            ডানে<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>
      )}

      <div className="pc-bar">
        <button type="button" className="pc-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <i aria-hidden="true" />ধীরে খেলো
        </button>
        <button type="button" className="pc-toggle" aria-pressed={sound} onClick={toggleSound}>
          <i aria-hidden="true" />শব্দ
        </button>
        <button type="button" className="pc-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>

      {card && result && (
        <section className="pc-result" id="result" ref={resultBox} aria-labelledby="pc-result-title">
          <div className="pc-result-head">
            <h2 id="pc-result-title">আজকের চিঠি বিলি: <em>{bn(card.score)}</em></h2>
            <p>{friend ? `${compareLine(card.score, friend.score, friendName)} ${humanLine(card.score)}` : humanLine(card.score)}</p>
          </div>
          <div className="pc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pc-card-summary" />
              <figcaption id="pc-card-summary" className="pc-sr">পিয়নের সাইকেল{card.name && ` · ${card.name}`}: {bn(card.score)}, {detailLine(card)}। {humanLine(card.score)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pc-controls">
              <label className="pc-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="peoner-cycle.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই রাস্তাটাই পাবে, তোমার পতাকাসহ।" />
              <button type="button" className="kit-link pc-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
