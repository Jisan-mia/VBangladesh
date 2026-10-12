"use client";
// IP: what we avoided — no colour-shifting gradient blocks, slicing or look of the famous stacking app; real rice and jute sacks on a painted truck instead, a plumb-line lean rule instead of trimming, and every figure drawn fresh from plain shapes.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, fitCanvas, hiss, MAX_NAME, newSeed, readLevels, sfx, tone, totalStars, unlockedLevel, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, Stars } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, onLand, onMiss, paint, resizeScene, restartScene, updateScene } from "../lib/draw-scene";
import { GHATS, LEVEL_COUNT, leanOf, migrateBest, newGame, nextMark, scoreOf, starsOf, step, tap, type Phase } from "../lib/game";
import { MAX_SACKS, bn, caption, cardHash, dropNews, friendBanner, friendNote, ghatLabel, humanLine, missReason, parseCard, sacksLabel, versusLine, type Card } from "../lib/result";

const TOOL = "bostar-pahar";
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
/** When each won star pops in on the result, in seconds (the CSS delay and the sound share it). */
const starAt = (index: number) => 0.3 + index * 0.28;

/** The rope lets go: a short swish, so the tap answers at once. */
const release = () => hiss(0.08, 0.06, 1800, "bandpass");
/** The sack lands: a low thump with a little burlap. */
const thump = () => { tone(140, 0.18, 0.22, "sine", 0, 60); hiss(0.07, 0.07, 500); };
/** The sack slides off the pile. */
const slide = () => { tone(220, 0.35, 0.16, "sine", 0, 90); hiss(0.3, 0.05, 700, "lowpass", 0.05); };

export function BostarGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef(newGame(1));
  const scene = useRef(makeScene());
  const seen = useRef<{ phase: Phase; count: number; settled: boolean }>({ phase: "ready", count: 1, settled: false });
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [leaning, setLeaning] = useState(0);
  const [settled, setSettled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  // Ghat 1 keeps the key the one-ghat game used, so the old best stays ghat 1's best.
  const [best, submitBest] = useBest(level === 1 ? TOOL : `${TOOL}-${level}`);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [record, setRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const [news, setNews] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const over = phase === "over";
  const sacks = Math.min(MAX_SACKS, score);
  const card: Card | null = over ? { seed: game.current.seed, sacks, perfect: Math.min(sacks, game.current.perfect), streak: Math.min(sacks, game.current.bestCombo), name: cleanName(name), level } : null;
  const state = card ? cardHash(card) : "";
  const rival = friend && friend.seed === game.current.seed && friend.level === level ? friend : null;
  const versus = rival && card ? versusLine(card.sacks, rival.sacks, rival.name) : "";
  const ghat = GHATS[level - 1];
  const earned = starsOf(score, level), mark = nextMark(score, level);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const total = totalStars(levels.stars);

  const draw = () => { if (context.current) drawScene(context.current, scene.current, game.current); };

  /** Mirrors the game into React only when something changes, never every frame. */
  function sync() {
    const now = game.current, last = seen.current, count = now.xs.length;
    if (count > last.count) {
      onLand(scene.current, now);
      thump();
      // ঠিক মাঝে climbs a note with every one in a row.
      if (now.verdict === "perfect") sfx.combo(now.combo - 1);
      if (!slow) navigator.vibrate?.(now.verdict === "perfect" ? 18 : 8);
      const sacks = count - 1, before = starsOf(sacks - 1, now.level), after = starsOf(sacks, now.level);
      if (after > before) {
        levels.record(now.level, after);
        // The truck is full (the ghat is cleared); more stars on the way up chime.
        if (before === 0) sfx.levelUp(); else sfx.star(after - 1);
      }
      setScore(sacks); setCombo(now.combo); setLeaning(Math.abs(leanOf(now)) > 0.55 ? Math.sign(leanOf(now)) : 0);
      setNews(dropNews(now.verdict ?? "good", sacks) + (after > before ? (before === 0 ? " ট্রাক ভরে গেছে, পরের ঘাট খুলল।" : ` ${bn(after)} তারা।`) : ""));
    }
    last.count = count;
    if (now.phase !== last.phase) {
      if (now.phase === "fall") {
        onMiss(scene.current, now);
        slide();
        if (!slow) stage.current?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
        setCombo(0);
        setNews(dropNews(now.verdict ?? "slip", count - 1));
      }
      if (now.phase === "over") finish(count - 1);
      last.phase = now.phase;
      setPhase(now.phase);
    }
    if (scene.current.settled !== last.settled) { last.settled = scene.current.settled; setSettled(last.settled); }
  }

  function finish(sacks: number) {
    const stars = starsOf(sacks, game.current.level), beaten = submitBest(sacks) && best !== null;
    setPreviousBest(best);
    setRecord(beaten);
    const later = (seconds: number, play: () => void) => timers.current.push(window.setTimeout(play, seconds * 1000));
    for (let star = 0; star < stars; star++) later(starAt(star), () => sfx.star(star));
    if (stars === 3 || beaten) later(starAt(stars), () => { sfx.win(); confetti(); });
    else if (stars > 0) later(starAt(stars), sfx.good);
  }

  function press() {
    if (paused) { setPaused(false); return; }
    if (tap(game.current)) { release(); sync(); }
  }

  function start(seed: number, nextLevel: number) {
    game.current = newGame(seed, nextLevel);
    seen.current = { phase: "ready", count: 1, settled: false };
    restartScene(scene.current);
    timers.current.forEach(clearTimeout); timers.current = [];
    setLevel(nextLevel); setPhase("ready"); setScore(0); setCombo(0); setLeaning(0); setSettled(false); setPaused(false); setRecord(false); setNews("");
  }

  function play(nextLevel: number, seed = newSeed()) {
    start(seed, nextLevel);
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "center", behavior: slow ? "auto" : "smooth" });
  }
  function again(fresh = false) {
    if (fresh && friend) { setFriend(null); history.replaceState(null, "", window.location.pathname); }
    play(level, rival && !fresh ? rival.seed : newSeed());
  }
  const cleared = over && starsOf(score, level) > 0;
  const proceed = () => cleared && level < LEVEL_COUNT ? play(level + 1) : again();

  useGameLoop(dt => {
    step(game.current, dt, slow);
    updateScene(scene.current, game.current, dt, slow);
    sync();
  }, draw, !paused && !settled);

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge link starts a friend's swings.
    const read = () => { const shared = parseCard(window.location.hash); if (shared) { setFriend(shared); start(shared.seed, shared.level); } return shared; };
    let saved = readLevels(stored(`ektukhani-levels-${TOOL}`), LEVEL_COUNT);
    const migrated = migrateBest(saved, stored(`ektukhani-best-${TOOL}`));
    if (migrated) { levels.record(1, migrated); saved = { 1: migrated }; }
    if (!read()) start(newSeed(), unlockedLevel(saved, LEVEL_COUNT));
    const onHash = () => { read(); };
    window.addEventListener("hashchange", onHash);
    setSite(window.location.host);
    return () => { window.removeEventListener("hashchange", onHash); timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const box = stage.current, element = canvas.current;
    if (!box || !element) return;
    const fit = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      context.current = fitCanvas(element, width, height);
      resizeScene(scene.current, width, height, Math.min(2, window.devicePixelRatio || 1));
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    // The sacks and the godown carry Bangla words: paint them again once the fonts arrive.
    loadCardFonts("চাল পাট গুদাম নিচের বস্তার ঠিক ওপরে এলেই চাপো").then(() => { paint(scene.current); draw(); }).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden && ["swing", "drop", "settle", "fall"].includes(game.current.phase)) setPaused(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Space, Enter or ↓ drops; P or Esc pauses. Typing a name and pressing focused buttons are left alone.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, button, a, summary, [contenteditable]")) return;
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowDown") { event.preventDefault(); if (over) proceed(); else press(); }
      else if ((event.key === "p" || event.key === "P" || event.key === "Escape") && !over) setPaused(value => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("বস্তার পাহাড় ২৮টা বস্তা ঠিক মাঝে").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function onStage(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    if (!over) press();
  }
  // Taps act on pointer-down (no finger-lift delay); keyboard presses arrive as clicks with detail 0.
  function onButtonDown(event: PointerEvent<HTMLButtonElement>) { if (event.isPrimary) { event.preventDefault(); press(); } }
  function onButtonClick(event: MouseEvent<HTMLButtonElement>) { if (event.detail === 0) press(); }

  // The near miss, with the exact gap: to the goal or the next star, or (at three stars) to this phone's best.
  const nearLine = !over ? "" : mark ? `আর ${bn(mark - score)}টা হলেই ${earned ? `${bn(earned + 1)} তারা` : "ট্রাক ভরত"}।`
    : previousBest !== null && !record ? `আর ${bn(previousBest - score + 1)}টা হলেই নতুন সেরা।` : "";
  const busy = phase === "drop" || phase === "settle" || phase === "fall";
  const hint = paused ? "থামানো আছে। চাপলেই আবার চলবে।"
    : phase === "ready" ? "দোলটা একবার দেখে নাও, তাড়াহুড়ো নেই।"
    : phase === "fall" || over ? missReason(game.current.verdict)
    : leaning > 0 ? "পাহাড় ডানে হেলে আছে। এবার একটু বাঁয়ে ফেলো।"
    : leaning < 0 ? "পাহাড় বাঁয়ে হেলে আছে। এবার একটু ডানে ফেলো।"
    : combo >= 2 ? "টানা ঠিক মাঝে পড়লে পাহাড় সোজা থাকে।"
    : "ঠিক মাঝে পড়লে পাহাড় একটু সোজা হয়।";

  return (
    <div className="bp">
      <div className="bp-play">
        {friend && (
          <section className="bp-friend" aria-labelledby="bp-friend-title">
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${sacksLabel(friend.sacks)}`} />
            <div>
              <p className="bp-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
              <h2 id="bp-friend-title">{friendBanner(friend)}</h2>
              <p>{friendNote(friend)}</p>
            </div>
          </section>
        )}

        <p className="bp-level"><b>{ghatLabel(level)}</b> <span aria-label={`মোট ${bn(total)}টা তারা`}>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        <div className="bp-hud">
          <p className="bp-count"><b>{bn(score)}</b>টা বস্তা</p>
          {combo >= 2 && !over && <p className="bp-combo" key={combo}>ঠিক মাঝে ×{bn(combo)}</p>}
          <p className="bp-goal">
            <span className="bp-goal-stars" key={earned}><Stars count={earned} /></span>
            {rival ? <>লক্ষ্য <b>{bn(rival.sacks)}</b></> : mark ? <>{earned ? "পরের তারা" : "ট্রাক ভরতে"} <b>{bn(mark)}</b></> : best !== null ? <>সেরা <b>{bn(best)}</b></> : null}
          </p>
        </div>

        <div className="bp-stage" ref={stage}>
          <canvas ref={canvas} onPointerDown={onStage} aria-hidden="true" />
          {paused && <button type="button" className="kit-primary bp-resume" onClick={() => setPaused(false)}>চালিয়ে যাও</button>}
        </div>
        <p className="bp-hint">{hint}</p>
        <p className="bp-sr" aria-live="polite">{news}</p>

        {over ? (
          <div className="bp-over">
            <p className="bp-over-kicker">{cleared ? `${ghat.name} পার। ট্রাক ভরে রওনা দিল।` : `ট্রাক ভরতে লাগে ${sacksLabel(ghat.goal)}।`}</p>
            <p className="gx-stars bp-over-stars" role="img" aria-label={`৩টার মধ্যে ${bn(earned)}টা তারা`}>
              {[0, 1, 2].map(star => <span key={star} className={star < earned ? "on gx-pop" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
            </p>
            <p className="bp-score"><b>{bn(score)}</b>টা বস্তা</p>
            {nearLine && <p className="bp-near">{nearLine}</p>}
            <p className="bp-best">{record ? "নতুন রেকর্ড! এই ফোনে এটাই সেরা।" : best !== null ? `এই ফোনে এই ঘাটের সেরা: ${sacksLabel(best)}` : ""}</p>
            {versus && <p className="bp-versus">{versus}</p>}
            <div className="bp-over-actions">
              {cleared && level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => play(level + 1)}>পরের ঘাট</button>}
              <button type="button" className={cleared && level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => again()}>{cleared ? "আবার খেলো" : "আরেকবার"}</button>
            </div>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন দোলে খেলো</button>}
          </div>
        ) : (
          <button type="button" className="kit-primary bp-tap" data-busy={busy && !paused} onPointerDown={onButtonDown} onClick={onButtonClick}>{paused ? "চালিয়ে যাও" : "বস্তা ফেলো"}</button>
        )}

        <div className="bp-toggles">
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle className="bp-sound" />
          {!over && phase !== "ready" && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
        </div>

        <details className="bp-levels">
          <summary>সব ঘাট <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
          <p>প্রতি ঘাটে বস্তা আগের চেয়ে জোরে দোলে। ট্রাক ভরলেই পরের ঘাট খোলে, আরও উঁচু সাজালে বেশি তারা।</p>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} noun="ঘাট" onPick={next => play(next)} />
        </details>
      </div>

      {card && (
        <section className="bp-result" id="result" aria-labelledby="bp-result-title">
          <h2 id="bp-result-title">ট্রাকে উঠল <em>{sacksLabel(card.sacks)}</em></h2>
          <p>{versus || humanLine(card.sacks)}</p>
          <div className="bp-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bp-card-summary" />
              <figcaption id="bp-card-summary" className="bp-sr">বস্তার পাহাড়{card.name && `, ${card.name}`}: {sacksLabel(card.sacks)}। ঠিক মাঝে {bn(card.perfect)} বার, টানা {bn(card.streak)} বার। {humanLine(card.sacks)}</figcaption>
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bp-controls">
              <label className="bp-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="bostar-pahar.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু একই দোল পাবে: প্রতিটা বস্তা একই তালে দুলবে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
