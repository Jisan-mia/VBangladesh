"use client";
// IP: what we avoided — no publisher's or app's name, logo, colours or grid styling; ours is plain newsprint with black print, ballpoint-blue entries, a yellow highlighter for the chosen cell, Bangla digits, and our own generated puzzles.
// The rules, the clock and what the phone keeps are pure (lib/game.ts, lib/session.ts, lib/save.ts); this file feeds them
// taps, keys and performance.now(), draws the result and plays the sounds.

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, hiss, sfx, tone, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { Stars } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  clashes, dailyPuzzle, digitsLeft, erase, filledRight, giveHint, isSolved, isWrong, levelPuzzle, nextStar, newlyDone, place,
  startGame, startLevel, starsEarned, tierOf, todayKey, toggleNote, undo, worldOf, LEVEL_COUNT, type Game, type Puzzle,
} from "../lib/game";
import { DAILIES, DAILY_ORDER, isFinale, type DailyKind } from "../lib/levels";
import { layout } from "../lib/sudoku";
import * as session from "../lib/session";
import { starTimeUsed, starsOnTrack } from "../lib/tick.hot";
import {
  addDay, dropWip, fromWip, hasWork, openAfter, putWip, puzzleKey, readDaily, readDays, readOpen, readWip, streak, toWip, week,
  DAILY_KEY, DAYS_KEY, OPEN_KEY, WIP_KEY,
} from "../lib/save";
import {
  bn, caption, clock, compareLine, dayLabel, duration, finaleName, fromPuzzle, humanLine, nearMissLine, parseShared, puzzleLabel, sharedHash, type Shared,
} from "../lib/link";
import { StartCard } from "./start-card";
import { LevelSheet } from "./level-sheet";
import { Finish, type FinishStats } from "./finish";

const TOOL = "sudoku";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

// Our sounds: a ballpoint tick on paper (the signature), a lighter pencil tick, an eraser rub, a small bell per finished
// line (scheduled on the audio clock, so a pause cuts it), and the page unfolding on শুরু করো.
const sound = {
  pen: () => { hiss(0.04, 0.12, 3800, "bandpass"); tone(2400, 0.02, 0.025, "triangle"); },
  pencil: () => hiss(0.025, 0.07, 5200, "bandpass"),
  rub: () => hiss(0.14, 0.09, 1100, "bandpass"),
  bell: (step: number) => { const f = [1047, 1319, 1568][Math.min(step, 2)], at = 0.09 + step * 0.14; tone(f, 0.5, 0.07, "sine", at); tone(f * 2, 0.3, 0.025, "sine", at + 0.01); },
  unfold: () => { hiss(0.12, 0.1, 2600, "bandpass"); hiss(0.18, 0.07, 1400, "bandpass", 0.09); },
};

type Finished = FinishStats & { previousBest: number | null; firstClear: boolean; at: number; cell: number };
const CLASH_WORDS = ["সারিতে", "কলামে", "বাক্সে"];

export function SudokuGame() {
  const [game, setGame] = useState<Game>(() => startGame(levelPuzzle(1)!));
  const [run, setRun] = useState<session.Session>(() => session.ready());
  const [selected, setSelectedState] = useState(-1);
  // The chosen cell is read from a ref too, so a digit tapped in the same frame as its cell lands on that cell.
  const picked = useRef(-1);
  const setSelected = (cell: number) => { picked.current = cell; setSelectedState(cell); };
  const [pencil, setPencilState] = useState(false);
  const pencilOn = useRef(false);
  const setPencil = (on: boolean) => { pencilOn.current = on; setPencilState(on); };
  const [seconds, setSeconds] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState({ cell: -1, key: 0 });
  const [flash, setFlash] = useState<number[]>([]);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [open, setOpen] = useState(1);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [kind, setKind] = useState<DailyKind>("e");
  const [days, setDays] = useState<number[]>([]);
  const [today, setToday] = useState(0);
  const [saved, setSaved] = useState<{ seconds: number; filled: number } | null>(null);
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const puzzle = game.puzzle, { n } = puzzle.shape;
  const level = "level" in puzzle ? puzzle.level : 0, day = "day" in puzzle ? puzzle.day : 0;
  const key = puzzleKey(puzzle);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  // Old best keys stay: sudoku-l12 and sudoku-d20261104 (the classic daily); the new dailies add their letter.
  const [best, submitBest] = useBest(level ? `${TOOL}-l${level}` : `${TOOL}-d${day}${"kind" in puzzle && puzzle.kind !== "h" ? puzzle.kind : ""}`, false);
  const rival = friend && friend.level === level && friend.day === day && (friend.kind ?? "h") === ("kind" in puzzle ? puzzle.kind : "h") ? friend : null;

  const root = useRef<HTMLDivElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const flashTimer = useRef(0);
  // False until the first real puzzle is on the board: the placeholder level 1 must never overwrite a saved grid.
  const live = useRef(false);
  const inView = useInView(root);
  // The latest of everything, for listeners that outlive a render (blur, pagehide, keys).
  const now = useRef({ game, run, finish });
  now.current = { game, run, finish };

  const elapsed = () => session.elapsed(now.current.run, performance.now());
  const shared: Shared | null = finish ? fromPuzzle(puzzle, finish.seconds, game.hints, name) : null;
  const state = shared ? sharedHash(shared) : "";

  // ---- saving: every move, every pause and when the page goes away, so one tap never loses a half-done grid ----
  function keep(next: Game, at: number) {
    const store = read(WIP_KEY);
    write(WIP_KEY, hasWork(next) && !isSolved(next) ? putWip(store, puzzleKey(next.puzzle), toWip(next, at)) : dropWip(store, puzzleKey(next.puzzle)));
  }
  function keepNow() {
    if (!live.current) return;
    const { game: current, run: r } = now.current;
    if (r.phase !== "over") keep(current, session.elapsed(r, performance.now()));
  }

  // ---- the clock: a 250 ms tick while playing; the reducer holds the truth ----
  useEffect(() => {
    if (run.phase === "over") return; // solved() shows the rounded result time
    if (run.phase !== "playing") { setSeconds(Math.floor(session.elapsed(run, performance.now()))); return; }
    const id = setInterval(() => setSeconds(Math.floor(session.elapsed(now.current.run, performance.now()))), 250);
    return () => clearInterval(id);
  }, [run]);

  function pauseFor(why: session.Why) {
    const r = now.current.run;
    if (r.phase !== "playing" && r.phase !== "paused") return;
    const next = session.pause(r, performance.now(), why);
    now.current.run = next;
    setRun(next);
    keepNow();
  }
  function resumeFrom(why: session.Why) {
    const next = session.resume(now.current.run, performance.now(), why);
    now.current.run = next;
    setRun(next);
  }

  function clearFlash() { window.clearTimeout(flashTimer.current); flashTimer.current = 0; setFlash([]); }

  /** Puts a puzzle on the start card: its saved half-done grid if this phone has one (unless `fresh`). */
  function load(next: Puzzle | null, fresh = false) {
    if (!next) return;
    keepNow();
    const k = puzzleKey(next);
    if (fresh) write(WIP_KEY, dropWip(read(WIP_KEY), k));
    const back = fresh ? null : fromWip(readWip(read(WIP_KEY), k), next);
    const restored = back && !isSolved(back.game) ? back : null;
    const g = restored ? restored.game : startGame(next);
    const r = session.ready(restored?.seconds ?? 0);
    now.current = { game: g, run: r, finish: null };
    live.current = true;
    setGame(g);
    setRun(r);
    setSaved(restored ? { seconds: restored.seconds, filled: filledRight(restored.game) } : null);
    setSeconds(restored?.seconds ?? 0);
    setFinish(null);
    setNote("");
    clearFlash();
    setPencil(false);
    setSheet(false);
    setSelected(g.values.indexOf(0));
  }
  const goTo = (to: number) => { if (to >= 1 && to <= LEVEL_COUNT && (to <= open || to === visit)) load(levelPuzzle(to)); };
  const home = () => load(levelPuzzle(startLevel(levels.stars, open)));
  function pickDaily(to: DailyKind) {
    setKind(to);
    write(DAILY_KEY, to);
    load(dailyPuzzle(today || todayKey(Date.now()), to));
  }

  function start() {
    const r = now.current.run;
    if (r.phase !== "ready") return;
    const next = session.begin(r, performance.now());
    now.current.run = next;
    setRun(next);
    sound.unfold();
  }

  // The player's menu: pause stops the clock and saves; চালিয়ে যাও starts it again; নতুন করে শুরু clears this grid.
  useGamePlayer({
    onPause: () => pauseFor("away"),
    onResume: () => resumeFrom("away"),
    onRestart: () => load(now.current.game.puzzle, true),
  });

  // Away without the player (or before its menu engages): blur and a hidden tab stop the clock too. Leaving saves.
  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", keepNow);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", keepNow);
      window.clearTimeout(flashTimer.current);
    };
  }, []);

  // Boot once this phone's stars are read: your own open levels (migrated once), the daily, then a friend's puzzle or yours.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const mine = readOpen(read(OPEN_KEY), levels.stars);
    if (read(OPEN_KEY) === null) write(OPEN_KEY, String(mine));
    setOpen(mine);
    const date = todayKey(Date.now());
    setToday(date);
    setKind(readDaily(read(DAILY_KEY)));
    setDays(readDays(read(DAYS_KEY)));
    setSite(window.location.host);
    setBooted(true);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      if (got.level) { setVisit(got.level); load(levelPuzzle(got.level)); }
      else load(dailyPuzzle(got.day, got.kind ?? "h"));
      return true;
    };
    if (!fromHash()) load(levelPuzzle(startLevel(levels.stars, mine)));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- moves ----
  function solved(next: Game, cell: number) {
    const at = performance.now(), r = session.finish(now.current.run, at);
    now.current.run = r;
    setRun(r);
    const time = Math.max(1, Math.round(session.elapsed(r, at)));
    setSeconds(time);
    write(WIP_KEY, dropWip(read(WIP_KEY), puzzleKey(next.puzzle)));
    const stars = starsEarned(time, next.hints, puzzle.par);
    const firstClear = level > 0 && !levels.stars[level];
    if (level) {
      levels.record(level, stars);
      const opened = openAfter(open, level);
      if (opened !== open) { setOpen(opened); write(OPEN_KEY, String(opened)); }
    } else {
      const list = addDay(days, day);
      setDays(list);
      write(DAYS_KEY, JSON.stringify(list));
    }
    const previousBest = best;
    const beaten = submitBest(time) && previousBest !== null;
    const done: Finished = { seconds: time, stars, own: puzzle.empty - next.hints, mistakes: next.mistakes, hints: next.hints, previousBest, firstClear, at, cell };
    now.current.finish = done;
    setFinish(done);
    setSelected(-1);
    setPencil(false);
    if (stars === 3 || beaten || (firstClear && isFinale(level))) {
      sfx.levelUp();
      if (!slow) confetti();
    } else sfx.good();
  }

  function apply(next: Game | null, cell: number, kind: "pen" | "pencil" | "rub" | "hint") {
    if (!next || !session.canMove(now.current.run)) return;
    const before = now.current.game;
    now.current.game = next;
    setGame(next);
    setNote("");
    if (isSolved(next)) { solved(next, cell); return; }
    keep(next, elapsed());
    if (kind === "pencil") { sound.pencil(); return; }
    if (kind === "rub") { sound.rub(); return; }
    if (isWrong(next, cell)) {
      sfx.wrong();
      setShake(current => ({ cell, key: current.key + 1 }));
      const why = clashes(next, cell)[0];
      if (why !== undefined) {
        const r = Math.floor(cell / n), c = cell % n, same = Math.floor(why / n) === r ? 0 : why % n === c ? 1 : 2;
        setNote(`এই ${CLASH_WORDS[same]} ${bn(next.values[cell])} আগেই আছে।`);
      } else setNote(`এখানে ${bn(next.values[cell])} বসবে না। মুছে আরেকটা দেখো, তারা কমবে না।`);
      return;
    }
    const done = newlyDone(before, next, cell);
    if (kind === "hint") sfx.pop(); else sound.pen();
    if (done.length) {
      done.forEach((_, step) => sound.bell(step));
      setFlash(current => [...current, ...done.flat()]);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash([]), 750);
    }
  }

  const playing = run.phase === "playing";

  function choose(cell: number) {
    if (!playing) return;
    setSelected(cell);
    if (puzzle.puzzle[cell]) setNote("");
  }
  function press(digit: number) {
    if (!playing) return;
    const g = now.current.game, cell = picked.current;
    if (cell < 0) { setNote("আগে একটা ফাঁকা ঘর চাপো।"); return; }
    if (puzzle.puzzle[cell]) { setNote("ছাপা সংখ্যা বদলানো যায় না। একটা ফাঁকা ঘর চাপো।"); return; }
    if (pencilOn.current) apply(toggleNote(g, cell, digit), cell, "pencil");
    else apply(place(g, cell, digit), cell, "pen");
  }
  function rubOut() { const cell = picked.current; if (playing && cell >= 0) apply(erase(now.current.game, cell), cell, "rub"); }
  function takeBack() { if (playing) apply(undo(now.current.game), picked.current, "rub"); }
  function help() {
    if (!playing) return;
    const given = giveHint(now.current.game, picked.current);
    if (!given) return;
    setSelected(given.cell);
    apply(given.game, given.cell, "hint");
  }
  function move(dr: number, dc: number) {
    const from = picked.current < 0 ? 0 : picked.current, r = Math.floor(from / n), c = from % n;
    choose(((r + dr + n) % n) * n + ((c + dc + n) % n));
  }
  function openSheet() { if (playing) pauseFor("sheet"); setSheet(true); }
  function closeSheet() { setSheet(false); resumeFrom("sheet"); }

  // ---- what the result offers ----
  const nextLevel = level && level < LEVEL_COUNT && (level + 1 <= openAfter(open, level)) ? level + 1 : 0;
  const harder = !level && "kind" in puzzle ? DAILY_ORDER[DAILY_ORDER.indexOf(puzzle.kind) + 1] : undefined;
  const primary = nextLevel ? { label: "পরের লেভেল", run: () => goTo(nextLevel) }
    : harder ? { label: `এবার ${DAILIES[harder].name}`, run: () => pickDaily(harder) }
    : { label: level ? "তোমার লেভেলে ফেরো" : "লেভেলে ফেরো", run: home };
  const secondary = [{ label: "আবার খেলো", run: () => load(puzzle, true) }];

  // ---- keys: arrows move, 1–9 (or ১–৯) write, 0/Backspace clear, P or N pencil, Z undo, H hint ----
  // Enter and Space belong to the game: they start from the start card and go on from the result (only on a fresh press
  // after it appears), and never re-press the last button clicked (clicked buttons drop focus, see onClick below).
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (sheet) return;
    const key = event.key, enter = key === "Enter" || key === " ";
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab: let it do its own job
    const fresh = !event.repeat;
    if (run.phase === "ready") {
      if (enter && fresh) { event.preventDefault(); start(); }
      return;
    }
    if (run.phase === "paused") {
      if (enter) { event.preventDefault(); if (fresh) resumeFrom("away"); }
      return;
    }
    if (run.phase === "over") {
      if (enter) { event.preventDefault(); if (fresh && finish && event.timeStamp > finish.at + 400) primary.run(); }
      return;
    }
    const bangla = BN_DIGITS.indexOf(key), digit = bangla >= 0 ? bangla : /^\d$/.test(key) ? Number(key) : -1;
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (enter) { event.preventDefault(); return; }
    if (arrows[key]) { event.preventDefault(); move(...arrows[key]); return; }
    if (digit >= 1 && digit <= n) { event.preventDefault(); if (fresh) press(digit); return; }
    if (digit === 0 || key === "Backspace" || key === "Delete") { event.preventDefault(); if (fresh) rubOut(); return; }
    if (!fresh) return;
    if (key === "p" || key === "P" || key === "n" || key === "N") { event.preventDefault(); setPencil(!pencilOn.current); return; }
    if (key === "z" || key === "Z") { event.preventDefault(); takeBack(); return; }
    if (key === "h" || key === "H") { event.preventDefault(); help(); }
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
    loadCardFonts("সুডোকু রাফি ৪ মিনিট ১২ সেকেন্ডে").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
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

  // ---- what each cell looks like ----
  const { peers } = layout(puzzle.shape);
  const near = new Set(selected >= 0 ? peers[selected] : []);
  const sameDigit = selected >= 0 ? game.values[selected] : 0;
  const flashing = new Set(flash);
  const clashing = new Set<number>();
  game.values.forEach((_, cell) => { if (isWrong(game, cell)) for (const peer of clashes(game, cell)) clashing.add(peer); });
  const left = digitsLeft(game);
  const filled = filledRight(game);
  const over = run.phase === "over";
  const last = finish ? finish.cell : -1;

  function cellLabel(cell: number) {
    const value = game.values[cell], where = `সারি ${bn(Math.floor(cell / n) + 1)}, কলাম ${bn(cell % n + 1)}`;
    if (puzzle.puzzle[cell]) return `${where}: ছাপা ${bn(value)}`;
    if (value) return `${where}: ${bn(value)}${isWrong(game, cell) ? ", ভুল" : ""}`;
    const marks = [...Array(n).keys()].map(d => d + 1).filter(d => game.notes[cell] & (1 << d));
    return `${where}: ফাঁকা${marks.length ? `, খসড়ায় ${marks.map(bn).join(" ")}` : ""}`;
  }

  const onTrack = starsOnTrack(seconds, game.hints, puzzle.par);
  const finale = finaleName(level);
  const world = level ? worldOf(level) : 4;
  const tier = level ? tierOf(level) : null;
  const dailyKind = "kind" in puzzle ? puzzle.kind : "h";
  const next = finish ? nextStar(finish.seconds, game.hints, puzzle.par) : null;
  const finishLine = finish ? (rival ? compareLine(finish.seconds, rival.seconds, rival.name)
    : finish.firstClear && isFinale(level) ? `${tier?.name} ধাপের ১০টা লেভেল শেষ। ${finale} মেলানো।`
    : humanLine(finish.stars, game.hints, puzzle.empty)) : "";
  const finishNote = finish ? [
    nearMissLine(next) || (finish.previousBest !== null && finish.seconds < finish.previousBest ? `নতুন রেকর্ড। আগে লেগেছিল ${duration(finish.previousBest)}।` : ""),
    best !== null ? `এই ফোনে সেরা ${clock(best)}।` : "",
  ].filter(Boolean).join(" ") : "";
  const result = finish && shared;

  return (
    <div ref={root} className="sd" data-world={world} data-size={n} data-calm={slow || undefined} data-phase={run.phase} onClick={dropFocus}>
      {run.phase === "ready" ? (
        <StartCard puzzle={puzzle} stars={levels.stars[level] ?? 0} open={open} visit={visit} saved={saved}
          friend={friend} friendHere={Boolean(rival)} friendCanvas={friendPreview}
          week={week(days, today || 20260101)} streak={today ? streak(days, today) : 0} today={today} kind={kind}
          onStart={start} onFresh={() => load(puzzle, true)} onLevel={goTo} onDaily={pickDaily} onLevels={() => { if (!level) home(); }}
          onSheet={openSheet} />
      ) : (
        <div className="sd-play">
          <header className="sd-hud">
            <button type="button" className="sd-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`${level ? `লেভেল ${bn(level)}` : "রোজের ধাঁধা"}, সব লেভেল দেখো`}>
              <i aria-hidden="true" />
              <b>{level ? `লেভেল ${bn(level)}` : dayLabel(day)}</b>
              <span>{level ? `${tier?.name} · ${bn(n)}×${bn(n)}` : `${DAILIES[dailyKind].name} · ${bn(n)}×${bn(n)}`}</span>
            </button>
            <div className="sd-clock" role="timer" aria-label={`সময় ${duration(seconds)}, এখন ${bn(onTrack)} তারার পথে`}>
              <b>{clock(seconds)}</b>
              <span className="sd-track" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < onTrack || undefined}>★</i>)}</span>
              <span className="sd-meter" aria-hidden="true"><i style={{ transform: `scaleX(${1 - starTimeUsed(seconds, puzzle.par)})` }} /></span>
              {rival && <small>{rival.name || "বন্ধু"} {clock(rival.seconds)}</small>}
            </div>
          </header>

          <div className="sd-board" data-phase={run.phase}>
            <div className="sd-progress" aria-hidden="true"><i style={{ transform: `scaleX(${filled / Math.max(1, puzzle.empty)})` }} /></div>
            <div className="sd-grid" role="group" aria-label={`${bn(n)}×${bn(n)} সুডোকু ছক, ${bn(filled)}/${bn(puzzle.empty)} ঘর ভরা`}>
              {game.values.map((value, cell) => {
                const r = Math.floor(cell / n), c = cell % n;
                const classes = [
                  puzzle.puzzle[cell] ? "given" : value ? "pen" : "",
                  cell === selected ? "picked" : near.has(cell) ? "near" : "",
                  sameDigit && value === sameDigit && cell !== selected ? "same" : "",
                  isWrong(game, cell) ? "wrong" : "",
                  clashing.has(cell) ? "clash" : "",
                  flashing.has(cell) && !slow ? "done" : "",
                  c % puzzle.shape.cols === 0 && c ? "edge-left" : "",
                  r % puzzle.shape.rows === 0 && r ? "edge-top" : "",
                  shake.cell === cell && !slow ? (shake.key % 2 ? "shake-a" : "shake-b") : "",
                ].filter(Boolean).join(" ");
                const wave = over && !slow && last >= 0 ? Math.abs(Math.floor(last / n) - r) + Math.abs((last % n) - c) : -1;
                return (
                  <button key={cell} type="button" className={`sd-cell ${classes}`} data-wave={wave >= 0 || undefined}
                    style={wave >= 0 ? { animationDelay: `${wave * 45}ms` } : undefined}
                    onPointerDown={() => choose(cell)} onClick={event => { if (event.detail === 0) choose(cell); }}
                    aria-label={cellLabel(cell)} aria-pressed={cell === selected} disabled={over}>
                    {value ? bn(value) : game.notes[cell] ? (
                      <span className="sd-notes" aria-hidden="true">
                        {[...Array(n).keys()].map(d => <i key={d}>{game.notes[cell] & (1 << (d + 1)) ? bn(d + 1) : ""}</i>)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {run.phase === "paused" && run.why === "away" && (
              <div className="sd-overlay">
                <div className="sd-note">
                  <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
                  <p className="sd-note-small">{clock(seconds)} · {bn(filled)}/{bn(puzzle.empty)} ঘর ভরা</p>
                  <button type="button" className="kit-primary" onClick={() => resumeFrom("away")}>চালিয়ে যাও</button>
                </div>
              </div>
            )}
          </div>

          <p className="sd-msg" role="status" aria-live="polite">{note || (pencil && playing ? "খসড়া চালু: সংখ্যা ছোট করে লেখা হবে।" : "")}</p>

          {finish ? (
            <Finish stats={finish} slow={slow}
              title={finale && finish.firstClear ? `${finale} মিলেছে` : `ছক মিলেছে, ${duration(finish.seconds)}ে`}
              line={finishLine} note={finishNote} primary={primary} secondary={secondary} onSeeCard={seeCard} />
          ) : (
            <>
              <div className="sd-pad" data-pencil={pencil || undefined}>
                {[...Array(n).keys()].map(d => (
                  <button key={d} type="button" className="sd-digit" onPointerDown={event => { event.preventDefault(); press(d + 1); }}
                    onClick={event => { if (event.detail === 0) press(d + 1); }} disabled={!playing || !left[d + 1]}
                    aria-label={`${bn(d + 1)}${pencil ? " খসড়ায়" : ""}${left[d + 1] ? `, আর ${bn(left[d + 1])}টা বাকি` : ", সব বসানো হয়ে গেছে"}`}>
                    {bn(d + 1)}<small aria-hidden="true">{left[d + 1] ? bn(left[d + 1]) : ""}</small>
                  </button>
                ))}
              </div>
              <div className="sd-tools">
                <button type="button" className="sd-tool" aria-pressed={pencil} onClick={() => setPencil(!pencilOn.current)} disabled={!playing}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z" /><path d="M14 6l4 4" /></svg>খসড়া
                </button>
                <button type="button" className="sd-tool" onClick={rubOut} disabled={!playing || selected < 0}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20h12" /><path d="M5 14l8-8 6 6-6 6H9z" /></svg>মুছে দাও
                </button>
                <button type="button" className="sd-tool" onClick={takeBack} disabled={!playing || !game.history.length}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
                </button>
                <button type="button" className="sd-tool" onClick={help} disabled={!playing}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 1-1 1.7V14" /><path d="M12 18h.01" /></svg>বলে দাও
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {sheet && (
        <LevelSheet stars={levels.stars} open={open} visit={visit} current={level} recommended={startLevel(levels.stars, open)}
          onPick={pick => load(levelPuzzle(pick))} onClose={closeSheet} />
      )}

      {result && (
        <section className="sd-result" id="result" ref={resultBox} aria-labelledby="sd-result-title">
          <h2 id="sd-result-title"><em>{finale || (level ? `লেভেল ${bn(level)}` : puzzleLabel(result))}</em> মিলল {duration(result.seconds)}ে</h2>
          <p><Stars count={finish.stars} /> {finishLine}</p>
          <div className="sd-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sd-card-summary" />
              <figcaption id="sd-card-summary" className="sd-sr">কার্ড: {puzzleLabel(result)}, {duration(result.seconds)}, {bn(finish.stars)} তারা। {humanLine(finish.stars, game.hints, puzzle.empty)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sd-share">
              <label className="sd-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`sudoku-${level ? `level-${level}` : `${day}${result.kind ?? ""}`}.png`} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`}
                caption={caption(result)} state={state}
                hint="বন্ধু লিংক খুললে একই ছক পাবে, পাশে তোমার সময়।"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
