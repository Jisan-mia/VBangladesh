"use client";
// IP: what we avoided — no genre leader's name, grey tiles, smiley button, mines, flags or its number colours; ours is a mango orchard with bushes, hidden hornet nests, a checked গামছা as the marker, our own number colours, sounds and generated no-guess boards.

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, shake, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  dig, lessonStep, marksLeft, newGame, nextStar, openCount, startLevel, starsEarned, takeHint, toggleMark, wrongMarks,
  MARKED, OPEN, type Game, type Move,
} from "../lib/game";
import { LEVEL_COUNT, WORLDS } from "../lib/levels";
import {
  bannerNote, bn, caption, clearLine, clock, compareLine, feat, humanLine, levelLabel, lossLine, nearMissLine, parseShared, sharedHash, sizeLabel, timeText,
  type Shared,
} from "../lib/link";
import { rustle, swarm, tie, untie } from "../lib/sound";

const TOOL = "bhimruler-chak";
const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

type Result = { seconds: number; stars: number; record: boolean; previousBest: number | null };
type Press = { id: number; cell: number; x: number; y: number; timer: number; fired: boolean };

export function OrchardGame() {
  const [level, setLevel] = useState(1);
  const [game, setGame] = useState<Game>(() => newGame(1, 1));
  const [marking, setMarking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [rings, setRings] = useState<Record<number, number>>({});
  const [hintCell, setHintCell] = useState(-1);
  const [note, setNote] = useState("");
  const [focus, setFocus] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);

  const gameRef = useRef(game);
  gameRef.current = game;
  const clockRef = useRef<{ since: number | null; spent: number }>({ since: null, spent: 0 });
  const press = useRef<Press | null>(null);
  const swallowClick = useRef(false);
  const stopSwarm = useRef<() => void>(() => {});
  const chosen = useRef(false);
  const friendRef = useRef<Shared | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const { spec, board, cells, status } = game;
  const over = status === "won" || status === "lost";
  const rival = friend && friend.level === level && friend.seed === game.seed ? friend : null;
  const teaching = !levels.stars[1] && !friend ? lessonStep(game) : 0;
  const lesson = game.lesson;
  const shared: Shared | null = result ? { level, seed: game.seed, first: game.first, seconds: result.seconds, hints: game.hints, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const elapsed = () => clockRef.current.spent + (clockRef.current.since !== null ? (performance.now() - clockRef.current.since) / 1000 : 0);

  // ---- the clock: starts on the first move, stops on a pause or the end ----
  useEffect(() => {
    if (status !== "playing" || paused || clockRef.current.since === null) return;
    const id = window.setInterval(() => setSeconds(Math.floor(elapsed())), 250);
    return () => window.clearInterval(id);
  }, [status, paused, game]);

  function stopClock() { const c = clockRef.current; if (c.since !== null) { c.spent += (performance.now() - c.since) / 1000; c.since = null; } }
  function startClock() { if (clockRef.current.since === null && clockRef.current.spent === 0) clockRef.current.since = performance.now(); }

  /** A fresh orchard for a level. A friend's level replays their seed with their first opening already done. */
  function goLevel(next: number, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    stopSwarm.current();
    const mate = friendRef.current && friendRef.current.level === next ? friendRef.current : null;
    let fresh = newGame(next, mate ? mate.seed : newSeed());
    if (mate) fresh = dig(fresh, mate.first)?.game ?? fresh;
    gameRef.current = fresh;
    setGame(fresh); setLevel(next);
    clockRef.current = { since: null, spent: 0 };
    setSeconds(0); setResult(null); setRings(mate ? ringsOf(fresh) : {}); setHintCell(-1); setNote(""); setPaused(false); setMarking(false);
    setFocus(Math.min(focus, fresh.cells.length - 1));
  }

  /** Everything open on a friend's board, rippling out from their first cell. */
  function ringsOf(start: Game) {
    const out: Record<number, number> = {}, cols = start.spec.cols, r0 = Math.floor(start.first / cols), c0 = start.first % cols;
    start.cells.forEach((value, cell) => { if (value === OPEN) out[cell] = Math.max(Math.abs(Math.floor(cell / cols) - r0), Math.abs(cell % cols - c0)); });
    return out;
  }

  function win(finished: Game) {
    stopClock();
    const time = Math.max(1, Math.round(elapsed()));
    setSeconds(time);
    const stars = starsEarned(time, finished.hints, finished.spec.par);
    const firstClear = !levels.stars[level];
    levels.record(level, stars);
    const previousBest = best, beaten = submitBest(time) && previousBest !== null;
    setResult({ seconds: time, stars, record: beaten, previousBest });
    setMarking(false);
    if (stars === 3 || beaten || (firstClear && level % 10 === 0)) {
      sfx.levelUp();
      confetti({ colors: ["#f2b632", "#e07b28", "#c8322b", "#ffffff", "#6aa84f", "#2f6b2a"] });
    } else sfx.good();
  }

  function lose() {
    stopClock();
    setSeconds(Math.floor(elapsed()));
    stopSwarm.current = swarm(slow);
    shake(boardRef.current);
    setMarking(false);
  }

  function land(move: Move) {
    gameRef.current = move.game;
    setGame(move.game);
    setNote("");
    if (move.opened.length) {
      const next: Record<number, number> = {};
      for (const [cell, ring] of move.opened) next[cell] = ring;
      setRings(next);
    }
    if (move.boom) { lose(); return; }
    rustle(move.opened.length);
    if (move.game.status === "won") win(move.game);
  }

  function clear(cell: number) {
    const current = gameRef.current;
    const move = dig(current, cell);
    if (!move) {
      if (current.cells[cell] === MARKED) { setNote("গামছা বাঁধা ঝোপ সাফ হয় না। আগে গামছা খোলো।"); sfx.tap(); }
      return;
    }
    startClock();
    setHintCell(-1);
    land(move);
  }

  function mark(cell: number) {
    const current = gameRef.current;
    if (current.status === "ready") { setNote("আগে যেকোনো একটা ঝোপ সাফ করো। প্রথম চাপে চাক থাকে না।"); sfx.tap(); return; }
    const next = toggleMark(current, cell);
    if (!next) return;
    startClock();
    gameRef.current = next;
    setGame(next);
    setNote("");
    if (next.cells[cell] === MARKED) tie(); else untie();
  }

  /** A tap: the first one always clears; then the mode decides. In গামছা mode an open number still clears around itself. */
  function act(cell: number) {
    const current = gameRef.current;
    if (paused || current.status === "won" || current.status === "lost") return;
    if (marking && current.status === "playing" && current.cells[cell] !== OPEN) mark(cell); else clear(cell);
  }

  function hint() {
    const current = gameRef.current;
    if (paused || current.status !== "playing") return;
    const move = takeHint(current);
    if (!move) return;
    startClock();
    sfx.pick();
    land(move);
    setHintCell(move.cell);
    if (move.game.status === "playing") setNote("হিন্টে দাগ দেওয়া ঝোপটা সাফ হলো। হিন্ট নিলে বড়জোর ২ তারা।");
  }

  function resume() {
    if (clockRef.current.spent > 0 && gameRef.current.status === "playing") clockRef.current.since = performance.now();
    setPaused(false);
  }

  // ---- touch: a tap acts, a long press ties a গামছা, and any finger movement (a scroll) cancels both ----
  const cellOf = (target: EventTarget | null) => Number((target as HTMLElement | null)?.closest?.("[data-index]")?.getAttribute("data-index") ?? -1);
  function cancelPress() { if (press.current) window.clearTimeout(press.current.timer); press.current = null; }
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    swallowClick.current = false;
    if (event.button !== 0 || event.pointerType === "mouse") return;
    const cell = cellOf(event.target);
    if (cell < 0) return;
    cancelPress();
    const held: Press = { id: event.pointerId, cell, x: event.clientX, y: event.clientY, fired: false, timer: 0 };
    held.timer = window.setTimeout(() => {
      held.fired = true;
      swallowClick.current = true;
      if (!over && !paused && gameRef.current.cells[cell] !== OPEN) mark(cell);
    }, slow ? 550 : 420);
    press.current = held;
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    // A finger that travels is a scroll: no mark, and no tap either.
    if (held && held.id === event.pointerId && !held.fired && Math.hypot(event.clientX - held.x, event.clientY - held.y) > 10) { cancelPress(); swallowClick.current = true; }
  }
  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || held.id !== event.pointerId) return;
    window.clearTimeout(held.timer);
    if (event.type === "pointercancel") swallowClick.current = true; // the browser took the touch for a scroll
    press.current = null;
  }
  function onClick(event: ReactMouseEvent<HTMLDivElement>) {
    const cell = cellOf(event.target);
    if (cell < 0) return;
    if (swallowClick.current) { swallowClick.current = false; return; }
    setFocus(cell);
    act(cell);
  }
  function onContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    event.preventDefault();
    if (press.current) return; // a touch long press handles itself
    const cell = cellOf(event.target);
    if (cell >= 0 && !over && !paused && gameRef.current.cells[cell] !== OPEN) mark(cell);
  }

  // Arrows walk the grid; Enter or Space acts on the focused bush, G ties a গামছা.
  function onGridKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = ARROWS[event.key], { cols, rows } = gameRef.current.spec;
    if (step) {
      event.preventDefault();
      const r = Math.min(rows - 1, Math.max(0, Math.floor(focus / cols) + step[0])), c = Math.min(cols - 1, Math.max(0, focus % cols + step[1]));
      const next = r * cols + c;
      setFocus(next);
      boardRef.current?.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus();
    } else if (event.key === "g" || event.key === "G" || event.key === "f" || event.key === "F") {
      event.preventDefault();
      if (!over && !paused && gameRef.current.cells[focus] !== OPEN) mark(focus);
    }
  }

  // ---- page-wide keys: M switches mode, H hints, Enter/Space resumes or moves on ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key === "m" || event.key === "M") { setMarking(on => !on); return; }
    if (event.key === "h" || event.key === "H") { hint(); return; }
    if ((event.key === "Enter" || event.key === " ") && !target?.closest?.("button, a, summary")) {
      if (paused) { event.preventDefault(); resume(); }
      else if (status === "lost") { event.preventDefault(); goLevel(level); }
      else if (status === "won" && level < LEVEL_COUNT) { event.preventDefault(); goLevel(level + 1); }
    }
  };

  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      friendRef.current = found;
      setFriend(found);
      goLevel(found.level);
    };
    const hide = () => {
      if (!document.hidden) return;
      cancelPress();
      if (clockRef.current.since !== null && gameRef.current.status === "playing") { stopClock(); setPaused(true); }
    };
    setSite(window.location.host);
    readFriend();
    window.addEventListener("keydown", listen);
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("keydown", listen);
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      cancelPress();
      stopSwarm.current();
    };
  }, []);

  // Open where the player left off once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    goLevel(startLevel(levels.stars, levels.unlocked), false);
  }, [levels.loaded]);

  useEffect(() => {
    if (hintCell < 0) return;
    const timer = window.setTimeout(() => setHintCell(-1), 1800);
    return () => window.clearTimeout(timer);
  }, [hintCell]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ভিমরুলের চাক লেভেল ১২৩ রাফি ${sizeLabel(level)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  // ---- what's on screen ----
  const left = marksLeft(game);
  const total = totalStars(levels.stars);
  const wrong = status === "lost" ? new Set(wrongMarks(game)) : null;
  const teachCells = new Set<number>(lesson && teaching === 2 ? [lesson.clue, lesson.nest] : lesson && teaching === 3 ? [lesson.helper, ...lesson.safe.filter(cell => cells[cell] !== OPEN)] : []);
  const next = result ? nextStar(result.seconds, game.hints, spec.par) : null;
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);

  function stateOf(cell: number) {
    const value = cells[cell];
    if (status === "lost" && board) {
      if (cell === game.hit) return "boom";
      if (wrong!.has(cell)) return "wrong";
      if (board.nest[cell] && value !== MARKED) return "nest";
    }
    return value === OPEN ? "open" : value === MARKED ? "marked" : "covered";
  }

  function cellLabel(cell: number, look: string) {
    const where = `সারি ${bn(Math.floor(cell / spec.cols) + 1)}, কলাম ${bn(cell % spec.cols + 1)}`;
    if (look === "open") return `${where}: সাফ${board?.count[cell] ? `, পাশে ${bn(board.count[cell])}টা চাক` : ", পাশে চাক নেই"}`;
    if (look === "marked") return `${where}: গামছা বাঁধা`;
    if (look === "boom") return `${where}: এখানেই চাক ছিল`;
    if (look === "nest") return `${where}: চাক`;
    if (look === "wrong") return `${where}: ভুল গামছা, চাক ছিল না`;
    return `${where}: ঝোপ`;
  }

  function statusLine() {
    if (note) return note;
    if (teaching === 1) return "১/৩ · যেকোনো ঝোপে চাপো। প্রথম চাপে চাক থাকে না।";
    if (teaching === 2) return "২/৩ · দাগ দেওয়া ১-এর পাশে ঢাকা ঝোপ একটাই, তাই চাক ওখানেই। ‘গামছা’ চালু করে ঝোপটায় চাপো।";
    if (teaching === 3) return `৩/৩ · ওই চাকে গামছা বাঁধা। তাই দাগ দেওয়া ১-এর পাশের বাকি ঝোপে চাক নেই। ${marking ? "‘ঝোপ সাফ’ বেছে " : ""}ঝোপগুলোয় চাপো।`;
    if (level === 1 && !levels.stars[1] && !friend && status === "playing") return "এবার নিজে। সংখ্যা দেখে চাক খোঁজো, বাকি ঝোপ সাফ করো।";
    if (marking) return "গামছা চালু: ঝোপে চাপলে গামছা বাঁধা হবে, আবার চাপলে খুলবে।";
    if (status === "ready") return "যেকোনো ঝোপে চাপো। প্রথম চাপে চাক থাকে না।";
    return `৩ তারা: ${timeText(spec.par)}ের মধ্যে`;
  }

  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const hitAt = { "--hx": `${((Math.max(0, game.hit) % spec.cols) + 0.5) / spec.cols * 100}%`, "--hy": `${(Math.floor(Math.max(0, game.hit) / spec.cols) + 0.5) / spec.rows * 100}%` } as CSSProperties;
  const gridStyle = { "--cols": spec.cols, "--rows": spec.rows } as CSSProperties;

  return (
    <div className="bc" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="bc-friend" aria-labelledby="bc-friend-title">
          <h2 id="bc-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="bc-hud">
        <p className="bc-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        <p className="bc-left" aria-label={`গামছা বাকি ${bn(Math.max(0, left))}টা, মোট চাক ${bn(spec.nests)}টা`}>
          <span className="bc-chip-nest" aria-hidden="true" />{bn(left)}
        </p>
        <p className="bc-clock" aria-label={`সময় ${timeText(seconds)}`}><b>{clock(seconds)}</b></p>
      </div>

      <div className="bc-board-wrap">
        <div className="bc-board" ref={boardRef} data-status={status} data-marking={marking || undefined}>
          <div className="bc-grid" role="group" aria-label={`${bn(spec.cols)}×${bn(spec.rows)} বাগান, ${bn(spec.nests)}টা চাক লুকানো`} style={gridStyle}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClick={onClick} onContextMenu={onContextMenu} onKeyDown={onGridKey}>
            {Array.from(cells, (_, cell) => {
              const look = stateOf(cell), count = board?.count[cell] ?? 0, r = Math.floor(cell / spec.cols), c = cell % spec.cols;
              return (
                <button key={`${game.seed}-${level}-${cell}`} type="button" className="bc-cell" data-index={cell} data-state={look}
                  data-n={look === "open" && count ? count : undefined} data-v={(r * 2 + c * 3) % 3}
                  data-teach={teachCells.has(cell) || undefined} data-hint={cell === hintCell || undefined}
                  style={look === "open" && rings[cell] !== undefined ? { "--d": `${Math.min(18, rings[cell]) * 28}ms` } as CSSProperties : undefined}
                  tabIndex={cell === focus ? 0 : -1} aria-label={cellLabel(cell, look)} disabled={paused}
                  onFocus={() => setFocus(cell)}>
                  {look === "open" && count ? bn(count) : null}
                </button>
              );
            })}
          </div>
          {status === "lost" && (
            <div className="bc-swarm" style={hitAt} aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => <i key={index} style={{ "--k": index } as CSSProperties} />)}
              <b>ভোঁওও… পালাও!</b>
            </div>
          )}
        </div>
        {paused && (
          <div className="bc-overlay">
            <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {status === "won" && result ? (
        <div className="bc-clear" role="status">
          <StarReveal count={result.stars} />
          <p className="bc-clear-line">{clearLine(level)}</p>
          <p className="bc-clear-note">
            {timeText(result.seconds)}{game.hints ? `, ${bn(game.hints)}বার হিন্ট` : ""}।{" "}
            {rival ? compareLine(result.seconds, rival.seconds, rival.name)
              : result.record && result.previousBest !== null ? `এই লেভেলে নতুন রেকর্ড! আগে লেগেছিল ${timeText(result.previousBest)}।`
              : nearMissLine(next)}
          </p>
          <div className="bc-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => goLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => goLevel(level)}>আবার খেলো</button>
          </div>
          <button type="button" className="kit-link bc-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : status === "lost" ? (
        <div className="bc-lost" role="status">
          <p className="bc-lost-title">একটা চাকে হাত পড়ে গেছে!</p>
          <p className="bc-lost-line">{lossLine(spec.safe - openCount(cells))}</p>
          <button type="button" className="kit-primary bc-again" onClick={() => goLevel(level)}>আরেকবার</button>
          <p className="bc-lost-note">{rival ? `${possessive(rival.name || "বন্ধু")} বাগানটাই আবার আসবে।` : "নতুন বাগান, একই লেভেল।"}</p>
        </div>
      ) : (
        <>
          <p className="bc-status" role="status" aria-live="polite">{statusLine()}</p>
          <div className="bc-modes" role="group" aria-label="চাপলে কী হবে">
            <button type="button" aria-pressed={!marking} onClick={() => { setMarking(false); sfx.tap(); }}>
              <span className="bc-ico bc-ico-clear" aria-hidden="true" />ঝোপ সাফ
            </button>
            <button type="button" aria-pressed={marking} data-teach={teaching === 2 && !marking || undefined} onClick={() => { setMarking(true); sfx.tap(); }}>
              <span className="bc-ico bc-ico-gamchha" aria-hidden="true" />গামছা
            </button>
          </div>
        </>
      )}

      <div className="bc-prefs">
        {!over && <button type="button" className="bc-pill" onClick={hint} disabled={paused || status !== "playing"}>হিন্ট</button>}
        <button type="button" className="bc-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
      </div>

      <details className="bc-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="bc-worlds">{WORLDS.map((world, index) => `${bn(index * 10 + 1)}–${bn(index * 10 + 10)} ${world.name}`).join(" · ")}</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} onPick={pick => { goLevel(pick); toTop(); }} />
      </details>

      <section className="bc-result" id="result" ref={resultBox} aria-labelledby="bc-result-title">
        <h2 id="bc-result-title">{shared ? <><em>লেভেল {bn(level)}</em> সাফ {timeText(shared.seconds)}ে</> : "বাগান সাফ হলে তোমার কার্ড"}</h2>
        <p>{shared && result ? humanLine(result.stars, game.hints) : "সব নিরাপদ ঝোপ সাফ হলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই বাগান পাবে।"}</p>
        {shared && result && (
          <div className="bc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`ভিমরুলের চাকের কার্ড: ${levelLabel(level)}, ${timeText(shared.seconds)}, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bc-share">
              <label className="bc-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`bhimruler-chak-level-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই বাগান পাবে, শুরুর জায়গাটাও খোলা। সময়টা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
