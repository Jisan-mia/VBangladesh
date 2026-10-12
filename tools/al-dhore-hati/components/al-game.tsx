"use client";
// IP: what we avoided — no endless-runner or line-tracing app's look, characters, coins or HUD; ours is a made-up Bangladeshi paddy field drawn fresh, a man in a লুঙ্গি and গামছা walking a clay আল, with goats, egrets and four times of day.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawScene, makeLayers, type Layers } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { levelSpec, newThing, LEVEL_COUNT, SCENE_NAME, SCENES } from "../lib/levels";
import {
  bannerNote, bn, caption, clearLine, compareLine, feat, fellLine, humanLine, levelLabel, nearMissLine, parseShared, sharedHash, slipLine, streakLine,
  BLEAT_LINE, NEAR_LINE, type Shared,
} from "../lib/link";
import { birds, bleat, footstep, squelch, stepUp, windLoop } from "../lib/sound";
import { dragBy, metres, newGame, start, starsOf, step, windAt, H, MAX_SLIPS, PX_PER_M, SLIP_TIME, W, type Game, type SlipReason } from "../lib/walk";

const TOOL = "al-dhore-hati";
const MAX_WIDTH = 480;
/** Slow mode walks at this pace (the wind too); sideways moves keep full speed. */
const SLOW = 0.6;
/** A finger that moves this many CSS px is dragging, not holding a side. */
const DRAG_START = 8;

type Phase = "ready" | "walk" | "won" | "fell";
type Result = { slips: number; dry: number; left: number; stars: number; improved: boolean; reason: SlipReason | null; newBest: boolean };
type Press = { side: -1 | 1; x: number; drag: boolean };

function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    scale: 1,
    layers: null as Layers | null,
    game: newGame(1, 1) as Game,
    paused: false, calm: false, reduced: false,
    presses: new Map<number, Press>(),
    keys: { left: false, right: false },
    wind: null as ReturnType<typeof windLoop> | null,
    shownMetres: -1, shownWind: 0, shownSlips: -1,
  };
}

export function AlGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [call, setCall] = useState("");
  const [callKey, setCallKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [seed, setSeed] = useState(1);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(TOOL);
  const [live] = useState(makeLive);

  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const chosen = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const meter = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const windChip = useRef<HTMLParagraphElement>(null);
  const feet = useRef<HTMLParagraphElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const spec = levelSpec(level);
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = result && phase === "won" ? { level, seed, slips: result.slips, dry: result.dry, name } : null;
  const state = shared ? sharedHash(shared) : "";

  function stopWind() { live.wind?.stop(); live.wind = null; }

  function paint() {
    const k = live.scale * Math.min(2, window.devicePixelRatio || 1);
    live.layers = makeLayers(live.game.field.spec.scene, k, live.layers);
  }

  function say(text: string) { setCall(text); setCallKey(key => key + 1); }

  function clearInput() {
    live.presses.clear();
    live.keys.left = live.keys.right = false;
    live.game.dir = 0; live.game.target = null;
  }

  /** A fresh field at `next`. Restarting takes one frame. */
  function startLevel(next: number, gameSeed = newSeed(), play = true) {
    stopWind();
    const before = live.game.field.spec.scene;
    live.game = newGame(next, gameSeed);
    if (play) start(live.game);
    live.paused = false;
    live.shownMetres = live.shownSlips = -1;
    clearInput();
    if (live.game.field.spec.scene !== before && live.context) paint();
    setLevel(next); setSeed(gameSeed); setCall(""); setResult(null); setPaused(false);
    setPhaseState(play ? "walk" : "ready");
    if (!play) draw();
  }

  function pickLevel(next: number) { chosen.current = true; startLevel(next); }

  function begin() {
    if (phase !== "ready") return;
    chosen.current = true;
    start(live.game);
    sfx.tap();
    setPhaseState("walk");
  }

  function finish(cleared: boolean) {
    stopWind();
    clearInput();
    const game = live.game, total = levelSpec(game.field.spec.level).metres;
    const dry = cleared && game.slips === 0 ? total : Math.max(1, Math.min(total, metres(game.bestDry)));
    const before = best;
    const newBest = submitBest(dry) && before !== null && dry > before;
    const left = Math.max(1, Math.ceil(total - game.d / PX_PER_M));
    if (!cleared) {
      setResult({ slips: game.slips, dry, left, stars: 0, improved: false, reason: game.slipReason, newBest });
      setPhaseState("fell");
      sfx.lose();
      return;
    }
    const stars = starsOf(game.slips, true), had = levels.stars[game.field.spec.level] ?? 0;
    levels.record(game.field.spec.level, stars);
    setResult({ slips: game.slips, dry, left: 0, stars, improved: had > 0 && stars > had, reason: null, newBest });
    setPhaseState("won");
    const colors = ["#ffd23f", "#3d6b21", "#f4eedc", "#c8323c", "#79b04a"];
    if (game.field.spec.level === LEVEL_COUNT) { sfx.levelUp(); confetti({ colors }); }
    else if (stars === 3 || newBest) { sfx.win(); confetti({ colors }); }
    else sfx.good();
  }

  /** Preview images only (`&og=1` on a link): the friend's field shown as cleared dry, so the card draws without playing. Saves nothing. */
  function demo(found: Shared) {
    live.game.d = live.game.field.length;
    live.game.phase = "done";
    setName(found.name);
    setResult({ slips: found.slips, dry: found.dry, left: 0, stars: starsOf(found.slips, true), improved: false, reason: null, newBest: false });
    setPhaseState("won");
  }

  function handleEvents() {
    const game = live.game;
    for (const event of game.events) {
      if (event.type === "step") footstep(event.foot);
      else if (event.type === "slip") { squelch(); say(slipLine(event.reason)); shake(board.current); }
      else if (event.type === "back") stepUp();
      else if (event.type === "near") { sfx.tick(); say(NEAR_LINE); }
      else if (event.type === "streak") { sfx.combo(event.metres / 20 - 1); say(streakLine(event.metres)); }
      else if (event.type === "bleat") { bleat(); say(BLEAT_LINE); }
      else if (event.type === "birds") birds();
      else if (event.type === "done") finish(true);
      else if (event.type === "fell") finish(false);
    }
    game.events.length = 0;
  }

  function tick(dt: number) {
    if (live.paused) return;
    const game = live.game;
    step(game, dt, slowRef.current ? SLOW : 1);
    if (game.events.length) handleEvents();
    if (game.field.wind.length && game.phase === "walk") {
      live.wind ??= windLoop();
      live.wind.set(Math.abs(windAt(game.field, game.d)) / game.field.spec.wind);
    } else if (live.wind && game.phase !== "walk") stopWind();
  }

  /** The walker's tilt into the mud, 0..1, while a slip plays. */
  function slipAmount(game: Game) {
    return game.phase === "slip" || (game.phase === "fell" && game.clock - game.slipAt < 3) ? Math.min(1, (game.clock - game.slipAt) / SLIP_TIME) : 0;
  }

  function draw() {
    const c = live.context, layers = live.layers, game = live.game;
    if (!c || !layers) return;
    c.save();
    c.scale(live.scale, live.scale);
    const slip = slipAmount(game), wind = windAt(game.field, game.d);
    drawScene(c, layers, {
      field: game.field, d: game.d, clock: game.clock, calm: live.calm, wind: game.phase === "walk" ? wind : 0,
      walker: { x: game.phase === "slip" || game.phase === "fell" ? game.slipX : game.x, d: game.d, slip, side: game.slipSide, ghost: game.phase === "walk" && game.d < game.graceTo && game.slips > 0, calm: live.calm, still: game.phase !== "walk" },
    });
    c.restore();
    // The HUD below the board, written straight to the DOM so a frame never re-renders React.
    const walked = Math.min(game.field.spec.metres, metres(game.d));
    if (walked !== live.shownMetres) {
      live.shownMetres = walked;
      if (meter.current) meter.current.textContent = `${bn(walked)}/${bn(game.field.spec.metres)} মিটার`;
      if (bar.current) bar.current.style.transform = `scaleX(${game.d / game.field.length})`;
    }
    if (game.slips !== live.shownSlips) {
      live.shownSlips = game.slips;
      if (feet.current) feet.current.dataset.slips = String(game.slips);
    }
    const shownWind = game.phase === "walk" && Math.abs(wind) > 3 ? Math.sign(wind) : 0;
    if (shownWind !== live.shownWind && windChip.current) {
      live.shownWind = shownWind;
      windChip.current.textContent = shownWind > 0 ? "বাতাস ডানে →" : shownWind < 0 ? "← বাতাস বাঁয়ে" : "";
    }
  }

  const looping = !paused && phase === "walk" && boardInView;
  useGameLoop(tick, draw, looping);

  useEffect(() => {
    if (!looping) stopWind();
  }, [looping]);

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    live.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const scale = width / W, height = Math.round(H * scale);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      Object.assign(live, { scale, context: fitCanvas(element, width, height) });
      paint();
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      chosen.current = true;
      setFriend(found);
      startLevel(found.level, found.seed, false);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(found);
    };
    const hide = () => {
      if (!document.hidden) return;
      stopWind();
      clearInput();
      const game = live.game;
      if (game.phase === "walk" || game.phase === "slip") { live.paused = true; setPaused(true); }
    };
    setSite(window.location.host);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopWind();
    };
  }, []);

  // Open at the furthest field reached once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    startLevel(levels.unlocked, newSeed(), false);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`আল ধরে হাঁটি লেভেল ১২৩ রাফি মিটার ${levelLabel(level)} একবারও না পিছলে`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  function resume() {
    live.paused = false;
    setPaused(false);
  }

  /** Held sides from fingers and arrow keys; a dragging finger steers on its own. */
  function updateHold() {
    let sum = (live.keys.right ? 1 : 0) - (live.keys.left ? 1 : 0), dragging = false;
    for (const press of live.presses.values()) { if (press.drag) dragging = true; else sum += press.side; }
    live.game.dir = sum > 0 ? 1 : sum < 0 ? -1 : 0;
    if (!dragging) live.game.target = null;
  }

  // ---- keys: ← → (or A D) held move the feet; Space or Enter starts, resumes and goes on ----
  const keys = useRef<{ down: (event: KeyboardEvent) => void; up: (event: KeyboardEvent) => void }>({ down: () => {}, up: () => {} });
  keys.current = {
    down(event) {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], button:not(.al-pad), a, summary") || !boardInView) return;
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a" || key === "arrowright" || key === "d") {
        event.preventDefault();
        if (live.paused) return;
        if (phase === "ready") begin();
        if (key === "arrowleft" || key === "a") live.keys.left = true; else live.keys.right = true;
        updateHold();
        return;
      }
      if (key !== " " && key !== "enter") return;
      event.preventDefault();
      if (event.repeat) return;
      if (live.paused) resume();
      else if (phase === "ready") begin();
      else if (phase === "fell") startLevel(level, rival ? seed : newSeed());
      else if (phase === "won") pickLevel(level < LEVEL_COUNT ? level + 1 : level);
    },
    up(event) {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") live.keys.left = false;
      else if (key === "arrowright" || key === "d") live.keys.right = false;
      else return;
      updateHold();
    },
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current.down(event), up = (event: KeyboardEvent) => keys.current.up(event);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ---- pointer on the field: hold the left or right half to step that way, or press and drag to steer ----
  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest(".al-overlay")) return;
    if (phase === "ready") begin();
    else if (phase !== "walk" || live.paused) return;
    const rect = event.currentTarget.getBoundingClientRect();
    live.presses.set(event.pointerId, { side: event.clientX < rect.left + rect.width / 2 ? -1 : 1, x: event.clientX, drag: false });
    updateHold();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onBoardMove(event: ReactPointerEvent<HTMLDivElement>) {
    const press = live.presses.get(event.pointerId);
    if (!press) return;
    const width = event.currentTarget.getBoundingClientRect().width || W;
    if (!press.drag) {
      if (Math.abs(event.clientX - press.x) < DRAG_START) return;
      press.drag = true;
      live.game.target = live.game.x;
      updateHold();
    }
    dragBy(live.game, (event.clientX - press.x) * (W / width));
    press.x = event.clientX;
  }
  function onRelease(event: ReactPointerEvent<HTMLElement>) {
    if (!live.presses.delete(event.pointerId)) return;
    updateHold();
  }

  // ---- the two big buttons under the field: hold one to step that way ----
  function onButtonDown(event: ReactPointerEvent<HTMLButtonElement>, side: -1 | 1) {
    event.preventDefault();
    if (phase !== "walk" || live.paused) return;
    live.presses.set(event.pointerId, { side, x: event.clientX, drag: false });
    updateHold();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }

  const total = totalStars(levels.stars);
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const newcomer = !levels.stars[1] && level === 1 && !friend;
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });

  function statusLine() {
    if (phase === "ready") return newThing(level);
    if (newcomer) return "আঙুল চেপে টানো, বা বাঁ-ডান পাশ চেপে ধরে রাখো।";
    return "পা থাকুক আলের মাঝখানে।";
  }

  return (
    <div className="al" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="al-friend" aria-labelledby="al-friend-title">
          <h2 id="al-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend.name)}</p>
        </section>
      )}

      <div className="al-hud">
        <p className="al-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        <p className="al-wind" ref={windChip} aria-hidden="true" />
      </div>

      <div className="al-board" ref={board} data-phase={phase} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onRelease} onPointerCancel={onRelease}>
        <canvas ref={canvas} role="img" aria-label={`ধানখেতের মাঝে সরু আল। ${SCENE_NAME[spec.scene]}, ${bn(spec.metres)} মিটার।${spec.puddles ? " আলে পানি জমেছে।" : ""}${spec.goats ? " আলে ছাগল চরছে।" : ""}${spec.wind ? " বাতাস বইছে।" : ""}`} />
        {call && phase === "walk" && <p className="al-call" aria-hidden="true" key={callKey}>{call}</p>}
        {phase === "ready" && <p className="al-hint" aria-hidden="true">চাপলেই হাঁটা শুরু</p>}
        {paused && (
          <div className="al-overlay">
            <p>হাঁটা থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      <div className="al-track">
        <p className="al-feet" ref={feet} data-slips="0" aria-hidden="true">
          {Array.from({ length: MAX_SLIPS }, (_, index) => <span key={index} />)}
        </p>
        <span className="al-bar" aria-hidden="true"><span ref={bar} /></span>
        <p className="al-metres" ref={meter}>০/{bn(spec.metres)} মিটার</p>
      </div>

      {phase === "won" && result ? (
        <div className="al-end" role="status">
          <StarReveal count={result.stars} />
          <p className="al-end-line">{clearLine(level)}</p>
          <p className="al-end-note">
            {result.slips === 0 ? "একবারও পিছলাওনি।" : `${result.slips === 1 ? "একবার" : "দুবার"} পিছলেছ।`}{" "}
            {rival ? compareLine(result, rival, rival.name)
              : result.newBest ? `নতুন রেকর্ড: টানা ${bn(result.dry)} মিটার শুকনো পায়ে!`
              : result.improved ? `এই লেভেলে নতুন রেকর্ড, ${bn(result.stars)} তারা!` : nearMissLine(result.slips)}
          </p>
          <div className="al-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => pickLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => pickLevel(level)}>আবার খেলো</button>
          </div>
          {shared && <button type="button" className="kit-link al-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
        </div>
      ) : phase === "fell" && result ? (
        <div className="al-end al-fell" role="status">
          <p className="al-fell-title">তিনবার কাদায় পা পড়েছে</p>
          <p className="al-fell-line">{fellLine(result.left, result.reason)}</p>
          <p className="al-end-note">
            {rival ? `${rival.name || "বন্ধু"} এই খেত ${rival.slips === 0 ? "একবারও না পিছলে" : `${bn(rival.slips)} বার পিছলে`} পার হয়েছিল। ` : ""}
            {result.newBest ? `তবু নতুন রেকর্ড: টানা ${bn(result.dry)} মিটার শুকনো পায়ে।` : ""}
          </p>
          <button type="button" className="kit-primary al-again" onClick={() => startLevel(level, rival ? seed : newSeed())}>আরেকবার</button>
        </div>
      ) : (
        <>
          <p className="al-status">{statusLine()}</p>
          {phase === "ready" ? (
            <button type="button" className="al-start" onClick={begin}>শুরু করো</button>
          ) : (
            <div className="al-pads">
              <button type="button" className="al-pad" aria-label="বাঁয়ে সরো (চেপে ধরে রাখো)" disabled={paused}
                onPointerDown={event => onButtonDown(event, -1)} onPointerUp={onRelease} onPointerCancel={onRelease} onContextMenu={event => event.preventDefault()}>
                <span aria-hidden="true">◀</span> বাঁয়ে
              </button>
              <button type="button" className="al-pad" aria-label="ডানে সরো (চেপে ধরে রাখো)" disabled={paused}
                onPointerDown={event => onButtonDown(event, 1)} onPointerUp={onRelease} onPointerCancel={onRelease} onContextMenu={event => event.preventDefault()}>
                ডানে <span aria-hidden="true">▶</span>
              </button>
            </div>
          )}
          <p className="al-sr" role="status" aria-live="polite">{phase === "walk" ? call : ""}</p>
        </>
      )}

      <div className="al-prefs">
        <button type="button" className="al-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={() => { live.wind = null; }} />
        {best !== null && <p className="al-best">টানা শুকনো হাঁটা: <b>{bn(best)} মিটার</b></p>}
      </div>

      <details className="al-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="al-stages">{SCENES.map((scene, index) => `${bn(index * 5 + 1)}–${bn(index * 5 + 5)} ${SCENE_NAME[scene]}`).join(" · ")}। ৪ থেকে আলে পানি, ৭ থেকে ছাগল, ১১ থেকে বাতাস।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} onPick={pick => { pickLevel(pick); toTop(); }} />
      </details>

      <section className="al-result" id="result" ref={resultBox} aria-labelledby="al-result-title">
        <h2 id="al-result-title">{shared ? <><em>{bn(spec.metres)} মিটার</em> আল পার হলে</> : "খেত পার হলে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared) : "একটা খেত পার হলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই খেত, একই আল পাবে।"}</p>
        {shared && result && (
          <div className="al-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`আল ধরে হাঁটির কার্ড: ${levelLabel(level)}, ${bn(spec.metres)} মিটার, ${result.slips === 0 ? "একবারও না পিছলে" : `${bn(result.slips)} বার পিছলে`}, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="al-share">
              <label className="al-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`al-dhore-hati-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই খেত, একই আল পাবে। পিছলানোর হিসাবটা তোমার ফোনের।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

