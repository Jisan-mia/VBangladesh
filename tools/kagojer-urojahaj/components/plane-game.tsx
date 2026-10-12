"use client";
// IP: what we avoided — no spaceships, guns, lasers, enemies, explosions, lives counters or the black-sky look of any classic shooter, and no names or sounds from one; a ruled exercise-book plane pops weather with crumpled paper, drawn fresh from plain shapes.

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, fitCanvas, hiss, loop, MAX_NAME, newSeed, sfx, shake, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { EV, HITS_MAX, dragBy, launch, newGame, starsOf, step, steer } from "../lib/game";
import { LEVEL_COUNT, LEVELS, isStorm } from "../lib/levels";
import { bn, caption, cardHash, clearLine, friendBanner, friendNote, humanLine, levelLabel, nearLine, parseCard, versusLine, type Card } from "../lib/result";
import { drawScene, makeScene, prepareScene, sceneEvent, updateScene } from "../lib/scene";

const TOOL = "kagojer-urojahaj";
const SLOW = 0.65, DRAG_GAIN = 1.25;
type View = "ready" | "play" | "clear" | "over";
type Result = { card: Card; stars: number; record: boolean; previousBest: number | null; goal: number; left: number };

// The game's own sounds, built from the kit's tone and hiss.
const swish = () => { hiss(0.09, 0.07, 3400, "bandpass"); hiss(0.07, 0.05, 2600, "bandpass", 0.06); };
const softPop = () => { tone(520, 0.08, 0.09, "sine", 0, 900); hiss(0.06, 0.035, 2600, "bandpass"); };
const burst = () => { tone(380, 0.1, 0.1, "sine", 0, 760); hiss(0.4, 0.07, 1100); };
const sunChime = () => { tone(1568, 0.08, 0.06, "triangle"); tone(2093, 0.14, 0.05, "triangle", 0.05); };
const wetSound = () => { hiss(0.25, 0.13, 700); tone(230, 0.16, 0.08, "sine", 0, 150); buzz(30); };
const thunder = (big = false) => { hiss(big ? 1.8 : 1.2, big ? 0.26 : 0.18, 150); tone(48, big ? 1.4 : 0.9, 0.14, "sine", 0.05, 30); };
const birdsong = () => [0, 0.12, 0.2, 0.55, 0.66].forEach((delay, index) => tone(index % 2 ? 3400 : 2800, 0.07, 0.045, "sine", delay, index % 2 ? 2900 : 3700));

export function PlaneGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef(newGame(1));
  const scene = useRef(makeScene());
  const wind = useRef<ReturnType<typeof loop> | null>(null);
  const drag = useRef<{ id: number; x: number } | null>(null);
  const hud = useRef({ score: -1, popped: -1, hits: -1, frame: 0, swishAt: 0, stormHitAt: 0, lastSteer: 0 });
  const scoreEl = useRef<HTMLSpanElement>(null);
  const cloudsEl = useRef<HTMLSpanElement>(null);
  const dryEl = useRef<HTMLSpanElement>(null);
  const comboEl = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);

  const [view, setView] = useState<View>("ready");
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Card | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [news, setNews] = useState("");
  const [demoed, setDemoed] = useState(false);

  const card: Card | null = result ? { ...result.card, name: cleanName(name) } : null;
  const state = card ? cardHash(card) : "";
  const rival = friend && friend.seed === game.current.seed && friend.level === level ? friend : null;
  const versus = rival && card && !demoed ? versusLine(card.score, rival.score, rival.name) : "";
  const allStars = totalStars(levels.stars);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const goal = game.current.wave.goal;

  const draw = () => { if (context.current) drawScene(context.current, scene.current, game.current, slow); };
  const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
  const stopWind = () => { wind.current?.stop(); wind.current = null; };
  const startWind = () => { stopWind(); wind.current = loop("wind", 500); };

  function paintHud(force = false) {
    const g = game.current, h = hud.current;
    if (force || g.score !== h.score) { h.score = g.score; if (scoreEl.current) scoreEl.current.textContent = bn(g.score); }
    if (force || g.popped !== h.popped) {
      h.popped = g.popped;
      if (cloudsEl.current) { const done = g.popped >= g.wave.goal; cloudsEl.current.textContent = done ? bn(g.popped) : `${bn(g.popped)}/${bn(g.wave.goal)}`; cloudsEl.current.dataset.done = String(done); }
    }
    if (force || g.hits !== h.hits) { h.hits = g.hits; if (dryEl.current) dryEl.current.dataset.wet = String(g.hits); }
  }

  function start(seed: number, nextLevel: number) {
    stopWind();
    timers.current.forEach(clearTimeout); timers.current = [];
    game.current = newGame(seed, nextLevel);
    drag.current = null; finished.current = false;
    setLevel(nextLevel); setView("ready"); setDemoed(false); setPaused(false); setResult(null); setNews("");
    const { width, height, ratio } = scene.current;
    if (width) prepareScene(scene.current, width, height, ratio, nextLevel);
    paintHud(true);
  }
  function play(nextLevel: number, seed = newSeed()) {
    start(seed, nextLevel);
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "center", behavior: slow ? "auto" : "smooth" });
  }
  function again(fresh = false) {
    if (fresh && friend) { setFriend(null); history.replaceState(null, "", window.location.pathname); }
    play(level, rival && !fresh ? rival.seed : newSeed());
  }
  function go() {
    const g = game.current;
    if (g.phase !== "ready") return;
    launch(g); swish(); startWind();
    if (isStorm(g.level)) later(400, () => thunder());
    setView("play");
  }

  /** Preview images only (`&og=1` on a friend's link): shows that card as a finished wave without playing. Saves nothing. */
  function demo(shared: Card) {
    const wave = game.current.wave;
    setResult({ card: { ...shared, name: "" }, stars: starsOf(wave, shared.popped, shared.hits), record: false, previousBest: null, goal: wave.goal, left: 0 });
    setName(shared.name); setDemoed(true);
    setView(shared.hits >= HITS_MAX ? "over" : "clear");
  }

  function finish() {
    if (finished.current) return;
    finished.current = true;
    stopWind(); steer(game.current, 0);
    const g = game.current, stars = starsOf(g.wave, g.popped, g.hits);
    if (stars) levels.record(g.level, stars);
    const record = submitBest(g.score) && best !== null && g.score > 0;
    setResult({ card: { seed: g.seed, level: g.level, score: g.score, popped: g.popped, suns: g.suns, hits: g.hits, name: "" }, stars, record, previousBest: best, goal: g.wave.goal, left: Math.max(0, Math.ceil(g.wave.length - g.t)) });
    setView(g.phase === "clear" ? "clear" : "over");
    setNews(`${bn(g.score)} পয়েন্ট। ${stars ? `লেভেল পার, ${bn(stars)} তারা।` : "তিনবার ভিজে গেছে।"}`);
    if (!stars) { sfx.lose(); return; }
    birdsong();
    // StarReveal chimes each star; the cheer comes after the last one.
    const after = 700 + 260 * stars;
    if (g.level === LEVEL_COUNT) later(after, () => { sfx.levelUp(); confetti(); });
    else if (stars === 3 || record) later(after, () => { sfx.win(); confetti(); });
    else later(after, sfx.good);
  }

  function onEvents() {
    const g = game.current, s = scene.current, h = hud.current;
    for (let index = 0; index < g.eventCount; index++) {
      const type = g.events[index], x = g.eventX[index], y = g.eventY[index], n = g.eventN[index];
      sceneEvent(s, type, x, y, n, slow);
      if (type === EV.pop) { if (g.combo >= 2) sfx.combo(Math.min(9, g.combo - 2)); else softPop(); }
      else if (type === EV.burst) { burst(); if (g.combo >= 2) sfx.combo(Math.min(9, g.combo - 2)); }
      else if (type === EV.crack) tone(300, 0.06, 0.07, "triangle", 0, 380);
      else if (type === EV.stormHit) { if (g.t - h.stormHitAt > 0.3) { h.stormHitAt = g.t; tone(170, 0.06, 0.06, "sine", 0, 120); } }
      else if (type === EV.stormPop) { burst(); later(120, softPop); later(240, sfx.good); buzz([20, 40, 20]); }
      else if (type === EV.sun) sunChime();
      else if (type === EV.wet) { wetSound(); shake(stage.current); }
      else if (type === EV.thunder) thunder();
      else if (type === EV.stormIn) thunder(true);
      else if (type === EV.combo && comboEl.current) {
        comboEl.current.textContent = `পরপর ${bn(n)}টা`;
        comboEl.current.classList.remove("ku-flash"); void comboEl.current.offsetWidth; comboEl.current.classList.add("ku-flash");
      }
    }
    g.eventCount = 0;
  }

  useGameLoop(dt => {
    const g = game.current, d = slow ? dt * SLOW : dt, h = hud.current;
    step(g, d);
    updateScene(scene.current, d, slow, true);
    onEvents();
    paintHud();
    // A paper swish when the plane changes direction; the wind gets louder and thinner the faster it moves.
    const moving = Math.abs(g.vx) > 20 ? Math.sign(g.vx) : 0;
    if (moving && moving !== h.lastSteer && g.t - h.swishAt > 0.3) { h.swishAt = g.t; swish(); }
    h.lastSteer = moving;
    if (++h.frame % 3 === 0 && wind.current) {
      const speed = Math.min(1, Math.abs(g.vx) / 140);
      wind.current.set(0.08 + speed * 0.4);
      wind.current.pitch(450 + speed * 1300);
    }
    if (g.phase === "clear" || g.phase === "over") finish();
  }, draw, view === "play" && !paused);

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge link opens a friend's sky.
    const read = () => {
      const shared = parseCard(window.location.hash);
      if (!shared) return;
      setFriend(shared); start(shared.seed, shared.level);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
    };
    read();
    window.addEventListener("hashchange", read);
    setSite(window.location.host);
    return () => { window.removeEventListener("hashchange", read); timers.current.forEach(clearTimeout); stopWind(); };
  }, []);

  // A returning player starts at the furthest open level that isn't three-starred yet (a friend's link wins).
  useEffect(() => {
    if (!levels.loaded || parseCard(window.location.hash)) return;
    const first = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(at => (levels.stars[at] ?? 0) < 3) ?? levels.unlocked;
    if (game.current.phase === "ready") start(newSeed(), first);
  }, [levels.loaded]);

  useEffect(() => {
    const box = stage.current, element = canvas.current;
    if (!box || !element) return;
    const fit = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      context.current = fitCanvas(element, width, height);
      prepareScene(scene.current, width, height, Math.min(2, window.devicePixelRatio || 1), game.current.level);
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    loadCardFonts("+১০ +২৫").then(draw).catch(() => {});
    paintHud(true);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      drag.current = null; steer(game.current, 0);
      if (game.current.phase === "play") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The loop sleeps outside play: redraw whenever the scene changes. The wind stops while paused.
  useEffect(() => { draw(); }, [view, level, slow, paused]);
  useEffect(() => {
    if (paused) { stopWind(); steer(game.current, 0); }
    else if (game.current.phase === "play" && !wind.current) startWind();
  }, [paused]);

  // ← → (or A D) steer while held, Space or Enter starts and moves on, P or Esc pauses.
  useEffect(() => {
    const typing = (event: KeyboardEvent) => event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).closest?.("input, textarea, select, button, a, summary, [contenteditable]");
    const direction = (key: string) => (key === "ArrowLeft" || key === "a" || key === "A" ? -1 : key === "ArrowRight" || key === "d" || key === "D" ? 1 : 0);
    const down = (event: KeyboardEvent) => {
      const dir = direction(event.key);
      if (dir && !(event.target as HTMLElement).closest?.("input, textarea")) {
        event.preventDefault();
        if (view === "ready") go();
        if (!paused) steer(game.current, dir);
        return;
      }
      if (typing(event)) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (event.repeat) return;
        if (paused) setPaused(false);
        else if (view === "ready") go();
        else if (view === "clear" || view === "over") proceed();
      } else if ((event.key === "p" || event.key === "P" || event.key === "Escape") && view === "play") setPaused(value => !value);
    };
    const up = (event: KeyboardEvent) => { const dir = direction(event.key); if (dir && game.current.steer === dir) steer(game.current, 0); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("কাগজের উড়োজাহাজ ১২৩৪ পয়েন্ট").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // The canvas: a relative drag, so the finger can sit anywhere and never covers the plane.
  function onDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    if (paused) { setPaused(false); return; }
    if (view === "ready") go();
    if (game.current.phase !== "play") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX };
  }
  function onMove(event: PointerEvent<HTMLCanvasElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId || paused) return;
    dragBy(game.current, ((event.clientX - current.x) / (scene.current.scale || 1)) * DRAG_GAIN);
    current.x = event.clientX;
  }
  function onUp(event: PointerEvent<HTMLCanvasElement>) { if (drag.current?.id === event.pointerId) drag.current = null; }

  // The tap alternative: hold ◀ or ▶.
  function holdDown(event: PointerEvent<HTMLButtonElement>, dir: number) {
    if (!event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (paused) setPaused(false);
    if (view === "ready") go();
    steer(game.current, dir);
  }
  function holdUp(dir: number) { if (game.current.steer === dir) steer(game.current, 0); }

  const won = !!result && result.stars > 0;
  const proceed = () => (won && level < LEVEL_COUNT ? play(level + 1) : again());
  const spec = LEVELS[level - 1];
  const near = card && result ? nearLine(card, result.goal, result.left) : "";
  const stageLine = paused ? "থামানো আছে।" : view === "ready" ? (!allStars ? "আঙুল রেখে ডানে-বাঁয়ে টানো। কাগজের বল প্লেন নিজেই ছোড়ে।" : spec.news) : "";

  return (
    <div className="ku">
      <div className="ku-play">
        {friend && (
          <section className="ku-friend" aria-labelledby="ku-friend-title">
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.score)} পয়েন্ট`} />
            <div>
              <p className="ku-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
              <h2 id="ku-friend-title">{friendBanner(friend)}</h2>
              <p>{friendNote(friend)}</p>
            </div>
          </section>
        )}

        <p className="ku-level"><span><b>{levelLabel(level)}</b></span> <span className="ku-level-stars" aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></p>

        <div className="ku-stage" ref={stage}>
          <canvas ref={canvas} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="img"
            aria-label="বর্ষার আকাশে কাগজের উড়োজাহাজ। আঙুল ডানে-বাঁয়ে টানলে প্লেন সরে।" />
          <div className="ku-hud" aria-hidden="true">
            <span className="ku-score"><span ref={scoreEl} /><small>পয়েন্ট</small></span>
            <span className="ku-clouds"><small>মেঘ</small><span ref={cloudsEl} /></span>
            <span className="ku-dry" ref={dryEl} data-wet="0"><small>শুকনো</small><i /><i /><i /></span>
          </div>
          <span className="ku-combo" ref={comboEl} aria-hidden="true" />
          {stageLine && view !== "play" && <p className="ku-hint">{stageLine}</p>}
          {paused && <button type="button" className="kit-primary ku-resume" onClick={() => setPaused(false)}>চালিয়ে যাও</button>}
        </div>

        <p className="ku-sr" aria-live="polite">{news}</p>

        {(view === "clear" || view === "over") && result && card ? (
          <div className="ku-over">
            <p className="ku-over-kicker">{won ? clearLine(level) : "তিনবার ভিজে প্লেন নেতিয়ে পড়ল।"}</p>
            {won && <StarReveal count={result.stars} />}
            <p className="ku-final"><b>{bn(card.score)}</b> পয়েন্ট</p>
            <p className="ku-tally">মেঘ {card.popped >= result.goal ? `${bn(card.popped)}টা` : `${bn(card.popped)}/${bn(result.goal)}`} · রোদ {bn(card.suns)} · {card.hits ? `ভিজেছে ${bn(card.hits)} বার` : "একবারও ভেজেনি"}</p>
            {near && <p className="ku-near">{near}</p>}
            {result.record ? <p className="ku-best">নতুন রেকর্ড! এই লেভেলে এই ফোনে এটাই সেরা।</p> : best !== null && <p className="ku-best">এই লেভেলে এই ফোনের সেরা: {bn(best)} পয়েন্ট</p>}
            {versus && <p className="ku-versus">{versus}</p>}
            <div className="ku-over-actions">
              {won && level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => play(level + 1)}>পরের লেভেল</button>}
              <button type="button" className={won && level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => again()}>{won ? "আবার খেলো" : "আরেকবার"}</button>
            </div>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন আকাশে খেলো</button>}
          </div>
        ) : view === "ready" ? (
          <div className="ku-controls">
            <button type="button" className="kit-primary ku-go" onClick={go}>উড়াও</button>
            <p className="ku-goal">★ পার হলে · ★ {bn(goal)}টা মেঘ ফাটালে · ★ একবারও না ভিজলে</p>
          </div>
        ) : (
          <div className="ku-controls ku-steer">
            {[-1, 1].map(dir => (
              <button key={dir} type="button" className="ku-arrow" aria-label={dir < 0 ? "বাঁয়ে সরাও" : "ডানে সরাও"}
                onPointerDown={event => holdDown(event, dir)} onPointerUp={() => holdUp(dir)} onPointerCancel={() => holdUp(dir)} onContextMenu={event => event.preventDefault()}
                onClick={event => { if (event.detail === 0) dragBy(game.current, dir * 10); }}>
                <span aria-hidden="true">{dir < 0 ? "◀" : "▶"}</span>{dir < 0 ? "বাঁয়ে" : "ডানে"}
              </button>
            ))}
          </div>
        )}

        <div className="ku-toggles">
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact onChange={on => { if (!on) wind.current = null; else if (game.current.phase === "play" && !paused) startWind(); }} />
          {view === "play" && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
        </div>

        <details className="ku-levels">
          <summary>সব লেভেল <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
          <p>চার জায়গায় ২০টা লেভেল, প্রতি পাঁচ নম্বরে কালবৈশাখী। পার হলে ১ তারা, যথেষ্ট মেঘ ফাটালে আরেকটা, একবারও না ভিজলে আরেকটা।</p>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={next => play(next)} />
        </details>
      </div>

      {card && result && (
        <section className="ku-result" id="result" aria-labelledby="ku-result-title">
          <h2 id="ku-result-title">লেভেল {bn(card.level)}, <em>{bn(card.score)} পয়েন্ট</em></h2>
          <p>{versus || humanLine(card, result.goal)}</p>
          <div className="ku-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ku-card-summary" />
              <figcaption id="ku-card-summary" className="ku-sr">কাগজের উড়োজাহাজ{card.name && `, ${card.name}`}: {levelLabel(card.level)}, {bn(card.score)} পয়েন্ট। {humanLine(card, result.goal)}</figcaption>
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ku-share">
              <label className="ku-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="kagojer-urojahaj.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু একই আকাশ পাবে: একই মেঘ, একই ফোঁটা, একই কালবৈশাখী।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
