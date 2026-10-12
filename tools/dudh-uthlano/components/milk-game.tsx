"use client";
// IP: what we avoided — no famous cooking or timing game's name, chef characters, kitchen-timer look, logo or music; the pots, stoves, foam and আম্মু's lines are our own.

import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, fitCanvas, hiss, loop, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, newCache, VH, VW, type SceneCache } from "../lib/draw";
import {
  ammuLine, bn, caption, clearLine, friendBanner, humanLine, kitchenOf, kitchenStars, liftPot, migrateLevels, nearMiss, newRound, ordinal, parseShare, potsPlain, potsWord, potWord,
  shareHash, startPot, stepRound, stoveName, totalOf, vesselName, versusLine,
  CLASSIC, HOLD_MS, KITCHEN_COUNT, SLOW, type Shared,
} from "../lib/dudh";

const TOOL = "dudh-uthlano";
// The round's last pot can end while a finger is still down; its release must not restart before the score is seen.
const AGAIN_GUARD_MS = 600;
const LEVELS_KEY = `ektukhani-levels-${TOOL}`, OLD_BEST_KEY = `ektukhani-best-${TOOL}`;

// The kitchen's sounds, made in code by the shared kit: the gas catching, a bubble, the pot set down, a boil-over sizzle, the doorbell.
const ignite = () => hiss(0.28, 0.1, 3400, "bandpass");
const bubble = (level: number) => { const pitch = 260 + Math.random() * 420; tone(pitch, 0.06, 0.02 + 0.05 * level, "sine", 0, pitch * 1.7); };
const setDown = () => tone(190, 0.12, 0.16, "triangle", 0, 120);
const sizzle = () => { hiss(1.1, 0.2, 2600, "highpass"); hiss(0.5, 0.14, 700, "lowpass", 0.05); sfx.wrong(); };
const doorbell = () => { tone(988, 0.5, 0.1, "sine"); tone(784, 0.7, 0.1, "sine", 0.32); };

/** Stars that pop in one by one, each with its own note. */
function StarReveal({ count }: { count: number }) {
  useEffect(() => {
    const timers = [0, 1, 2].filter(index => index < count).map(index => window.setTimeout(() => sfx.star(index), 300 + index * 240));
    return () => timers.forEach(window.clearTimeout);
  }, [count]);
  return <span className="gx-stars du-stars" role="img" aria-label={`৩টার মধ্যে ${bn(count)}টা তারা`}>
    {[0, 1, 2].map(index => <span key={index} className={index < count ? "on gx-pop" : ""} style={{ animationDelay: `${300 + index * 240}ms` }}>★</span>)}
  </span>;
}

export function MilkGame() {
  const [slow, setSlow] = useSlowMode();
  // Before the level store is read: an old phone's best from the original five pots becomes kitchen 3's stars (once).
  useEffect(() => {
    try {
      const moved = migrateLevels(localStorage.getItem(LEVELS_KEY), localStorage.getItem(OLD_BEST_KEY));
      if (moved) localStorage.setItem(LEVELS_KEY, moved);
    } catch { /* storage blocked: nothing to move */ }
  }, []);
  const levels = useLevels(TOOL, KITCHEN_COUNT);
  const round = useRef(newRound(1, 1));
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const kitchen = round.current.kitchen;
  // Kitchen 3 keeps the original game's best-score key, so an old best stays where it was.
  const [best, submitBest] = useBest(kitchen === CLASSIC ? TOOL : `${TOOL}-${kitchen}`);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [earned, setEarned] = useState(0);
  const [bell, setBell] = useState(false);
  const [shake, setShake] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const hold = useRef<{ id: number; at: number } | null>(null);
  const slowUsed = useRef(false);
  const chosen = useRef(false);
  const overAt = useRef(0);
  const clock = useRef(0);
  const streak = useRef(0);
  const hum = useRef<ReturnType<typeof loop> | null>(null);
  const scene = useRef<{ context: CanvasRenderingContext2D; cache: SceneCache } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const playArea = useRef<HTMLDivElement>(null);
  const inView = useInView(playArea, 0.3);

  const current = round.current;
  const { phase } = current;
  const done = phase === "over";
  const pot = current.pots[current.index];
  const count = current.pots.length;
  const total = totalOf(current.scores);
  const card: Shared | null = done ? { seed: current.seed, total, scores: current.scores, spills: current.spills, name: cleanName(name), slow: slowUsed.current, kitchen } : null;
  const state = card ? shareHash(card) : "";
  const next = done && earned && kitchen < KITCHEN_COUNT ? kitchen + 1 : 0;

  const stopHum = () => { hum.current?.stop(); hum.current = null; };

  const begin = useCallback((seed: number, nextKitchen: number) => {
    hum.current?.stop(); hum.current = null;
    round.current = newRound(seed, nextKitchen);
    hold.current = null;
    slowUsed.current = false;
    streak.current = 0;
    setHolding(false); setPaused(false); setNewBest(false); setEarned(0); setBell(false);
    bump();
  }, []);

  useEffect(() => {
    const read = () => {
      const shared = parseShare(window.location.hash);
      if (shared) { chosen.current = true; setFriend(shared); begin(shared.seed, shared.kitchen); }
      return Boolean(shared);
    };
    if (!read()) begin(newSeed(), 1);
    setSite(window.location.host);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [begin]);

  // Saved stars load after the first paint: open the furthest kitchen reached, unless one was picked or a friend's link chose it.
  useEffect(() => {
    const live = round.current;
    if (chosen.current || live.phase !== "waiting" || live.index !== 0 || live.kitchen === levels.unlocked) return;
    begin(newSeed(), levels.unlocked);
  }, [levels.unlocked, begin]);

  useEffect(() => stopHum, []);

  function finishRound() {
    const live = round.current, score = totalOf(live.scores), stars = kitchenStars(score);
    overAt.current = performance.now();
    stopHum();
    const record = submitBest(score) && score > 0;
    setNewBest(record);
    setEarned(stars);
    if (stars) levels.record(live.kitchen, stars);
    // Confetti only for three stars, a new best or the last kitchen cleared; a plain clear gets the stars' own notes.
    const party = record || stars === 3 || (stars > 0 && live.kitchen === KITCHEN_COUNT);
    window.setTimeout(() => {
      if (party) { if (record) sfx.win(); else sfx.levelUp(); confetti(); }
      else if (stars) sfx.good();
      else sfx.lose();
    }, stars ? 1100 : 300);
  }

  const step = (dt: number) => {
    clock.current += dt;
    const live = round.current;
    if (live.phase === "rising") {
      if (slow) slowUsed.current = true;
      const before = live.t, ring = live.pots[live.index].bell;
      if (ring >= 0 && before < ring && before + dt * (slow ? SLOW : 1) >= ring) {
        doorbell();
        setBell(true);
        window.setTimeout(() => setBell(false), 1600);
      }
    }
    const changed = stepRound(live, dt, slow);
    if (live.phase === "rising") {
      // The hum swells as the foam climbs; bubbles pop more often near the rim.
      hum.current?.set(0.12 + 0.88 * live.level * live.level);
      if (Math.random() < dt * (1 + 8 * live.level * live.level)) bubble(live.level);
    }
    if (!changed) return;
    if (live.phase === "result" && live.spills[live.spills.length - 1]) {
      hold.current = null; setHolding(false);
      stopHum(); sizzle(); streak.current = 0;
      if (!slow) setShake(value => value + 1);
    }
    if (live.phase === "over") finishRound();
    bump();
  };
  const draw = () => { if (scene.current) drawScene(scene.current.context, scene.current.cache, round.current, slow, clock.current); };
  const drawLatest = useRef(draw);
  drawLatest.current = draw;
  const running = !paused && !done;
  useGameLoop(step, draw, running);
  // A still frame still has to follow the slow toggle and the last pot.
  useEffect(() => { if (!running) draw(); });

  useEffect(() => {
    const box = stage.current, element = canvas.current;
    if (!box || !element) return;
    const fit = () => {
      const width = box.clientWidth;
      if (!width) return; // hidden or detached: keep the last good size
      const context = fitCanvas(element, width, Math.round(width * VH / VW));
      scene.current = { context, cache: newCache(element.width / VW) };
      drawLatest.current();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    // Canvas text waits for the Bangla fonts; redraw once they are in.
    document.fonts?.ready.then(() => drawLatest.current());
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hidden = () => {
      if (!document.hidden || round.current.phase !== "rising") return;
      hold.current = null;
      setHolding(false);
      setPaused(true);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  // No hum while paused; it comes back when the pot heats again.
  useEffect(() => { if (paused) stopHum(); }, [paused]);

  function liftNow() {
    const live = round.current;
    if (!liftPot(live)) return;
    hold.current = null;
    setHolding(false);
    stopHum();
    setDown();
    const score = live.scores[live.scores.length - 1];
    streak.current = score >= 90 ? streak.current + 1 : 0;
    if (streak.current > 1) sfx.combo(streak.current - 2);
    else if (score >= 90) sfx.good();
    if (!slow) navigator.vibrate?.(12);
    bump();
  }

  function again() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    begin(friend && friend.kitchen === kitchen ? friend.seed : newSeed(), kitchen);
  }
  /** The big button after a round: the next kitchen when this one is cleared, else the same kitchen again. */
  function primary() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    if (next) { chosen.current = true; begin(friend && friend.kitchen === next ? friend.seed : newSeed(), next); }
    else again();
  }
  function choose(nextKitchen: number) {
    chosen.current = true;
    begin(friend && friend.kitchen === nextKitchen ? friend.seed : newSeed(), nextKitchen);
    playArea.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  function press(id: number) {
    const live = round.current;
    if (paused) {
      setPaused(false);
      if (live.phase === "rising") { hum.current = loop("hum", 92); hum.current.set(0.12 + 0.88 * live.level * live.level); }
      return;
    }
    if (hold.current) return;
    if (live.phase === "waiting") {
      startPot(live);
      ignite();
      hum.current?.stop();
      hum.current = loop("hum", 92);
      hum.current.set(0.12);
      hold.current = { id, at: performance.now() };
      setHolding(true);
      bump();
    } else if (live.phase === "rising") liftNow();
  }

  function release(id: number) {
    const started = hold.current;
    if (!started || started.id !== id) return;
    hold.current = null;
    setHolding(false);
    // A short tap leaves the milk heating; a real hold lifts the pot the moment it ends.
    if (round.current.phase === "rising" && performance.now() - started.at >= HOLD_MS) liftNow();
  }

  const pointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button > 0) return;
    if (round.current.phase === "over" && !paused) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone: release still arrives on the element */ }
    press(event.pointerId);
  };
  const pointerUp = (event: ReactPointerEvent<HTMLElement>) => release(event.pointerId);

  // Space or Enter works like the big button (hold or tap), while the game is on screen and nothing else has focus.
  useEffect(() => {
    const busy = (target: EventTarget | null) => (target as HTMLElement | null)?.closest?.("input, textarea, select, a, button:not(.du-press), summary, [contenteditable]");
    const down = (event: KeyboardEvent) => {
      if ((event.key !== " " && event.key !== "Enter") || event.ctrlKey || event.metaKey || event.altKey || busy(event.target) || !inView) return;
      event.preventDefault();
      if (event.repeat) return;
      if (round.current.phase === "over" && !paused) primary();
      else press(-1);
    };
    const up = (event: KeyboardEvent) => {
      if ((event.key !== " " && event.key !== "Enter") || busy(event.target)) return;
      event.preventDefault();
      release(-1);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("দুধ উথলানোর আগে রান্নাঘর ৯১%").then(() => {
      if (cancelled) return;
      if (card && cardCanvas.current) drawCard(cardCanvas.current, card, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const lastAt = current.scores.length - 1;
  const lastScore = current.scores[lastAt] ?? 0, lastSpilled = current.spills[lastAt] ?? false;
  const ammu = paused || done || bell ? "" : ammuLine(current);
  const rival = friend && friend.kitchen === kitchen ? friend : null;
  const miss = done ? nearMiss(total) : "";
  const [label, sub] = paused ? ["চালিয়ে যাও", "দুধ চুলায় অপেক্ষা করছে"]
    : done ? (next ? ["পরের রান্নাঘর", `${bn(next)} · ${kitchenOf(next).name}`] : ["আরেকবার", rival ? `একই ${potsWord(count)} পাতিল` : `নতুন ${potsWord(count)} পাতিল`])
    : phase === "result" ? ["পরের পাতিল আসছে…", ""]
    : phase === "rising" ? (holding ? ["ধরে রাখো…", "ছাড়লেই পাতিল নামবে"] : ["নামাও!", "চাপলেই পাতিল নামবে"])
    : ["চেপে ধরো", "উথলানোর ঠিক আগে ছেড়ে দাও"];
  const said = paused ? "খেলা থেমে আছে। চালিয়ে যাও চাপো।"
    : done ? `শেষ! ${potsPlain(count)} পাতিলের গড় ${bn(total)}%। ${earned ? `রান্নাঘর ${bn(kitchen)} পার, ${bn(earned)} তারা।` : ""} ${miss}`
    : bell ? "কলিং বেল বাজল। দুধ কিন্তু চুলায়।"
    : phase === "result" ? (lastSpilled ? "উথলে গেল!" : `${bn(lastScore)}%, ${potWord(lastScore, false)}`)
    : phase === "waiting" ? `${ordinal(current.index)} পাতিল চুলায়। চেপে ধরো।` : "";

  return (
    <div className="du" data-slow={slow}>
      {friend && (
        <section className="du-friend" aria-labelledby="du-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.total)}%`} />
          <div>
            <h2 id="du-friend-title">{friendBanner(friend)}</h2>
            <p>{possessive(friend.name || "বন্ধু")} নিজের ফোনের স্কোর{friend.slow ? ", ধীরে খেলায়" : ""}</p>
          </div>
        </section>
      )}

      <div className="du-play" ref={playArea}>
        <div className="du-top">
          <p className="du-where">রান্নাঘর {bn(kitchen)} <span><i>· {kitchenOf(kitchen).name} </i>· ★ {bn(totalStars(levels.stars))}/{bn(KITCHEN_COUNT * 3)}</span></p>
          <SoundToggle className="du-sound" />
        </div>
        <div className="du-stage" ref={stage} data-shake={shake ? 1 + (shake % 2) : 0} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={pointerUp} onContextMenu={event => event.preventDefault()}>
          <canvas ref={canvas} width={VW * 2} height={VH * 2} aria-hidden="true" />
          {phase === "waiting" && current.index === 0 && !paused && <p className="du-tip">{kitchenOf(kitchen).bells ? "কলিং বেল বাজলেও চোখ রাখো পাতিলে" : "চেপে ধরো, উথলানোর ঠিক আগে ছাড়ো"}</p>}
          {ammu && <p className="du-ammu" key={`${current.index}-${phase}`}><small>আম্মু, পাশের ঘর থেকে</small>{ammu}</p>}
          {bell && !done && <p className="du-bell"><b>টিং-টং!</b> কে যেন এল</p>}
          {phase === "result" && (
            <p className="du-pop" data-spill={lastSpilled} key={lastAt}>
              {lastSpilled ? <b>উথলে গেল!</b> : <><b>{bn(lastScore)}%</b><span>{potWord(lastScore, false)}{streak.current > 1 ? ` · টানা ${bn(streak.current)}টা` : ""}</span></>}
            </p>
          )}
          {paused && <p className="du-pause">থেমে আছে। নিচের বোতাম চাপলে আবার চলবে।</p>}
          {done && (
            <div className="du-over">
              <p>{earned ? `রান্নাঘর ${bn(kitchen)} পার` : `${potsPlain(count)} পাতিলের গড়`}</p>
              {earned > 0 && <StarReveal count={earned} />}
              <strong>{bn(total)}%</strong>
              <p>{newBest ? "এই রান্নাঘরে নতুন রেকর্ড!" : clearLine(earned)}</p>
              {miss && <p className="du-miss">{miss}</p>}
              {rival && <p className="du-vs">{versusLine(total, rival.total, rival.name, count)}</p>}
            </div>
          )}
        </div>
        <p className="du-sr" aria-live="polite">{said}</p>

        <div className="du-controls">
          <div className="du-row">
            <p className="du-now">{done ? `${potsPlain(count)}টা পাতিলই শেষ${best !== null ? ` · এখানে সেরা ${bn(best)}%` : ""}` : <>{ordinal(current.index)} পাতিল · {stoveName[pot.stove]} {vesselName[pot.vessel]}</>}</p>
            <button type="button" className="du-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
          </div>
          <ol className="du-pots" aria-label={`${potsPlain(count)}টা পাতিলের স্কোর`} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {current.pots.map((_, index) => {
              const scored = index < current.scores.length, spilled = current.spills[index];
              return (
                <li key={index} data-now={index === current.index && !done} data-state={scored ? (spilled ? "spill" : "ok") : "todo"}>
                  <span>{bn(index + 1)}</span>
                  <b>{scored ? (spilled ? "উথলেছে" : `${bn(current.scores[index])}%`) : "—"}</b>
                </li>
              );
            })}
          </ol>
          <button
            type="button" className="du-press" data-phase={paused ? "paused" : phase} data-holding={holding}
            disabled={phase === "result" && !paused}
            onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp}
            onClick={() => { if (done && !paused) { sfx.tap(); primary(); } }} onContextMenu={event => event.preventDefault()}
          >
            <b>{label}</b>{sub && <small>{sub}</small>}
          </button>
          {done && next > 0 && <button type="button" className="kit-link du-fresh" onClick={() => { sfx.tap(); again(); }}>আবার এই রান্নাঘরে খেলো</button>}
          {!done && <p className="du-hint">চেপে না ধরেও হয়: এক চাপে জ্বালাও, আরেক চাপে নামাও<span> · কিবোর্ডে Space</span></p>}
          {done && friend && <button type="button" className="kit-link du-fresh" onClick={() => { setFriend(null); begin(newSeed(), kitchen); history.replaceState(null, "", location.pathname); }}>নতুন পাতিলে খেলো</button>}
        </div>
      </div>

      <details className="du-levels">
        <summary>সব রান্নাঘর <span>★ {bn(totalStars(levels.stars))}/{bn(KITCHEN_COUNT * 3)}</span></summary>
        <LevelGrid count={KITCHEN_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, friend?.kitchen ?? 1)} current={kitchen} onPick={choose} noun="রান্নাঘর" />
        <p>প্রতিটা রান্নাঘরে কয়েকটা পাতিল, পরেরটায় আরও জোরে আঁচ। গড় ৫০% হলে পার, ৭৫% হলে ২ তারা, ৯০% হলে ৩ তারা।</p>
      </details>

      {card && (
        <section className="du-result" id="result" aria-labelledby="du-result-title">
          <h2 id="du-result-title">{rival ? versusLine(total, rival.total, rival.name, count) : humanLine(card.scores, card.spills)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="du-card-summary" />
            <figcaption id="du-card-summary" className="du-sr">{card.name && `${card.name}, `}দুধ উথলানোর আগে, রান্নাঘর {bn(kitchen)}, গড় {bn(total)}%{earned ? `, ${bn(earned)} তারা` : ""}। {humanLine(card.scores, card.spills)}</figcaption>
            {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="du-share">
            <label className="du-name">
              <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="dudh-uthlano.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint={`লিংক পেলে বন্ধু একই ${potsWord(count)} পাতিল পাবে।`} />
          </div>
        </section>
      )}
    </div>
  );
}
