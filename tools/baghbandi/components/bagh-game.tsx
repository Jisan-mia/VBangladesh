"use client";
// IP: what we avoided — no app or brand name, no copied tiger-game board look (wooden boards, photo-real tigers, glossy marbles, the four-tiger Nepali layout); ours is a fresh clay courtyard with scratched lines, striped pebbles and tamarind seeds, on the folk rules with our own choices labelled "আমাদের নিয়ম".
// The rules, the bot, the levels, the clock and what the phone keeps are pure (lib/game.ts, lib/levels.ts, lib/flow.ts,
// lib/save.ts); this file feeds them taps, keys and performance.now(), draws the board and plays the sounds.
// The shared player owns pause: its menu, blur and a hidden tab all hold play, and the bot never moves while you're away.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, shake, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  begin, botMove, canUndo, findMove, fullStart, humanSide, isBotTurn, isFull, legalMoves, moverOf, openingLevel, pinned, play, pointAt, threatened, tigerRoom, undo, winStars,
  BOARD, GOAT, GOATS, LEGACY_LEVEL, SIZE, TIGER, type Game, type Mode, type Side,
} from "../lib/game";
import { LADDERS, LEVEL_COUNT, WORLDS, isFinale, isLesson, ladderLevel, levelOf, worldOf } from "../lib/levels";
import { bn, caption, compareLine, detail, headline, humanLine, parseShared, sharedHash, sideWord, type Shared } from "../lib/link";
import { danger, finishLine, finishStats, finishTitle, nextGoal, type Stat } from "../lib/result";
import { ladderKey, levelsKey, migrateLadder, oldBestKey, oldLevelsKey, openAfter, openKey, readOpen, readSide, sideOfMode, SIDE_KEY } from "../lib/save";
import * as F from "../lib/flow";
import { drop, flute, leap, pick, rope, seedTick, stoneKnock, tap as tapSound, trapped } from "./sound";
import { StartCard } from "./start-card";
import { LevelSheet } from "./level-sheet";
import { Finish } from "./finish";
import { Seed, Tiger, YardBoard } from "./yard";

const TOOL = "baghbandi";
const KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: SIZE, ArrowUp: -SIZE };
/** Take-backs a game against the bot allows; lessons and two people have no limit. */
const TAKE_BACKS = 3;
/** How far a finger moves (board units) before a press becomes a drag. */
const DRAG_START = 16;
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: nothing to keep */ } };
const clockNow = () => performance.now();

type Finished = { stars: number; record: boolean; firstClear: boolean; at: number; stats: Stat[] };

export function BaghGame() {
  const [slow] = useSlowMode();
  // Before useLevels reads its keys (effects run in order): the old ladders move to the new one, once.
  useEffect(() => {
    for (const side of [TIGER, GOAT] as const) {
      const moved = migrateLadder(side, read(levelsKey(side)), read(oldLevelsKey(side)), read(oldBestKey(side)));
      if (moved !== null) write(levelsKey(side), moved);
    }
  }, []);
  const tigerLevels = useLevels(ladderKey(TIGER), LEVEL_COUNT);
  const goatLevels = useLevels(ladderKey(GOAT), LEVEL_COUNT);
  const ladder = (side: Side) => side === TIGER ? tigerLevels : goatLevels;
  const [bestTiger, submitTiger] = useBest(`${TOOL}-bagh`);
  const [bestGoat, submitGoat] = useBest(`${TOOL}-chhagol`);

  const [open, setOpen] = useState<Record<Side, number>>({ 0: 1, 1: 1 });
  const [visit, setVisit] = useState(0);
  const [mode, setMode] = useState<Mode>(1);
  const [level, setLevel] = useState(1);
  const [game, setGame] = useState<Game>(() => begin(1, 1, LADDERS[TIGER][0].start));
  const [run, setRunState] = useState<F.Flow>(() => F.titleFlow());
  const [selected, setSelectedState] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [dragging, setDragging] = useState(-1);
  const [takeBacks, setTakeBacks] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [sheetSide, setSheetSide] = useState<Side | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [juice, setJuice] = useState({ key: 0, text: "" });
  const [booted, setBooted] = useState(false);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const ghost = useRef<SVGGElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const drag = useRef({ from: -1, moved: false, x: 0, y: 0 });
  const inView = useInView(root);
  // The latest of everything, for listeners and timers that outlive a render.
  const now = useRef({ game, run, selected, mode, level, takeBacks, open });
  now.current = { ...now.current, mode, level, takeBacks, open };
  const setGameNow = (next: Game) => { now.current.game = next; setGame(next); };
  const setRun = (next: F.Flow) => { now.current.run = next; setRunState(next); };
  const setSelected = (at: number) => { now.current.selected = at; setSelectedState(at); };

  const side = sideOfMode(mode);
  const info = side === null ? null : levelOf(side, level) ?? null;
  const world = side === null ? 1 : worldOf(level) - 1;
  const lesson = side !== null && isLesson(level);
  const limit = side !== null && !lesson ? TAKE_BACKS : Infinity;
  const me = humanSide(mode);
  const botTurn = isBotTurn(game);
  const live = F.running(run);

  // ---- loading a level onto the start card ----
  function load(nextMode: Mode, nextLevel: number) {
    const nextSide = sideOfMode(nextMode);
    const target = nextSide === null ? null : levelOf(nextSide, nextLevel) ?? null;
    // A friend's own level stays on their seed, so the bot answers the same way and the comparison is fair.
    const theirs = friend && friend.mode !== 0 && nextSide !== null && nextLevel === ladderLevel(friend.game.level) ? friend.game.seed
      : friend && friend.mode === 0 && nextSide === null ? friend.game.seed : 0;
    const next = begin(theirs || target?.seed || newSeed(), nextMode, target ? target.start : fullStart(LEGACY_LEVEL));
    setMode(nextMode);
    setLevel(nextSide === null ? 1 : nextLevel);
    now.current.mode = nextMode;
    now.current.level = nextLevel;
    setGameNow(next);
    setRun(F.toTitle(now.current.run));
    setSelected(-1);
    setCursor(-1);
    endDrag();
    setTakeBacks(0);
    setFinish(null);
    setSheetSide(null);
    write(SIDE_KEY, String(nextMode));
  }
  const reach = (s: Side, to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= open[s] || to === visit);
  const opening = (s: Side) => openingLevel(ladder(s).stars, open[s]);
  function pickMode(nextMode: Mode) {
    const s = sideOfMode(nextMode);
    if (s === null) { load(0, 1); return; }
    const theirs = friend && friend.mode !== 0 ? ladderLevel(friend.game.level) : 0;
    load(nextMode, theirs || opening(s));
  }

  /** A click handler that ignores the click which brought the window back. */
  const guarded = <T extends unknown[]>(run: (...args: T) => void) => (...args: T) => { if (F.awake(now.current.run, clockNow()) && !F.held(now.current.run)) run(...args); };

  function startPlay() {
    if (now.current.run.screen !== "title" || F.held(now.current.run)) return;
    setRun(F.start(now.current.run, clockNow()));
    flute();
  }

  // ---- the player's menu, and being away ----
  const player = useGamePlayer({
    onPause: () => { endDrag(); setRun(F.menu(now.current.run, true, clockNow())); },
    onResume: () => setRun(F.menu(now.current.run, false, clockNow())),
    onRestart: () => { setRun(F.menu(now.current.run, false, clockNow())); load(now.current.mode, now.current.level); },
  });
  useEffect(() => {
    const gone = () => { endDrag(); setRun(F.away(now.current.run, true, clockNow())); };
    const back = () => setRun(F.away(now.current.run, false, clockNow()));
    const seen = () => { if (document.hidden) gone(); else back(); };
    if (document.hidden) gone();
    window.addEventListener("blur", gone);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", gone); window.removeEventListener("focus", back); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- boot: this phone's ladders, your own open levels (kept once from the stars), then a friend's link or your last side ----
  function openFriend(shared: Shared) {
    setFriend(shared);
    // Their side, their bot, their seed. Two people's link opens দুজনে on the same seed.
    const lv = shared.mode === 0 ? 1 : ladderLevel(shared.game.level);
    setVisit(shared.mode === 0 ? 0 : lv);
    setMode(shared.mode); setLevel(lv);
    now.current.mode = shared.mode; now.current.level = lv;
    setGameNow(begin(shared.game.seed, shared.mode, shared.mode === 0 ? fullStart(LEGACY_LEVEL) : levelOf(sideOfMode(shared.mode)!, lv)!.start));
    setRun(F.toTitle(now.current.run));
    setSelected(-1); setTakeBacks(0); setFinish(null); setSheetSide(null);
  }
  useEffect(() => {
    if (!tigerLevels.loaded || !goatLevels.loaded || booted) return;
    const opens = { 0: 1, 1: 1 } as Record<Side, number>;
    for (const s of [TIGER, GOAT] as const) {
      const raw = read(openKey(s));
      opens[s] = readOpen(raw, ladder(s).stars);
      if (raw === null) write(openKey(s), String(opens[s]));
    }
    setOpen(opens);
    now.current.open = opens;
    setSite(window.location.host);
    setBooted(true);
    const shared = parseShared(window.location.hash);
    if (shared) openFriend(shared);
    else {
      const m = readSide(read(SIDE_KEY)), s = sideOfMode(m);
      if (s === null) load(0, 1);
      else {
        const lv = openingLevel(ladder(s).stars, opens[s]);
        const target = levelOf(s, lv)!;
        setMode(m); setLevel(lv); now.current.mode = m; now.current.level = lv;
        setGameNow(begin(target.seed ?? newSeed(), m, target.start));
      }
    }
    const onHash = () => { const next = parseShared(window.location.hash); if (next) openFriend(next); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [tigerLevels.loaded, goatLevels.loaded]);

  // ---- moves ----
  function finishGame(next: Game) {
    const at = clockNow();
    const done = F.finish(now.current.run, at);
    setRun(done);
    const seconds = F.elapsed(done, at);
    const who = humanSide(next.mode), stars = winStars(next), lv = now.current.level;
    let record = false, firstClear = false;
    if (who !== null) {
      const own = ladder(who);
      // Stars are recorded the moment the game ends, never in a timer a quick tap could cancel.
      if (stars) {
        firstClear = !own.stars[lv];
        own.record(lv, stars);
        const opened = openAfter(now.current.open[who], lv);
        if (opened !== now.current.open[who]) {
          const nextOpen = { ...now.current.open, [who]: opened };
          now.current.open = nextOpen;
          setOpen(nextOpen);
          write(openKey(who), String(opened));
        }
      }
      if (isFull(next.start)) {
        const score = who === TIGER ? next.taken : GOATS - next.taken, before = who === TIGER ? bestTiger : bestGoat;
        record = (who === TIGER ? submitTiger : submitGoat)(score) && before !== null;
      }
    }
    setFinish({ stars, record, firstClear, at, stats: finishStats(next, seconds, now.current.takeBacks) });
    const won = who === null || next.winner === who;
    if (!won) { sfx.lose(); return; }
    if (next.ending === "trap") trapped();
    else if (stars === 3 || record || (firstClear && isFinale(lv))) sfx.levelUp();
    else sfx.good();
    if ((stars === 3 || record || (firstClear && isFinale(lv))) && !slow) confetti();
  }

  function apply(next: Game | null, byBot: boolean) {
    if (!next) return;
    const before = now.current.game;
    setGameNow(next);
    setSelected(-1);
    endDrag();
    const last = next.log[next.log.length - 1];
    if (last.over >= 0) {
      leap();
      const yours = moverOf(next, next.moves.length - 1) === humanSide(next.mode);
      setJuice(current => ({ key: current.key + 1, text: humanSide(next.mode) === GOAT ? "−১" : "+১" }));
      // The bot's tiger took one of your goats: a gentle shake, never a scold.
      if (!yours && humanSide(next.mode) !== null) shake(boardBox.current);
    } else if (moverOf(next, next.moves.length - 1) === GOAT) seedTick(byBot);
    else stoneKnock(byBot);
    if (!next.over && pinned(next.goats, next.tigers).length > pinned(before.goats, before.tigers).length) rope();
    if (next.over) finishGame(next);
  }

  // The bot answers after a short beat, so each of its moves can be seen. Held (menu, away, the sheet): it waits.
  useEffect(() => {
    if (!live || !botTurn) return;
    const timer = window.setTimeout(() => {
      const g = now.current.game;
      if (!F.running(now.current.run) || !isBotTurn(g)) return;
      apply(play(g, botMove(g)), true);
    }, slow ? F.SLOW_BOT_MS : F.BOT_MS);
    return () => window.clearTimeout(timer);
  }, [game, live, botTurn, slow]);

  /** One tap on a point: pick a piece, move it to a marked point, or let go. */
  function tap(at: number) {
    const g = now.current.game;
    if (!F.running(now.current.run) || isBotTurn(g) || g.over || at < 0) return;
    const sel = now.current.selected;
    const to = sel >= 0 ? findMove(g, sel, at) : -1;
    if (to >= 0) { apply(play(g, to), false); return; }
    const mine = g.turn === GOAT ? g.goats[at] > 0 : g.tigers.includes(at);
    if (mine && at !== sel) { pick(); setSelected(at); } else { tapSound(); setSelected(-1); }
  }

  function takeBack() {
    const g = now.current.game, r = now.current.run;
    const reopening = r.screen === "over" && isLesson(now.current.level) && humanSide(g.mode) !== null && g.winner !== humanSide(g.mode);
    if (!reopening && !F.running(r)) return;
    if (!canUndo(g, reopening) || now.current.takeBacks >= limit) return;
    drop();
    setGameNow(undo(g));
    setTakeBacks(now.current.takeBacks + 1);
    now.current.takeBacks += 1;
    setSelected(-1);
    if (reopening) { setRun(F.reopen(r, clockNow())); setFinish(null); }
  }

  // ---- the board under a finger: select on press (the marks show at once), move on a press on a mark or a drag onto it ----
  function boardPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - box.left) / box.width * BOARD, (event.clientY - box.top) / box.height * BOARD] as const;
  }
  function endDrag() { drag.current.from = -1; drag.current.moved = false; setDragging(-1); }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    // The press that brings the window back only wakes the board.
    if (!F.takesTap(now.current.run, clockNow())) return;
    const [x, y] = boardPoint(event), at = pointAt(x, y);
    setCursor(-1);
    tap(at);
    if (now.current.selected === at && at >= 0) {
      drag.current = { from: at, moved: false, x, y };
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* not capturable: taps still work */ }
    }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.from < 0) return;
    const [x, y] = boardPoint(event);
    if (!d.moved && Math.hypot(x - d.x, y - d.y) < DRAG_START) return;
    if (!d.moved) { d.moved = true; setDragging(d.from); }
    ghost.current?.setAttribute("transform", `translate(${x} ${y - 18})`);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.from < 0) return;
    const [x, y] = boardPoint(event), at = pointAt(x, y), from = d.from, moved = d.moved;
    endDrag();
    if (moved && at !== from && findMove(now.current.game, from, at) >= 0) tap(at);
  }

  // ---- keys: arrows walk a cursor, Enter or Space picks and moves, Z or Backspace takes back, P pauses (the player's menu) ----
  // Enter and Space belong to the game: on the title they start, on the result they go on (only on a fresh press after it
  // appears), and never re-press the last button clicked (clicked buttons drop focus, see dropFocus).
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (sheetSide !== null || run.menu) return;
    const key = event.key, enter = key === "Enter" || key === " ";
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab does its own job
    if ((key === "p" || key === "P") && run.screen === "play") { event.preventDefault(); if (!event.repeat) player.requestPause(); return; }
    if (run.screen === "title") {
      if (enter) { event.preventDefault(); if (!event.repeat) startPlay(); return; }
      if (key === "1" || key === "2" || key === "3") { event.preventDefault(); pickMode(([1, 2, 0] as const)[Number(key) - 1]); return; }
      if (side !== null && (key === "ArrowLeft" || key === "ArrowRight")) { event.preventDefault(); const to = level + (key === "ArrowLeft" ? -1 : 1); if (reach(side, to)) load(mode, to); }
      return;
    }
    if (run.screen === "over") {
      if (enter) { event.preventDefault(); if (F.takesResultKey(run, clockNow(), event.repeat)) primary.run(); }
      return;
    }
    const step = KEY_STEPS[key];
    if (step !== undefined) {
      event.preventDefault();
      setCursor(current => {
        if (current < 0) return now.current.selected >= 0 ? now.current.selected : 12;
        const col = current % SIZE + (step === 1 ? 1 : step === -1 ? -1 : 0), next = current + step;
        return col < 0 || col >= SIZE || next < 0 || next >= SIZE * SIZE ? current : next;
      });
      return;
    }
    if (key === "Backspace" || key === "z" || key === "Z") { event.preventDefault(); if (!event.repeat) takeBack(); return; }
    if (!enter) return;
    event.preventDefault();
    if (event.repeat) return;
    if (cursor >= 0) tap(cursor); else setCursor(now.current.selected >= 0 ? now.current.selected : 12);
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

  // ---- the sheet holds play while it's open ----
  function openSheet() { setSheetSide(side ?? TIGER); setRun(F.sheet(now.current.run, true, clockNow())); }
  function closeSheet() { setSheetSide(null); setRun(F.sheet(now.current.run, false, clockNow())); }

  // ---- what the result offers ----
  const over = run.screen === "over" && finish !== null;
  const won = over && (me === null || game.winner === me);
  const stars = finish?.stars ?? 0;
  const nextLevel = over && side !== null && stars > 0 && level < LEVEL_COUNT && reach(side, level + 1) ? level + 1 : 0;
  const canReopen = over && lesson && !won && canUndo(game, true);
  const primary = nextLevel ? { label: "পরের লেভেল", run: () => load(mode, nextLevel) }
    : { label: won ? "আবার খেলো" : "আরেকবার", run: () => load(mode, level) };
  const secondary: { label: string; run: () => void }[] = [];
  if (canReopen) secondary.push({ label: "শেষ চালটা ফিরিয়ে আনো", run: takeBack });
  else if (nextLevel) secondary.push({ label: "আবার খেলো", run: () => load(mode, level) });
  if (won && side === TIGER && level === LADDERS[TIGER].findIndex(item => item.finale) + 1) secondary.push({ label: "এবার ছাগল হয়ে", run: () => pickMode(2) });

  const rival = friend && friend.mode !== 0 && friend.game.seed === game.seed ? friend : null;
  const shared: Shared | null = over && (side === null || !lesson) ? { mode, name: names[0], other: names[1], game } : null;
  const state = shared ? sharedHash(shared) : "";
  const best = me === TIGER ? bestTiger : me === GOAT ? bestGoat : null;

  // ---- cards ----
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("বাঘবন্দি রাফি ছাগল ১২৩").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws; run.screen brings the friend's canvas back with the title.
  }, [state, format, site, friend, run.screen]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const card = resultBox.current, stage = card?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (card && stage) stage.scrollTo({ top: card.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else card?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the board shows ----
  const canPlay = live && !botTurn && !game.over;
  const moves = canPlay ? legalMoves(game) : [];
  const targets = selected >= 0 ? moves.filter(move => move.from === selected) : [];
  const threats = canPlay && game.turn === GOAT && selected < 0 ? threatened(game.goats, game.tigers) : [];
  const leapers = canPlay && game.turn === TIGER && selected < 0 ? [...new Set(moves.filter(move => move.over >= 0).map(move => move.from))] : [];
  const ropes = run.screen === "title" ? [] : pinned(game.goats, game.tigers);
  const room = tigerRoom(game);
  const edge = run.screen === "play" ? danger(game, me === GOAT ? threatened(game.goats, game.tigers).length : 0, room) : 0;
  const goatsLeft = game.goats.reduce((sum, count) => sum + count, 0);
  const finale = info?.finale;
  const startRoom = useRef(0);
  if (game.moves.length === 0) startRoom.current = Math.max(1, room);

  function hint() {
    if (botTurn) {
      // Under "…ভাবছে" in the pill: what your last move did, in one line.
      const last = game.log[game.log.length - 1];
      if (!last) return game.turn === GOAT ? "ছাগল আগে চালে। বট প্রথম চালটা দিচ্ছে।" : "";
      return last.over >= 0 ? "ধরা! পেছনে ফাঁকা থাকলেই লাফ।" : game.turn === TIGER ? "বাঘ এবার কোথায় যায়, দেখো।" : "ছাগলেরা এবার পথ আটকাবে।";
    }
    const who = mode === 0 ? `${sideWord(game.turn)}ের পালা। ` : "";
    if (selected >= 0) {
      if (!targets.length) return "এই গুটির এখন যাওয়ার পথ নেই। অন্যটা বেছে নাও।";
      return targets.some(target => target.over >= 0) ? "লাল বিন্দুতে চাপো: লাফ দিয়ে ছাগল ধরো।" : "সবুজ বিন্দুতে চাপো, নয়তো টেনে নাও।";
    }
    if (leapers.length) return `${who}লাফ দেওয়ার সুযোগ! আলো জ্বলা বাঘে চাপো।`;
    if (threats.length) return `${who}সাবধান! লাল দাগের ছাগলের পেছন ফাঁকা, বাঘ লাফ দেবে।`;
    if (lesson && game.moves.length === 0 && info) return info.line;
    const left = game.start.cap - game.moves.length;
    const clock = !lesson && left <= 20 ? ` আর ${bn(left)} চাল বাকি।` : "";
    return `${who}${game.turn === TIGER ? "বাঘে চাপো, তারপর সবুজ বিন্দুতে।" : "একটা ছাগলে চাপো, তারপর সবুজ বিন্দুতে।"}${clock}`;
  }
  const turnText = botTurn ? (game.turn === TIGER ? "বাঘ ভাবছে…" : "ছাগল ভাবছে…") : mode === 0 ? `${sideWord(game.turn)}ের পালা` : "তোমার পালা";
  const finishNote = over ? [
    rival ? compareLine(game, rival) : nextGoal(game),
    finish.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && isFull(game.start) && me !== null ? (me === TIGER ? `এই ফোনে সেরা: ${bn(best)}টা ধরা।` : `এই ফোনে সেরা: ${bn(best)}টা বাঁচানো।`) : "",
  ].filter(Boolean).join(" ") : "";
  const finishHead = over && finale && won && finish.firstClear ? `${finale} পার!` : over ? finishTitle(game) : "";
  const levelBadge = side === null ? "দুজনে" : finale ?? info?.name ?? "";
  const levelSub = side === null ? "পুরো খেলা" : `${WORLDS[worldOf(level) - 1].name} · ${sideWord(side)} হয়ে`;
  const scoreMain = me === GOAT ? `বাকি ${bn(goatsLeft)}` : `ধরা ${bn(game.taken)}/${bn(game.start.goal)}`;
  const progress = me === GOAT ? (game.start.hold ? game.moves.length / game.start.cap : 0) : game.taken / game.start.goal;
  const bossText = !finale ? "" : side === TIGER ? `আর ${bn(Math.max(0, game.start.goal - game.taken))}টা` : `নড়ার পথ ${bn(room)}`;
  const bossFill = !finale ? 0 : side === TIGER ? Math.max(0, game.start.goal - game.taken) / game.start.goal : Math.min(1, room / startRoom.current);
  const total = side === null ? 0 : totalStars(ladder(side).stars);
  const newcomer = booted && !totalStars(tigerLevels.stars) && !totalStars(goatLevels.stars);

  return (
    <div ref={root} className="bb" data-world={world} data-screen={run.screen} data-calm={slow || undefined} data-danger={edge || undefined} onClick={dropFocus}>
      {run.screen === "title" ? (
        <StartCard game={game} mode={mode} level={level} info={info} stars={side === null ? 0 : ladder(side).stars[level] ?? 0}
          open={side === null ? 1 : open[side]} visit={visit} total={total} of={LEVEL_COUNT * 3} newcomer={newcomer}
          friend={friend && game.seed === friend.game.seed ? friend : null} friendCanvas={friendPreview}
          onMode={guarded(pickMode)} onLevel={guarded((to: number) => { if (side !== null && reach(side, to)) load(mode, to); })} onStart={guarded(startPlay)} onSheet={guarded(openSheet)} />
      ) : (
        <div className="bb-play">
          <header className="bb-hud">
            <button type="button" className="bb-badge" onClick={openSheet} disabled={side === null} aria-haspopup="dialog" aria-label={`${levelBadge}, ${levelSub}. সব লেভেল দেখো`}>
              <b>{levelBadge}</b><span>{levelSub}</span>
            </button>
            <p className="bb-score" aria-label={me === GOAT ? `${bn(goatsLeft)}টা ছাগল বাকি` : `${bn(game.taken)}টা ছাগল ধরা, লক্ষ্য ${bn(game.start.goal)}`}>
              <svg viewBox="-40 -40 80 80" aria-hidden="true">{me === GOAT ? <Seed /> : <Tiger />}</svg>
              <b>{scoreMain}</b>
              <span>চাল {bn(game.moves.length)}/{bn(game.start.cap)}</span>
              {juice.key > 0 && <i key={juice.key} className="bb-float" data-bad={me === GOAT || undefined} aria-hidden="true">{juice.text}</i>}
            </p>
            <span className="bb-bar" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>
          </header>
          {finale && (
            <p className="bb-boss" aria-label={`${finale}: ${bossText}`}>
              <b>{finale}</b><span className="bb-boss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${bossFill})` }} /></span><span>{bossText}</span>
            </p>
          )}

          <div className="bb-board" ref={boardBox} data-bot={botTurn || undefined} data-over={over || undefined}
            role="application" aria-label="বাঘবন্দির ছক, ৫ × ৫ বিন্দু। গুটিতে চাপো, তারপর চিহ্ন দেওয়া বিন্দুতে। কিবোর্ডে তীর-চিহ্ন দিয়ে ঘুরে এন্টার চাপো।"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={endDrag} onLostPointerCapture={() => { if (drag.current.moved) endDrag(); }}>
            <YardBoard game={game} world={world} selected={canPlay ? selected : -1} targets={targets} threats={threats} hints={leapers}
              pinned={ropes} cursor={canPlay ? cursor : -1} dragging={dragging} ghost={ghost} />
          </div>

          {over ? (
            <Finish title={finishHead} stars={stars} slow={slow} stats={finish.stats}
              line={rival ? humanLine(game) : finishLine(game)} note={finishNote} primary={{ ...primary, run: guarded(primary.run) }}
              secondary={secondary.map(action => ({ ...action, run: guarded(action.run) }))} onSeeCard={shared ? seeCard : undefined} />
          ) : (
            <>
              <div className="bb-turn">
                <p className="bb-turn-pill" data-bot={botTurn || undefined}>
                  <svg viewBox="-40 -40 80 80" aria-hidden="true">{game.turn === GOAT ? <Seed /> : <Tiger />}</svg>
                  <span>{turnText}</span>
                </p>
                <button type="button" className="bb-undo" onClick={guarded(takeBack)} disabled={!canPlay && !botTurn || !canUndo(game) || takeBacks >= limit}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
                  ফিরিয়ে আনো{limit !== Infinity && <small aria-label={`আর ${bn(limit - takeBacks)} বার`}>{bn(limit - takeBacks)}</small>}
                </button>
              </div>
              <p className="bb-hint" role="status" aria-live="polite">{hint()}</p>
            </>
          )}
        </div>
      )}

      {sheetSide !== null && (
        <LevelSheet side={sheetSide} stars={ladder(sheetSide).stars} open={open[sheetSide]} visit={visit} current={side === sheetSide ? level : 0}
          recommended={opening(sheetSide)} onSide={setSheetSide} onClose={closeSheet}
          onPick={pickLevel => { setRun(F.sheet(now.current.run, false, clockNow())); load(sheetSide === TIGER ? 1 : 2, pickLevel); }} />
      )}

      {shared && (
        <section className="bb-result" id="result" ref={resultBox} aria-labelledby="bb-result-title">
          <h2 id="bb-result-title"><em>{headline(game)}</em>, উঠোনের ছবি তৈরি</h2>
          <p>{rival ? compareLine(game, rival) : humanLine(game)}</p>
          <div className="bb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bb-card-summary" />
              <figcaption id="bb-card-summary" className="bb-sr">বাঘবন্দির কার্ড: {headline(game)}। {detail(game)}। {humanLine(game)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bb-share">
              {mode ? (
                <label className="bb-name">
                  <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={names[0]} maxLength={MAX_NAME} onChange={event => setNames([event.target.value, names[1]])} placeholder="যেমন: রাফি" autoComplete="nickname" />
                </label>
              ) : (
                <div className="bb-names">
                  {([0, 1] as const).map(s => (
                    <label key={s} className="bb-name" data-side={s}>
                      <span>{s ? "বাঘ চালিয়েছে যে" : "ছাগল চালিয়েছে যে"}</span>
                      <input value={names[s]} maxLength={MAX_NAME} onChange={event => setNames(s ? [names[0], event.target.value] : [event.target.value, names[1]])} placeholder={s ? "যেমন: মিম" : "যেমন: রাফি"} autoComplete="off" />
                    </label>
                  ))}
                </div>
              )}
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="baghbandi.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে তোমার শেষ উঠোনটা দেখবে, তারপর একই শুরু থেকে একই বটের সাথে খেলবে। চালগুলো মিলিয়ে দেখা হয়, তাই ফলটা সত্যি।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
