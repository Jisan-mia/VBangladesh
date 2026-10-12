"use client";
// IP: what we avoided — no brand names, logos or real packaging on any item (plain shapes: a jute sack, a glass jar, a tin, a tied bag), no TV quiz-show look or music; our own shop, shopkeeper, levels and sounds. The "what's missing" party game itself is old and free.

import { useEffect, useMemo, useRef, useState } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, fitCanvas, hiss, loop, newSeed, sfx, tone, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawItem, drawShelf } from "../lib/art";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { levelOf, makeLevel, resultOf, rightFromScore, startLevel, starsOf, LEVEL_COUNT, ROUNDS, type Answer } from "../lib/game";
import { itemName, type ItemId } from "../lib/items";
import { worldOf, WORLDS } from "../lib/levels";
import { bn, caption, clearLine, compareLine, feat, humanLine, nearLine, parseShared, rightOf, sharedHash, type Shared } from "../lib/link";

const TOOL = "konta-nei";
type Phase = "ready" | "look" | "ask" | "reveal" | "over";
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

// ---- sounds ----
/** The signature: the cash box's টুং-টাং, a step higher with every answer in a row. */
const ding = (streak: number) => {
  const lift = 2 ** ((Math.min(Math.max(streak, 1), 7) - 1) * 2 / 12);
  tone(1568 * lift, 0.08, 0.07, "triangle"); tone(2093 * lift, 0.24, 0.06, "sine", 0.07); hiss(0.05, 0.04, 6000, "highpass", 0.03); buzz(10);
};
/** A soft "উঁহু". */
const softWrong = () => { tone(262, 0.18, 0.07, "sine", 0, 196); buzz(25); };
/** Eyes closing: a quick breath of air. */
const blink = () => { hiss(0.28, 0.1, 1400, "bandpass"); tone(420, 0.2, 0.025, "sine", 0, 260); };
/** The tin shutter rolling up. */
const shutter = () => { for (let i = 0; i < 6; i++) hiss(0.045, 0.07, 2600 + i * 200, "bandpass", i * 0.045); tone(150, 0.3, 0.04, "square", 0, 110); };

/** One choice's picture. */
function ItemArt({ id }: { id: ItemId }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvas.current) { const c = fitCanvas(canvas.current, 60, 52); c.clearRect(0, 0, 60, 52); drawItem(c, id, 30, 50, 46); } }, [id]);
  return <canvas ref={canvas} width={60} height={52} aria-hidden="true" />;
}

export function KontaGame() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [lids, setLids] = useState(false);
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState(0);
  const [streak, setStreak] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [record, setRecord] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const [fonts, setFonts] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const shelfCanvas = useRef<HTMLCanvasElement>(null);
  const choiceBox = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const hum = useRef<ReturnType<typeof loop> | null>(null);
  const clock = useRef({ askStart: 0, askSpent: 0, lookStart: 0, lookMs: 0 });
  const finished = useRef("");
  const opened = useRef(false);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`);
  const stageInView = useInView(stage);

  const rounds = useMemo(() => makeLevel(level, seed), [level, seed]);
  const spec = levelOf(level);
  const current = rounds[round];
  const answer = answers[round] ?? null;
  const done = phase === "over";
  const result = useMemo(() => resultOf(level, rounds, answers), [level, rounds, answers]);
  const stars = done ? starsOf(result.right, result.score) : 0;
  const missed = answers.flatMap((a, index) => a.pick === rounds[index].missing ? [] : [rounds[index].missing]);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = done ? { seed, level, score: result.score, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const card: CardData | null = shared ? { ...shared, right: result.right, missed } : null;
  const lookSeconds = spec.view * (slow ? 1.5 : 1);

  // ---- timing ----
  function later(ms: number, run: () => void) { timers.current.push(window.setTimeout(run, ms)); }
  function stopAll() {
    timers.current.forEach(clearTimeout); timers.current = [];
    hum.current?.stop(); hum.current = null;
  }
  function startHum(progress: number) {
    hum.current?.stop();
    hum.current = loop("hum", 110 + progress * 110);
    hum.current.set(0.16);
  }

  /** Close the eyes, change what's behind them, open them. */
  function closeEyes(then: () => void) {
    setLids(true);
    blink();
    later(slow ? 520 : 380, () => { then(); later(60, () => setLids(false)); });
  }

  /** The looking time: a draining bar, a hum that climbs as time runs out, ticks in the last three seconds. */
  function startLook(seconds: number) {
    stopAll();
    setPhase("look");
    setLids(false);
    const ms = seconds * 1000;
    clock.current.lookStart = performance.now(); clock.current.lookMs = ms;
    setLeft(Math.ceil(seconds));
    startHum(0);
    for (let s = 3; s >= 1; s--) if (ms - s * 1000 > 0) later(ms - s * 1000, sfx.tick);
    const meter = window.setInterval(() => {
      const spent = performance.now() - clock.current.lookStart;
      setLeft(Math.max(0, Math.ceil((ms - spent) / 1000)));
      hum.current?.pitch(110 + Math.min(1, spent / ms) * 110);
    }, 250);
    timers.current.push(meter);
    later(ms, () => {
      clearInterval(meter);
      hum.current?.stop(); hum.current = null;
      closeEyes(() => { setPhase("ask"); clock.current.askStart = performance.now(); clock.current.askSpent = 0; });
    });
  }

  function start() {
    if (phase !== "ready") return;
    shutter();
    startLook(lookSeconds);
  }

  /** A fresh shelf for a level. `go` starts looking straight away (behind a blink); otherwise the shutter waits for a tap. */
  function goTo(next: number, nextSeed = newSeed(), go = false) {
    if (next < 1 || next > LEVEL_COUNT) return;
    stopAll();
    const reset = () => {
      setLevel(next); setSeed(nextSeed); setRound(0); setAnswers([]); setPaused(false); setRecord(null);
      if (go) startLook(levelOf(next).view * (slow ? 1.5 : 1));
      else { setPhase("ready"); setLids(false); }
    };
    if (go) closeEyes(reset); else reset();
  }

  function choose(id: ItemId, button?: HTMLElement | null) {
    if (phase !== "ask" || paused || lids) return;
    const ms = Math.round(clock.current.askSpent + performance.now() - clock.current.askStart);
    const right = id === current.missing;
    if (right) { ding(streak + 1); setStreak(streak + 1); }
    else {
      softWrong(); setStreak(0);
      if (!slow && button) button.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
    }
    setAnswers([...answers, { pick: id, ms }]);
    setPhase(round === ROUNDS - 1 ? "over" : "reveal");
  }

  function nextRound() {
    if (phase !== "reveal") return;
    closeEyes(() => { setRound(round + 1); startLook(lookSeconds); });
  }

  function resume() {
    if (!paused) return;
    setPaused(false);
    if (phase === "look") startLook(lookSeconds);
    else clock.current.askStart = performance.now();
  }

  // ---- the end of a level: save once, then the stars pop in (StarReveal), then a cheer for a real win ----
  useEffect(() => {
    const key = `${level}:${seed}`;
    if (!done || finished.current === key) return;
    finished.current = key;
    const earned = starsOf(result.right, result.score);
    const beaten = earned > 0 && best !== null && result.score > best;
    if (earned) { levels.record(level, earned); submitBest(result.score); }
    setRecord(beaten ? best : null);
    const cheer = 260 * (earned + 1) + 150;
    if (earned === 3 || beaten) later(cheer, () => { sfx.win(); confetti({ colors: ["#c8402e", "#f2b51c", "#3d6e70", "#f5efe0", "#2f9e5b"] }); });
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

  // Pause when the tab is hidden. Looking starts over on return (the shelf is hidden meanwhile), so a pause never buys time.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useEffect(() => {
    const hide = () => {
      if (!document.hidden) return;
      const now = phaseRef.current;
      if (now === "look") { stopAll(); setLids(false); setPaused(true); }
      else if (now === "ask") { clock.current.askSpent += performance.now() - clock.current.askStart; setPaused(true); }
    };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); stopAll(); };
  }, []);

  // The shelf canvas follows the box width; fonts first, so the price tags read right.
  useEffect(() => {
    const box = stage.current;
    if (!box) return;
    const watch = new ResizeObserver(() => setWidth(Math.round(box.clientWidth)));
    watch.observe(box);
    loadCardFonts("চাল ডাল তেল লবণ গুঁড়া দুধ").catch(() => {}).finally(() => setFonts(true));
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const canvas = shelfCanvas.current;
    if (!canvas || !width) return;
    const height = width, c = fitCanvas(canvas, width, height);
    const asking = phase === "ask";
    const last = answers[round];
    drawShelf(c, width, height, {
      items: asking ? current.after : current.shelf,
      base: spec.count,
      world: worldOf(level),
      keeper: asking ? "back" : "front",
      mark: (phase === "reveal" || phase === "over") && last ? { slot: current.slot, good: last.pick === current.missing } : null,
    });
  }, [width, fonts, phase, current, level, answers, round, spec.count]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("কোনটা নেই? রাফি ৩টায় ৩টা ধরেছে").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { ...friend, right: rightFromScore(friend.score) }, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws.
  }, [state, format, site, friend]);

  // ---- keyboard: 1–6 answer; Enter or space starts, moves on, plays again ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !stageInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const digit = "১২৩৪৫৬".indexOf(event.key) >= 0 ? "১২৩৪৫৬".indexOf(event.key) : Number(event.key) - 1;
    if (phase === "ask" && digit >= 0 && digit < current.choices.length) {
      event.preventDefault();
      choose(current.choices[digit], choiceBox.current?.querySelectorAll("button")[digit]);
      return;
    }
    if ((event.key !== " " && event.key !== "Enter") || element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (paused) resume();
    else if (phase === "ready") start();
    else if (phase === "reveal") nextRound();
    else if (phase === "over") goTo(stars && level < LEVEL_COUNT ? level + 1 : level, undefined, true);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFrom(next: number) {
    goTo(next);
    stage.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function status() {
    if (phase === "ready") return "তাকের জিনিসগুলো দেখে রাখো। মামা একটা সরাবে, তুমি বলবে কোনটা নেই।";
    if (phase === "look") return `দেখে রাখো… ${bn(left)}`;
    if (phase === "ask") {
      const hint = spec.twist === "move" ? "বাকিগুলোও সরেছে।" : spec.twist === "swap" ? "নতুন একটা ঢুকেছে, ওটা নয়।" : "";
      return <>কোনটা নেই?{hint && <small> {hint}</small>}</>;
    }
    if (!answer) return "";
    const gone = itemName(current.missing);
    if (answer.pick === current.missing) return `ঠিক! মামা ${gone} সরিয়েছিল।${streak >= 2 ? ` টানা ${bn(streak)}টা ঠিক।` : ""}`;
    const wrong = itemName(answer.pick);
    return `উঁহু, মামা ${gone} সরিয়েছিল। ${wrong} ${current.shelf.includes(answer.pick) ? "তো তাকেই আছে।" : "তাকে ছিলই না।"}`;
  }

  const total = totalStars(levels.stars);
  const showChoices = phase === "ask" || phase === "reveal";

  return (
    <div className="kn" data-calm={slow} data-rows={spec.choices > 4 ? 2 : 1}>
      {friend && (
        <section className="kn-friend" aria-labelledby="kn-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="kn-friend-title">{feat(friend)}।</h2>
            <p>একই তিনটা তাক, এবার তোমার পালা। স্কোরটা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের।</p>
          </div>
        </section>
      )}

      <div className="kn-bar">
        <button type="button" className="kn-step" onClick={() => goTo(level - 1)} disabled={level <= 1} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="kn-level"><b>লেভেল {bn(level)}</b><span>{WORLDS[worldOf(level)]} · {bn(spec.count)}টা জিনিস</span></p>
        <button type="button" className="kn-step" onClick={() => goTo(level + 1)} disabled={level >= open || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <ol className="kn-pips" aria-label={`তাক ${bn(Math.min(round + 1, ROUNDS))}, মোট ${bn(ROUNDS)}টা`}>
          {rounds.map((r, index) => {
            const a = answers[index];
            return <li key={index} data-state={a ? (a.pick === r.missing ? "right" : "wrong") : index === round ? "now" : ""}>{a ? (a.pick === r.missing ? "✓" : "✗") : ""}</li>;
          })}
        </ol>
      </div>

      <div className="kn-timer" data-on={phase === "look" && !paused} aria-hidden="true">
        <i key={`${seed}-${round}-${phase === "look" && !paused}`} style={{ animationDuration: `${lookSeconds}s` }} />
      </div>

      <div className="kn-stage" ref={stage} data-phase={phase}>
        <canvas ref={shelfCanvas} role="img" aria-label={
          phase === "ask" ? `তাক, একটা জিনিস নেই: ${current.after.filter(Boolean).map(id => itemName(id!)).join(", ")}।`
          : phase === "ready" ? "দোকানের ঝাঁপ বন্ধ।"
          : `তাকে আছে: ${current.shelf.map(itemName).join(", ")}।`} />
        <div className="kn-lid kn-top" data-shut={lids} aria-hidden="true" />
        <div className="kn-lid kn-bottom" data-shut={lids} aria-hidden="true"><span>চোখ বন্ধ…</span></div>
        <div className="kn-shutter" data-down={phase === "ready" || paused}>
          {paused ? (
            <div className="kn-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          ) : phase === "ready" ? (
            <div className="kn-note">
              <p>{bn(spec.count)}টা জিনিস, দেখার সময় {bn(lookSeconds)} সেকেন্ড</p>
              <button type="button" className="kit-primary" onClick={start}>শুরু করো</button>
            </div>
          ) : null}
        </div>
      </div>

      {done ? (
        <div className="kn-over" role="status">
          <p className="kn-over-score">{rightOf(result.right)} ঠিক <em>· স্কোর {bn(result.score)}</em></p>
          <StarReveal count={stars} />
          <p className="kn-over-line">
            {rival ? compareLine(result.score, rival.score, rival.name)
              : record !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(record)}।`
              : stars ? clearLine(spec.count, result.right) : humanLine(result.right, result.score, missed)}
            {!rival && record === null && best !== null && stars > 0 && best > result.score && <> এই লেভেলে তোমার সেরা {bn(best)}।</>}
          </p>
          {stars < 3 && <p className="kn-over-near">{nearLine(result.right, result.score)}</p>}
          <div className="kn-over-actions" data-single={!stars || level >= LEVEL_COUNT}>
            {stars ? <>
              <button type="button" className="kit-secondary" onClick={() => goTo(level, undefined, true)}>আবার খেলো</button>
              {level < LEVEL_COUNT
                ? <button type="button" className="kit-primary" onClick={() => goTo(level + 1, undefined, true)}>পরের লেভেল</button>
                : <p className="kn-all">৩০টা লেভেলই শেষ!</p>}
            </> : <button type="button" className="kit-primary" onClick={() => goTo(level, undefined, true)}>আরেকবার</button>}
          </div>
          <button type="button" className="kit-link kn-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="kn-status" role="status" aria-live="polite" data-phase={phase}>{status()}</p>
          {showChoices ? (
            <div className="kn-choices" ref={choiceBox} data-n={current.choices.length} data-rows={spec.choices > 4 ? 2 : 1} role="group" aria-label="কোনটা নেই? বেছে নাও">
              {current.choices.map((id, index) => {
                const reveal = phase === "reveal";
                const mark = reveal ? id === current.missing ? "right" : id === answer?.pick ? "wrong" : "" : "";
                return (
                  <button key={`${seed}-${round}-${id}`} type="button" className="kn-choice" data-mark={mark} disabled={reveal}
                    aria-label={`${bn(index + 1)}. ${itemName(id)}`} onClick={event => choose(id, event.currentTarget)}>
                    <ItemArt id={id} />
                    <span>{itemName(id)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="kn-wait" data-rows={spec.choices > 4 ? 2 : 1} aria-hidden="true">{phase === "look" ? "চোখ বন্ধ হলে মামা একটা জিনিস সরাবে" : "এক লেভেলে তিনটা তাক। দুটো ঠিক হলে পার।"}</div>
          )}
          <div className="kn-tools">
            {phase === "reveal"
              ? <button type="button" className="kit-primary kn-next" onClick={nextRound}>পরের তাক</button>
              : <span className="kn-goal">★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span>}
            <button type="button" className="kn-tool" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
            <SoundToggle compact className="kn-sound" onChange={on => { if (on && phase === "look" && !paused) startHum(Math.min(1, (performance.now() - clock.current.lookStart) / clock.current.lookMs)); }} />
          </div>
        </>
      )}

      <details className="kn-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>১–১০ পাড়ার দোকান: জায়গা ফাঁকা থাকে। ১১–২০ বাজারের দোকান: বাকিগুলোও সরে। ২১–৩০ হাটের দোকান: নতুন জিনিস এসে বসে।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={playFrom} />
      </details>

      {card && (
        <section className="kn-result" id="result" ref={resultBox} aria-labelledby="kn-result-title">
          <h2 id="kn-result-title"><em>লেভেল {bn(level)}</em> {rightOf(result.right)} ঠিক</h2>
          <p>{rival ? compareLine(result.score, rival.score, rival.name) : humanLine(result.right, result.score, missed)}</p>
          <div className="kn-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="kn-card-summary" />
              <figcaption id="kn-card-summary" className="kn-sr">কার্ড: লেভেল {bn(level)}, {rightOf(result.right)} ঠিক, স্কোর {bn(result.score)}, {bn(stars)} তারা। {humanLine(result.right, result.score, missed)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="kn-share">
              <label className="kn-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`konta-nei-${level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`}
                caption={caption(level, result.right, result.score)} state={state}
                hint="বন্ধু লিংক খুললে একই তিনটা তাক পাবে। স্কোরটা তোমার ফোনে খেলা, লিংকে সেভাবেই লেখা থাকে।"
              />
              <button type="button" className="kit-link kn-again-link" onClick={() => playFrom(stars && level < LEVEL_COUNT ? level + 1 : level)}>{stars && level < LEVEL_COUNT ? "পরের লেভেল খেলো" : "আবার খেলো"}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
