"use client";
// IP: what we avoided — no app or brand name and no copy of a word-search app's look (glossy rounded tiles, neon capsules, coin counters); ours is a cheap printed puzzle booklet solved with ballpoint strokes, with hand-written Bangla packs.
// The rules, the clock and what the phone keeps are pure (lib/game.ts, lib/session.ts, lib/save.ts, lib/drag.hot.ts);
// this file feeds them pointer moves, keys and performance.now(), draws the page and plays the sounds.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, shake, silenceScheduled, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cardBlob, drawCard, strokeEnds } from "../lib/draw-card";
import { INKS, PALETTES, ROOTS } from "../lib/art";
import { build, clueOf, demoWord, generate, totalTime, HINT_SECONDS, type Level, type Puzzle } from "../lib/grid";
import { isDone, newRound, strike, takeHint, tapLine, nextHint, type Round } from "../lib/game";
import { STAGE_COUNT, TEACH_SEED, WORLDS, finaleName, isFinale, stageAt, worldOf } from "../lib/levels";
import { packById, type PackId } from "../lib/packs";
import * as session from "../lib/session";
import { cellAt, dragInto } from "../lib/drag.hot";
import { edgeDanger, starTimeUsed, starsOnTrack } from "../lib/tick.hot";
import { FREE_KEY, LEVELS_SLUG, OLD_LEVELS_KEY, OPEN_KEY, openAfter, readFree, readOpen, startLevel, writeFree } from "../lib/save";
import {
  bn, caption, clock, compareLine, countWord, detail, humanLine, levelName, pageLabel, pageNear, pageStars, parseShared, sharedHash, spoken, spokenIn, type Shared,
} from "../lib/link";
import { StartCard } from "./start-card";
import { LevelSheet } from "./level-sheet";
import { AskCard, type Ask } from "./ask";
import { Finish, type Action, type FinishStats } from "./finish";
import { Motif } from "./motif";
import { sound } from "./sound";

const TOOL = "shobdo-khoja";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/** The page on the board. `page` is the ladder level (0 for free play's classic grid); `demo` is the old teaching grid. */
type Deal = { seed: number; page: number; pack: PackId; level: Level; demo: boolean; puzzle: Puzzle };
function deal(seed: number, page: number, pack: PackId, level: Level, demo = false): Deal {
  const at = page ? stageAt(page) : null;
  const puzzle = at ? build(seed, at.pack, at) : generate(seed, pack, level);
  return { seed, page: at ? page : 0, pack: puzzle.pack, level: puzzle.level, demo, puzzle };
}
type Finished = FinishStats & { previousBest: number | null; firstClear: boolean; at: number };

const U = 100; // one cell in the board's SVG units
const centre = (cell: number, n: number) => [(cell % n + 0.5) * U, (Math.floor(cell / n) + 0.5) * U] as const;
const KEY_STEPS: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };

function Stroke({ cells, ink, n, slow }: { cells: readonly number[]; ink: string; n: number; slow: boolean }) {
  const { x1, y1, x2, y2, bend } = strokeEnds(cells, n);
  const qx = (x1 + x2) / 2 - (y2 - y1) * bend, qy = (y1 + y2) / 2 + (x2 - x1) * bend;
  return <path className="sk-stroke" data-still={slow || undefined} pathLength={1} stroke={ink} d={`M${x1 * U} ${y1 * U}Q${qx * U} ${qy * U} ${x2 * U} ${y2 * U}`} />;
}

export function ShobdoGame() {
  const [game, setGame] = useState<Deal>(() => deal(TEACH_SEED, 1, "phul", 0));
  const [round, setRound] = useState<Round>(() => newRound());
  const [run, setRun] = useState<session.Session>(() => session.ready());
  const [seconds, setSeconds] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [mode, setMode] = useState<"page" | "free">("page");
  const [free, setFree] = useState<{ pack: PackId; level: Level }>({ pack: "phul", level: 0 });
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [firstTap, setFirstTapState] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [miss, setMiss] = useState<{ cells: number[]; key: number }>({ cells: [], key: 0 });
  const [note, setNote] = useState("");
  const [sung, setSung] = useState({ index: -1, key: 0 });
  const [runShow, setRunShow] = useState(0);
  const [teach, setTeach] = useState(false);
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const { puzzle, page } = game, n = puzzle.size;
  const at = page ? stageAt(page) : null;
  const levels = useLevels(LEVELS_SLUG, STAGE_COUNT);
  // Free grids keep their old best keys (shobdo-khoja-phul-0); ladder pages get one each.
  const [best, submitBest] = useBest(page ? `${TOOL}-g${page}` : `${TOOL}-${game.pack}-${game.level}`, false);

  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const trail = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const timers = useRef({ miss: 0, run: 0 });
  // The finger on the grid, and the stroke it draws (filled by dragInto without allocating).
  const press = useRef<{ from: number; id: number; rect: DOMRect; moved: boolean } | null>(null);
  const cells = useRef(new Int16Array(8));
  const meta = useRef(new Int16Array(2));
  const firstTapNow = useRef(-1);
  const inView = useInView(root);
  // The latest of everything, for listeners that outlive a render (blur, keys, pointer moves).
  const now = useRef({ game, round, run, finish, sheet, ask });
  now.current = { game, round, run, finish, sheet, ask };

  const setFirstTap = (cell: number) => { firstTapNow.current = cell; setFirstTapState(cell); };
  const elapsed = () => session.elapsed(now.current.run, performance.now());
  const shared: Shared | null = finish ? { seed: game.seed, pack: game.pack, level: game.level, demo: game.demo, hints: round.hinted.length, time: finish.time, name, ...(page ? { page } : {}) } : null;
  const state = shared ? sharedHash(shared) : "";
  const rival = friend && friend.seed === game.seed && friend.pack === game.pack && (friend.page ?? 0) === page
    && (page > 0 || (friend.level === game.level && friend.demo === game.demo)) ? friend : null;

  // ---- the pen: drawn straight onto the SVG, so a drag never waits for React ----
  function showTrail(from: number, to: number) {
    const line = trail.current, start = dot.current;
    if (!line || !start) return;
    const [x1, y1] = centre(from, n), [x2, y2] = centre(to, n);
    line.setAttribute("x1", String(x1)); line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2)); line.setAttribute("y2", String(y2));
    line.style.visibility = "visible";
    start.setAttribute("cx", String(x1)); start.setAttribute("cy", String(y1));
    start.style.visibility = "visible";
  }
  function hideTrail() {
    if (trail.current) trail.current.style.visibility = "hidden";
    if (dot.current) dot.current.style.visibility = "hidden";
  }
  function cancelPress() { press.current = null; hideTrail(); }

  function clearTimers() {
    window.clearTimeout(timers.current.miss);
    window.clearTimeout(timers.current.run);
    timers.current = { miss: 0, run: 0 };
  }

  /** Puts a page on its start card. Everything about the last one goes: its stroke, timers, notes and result. */
  function load(next: Deal) {
    cancelPress();
    clearTimers();
    // The last page's song and fanfare are on the audio clock: a new page cuts them.
    silenceScheduled();
    const r = newRound(next.demo ? demoWord(next.puzzle) : -1), s = session.ready();
    now.current = { ...now.current, game: next, round: r, run: s, finish: null, sheet: false, ask: null };
    setGame(next);
    setRound(r);
    setRun(s);
    setSeconds(0);
    setFinish(null);
    setNote("");
    setFirstTap(-1);
    setCursor(-1);
    setMiss(current => ({ cells: [], key: current.key }));
    setSung(current => ({ index: -1, key: current.key }));
    setRunShow(0);
    setSheet(false);
    setAsk(null);
    setTeach(next.page === 1 && next.seed === TEACH_SEED);
  }
  /** A ladder page: level 1 opens on its teaching grid until it has been cleared once, every other play is a fresh grid. */
  const pageDeal = (to: number) => deal(to === 1 && !levels.stars[1] ? TEACH_SEED : newSeed(), to, "phul", 0);
  const freeDeal = (pack: PackId, level: Level) => deal(newSeed(), 0, pack, level);
  const canPick = (to: number) => to >= 1 && to <= STAGE_COUNT && (to <= open || to === visit);

  function start() {
    const r = now.current.run;
    if (r.phase !== "ready") return;
    const next = session.begin(r, performance.now());
    now.current.run = next;
    setRun(next);
    sound.turn();
  }
  function pauseFor(why: session.Why) {
    cancelPress();
    setFirstTap(-1);
    const r = now.current.run;
    if (r.phase !== "playing" && r.phase !== "paused") return;
    const next = session.pause(r, performance.now(), why);
    now.current.run = next;
    setRun(next);
    setSeconds(session.elapsed(next, performance.now()));
  }
  function resumeFrom(why: session.Why) {
    const next = session.resume(now.current.run, performance.now(), why);
    now.current.run = next;
    setRun(next);
  }
  function replay() {
    const { game: g } = now.current;
    // A friend's grid replays the same letters; a level or free grid is a fresh one (never a memory test).
    load(rival ? g : g.page ? pageDeal(g.page) : freeDeal(g.pack, g.level));
  }

  // The player's menu: pause stops the clock and lifts the pen; চালিয়ে যাও starts it again; নতুন করে শুরু deals again.
  const player = useGamePlayer({ onPause: () => pauseFor("away"), onResume: () => resumeFrom("away"), onRestart: replay });

  // Away without the player (or before its menu engages): blur and a hidden tab stop the clock and lift the pen too.
  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
    };
  }, []);

  // ---- the clock: a 250 ms tick while playing; the reducer holds the truth ----
  useEffect(() => {
    if (run.phase !== "playing") return;
    const id = window.setInterval(() => setSeconds(session.elapsed(now.current.run, performance.now())), 250);
    return () => window.clearInterval(id);
  }, [run]);

  // Boot once this phone's stars are read: your own open levels (the old ladder migrated once), free play's last pick,
  // then a friend's grid from the link, or where you left off.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const mine = readOpen(read(OPEN_KEY), levels.stars, read(OLD_LEVELS_KEY));
    if (read(OPEN_KEY) === null) write(OPEN_KEY, String(mine));
    setOpen(mine);
    const last = readFree(read(FREE_KEY));
    setFree(last);
    setSite(window.location.host);
    setBooted(true);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      if (got.page) { setVisit(got.page); setMode("page"); load(deal(got.seed, got.page, got.pack, got.level)); }
      else { setMode("free"); load(deal(got.seed, 0, got.pack, got.level, got.demo)); }
      return true;
    };
    if (!fromHash()) load(pageDeal(startLevel(mine)));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- choices: the sheet stops the clock; leaving a started page asks first ----
  function openSheet() {
    if (now.current.run.phase === "playing") pauseFor("sheet");
    setSheet(true);
  }
  function closeSheet() { setSheet(false); resumeFrom("sheet"); }
  function stay() { setAsk(null); setSheet(false); resumeFrom("sheet"); }
  const roundLabel = () => {
    const { game: g, round: r } = now.current;
    const where = g.page ? pageLabel(g.page) : `${packById(g.pack)?.name}, ${levelName(g.level)}`;
    return `${where} · ${bn(r.found.length)}/${bn(g.puzzle.words.length)} শব্দ, ${clock(totalTime(elapsed(), r.hinted.length))}`;
  };
  /** Runs `then` now, or, when a started page would be thrown away, after a yes on the ask card. */
  function leave(then: () => void, after: string) {
    if (!session.started(now.current.run)) { then(); return; }
    if (now.current.run.phase === "playing") pauseFor("sheet");
    setAsk({ now: roundLabel(), then: after, leave: then });
  }
  function pickPage(to: number) {
    if (!canPick(to)) return;
    setMode("page");
    leave(() => load(pageDeal(to)), `${pageLabel(to)}, নতুন পাতা`);
  }
  function pickFree(pack: PackId, level: Level) {
    setMode("free");
    setFree({ pack, level });
    write(FREE_KEY, writeFree(pack, level));
    leave(() => load(freeDeal(pack, level)), `${packById(pack)?.name}, ${levelName(level)}, নতুন গ্রিড`);
  }
  function chooseMode(to: "page" | "free") {
    if (to === "page") pickPage(startLevel(open));
    else pickFree(free.pack, free.level);
  }

  // ---- moves ----
  function solved(r: Round) {
    const stamp = performance.now(), s = session.finish(now.current.run, stamp);
    now.current.run = s;
    setRun(s);
    const { game: g } = now.current;
    const time = Math.max(1, totalTime(session.elapsed(s, stamp), r.hinted.length));
    setSeconds(session.elapsed(s, stamp));
    const stars = pageStars(g.page, time);
    const firstClear = g.page > 0 && !levels.stars[g.page];
    if (g.page) {
      levels.record(g.page, stars);
      const opened = openAfter(open, g.page);
      if (opened !== open) { setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best;
    const beaten = submitBest(time) && previousBest !== null;
    const done: Finished = { time, stars, words: g.puzzle.words.length, bestRun: r.bestRun, misses: r.misses, hints: r.hinted.length, previousBest, firstClear, at: stamp };
    now.current.finish = done;
    setFinish(done);
    setFirstTap(-1);
    setCursor(-1);
    const big = stars === 3 || beaten || (firstClear && isFinale(g.page));
    // After the last word's song; scheduled on the audio clock, so a pause cuts it.
    sound.fanfare(ROOTS[g.pack], big, 0.12 + g.puzzle.words[r.found[r.found.length - 1]].letters.length * 0.06);
    if (big && !slow) confetti();
  }

  function letGo(stroke: readonly number[]) {
    if (!session.canMove(now.current.run)) return;
    const { round: before, game: g } = now.current, p = g.puzzle;
    const { round: after, outcome } = strike(before, p, stroke, elapsed());
    if (outcome.kind === "none") return;
    if (outcome.kind === "again") { sound.tap(); setNote(`${p.words[outcome.index].word} তো আগেই কাটা হয়েছে।`); return; }
    now.current.round = after;
    setRound(after);
    if (outcome.kind === "miss") {
      sound.miss();
      if (!slow) shake(board.current);
      setMiss(current => ({ cells: [...stroke], key: current.key + 1 }));
      window.clearTimeout(timers.current.miss);
      timers.current.miss = window.setTimeout(() => setMiss(current => ({ cells: [], key: current.key })), 650);
      setNote(p.clue ? "এমন শব্দ তালিকায় নেই। প্রথম অক্ষর আর ঘর গুনে দেখো।" : "এটা তালিকায় নেই। আবার দেখো।");
      return;
    }
    const word = p.words[outcome.index];
    sound.sing(ROOTS[g.pack], word.letters.length, after.run);
    setSung(current => ({ index: outcome.index, key: current.key + 1 }));
    setTeach(false);
    if (after.run) {
      setRunShow(after.run + 1);
      window.clearTimeout(timers.current.run);
      timers.current.run = window.setTimeout(() => setRunShow(0), 1600);
    }
    if (isDone(after, p)) { setNote(""); solved(after); return; }
    const left = p.words.length - after.found.length;
    setNote(`পেয়েছ: ${word.word}।${after.run ? ` টানা ${bn(after.run + 1)}টা।` : ""} আর ${bn(left)}টা।`);
  }

  /** Tap the first letter, then the last. Tapping the first again lets go of it. */
  function tap(cell: number) {
    if (!session.canMove(now.current.run)) return;
    const first = firstTapNow.current;
    if (first < 0) { sound.tap(); setFirstTap(cell); setNote("এবার শব্দের শেষ অক্ষরে চাপো।"); return; }
    if (first === cell) { setFirstTap(-1); setNote(""); return; }
    const line = tapLine(now.current.game.puzzle, first, cell);
    if (!line) { sound.tap(); setFirstTap(cell); setNote("একই লাইনে হতে হবে: পাশাপাশি, ওপর-নিচে বা কোনাকুনি। এই ঘর থেকে আবার ধরলাম।"); return; }
    setFirstTap(-1);
    letGo(line);
  }

  function hint() {
    if (!session.canMove(now.current.run)) return;
    const { round: r, game: g } = now.current;
    const got = takeHint(r, g.puzzle);
    if (!got) return;
    now.current.round = got.round;
    setRound(got.round);
    setFirstTap(-1);
    sound.hint();
    setNote(`গোল দাগের ঘর থেকে ${g.puzzle.clue ? `‘${g.puzzle.words[got.index].word}’` : "একটা শব্দ"} শুরু। ঘড়িতে +${bn(HINT_SECONDS)} সেকেন্ড।`);
  }

  function spot(event: ReactPointerEvent, rect: DOMRect) {
    return [(event.clientX - rect.left) / rect.width * n, (event.clientY - rect.top) / rect.height * n] as const;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || !session.canMove(now.current.run)) return;
    const rect = event.currentTarget.getBoundingClientRect(), [fx, fy] = spot(event, rect), cell = cellAt(fx, fy, n);
    if (cell < 0) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a synthetic or finished pointer: the drag still works inside the board */ }
    press.current = { from: cell, id: event.pointerId, rect, moved: false };
    meta.current[0] = 1; meta.current[1] = -1;
    showTrail(cell, cell);
    sound.penDown();
    setCursor(-1);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id) return;
    if (!session.canMove(now.current.run)) { cancelPress(); return; }
    const [fx, fy] = spot(event, held.rect), m = meta.current, before = m[0], oct = m[1];
    const count = dragInto(cells.current, m, held.from, fx - (held.from % n + 0.5), fy - (Math.floor(held.from / n) + 0.5), n);
    if (count > 1 && !held.moved) { held.moved = true; setFirstTap(-1); }
    if (count === before && m[1] === oct) return;
    showTrail(held.from, cells.current[count - 1]);
    if (count > before) sound.scratch(count);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id) return;
    cancelPress();
    if (!session.canMove(now.current.run)) return;
    if (!held.moved) { tap(held.from); return; }
    letGo(Array.from(cells.current.subarray(0, meta.current[0])));
  }

  // ---- what the result offers ----
  const nextOpen = page > 0 && page < STAGE_COUNT && page + 1 <= openAfter(open, page);
  const home = () => pickPage(startLevel(open));
  const primary: Action = page
    ? nextOpen ? { label: "পরের লেভেল", run: () => load(pageDeal(page + 1)) }
      : page === STAGE_COUNT ? { label: "সব লেভেল", run: openSheet }
      : { label: "তোমার লেভেলে ফেরো", run: home }
    : { label: "আরেকটা গ্রিড", run: () => load(freeDeal(game.pack, game.level)) };
  const secondary: Action[] = page ? [{ label: "আবার খেলো", run: replay }] : [{ label: "লেভেলে ফেরো", run: home }];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the result shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key, enter = key === "Enter" || key === " ", fresh = !event.repeat;
    if (ask) {
      if (key === "1" || key === "১") { event.preventDefault(); if (fresh) stay(); }
      else if (key === "2" || key === "২") { event.preventDefault(); if (fresh) ask.leave(); }
      return;
    }
    if (sheet || !inView) return;
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab: let it do its own job
    if ((key === "p" || key === "P") && fresh && run.phase === "playing") {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor("away");
      return;
    }
    if (run.phase === "ready") { if (enter && fresh) { event.preventDefault(); start(); } return; }
    if (run.phase === "paused") { if (enter) { event.preventDefault(); if (fresh && run.why === "away") resumeFrom("away"); } return; }
    if (run.phase === "over") {
      if (enter) { event.preventDefault(); if (fresh && finish && event.timeStamp > finish.at + 400) primary.run(); }
      return;
    }
    const step = KEY_STEPS[key];
    if (step) {
      event.preventDefault();
      setCursor(currentCell => {
        if (currentCell < 0) return firstTapNow.current >= 0 ? firstTapNow.current : Math.floor(n * n / 2);
        const r = Math.floor(currentCell / n) + step[0], c = currentCell % n + step[1];
        return r < 0 || c < 0 || r >= n || c >= n ? currentCell : r * n + c;
      });
      return;
    }
    if (enter) { event.preventDefault(); if (fresh) { if (cursor < 0) setCursor(Math.floor(n * n / 2)); else tap(cursor); } return; }
    if ((key === "h" || key === "H") && fresh) { event.preventDefault(); hint(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- cards ----
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("শব্দ খোঁজা রাফি ফুল ১২৩ ক্ষ শেষ পাতা").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, puzzle, format, site);
      if (friend && friendPreview.current) {
        const theirs = friend.page ? deal(friend.seed, friend.page, friend.pack, friend.level).puzzle : generate(friend.seed, friend.pack, friend.level);
        drawCard(friendPreview.current, friend, theirs, "feed", site);
      }
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws; run.phase brings the friend's canvas back with the start card.
  }, [state, format, site, friend, run.phase]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const card = resultBox.current, stage = card?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (card && stage) stage.scrollTo({ top: card.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else card?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the page looks like ----
  const palette = PALETTES[game.pack];
  const total = puzzle.words.length;
  const time = finish ? finish.time : totalTime(seconds, round.hinted.length);
  const onTrack = at ? starsOnTrack(time, at.three, at.two) : 0;
  const danger = Boolean(at) && run.phase === "playing" && edgeDanger(time, at!.three, at!.two);
  const owner = (cell: number) => round.found.find(index => puzzle.words[index].cells.includes(cell)) ?? -1;
  const hintCells = round.hinted.filter(index => !round.found.includes(index)).map(index => puzzle.words[index].cells[0]);
  const sungCells = sung.index >= 0 ? puzzle.words[sung.index].cells : [];
  const finale = page ? finaleName(page) : "";
  const world = page ? WORLDS[worldOf(page)] : null;
  const playing = run.phase === "playing";
  const over = run.phase === "over";
  const canHint = playing && nextHint(puzzle, round) >= 0;
  const ghost = teach && playing && !round.found.includes(0) ? puzzle.words[0].cells : null;
  const target = at ? (onTrack === 3 ? at.three : onTrack === 2 ? at.two : 0) : 0;

  const finishTitle = finish ? (finale ? `${finale}: ${countWord(total)}ই পেলে` : page ? `লেভেল ${bn(page)} শেষ` : packById(game.pack)?.done ?? "") : "";
  const nextWorld = page && isFinale(page) && page < STAGE_COUNT ? WORLDS[worldOf(page) + 1] : null;
  const finishLine = finish && shared ? (rival ? compareLine(finish.time, rival)
    : finale && finish.firstClear ? `${possessive(world?.page ?? "")} চার পাতা শেষ।${nextWorld ? ` পরের পাতা: ${nextWorld.page}।` : " পুরো বই শেষ।"}`
    : humanLine(shared)) : "";
  const finishNote = finish ? [
    (page ? pageNear(page, finish.time) : "") || (finish.previousBest !== null && finish.time < finish.previousBest ? `নতুন রেকর্ড। আগে লেগেছিল ${spoken(finish.previousBest)}।` : ""),
    best !== null ? `এই ফোনে সেরা ${clock(best)}।` : "",
  ].filter(Boolean).join(" ") : "";

  const style = { "--world": palette.ink, "--world-deep": palette.deep, "--paper": palette.paper, "--sheet": palette.sheet, "--edge": palette.edge, "--motif": palette.motif, "--n": n } as CSSProperties;

  return (
    <div ref={root} className="sk" style={style} data-phase={run.phase} data-calm={slow || undefined} data-finale={finale ? "" : undefined} data-words={total} data-n={n} onClick={dropFocus}>
      {run.phase === "ready" ? (
        <StartCard mode={mode} page={page || startLevel(open)} free={page ? free : { pack: game.pack, level: game.level }} stars={levels.stars[page] ?? 0} open={open} visit={visit}
          friend={friend} friendHere={Boolean(rival)} friendCanvas={friendPreview}
          onStart={start} onLevel={pickPage} onMode={chooseMode} onFree={pickFree} onSheet={openSheet} />
      ) : (
        <div className="sk-play">
          <header className="sk-hud">
            <button type="button" className="sk-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`${page ? pageLabel(page) : "নিজের মতো"}, সব লেভেল দেখো`}>
              <Motif pack={game.pack} />
              <b>{page ? (finale ? "শেষ পাতা" : `লেভেল ${bn(page)}`) : "নিজের মতো"}</b>
              <span>{page ? world?.page : `${packById(game.pack)?.name}, ${levelName(game.level)}`}</span>
            </button>
            <div className="sk-clock" role="timer" aria-label={`সময় ${spoken(Math.floor(time))}${at ? `, এখন ${bn(onTrack)} তারার পথে` : ""}`}>
              <b>{clock(time)}</b>
              {at ? (
                <>
                  <span className="sk-track" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < onTrack || undefined}>★</i>)}</span>
                  <span className="sk-meter" aria-hidden="true"><i style={{ transform: `scaleX(${1 - starTimeUsed(time, at.three, at.two)})` }} /></span>
                  <small>{target ? `${"★".repeat(onTrack)} ${clock(target)} পর্যন্ত` : "★ শেষ করলেই"}</small>
                </>
              ) : <small>{best !== null ? `সেরা ${clock(best)}` : "প্রথম গ্রিড"}</small>}
              {rival && <small className="sk-rival">{rival.name || "বন্ধু"} {clock(rival.time)}</small>}
              {runShow > 0 && <em className="sk-run" key={runShow}>টানা {bn(runShow)}</em>}
            </div>
          </header>

          <div className="sk-board" ref={board} data-danger={danger || undefined}>
            <div className="sk-progress" aria-hidden="true"><i style={{ transform: `scaleX(${round.found.length / total})` }} /></div>
            <div
              className="sk-grid" tabIndex={-1} role="application"
              aria-label={`${packById(game.pack)?.name} প্যাকের ${bn(n)} × ${bn(n)} অক্ষরের গ্রিড। প্রথম অক্ষর থেকে শেষ অক্ষর পর্যন্ত আঙুল টানো, বা দুটোয় পরপর চাপো। কিবোর্ডে তীর-চিহ্ন দিয়ে ঘুরে এন্টার চাপো।`}
              aria-describedby="sk-status"
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={cancelPress} onLostPointerCapture={cancelPress}
            >
              <svg className="sk-marks" viewBox={`0 0 ${n * U} ${n * U}`} aria-hidden="true">
                {hintCells.map(cell => <circle key={cell} className="sk-hint" cx={centre(cell, n)[0]} cy={centre(cell, n)[1]} r={43} />)}
                {miss.cells.length > 1 && <line key={miss.key} className="sk-miss" x1={centre(miss.cells[0], n)[0]} y1={centre(miss.cells[0], n)[1]} x2={centre(miss.cells[miss.cells.length - 1], n)[0]} y2={centre(miss.cells[miss.cells.length - 1], n)[1]} />}
                {ghost && (
                  <g className="sk-ghost" style={{ "--x1": `${centre(ghost[0], n)[0]}px`, "--y1": `${centre(ghost[0], n)[1]}px`, "--x2": `${centre(ghost[ghost.length - 1], n)[0]}px`, "--y2": `${centre(ghost[ghost.length - 1], n)[1]}px` } as CSSProperties}>
                    <line x1={centre(ghost[0], n)[0]} y1={centre(ghost[0], n)[1]} x2={centre(ghost[ghost.length - 1], n)[0]} y2={centre(ghost[ghost.length - 1], n)[1]} />
                    <circle className="sk-ghost-finger" r={26} />
                  </g>
                )}
                <line ref={trail} className="sk-trail" style={{ visibility: "hidden" }} />
                <circle ref={dot} className="sk-dot" r={30} style={{ visibility: "hidden" }} />
                {firstTap >= 0 && <circle className="sk-first" cx={centre(firstTap, n)[0]} cy={centre(firstTap, n)[1]} r={40} />}
                {cursor >= 0 && <rect className="sk-cursor" x={(cursor % n) * U + 5} y={Math.floor(cursor / n) * U + 5} width={U - 10} height={U - 10} rx={14} />}
              </svg>
              <div className="sk-cells" aria-hidden="true">
                {puzzle.grid.map((letter, cell) => {
                  const index = owner(cell), pop = sungCells.indexOf(cell);
                  return (
                    <span key={pop >= 0 ? `${cell}-${sung.key}` : cell} data-found={index >= 0 || undefined} data-pop={pop >= 0 && !slow ? "" : undefined}
                      style={index >= 0 ? { color: INKS[index % INKS.length], animationDelay: pop >= 0 ? `${pop * 60}ms` : undefined } : undefined}>{letter}</span>
                  );
                })}
              </div>
              <svg className="sk-ink" viewBox={`0 0 ${n * U} ${n * U}`} aria-hidden="true">
                {round.found.map(index => <Stroke key={`${game.seed}-${index}`} cells={puzzle.words[index].cells} ink={INKS[index % INKS.length]} n={n} slow={slow} />)}
              </svg>
            </div>
            {run.phase === "paused" && run.why === "away" && (
              <div className="sk-overlay">
                <div className="sk-note">
                  <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
                  <p className="sk-note-small">{clock(time)} · {bn(round.found.length)}/{bn(total)} শব্দ</p>
                  <button type="button" className="kit-primary" onClick={() => resumeFrom("away")}>চালিয়ে যাও</button>
                </div>
              </div>
            )}
          </div>

          <ul className="sk-words" aria-label="যে শব্দগুলো খুঁজতে হবে">
            {puzzle.words.map((word, index) => {
              const got = round.found.includes(index), hinted = round.hinted.includes(index);
              return (
                <li key={`${game.seed}-${index}`} data-found={got || undefined} data-hint={hinted && !got ? "" : undefined} data-sung={sung.index === index && !slow ? "" : undefined}
                  style={{ "--pen": INKS[index % INKS.length] } as CSSProperties}>
                  {puzzle.clue && !got && !hinted ? <span className="sk-w" aria-label={`${word.letters[0]} দিয়ে শুরু, ${bn(word.letters.length)} ঘর`}>{clueOf(word.letters)}</span> : <span className="sk-w">{word.word}</span>}
                  {got && <span className="sk-sr"> (পাওয়া গেছে)</span>}
                </li>
              );
            })}
          </ul>

          <p className="sk-msg" id="sk-status" role="status" aria-live="polite">
            {note || (ghost ? "আঙুল রাখো প্রথম অক্ষরে, টেনে নাও শেষ অক্ষর পর্যন্ত।" : playing ? `আর ${bn(total - round.found.length)}টা বাকি।` : "")}
          </p>

          {finish && shared ? (
            <Finish stats={finish} slow={slow} title={finishTitle} line={finishLine} note={finishNote} primary={primary} secondary={secondary} onSeeCard={seeCard} />
          ) : (
            <div className="sk-tools">
              <button type="button" className="sk-tool" onClick={hint} disabled={!canHint}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" strokeDasharray="3 3" /><path d="M12 9v3.5M12 15.5h.01" /></svg>হিন্ট <small>+{bn(HINT_SECONDS)} সে.</small>
              </button>
              <button type="button" className="sk-tool" onClick={openSheet}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" /></svg>সব লেভেল
              </button>
              {!page && (
                <button type="button" className="sk-tool" onClick={() => leave(() => load(freeDeal(game.pack, game.level)), "নতুন গ্রিড, ০:০০")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" /><path d="M4 4.5v4h4" /></svg>নতুন গ্রিড
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {sheet && (
        <LevelSheet stars={levels.stars} open={open} visit={visit} current={page} recommended={startLevel(open)}
          free={page ? null : { pack: game.pack, level: game.level }} onPick={pickPage} onFree={pickFree} onClose={closeSheet} />
      )}
      {ask && <AskCard ask={ask} onStay={stay} />}

      {finish && shared && (
        <section className="sk-result" id="result" ref={resultBox} aria-labelledby="sk-result-title">
          <h2 id="sk-result-title"><em>{spokenIn(shared.time)}</em> {countWord(total)} শব্দ, কার্ড তৈরি</h2>
          <p>{rival ? compareLine(shared.time, rival) : humanLine(shared)}</p>
          <div className="sk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sk-card-summary" />
              <figcaption id="sk-card-summary" className="sk-sr">শব্দ খোঁজার কার্ড: {page ? pageLabel(page) : packById(game.pack)?.name}, {clock(shared.time)}। {detail(shared)}। {humanLine(shared)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sk-share">
              <label className="sk-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`shobdo-khoja${page ? `-level-${page}` : ""}.png`} makeImage={() => cardBlob(shared, puzzle, format, site)} imageKey={`${state}|${format}`}
                caption={caption(shared)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই গ্রিডটাই পাবে, তারপর দেখবে কত সময়ে পারে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
