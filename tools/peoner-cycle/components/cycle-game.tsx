"use client";
// IP: what we avoided — no famous racing game's name, cars, track or look, no post office name, logo, uniform, badge or letterbox; ours is a plain-shirted village letter carrier on an old roadster, a dusty three-lane village road drawn from scratch in warm dawn colours (the only nod to the old handhelds is a faint cell grid and cell-style lane dashes), and our own rule numbers.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, hiss, newSeed, readLevels, sfx, tone, totalStars, unlockedLevel, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME, buzz } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { banner, bn, bumpLine, caption, compareLine, detailLine, humanLine, parseShareHash, routeLabel, shareHash, type Shared } from "../lib/result";
import { createRun, migrateBest, nextMark, starsOf, steer, stepRun, LEVEL_COUNT, PUDDLE, ROUTES, SLOW_CAP, TOP, type Run } from "../lib/ride";
import { absorb, announce, drawScene, makeScene, resetScene, setFriendName, tickScene, BELL_RANG, CRASHED, LETTER_TAKEN, type Scene } from "../lib/scene";

const TOOL = "peoner-cycle";
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
/** When each won star pops in on the result, in seconds (the CSS delay and the sound share it). */
const starAt = (index: number) => 0.3 + index * 0.28;
/** ক্রিং-ক্রিং: two strikes of a small metal dome (a few inharmonic partials that fade). */
const bell = () => { for (const strike of [0, 0.13]) for (const [frequency, volume] of [[2350, 0.09], [3720, 0.05], [5480, 0.025]] as const) tone(frequency, 0.45, volume, "sine", strike); };
/** A letter in the bag: a paper flick and a blip that climbs with every letter in a row. */
const letter = (step: number) => { hiss(0.05, 0.04, 3000, "highpass"); sfx.combo(step); };
/** Slow mode runs the road at this speed (and SLOW_CAP stops it getting faster). */
const SLOW_TIME = 0.75;
/** After "চালিয়ে যাও" the road waits this long, so nobody resumes blind. */
const RESUME_GRACE = 0.6;
/** How long the wobble and the flying letters play after a bump. */
const SETTLE_MS = 2400;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { kind: number; record: boolean; stars: number };

export function CycleGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  // Route 1 keeps the key the one-road game used, so the old best stays route 1's best.
  const [best, submitBest] = useBest(level === 1 ? TOOL : `${TOOL}-${level}`);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const timers = useRef<number[]>([]);
  const goal = useRef<{ meters: number; name: string }>({ meters: ROUTES[0].goal, name: ROUTES[0].name });
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

  const card: Shared | null = result ? { seed: result.seed, score: result.score, meters: result.meters, letters: result.letters, name: cleanName(name), level: result.level } : null;
  const state = card ? shareHash(card) : "";
  // A friend's link races on their road only on their route.
  const rival = friend && friend.level === level ? friend : null;
  const route = ROUTES[level - 1];
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const allStars = totalStars(levels.stars);

  function choose(nextLevel: number) {
    setLevel(nextLevel);
    goal.current = { meters: ROUTES[nextLevel - 1].goal, name: ROUTES[nextLevel - 1].name };
  }
  function start(nextLevel = level) {
    choose(nextLevel);
    run.current = createRun(friend && friend.level === nextLevel ? friend.seed : newSeed(), slow ? SLOW_CAP : TOP, nextLevel);
    if (scene.current) resetScene(scene.current);
    grace.current = 0;
    timers.current.forEach(clearTimeout); timers.current = [];
    setResult(null);
    setSettling(false);
    setStreak(0);
    setPhase("playing");
    bell();
  }
  function pause() { setPhase(current => current === "playing" ? "paused" : current); }
  function resume() { grace.current = RESUME_GRACE; setPhase(current => current === "paused" ? "playing" : current); }
  function restart() { if (performance.now() - overAt.current > 450) start(); }

  function finish(played: Run) {
    const record = submitBest(played.score) && played.score > 0 && best !== null, stars = starsOf(played.meters, level);
    overAt.current = performance.now();
    setPreviousBest(best);
    setResult({ seed: played.seed, score: played.score, meters: played.meters, letters: played.letters, name: "", kind: played.hitKind, record, stars, level });
    const later = (seconds: number, play: () => void) => timers.current.push(window.setTimeout(play, seconds * 1000));
    for (let star = 0; star < stars; star++) later(starAt(star), () => sfx.star(star));
    if (stars === 3 || record) later(starAt(stars), () => { sfx.win(); confetti(); });
    else if (stars > 0) later(starAt(stars), sfx.good);
    setSettling(true);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettling(false), SETTLE_MS);
    setPhase("over");
  }

  /** A tap on one side, a button or an arrow: the ready screen starts; a ride moves one lane. */
  function side(towards: -1 | 1) {
    if (phase === "ready") start();
    else if (phase === "playing" && run.current) { steer(run.current, towards); sfx.tap(); }
  }

  const step = (dt: number) => {
    const played = run.current, view = scene.current;
    if (phase === "playing" && played && !played.over) {
      const before = played.meters, streakBefore = played.streak;
      if (grace.current > 0) grace.current -= dt;
      else { played.cap = slow ? SLOW_CAP : TOP; stepRun(played, slow ? dt * SLOW_TIME : dt); }
      if (played.streak !== streakBefore) setStreak(played.streak);
      if (view) {
        const happened = absorb(view, played);
        if (happened & LETTER_TAKEN) { letter(played.streak - 1); if (!slow) buzz(8); }
        if (happened & BELL_RANG) bell();
        if (happened & CRASHED) {
          if (played.hitKind === PUDDLE) sfx.splash(); else sfx.thud();
          if (!slow) stage.current?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
        }
        // Passing the route's goal delivers its letters (the next route opens); the marks after it add stars.
        const earnedBefore = starsOf(before, level), earned = starsOf(played.meters, level);
        if (earned > earnedBefore) {
          levels.record(level, earned);
          if (earnedBefore === 0) { sfx.levelUp(); announce(view, `${route.name} পৌঁছে গেলে!`); }
          else { sfx.star(earned - 1); announce(view, `${bn(earned)} তারা!`); }
        }
      }
      if (played.over) finish(played);
    }
    if (view) tickScene(view, slow ? dt * SLOW_TIME : dt, slow, phase === "ready" && !slow);
  };
  const draw = () => { if (scene.current) drawScene(scene.current, phase === "ready" ? null : run.current, slow, rival?.meters ?? 0, goal.current); };
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
      choose(shared.level);
      if (scene.current) setFriendName(scene.current, shared.name || "বন্ধু");
      setPhase(current => current === "playing" ? current : "ready");
    };
    let saved = readLevels(stored(`ektukhani-levels-${TOOL}`), LEVEL_COUNT);
    const migrated = migrateBest(saved, stored(`ektukhani-best-${TOOL}`));
    if (migrated) { levels.record(1, migrated); saved = { 1: migrated }; }
    choose(unlockedLevel(saved, LEVEL_COUNT));
    readFriend();
    setSite(window.location.host);
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); timers.current.forEach(clearTimeout); };
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
  /** From the route list or "পরের রুট": the route is set, and the ride waits on the ready screen for a tap. */
  function pickRoute(nextLevel: number) {
    choose(nextLevel);
    setResult(null);
    setPhase("ready");
    stage.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }
  const won = (result?.stars ?? 0) > 0;
  const mark = result ? nextMark(result.meters, level) : 0;
  // The near miss, with the exact gap: to the goal or the next star, or (at three stars) to this phone's best.
  const nearLine = !result ? "" : mark ? `আর ${bn(mark - result.meters)} মিটার গেলেই ${won ? `${bn(result.stars + 1)} তারা` : `${route.name} পৌঁছাতে`}।`
    : previousBest !== null && !result.record ? `আর ${bn(previousBest - result.score + 1)} হলেই নতুন সেরা।` : "";

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

      <p className="pc-level"><b>{routeLabel(level)}</b> <span aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></p>
      <div className="pc-stage" ref={stage} data-phase={phase} onPointerDown={onStageDown}>
        <canvas ref={canvas} role="img" aria-label="ভোরের মেঠো পথে চিঠির ঝোলা নিয়ে সাইকেলে পিয়ন। রাস্তার বাঁ বা ডান পাশে চাপলে এক লেন সরে যায়। কিবোর্ডে বাঁ-ডান তীর।" />
        {phase === "ready" && (
          <div className="pc-overlay pc-ready">
            <p className="pc-how">বাঁয়ে-ডানে চাপো</p>
            <p className="pc-sub">{route.name} পর্যন্ত {bn(route.goal)} মিটার। গরু-ছাগল, কাদা বাঁচাও, চিঠি তোলো।</p>
            <button type="button" className="kit-primary pc-go" onPointerDown={keepTap} onClick={() => start()}>শুরু করো</button>
          </div>
        )}
        {phase === "paused" && (
          <div className="pc-overlay pc-dim">
            <p className="pc-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary pc-go" onPointerDown={keepTap} onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        {phase === "playing" && streak >= 2 && <p className="pc-streak" key={streak} aria-hidden="true">টানা {bn(streak)} চিঠি</p>}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `খেলা শেষ। ${bn(result.score)} পয়েন্ট। ${detailLine(result)}।${result.stars ? ` ${route.name} পৌঁছেছ, ${bn(result.stars)} তারা।` : ""}${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
        {phase === "over" && result && (
          <div className="pc-overlay pc-bump">
            <p className="pc-kicker">{bumpLine(result.kind)}</p>
            <p className="pc-headline">চিঠি উড়ে গেল!</p>
          </div>
        )}
      </div>

      {phase === "over" && result ? (
        <div className="pc-over">
          <div className="pc-over-head">
            <p className="pc-over-kicker">{won ? `${possessive(route.name)} চিঠি পৌঁছে গেছে।` : `${route.name} ছিল ${bn(route.goal)} মিটারে।`}</p>
            <p className="gx-stars pc-over-stars" role="img" aria-label={`৩টার মধ্যে ${bn(result.stars)}টা তারা`}>
              {[0, 1, 2].map(star => <span key={star} className={star < result.stars ? "on gx-pop" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
            </p>
          </div>
          <p className="pc-score"><b>{bn(result.score)}</b><span>{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই রুটে এই ফোনের সেরা: ${bn(best)}` : ""}</span></p>
          <p className="pc-detail">{detailLine(result)}</p>
          {nearLine && <p className="pc-near">{nearLine}</p>}
          {rival && <p className="pc-versus">{compareLine(result.score, rival.score, friendName)}</p>}
          <div className="pc-over-actions">
            {won && level < LEVEL_COUNT
              ? <><button type="button" ref={again} className="kit-primary pc-again" onClick={() => pickRoute(level + 1)}>পরের রুট</button><button type="button" className="pc-to-card" onClick={restart}>আবার খেলো</button></>
              : <><button type="button" ref={again} className="kit-primary pc-again" onClick={restart}>আরেকবার</button><button type="button" className="pc-to-card" onClick={goToCard}>ছবি বানাও ↓</button></>}
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
        <SoundToggle compact className="pc-sound" />
        <button type="button" className="pc-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>

      <details className="pc-levels">
        <summary>সব রুট <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>প্রতি রুটে রাস্তা আগের চেয়ে জোরে চলে, গরু-ঠেলাগাড়ি আসে আগে। রাস্তার ওপরের দাগ পার হলেই চিঠি পৌঁছায়, পরের রুট খোলে। আরও দূর গেলে বেশি তারা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} noun="রুট" onPick={pickRoute} />
      </details>

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
