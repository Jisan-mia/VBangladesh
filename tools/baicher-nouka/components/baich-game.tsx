"use client";
// IP: what we avoided — no famous racing or rhythm game's name, cars, tracks, notes, approach circles' look or music, and no real নৌকাবাইচ:
// no race name, team, boat name, sponsor, venue or region. Our own boats, river, crowd and rope flags are drawn from scratch, the চার লাইনের সারি
// is written fresh, the drum is synthesized, and the rule numbers are ours.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, hiss, loop, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { createRace, lagFrom, steer, stepRace, tapBeat, CALIB_BEATS, LEVEL_COUNT, MAX_LAG, MIN_LAG, VMAX, WINDOW, type Race } from "../lib/race";
import {
  banner, bn, caption, compareLine, humanLine, nearMiss, openingLevel, ordinal, parseShareHash, resultLine, secs, shareHash, starsForRank, type Shared,
} from "../lib/result";
import { absorb, drawScene, fontsReady, makeScene, pending, resetScene, setSideText, tickScene, DRUM, SNAGGED, type Scene } from "../lib/scene";

const TOOL = "baicher-nouka";
/** Slow mode runs the whole race at this speed, so the beat's window is wider in real time too. */
const SLOW_TIME = 0.75;
/** After "চালিয়ে যাও" the river waits this long, so nobody resumes blind. */
const RESUME_GRACE = 0.8;
/** How long the other boats keep rowing in after you finish. */
const SETTLE_MS = 2600;
const LAG_KEY = "ektukhani-baicher-nouka-lag";
type Phase = "ready" | "playing" | "paused" | "over" | "calib";
type Result = Shared & { hits: number; beats: number; snags: number; record: boolean; stars: number; behind: number; bestBefore: number | null };

/** ধিন: the drum's beat, a low thump that drops in pitch. */
const dhin = () => tone(140, 0.22, 0.32, "sine", 0, 55);
/** তা: you caught the beat, a bright slap over a lower one. */
const ta = () => { tone(420, 0.09, 0.16, "sine", 0, 230); tone(180, 0.12, 0.18, "sine", 0, 90); };
/** A tap off the beat: a dull, quiet knock. */
const thock = () => tone(120, 0.07, 0.08, "sine", 0, 90);
/** The oars swing the boat one lane over; a boat alongside knocks it back. */
const swish = () => hiss(0.14, 0.06, 1800, "bandpass");
const knock = () => tone(260, 0.05, 0.07, "square");
/** ছপ: into the কচুরিপানা. */
const snag = () => { hiss(0.3, 0.24, 900); buzz(25); };

const readLag = () => {
  try { const saved = Number(localStorage.getItem(LAG_KEY)); return Number.isFinite(saved) ? Math.min(MAX_LAG, Math.max(MIN_LAG, saved)) : 0; } catch { return 0; }
};
const saveLag = (lag: number) => { try { localStorage.setItem(LAG_KEY, String(lag)); } catch { /* private mode: it just isn't remembered */ } };

export function BaichGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL, false);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [level, setLevel] = useState(1);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [settling, setSettling] = useState(false);
  const [lag, setLag] = useState(0);
  const [calibNote, setCalibNote] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drum = useRef<HTMLButtonElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const race = useRef<Race | null>(null);
  const calib = useRef({ t: 0, taps: [] as number[] });
  const grace = useRef(0);
  const overAt = useRef(0);
  const settleTimer = useRef(0);
  // The river rushing past the hull: louder and brighter the faster you row. Runs only while racing.
  const rush = useRef<ReturnType<typeof loop> | null>(null);
  const stageInView = useInView(stage);

  const card: Shared | null = result ? { seed: result.seed, tenths: result.tenths, rank: result.rank, level: result.level, name: cleanName(name) } : null;
  const state = card ? shareHash(card) : "";
  const total = totalStars(levels.stars);
  const next = result && result.stars > 0 && result.level < LEVEL_COUNT ? result.level + 1 : 0;

  function startRush() { rush.current?.stop(); rush.current = loop("wind"); }
  function stopRush() { rush.current?.stop(); rush.current = null; }
  /** A friend's river while you race their race; any other race gets a fresh one. */
  const seedFor = (at: number) => friend && friend.level === at ? friend.seed : newSeed();
  /** Sets up race `at` on the ready screen, waiting for the first tap. */
  function ready(at: number) {
    setLevel(at);
    race.current = createRace(seedFor(at), lag, at);
    if (scene.current) resetScene(scene.current, race.current);
    setResult(null);
    setPhase("ready");
  }

  /** The race on the ready screen is the one that starts; after a race a fresh river (the friend's again, if any). */
  function start(at = level) {
    const waiting = race.current;
    if (!waiting || waiting.t > 0 || waiting.level !== at) race.current = createRace(seedFor(at), lag, at);
    setLevel(at);
    if (scene.current) resetScene(scene.current, race.current!);
    grace.current = 0;
    setResult(null);
    setSettling(false);
    setPhase("playing");
    startRush();
  }
  function pause() { setPhase(current => current === "playing" ? "paused" : current); }
  function resume() { grace.current = RESUME_GRACE; setPhase(current => current === "paused" ? "playing" : current); if (phase === "paused") startRush(); }
  const settled = () => performance.now() - overAt.current > 450;
  function restart() { if (settled()) start(result?.level ?? level); }
  /** After a race: the next one once you've placed, else the same race again. */
  function primary() { if (settled()) start(next || (result?.level ?? level)); }

  function finish(played: Race) {
    const record = submitBest(played.tenths), stars = starsForRank(played.rank);
    if (stars) levels.record(played.level, stars);
    // How far behind the boat one place ahead, for the near-miss line.
    const mine = played.boats[0].done;
    let ahead = -1;
    for (let index = 1; index < played.boats.length; index++) { const done = played.boats[index].done; if (done >= 0 && done < mine && done > ahead) ahead = done; }
    stopRush();
    // Confetti only for a real feat: 1st place, a new best, or the last race placed. StarReveal chimes each star.
    if (stars === 3 || record || (stars && played.level === LEVEL_COUNT)) { sfx.win(); confetti(); } else if (stars) sfx.good(); else sfx.drop();
    overAt.current = performance.now();
    setResult({
      seed: played.seed, tenths: played.tenths, rank: played.rank, level: played.level, name: "", record, stars, bestBefore: best,
      behind: ahead >= 0 ? Math.max(1, Math.round((mine - ahead) * 10)) : 0,
      hits: played.hits, beats: played.marks.filter(mark => mark !== 0).length, snags: played.patchHits,
    });
    setSettling(true);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettling(false), SETTLE_MS);
    setPhase("over");
  }

  function startCalib() {
    calib.current = { t: 0, taps: [] };
    setCalibNote("");
    setPhase("calib");
  }
  function endCalib(cancelled = false) {
    setPhase("ready");
    if (cancelled) return;
    const measured = lagFrom(calib.current.taps);
    if (measured === null) { setCalibNote("ঠিকমতো ধরা গেল না। আরেকবার চেষ্টা করো, বৃত্ত ঢোলে মিললেই চাপ দিয়ো।"); return; }
    setLag(measured);
    saveLag(measured);
    setCalibNote(measured > 0.03 ? "তাল মিলেছে! তোমার ফোন চাপ একটু দেরিতে ধরে, এখন থেকে সেটা মিলিয়ে নেব।" : measured < -0.03 ? "তাল মিলেছে! তুমি একটু আগেভাগে চাপো, সেটাও মিলিয়ে নেব।" : "তাল মিলেছে! তোমার ফোন ঠিক সময়েই চাপ ধরে।");
  }

  /** The left or right side: the ready screen starts; a race moves one lane. */
  function side(towards: -1 | 1) {
    if (phase === "ready") start();
    else if (phase === "playing" && race.current && grace.current <= 0) { if (steer(race.current, towards)) swish(); else knock(); }
  }
  /** The drum: the ready screen starts; a race counts the beat; তাল মেলাও notes the tap. */
  function beat() {
    if (phase === "ready") { start(); return; }
    if (phase === "calib") { calib.current.taps.push(calib.current.t); return; }
    if (phase !== "playing" || !race.current || grace.current > 0) return;
    const rating = tapBeat(race.current);
    if (rating > 0) {
      ta();
      // A run of beats climbs in pitch.
      if (race.current.streak >= 2) sfx.combo(race.current.streak - 2);
      if (!slow) buzz(10);
    } else if (rating < 0) thock();
  }

  const step = (dt: number) => {
    const played = race.current, view = scene.current;
    if (!played) return;
    const scale = slow ? SLOW_TIME : 1;
    if (phase === "playing" && !played.over) {
      if (grace.current > 0) grace.current -= dt;
      else { played.lag = lag * scale; stepRace(played, dt * scale); }
      if (view) {
        const happened = absorb(view, played);
        if (happened & DRUM) dhin();
        if (happened & SNAGGED) snag();
      }
      const speed = played.boats[0].speed;
      rush.current?.set(0.12 + 0.55 * speed / VMAX);
      rush.current?.pitch(320 + speed * 2.2);
      if (played.over) finish(played);
    } else if (phase === "over" && settling) stepRace(played, dt * scale);
    else if (phase === "calib") {
      calib.current.t += dt;
      if (CALIB_BEATS.some(at => at <= calib.current.t && at > calib.current.t - dt)) dhin();
      if (calib.current.t > CALIB_BEATS[CALIB_BEATS.length - 1] + 0.7) endCalib();
    }
    if (view) tickScene(view, dt);
  };

  const draw = () => {
    const view = scene.current, played = race.current;
    if (!view || !played) return;
    drawScene(view, played, { phase, slow, calibT: calib.current.t, calibBeats: CALIB_BEATS });
    // The big drum button lights up with the ring (twice a beat at most, never a flicker).
    let delta = Infinity;
    if (phase === "playing") { const index = pending(played); if (index >= 0) delta = played.beats[index] - played.t; }
    else if (phase === "calib") { for (const at of CALIB_BEATS) if (at - calib.current.t >= -WINDOW) { delta = at - calib.current.t; break; } }
    const next = Math.abs(delta) <= WINDOW ? "now" : delta > 0 && delta < 0.6 ? "near" : "";
    if (drum.current && drum.current.dataset.beat !== next) drum.current.dataset.beat = next;
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useGameLoop(step, draw, phase === "playing" || phase === "calib" || (phase === "ready" && stageInView) || (phase === "over" && settling));

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
    if (!race.current) race.current = createRace(newSeed());
    build();
    loadCardFonts("বাইচের নৌকা হেঁইয়ো টান দে জোরে ঢোলের তালে বৈঠা ধরে পানা কাটিয়ে এগিয়ে যাই সবার আগে ঘাটে পৌঁছাই সে এখন ১ম ২য় ৩য় ৪র্থ ০১২৩৪৫৬৭৮৯.")
      .then(() => { if (scene.current) fontsReady(scene.current); drawRef.current(); })
      .catch(() => { /* the system font draws the words instead */ });
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
      if (phaseRef.current === "playing" || phaseRef.current === "calib") return;
      setLevel(shared.level);
      race.current = createRace(shared.seed, 0, shared.level);
      if (scene.current) resetScene(scene.current, race.current);
      setResult(null);
      setPhase("ready");
    };
    readFriend();
    setSite(window.location.host);
    setLag(readLag());
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);

  // The right-hand pill: the friend's time to beat, or this phone's best.
  useEffect(() => {
    if (!scene.current) return;
    setSideText(scene.current, friend ? `${friend.name || "বন্ধু"} ${secs(friend.tenths)}` : best !== null ? `সেরা ${secs(best)}` : "");
    drawRef.current();
  });

  // Once this phone's races are read, an untouched ready screen opens the furthest race not yet won (a friend's link keeps theirs).
  useEffect(() => {
    if (!levels.loaded || friend || phaseRef.current !== "ready" || (race.current?.t ?? 0) > 0) return;
    ready(openingLevel(levels.stars, levels.unlocked));
  }, [levels.loaded]);

  // The rushing water never outlives the race: pause, finish, calibration and leaving the page all stop it.
  useEffect(() => { if (phase !== "playing") stopRush(); }, [phase]);
  useEffect(() => stopRush, []);

  // Scrolling the river away mid-race pauses it.
  useEffect(() => { if (!stageInView) pause(); }, [stageInView]);

  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.altKey || event.ctrlKey || event.metaKey || !stageInView) return;
      const key = event.key;
      const towards = key === "ArrowLeft" || key === "a" || key === "A" ? -1 : key === "ArrowRight" || key === "d" || key === "D" ? 1 : 0;
      if (towards && (phase === "ready" || phase === "playing")) { event.preventDefault(); if (!event.repeat) side(towards); return; }
      const drumKey = key === " " || key === "Enter" || key === "ArrowUp" || key === "w" || key === "W";
      if (phase === "playing" || phase === "calib") {
        if (drumKey) { event.preventDefault(); if (!event.repeat) beat(); }
        else if (phase === "playing" && (key === "p" || key === "P" || key === "Escape")) { event.preventDefault(); pause(); }
        return;
      }
      if (key !== " " && key !== "Enter") return;
      if (event.target instanceof HTMLElement && event.target.closest("button, a, summary")) return;
      event.preventDefault();
      if (phase === "ready") start();
      else if (phase === "paused") resume();
      else if (phase === "over") primary();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // "আরেকবার" takes focus a moment after the finish, so a last drum tap doesn't restart at once.
  useEffect(() => {
    if (phase !== "over") return;
    const timer = window.setTimeout(() => again.current?.focus({ preventScroll: true }), 600);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("বাইচের নৌকা সেকেন্ডে ১ম ২য় ৩য় ৪র্থ মাঝির হাত পাকা ০১২৩৪৫৬৭৮৯.").then(() => {
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
    const box = event.currentTarget.getBoundingClientRect(), at = (event.clientX - box.left) / box.width;
    if (phase === "calib") beat();
    else if (at < 0.36) side(-1);
    else if (at > 0.64) side(1);
    else beat();
  }
  // The pad answers on touch-down for speed; a keyboard "click" (detail 0) still works.
  const press = (action: () => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button <= 0) action(); },
    onClick: (event: { detail: number }) => { if (event.detail === 0) action(); },
  });
  const keepTap = (event: ReactPointerEvent) => event.stopPropagation();
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const goToCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  function playFromCard() {
    ready(next || (result?.level ?? level));
    stage.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }
  function pickLevel(at: number) {
    if (phase === "playing" || phase === "calib") return;
    ready(at);
    stage.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  const friendName = friend?.name || "";
  const whose = friendName ? possessive(friendName) : "বন্ধুর";
  const live = phase === "playing" || phase === "calib";

  return (
    <div className="bn">
      {friend && (
        <section className="bn-friend" aria-labelledby="bn-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${whose} কার্ড: ${resultLine(friend)}`} />
          <div>
            <h2 id="bn-friend-title">{banner(friend)}</h2>
            <p>{whose} নিজের ফোনের সময়। একই কচুরিপানা, একই নৌকা, একই ঢোলের তাল।</p>
          </div>
        </section>
      )}

      <p className="bn-level"><b>বাইচ {bn(level)}</b> <span aria-label={`মোট ${bn(total)}টা তারা, ${bn(LEVEL_COUNT * 3)}টার মধ্যে`}>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
      <div className="bn-stage" ref={stage} data-phase={phase} onPointerDown={onStageDown}>
        <canvas ref={canvas} role="img" aria-label="ওপর থেকে দেখা নদীতে নৌকাবাইচ। মাঝের লেনে তোমার নীল-হলুদ লম্বা নৌকা, পাশে লাল, সবুজ আর হলুদ তিনটা নৌকা, দুই পাড়ে লোকের ভিড়। নৌকার মাঝখানে ঢোলের চারপাশে একটা বৃত্ত ছোট হয়ে ঢোলে মিললে চাপতে হয়। নদীর বাঁ পাশে চাপলে এক লেন বাঁয়ে, ডান পাশে চাপলে ডানে। কিবোর্ডে বাঁ-ডান তীর, স্পেসে ঢোল।" />
        {phase === "ready" && (
          <div className="bn-overlay bn-ready">
            <p className="bn-how">ঢোলের তালে চাপো, নৌকা ছুটবে!</p>
            <p className="bn-sub">বৃত্ত ঢোলে মিললেই মাঝখানে চাপো<br />কচুরিপানা দেখলে বাঁয়ে-ডানে সরো</p>
            <p className="bn-goal">বাইচ {bn(level)} · ১ম হলে ৩ তারা</p>
            <button type="button" className="kit-primary bn-go" onPointerDown={keepTap} onClick={() => start()}>শুরু করো</button>
            {calibNote && <p className="bn-sub" role="status">{calibNote}</p>}
            <button type="button" className="bn-calib-link" onPointerDown={keepTap} onClick={startCalib}>{lag ? "তাল মেলানো আছে · আবার মেলাও" : "চাপ দেরিতে ধরে? তাল মেলাও"}</button>
          </div>
        )}
        {phase === "calib" && (
          <div className="bn-overlay bn-ready" role="status">
            <p className="bn-how">তাল মেলাও</p>
            <p className="bn-sub">ঢোলের চারপাশের বৃত্তটা ঢোলে মিললেই মাঝের বোতাম চাপো। ৮ বার বাজবে।</p>
            <button type="button" className="bn-calib-link" onPointerDown={keepTap} onClick={() => endCalib(true)}>বাদ দাও</button>
          </div>
        )}
        {phase === "paused" && (
          <div className="bn-overlay bn-dim">
            <p className="bn-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary bn-go" onPointerDown={keepTap} onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `ঘাটে পৌঁছেছ। ${ordinal(result.rank)} হলে, ${secs(result.tenths)} সেকেন্ডে।` : ""}</p>
        {phase === "over" && result && (
          <div className="bn-overlay bn-finish">
            <p className="bn-kicker">{result.rank === 1 ? "সবার আগে ঘাটে!" : "ঘাটে পৌঁছে গেছ!"}</p>
            <p className="bn-headline">{ordinal(result.rank)} হলে, {secs(result.tenths)} সেকেন্ডে</p>
          </div>
        )}
      </div>

      {phase === "over" && result ? (
        <div className="bn-over">
          {result.stars > 0 && <StarReveal count={result.stars} />}
          <p className="bn-score"><b>{secs(result.tenths)} সেকেন্ড · {ordinal(result.rank)}</b><span>{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা: ${secs(best)} সে` : ""}</span></p>
          <p className="bn-detail">{bn(result.beats)}টা তালের {bn(result.hits)}টা ধরেছ{result.snags ? ` · কচুরিপানায় ${bn(result.snags)} বার` : " · কচুরিপানা ছোঁয়নি!"}</p>
          {nearMiss(result.rank, result.behind, result.tenths, result.bestBefore) && <p className="bn-near">{nearMiss(result.rank, result.behind, result.tenths, result.bestBefore)}</p>}
          {friend && <p className="bn-versus">{compareLine(result.tenths, friend.tenths, friendName)}</p>}
          <div className="bn-over-actions">
            <button type="button" ref={again} className="kit-primary bn-again" onClick={primary}>{next ? "পরের বাইচ" : "আরেকবার"}</button>
            {next ? <button type="button" className="bn-to-card" onClick={restart}>আবার খেলো</button>
              : <button type="button" className="bn-to-card" onClick={goToCard}>ছবি বানাও ↓</button>}
          </div>
          {next ? <button type="button" className="kit-link bn-card-link" onClick={goToCard}>ছবি বানাও ↓</button> : null}
        </div>
      ) : (
        <div className="bn-pad" aria-label="নৌকা চালানোর বোতাম">
          <button type="button" className="bn-side" aria-label="এক লেন বাঁয়ে" disabled={phase === "paused" || phase === "calib"} {...press(() => side(-1))}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>বাঁয়ে
          </button>
          <button type="button" ref={drum} className="bn-drum" aria-label="ঢোলের তালে চাপো" disabled={phase === "paused"} {...press(beat)}>
            <i aria-hidden="true" /><span>{live ? "তালে চাপো" : "শুরু করো"}</span>
          </button>
          <button type="button" className="bn-side" aria-label="এক লেন ডানে" disabled={phase === "paused" || phase === "calib"} {...press(() => side(1))}>
            ডানে<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>
      )}

      <div className="bn-bar">
        <button type="button" className="bn-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <i aria-hidden="true" />ধীরে খেলো
        </button>
        <SoundToggle compact className="bn-sound" onChange={on => { if (on && phaseRef.current === "playing") startRush(); else if (!on) rush.current = null; }} />
        <button type="button" className="bn-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>

      <details className="bn-levels">
        <summary>সব বাইচ <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>প্রতি বাইচে পাশের তিন নৌকা আগেরটার চেয়ে জোরে চলে। ১ম হলে ৩ তারা, ২য় হলে ২, ৩য় হলে ১। ৩য় হলেই পরের বাইচ খোলে।</p>
        <LevelGrid count={LEVEL_COUNT} noun="বাইচ" stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={pickLevel} />
      </details>

      {card && result && (
        <section className="bn-result" id="result" ref={resultBox} aria-labelledby="bn-result-title">
          <div className="bn-result-head">
            <h2 id="bn-result-title">ঘাটে পৌঁছেছ: <em>{resultLine(card)}</em></h2>
            <p>{friend ? `${compareLine(card.tenths, friend.tenths, friendName)} ${humanLine(card.rank)}` : humanLine(card.rank)}</p>
          </div>
          <div className="bn-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bn-card-summary" />
              <figcaption id="bn-card-summary" className="bn-sr">বাইচের নৌকা{card.name && ` · ${card.name}`}: {resultLine(card)}। {humanLine(card.rank)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bn-controls">
              <label className="bn-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="baicher-nouka.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই নদীটাই পাবে: একই কচুরিপানা, একই নৌকা, একই তাল।" />
              <button type="button" className="kit-link bn-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
