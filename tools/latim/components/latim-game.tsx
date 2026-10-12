"use client";
// IP: what we avoided — no names, logos, characters, sounds or look from any spinning-top toy brand, battle-top cartoon or arena game; no launchers or battle rings; the wooden লাটিম, palm and surfaces are drawn fresh from plain shapes.

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, fitCanvas, hiss, loop, MAX_NAME, newSeed, sfx, shake, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { BADGES, BADGE_IDS, LEVEL_COUNT, LEVELS, SURFACES, WIND_STRAIGHT, badgesOf, canPick, newGame, nextMark, nudge, over as isOver, pickUp, readBadges, scoreOf, starsOf, step, swipeThrow, throwTop, windPower, type Badge } from "../lib/game";
import { drawScene, makeScene, resizeScene, sceneBump, sceneFall, sceneNudge, scenePalm, sceneSettled, sceneThrow, updateScene } from "../lib/scene";
import { bn, caption, cardHash, fallLine, friendBanner, friendNote, humanLine, parseCard, secs, stageLine, versusLine, type Card } from "../lib/result";

const TOOL = "latim";
const BADGE_KEY = "ektukhani-badges-latim";
const SLOW = 0.6;
type View = "ready" | "spin" | "settle" | "over";
type Sample = { x: number; y: number; t: number };

/** The top hits the ground: a wooden clack, then the rattle as it rolls to a stop. */
const clack = () => {
  tone(1250, 0.04, 0.16, "square", 0, 500); hiss(0.06, 0.12, 2500, "highpass");
  [0.12, 0.22, 0.3, 0.36, 0.41, 0.45].forEach((delay, index) => tone(900 - index * 60, 0.025, 0.07 * (1 - index / 7), "square", delay));
  buzz(20);
};
/** A pebble's tick, or a tin ridge's dull tonk. */
const bumpSound = (ridge: boolean) => ridge ? tone(420, 0.05, 0.06, "square", 0, 300) : tone(1600, 0.03, 0.05, "triangle");
const verdict = (power: number, straight: number) => power >= 0.75 && straight >= 0.75 ? "জোরালো আর সোজা!" : power >= 0.75 ? "জোরালো, তবে একটু বাঁকা" : straight >= 0.75 ? "সোজা, তবে আলতো" : "আলতো আর বাঁকা";
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

export function LatimGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef(newGame(1));
  const scene = useRef(makeScene());
  const hum = useRef<ReturnType<typeof loop> | null>(null);
  const hold = useRef({ active: false, held: 0, ticks: 0 });
  const swipe = useRef<{ id: number; samples: Sample[] } | null>(null);
  const meter = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const done = useRef(false);
  const timers = useRef<number[]>([]);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);

  const [view, setView] = useState<View>("ready");
  const [paused, setPaused] = useState(false);
  const [pickable, setPickable] = useState(false);
  const [holding, setHolding] = useState(false);
  const [throwNote, setThrowNote] = useState("");
  const [hint, setHint] = useState("");
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`);
  const [result, setResult] = useState<{ card: Card; stars: number; record: boolean; previousBest: number | null; fresh: Badge[]; fall: string } | null>(null);
  const [owned, setOwned] = useState<Badge[]>([]);
  const [friend, setFriend] = useState<Card | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [news, setNews] = useState("");

  const card: Card | null = result ? { ...result.card, name: cleanName(name) } : null;
  const state = card ? cardHash(card) : "";
  const rival = friend && friend.seed === game.current.seed && friend.level === level ? friend : null;
  const versus = rival && card ? versusLine(card.score, rival.score, rival.name) : "";
  const spec = LEVELS[level - 1];
  const allStars = totalStars(levels.stars);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);

  const draw = () => { if (context.current) drawScene(context.current, scene.current, game.current, hold.current.active ? windPower(hold.current.held) : 0); };
  const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));

  function setMeter(power: number, straight: number) {
    meter.current?.style.setProperty("--power", String(power));
    meter.current?.style.setProperty("--straight", String(straight));
  }
  function stopHum() { hum.current?.stop(); hum.current = null; }
  function startHum() {
    stopHum();
    const now = game.current;
    hum.current = loop("hum", 60 + 200 * now.omega);
    hum.current.set(0.25 + 0.75 * now.omega);
  }

  function start(seed: number, nextLevel: number) {
    stopHum();
    timers.current.forEach(clearTimeout); timers.current = [];
    game.current = newGame(seed, nextLevel);
    const keep = scene.current;
    scene.current = { ...makeScene(), bg: keep.bg, sprite: keep.sprite, spriteFor: keep.spriteFor };
    resizeScene(scene.current, keep.width, keep.height, keep.ratio);
    hold.current = { active: false, held: 0, ticks: 0 }; swipe.current = null; done.current = false; setHolding(false);
    setLevel(game.current.level); setView("ready"); setPaused(false); setPickable(false); setResult(null); setThrowNote(""); setHint(""); setNews("");
    setMeter(0, 0);
  }
  function play(nextLevel: number, seed = newSeed()) {
    start(seed, nextLevel);
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "center", behavior: slow ? "auto" : "smooth" });
  }
  function again(fresh = false) {
    if (fresh && friend) { setFriend(null); history.replaceState(null, "", window.location.pathname); }
    play(level, rival && !fresh ? rival.seed : newSeed());
  }

  function throwIt(power: number, straight: number) {
    if (!throwTop(game.current, power, straight)) return;
    setMeter(game.current.power, game.current.straight);
    setThrowNote(verdict(game.current.power, game.current.straight));
    setHint("");
    sceneThrow(scene.current, slow);
    sfx.whoosh(); tone(130, 0.12, 0.18, "sine", 0.18, 60);
    startHum();
    setView("spin");
  }

  function tapNudge() {
    const now = game.current, before = now.combo, outcome = nudge(now);
    if (!outcome) return;
    sceneNudge(scene.current, outcome, now.combo);
    if (outcome === "good") { sfx.combo(Math.min(9, now.combo - 1)); if (now.combo > before && now.combo % 5 === 0) buzz(12); }
    else if (outcome === "ok") sfx.tap();
    else { tone(180, 0.1, 0.1, "square", 0, 120); shake(stage.current); }
  }

  function tryPick() {
    const now = game.current, ok = pickUp(now);
    if (ok === null) return;
    stopHum(); setPickable(false);
    if (ok) { scenePalm(scene.current, now); sfx.pick(); later(250, sfx.good); }
    else { sceneFall(scene.current, now, slow); clack(); shake(stage.current); }
    setView("settle");
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    const now = game.current, score = scoreOf(now), stars = starsOf(score, now.level), palm = now.phase === "palm";
    const earned = badgesOf(score - now.bonus, palm, now.bestCombo, now.nudges);
    const before = readBadges(stored(BADGE_KEY)), fresh = earned.filter(id => !before.includes(id));
    const keep = BADGE_IDS.filter(id => before.includes(id) || earned.includes(id));
    try { localStorage.setItem(BADGE_KEY, JSON.stringify(keep)); } catch { /* private mode: fine */ }
    setOwned(keep);
    if (stars) levels.record(now.level, stars);
    const record = submitBest(score) && best !== null;
    setResult({ card: { seed: now.seed, level: now.level, score, palm, badges: earned, name: "" }, stars, record, previousBest: best, fresh, fall: fallLine(now.fall, palm) });
    setView("over");
    setNews(`${secs(score)} সেকেন্ড ঘুরল। ${stageLine(score, now.level)}`);
    // StarReveal chimes each star; the cheer comes after the last one.
    const after = 260 * (stars + 1);
    if (stars === 3 || record) later(after, () => { sfx.win(); confetti(); });
    else if (stars > 0) later(after, sfx.good);
  }

  useGameLoop(dt => {
    const now = game.current, d = slow ? dt * SLOW : dt;
    if (now.phase === "ready" && hold.current.active) {
      const held = hold.current;
      held.held += d;
      const power = windPower(held.held);
      setMeter(power, WIND_STRAIGHT);
      if (Math.floor(held.held / 0.16) > held.ticks) { held.ticks++; sfx.tick(); }
    }
    if (now.phase === "spin") {
      const bump = step(now, d);
      if (bump) { bumpSound(bump.ridge); sceneBump(scene.current, slow); }
      if (++frame.current % 3 === 0 && hum.current) {
        hum.current.set(0.25 + 0.75 * Math.max(0, now.omega));
        hum.current.pitch(60 + 200 * Math.max(0, now.omega) + 12 * now.wobble * Math.sin(now.sway * 2));
      }
      const may = canPick(now);
      if (may !== pickable) setPickable(may);
      if (isOver(now)) { stopHum(); setPickable(false); sceneFall(scene.current, now, slow); clack(); setView("settle"); }
    }
    updateScene(scene.current, now, d, slow);
    if (isOver(now) && view === "settle" && sceneSettled(scene.current, now)) finish();
  }, draw, !paused && (view === "spin" || view === "settle" || holding));

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge link opens a friend's stage.
    const read = () => { const shared = parseCard(window.location.hash); if (shared) { setFriend(shared); start(shared.seed, shared.level); } return shared; };
    read();
    setOwned(readBadges(stored(BADGE_KEY)));
    const onHash = () => { read(); };
    window.addEventListener("hashchange", onHash);
    setSite(window.location.host);
    return () => { window.removeEventListener("hashchange", onHash); timers.current.forEach(clearTimeout); stopHum(); };
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
      resizeScene(scene.current, width, height, Math.min(2, window.devicePixelRatio || 1));
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    loadCardFonts("লাটিম ১২.৪ সেকেন্ড নিচে টানো").then(draw).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      hold.current.active = false; setHolding(false);
      if (game.current.phase === "spin") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The loop sleeps in the hand and after the fall: redraw once whenever the stage changes.
  useEffect(() => { draw(); }, [view, level]);

  // The hum stops while paused and comes back with the spin.
  useEffect(() => {
    if (paused) stopHum();
    else if (game.current.phase === "spin" && !hum.current) startHum();
  }, [paused]);

  function beginHold() {
    if (game.current.phase !== "ready" || hold.current.active) return;
    hold.current = { active: true, held: 0, ticks: 0 };
    setHolding(true);
    sfx.tap();
  }
  function endHold() {
    const held = hold.current;
    if (!held.active) return;
    held.active = false;
    setHolding(false);
    if (held.held < 0.12) { setMeter(0, 0); setHint("বোতামটা একটু চেপে ধরে রাখো, বার ভরলে ছাড়ো।"); return; }
    throwIt(windPower(held.held), WIND_STRAIGHT);
  }

  // Space or Enter: hold to wind and release to throw, then tap to nudge. ↑ or H picks it up. P or Esc pauses.
  useEffect(() => {
    const typing = (event: KeyboardEvent) => event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).closest?.("input, textarea, select, button, a, summary, [contenteditable]");
    const down = (event: KeyboardEvent) => {
      if (typing(event)) return;
      const phase = game.current.phase;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (event.repeat) return;
        if (paused) setPaused(false);
        else if (view === "over") proceed();
        else if (phase === "ready") beginHold();
        else if (phase === "spin") tapNudge();
      } else if ((event.key === "ArrowUp" || event.key === "h" || event.key === "H") && phase === "spin" && !paused) { event.preventDefault(); tryPick(); }
      else if ((event.key === "p" || event.key === "P" || event.key === "Escape") && phase === "spin") setPaused(value => !value);
    };
    const up = (event: KeyboardEvent) => { if ((event.key === " " || event.key === "Enter") && hold.current.active) { event.preventDefault(); endHold(); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("লাটিম ১৮.৪ সেকেন্ড").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // The canvas: in the hand it reads a downward pull; while it spins every tap is a nudge.
  function onDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    if (paused) { setPaused(false); return; }
    const phase = game.current.phase;
    if (phase === "spin") { tapNudge(); return; }
    if (phase !== "ready" || hold.current.active) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    swipe.current = { id: event.pointerId, samples: [{ x: event.clientX, y: event.clientY, t: event.timeStamp }] };
  }
  function measure(samples: Sample[], height: number) {
    const first = samples[0], last = samples[samples.length - 1];
    const dx = (last.x - first.x) / height, dy = (last.y - first.y) / height, seconds = (last.t - first.t) / 1000;
    const from = samples.find(sample => last.t - sample.t <= 120) ?? first;
    const tail = from === last ? null : { dy: (last.y - from.y) / height, seconds: (last.t - from.t) / 1000 };
    // How far the path strays from the straight line between its ends, as a share of its length.
    const length = Math.hypot(dx, dy) || 1;
    let wiggle = 0;
    for (const sample of samples) wiggle = Math.max(wiggle, Math.abs((sample.x - first.x) / height * dy - (sample.y - first.y) / height * dx) / length);
    return { dx, dy, seconds, tail, wiggle: wiggle / length };
  }
  function onMove(event: PointerEvent<HTMLCanvasElement>) {
    const current = swipe.current;
    if (!current || current.id !== event.pointerId) return;
    current.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
    if (current.samples.length > 40) current.samples.splice(1, 1);
    const height = event.currentTarget.clientHeight || 1, { dx, dy, seconds, tail, wiggle } = measure(current.samples, height);
    scene.current.drag = Math.max(0, Math.min(1, dy / 0.5));
    const live = swipeThrow(dx, Math.max(dy, 0.12), seconds, tail, wiggle);
    if (live && dy > 0.03) setMeter(live.power, live.straight);
    draw();
  }
  function onUp(event: PointerEvent<HTMLCanvasElement>) {
    const current = swipe.current;
    if (!current || current.id !== event.pointerId) return;
    swipe.current = null;
    current.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
    const { dx, dy, seconds, tail, wiggle } = measure(current.samples, event.currentTarget.clientHeight || 1);
    const thrown = swipeThrow(dx, dy, seconds, tail, wiggle);
    if (thrown) throwIt(thrown.power, thrown.straight);
    else { scene.current.drag = 0; setMeter(0, 0); draw(); setHint(dy < -0.05 ? "ওপরে না, নিচের দিকে টানো।" : "আঙুল রেখে একটু লম্বা করে নিচে টানো।"); }
  }
  function onCancel() { swipe.current = null; scene.current.drag = 0; draw(); }

  function onMainDown(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    if (paused) { setPaused(false); return; }
    if (game.current.phase === "ready") { event.currentTarget.setPointerCapture?.(event.pointerId); beginHold(); }
    else tapNudge();
  }
  function onMainUp(event: PointerEvent<HTMLButtonElement>) { if (event.isPrimary) endHold(); }

  const won = !!result && result.stars > 0;
  const proceed = () => won && level < LEVEL_COUNT ? play(level + 1) : again();
  const score = result?.card.score ?? 0, mark = result ? nextMark(score, level) : 0;
  // The near miss, with the exact gap: to clearing, to the next star, or (at three stars) to this phone's best.
  const nearLine = !result ? "" : mark ? `আর ${secs(mark - score)} সেকেন্ড হলেই ${result.stars ? `${bn(result.stars + 1)} তারা` : "লেভেল পার"}।`
    : result.previousBest !== null && !result.record && result.previousBest > score ? `আর ${secs(result.previousBest - score + 1)} সেকেন্ড হলেই নতুন সেরা।` : "";
  const line = paused ? "থামানো আছে। চাপলেই আবার চলবে।"
    : hint ? hint
    : view === "ready" ? (level === 1 && !levels.stars[1] ? "লাটিমের ওপর থেকে আঙুল জোরে, সোজা নিচে টানো।" : `${spec.news} আঙুল জোরে, সোজা নিচে টানো।`)
    : view === "spin" ? (pickable ? "ঘোরা কমেছে। চাইলে হাতে তোলো, ৫ সেকেন্ড বোনাস।" : "টলতে দেখলে বিন্দু সবুজ মাথায় এলেই টোকা দাও।")
    : view === "settle" ? fallLine(game.current.fall, game.current.phase === "palm")
    : result?.fall ?? "";

  return (
    <div className="lt">
      <div className="lt-play">
        {friend && (
          <section className="lt-friend" aria-labelledby="lt-friend-title">
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${secs(friend.score)} সেকেন্ড`} />
            <div>
              <p className="lt-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
              <h2 id="lt-friend-title">{friendBanner(friend)}</h2>
              <p>{friendNote(friend)}</p>
            </div>
          </section>
        )}

        <p className="lt-level"><span><b>লেভেল {bn(level)}</b> · {SURFACES[spec.surface]}, {spec.name}</span> <span className="lt-level-stars" aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></p>

        <div className="lt-stage" ref={stage}>
          <canvas ref={canvas} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} role="img"
            aria-label={view === "ready" ? "হাতে ধরা লাটিম। আঙুল নিচে টানলে ছোড়া হবে।" : "ঘুরন্ত লাটিম"} />
          {paused && <button type="button" className="kit-primary lt-resume" onClick={() => setPaused(false)}>চালিয়ে যাও</button>}
        </div>

        <div className="lt-meter" ref={meter} aria-hidden="true">
          <span><i>জোরালো</i><b className="lt-power" /></span>
          <span><i>সোজা</i><b className="lt-straight" /></span>
          <em>{throwNote}</em>
        </div>
        <p className="lt-hint">{line}</p>
        <p className="lt-sr" aria-live="polite">{throwNote && view === "spin" ? `ছোড়া: ${throwNote}` : news}</p>

        {view === "over" && result ? (
          <div className="lt-over">
            <p className="lt-over-kicker">{stageLine(score, level)}</p>
            <StarReveal count={result.stars} />
            <p className="lt-score"><b>{secs(score)}</b> সেকেন্ড{result.card.palm && <small> (হাতে তুলে +৫)</small>}</p>
            {nearLine && <p className="lt-near">{nearLine}</p>}
            <p className="lt-best">{result.record ? "নতুন রেকর্ড! এই ফোনে এই লেভেলে এটাই সেরা।" : best !== null ? `এই ফোনে এই লেভেলের সেরা: ${secs(best)} সেকেন্ড` : ""}</p>
            {versus && <p className="lt-versus">{versus}</p>}
            {result.fresh.length > 0 && <p className="lt-badge-new">নতুন পদক: {result.fresh.map(id => BADGES[id]).join(", ")}</p>}
            <div className="lt-over-actions">
              {won && level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => play(level + 1)}>পরের লেভেল</button>}
              <button type="button" className={won && level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => again()}>{won ? "আবার খেলো" : "আরেকবার"}</button>
            </div>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন উঠানে খেলো</button>}
          </div>
        ) : (
          <div className="lt-controls">
            <button type="button" className="kit-primary lt-main" data-view={view} disabled={view === "settle"}
              onPointerDown={onMainDown} onPointerUp={onMainUp} onPointerCancel={onMainUp} onContextMenu={event => event.preventDefault()}
              onClick={event => { if (event.detail === 0) { if (game.current.phase === "ready") throwIt(0.8, WIND_STRAIGHT); else tapNudge(); } }}>
              {paused ? "চালিয়ে যাও" : view === "ready" ? "চেপে ধরো, ছেড়ে দাও" : view === "spin" ? "টোকা দাও" : "পড়ে যাচ্ছে…"}
            </button>
            {pickable && view === "spin" && <button type="button" className="kit-secondary lt-pick" onPointerDown={event => { if (event.isPrimary) { event.preventDefault(); tryPick(); } }} onClick={event => { if (event.detail === 0) tryPick(); }}>হাতে তোলো</button>}
          </div>
        )}

        <div className="lt-toggles">
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact onChange={on => { if (on && game.current.phase === "spin" && !paused) startHum(); }} />
          {view === "spin" && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
        </div>

        <details className="lt-levels">
          <summary>সব লেভেল আর পদক <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
          <p>তিন জায়গায় ৯টা লেভেল: মাটির উঠান, পাকা মেঝে, টিনের চাল। নির্দিষ্ট সেকেন্ড ঘুরলে লেভেল পার, আরও বেশি ঘুরলে ২ বা ৩ তারা।</p>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={next => play(next)} />
          <ul className="lt-badges" aria-label="পদক">
            {BADGE_IDS.map(id => <li key={id} data-on={owned.includes(id)}><span aria-hidden="true">{owned.includes(id) ? "●" : "○"}</span>{BADGES[id]}<span className="lt-sr">{owned.includes(id) ? ", পেয়েছ" : ", এখনো পাওনি"}</span></li>)}
          </ul>
        </details>
      </div>

      {card && (
        <section className="lt-result" id="result" aria-labelledby="lt-result-title">
          <h2 id="lt-result-title">লাটিম ঘুরল <em>{secs(card.score)} সেকেন্ড</em></h2>
          <p>{versus || humanLine(card.score)}</p>
          <div className="lt-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="lt-card-summary" />
              <figcaption id="lt-card-summary" className="lt-sr">লাটিম{card.name && `, ${card.name}`}: লেভেল {bn(card.level)}, {secs(card.score)} সেকেন্ড। {humanLine(card.score)}</figcaption>
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="lt-share">
              <label className="lt-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="latim.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু একই উঠানে খেলবে: একই নুড়ি, একই ঢেউ, একই বাতাস।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
