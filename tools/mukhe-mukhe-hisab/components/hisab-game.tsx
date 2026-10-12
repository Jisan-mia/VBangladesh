"use client";
// IP: what we avoided — no TV quiz-show or brain-training app look, names, timers or sounds; no real shop, brand or banknote; prices are rough and made up. Our own ledger page, pad, levels and cash-box sound.

import { useEffect, useMemo, useRef, useState } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, hiss, newSeed, sfx, shake, tone, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  answerRun, comboOf, digitCount, pointsFor, freshRun, levelOf, makeQuestions, readTyped, startLevel, starsOf, LEVEL_COUNT, ROUND_SECONDS, SLOW_SECONDS, type Run,
} from "../lib/game";
import { worldOf, WORLDS } from "../lib/levels";
import { bn, caption, compareLine, feat, humanLine, nearLine, parseShared, sharedHash, type Shared } from "../lib/link";

const TOOL = "mukhe-mukhe-hisab";
type Phase = "ready" | "playing" | "over";
const PAD = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

// ---- sounds ----
/** The signature: the cash box's ক্যাচিং, a drawer click and a bell. */
const ching = () => { hiss(0.05, 0.06, 5200, "highpass"); tone(2093, 0.08, 0.06, "triangle", 0.02); tone(2637, 0.3, 0.05, "sine", 0.07); buzz(10); };
/** A soft "উঁহু". */
const softWrong = () => { tone(262, 0.18, 0.07, "sine", 0, 196); buzz(25); };
/** Time's up: one round bell. */
const bell = () => { tone(784, 0.6, 0.08, "sine"); tone(392, 0.7, 0.05, "triangle", 0.02); };
/** The drawer sliding open at the start. */
const drawer = () => { hiss(0.14, 0.07, 2600, "bandpass"); ching(); };

export function HisabGame() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(1);
  const [phase, setPhase] = useState<Phase>("ready");
  const [run, setRun] = useState<Run>(freshRun);
  const [typed, setTyped] = useState("");
  const [miss, setMiss] = useState<{ typed: string; answer: number } | null>(null);
  const [gain, setGain] = useState<{ points: number; key: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [record, setRecord] = useState<number | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const play = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const clock = useRef({ endAt: 0, remaining: 0, ticked: 0 });
  const finished = useRef("");
  const opened = useRef(false);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`);
  const playInView = useInView(play);

  const questions = useMemo(() => makeQuestions(level, seed), [level, seed]);
  const spec = levelOf(level);
  const seconds = slow ? SLOW_SECONDS : ROUND_SECONDS;
  const shown = questions[miss ? run.index - 1 : run.index];
  const done = phase === "over";
  const stars = done ? starsOf(level, run.right) : 0;
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = done ? { seed, level, right: run.right, score: run.score, name } : null;
  const state = shared ? sharedHash(shared) : "";

  // ---- timing ----
  function later(ms: number, then: () => void) { timers.current.push(window.setTimeout(then, ms)); }
  function stopAll() { timers.current.forEach(clearTimeout); timers.current = []; }

  function startClock(ms: number) {
    stopAll();
    clock.current.endAt = performance.now() + ms;
    const meter = window.setInterval(() => {
      const rest = clock.current.endAt - performance.now(), whole = Math.max(0, Math.ceil(rest / 1000));
      setLeft(whole);
      if (whole <= 5 && whole > 0 && whole !== clock.current.ticked) { clock.current.ticked = whole; sfx.tick(); }
      if (rest <= 0) { stopAll(); setMiss(null); setPhase("over"); bell(); }
    }, 100);
    timers.current.push(meter);
  }

  function start() {
    if (phase !== "ready" || paused) return;
    drawer();
    clock.current.ticked = 0;
    setPhase("playing");
    startClock(seconds * 1000);
  }

  /** A fresh round for a level: `go` starts at once (from আরেকবার or পরের লেভেল), otherwise it waits for শুরু করো. */
  function goTo(next: number, nextSeed = newSeed(), go = false) {
    if (next < 1 || next > LEVEL_COUNT) return;
    stopAll();
    setLevel(next); setSeed(nextSeed); setRun(freshRun()); setTyped(""); setMiss(null); setGain(null);
    setPaused(false); setRecord(null); setLeft(seconds);
    if (go) { drawer(); clock.current.ticked = 0; setPhase("playing"); startClock(seconds * 1000); }
    else setPhase("ready");
  }

  function submit(text: string) {
    const value = readTyped(text);
    if (value === null || phase !== "playing" || paused || miss) return;
    const right = value === shown.answer, after = answerRun(run, right);
    setRun(after);
    setTyped("");
    if (right) {
      ching();
      if (after.streak >= 2) sfx.combo(after.streak - 2);
      if (after.streak > 1 && pointsFor(after.streak) > pointsFor(after.streak - 1)) sfx.coin();
      setGain({ points: after.score - run.score, key: after.index });
    } else {
      softWrong();
      shake(play.current);
      setMiss({ typed: text, answer: shown.answer });
      later(slow ? 1200 : 800, () => setMiss(null));
    }
  }

  function press(digit: string) {
    if (phase !== "playing" || paused || miss) return;
    sfx.tap();
    const next = (typed + digit).slice(0, 3);
    if (next.length >= digitCount(shown.answer)) submit(next);
    else setTyped(next);
  }

  function erase() {
    if (phase !== "playing" || paused || miss || !typed) return;
    sfx.tap();
    setTyped(typed.slice(0, -1));
  }

  function resume() {
    if (!paused) return;
    setPaused(false);
    if (phase === "playing") startClock(clock.current.remaining);
  }

  // ---- the end of a round: save once, the stars pop in (StarReveal), then a cheer for a real win ----
  useEffect(() => {
    const key = `${level}:${seed}`;
    if (!done || finished.current === key) return;
    finished.current = key;
    const earned = starsOf(level, run.right);
    const beaten = earned > 0 && best !== null && run.score > best;
    if (earned) { levels.record(level, earned); submitBest(run.score); }
    setRecord(beaten ? best : null);
    const cheer = 260 * (earned + 1) + 500;
    if (earned === 3 || beaten) later(cheer, () => { sfx.win(); confetti({ colors: ["#1d5c8a", "#d0463b", "#f2a900", "#fbf6e9", "#2f9e5b"] }); });
    else if (earned) later(cheer, sfx.good);
  }, [done]);

  // After useLevels has read this phone's stars: open a friend's level, or where the player left off.
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    setSite(window.location.host);
    const readFriend = () => {
      const read = parseShared(window.location.hash);
      if (!read) return false;
      setFriend(read);
      goTo(read.level, read.seed);
      return true;
    };
    if (!readFriend()) goTo(startLevel(levels.stars, levels.unlocked));
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, [levels.loaded]);

  // Pause when the tab is hidden; the sum is covered meanwhile, so a pause never buys thinking time.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    const hide = () => {
      if (!document.hidden || phaseRef.current !== "playing") return;
      clock.current.remaining = Math.max(0, clock.current.endAt - performance.now());
      stopAll();
      setMiss(null);
      setPaused(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); stopAll(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("মুখে মুখে হিসাব ২৩টা হিসাব মিলিয়েছে").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws.
  }, [state, format, site, friend]);

  // ---- keyboard: digits answer, Backspace erases, Enter starts, submits, plays again ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !playInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const bangla = "০১২৩৪৫৬৭৮৯".indexOf(event.key), digit = bangla >= 0 ? bangla : /^[0-9]$/.test(event.key) ? Number(event.key) : -1;
    if (phase === "playing" && digit >= 0) {
      event.preventDefault();
      if (shown.choices) { if (digit >= 1 && digit <= 4) submit(String(shown.choices[digit - 1])); }
      else press(bn(digit));
      return;
    }
    if (phase === "playing" && event.key === "Backspace") { event.preventDefault(); erase(); return; }
    if ((event.key !== " " && event.key !== "Enter") || element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (paused) resume();
    else if (phase === "ready") start();
    else if (phase === "playing") submit(typed);
    else goTo(stars && level < LEVEL_COUNT ? level + 1 : level, undefined, true);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFrom(next: number) {
    goTo(next);
    play.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  const total = totalStars(levels.stars);
  const slots = digitCount(shown.answer);
  const urgent = phase === "playing" && left <= 10;
  const combo = comboOf(run.streak);
  const near = done ? nearLine(level, run.right) : "";

  return (
    <div className="mh" data-calm={slow}>
      {friend && (
        <section className="mh-friend" aria-labelledby="mh-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="mh-friend-title">{feat(friend)}, {bn(friend.score)} পয়েন্ট।</h2>
            <p>একই হিসাব, এবার তোমার পালা। স্কোরটা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের।</p>
          </div>
        </section>
      )}

      <div className="mh-bar">
        <button type="button" className="mh-step" onClick={() => goTo(level - 1)} disabled={level <= 1 || phase === "playing"} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="mh-level"><b>লেভেল {bn(level)}</b><span>{spec.label}</span></p>
        <button type="button" className="mh-step" onClick={() => goTo(level + 1)} disabled={level >= open || level >= LEVEL_COUNT || phase === "playing"} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="mh-meter" data-urgent={urgent}>
        <div className="mh-timer" aria-hidden="true">
          <i key={`${seed}-${phase}`} data-on={phase === "playing"} data-paused={paused} style={{ animationDuration: `${seconds}s` }} />
        </div>
        <span className="mh-left" aria-label={`${bn(left)} সেকেন্ড বাকি`}>{bn(left)}<small>সে.</small></span>
      </div>

      {done ? (
        <div className="mh-over" role="status">
          <p className="mh-over-score">{bn(run.right)}টা মিলেছে <em>· {bn(run.score)} পয়েন্ট</em></p>
          <StarReveal count={stars} />
          <p className="mh-over-line">
            {rival ? compareLine(run, rival)
              : record !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(record)} পয়েন্ট।`
              : humanLine(level, run.right)}
            {!rival && record === null && best !== null && stars > 0 && best > run.score && <> এই লেভেলে তোমার সেরা {bn(best)}।</>}
          </p>
          {near && <p className="mh-over-near">{near}</p>}
          {run.bestStreak >= 5 && <p className="mh-over-streak">একটানা সবচেয়ে বেশি {bn(run.bestStreak)}টা ঠিক।</p>}
          <div className="mh-over-actions" data-single={!stars || level >= LEVEL_COUNT}>
            {stars ? <>
              <button type="button" className="kit-secondary" onClick={() => goTo(level, undefined, true)}>আবার খেলো</button>
              {level < LEVEL_COUNT
                ? <button type="button" className="kit-primary" onClick={() => goTo(level + 1, undefined, true)}>পরের লেভেল</button>
                : <p className="mh-all">৩০টা লেভেলই শেষ!</p>}
            </> : <button type="button" className="kit-primary" onClick={() => goTo(level, undefined, true)}>আরেকবার</button>}
          </div>
          <button type="button" className="kit-link mh-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <div className="mh-play" ref={play}>
          <div className="mh-page" data-bazar={shown.bazar} data-miss={Boolean(miss)}>
            <div className="mh-score" aria-live="off">
              <span>ঠিক <b>{bn(run.right)}</b></span>
              <span className="mh-combo" data-on={combo > 1}>{run.streak >= 2 ? `টানা ${bn(run.streak)}` : ""}{combo > 1 ? ` · ×${bn(combo)}` : ""}</span>
              <span>পয়েন্ট <b>{bn(run.score)}</b></span>
              {gain && <i key={gain.key} className="mh-gain" aria-hidden="true">+{bn(gain.points)}</i>}
            </div>
            <div className="mh-sum" aria-live="polite" aria-atomic="true">
              {shown.lines.map((line, index) => <p key={index} className="mh-line">{line}{!shown.bazar && <span className="mh-eq"> =</span>}</p>)}
              {shown.ask && <p className="mh-ask">{shown.ask}</p>}
            </div>
            {shown.choices ? (
              <p className="mh-slots" aria-hidden="true"><span data-state={miss ? "right" : ""}>{miss ? bn(miss.answer) : "?"}</span></p>
            ) : (
              <p className="mh-slots" aria-label={miss ? `ঠিক উত্তর ${bn(miss.answer)}` : `${bn(slots)} অঙ্কের উত্তর${typed ? `, লেখা হয়েছে ${typed}` : ""}`}>
                {miss
                  ? [...bn(miss.answer)].map((d, index) => <span key={index} data-state="right">{d}</span>)
                  : Array.from({ length: slots }, (_, index) => <span key={index} data-state={typed[index] ? "typed" : index === typed.length ? "now" : ""}>{typed[index] ?? ""}</span>)}
                {shown.bazar && <small> টাকা</small>}
              </p>
            )}
            {miss && <p className="mh-miss" role="status">উঁহু, {miss.typed ? <s>{[...miss.typed].map(d => /\d/.test(d) ? bn(Number(d)) : d).join("")}</s> : null} না, {bn(miss.answer)}</p>}
            {(phase === "ready" || paused) && (
              <div className="mh-cover">
                {paused ? <>
                  <p>থেমে আছে। তৈরি হলে চাপো।</p>
                  <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
                </> : <>
                  <p>{WORLDS[worldOf(level)]} · {bn(seconds)} সেকেন্ডে যত পারো</p>
                  <button type="button" className="kit-primary" onClick={start}>শুরু করো</button>
                  <small>★ {bn(spec.stars[0])}টা ঠিক হলে পার, {bn(spec.stars[2])}টায় ৩ তারা</small>
                </>}
              </div>
            )}
          </div>

          {shown.choices ? (
            <div className="mh-choices" role="group" aria-label="উত্তর বেছে নাও">
              {shown.choices.map((value, index) => (
                <button key={`${run.index}-${value}`} type="button" className="mh-key mh-choice" disabled={phase !== "playing" || paused || Boolean(miss)}
                  data-mark={miss && value === miss.answer ? "right" : miss && String(value) === miss.typed ? "wrong" : ""}
                  aria-label={phase === "ready" ? undefined : `${bn(index + 1)}. ${bn(value)}`} onClick={() => submit(String(value))}>{phase === "ready" ? "" : bn(value)}</button>
              ))}
            </div>
          ) : (
            <div className="mh-pad" role="group" aria-label="উত্তর লেখো">
              {PAD.map(d => <button key={d} type="button" className="mh-key" disabled={phase !== "playing" || paused} onClick={() => press(d)}>{d}</button>)}
              <button type="button" className="mh-key mh-word" disabled={phase !== "playing" || paused || !typed} onClick={erase}>মুছো</button>
              <button type="button" className="mh-key" disabled={phase !== "playing" || paused} onClick={() => press("০")}>০</button>
              <button type="button" className="mh-key mh-word mh-ok" disabled={phase !== "playing" || paused || !typed} onClick={() => submit(typed)}>ঠিক আছে</button>
            </div>
          )}

          <div className="mh-tools">
            <span className="mh-goal">★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span>
            <button type="button" className="mh-tool" aria-pressed={slow} disabled={phase === "playing"} onClick={() => { setSlow(!slow); setLeft(slow ? ROUND_SECONDS : SLOW_SECONDS); }}>ধীরে খেলো</button>
            <SoundToggle compact className="mh-sound" />
          </div>
        </div>
      )}

      <details className="mh-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>১–১০ ছোটদের হিসাব: চারটা উত্তর থেকে বেছে নাও। ১১–২০ দোকানের খাতা: নিজে লেখো। ২১–৩০ বাজারের হিসাব: দাম আনুমানিক, খেলার জন্য।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={playFrom} />
      </details>

      {shared && (
        <section className="mh-result" id="result" ref={resultBox} aria-labelledby="mh-result-title">
          <h2 id="mh-result-title"><em>লেভেল {bn(level)}</em> {bn(run.right)}টা হিসাব মিলেছে</h2>
          <p>{rival ? compareLine(run, rival) : humanLine(level, run.right)}</p>
          <div className="mh-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="mh-card-summary" />
              <figcaption id="mh-card-summary" className="mh-sr">কার্ড: লেভেল {bn(level)}, {bn(run.right)}টা মিলেছে, {bn(run.score)} পয়েন্ট, {bn(stars)} তারা। {humanLine(level, run.right)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="mh-share">
              <label className="mh-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`mukhe-mukhe-hisab-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`}
                caption={caption(level, run.right, run.score)} state={state}
                hint="বন্ধু লিংক খুললে একই হিসাবগুলো একই ক্রমে পাবে। স্কোরটা তোমার ফোনে খেলা, লিংকে সেভাবেই লেখা থাকে।"
              />
              <button type="button" className="kit-link mh-again-link" onClick={() => playFrom(stars && level < LEVEL_COUNT ? level + 1 : level)}>{stars && level < LEVEL_COUNT ? "পরের লেভেল খেলো" : "আবার খেলো"}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
