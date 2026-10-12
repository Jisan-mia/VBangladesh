"use client";
// IP: what we avoided — no numbered tiles, no numbers anywhere on the board, no beige grid of rounded squares and no warm number colour ramp, no "2048" name or look; ours is a garden bed in a bamboo fence with round painted clay plates (সরা) showing a mango's life in drawings, nine stages that end, পাথর on some plots, a 5×5 plot, and our own seeded spawn rule (one in eight a চারা).

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, hiss, newSeed, sfx, tone, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawStage } from "../lib/art";
import { stageName, STONE, TOP, type Dir } from "../lib/board";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { freeStars, levelOf, levelStars, limitOf, move, shortBy, startGame, startLevel, threeStar, LEVEL_COUNT, type Game } from "../lib/game";
import { bn, caption, compareLine, feat, fromGame, goalText, parseShared, sharedHash, stageLine, type Shared } from "../lib/link";

const TOOL = "atir-aam";
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

/** Leaves brushing past: every swipe that moves something. */
const rustle = () => hiss(0.09, 0.05, 2800, "bandpass");
/** The signature: a rising three-note chord when a new stage grows, higher for each stage. */
const grow = (stage: number) => [0, 4, 7, 12].forEach((semi, i) => tone(330 * 2 ** ((semi + stage * 2) / 12), 0.26, 0.08, "triangle", i * 0.07));
/** A soft thump when a swipe moves nothing. */
const thump = () => { tone(150, 0.09, 0.07, "sine", 0, 110); buzz(10); };
const KEYS: Record<string, Dir> = { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3, w: 0, s: 1, a: 2, d: 3, W: 0, S: 1, A: 2, D: 3 };
const ARROWS: Array<{ dir: Dir; label: string; path: string }> = [
  { dir: 2, label: "বাঁয়ে সরাও", path: "M15 5l-7 7 7 7" },
  { dir: 0, label: "ওপরে সরাও", path: "M5 15l7-7 7 7" },
  { dir: 1, label: "নিচে সরাও", path: "M5 9l7 7 7-7" },
  { dir: 3, label: "ডানে সরাও", path: "M9 5l7 7-7 7" },
];

type Tile = { id: number; cell: number; stage: number; kind: "still" | "new" | "grown" | "dying" };
let nextId = 1;
const tilesFrom = (cells: readonly number[]): Tile[] => cells.flatMap((stage, cell) => stage > 0 ? [{ id: nextId++, cell, stage, kind: "still" as const }] : []);
/** Moves the drawn tiles along the slide's paths: merged pairs fade under the grown one, the new আঁটি pops in. */
function follow(tiles: readonly Tile[], next: Game): Tile[] {
  if (!next.last) return tilesFrom(next.cells);
  const at = new Map(tiles.filter(tile => tile.kind !== "dying").map(tile => [tile.cell, tile]));
  const out: Tile[] = [];
  for (const path of next.last.paths) { const tile = at.get(path.from); if (tile) out.push({ ...tile, cell: path.to, kind: path.merged ? "dying" : "still" }); }
  for (const { cell, stage } of next.last.grown) out.push({ id: nextId++, cell, stage, kind: "grown" });
  if (next.spawned) out.push({ id: nextId++, ...next.spawned, kind: "new" });
  return out;
}

/** Counts a number up quickly once it's shown (no animation in slow mode). */
function useCountUp(value: number, run: boolean, slow: boolean) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!run || slow || value < 10) { setShown(value); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => { const t = Math.min(1, (now - start) / 650); setShown(Math.round(value * (1 - (1 - t) ** 3))); if (t < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, run, slow]);
  return shown;
}

export function MangoGame() {
  const [game, setGameState] = useState<Game>(() => startGame(1));
  const [tiles, setTilesState] = useState<Tile[]>(() => tilesFrom(startGame(1).cells));
  const [undo, setUndo] = useState<Game | null>(null);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<{ stage: number; key: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [ended, setEnded] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [record, setRecord] = useState<number | null>(null);
  const [sprites, setSprites] = useState<string[]>([]);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const gameRef = useRef(game), tilesRef = useRef(tiles), streakRef = useRef(0);
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const press = useRef<{ id: number; x: number; y: number } | null>(null);
  const finished = useRef<Game | null>(null);
  const opened = useRef(false);
  const timers = useRef<number[]>([]);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [bestScore, submitScore] = useBest(TOOL);
  const [bestStage, submitStage] = useBest(`${TOOL}-stage`);
  const boardInView = useInView(board);

  const setGame = (next: Game) => { gameRef.current = next; setGameState(next); };
  const setTiles = (next: Tile[]) => { tilesRef.current = next; setTilesState(next); };
  const later = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const { level, size, cells, top, score, over, won } = game;
  const count = game.moves.length;
  const spec = level ? levelOf(level) : null;
  const failed = !!level && over && !won;
  const phase = over ? "over" : paused ? "paused" : count ? "playing" : "ready";
  const rival = friend && friend.level === level && (level || friend.seed === game.seed) ? friend : null;
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const shared = over && !failed ? fromGame(game, name) : null;
  const state = shared ? sharedHash(shared) : "";
  const result: CardData | null = over && !failed && count ? { level, count, score, top, name } : null;
  const earned = level ? (won ? levelStars(level, count) : 0) : freeStars(top);
  const shownScore = useCountUp(score, over, slow);

  // ---- moves ----
  function go(dir: Dir) {
    const current = gameRef.current;
    if (paused || current.over) return;
    const next = move(current, dir);
    if (!next) {
      thump();
      if (!slow) board.current?.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dir === 2 ? -6 : dir === 3 ? 6 : 0}px) translateY(${dir === 0 ? -6 : dir === 1 ? 6 : 0}px)` }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
      return;
    }
    const merges = next.last?.grown.length ?? 0;
    streakRef.current = merges ? streakRef.current + 1 : 0;
    setStreak(streakRef.current);
    rustle();
    for (let i = 0, base = Math.max(0, streakRef.current - 1); i < merges; i++) later(70 + i * 70, () => sfx.combo(Math.min(9, base + i)));
    if (next.top > current.top && !next.won) {
      later(120, () => grow(next.top));
      setToast({ stage: next.top, key: next.moves.length });
      later(1700, () => setToast(shown => shown?.key === next.moves.length ? null : shown));
      if (next.top > (bestStage ?? 0) && next.top >= TOP - 2) later(200, () => { sfx.levelUp(); confetti({ colors: ["#f2b632", "#e0602a", "#6fb544", "#2f7f3a", "#f6efdc"] }); });
    }
    setUndo(current);
    setGame(next);
    setTiles(follow(tilesRef.current, next));
    // the faded pairs leave once the slide has landed
    later(190, () => { const live = tilesRef.current.filter(tile => tile.kind !== "dying"); if (live.length !== tilesRef.current.length) setTiles(live); });
  }

  function takeBack() {
    if (!undo || paused || over) return;
    sfx.drop();
    setGame(undo);
    setTiles(tilesFrom(undo.cells));
    setUndo(null);
    streakRef.current = 0; setStreak(0);
  }

  function begin(next: Game) {
    clearTimers();
    setGame(next);
    setTiles(tilesFrom(next.cells));
    setUndo(null);
    setPaused(false);
    setEnded(false);
    setToast(null);
    setRecord(null);
    streakRef.current = 0; setStreak(0);
  }
  const playLevel = (next: number) => { if (next >= 1 && next <= LEVEL_COUNT) begin(startGame(0, next)); };
  const playFree = (seed = newSeed()) => begin(startGame(seed));
  /** "আরেকবার": the same plot for a level or a friend's run, a fresh seed otherwise. */
  const again = () => level ? playLevel(level) : playFree(rival ? rival.seed : undefined);
  function stopHere() {
    const current = gameRef.current;
    if (!current.moves.length || current.over) return;
    setEnded(true);
    setGame({ ...current, over: true });
  }

  // ---- the end of a run: save once, celebrate what's real ----
  useEffect(() => {
    if (!over || finished.current === game) return;
    finished.current = game;
    if (level) {
      if (!won) { later(150, sfx.lose); return; }
      levels.record(level, earned);
      later(150, () => grow(levelOf(level).target));
      later(400 + 260 * earned, earned === 3 ? () => { sfx.win(); confetti({ colors: ["#f2b632", "#e0602a", "#6fb544", "#2f7f3a"] }); } : sfx.good);
      return;
    }
    const newScore = bestScore !== null && score > bestScore;
    submitScore(score); submitStage(top);
    setRecord(newScore ? bestScore : null);
    later(400 + 260 * earned, newScore || earned === 3 ? () => { sfx.win(); confetti({ colors: ["#f2b632", "#e0602a", "#6fb544", "#2f7f3a"] }); } : ended ? sfx.good : sfx.lose);
  }, [game]);

  // After useLevels has read this phone's stars: open a friend's run, or a fresh garden.
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    setSite(window.location.host);
    const readFriend = () => {
      const read = parseShared(window.location.hash);
      if (!read) return false;
      setFriend(read);
      if (read.level) playLevel(read.level); else playFree(read.seed);
      return true;
    };
    if (!readFriend()) playFree();
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, [levels.loaded]);

  // The plates are drawn once into small images; the board just moves them around.
  useEffect(() => {
    const sheet = document.createElement("canvas");
    sheet.width = sheet.height = 168;
    const c = sheet.getContext("2d");
    if (!c) return;
    const out: string[] = [];
    for (let stage = 0; stage <= TOP; stage++) { c.clearRect(0, 0, 168, 168); drawStage(c, stage === 0 ? STONE : stage, 0, 0, 168); out[stage] = sheet.toDataURL(); }
    setSprites(out);
  }, []);

  useEffect(() => {
    const hide = () => { const current = gameRef.current; if (document.hidden && current.moves.length && !current.over) setPaused(true); };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); clearTimers(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("আঁটি থেকে আম রাফির বাগানে পাকা আম ১২৪০ পয়েন্ট").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `over`, `count` and `name` cover everything the card draws.
  }, [over, count, name, format, site, friend]);

  // ---- keyboard: arrows or WASD swipe, U takes a move back ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key in KEYS) { event.preventDefault(); go(KEYS[event.key]); return; }
    if (event.key === "u" || event.key === "U") { event.preventDefault(); takeBack(); return; }
    if ((event.key !== " " && event.key !== "Enter") || element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (phase === "paused") setPaused(false);
    else if (won && level < LEVEL_COUNT) playLevel(level + 1);
    else if (over) again();
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: swipe anywhere on the plot ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || over || paused) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id) return;
    press.current = null;
    const dx = event.clientX - held.x, dy = event.clientY - held.y;
    if (Math.hypot(dx, dy) < 22) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 1 : 0));
  }

  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  function pickLevel(next: number) { playLevel(next); board.current?.scrollIntoView({ behavior: smooth(), block: "center" }); }

  function status() {
    if (phase === "ready") return "আঙুল টেনে সরাও। একই ছবির দুটো ছুঁলে মিলে বড় হয়।";
    if (top >= TOP) return "পুরো বাগান হয়ে গেছে। এবার যত পয়েন্ট পারো।";
    return `দুটো ${stageName(top)} মেলালে ${stageName(top + 1)}।`;
  }

  const near = level && won ? shortBy(level, count) : 0;
  const goalShort = spec ? `${bn(threeStar(level))} চালে ৩ তারা` : "";

  return (
    <div className="aa" data-calm={slow}>
      {friend && (
        <section className="aa-friend" aria-labelledby="aa-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="aa-friend-title">{feat(friend)}।</h2>
            <p>{friend.level ? "একই লেভেল, এবার তোমার পালা।" : "একই শুরু, আঁটি পড়ার নিয়মও একই। এবার তোমার পালা।"} চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।</p>
          </div>
        </section>
      )}

      <div className="aa-bar">
        <div className="aa-modes" role="group" aria-label="খেলার ধরন">
          <button type="button" aria-pressed={!level} onClick={() => { sfx.tap(); if (level) playFree(friend && !friend.level ? friend.seed : undefined); }}>খোলা খেলা</button>
          <button type="button" aria-pressed={!!level} onClick={() => { sfx.tap(); if (!level) playLevel(friend?.level || startLevel(levels.stars, levels.unlocked)); }}>লেভেল</button>
        </div>
        {level
          ? <p className="aa-count" aria-label={`চাল ${bn(count)}, সীমা ${bn(limitOf(level))}`}><span>চাল</span><b>{bn(count)}</b><small>/{bn(limitOf(level))}</small></p>
          : <p className="aa-count" aria-label={`পয়েন্ট ${bn(score)}`}><span>পয়েন্ট</span><b key={score} className={score && !slow ? "aa-bump" : ""}>{bn(score)}</b></p>}
      </div>

      {level ? (
        <div className="aa-levelbar">
          <button type="button" className="aa-step" onClick={() => pickLevel(level - 1)} disabled={level <= 1} aria-label="আগের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <p><b>লেভেল {bn(level)} · {goalText(level)}</b><span>{bn(limitOf(level))} চালের মধ্যে · {goalShort}</span></p>
          <button type="button" className="aa-step" onClick={() => pickLevel(level + 1)} disabled={level >= open || level >= LEVEL_COUNT} aria-label="পরের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
      ) : (
        <ol className="aa-road" aria-label={`ধাপ: ${stageName(top)} পর্যন্ত হয়েছে`}>
          {Array.from({ length: TOP }, (_, index) => {
            const stage = index + 1;
            return <li key={stage} data-on={stage <= top || undefined} data-next={stage === top + 1 || undefined} data-best={bestStage !== null && stage <= bestStage && stage > top || undefined} title={stageName(stage)}>
              {sprites[stage] && <img src={sprites[stage]} alt="" />}
            </li>;
          })}
        </ol>
      )}

      <div className="aa-plot" data-phase={phase} data-size={size}>
        <div
          className="aa-grid" ref={board} role="group" style={{ "--n": size } as CSSProperties}
          aria-label={`বাগানের ছক, ${bn(size)}×${bn(size)}। আঙুল টেনে বা নিচের তীর চেপে সরাও। কিবোর্ডে তীর চাপো, U চাপলে এক চাল ফেরত।`}
          onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { press.current = null; }}
        >
          {cells.map((stage, cell) => stage === STONE && (
            <span key={`stone-${cell}`} className="aa-tile aa-stone" style={{ transform: `translate(${(cell % size) * 100}%, ${Math.floor(cell / size) * 100}%)` }} aria-hidden="true">
              {sprites[0] && <img src={sprites[0]} alt="" />}
            </span>
          ))}
          {tiles.map(tile => (
            <span key={tile.id} className="aa-tile" data-kind={tile.kind} style={{ transform: `translate(${(tile.cell % size) * 100}%, ${Math.floor(tile.cell / size) * 100}%)` }} aria-hidden="true">
              <span className="aa-face">{sprites[tile.stage] ? <img src={sprites[tile.stage]} alt="" /> : <i>{stageName(tile.stage)}</i>}</span>
            </span>
          ))}
        </div>
        {streak > 1 && phase === "playing" && <p className="aa-streak" aria-hidden="true">পরপর জোড়া ×{bn(streak)}</p>}
        {toast && !slow && (
          <p key={toast.key} className="aa-toast" aria-hidden="true">
            {sprites[toast.stage] && <img src={sprites[toast.stage]} alt="" />}<span>{stageLine(toast.stage)}</span>
          </p>
        )}
        {phase === "paused" && (
          <div className="aa-overlay">
            <div className="aa-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {over ? (
        <div className="aa-over" role="status">
          {failed ? (
            <>
              <p className="aa-over-score">{count >= limitOf(level) ? "চাল শেষ" : "জায়গা শেষ"}</p>
              <p className="aa-over-line">সবচেয়ে বড় হয়েছিল {stageName(top)}। লক্ষ্য ছিল {stageName(spec!.target)}।</p>
              <div className="aa-over-actions one"><button type="button" className="kit-primary" onClick={again}>আরেকবার</button></div>
            </>
          ) : (
            <>
              <p className="aa-over-score">
                {level ? <>লেভেল {bn(level)} পার, <em>{bn(count)} চালে</em></> : <>{ended ? "এখানেই থামলে" : "জায়গা শেষ"} · <em>{stageName(top)}</em></>}
              </p>
              <p className="aa-over-stars"><StarReveal count={earned} />{!level && <span className="aa-points">{bn(shownScore)} পয়েন্ট</span>}</p>
              <p className="aa-over-line">
                {rival ? compareLine(level ? count : score, level ? rival.count : rival.score, rival.name, !!level)
                  : record !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(record)} পয়েন্ট।`
                  : stageLine(level ? spec!.target : top)}
                {!level && !rival && record === null && bestScore !== null && bestScore > score && <> এই ফোনে তোমার সেরা {bn(bestScore)} পয়েন্ট।</>}
              </p>
              {level ? earned < 3 && <p className="aa-over-near">আর {bn(near)} চাল কম হলে {bn(earned + 1)} তারা।</p>
                : top < TOP && <p className="aa-over-near">আর একটা {stageName(top)} হলেই {stageName(top + 1)}।</p>}
              <div className="aa-over-actions">
                {level && level < LEVEL_COUNT
                  ? <><button type="button" className="kit-secondary" onClick={again}>আবার খেলো</button><button type="button" className="kit-primary" onClick={() => playLevel(level + 1)}>পরের লেভেল</button></>
                  : <button type="button" className="kit-primary aa-wide" onClick={again}>আরেকবার</button>}
              </div>
              <button type="button" className="kit-link aa-see" onClick={seeCard}>কার্ড দেখো ↓</button>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="aa-status" role="status" aria-live="polite">{status()}</p>
          <div className="aa-pad">
            {ARROWS.map(arrow => (
              <button key={arrow.dir} type="button" aria-label={arrow.label} onClick={() => go(arrow.dir)} disabled={paused}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={arrow.path} /></svg>
              </button>
            ))}
          </div>
          <div className="aa-tools">
            <button type="button" className="aa-tool" onClick={takeBack} disabled={!undo || paused}>ফেরত নাও</button>
            {level
              ? <button type="button" className="aa-tool" onClick={again} disabled={!count}>আবার শুরু</button>
              : <button type="button" className="aa-tool" onClick={stopHere} disabled={!count}>এখানেই থামো</button>}
            <button type="button" className="aa-tool" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
            <SoundToggle compact className="aa-sound" />
          </div>
        </>
      )}

      <details className="aa-levels">
        <summary>সব লেভেল <span>★ {bn(totalStars(levels.stars))}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>১–৮ উঠোন, ৯–১৬ পুকুরপাড় (পাথর সরে না), ১৭–২৪ বড় আমবাগান (৫×৫)। যত কম চালে, তত বেশি তারা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level || undefined} onPick={pickLevel} />
      </details>

      {result && (
        <section className="aa-result" id="result" ref={resultBox} aria-labelledby="aa-result-title">
          <h2 id="aa-result-title">{level ? <><em>লেভেল {bn(level)}</em> {bn(count)} চালে পার</> : <><em>{stageName(top)}</em> পর্যন্ত, {bn(score)} পয়েন্ট</>}</h2>
          <p>{rival ? compareLine(level ? count : score, level ? rival.count : rival.score, rival.name, !!level) : stageLine(level ? spec!.target : top)}</p>
          <div className="aa-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="aa-card-summary" />
              <figcaption id="aa-card-summary" className="aa-sr">কার্ড: {level ? `লেভেল ${bn(level)}, ${bn(count)} চালে` : `${stageName(top)} পর্যন্ত, ${bn(score)} পয়েন্ট`}, {bn(earned)} তারা।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="aa-share">
              <label className="aa-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={level ? `atir-aam-level-${level}.png` : "atir-aam.png"} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${name}|${format}|${count}`}
                caption={caption(result)} state={state || undefined}
                hint={state ? "বন্ধু লিংক খুললে একই শুরু পাবে। চালগুলো আবার খেলে মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" : "চাল অনেক বেশি হয়ে গেছে, লিংকে ধরছে না। ছবিটা শেয়ার করো।"}
              />
              <button type="button" className="kit-link aa-again-link" onClick={() => { if (level && level < LEVEL_COUNT) pickLevel(level + 1); else { again(); board.current?.scrollIntoView({ behavior: smooth(), block: "center" }); } }}>
                {level && level < LEVEL_COUNT ? "পরের লেভেল খেলো" : "আবার খেলো"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
