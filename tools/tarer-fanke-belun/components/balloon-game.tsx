"use client";
// IP: what we avoided — no bird, no green pipes, no pixel art, no tap-to-flap sounds, no medal screen or any famous flappy game's name or look; a balloon, drooping Dhaka wires, poles, crows and shop signs, all drawn fresh.

import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, fitCanvas, hiss, loop, MAX_NAME, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, newCache, type SceneCache } from "../lib/draw";
import { BX, VH, VW, clearance, newRun, puff, stageOf, stageStars, stepRun, STAGE_COUNT } from "../lib/game";
import { bn, caption, cardHash, friendBanner, friendNote, humanLine, migrateLevels, nearMiss, parseCard, versusLine, type Card } from "../lib/result";

const TOOL = "tarer-fanke-belun";
const LEVELS_KEY = `ektukhani-levels-${TOOL}`, BEST_KEY = `ektukhani-best-${TOOL}`;
// A tap that was already on its way when the balloon popped must not skip the score.
const AGAIN_GUARD_MS = 400;

// The street's sounds, all made in code: a breath of air per tap, the balloon's rubber squeak on a wire, the ফটাস, and a clean-crossing note that climbs.
const puffSound = () => hiss(0.07, 0.05, 1500, "bandpass");
const squeak = () => { tone(880, 0.1, 0.07, "sawtooth", 0, 1320); tone(1320, 0.06, 0.04, "triangle", 0.08, 990); buzz(10); };
const popSound = () => { hiss(0.16, 0.3, 2600, "highpass"); tone(230, 0.08, 0.12, "square", 0, 90); buzz(40); };
type Loop = ReturnType<typeof loop>;

export function BalloonGame() {
  const [slow, setSlow] = useSlowMode();
  // Before the level store is read: an old phone's best on the endless street opens the first levels (once).
  useEffect(() => {
    try {
      const moved = migrateLevels(localStorage.getItem(LEVELS_KEY), localStorage.getItem(BEST_KEY));
      if (moved) localStorage.setItem(LEVELS_KEY, moved);
    } catch { /* storage blocked: nothing to move */ }
  }, []);
  const levels = useLevels(TOOL, STAGE_COUNT);
  const [best, submitBest] = useBest(TOOL);
  const [big, setBig] = useState(false);
  // The level being played or about to be: 1..STAGE_COUNT, or 0 for the endless street.
  const [level, setLevel] = useState(1);
  const chosen = useRef(false);
  const [earned, setEarned] = useState(0);
  const [prevBest, setPrevBest] = useState<number | null>(null);
  const sounds = useRef<{ hum: Loop | null; wind: Loop | null; grazes: number; score: number }>({ hum: null, wind: null, grazes: 0, score: 0 });
  const windRef = useRef<HTMLParagraphElement>(null);
  const run = useRef(newRun(1));
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const slowUsed = useRef(false);
  const overAt = useRef(0);
  const clock = useRef(0);
  const scene = useRef<{ context: CanvasRenderingContext2D; cache: SceneCache } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(stage, 0.4);

  const current = run.current;
  const { phase, score } = current;
  const done = phase === "over";
  const card: Card | null = done ? { seed: current.seed, score, name: cleanName(name), big: current.big, slow: slowUsed.current, stage: current.stage } : null;
  const state = card ? cardHash(card) : "";

  const stopLoops = useCallback(() => {
    const ear = sounds.current;
    ear.hum?.stop(); ear.wind?.stop();
    ear.hum = ear.wind = null;
  }, []);

  const begin = useCallback((seed: number, withBig: boolean, stage: number) => {
    stopLoops();
    run.current = newRun(seed, withBig, stage);
    Object.assign(sounds.current, { grazes: 0, score: 0 });
    slowUsed.current = false;
    setLevel(stage);
    setPaused(false); setNewBest(false); setEarned(0);
    bump();
  }, [stopLoops]);

  useEffect(() => {
    const read = () => {
      const shared = parseCard(window.location.hash);
      if (shared) { chosen.current = true; setFriend(shared); setBig(shared.big); begin(shared.seed, shared.big, shared.stage); }
      return Boolean(shared);
    };
    if (!read()) begin(newSeed(), false, 1);
    setSite(window.location.host);
    window.addEventListener("hashchange", read);
    return () => { window.removeEventListener("hashchange", read); stopLoops(); };
  }, [begin, stopLoops]);

  // Saved stars load after the first paint: open the furthest level reached, unless the player or a friend's link chose one.
  useEffect(() => {
    if (!levels.loaded || chosen.current || run.current.phase !== "ready") return;
    chosen.current = true;
    begin(run.current.seed, big, levels.unlocked);
  }, [levels.loaded, levels.unlocked, begin, big]);

  /** The run just ended: stars or a best, and the right sound a moment later (after the stars' own chimes). */
  function finish(live: typeof run.current) {
    overAt.current = performance.now();
    stopLoops();
    if (live.cleared) {
      const stars = stageStars(live.stage, live.grazes);
      levels.record(live.stage, stars);
      setEarned(stars);
      const party = stars === 3 || live.stage === STAGE_COUNT;
      window.setTimeout(() => { if (party) { sfx.levelUp(); confetti(); } else sfx.good(); }, 300 + stars * 260);
      return;
    }
    if (live.stage) return;
    setPrevBest(best);
    const record = submitBest(live.score) && live.score > 0;
    setNewBest(record);
    if (record) window.setTimeout(() => { sfx.win(); confetti(); }, 650);
  }

  /** What the street sounds like this frame: the wires hum louder as the balloon nears them, the wind follows its strength. */
  function listen(live: typeof run.current) {
    const ear = sounds.current;
    if (live.grazes !== ear.grazes) { ear.grazes = live.grazes; squeak(); }
    if (live.score !== ear.score) {
      ear.score = live.score;
      if (live.streak > 0) sfx.combo(Math.min(9, live.streak - 1)); else sfx.tick();
    }
    const near = Math.max(0, Math.min(1, 1 - clearance(live) / 36));
    ear.hum?.set(near * near * 0.75);
    ear.hum?.pitch(96 + 70 * near);
    ear.wind?.set(Math.min(1, Math.abs(live.wind) / 300) * 0.8);
  }

  const step = (dt: number) => {
    clock.current += dt;
    const live = run.current;
    if (live.phase === "playing" && slow) slowUsed.current = true;
    const changed = stepRun(live, dt, slow);
    if (live.phase === "playing") listen(live);
    if (!changed) return;
    if (live.phase === "pop") { stopLoops(); popSound(); }
    if (live.phase === "over") finish(live);
    bump();
  };
  const windText = useRef("");
  const draw = () => {
    if (scene.current) drawScene(scene.current.context, scene.current.cache, run.current, slow, clock.current);
    // The wind in words too, so sound and streaks never carry it alone; touched only when it changes.
    const wind = run.current.wind, strength = Math.abs(wind) < 25 ? 0 : Math.abs(wind) < 140 ? 1 : 2;
    const text = !run.current.stage || run.current.phase !== "playing" || !strength ? "" : `হাওয়া ${wind > 0 ? "↓" : "↑"}${strength === 2 ? " জোরে" : ""}`;
    if (text !== windText.current && windRef.current) { windText.current = text; windRef.current.textContent = text; windRef.current.hidden = !text; }
  };
  const drawLatest = useRef(draw);
  drawLatest.current = draw;
  const running = !paused && !done;
  useGameLoop(step, draw, running);
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
    // The shop signs are Bangla text baked into the background; repaint them once the font is in.
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  // Hidden tab or a stage scrolled out of sight: stop, and wait for "চালিয়ে যাও".
  useEffect(() => {
    const hidden = () => { if (document.hidden && run.current.phase === "playing") { stopLoops(); setPaused(true); } };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [stopLoops]);
  useEffect(() => { if (!inView && run.current.phase === "playing") { stopLoops(); setPaused(true); } }, [inView, stopLoops]);

  function press() {
    const live = run.current;
    if (paused) { live.vy = Math.min(live.vy, 0); setPaused(false); return; }
    const started = live.phase === "ready";
    if (!puff(live)) return;
    puffSound();
    if (!slow) buzz(8);
    // Loops start from inside a tap (browsers allow audio only then), and again after a pause or the sound switch.
    const ear = sounds.current;
    ear.hum ??= loop("hum", 96);
    if (live.stage) ear.wind ??= loop("wind");
    if (started) bump();
  }

  const friendFits = (stage: number) => Boolean(friend) && friend!.stage === stage;
  /** The same level (or the endless street) again: a fresh street, or the friend's own one. */
  function again() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    begin(friendFits(level) ? friend!.seed : newSeed(), big, level);
  }
  /** A level from the grid, the next one after a clear, or the endless street. */
  function choose(to: number, scroll = true) {
    chosen.current = true;
    begin(friendFits(to) ? friend!.seed : newSeed(), big, to);
    if (scroll) stage.current?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "center" });
  }
  const nextLevel = done && current.cleared && current.stage < STAGE_COUNT ? current.stage + 1 : 0;
  function primary() {
    if (nextLevel) { if (performance.now() - overAt.current >= AGAIN_GUARD_MS) choose(nextLevel, false); }
    else again();
  }

  function toggleBig() {
    const next = !big;
    setBig(next);
    // Before the first puff the change applies at once; mid-run it waits for the next round, so a score never mixes both.
    if (run.current.phase === "ready") begin(run.current.seed, next, run.current.stage);
  }

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button > 0 || (event.target as HTMLElement).closest("button, a")) return;
    if (run.current.phase === "over" || run.current.phase === "pop") return;
    event.preventDefault();
    press();
  };

  // Space, Enter or the up arrow puffs, while the game is on screen and nothing else has focus.
  useEffect(() => {
    const busy = (target: EventTarget | null) => (target as HTMLElement | null)?.closest?.("input, textarea, select, a, button, [contenteditable]");
    const down = (event: KeyboardEvent) => {
      if (![" ", "Enter", "ArrowUp"].includes(event.key) || event.ctrlKey || event.metaKey || event.altKey || busy(event.target) || !inView) return;
      event.preventDefault();
      if (event.repeat) return;
      if (run.current.phase === "over") primary();
      else if (run.current.phase !== "pop") press();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("তারের ফাঁকে বেলুন ৩৭টা").then(() => {
      if (cancelled) return;
      if (card && cardCanvas.current) drawCard(cardCanvas.current, card, format, site, earned);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend, earned]);

  const goal = current.goal, grazes = current.grazes, info = level ? stageOf(level) : null;
  const miss = done ? nearMiss({ stage: current.stage, score, cleared: current.cleared, grazes, best: prevBest }) : "";
  const said = paused ? "খেলা থেমে আছে। চালিয়ে যাও চাপো।"
    : done && current.cleared ? `লেভেল ${bn(current.stage)} পার, ${bn(earned)} তারা। ${miss}`
    : done ? `ফটাস! ${bn(score)}টা ফাঁক পার করেছ। ${miss}`
    : phase === "ready" ? "চাপ দিলে বেলুন একটু ওঠে। তারে লাগলেই ফটাস।" : "";

  return (
    <div className="tb" data-slow={slow}>
      {friend && (
        <section className="tb-friend" aria-labelledby="tb-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.score)}টা ফাঁক`} />
          <div>
            <h2 id="tb-friend-title">{friendBanner(friend)}</h2>
            <p>{friendNote(friend)}</p>
          </div>
        </section>
      )}

      <div className="tb-top">
        <p className="tb-where">{info ? <>লেভেল {bn(level)} <i>· {info.name} </i><span>· ★ {bn(totalStars(levels.stars))}/{bn(STAGE_COUNT * 3)}</span></> : <>যত দূর পারো <span>· শেষ নেই{best !== null ? `, সেরা ${bn(best)}টা` : ""}</span></>}</p>
        <SoundToggle compact onChange={stopLoops} />
      </div>

      <div className="tb-stage" ref={stage} data-phase={phase} onPointerDown={pointerDown} onContextMenu={event => event.preventDefault()}>
        <canvas ref={canvas} width={VW * 2} height={VH * 2} aria-hidden="true" />
        {(phase === "playing" || phase === "pop") && (
          <p className="tb-score" aria-hidden="true">
            <span key={score}>{goal ? `${bn(score)}/${bn(goal)}` : bn(score)}</span>
            {goal > 0 && grazes > 0 && <small key={`g${grazes}`}>ঘষা {bn(grazes)}</small>}
          </p>
        )}
        <p className="tb-wind" ref={windRef} aria-hidden="true" hidden />
        {phase === "ready" && !paused && (
          <p className="tb-tip">চাপ দাও, বেলুন উঠবে
            <small>{info ? `${bn(info.gates)}টা ফাঁক পার করো · তারে না ঘষলে ★★★` : "দুই তারের ফাঁক দিয়ে নিয়ে যাও"}</small>
          </p>
        )}
        {phase === "pop" && <p className="tb-pop" style={{ left: `${(BX / VW) * 100}%`, top: `${(current.y / VH) * 100}%` }} aria-hidden="true">ফটাস!</p>}
        {paused && (
          <div className="tb-cover">
            <p>থেমে আছে। বেলুন যেখানে ছিল, সেখানেই আছে।</p>
            <button type="button" className="tb-big" onClick={() => press()}>চালিয়ে যাও</button>
          </div>
        )}
        {done && !paused && current.cleared && (
          <div className="tb-cover tb-over">
            <p className="tb-kicker">লেভেল {bn(current.stage)} পার! বেলুন আস্ত আছে।</p>
            <StarReveal count={earned} />
            <p>{bn(score)}টা ফাঁক · {grazes ? `তারে ঘষা ${bn(grazes)} বার` : "একবারও তারে ঘষেনি"}</p>
            {miss && <p className="tb-miss">{miss}</p>}
            {friend && friend.stage === current.stage && <p className="tb-vs">{versusLine(score, friend.score, friend.name)}</p>}
            <div className="tb-actions">
              {nextLevel > 0 && <button type="button" className="tb-again" onClick={again}>আবার খেলো</button>}
              <button type="button" className="tb-big" onClick={primary}>{nextLevel ? "পরের লেভেল" : "আরেকবার"}</button>
            </div>
            {!nextLevel && <button type="button" className="kit-link" onClick={() => choose(0, false)}>এবার যত দূর পারো খেলো</button>}
          </div>
        )}
        {done && !paused && !current.cleared && (
          <div className="tb-cover tb-over">
            <p className="tb-kicker">{current.popped === "street" ? "রাস্তায় পড়ে ফটাস!" : "তারে লেগে ফটাস!"}</p>
            <strong>{bn(score)}<small>টা ফাঁক</small></strong>
            {current.stage ? <p>লেভেল {bn(current.stage)}: {bn(goal)}টার মধ্যে</p>
              : <p>{newBest ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা ${bn(best)}টা` : ""}</p>}
            {miss && <p className="tb-miss">{miss}</p>}
            {friend && friend.stage === current.stage && <p className="tb-vs">{versusLine(score, friend.score, friend.name)}</p>}
            <button type="button" className="tb-big" onClick={again}>আরেকবার</button>
            {friend && <button type="button" className="kit-link" onClick={() => { setFriend(null); history.replaceState(null, "", location.pathname); begin(newSeed(), big, current.stage); }}>নতুন তারের জটে খেলো</button>}
          </div>
        )}
      </div>
      <p className="tb-sr" aria-live="polite">{said}</p>

      <div className="tb-controls">
        <button type="button" className="tb-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
        <button type="button" className="tb-toggle" aria-pressed={big} onClick={toggleBig}><i aria-hidden="true" />বড় ফাঁক</button>
        <p className="tb-hint">{phase === "playing" && big !== current.big ? `পরের বার থেকে ${big ? "বড় ফাঁক" : "সাধারণ ফাঁক"}` : <>যেখানে খুশি চাপো<span> · কিবোর্ডে Space</span></>}</p>
      </div>

      <details className="tb-levels">
        <summary>সব লেভেল <span>★ {bn(totalStars(levels.stars))}/{bn(STAGE_COUNT * 3)}</span></summary>
        <LevelGrid count={STAGE_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, friend?.stage ?? 1)} current={level || undefined} onPick={choose} />
        <p>প্রতিটা লেভেলে কয়েকটা ফাঁক, আর নিজের হাওয়া। সব ফাঁক পার হলে ১ তারা। তারে একবারও না ঘষলে ৩ তারা, অল্প ঘষলে ২।</p>
        <button type="button" className="tb-endless" aria-pressed={level === 0} onClick={() => choose(0)}>
          যত দূর পারো<small>হাওয়া নেই, শেষও নেই{best !== null ? ` · সেরা ${bn(best)}টা` : ""}</small>
        </button>
      </details>

      {card && (
        <section className="tb-result" id="result" aria-labelledby="tb-result-title">
          <h2 id="tb-result-title">{friend ? versusLine(score, friend.score, friend.name) : humanLine(score)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="tb-card-summary" />
            <figcaption id="tb-card-summary" className="tb-sr">{card.name && `${card.name}, `}তারের ফাঁকে বেলুন{card.stage ? `, লেভেল ${bn(card.stage)}` : ""}, {bn(score)}টা ফাঁক{earned ? `, ${bn(earned)} তারা` : ""}। {humanLine(score)}</figcaption>
            {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="tb-share">
            <label className="tb-name">
              <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="tarer-fanke-belun.png" makeImage={() => cardBlob(card, format, site, earned)} imageKey={`${state}|${format}|${earned}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই তারের জটই পাবে।" />
          </div>
        </section>
      )}
    </div>
  );
}
