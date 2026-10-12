"use client";
// IP: what we avoided — no famous lane-hopping game's name, animal hero, cars, road, voxel/blocky 3D look or sounds; ours is a school kid with a bag and a গামছা
// on a gently top-down Bangladeshi river (নৌকা, ভেলা, কচুরিপানা, a ferry and its wake, brick ghats with a bell), drawn from scratch, with our own rules: a fall is a splash and a quick restart from the last bank.

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, hiss, loop, sfx, shake, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { banner, bn, caption, compareLine, detailLine, humanLine, nearLine, newsOf, parseShareHash, riverLabel, secs, shareHash, ARRIVED_LINE, PLACES, type Shared } from "../lib/result";
import {
  act, createRun, drain, makeRiver, openingLevel, starsOf, stepRun, tenths, ARRIVED, BLOCKED, COLS, DOWN, EDGY, FERRY, FERRY_IN, HOPPED, LEFT, LEVEL_COUNT,
  MANGO, NEAR, PANA, RESPAWNED, RIGHT, SPLASHED, UP, WATER, type Run,
} from "../lib/river";
import { drawScene, makeScene, markRespawn, popup, ringBell, settleCamera, tickScene, type Scene } from "../lib/scene";

const TOOL = "nodi-par";
/** "ধীরে খেলো" runs the whole river (and the clock) at this speed, so times and stars stay comparable. */
const SLOW = 0.6;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { stars: number; record: boolean; previousBest: number | null };

/** The ghat's brass bell: a few inharmonic partials that ring out (the game's own sound). */
const bell = () => { for (const [frequency, length, volume] of [[880, 1.3, 0.1], [1760, 0.9, 0.05], [2430, 0.7, 0.035], [4750, 0.35, 0.015]] as const) tone(frequency, length, volume, "sine"); };
/** The ferry's horn: a low, slightly sagging ভোঁ. */
const horn = () => { tone(131, 0.9, 0.08, "sawtooth", 0, 124); tone(196, 0.9, 0.045, "sawtooth", 0, 186); };
/** A hop: a wooden টক on a boat or raft, a soft leafy swish on কচুরিপানা, a thud on land; a little higher with each quick hop. */
function hopSound(surface: number, chain: number) {
  const up = 1 + 0.05 * Math.min(8, chain);
  if (surface === PANA) { hiss(0.08, 0.06, 1500); tone(330 * up, 0.05, 0.05, "sine", 0, 250 * up); }
  else if (surface) { tone(430 * up, 0.05, 0.1, "triangle", 0, 300 * up); hiss(0.03, 0.04, 2600, "highpass"); }
  else tone(240 * up, 0.05, 0.08, "sine", 0, 180);
  if (chain >= 4) sfx.combo(chain - 4);
}

export function RiverGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`, false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [chain, setChain] = useState(0);
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
  const water = useRef<ReturnType<typeof loop> | null>(null);
  const waterLevel = useRef(-1);
  const hornAt = useRef(-9);
  const overAt = useRef(0);
  const opened = useRef(false);
  const touch = useRef<{ id: number; x: number; y: number; acted: boolean } | null>(null);
  const [settling, setSettling] = useState(false);
  const stageInView = useInView(stage);

  const river = useMemo(() => makeRiver(level), [level]);
  const riverRef = useRef(river);
  riverRef.current = river;
  const ferryRow = useMemo(() => river.lanes.findIndex(lane => lane.floaters.some(floater => floater.kind === FERRY)), [river]);
  const card: Shared | null = result ? { ...result, name: cleanName(name) } : null;
  const state = card ? shareHash({ level: card.level, seed: card.seed, tenths: card.tenths, mangoes: card.mangoes, splashes: card.splashes, name: card.name }) : "";
  const rival = friend && friend.level === level ? friend : null;
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const allStars = totalStars(levels.stars);

  function stopWater() { water.current?.stop(); water.current = null; waterLevel.current = -1; }
  function startWater() { stopWater(); water.current = loop("wind", 420); }

  function start() {
    run.current = createRun(riverRef.current);
    if (scene.current) settleCamera(scene.current, 0);
    setResult(null);
    setChain(0);
    setSettling(false);
    setPhase("playing");
    startWater();
  }
  function pause() { setPhase(current => { if (current === "playing") { stopWater(); return "paused"; } return current; }); }
  function resume() { setPhase(current => { if (current === "paused") { startWater(); return "playing"; } return current; }); }
  function restart() { if (performance.now() - overAt.current > 450) start(); }

  function finish(played: Run) {
    stopWater();
    const time = tenths(played.time), stars = starsOf(played.river, time / 10, played.got);
    const previousBest = best, record = submitBest(time) && previousBest !== null;
    levels.record(level, stars);
    overAt.current = performance.now();
    setResult({ level, seed: played.river.seed, tenths: time, mangoes: played.got, splashes: played.splashes, name: "", stars, record, previousBest });
    // StarReveal chimes each star; the big cheer is for three stars or a new best only.
    window.setTimeout(() => { if (stars === 3 || record) { sfx.win(); confetti(); } else sfx.good(); }, 260 * (stars + 1));
    setSettling(true);
    window.setTimeout(() => setSettling(false), 1800);
    setPhase("over");
  }

  /** Turns what happened in the river into sound, words and a little motion. */
  function react(events: number, played: Run) {
    const view = scene.current;
    if (events & HOPPED) {
      hopSound(played.falling ? 1 : played.surface, played.chain);
      setChain(played.chain >= 4 ? played.chain : 0);
    }
    if (events & BLOCKED) sfx.tick();
    if (events & EDGY && view) popup(view, "কিনারায়!", played.x, played.row, "#ffe08a");
    if (events & MANGO) { sfx.coin(); if (view) popup(view, "+১ আম", played.x, played.row, "#ffd84a"); }
    if (events & SPLASHED) {
      sfx.splash(); tone(170, 0.18, 0.1, "sine", 0, 80);
      if (!slow) buzz(25);
      shake(stage.current);
      setChain(0);
      const swept = played.splashX < 0 || played.splashX > COLS;
      if (view) popup(view, swept ? "স্রোত টেনে নিল!" : events & NEAR ? "একটুর জন্য!" : "ছপাৎ!", played.splashX, played.splashRow);
    }
    if (events & RESPAWNED) { tone(500, 0.09, 0.1, "sine", 0, 950); if (view) { markRespawn(view); popup(view, "আবার", played.x, played.row, "#bff0d0"); } }
    if (events & FERRY_IN && played.t - hornAt.current > 3) {
      hornAt.current = played.t; horn();
      const lane = played.river.lanes[ferryRow];
      if (view && lane) popup(view, "ভোঁ!", lane.dir > 0 ? 1 : COLS - 1, ferryRow, "#ffffff");
    }
    if (events & ARRIVED) { bell(); if (view) ringBell(view); }
  }

  /** A tap, a swipe, a button or an arrow key. On the ready screen it starts the river first (and the first hop always lands). */
  function input(action: number) {
    if (phase === "ready") start();
    else if (phase !== "playing") return;
    const played = run.current;
    if (!played) return;
    act(played, action);
    react(drain(played), played);
  }

  const step = (dt: number) => {
    const played = run.current, view = scene.current, speed = slow ? SLOW : 1;
    if (phase === "playing" && played && !played.done) {
      stepRun(played, dt * speed);
      react(drain(played), played);
      // The river's sound follows the current under your feet: louder and higher on fast water, quiet on land.
      const lane = played.river.lanes[played.row];
      const volume = played.down > 0 ? 0.2 : lane.type === WATER ? 0.32 + (played.river.rain ? 0.1 : 0) : 0.12;
      if (water.current && Math.abs(volume - waterLevel.current) > 0.01) {
        waterLevel.current = volume;
        water.current.set(volume);
        water.current.pitch(lane.type === WATER ? 360 + lane.speed * 240 : 320);
      }
      if (played.done) finish(played);
    }
    if (view) tickScene(view, dt * speed, phase === "ready" ? null : played);
  };
  const draw = () => { if (scene.current) drawScene(scene.current, phase === "ready" ? null : run.current, slow); };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  useGameLoop(step, draw, phase === "playing" || settling || (phase === "ready" && stageInView && !slow));

  // The scene is built for this river at this width, and again when either changes.
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let laidOut = 0;
    const build = (force: boolean) => {
      const width = element.clientWidth;
      if (width <= 0 || (!force && width === laidOut)) return;
      laidOut = width;
      scene.current = makeScene(element, width, riverRef.current, scene.current);
      settleCamera(scene.current, run.current && run.current.river === riverRef.current ? run.current.row : 0);
      drawRef.current();
    };
    build(true);
    const observer = new ResizeObserver(() => build(false));
    observer.observe(element);
    return () => observer.disconnect();
  }, [river]);

  useEffect(() => {
    loadCardFonts("নদী পার আম সে ০১২৩৪৫৬৭৮৯ ছপাৎ").then(() => {
      // The clock's pill was measured in the fallback font: measure again.
      if (scene.current) { scene.current.hud.tenths = -1; scene.current.hud.got = -1; }
      drawRef.current();
    }).catch(() => { /* the system font draws the numbers instead */ });
    // In-page anchors also change the hash, so only a real challenge counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      setLevel(shared.level);
      setResult(null);
      setPhase(current => current === "playing" ? current : "ready");
    };
    readFriend();
    setSite(window.location.host);
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); stopWater(); };
  }, []);

  // A returning player opens on the first river they haven't three-starred (a friend's link wins).
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    if (!parseShareHash(window.location.hash)) setLevel(openingLevel(levels.stars, levels.unlocked));
  }, [levels.loaded]);

  // Scrolling the river away mid-crossing pauses it.
  useEffect(() => { if (!stageInView) pause(); }, [stageInView]);

  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.altKey || event.ctrlKey || event.metaKey || !stageInView) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const action = key === "ArrowUp" || key === "w" ? UP : key === "ArrowDown" || key === "s" ? DOWN : key === "ArrowLeft" || key === "a" ? LEFT : key === "ArrowRight" || key === "d" ? RIGHT : 0;
      if (action && (phase === "playing" || phase === "ready")) { event.preventDefault(); if (!event.repeat) input(action); return; }
      if (phase === "playing") {
        if (key === "p" || key === "Escape") { event.preventDefault(); pause(); }
        else if (key === " " || key === "Enter") { event.preventDefault(); if (!event.repeat) input(UP); }
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

  useEffect(() => {
    if (phase !== "over") return;
    const timer = window.setTimeout(() => again.current?.focus({ preventScroll: true }), 600);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("নদী পার সেকেন্ড আম ওপারে ঘাট ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // Tap = hop forward; a swipe of 26px or more hops that way at once (before the finger lifts).
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button")) return;
    touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY, acted: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const now = touch.current;
    if (!now || now.acted || now.id !== event.pointerId) return;
    const dx = event.clientX - now.x, dy = event.clientY - now.y;
    if (Math.hypot(dx, dy) < 26) return;
    now.acted = true;
    input(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : dy < 0 ? UP : DOWN);
  }
  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const now = touch.current;
    touch.current = null;
    if (now && !now.acted && now.id === event.pointerId) input(UP);
  }
  // The pad answers on touch-down for speed; a keyboard "click" (detail 0) still works.
  const pad = (action: number) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button <= 0) input(action); },
    onClick: (event: { detail: number }) => { if (event.detail === 0) input(action); },
  });
  const keepTap = (event: ReactPointerEvent) => event.stopPropagation();
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const goToCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  /** From the river list or "পরের নদী": the river is set and waits on its ready screen. */
  function pickRiver(next: number) {
    stopWater();
    setLevel(next);
    setResult(null);
    setPhase("ready");
    run.current = null;
    stage.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }
  function playFromCard() { setPhase("ready"); run.current = null; stage.current?.scrollIntoView({ behavior: smooth(), block: "center" }); }
  function soundChanged(on: boolean) { if (!on) stopWater(); else if (phase === "playing") startWater(); }

  const near = result ? nearLine(result.tenths, result.mangoes, level) : "";
  const bestLine = !result ? "" : near ? near : result.previousBest !== null && !result.record ? `আর ${secs(result.tenths - result.previousBest + 1)} সেকেন্ড কম হলেই এই নদীর নতুন সেরা।` : "";
  const friendName = friend?.name || "";
  const whose = friendName ? possessive(friendName) : "বন্ধুর";

  return (
    <div className="np">
      {friend && (
        <section className="np-friend" aria-labelledby="np-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${whose} কার্ড: ${secs(friend.tenths)} সেকেন্ড, ${detailLine(friend)}`} />
          <div>
            <h2 id="np-friend-title">{banner(friend)}</h2>
            <p>{whose} নিজের ফোনের সময়। একই নদী, একই নৌকা-ভেলা।</p>
          </div>
        </section>
      )}

      <p className="np-level"><b>{riverLabel(level)}</b> <span aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></p>
      <div className="np-stage" ref={stage} data-phase={phase} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { touch.current = null; }}>
        <canvas ref={canvas} role="img" aria-label="ওপর থেকে দেখা নদী: নৌকা, ভেলা আর কচুরিপানা স্রোতে ভাসছে, নিচের ঘাটে স্কুলব্যাগ কাঁধে একটা ছেলে। চাপ দিলে সামনে লাফ, আঙুল ডানে-বাঁয়ে টানলে পাশে। কিবোর্ডে তীর-চিহ্ন।" />
        {phase === "ready" && (
          <div className="np-overlay np-ready">
            <p className="np-how">চাপ দিলে লাফ</p>
            <p className="np-sub">{newsOf(level)}</p>
            <p className="np-sub np-hint">পাশে যেতে আঙুল ডানে-বাঁয়ে টানো।</p>
            <button type="button" className="kit-primary np-go" onPointerDown={keepTap} onClick={start}>শুরু করো</button>
          </div>
        )}
        {phase === "paused" && (
          <div className="np-overlay np-dim">
            <p className="np-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary np-go" onPointerDown={keepTap} onClick={resume}>চালিয়ে যাও</button>
            <button type="button" className="np-restart" onPointerDown={keepTap} onClick={start}>নদীর শুরু থেকে</button>
          </div>
        )}
        {phase === "over" && result && <p className="np-ribbon">{ARRIVED_LINE}</p>}
        {phase === "playing" && chain >= 4 && <p className="np-chain" key={chain} aria-hidden="true">টানা {bn(chain)} লাফ</p>}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `নদী পার। ${secs(result.tenths)} সেকেন্ড, ${detailLine(result)}। ${bn(result.stars)} তারা।${result.record ? " এই নদীতে এই ফোনের নতুন রেকর্ড।" : ""}` : ""}</p>
      </div>

      {phase === "over" && result ? (
        <div className="np-over">
          <div className="np-over-head">
            <p className="np-over-kicker">নদী {bn(level)} পার, ওপারে {PLACES[level - 1]}</p>
            <StarReveal count={result.stars} />
          </div>
          <p className="np-score"><b>{secs(result.tenths)} সে</b><span>{result.record ? "এই নদীতে এই ফোনের নতুন রেকর্ড!" : result.previousBest !== null && best !== null ? `এই নদীতে এই ফোনের সেরা: ${secs(best)} সে` : ""}</span></p>
          <p className="np-detail">{detailLine(result)}</p>
          {bestLine && <p className="np-near">{bestLine}</p>}
          {rival && <p className="np-versus">{compareLine(result.tenths, rival.tenths, friendName)}</p>}
          <div className="np-over-actions">
            {level < LEVEL_COUNT
              ? <><button type="button" ref={again} className="kit-primary np-again" onClick={() => pickRiver(level + 1)}>পরের নদী</button><button type="button" className="np-second" onClick={restart}>আবার খেলো</button></>
              : <><button type="button" ref={again} className="kit-primary np-again" onClick={restart}>আরেকবার</button><button type="button" className="np-second" onClick={goToCard}>ছবি বানাও ↓</button></>}
          </div>
        </div>
      ) : (
        <div className="np-pad" aria-label="লাফের বোতাম">
          <button type="button" className="np-key" aria-label="এক ঘর বাঁয়ে" disabled={phase === "paused"} {...pad(LEFT)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          </button>
          <button type="button" className="np-key np-up" aria-label="সামনে লাফ" disabled={phase === "paused"} {...pad(UP)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 7-7 7 7" /></svg>সামনে
          </button>
          <button type="button" className="np-key" aria-label="এক ঘর ডানে" disabled={phase === "paused"} {...pad(RIGHT)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <button type="button" className="np-key np-back" aria-label="এক সারি পিছনে" disabled={phase !== "playing"} {...pad(DOWN)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>পিছনে
          </button>
        </div>
      )}

      <div className="np-bar">
        <button type="button" className="np-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
        <SoundToggle compact className="np-sound" onChange={soundChanged} />
        <button type="button" className="np-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>

      <details className="np-levels">
        <summary>সব নদী <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>১ থেকে ১০ গ্রামের খাল, ১১ থেকে ২০ বড় নদী (চর, ফেরি, ঢেউ), ২১ থেকে ৩০ বর্ষার নদী। ওপারে উঠলেই ১ তারা, সময়ের মধ্যে পারলে আরেকটা, সব আম তুললে আরেকটা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} noun="নদী" onPick={pickRiver} />
      </details>

      {card && result && (
        <section className="np-result" id="result" ref={resultBox} aria-labelledby="np-result-title">
          <div className="np-result-head">
            <h2 id="np-result-title">নদী {bn(card.level)} পার: <em>{secs(card.tenths)} সেকেন্ড</em></h2>
            <p>{rival ? `${compareLine(card.tenths, rival.tenths, friendName)} ${humanLine(card)}` : humanLine(card)}</p>
          </div>
          <div className="np-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="np-card-summary" />
              <figcaption id="np-card-summary" className="screen-reader-only">নদী পার{card.name && ` · ${card.name}`}: নদী {bn(card.level)}, {secs(card.tenths)} সেকেন্ড, {detailLine(card)}। {humanLine(card)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="np-controls">
              <label className="np-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="nodi-par.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই নদীটাই পাবে।" />
              <button type="button" className="kit-link np-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
