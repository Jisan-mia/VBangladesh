"use client";
// IP: what we avoided — no genre leader's name, grey tiles, smiley button, mines, flags or its number colours; ours is a mango orchard with bushes, hidden hornet nests, a checked গামছা as the marker, fallen mangoes and bamboo posts, our own number colours, sounds and generated no-guess orchards.
// The rules, the solver, the ladder, the clock and what the phone keeps are pure (lib/orchard.ts, lib/play.ts, lib/levels.ts,
// lib/flow.ts, lib/save.ts); this file feeds them taps, keys and performance.now(), draws the orchard and plays the sounds.
// The shared player owns pause: its menu, blur and a hidden tab all hold play, and a held finger is let go.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, loop, newSeed, shake, totalStars, useBest, useLevels, useSlowMode, useSound, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cardBlob, drawCard } from "../lib/card";
import {
  badge, bn, caption, clearLine, clock, compareLine, finishTitle, hintLine, humanLine, levelLabel, lossLine, nearMissLine, parseShared, sharedHash, stingLine, timeText, worldTotal, type Shared,
} from "../lib/challenge";
import { humLevel, humPitch, rippleDelay } from "../lib/count.hot";
import * as F from "../lib/flow";
import { LEVEL_COUNT, isFinale, levelName, levelOf, worldOf } from "../lib/levels";
import { kinds, MANGO } from "../lib/orchard";
import {
  dig, enter, lessonStep, nestsLeft, newRound, nextStar, onTrack, openCount, puzzleOf, safeCount, starsEarned, takeHint, tie, tiedCount,
  OPEN, STUNG, TIED, type Hint, type Move, type Puzzle, type Round,
} from "../lib/play";
import { bestSlug, OPEN_KEY, openAfter, readOpen, startLevel, TOOL } from "../lib/save";
import { Finish, type Choice, type Stat } from "./finish";
import { LevelSheet } from "./level-sheet";
import { OrchardView, type GridHandlers } from "./orchard-view";
import { basket, blockedSound, enterPath, hintSound, rustle, sting, swarm, tieSound, untieSound } from "./sound";
import { StartCard } from "./start-card";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: nothing to keep */ } };
const clockNow = () => performance.now();
const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
const firstPuzzle = () => puzzleOf(1, 1)!;

type Finished = { won: boolean; stars: number; seconds: number; record: boolean; firstClear: boolean; previousBest: number | null; stats: Stat[] };
type Burst = { cell: number; key: number; big: boolean };

export function ChakGame() {
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [round, setRoundState] = useState<Round>(() => newRound(firstPuzzle()));
  const [run, setRunState] = useState<F.Flow>(() => F.titleFlow());
  const [delays, setDelays] = useState<Int16Array | undefined>(undefined);
  const [marking, setMarking] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [hint, setHint] = useState<Hint | null>(null);
  const [note, setNote] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [sheet, setSheet] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const puzzle = round.puzzle, { level, legacy, orchard, par } = puzzle;
  const [best, submitBest] = useBest(bestSlug(level, legacy), false);

  const root = useRef<HTMLDivElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const hum = useRef<ReturnType<typeof loop> | null>(null);
  const timers = useRef({ hold: 0, hint: 0, burst: 0 });
  const touch = useRef({ x: 0, y: 0, swallow: false, kind: "" });
  const inView = useInView(root);
  // The latest of everything, for listeners and timers that outlive a render.
  const now = useRef({ round, run, open, marking, slow });
  now.current.open = open; now.current.marking = marking; now.current.slow = slow;
  const setRound = (next: Round) => { now.current.round = next; setRoundState(next); };
  const setRun = (next: F.Flow) => { now.current.run = next; setRunState(next); };
  const clearTimers = () => { const t = timers.current; window.clearTimeout(t.hold); window.clearTimeout(t.hint); window.clearTimeout(t.burst); t.hold = t.hint = t.burst = 0; };

  // ---- loading an orchard onto the start card ----
  function load(next: Puzzle | null) {
    if (!next) return;
    clearTimers();
    setRound(newRound(next));
    setRun(F.toTitle(now.current.run));
    setDelays(undefined); setCursor(-1); setHint(null); setNote(""); setFinish(null); setSheet(false); setBurst(null); setSeconds(0); setMarking(false);
  }
  const reach = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  /** A friend's level replays the friend's orchard; every other start is a fresh orchard. */
  const seedFor = (to: number) => friend && !friend.legacy && friend.level === to ? friend.seed : newSeed();
  const goLevel = (to: number) => { if (reach(to)) load(puzzleOf(to, seedFor(to))); };
  const home = () => load(puzzleOf(startLevel(levels.stars, now.current.open), newSeed()));
  const again = () => { const p = now.current.round.puzzle; load(p.legacy || (friend && friend.seed === p.seed) ? puzzleOf(p.level, p.seed, p.legacy, p.orchard.start) : puzzleOf(p.level, newSeed())); };

  /** A click handler that ignores the click which brought the window back, and anything while play is held. */
  const guarded = <T extends unknown[]>(act: (...args: T) => void) => (...args: T) => { if (F.awake(now.current.run, clockNow()) && !F.held(now.current.run)) act(...args); };

  function ripple(opened: Move["opened"]) {
    if (!opened.length) return;
    const next = new Int16Array(now.current.round.cells.length);
    for (const [cell, ring] of opened) next[cell] = rippleDelay(ring, now.current.slow);
    setDelays(next);
  }

  function startPlay() {
    const { run: r, round: current } = now.current;
    if (r.screen !== "title" || F.held(r) || !F.awake(r, clockNow())) return;
    const move = enter(current);
    if (!move) return;
    setRound(move.round);
    setRun(F.start(r, clockNow()));
    ripple(move.opened);
    enterPath();
  }

  // ---- the player's menu, and being away: both hold play and let go of a held finger ----
  const player = useGamePlayer({
    onPause: () => { window.clearTimeout(timers.current.hold); setRun(F.menu(now.current.run, true, clockNow())); },
    onResume: () => setRun(F.menu(now.current.run, false, clockNow())),
    onRestart: () => { setRun(F.menu(now.current.run, false, clockNow())); again(); },
  });
  useEffect(() => {
    const gone = () => { window.clearTimeout(timers.current.hold); setRun(F.away(now.current.run, true, clockNow())); };
    const back = () => setRun(F.away(now.current.run, false, clockNow()));
    const seen = () => { if (document.hidden) gone(); else back(); };
    if (document.hidden) gone();
    window.addEventListener("blur", gone);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", gone); window.removeEventListener("focus", back); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- boot: your own open level (set once from the saved stars), then a friend's orchard or where you left off ----
  function openFriend(shared: Shared) {
    const next = puzzleOf(shared.level, shared.seed, shared.legacy, shared.first);
    if (!next) return;
    setFriend(shared);
    if (!shared.legacy) setVisit(shared.level);
    load(next);
  }
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const raw = read(OPEN_KEY), mine = readOpen(raw, levels.stars);
    if (raw === null) write(OPEN_KEY, String(mine));
    setOpen(mine);
    now.current.open = mine;
    setSite(window.location.host);
    setBooted(true);
    const shared = parseShared(window.location.hash);
    if (shared) openFriend(shared);
    else load(puzzleOf(startLevel(levels.stars, mine), newSeed()));
    // A link pasted into this tab: open it, but never throw away an orchard you're in the middle of.
    const onHash = () => {
      const next = parseShared(window.location.hash), { run: r } = now.current;
      if (next && r.screen !== "play") openFriend(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  useEffect(() => () => { clearTimers(); hum.current?.stop(); hum.current = null; }, []);

  // ---- the star clock on screen ----
  const live = F.running(run);
  useEffect(() => {
    if (!live) { setSeconds(Math.floor(F.elapsed(now.current.run, clockNow()))); return; }
    const id = window.setInterval(() => setSeconds(Math.floor(F.elapsed(now.current.run, clockNow()))), 250);
    return () => window.clearInterval(id);
  }, [live]);

  // ---- the hornets' hum after a sting: only on a live orchard, with sound on; a fresh loop each time it comes back ----
  const humWanted = F.wantsHum(soundIsOn, run, round.stings) && round.status === "playing";
  useEffect(() => {
    if (!humWanted) { hum.current?.stop(); hum.current = null; return; }
    // Never kept across a stop: a loop made while muted is a silent stub, so a fresh one starts every time it's wanted again.
    if (!hum.current) hum.current = loop("hum", humPitch(round.stings));
    hum.current.set(humLevel(round.stings));
    hum.current.pitch(humPitch(round.stings));
  }, [humWanted, round.stings]);

  // ---- moves ----
  function endRound(done: Round, before: Round) {
    const at = clockNow(), flow = F.finish(now.current.run, at);
    setRun(flow);
    const time = Math.max(1, Math.round(F.elapsed(flow, at))), p = done.puzzle, won = done.status === "won";
    const stats: Stat[] = [
      { label: "সময়", value: time, time: true },
      { label: "সাফ ঝোপ", value: openCount(done.cells), of: safeCount(p.orchard) },
      { label: "গামছা", value: tiedCount(before.cells) - before.stings },
      { label: "ভুল", value: done.stings },
    ];
    const mangoes = kinds(p.orchard, MANGO);
    if (won && mangoes) stats.push({ label: "আম কুড়ালে", value: mangoes });
    if (done.hints) stats.push({ label: "হিন্ট", value: done.hints });
    let stars = 0, record = false, firstClear = false;
    const previousBest = best;
    if (won) {
      stars = starsEarned(time, done.hints, done.stings, p.par);
      if (!p.legacy) {
        // Stars and the open level are recorded the moment the orchard clears, never in a timer a quick tap could cancel.
        firstClear = !levels.stars[p.level];
        levels.record(p.level, stars);
        const opened = openAfter(now.current.open, p.level);
        if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
      }
      record = submitBest(time) && previousBest !== null;
      basket(p.legacy ? 1 : worldOf(p.level));
      if ((stars === 3 || record || (firstClear && isFinale(p.level))) && !now.current.slow) confetti({ colors: ["#f2b632", "#e07b28", "#c8322b", "#ffffff", "#6aa84f", "#2f6b2a"] });
    } else {
      swarm(now.current.slow);
      if (!now.current.slow) shake(boardBox.current);
    }
    setMarking(false); setCursor(-1);
    setFinish({ won, stars, seconds: time, record, firstClear, previousBest, stats });
  }

  function land(move: Move) {
    const before = now.current.round;
    setRound(move.round);
    ripple(move.opened);
    setNote("");
    if (move.stung.length) {
      window.clearTimeout(timers.current.burst);
      setBurst({ cell: move.stung[0], key: clockNow(), big: move.lost });
      if (!move.lost) {
        timers.current.burst = window.setTimeout(() => setBurst(null), 1300);
        sting();
        if (!now.current.slow) shake(boardBox.current);
        setNote(stingLine(move.round.puzzle.forgive - move.round.stings));
      }
    } else if (move.opened.length) rustle(move.opened.length);
    if (move.lost || move.won) endRound(move.round, before);
  }

  function clearAt(cell: number) {
    const current = now.current.round, state = current.cells[cell];
    if (state === TIED) { setNote("গামছা বাঁধা ঝোপ সাফ হয় না। আগে গামছা খোলো।"); blockedSound(); return; }
    if (state === OPEN && current.puzzle.orchard.kind[cell] === MANGO) { setNote("আমটা শেষে ঝুড়িতে উঠবে। আগে বাকি ঝোপ সাফ করো।"); blockedSound(); return; }
    const move = dig(current, cell);
    if (!move) {
      if (state === OPEN && current.puzzle.orchard.count[cell]) { setNote("এই সংখ্যার সব চাকে আগে গামছা বাঁধো, তারপর সংখ্যায় চাপো।"); blockedSound(); }
      return;
    }
    setHint(null);
    land(move);
  }

  function tieAt(cell: number) {
    const current = now.current.round, next = tie(current, cell);
    if (!next) { if (current.cells[cell] === OPEN) clearAt(cell); return; }
    setRound(next);
    setNote("");
    if (next.cells[cell] === TIED) tieSound(); else untieSound();
  }

  /** One act on a bush: a গামছা when asked (right click, G, long press, or গামছা mode on a covered bush), else clear it. */
  function act(cell: number, tieIt: boolean) {
    if (!F.takesPress(now.current.run, clockNow()) || now.current.round.status !== "playing") return;
    setCursor(cell);
    if (tieIt || (now.current.marking && now.current.round.cells[cell] !== OPEN)) tieAt(cell); else clearAt(cell);
  }

  function askHint() {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const move = takeHint(now.current.round);
    if (!move) return;
    hintSound();
    land(move);
    if (move.round.status === "playing") {
      setHint(move.hint);
      window.clearTimeout(timers.current.hint);
      timers.current.hint = window.setTimeout(() => setHint(null), 2600);
    }
  }

  // ---- touch: a tap acts when the finger lifts (under 50 ms), a long press ties a গামছা, and a finger that travels is a scroll ----
  const handlers: GridHandlers = {
    onDown(cell, event: PointerEvent<HTMLDivElement>) {
      touch.current.kind = event.pointerType;
      if (event.pointerType === "mouse") {
        if (event.button === 0) act(cell, false);
        else if (event.button === 2) act(cell, true);
        return;
      }
      if (!event.isPrimary || !F.takesPress(now.current.run, clockNow())) return;
      const at = clockNow(), state = now.current.round.cells[cell];
      window.clearTimeout(timers.current.hold);
      touch.current = { x: event.clientX, y: event.clientY, swallow: false, kind: event.pointerType };
      setRun(F.pressDown(now.current.run, cell, at));
      if (state === OPEN) return;
      timers.current.hold = window.setTimeout(() => {
        if (F.holdTies(now.current.run, cell, clockNow()) < 0) return;
        touch.current.swallow = true;
        setRun(F.pressUp(now.current.run));
        tieAt(cell);
      }, F.holdMs(now.current.slow));
    },
    onMove(event) {
      const r = now.current.run;
      if (r.hold >= 0 && Math.hypot(event.clientX - touch.current.x, event.clientY - touch.current.y) > 12) {
        window.clearTimeout(timers.current.hold);
        touch.current.swallow = true;
        setRun(F.pressUp(r));
      }
    },
    onUp(event) {
      const r = now.current.run, cell = r.hold;
      window.clearTimeout(timers.current.hold);
      if (cell < 0) return;
      setRun(F.pressUp(r));
      if (event.type === "pointercancel" || touch.current.swallow) return;
      act(cell, false);
    },
    onKeyCell(cell) { act(cell, false); },
  };

  // ---- the sheet holds play while it's open ----
  function openSheet() { setSheet(true); setRun(F.sheet(now.current.run, true, clockNow())); }
  function closeSheet() { setSheet(false); setRun(F.sheet(now.current.run, false, clockNow())); }

  // ---- what the result offers ----
  const over = run.screen === "over" && finish !== null;
  const won = over && finish.won;
  const nextLevel = won && !legacy && level < LEVEL_COUNT && reach(level + 1) && level + 1 <= openAfter(open, level) ? level + 1 : 0;
  const choices: Choice[] = !over ? [] : won
    ? [
      ...(nextLevel ? [{ label: "পরের লেভেল", run: () => goLevel(nextLevel) }] : []),
      ...(legacy ? [{ label: "নিজের লেভেলে ফেরো", run: home }] : []),
      { label: "আবার খেলো", run: again },
      ...(!legacy ? [{ label: level > open ? "নিজের লেভেলে ফেরো" : "সব লেভেল", run: level > open ? home : openSheet }] : []),
    ]
    : [{ label: "আরেকবার", run: again }, legacy ? { label: "নিজের লেভেলে ফেরো", run: home } : { label: "সব লেভেল", run: openSheet }];

  // ---- keys: arrows walk a cursor, Enter or Space clears, G or F ties, M switches mode, H hints, P pauses (the player's menu) ----
  // Enter and Space belong to the game: on the start card they start, on the result they run choice ১ (only on a fresh press
  // after it appears), and never re-press the last button clicked (clicked buttons drop focus, see dropFocus).
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (run.menu) return;
    const key = event.key, enter = key === "Enter" || key === " ";
    if (sheet) {
      const digit = "123456789".indexOf(key);
      if (digit >= 0 && !event.repeat) { const pick = (worldOf(Math.max(1, level)) - 1) * 10 + digit + 1; if (reach(pick)) { event.preventDefault(); closeSheet(); goLevel(pick); } }
      return;
    }
    if (enter && element?.closest?.("button, a, summary") && !element.closest(".bc-cell")) return; // a button reached with Tab does its own job
    if ((key === "p" || key === "P") && run.screen === "play") { event.preventDefault(); if (!event.repeat) player.requestPause(); return; }
    if (run.screen === "title") {
      if (enter) { event.preventDefault(); if (!event.repeat) startPlay(); return; }
      if (!legacy && (key === "ArrowLeft" || key === "ArrowRight")) { event.preventDefault(); guarded(goLevel)(level + (key === "ArrowLeft" ? -1 : 1)); }
      return;
    }
    if (run.screen === "over") {
      const pick = enter ? 0 : "123".indexOf(key);
      if (pick >= 0 && choices[pick]) { event.preventDefault(); if (F.takesResultKey(run, clockNow(), event.repeat)) choices[pick].run(); }
      return;
    }
    if (!F.running(run)) return;
    const arrow = ARROWS[key], { cols, rows } = orchard;
    if (arrow) {
      event.preventDefault();
      const from = cursor < 0 ? orchard.start : cursor;
      const r = Math.min(rows - 1, Math.max(0, Math.floor(from / cols) + arrow[0])), c = Math.min(cols - 1, Math.max(0, (from % cols) + arrow[1]));
      setCursor(r * cols + c);
      boardBox.current?.querySelector<HTMLButtonElement>(`[data-index="${r * cols + c}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (event.repeat) return;
    const at = cursor < 0 ? orchard.start : cursor;
    if (enter) { event.preventDefault(); act(at, false); return; }
    if ("gGfF".includes(key)) { event.preventDefault(); act(at, true); return; }
    if (key === "m" || key === "M") { event.preventDefault(); setMarking(on => !on); return; }
    if (key === "h" || key === "H") { event.preventDefault(); askHint(); }
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
    if (button instanceof HTMLButtonElement && !button.classList.contains("bc-cell")) button.blur();
  }

  // ---- the card ----
  const rival = friend && friend.level === level && friend.legacy === legacy && friend.seed === puzzle.seed ? friend : null;
  const shared: Shared | null = won ? { level, legacy, seed: puzzle.seed, first: legacy ? orchard.start : -1, seconds: finish.seconds, hints: round.hints, stings: round.stings, name } : null;
  const state = shared ? sharedHash(shared) : "";
  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ভিমরুলের চাক লেভেল ১২৩ রাফি ${levelName(level)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const card = resultBox.current, stage = card?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (card && stage) stage.scrollTo({ top: card.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else card?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the HUD and the status line show ----
  const info = legacy ? null : levelOf(level);
  const finale = info?.finale;
  const world = legacy ? 1 : worldOf(level);
  const total = totalStars(levels.stars);
  const tag = badge(level, legacy);
  const teaching = !levels.stars[1] && !friend ? lessonStep(round) : 0;
  const teach = round.lesson;
  const teachCells = new Set<number>(teach && teaching === 2 ? [teach.clue, teach.nest] : teach && teaching === 3 ? [teach.helper, ...teach.safe.filter(cell => round.cells[cell] !== OPEN)] : []);
  const clueCells = new Set<number>(hint ? [...hint.clues, ...hint.nests] : []);
  const cleared = openCount(round.cells), safe = safeCount(orchard);
  const track = run.screen === "play" ? onTrack(seconds, round.hints, round.stings, par) : 3;
  const danger = run.screen === "play" && round.stings ? (round.stings >= puzzle.forgive ? 2 : 1) : 0;
  const status = hint ? hintLine(hint)
    : note ? note
    : teaching === 2 ? `২/৩ · দাগ দেওয়া ১-এর পাশে ঢাকা ঝোপ একটাই, চাক ওখানেই। ঝোপটায় আঙুল চেপে ধরো, বা ‘গামছা’ বেছে চাপো।`
    : teaching === 3 ? `৩/৩ · ওই চাকে গামছা বাঁধা। তাই দাগ দেওয়া ১-এর পাশের বাকি ঝোপ নিরাপদ। ${marking ? "‘ঝোপ সাফ’ বেছে " : ""}ঝোপগুলোয় চাপো।`
    : marking ? "গামছা চালু: ঝোপে চাপলে গামছা বাঁধা হবে, আবার চাপলে খুলবে।"
    : !round.moves && info ? info.line
    : `৩ তারা: ${timeText(par)}ের মধ্যে`;
  const finishNote = over ? [
    finish.won
      ? (rival ? compareLine(finish.seconds, rival.seconds, rival.name)
        : finish.record && finish.previousBest !== null ? `এই লেভেলে নতুন রেকর্ড! আগে লেগেছিল ${timeText(finish.previousBest)}।`
        : nearMissLine(nextStar(finish.seconds, round.hints, round.stings, par)))
      : lossLine(safe - cleared),
    finish.won && !legacy && isFinale(level) ? worldTotal(level, levels.stars) : "",
    !finish.won ? (rival ? "বন্ধুর বাগানটাই আবার আসবে।" : legacy ? "একই পুরোনো বাগান আবার আসবে।" : "নতুন বাগান, একই লেভেল।") : "",
  ].filter(Boolean).join(" ") : "";
  const hitAt = burst ? { "--hx": `${((burst.cell % orchard.cols) + 0.5) / orchard.cols * 100}%`, "--hy": `${(Math.floor(burst.cell / orchard.cols) + 0.5) / orchard.rows * 100}%` } as CSSProperties : undefined;

  return (
    <div ref={root} className="bc" data-world={world} data-screen={run.screen} data-calm={slow || undefined} data-danger={danger || undefined} data-finale={finale ? true : undefined} onClick={dropFocus}>
      {run.screen === "title" ? (
        <StartCard puzzle={puzzle} stars={legacy ? 0 : levels.stars[level] ?? 0} total={total} of={LEVEL_COUNT * 3} reach={reach}
          friend={rival} onLevel={guarded(goLevel)} onStart={guarded(startPlay)} onSheet={guarded(openSheet)} onHome={guarded(home)} />
      ) : (
        <div className="bc-play">
          <header className="bc-hud">
            <button type="button" className="bc-badge" onClick={guarded(openSheet)} disabled={legacy} aria-haspopup="dialog" aria-label={`${tag.main}, ${tag.sub}। সব লেভেল দেখো`}>
              <b>{tag.main}</b><span>{tag.sub}</span>
            </button>
            <p className="bc-wake" aria-label={`ভুল ${bn(round.stings)}টা, মাফ ${bn(puzzle.forgive)}বার`}>
              {Array.from({ length: puzzle.forgive + 1 }, (_, k) => <i key={k} data-on={k < round.stings || undefined} data-last={k === puzzle.forgive || undefined} />)}
            </p>
            <p className="bc-left" aria-label={`গামছা বাকি ${bn(Math.max(0, nestsLeft(round)))}টা, মোট চাক ${bn(orchard.nests)}টা`}>
              <span className="bc-chip-nest" aria-hidden="true" />{bn(nestsLeft(round))}
            </p>
            <p className="bc-clock" aria-label={`সময় ${timeText(seconds)}, এখন ${bn(track)} তারার পথে`}>
              <b>{clock(seconds)}</b>
              <span className="bc-track" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < track || undefined}>★</i>)}</span>
            </p>
            <span className="bc-bar" aria-hidden="true"><i style={{ transform: `scaleX(${cleared / safe})` }} /></span>
          </header>
          {finale && (
            <p className="bc-boss" aria-label={`${finale}: বাকি ${bn(safe - cleared)}টা ঝোপ`}>
              <b>{finale}</b><span className="bc-boss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${(safe - cleared) / safe})` }} /></span><span>বাকি {bn(safe - cleared)}</span>
            </p>
          )}

          <div className="bc-board" ref={boardBox} data-status={round.status} data-marking={marking || undefined} data-held={F.held(run) || undefined}>
            <OrchardView orchard={orchard} cells={round.cells} status={round.status} delays={delays} hit={round.hit}
              marks={{ teach: teachCells, hint: hint?.cell, clues: clueCells }} hold={run.hold} cursor={cursor} handlers={handlers} />
            {burst && (
              <div className="bc-swarm" key={burst.key} data-big={burst.big || undefined} style={hitAt} aria-hidden="true">
                {Array.from({ length: burst.big ? 7 : 3 }, (_, index) => <i key={index} style={{ "--k": index } as CSSProperties} />)}
              </div>
            )}
          </div>

          {over ? (
            <Finish title={finishTitle(level, legacy, finish.won)} won={finish.won} stars={finish.stars} slow={slow} stats={finish.stats}
              line={finish.won ? clearLine(level, legacy) : `${levelLabel(level, legacy)}। ভিমরুলেরা জেগে গেছে।`} note={finishNote}
              choices={choices.map(choice => ({ ...choice, run: guarded(choice.run) }))} onSeeCard={shared ? seeCard : undefined} />
          ) : (
            <>
              <p className="bc-status" role="status" aria-live="polite" data-hint={hint ? true : undefined} data-sting={note && round.stings ? true : undefined}>{status}</p>
              <div className="bc-modes" role="group" aria-label="চাপলে কী হবে">
                <button type="button" aria-pressed={!marking} onClick={guarded(() => setMarking(false))}>
                  <span className="bc-ico bc-ico-clear" aria-hidden="true" />ঝোপ সাফ
                </button>
                <button type="button" aria-pressed={marking} data-teach={(teaching === 2 && !marking) || undefined} onClick={guarded(() => setMarking(true))}>
                  <span className="bc-ico bc-ico-gamchha" aria-hidden="true" />গামছা<kbd aria-hidden="true">G</kbd>
                </button>
                <button type="button" className="bc-hint" onClick={guarded(askHint)} disabled={round.status !== "playing"} aria-label="হিন্ট, নিলে বড়জোর ২ তারা">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" /></svg>হিন্ট<kbd aria-hidden="true">H</kbd>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {sheet && (
        <LevelSheet stars={levels.stars} reach={reach} current={legacy ? 0 : level} recommended={startLevel(levels.stars, open)}
          onPick={pick => { closeSheet(); goLevel(pick); }} onClose={closeSheet} />
      )}

      {shared && finish && (
        <section className="bc-result" id="result" ref={resultBox} aria-labelledby="bc-result-title">
          <h2 id="bc-result-title"><em>{legacy ? "বন্ধুর বাগান" : finale ?? `লেভেল ${bn(level)}`}</em> সাফ {timeText(shared.seconds)}ে</h2>
          <p>{rival ? compareLine(shared.seconds, rival.seconds, rival.name) : humanLine(finish.stars, round.hints, round.stings)}</p>
          <div className="bc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`ভিমরুলের চাকের কার্ড: ${levelLabel(level, legacy)}, ${timeText(shared.seconds)}, ${bn(finish.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bc-share">
              <label className="bc-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`bhimruler-chak-level-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই বাগান পাবে, একই চাক। সময়টা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
