"use client";
// IP: what we avoided — no name, logo, colours, sounds or look from the old phone game with the falling ball; no red ball, no spike rows, no LCD style. Ours is a glass marble on stair steps, brick parapets and bamboo planks, a striped awning edge at the top and clay cactus pots, all drawn fresh from plain shapes.

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, fitCanvas, MAX_NAME, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal, Stars } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { drawBackground, drawCeiling, drawMarble, drawRows, drawWarning } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  newRun, openColours, scoreOf, stageOf, step, BONUS, CHANCES, CLEAR_STAGE, H, HURT, LAND, MARBLES, OVER, PICK, R, RESPAWN, STAGE_COUNT, STAGES, TOP, W,
  type Run,
} from "../lib/game";
import { bn, caption, cardHash, compareLine, friendBanner, friendNote, humanLine, nearLine, parseCard, reachedStage, stageName, type Card } from "../lib/result";
import { landClick, oof, rollHum, ting } from "../lib/sound";

const TOOL = "marble-sinri";
const COLOUR_KEY = "ektukhani-marble-sinri-colour";
const SLOW = 0.6;
type View = "ready" | "play" | "over";
type Cleared = Array<{ stage: number; stars: number }>;
type Result = { card: Card; record: boolean; best: number | null; cleared: Cleared };
type Toast = { id: number; text: string; sub?: string; stars?: number };

const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const HURT_LINES = { cactus: "উফ! ক্যাকটাস।", top: "ওপরে ঠেকে গেল।", bottom: "নিচে পড়ে গেল।" } as const;

function layer(width: number, height: number, ratio: number, scale: number, paint: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale * ratio)); canvas.height = Math.max(1, Math.round(height * scale * ratio));
  const c = canvas.getContext("2d");
  if (c) { c.scale(scale * ratio, scale * ratio); paint(c); }
  return canvas;
}

export function MarbleGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const run = useRef<Run>(newRun(1, 1));
  const art = useRef({ context: null as CanvasRenderingContext2D | null, scale: 1, ratio: 1, bgs: [] as HTMLCanvasElement[], ceiling: null as HTMLCanvasElement | null, warning: null as HTMLCanvasElement | null });
  // Held sides, counted on press and release (never per frame): pointers on the board or buttons, and arrow keys.
  const held = useRef({ sides: new Map<string, -1 | 1>(), left: 0, right: 0, last: 0 as -1 | 0 | 1 });
  const hum = useRef<ReturnType<typeof rollHum> | null>(null);
  const frame = useRef(0);
  const shown = useRef({ score: -1, marbles: -1, chances: -1, stage: -1 });
  const colourRef = useRef(0);
  const chosen = useRef(false);
  const toastTimer = useRef(0);

  const [view, setView] = useState<View>("ready");
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState(1);
  const [hud, setHud] = useState({ score: 0, marbles: 0, chances: CHANCES, streak: 0, stage: 0 });
  const [toast, setToast] = useState<Toast | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Card | null>(null);
  const [colour, setColourState] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, STAGE_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${stage}`);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const viewRef = useRef(view);
  viewRef.current = view;

  const open = openColours(levels.stars);
  const card: Card | null = result ? { ...result.card, name: cleanName(name) } : null;
  const state = card ? cardHash(card) : "";
  const rival = friend && friend.seed === run.current.seed && friend.stage === stage ? friend : null;
  const allStars = totalStars(levels.stars);
  const unlocked = Math.max(levels.unlocked, friend?.stage ?? 1);

  function setColour(next: number) {
    colourRef.current = next; setColourState(next);
    try { localStorage.setItem(COLOUR_KEY, String(next)); } catch { /* private mode: fine */ }
  }
  function say(text: string, extra: Partial<Toast> = {}, ms = 1600) {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, ...extra });
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }
  function stopHum() { hum.current?.stop(); hum.current = null; }
  function release() { const h = held.current; h.sides.clear(); h.left = 0; h.right = 0; h.last = 0; }
  function press(id: string, side: -1 | 1) {
    const h = held.current, before = h.sides.get(id);
    if (before === side) return;
    if (before === -1) h.left--; else if (before === 1) h.right--;
    h.sides.set(id, side);
    if (side === -1) h.left++; else h.right++;
    h.last = side;
  }
  function lift(id: string) {
    const h = held.current, before = h.sides.get(id);
    if (before === undefined) return;
    h.sides.delete(id);
    if (before === -1) h.left--; else h.right--;
  }
  const direction = () => { const h = held.current; return h.last === -1 && h.left ? -1 : h.last === 1 && h.right ? 1 : h.left ? -1 : h.right ? 1 : 0; };

  function syncHud(force = false) {
    const r = run.current, s = shown.current, score = scoreOf(r), at = stageOf(r.deepest);
    if (!force && s.score === score && s.marbles === r.marbles && s.chances === r.chances && s.stage === at) return;
    Object.assign(s, { score, marbles: r.marbles, chances: r.chances, stage: at });
    setHud({ score, marbles: r.marbles, chances: r.chances, streak: r.streak, stage: at });
  }

  function newGame(next: number, seed = newSeed()) {
    stopHum();
    window.clearTimeout(toastTimer.current);
    run.current = newRun(seed, next);
    setStage(next); setView("ready"); setPaused(false); setResult(null); setToast(null);
    syncHud(true);
    draw();
  }
  function begin() {
    if (view !== "ready") return;
    setView("play");
    hum.current ??= rollHum();
  }
  function again(fresh = false) {
    if (fresh && friend) { setFriend(null); history.replaceState(null, "", window.location.pathname); }
    newGame(stage, rival && !fresh ? rival.seed : newSeed());
    if ((board.current?.getBoundingClientRect().top ?? 0) < 0) board.current?.scrollIntoView({ block: "center", behavior: slowRef.current ? "auto" : "smooth" });
  }

  function finish() {
    stopHum();
    release();
    const r = run.current, score = scoreOf(r);
    const record = submitBest(score) && best !== null;
    setResult({ card: { seed: r.seed, stage: r.stage, score, marbles: r.marbles, colour: colourRef.current, name: "" }, record, best, cleared: [...r.cleared] });
    setView("over");
    if (record) { sfx.win(); confetti({ colors: ["#2e7d6b", "#d64545", "#e8b923", "#3a9bd8", "#ffffff"] }); } else sfx.lose();
  }

  function clearedStage() {
    const r = run.current, last = r.cleared[r.cleared.length - 1];
    if (!last) return;
    const firstTime = !(levels.stars[last.stage] >= 1);
    levels.record(last.stage, last.stars);
    const fresh = firstTime && last.stage < MARBLES.length ? MARBLES[last.stage] : null;
    if (fresh) setColour(last.stage);
    say(`${STAGES[last.stage - 1].name} পার`, { stars: last.stars, sub: fresh ? `নতুন মার্বেল: ${fresh.name}` : last.stars < 3 ? "একবারও না পড়লে ৩ তারা" : "একবারও পড়োনি" }, 2400);
    if (last.stage === STAGE_COUNT) { sfx.levelUp(); confetti({ colors: ["#2e7d6b", "#e8b923", "#ffffff", "#d64545"] }); }
    else if (last.stars === 3) window.setTimeout(sfx.levelUp, 900);
  }

  function tick(dt: number) {
    const r = run.current, dir = direction(), x = r.x;
    step(r, slowRef.current ? dt * SLOW : dt, dir);
    const events = r.events;
    if (events) {
      if (events & HURT) {
        const kind = r.hurt ?? "bottom";
        if (kind === "cactus") oof(); else if (kind === "top") sfx.wrong(); else { sfx.drop(); sfx.whoosh(); }
        shake(board.current);
        if (!(events & OVER)) say(HURT_LINES[kind], { sub: r.chances === 1 ? "আর ১টা সুযোগ" : `আর ${bn(r.chances)}টা সুযোগ` });
      } else if (events & LAND) landClick();
      if (events & PICK) { ting(r.streak - 1); setHud(h => ({ ...h, streak: r.streak })); }
      if (events & BONUS) { window.setTimeout(sfx.good, 150); say("৫টা মার্বেল, একটা সুযোগ ফেরত"); }
      if (events & CLEAR_STAGE) clearedStage();
      if (events & HURT) setHud(h => ({ ...h, streak: 0 }));
      syncHud();
      if (events & OVER) { finish(); return; }
    }
    if (hum.current && ++frame.current % 3 === 0) hum.current.update(r.speed, !!r.on && r.wait === 0, r.x !== x);
  }

  function paintLayers() {
    const a = art.current;
    a.bgs = [];
    a.ceiling = layer(W, TOP + 10, a.ratio, a.scale, drawCeiling);
    a.warning = layer(W, TOP + 70, a.ratio, a.scale, drawWarning);
  }
  function draw() {
    const a = art.current, c = a.context, r = run.current;
    if (!c) return;
    const at = stageOf(r.deepest);
    const bg = a.bgs[at] ??= layer(W, H, a.ratio, a.scale, b => drawBackground(b, at));
    c.save();
    c.scale(a.scale, a.scale);
    c.drawImage(bg, 0, 0, W, H);
    drawRows(c, r.rows);
    if (r.chances > 0) {
      const p = r.wait > 0 ? 1 - r.wait / RESPAWN : 1;
      c.globalAlpha = 0.35 + 0.65 * p;
      drawMarble(c, r.x, r.y, r.roll, colourRef.current, R * (0.6 + 0.4 * p));
      c.globalAlpha = 1;
    }
    const near = (TOP + 90 - (r.y - R)) / 90;
    if (near > 0 && a.warning) { c.globalAlpha = Math.min(1, near); c.drawImage(a.warning, 0, 0, W, TOP + 70); c.globalAlpha = 1; }
    if (a.ceiling) c.drawImage(a.ceiling, 0, 0, W, TOP + 10);
    c.restore();
  }

  useGameLoop(tick, draw, view === "play" && !paused);

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    let laidOut = 0;
    const fit = () => {
      const width = element.clientWidth;
      if (!width || width === laidOut) return;
      laidOut = width;
      const a = art.current;
      a.context = fitCanvas(element, width, (width * H) / W);
      a.scale = width / W; a.ratio = Math.min(2, window.devicePixelRatio || 1);
      paintLayers();
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = Number(stored(COLOUR_KEY));
    if (Number.isInteger(saved) && saved > 0 && saved < MARBLES.length) { colourRef.current = saved; setColourState(saved); }
    const read = () => {
      const shared = parseCard(window.location.hash);
      if (!shared) return;
      chosen.current = true;
      newGame(shared.stage, shared.seed);
      // Preview images only (`&og=1` on a link): the friend's own run as a finished card, without saving anything on this phone.
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") !== "1") setFriend(shared);
      else {
        setResult({ card: { ...shared, name: "" }, record: false, best: null, cleared: [] });
        setName(shared.name);
        setView("over");
      }
    };
    read();
    setSite(window.location.host);
    const hide = () => {
      if (!document.hidden) return;
      release();
      stopHum();
      if (viewRef.current === "play") setPaused(true);
    };
    window.addEventListener("hashchange", read);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", read);
      document.removeEventListener("visibilitychange", hide);
      window.clearTimeout(toastTimer.current);
      stopHum();
    };
  }, []);

  // A returning player opens at the first stage that isn't three-starred yet; a link or a pick wins.
  useEffect(() => {
    if (!levels.loaded || chosen.current || view !== "ready") return;
    const first = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(at => (levels.stars[at] ?? 0) < 3) ?? levels.unlocked;
    if (first !== stage) newGame(first);
  }, [levels.loaded]);

  // A colour that isn't open on this phone (storage cleared) falls back to the first.
  useEffect(() => { if (levels.loaded && !open[colour]) setColour(0); }, [levels.loaded, colour]);

  // The roll stops with the game: paused, over, or the tab hidden.
  useEffect(() => {
    if (view !== "play" || paused) stopHum();
    else hum.current ??= rollHum();
  }, [view, paused]);

  useEffect(() => { draw(); }, [colour, view]);

  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    loadCardFonts(`মার্বেল-সিঁড়ি ১২৩ ধাপ রাফি ${STAGES.map(s => s.name).join(" ")}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  // Keys: ← → (or A, D) hold to roll; Space or Enter starts, resumes and plays again; P or Esc pauses.
  const keys = useRef<{ down: (event: KeyboardEvent) => void; up: (event: KeyboardEvent) => void }>({ down: () => {}, up: () => {} });
  keys.current.down = event => {
    const target = event.target as HTMLElement | null;
    if (event.ctrlKey || event.metaKey || event.altKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key.toLowerCase(), side = key === "arrowleft" || key === "a" ? -1 : key === "arrowright" || key === "d" ? 1 : 0;
    if (side) {
      if (view === "over") return;
      event.preventDefault();
      if (paused) setPaused(false);
      press(`key${side}`, side);
      begin();
      return;
    }
    if ((key === " " || key === "enter") && !target?.closest?.("button, a, summary")) {
      event.preventDefault();
      if (paused) setPaused(false);
      else if (view === "over") again();
      return;
    }
    if ((key === "p" || key === "escape") && view === "play") setPaused(p => !p);
  };
  keys.current.up = event => {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") lift("key-1");
    if (key === "arrowright" || key === "d") lift("key1");
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current.down(event), up = (event: KeyboardEvent) => keys.current.up(event);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // The board: hold its left or right half. Sliding across the middle switches sides.
  function sideOf(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX - rect.left < rect.width / 2 ? -1 : 1;
  }
  function onBoardDown(event: PointerEvent<HTMLDivElement>) {
    if (view === "over" || (event.target as Element).closest("button")) return;
    event.preventDefault();
    if (paused) { setPaused(false); return; }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
    press(`p${event.pointerId}`, sideOf(event));
    begin();
  }
  function onBoardMove(event: PointerEvent<HTMLDivElement>) { if (held.current.sides.has(`p${event.pointerId}`)) press(`p${event.pointerId}`, sideOf(event)); }
  function onUp(event: PointerEvent<HTMLElement>) { lift(`p${event.pointerId}`); }
  function holdButton(side: -1 | 1) {
    return {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (paused) { setPaused(false); return; }
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
        press(`p${event.pointerId}`, side);
        begin();
      },
      onPointerUp: onUp, onPointerCancel: onUp, onLostPointerCapture: onUp,
      onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    };
  }

  const reached = result ? reachedStage(result.card.score, result.card.stage) : hud.stage;
  const lastCleared = result?.cleared[result.cleared.length - 1];
  const near = result ? nearLine({ score: result.card.score, start: result.card.stage, best: result.best, cleared: result.cleared }) : "";
  const versus = rival && result ? compareLine(result.card.score, rival.score, rival.name) : "";
  const newcomer = stage === 1 && !levels.stars[1] && !friend;
  const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const);
  const line = paused ? "খেলা থেমে আছে।"
    : view === "ready" ? (newcomer ? "বাঁ বা ডান পাশ চেপে ধরো। কিনারা দিয়ে নিচের তাকে নামো।" : `${STAGES[stage - 1].name} থেকে শুরু। চেপে ধরলেই চলবে।`)
    : view === "play" ? (hud.score < 3 && newcomer ? "ওপরের লাল-সাদা দাগে ঠেকো না, ক্যাকটাস ছুঁয়ো না।" : "চেপে ধরো বাঁয়ে বা ডানে।")
    : "";

  return (
    <div className="ms" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="ms-friend" aria-labelledby="ms-friend-title">
          <p className="ms-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
          <h2 id="ms-friend-title">{friendBanner(friend)}</h2>
          <p>{friendNote(friend)}</p>
        </section>
      )}

      <div className="ms-hud">
        <p className="ms-where"><b>{stageName(view === "over" ? reached : hud.stage)}</b> · ধাপ {bn(view === "over" && result ? result.card.score : hud.score)}</p>
        <p className="ms-chances" role="img" aria-label={`${bn(CHANCES)}টার মধ্যে ${bn(hud.chances)}টা সুযোগ বাকি`}>
          {Array.from({ length: CHANCES }, (_, index) => <i key={index} data-on={index < hud.chances} aria-hidden="true" />)}
        </p>
        <p className="ms-picked" aria-label={`${bn(hud.marbles)}টা মার্বেল`}><span aria-hidden="true" />{bn(hud.marbles)}</p>
        {hud.streak >= 2 && view === "play" && <p className="ms-streak" key={hud.streak}><span className="gx-pop">টানা {bn(hud.streak)}</span></p>}
      </div>

      <div className="ms-board" ref={board} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={event => event.preventDefault()}>
        <canvas ref={canvas} role="img" aria-label={`কাচের মার্বেল, ${possessive(stageName(hud.stage))} তাকে। ধাপ ${bn(hud.score)}, ${bn(hud.chances)}টা সুযোগ বাকি।`} />
        {view === "ready" && !paused && (
          <div className="ms-halves" aria-hidden="true">
            <span>◀ চেপে ধরো</span>
            <span>চেপে ধরো ▶</span>
          </div>
        )}
        {toast && view === "play" && (
          <div className="ms-toast" key={toast.id} data-big={toast.stars !== undefined || undefined}>
            <b>{toast.text}</b>
            {toast.stars !== undefined && <StarReveal count={toast.stars} />}
            {toast.sub && <small>{toast.sub}</small>}
          </div>
        )}
        {paused && (
          <div className="ms-overlay">
            <p>খেলা থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
          </div>
        )}
      </div>
      <p className="ms-sr" aria-live="polite">{toast ? `${toast.text} ${toast.sub ?? ""}` : ""}</p>

      {view === "over" && result ? (
        <div className="ms-end" role="status">
          <p className="ms-end-kicker">{stageName(reached)} পর্যন্ত নামল</p>
          <p className="ms-end-score"><b>{bn(result.card.score)}</b> ধাপ{result.card.marbles > 0 && <small> · {bn(result.card.marbles)}টা মার্বেল</small>}</p>
          {lastCleared && <StarReveal count={lastCleared.stars} />}
          {result.cleared.length > 1 && (
            <p className="ms-end-stages">
              {result.cleared.map(entry => <span key={entry.stage}>{STAGES[entry.stage - 1].name} <Stars count={entry.stars} label={false} /><span className="ms-sr">{bn(entry.stars)} তারা</span></span>)}
            </p>
          )}
          <p className="ms-end-best">{result.record ? "নতুন রেকর্ড! এই তলা থেকে এই ফোনে এটাই সেরা।" : result.best !== null ? `এই ফোনে সেরা: ${bn(Math.max(result.best, result.card.score))} ধাপ` : ""}</p>
          {near && <p className="ms-end-near">{near}</p>}
          {versus && <p className="ms-end-versus">{versus}</p>}
          <button type="button" className="kit-primary ms-again" onClick={() => again()}>আরেকবার</button>
          <div className="ms-end-links">
            <button type="button" className="kit-link" onClick={() => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" })}>কার্ড দেখো ↓</button>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন সিঁড়িতে খেলো</button>}
          </div>
        </div>
      ) : (
        <>
          <p className="ms-line">{line}</p>
          <div className="ms-pads">
            <button type="button" aria-label="বাঁয়ে গড়াও" {...holdButton(-1)}><span aria-hidden="true">◀</span> বাঁয়ে</button>
            <button type="button" aria-label="ডানে গড়াও" {...holdButton(1)}>ডানে <span aria-hidden="true">▶</span></button>
          </div>
        </>
      )}

      <div className="ms-prefs">
        <button type="button" className="ms-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={on => { if (!on) hum.current = null; else if (view === "play" && !paused) hum.current ??= rollHum(); }} />
        {view === "play" && <button type="button" className="ms-pill" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
      </div>

      <details className="ms-drawer">
        <summary>সব তলা আর মার্বেল <span>★ {bn(allStars)}/{bn(STAGE_COUNT * 3)}</span></summary>
        <p>প্রতি তলা ২০ ধাপ। একবারও না পড়ে পার হলে ৩ তারা। নতুন তলা পার হলে নতুন রঙের মার্বেল খোলে। খোলা যেকোনো তলা থেকে শুরু করতে পারো।</p>
        <LevelGrid count={STAGE_COUNT} stars={levels.stars} unlocked={unlocked} current={stage} noun="তলা" onPick={pick => { chosen.current = true; newGame(pick); wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }} />
        <p className="ms-stage-names">{STAGES.map((s, index) => `${bn(index + 1)} ${s.name}`).join(" · ")}</p>
        <ul className="ms-colours" aria-label="মার্বেলের রং">
          {MARBLES.map((marble, index) => (
            <li key={marble.name}>
              <button type="button" disabled={!open[index]} aria-pressed={colour === index} onClick={() => setColour(index)}
                aria-label={open[index] ? marble.name : `${marble.name}, ${STAGES[index - 1].name} পার হলে খুলবে`}>
                <span className="ms-swatch" style={{ backgroundColor: marble.glass, color: marble.eye }} aria-hidden="true" />
                <small>{open[index] ? marble.name : `${STAGES[index - 1].name} পার হলে`}</small>
              </button>
            </li>
          ))}
        </ul>
      </details>

      <section className="ms-result" id="result" ref={resultBox} aria-labelledby="ms-result-title">
        <h2 id="ms-result-title">{card ? <>মার্বেল নামল <em>{bn(card.score)} ধাপ</em></> : "খেলা শেষে তোমার কার্ড"}</h2>
        <p>{card ? versus || humanLine(card.score, card.stage) : "খেলা শেষ হলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই সিঁড়ি পাবে: একই তাক, একই টব, একই মার্বেল।"}</p>
        {card && (
          <div className="ms-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ms-card-summary" />
              <figcaption id="ms-card-summary" className="ms-sr">মার্বেল-সিঁড়ির কার্ড{card.name && `, ${card.name}`}: {bn(card.score)} ধাপ, {stageName(reachedStage(card.score, card.stage))} পর্যন্ত। {humanLine(card.score, card.stage)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ms-share">
              <label className="ms-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`marble-sinri-${card.score}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint="বন্ধু লিংক খুললে একই সিঁড়ি পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
