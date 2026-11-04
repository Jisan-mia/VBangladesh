"use client";
// IP: what we avoided — no app or brand name for the pen-and-paper game, no copied board look (grey grid, neon lines, coloured squares); ours is a fresh নকশিকাঁথা with needle holes, running stitches and hand-drawn kantha motifs.
// The rules, the bots, the levels, the clock, the finger and the keys are pure (lib/quilt.ts, lib/levels.ts, lib/flow.ts,
// lib/input.ts, lib/save.ts); this file feeds them taps, keys and performance.now(), draws the cloth and plays the sounds.
// The shared player owns pause: its menu, blur and a hidden tab all hold play, and no bot sews while you're away.

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, shake, silenceScheduled, totalStars, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { LOOKS } from "../lib/art";
import { cardBlob, drawCard } from "../lib/card";
import { bn, caption, compareLine, feat, humanLine, initials, parseShared, playNames, rivalOf, scoreLine, sharedHash, type Shared } from "../lib/challenge";
import { nearestGap, stepCursor } from "../lib/hit.hot";
import { attempt, ghostOf, keyAct, lift, press, release, slide, NO_FINGER, type Finger } from "../lib/input";
import { LADDER_LEVELS, LEVEL_COUNT, WORLDS, isFinale, levelOf, pairSetup, starsFor, worldOf, type PairSize } from "../lib/levels";
import { begin, botMove, canUndo, gifts as giftsOf, hintGap, isBotTurn, leastGift, play, recent, takenAfter, totalPoints, undo, type Game } from "../lib/quilt";
import { danger, finishStats, finishTitle, lessonLine, nextGoal, takerOf, warnLine, type Stat } from "../lib/result";
import { LADDER_SLUG, LEVELS_KEY, MODE_KEY, OLD_BEST_KEYS, OPEN_KEY, SIZE_KEY, migrateLadder, openAfter, readMode, readOpen, readSize, type Mode } from "../lib/save";
import * as F from "../lib/flow";
import { bloom, cheer, handOff, lullaby, stitch as stitchSound, tap as tapSound, undoSound, warn as warnSound } from "./sound";
import { ClothBoard, Motif } from "./cloth";
import { StartCard } from "./start-card";
import { LevelSheet } from "./level-sheet";
import { Finish } from "./finish";
import { Kata } from "./kata";

const TOOL = "chhok-jora";
/** Take-backs a quilt against a bot allows; lessons and two people have no limit. */
const TAKE_BACKS = 3;
/** How far from a gap's middle (board units) a press still finds it. */
const REACH = 62;
const COLORS = ["#c23b2a", "#2457a6", "#f3c548", "#fbf3e6", "#3d8a3c"];
const KEY_STEP = (key: string, span: number) => key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : key === "ArrowDown" ? span : key === "ArrowUp" ? -span : 0;
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: nothing to keep */ } };
const clockNow = () => performance.now();

/** Flowers the bot took in its last turn (0 unless the bot moved last). */
function lastTurnGain(g: Game) {
  if (!g.setup.bot || g.by[g.by.length - 1] !== 1) return 0;
  let from = g.moves.length, took = 0;
  while (from && g.by[from - 1] === 1) from--;
  let replayed = begin(g.seed, g.setup);
  for (let i = 0; i < g.moves.length; i++) { const ahead = replayed.score[1]; replayed = play(replayed, g.moves[i])!; if (i >= from) took += replayed.score[1] - ahead; }
  return took;
}

type Finished = { stars: number; firstClear: boolean; stats: Stat[] };

/** `#og`, the site's preview image only: a won game against মিনু খালা (level 8), found the same way every time. Nothing is saved. */
function ogGame() {
  const setup = levelOf(8)!.setup;
  for (let seed = 1; seed < 400; seed++) {
    let game = begin(seed, setup);
    while (!game.over) game = play(game, isBotTurn(game) ? botMove(game) : botMove({ ...game, setup: { ...setup, bot: { kind: "legacy", level: 2 } }, turn: 1 }))!;
    if (game.score[0] >= 10) return game;
  }
  return begin(1, setup);
}

export function ChhokGame() {
  const [slow] = useSlowMode();
  // Before useLevels reads its key (effects run in order): the two old bests become stars, once.
  useEffect(() => {
    const moved = migrateLadder(read(LEVELS_KEY), read(OLD_BEST_KEYS[1]), read(OLD_BEST_KEYS[2]));
    if (moved !== null) write(LEVELS_KEY, moved);
  }, []);
  const ladder = useLevels(LADDER_SLUG, LEVEL_COUNT);

  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [mode, setMode] = useState<Mode>("solo");
  const [level, setLevel] = useState(1);
  const [size, setSize] = useState<PairSize>(4);
  const [game, setGameState] = useState<Game>(() => begin(101, LADDER_LEVELS[0].setup));
  const [run, setRunState] = useState<F.Flow>(() => F.titleFlow());
  const [finger, setFingerState] = useState<Finger>(NO_FINGER);
  const [armed, setArmedState] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [takeBacks, setTakeBacks] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [juice, setJuice] = useState({ key: 0, who: 0 as 0 | 1, text: "" });
  const [booted, setBooted] = useState(false);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [kataRestart, setKataRestart] = useState(0);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [og, setOg] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const chain = useRef(0);
  const inView = useInView(root);
  // The latest of everything, for listeners and timers that outlive a render.
  const now = useRef({ game, run, finger, armed, mode, level, size, takeBacks, open, friend });
  now.current = { ...now.current, mode, level, size, takeBacks, open, friend };
  const setGame = (next: Game) => { now.current.game = next; setGameState(next); };
  const setRun = (next: F.Flow) => { now.current.run = next; setRunState(next); };
  const setFinger = (next: Finger) => { now.current.finger = next; setFingerState(next); };
  const setArmed = (next: number) => { now.current.armed = next; setArmedState(next); };

  const info = mode === "solo" ? levelOf(level) ?? null : null;
  const world = mode === "solo" ? worldOf(level) - 1 : 0;
  const look = LOOKS[world];
  const lesson = Boolean(info?.lesson);
  const limit = mode === "solo" && !lesson ? TAKE_BACKS : Infinity;
  const live = F.running(run);
  const botTurn = isBotTurn(game);
  const canPlay = live && !botTurn && !game.over;
  const gifts = useMemo(() => giftsOf(game), [game]);
  const least = leastGift(gifts);
  const shown = playNames(mode === "solo" ? level : 0, names);
  const marks = initials(shown);

  // ---- loading a level onto the start card ----
  function seedFor(nextMode: Mode, nextLevel: number, nextSize: PairSize) {
    const theirs = now.current.friend;
    if (theirs && nextMode === "solo" && theirs.level === nextLevel) return theirs.game.seed;
    if (theirs && nextMode === "pair" && theirs.level === 0 && theirs.size === nextSize) return theirs.game.seed;
    return nextMode === "solo" ? levelOf(nextLevel)?.lesson?.seed ?? newSeed() : newSeed();
  }
  function load(nextMode: Mode, nextLevel: number, nextSize: PairSize = now.current.size) {
    silenceScheduled();
    const lv = Math.min(LEVEL_COUNT, Math.max(1, nextLevel));
    const setup = nextMode === "pair" ? pairSetup(nextSize) : levelOf(lv)!.setup;
    setMode(nextMode); setLevel(lv); setSize(nextSize);
    now.current.mode = nextMode; now.current.level = lv; now.current.size = nextSize;
    setGame(begin(seedFor(nextMode, lv, nextSize), setup));
    setRun(F.toTitle(now.current.run, clockNow()));
    setFinger(release()); setArmed(-1); setCursor(-1);
    setTakeBacks(0); now.current.takeBacks = 0;
    setFinish(null); setSheetOpen(false);
    setJuice({ key: 0, who: 0, text: "" });
    chain.current = 0;
    write(MODE_KEY, nextMode);
  }
  const reach = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= open || to === visit);
  /** Your next level to play: the first open one without three stars, or your open level. */
  const recommended = () => { for (let lv = 1; lv <= open; lv++) if ((ladder.stars[lv] ?? 0) === 0) return lv; return open; };
  function pickMode(next: Mode) {
    tapSound();
    if (next === "solo") load("solo", now.current.friend?.level || recommended());
    else load(next, now.current.level);
  }
  function pickSize(next: PairSize) { tapSound(); write(SIZE_KEY, String(next)); load("pair", now.current.level, next); }

  /** A click handler that ignores the click which brought the window back. */
  const guarded = <T extends unknown[]>(fn: (...args: T) => void) => (...args: T) => { if (F.awake(now.current.run, clockNow()) && !F.held(now.current.run)) fn(...args); };

  function startPlay() {
    const r = now.current.run;
    if (r.screen !== "title" || F.held(r)) return;
    if (now.current.mode === "kata") { setRun(F.kata(r)); tapSound(); return; }
    setRun(F.start(r, clockNow()));
    lullaby();
  }

  // ---- the player's menu, and being away: both release the finger and hold every bot ----
  const player = useGamePlayer({
    onPause: () => { setFinger(release()); setRun(F.menu(now.current.run, true, clockNow())); },
    onResume: () => setRun(F.menu(now.current.run, false, clockNow())),
    onRestart: () => {
      setRun(F.menu(now.current.run, false, clockNow()));
      if (now.current.run.screen === "kata") setKataRestart(count => count + 1);
      else load(now.current.mode, now.current.level);
    },
  });
  useEffect(() => {
    const gone = () => { setFinger(release()); setRun(F.away(now.current.run, true, clockNow())); };
    const back = () => setRun(F.away(now.current.run, false, clockNow()));
    const seen = () => { if (document.hidden) gone(); else back(); };
    if (document.hidden) gone();
    window.addEventListener("blur", gone);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", gone); window.removeEventListener("focus", back); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- boot: your own open level (kept once from the stars), then a friend's link or your last mode ----
  function openFriend(shared: Shared) {
    setFriend(shared);
    now.current.friend = shared;
    if (shared.level) { setVisit(shared.level); load("solo", shared.level); }
    else { setVisit(0); load("pair", 1, shared.size); }
  }
  useEffect(() => {
    if (!ladder.loaded || booted) return;
    const raw = read(OPEN_KEY), opened = readOpen(raw, ladder.stars);
    if (raw === null) write(OPEN_KEY, String(opened));
    setOpen(opened);
    now.current.open = opened;
    setSite(window.location.host);
    setBooted(true);
    if (window.location.hash === "#og") {
      const demo = ogGame();
      setOg(true); setMode("solo"); setLevel(8); setNames(["রাফি", ""]); setGame(demo);
      setRun(F.finish(F.start(F.titleFlow(), 0), 64_000));
      setFinish({ stars: starsFor(8, demo.score), firstClear: false, stats: finishStats(demo, 64) });
      return;
    }
    const shared = parseShared(window.location.hash);
    if (shared) openFriend(shared);
    else {
      const m = readMode(read(MODE_KEY)), s = readSize(read(SIZE_KEY));
      let lv = 1;
      for (; lv < opened && (ladder.stars[lv] ?? 0) > 0; lv++);
      load(m, lv, s);
    }
    const onHash = () => { const next = parseShared(window.location.hash); if (next) openFriend(next); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [ladder.loaded]);

  // ---- stitches ----
  function finishGame(next: Game) {
    const at = clockNow(), done = F.finish(now.current.run, at);
    setRun(done);
    const seconds = F.elapsed(done, at), lv = now.current.level, solo = now.current.mode === "solo";
    const stars = solo ? starsFor(lv, next.score) : 0;
    let firstClear = false;
    // Stars are recorded the moment the quilt is finished, never in a timer a quick tap could cancel.
    if (solo && stars) {
      firstClear = !ladder.stars[lv];
      ladder.record(lv, stars);
      const opened = openAfter(now.current.open, lv);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    setFinish({ stars, firstClear, stats: finishStats(next, seconds) });
    const [mine, theirs] = next.score;
    const won = solo ? mine > theirs : mine !== theirs;
    // The cheer plays now, on the audio clock: a fresh cloth's silenceScheduled() cuts it, so it never sounds over the next quilt.
    if (!won) { cheer(mine === theirs ? "draw" : "loss"); return; }
    const big = stars === 3 || (firstClear && isFinale(lv));
    cheer(big ? "big" : "win");
    if (!slow) confetti({ colors: COLORS, count: big ? 90 : 50 });
  }

  function apply(next: Game | null, byBot: boolean) {
    if (!next) return;
    const before = now.current.game;
    setGame(next);
    setArmed(-1);
    stitchSound(byBot);
    const mover = before.turn;
    if (next.lastClosed) {
      const gain = next.score[mover] - before.score[mover];
      const gold = gain > next.lastClosed;
      bloom(chain.current, gold);
      chain.current += next.lastClosed;
      setJuice(current => ({ key: current.key + 1, who: mover, text: `+${bn(gain)}` }));
      // The bot taking a run of three or more you handed over: a gentle shake, never a scold.
      if (byBot && chain.current >= 3 && !slow) shake(boardBox.current);
    } else chain.current = 0;
    if (next.over) { finishGame(next); return; }
    // Two people: the phone changes hands. The next tap waits a moment, so the passer's second tap never sews for the next player.
    if (!next.setup.bot && next.turn !== before.turn) { setRun(F.handOff(now.current.run, clockNow())); handOff(); }
  }

  // The bot answers after a short beat, one stitch at a time, so each of its moves can be seen. Held: it waits, its timer gone.
  useEffect(() => {
    if (!live || !botTurn) return;
    const chaining = game.lastClosed > 0 && game.by[game.by.length - 1] === 1;
    const timer = window.setTimeout(() => {
      const g = now.current.game;
      if (!F.running(now.current.run) || !isBotTurn(g)) return;
      apply(play(g, botMove(g)), true);
    }, slow ? (chaining ? F.SLOW_BOT_CHAIN_MS : F.SLOW_BOT_MS) : chaining ? F.BOT_CHAIN_MS : F.BOT_MS);
    return () => window.clearTimeout(timer);
  }, [game, live, botTurn, slow]);

  /** A tap or Enter on a gap: sew it, or arm it first when it gives away more than any other stitch would. */
  function tryStitch(gap: number) {
    const g = now.current.game;
    if (!F.running(now.current.run) || isBotTurn(g) || g.over || gap < 0) return;
    const result = attempt(gap, now.current.armed, giftsOf(g));
    if (result.act === "arm") { setArmed(result.armed); warnSound(); return; }
    if (result.act === "sew") apply(play(g, gap), false);
  }

  function takeBack() {
    const g = now.current.game;
    if (!F.running(now.current.run) || !canUndo(g) || now.current.takeBacks >= limit) return;
    undoSound();
    chain.current = 0;
    setGame(undo(g));
    setArmed(-1);
    setTakeBacks(now.current.takeBacks + 1);
    now.current.takeBacks += 1;
  }

  // ---- the cloth under a finger: press shows the stitch, slide picks another gap, lift sews ----
  function gapAt(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect(), g = now.current.game.geo;
    return nearestGap((event.clientX - box.left) / box.width * g.width, (event.clientY - box.top) / box.height * g.height, g.midX, g.midY, now.current.game.drawn, REACH);
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    // The press that brings the window back, or comes right after the phone changed hands, only wakes the cloth.
    if (!F.takesTap(now.current.run, clockNow()) || isBotTurn(now.current.game)) return;
    setCursor(-1);
    setFinger(press(event.pointerId, gapAt(event)));
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* not capturable: taps still work */ }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!F.running(now.current.run)) return;
    const next = slide(now.current.finger, event.pointerId, gapAt(event), event.pointerType === "mouse");
    if (next !== now.current.finger) setFinger(next);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const { finger: after, gap } = lift(now.current.finger, event.pointerId);
    if (after === now.current.finger) return;
    setFinger(after);
    tryStitch(gap);
  }
  function letGo() { setFinger(release()); }

  // ---- keys: arrows walk a cursor, Enter or Space sews, Z or Backspace takes back, P pauses (the player's menu) ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || og || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const r = now.current.run;
    const act = keyAct(event.key, {
      screen: r.screen, blocked: sheetOpen || r.menu, repeat: event.repeat, onButton: Boolean(element?.closest?.("button, a, summary")),
      cursor, resultReady: F.takesResultKey(r, clockNow(), event.repeat),
    });
    if (act === "none") return;
    event.preventDefault();
    const g = now.current.game;
    switch (act) {
      case "pause": player.requestPause(); break;
      case "start": startPlay(); break;
      case "mode": pickMode((["solo", "pair", "kata"] as const)[Number(event.key) - 1]); break;
      case "level": if (mode === "solo") { const to = level + (event.key === "ArrowLeft" ? -1 : 1); if (reach(to)) load("solo", to); } break;
      case "go": primary.run(); break;
      case "cursor": {
        // The arrows take the keyboard to the cloth: a focused button lets go, so the next Enter sews.
        if (element instanceof HTMLButtonElement) element.blur();
        const step = KEY_STEP(event.key, g.geo.span);
        setCursor(current => current < 0 ? Math.max(0, hintGap(g)) : stepCursor(current, step, g.geo.edges));
        break;
      }
      case "undo": takeBack(); break;
      case "sew": tryStitch(cursor); break;
      case "show": setCursor(Math.max(0, hintGap(g))); break;
      default: break;
    }
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
  function openSheet() { setFinger(release()); setSheetOpen(true); setRun(F.sheet(now.current.run, true, clockNow())); }
  function closeSheet() { setSheetOpen(false); setRun(F.sheet(now.current.run, false, clockNow())); }

  // ---- what the result offers ----
  const over = run.screen === "over" && finish !== null;
  const [mine, theirs] = game.score;
  const total = totalPoints(game.setup);
  const won = over && (mode === "solo" ? mine > theirs : mine !== theirs);
  const stars = finish?.stars ?? 0;
  const nextLevel = over && mode === "solo" && stars > 0 && level < LEVEL_COUNT && (level + 1 <= now.current.open || level + 1 === visit) ? level + 1 : 0;
  const primary = nextLevel ? { label: "পরের লেভেল", run: () => load("solo", nextLevel) } : { label: won ? "আবার খেলো" : "আরেকবার", run: () => load(mode, level) };
  const secondary = nextLevel ? [{ label: "আবার খেলো", run: () => load(mode, level) }] : [];

  const rival = friend && friend.level && friend.level === level && friend.game.seed === game.seed && mode === "solo" ? friend : null;
  const shared: Shared | null = over && !lesson && !og ? { level: mode === "solo" ? level : 0, size, name: names[0], other: names[1], game } : null;
  const ogShared: Shared | null = og && over ? { level: 8, size: 4, name: "রাফি", other: "", game } : null;
  const card = shared ?? ogShared;
  const state = card ? sharedHash(card) : "";

  // ---- cards ----
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ছক-জোড়া রাফি মিম মিনু খালা নানু ১২৩").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws; run.screen brings the friend's canvas back with the title.
  }, [state, format, site, friend, run.screen]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the cloth shows ----
  const ghost = ghostOf(finger, canPlay);
  const held = ghost >= 0 ? ghost : canPlay ? armed : -1;
  const heldGift = held >= 0 ? gifts[held] : 0;
  const warnBoxes = useMemo(() => held >= 0 && heldGift > 0 ? takenAfter(game, held) : [], [game, held, heldGift]);
  const keys = info?.lesson?.keys?.filter(edge => !game.drawn[edge]) ?? [];
  const hint = !canPlay || held >= 0 ? -1 : lesson ? keys[0] ?? hintGap(game) : game.moves.length === 0 && !slow ? hintGap(game) : -1;
  const edge = run.screen === "play" ? danger(game, canPlay, heldGift, least) : 0;
  const lastBy = game.by[game.by.length - 1];
  // Two people: the turn just passed and the next player hasn't touched the cloth yet.
  const handing = mode === "pair" && canPlay && game.moves.length > 0 && !game.lastClosed && finger.id < 0 && held < 0;
  const botTook = useMemo(() => lastTurnGain(game), [game]);

  function hintLine() {
    const mover = game.turn, rivalName = shown[1];
    if (botTurn) return game.lastClosed && lastBy === 1 ? `${rivalName} ঘর নিলেন, আবার সেলাই দিচ্ছেন…` : `${rivalName} ভাবছেন…`;
    if (held >= 0 && heldGift > 0) return warnLine(heldGift, held === armed && ghost < 0, takerOf(shown, mover), least);
    if (handing) return `${possessive(shown[mover])} পালা। ফোনটা হাতবদল করো।`;
    if (lesson && game.moves.length === 0 && info) return info.line;
    if (game.lastClosed && (mode === "pair" || lastBy === 0)) return mode === "pair" ? `${shown[mover]} ঘর পেয়েছে! আরেকটা ফোঁড়।` : "ঘর পেয়েছ! আরেকটা ফোঁড় দাও।";
    if (edge === 2) return "এখন যেকোনো ফোঁড়ে ঘর যাবে। লাল সংখ্যা যেখানে কম, সেখানে দাও।";
    if (mode === "solo" && lastBy === 1 && botTook) return `${rivalName} ${bn(botTook)}টা ফুল নিলেন। তিন নম্বর ফোঁড়েই ঘর চলে যায়।`;
    const who = mode === "pair" ? `${possessive(shown[mover])} পালা। ` : "তোমার পালা। ";
    return `${who}দুই ফোঁড়ের মাঝে চাপো, ছাড়লে সেলাই।`;
  }

  const turnText = botTurn ? `${shown[1]} ভাবছেন…` : mode === "pair" ? `${possessive(shown[game.turn])} পালা` : "তোমার পালা";
  const finale = info?.finale;
  const needToWin = Math.max(0, Math.floor(total / 2) + 1 - mine);
  const levelBadge = mode === "pair" ? "দুজনে" : finale ?? info?.name ?? "";
  const levelSub = mode === "pair" ? `${bn(size)}×${bn(size)} কাঁথা` : `লেভেল ${bn(level)} · ${WORLDS[world].name}`;
  const filled = game.owner.filter(who => who >= 0).length;
  const finishNote = over ? [rival ? compareLine(mine, rival.game.score[0], rival.name) : mode === "solo" ? nextGoal(game, level) : ""].filter(Boolean).join(" ") : "";
  const finishLine = over ? (lesson ? lessonLine(game, level) : humanLine(mode === "solo" ? level : 0, game.score, shown, total)) : "";
  const newcomer = booted && !totalStars(ladder.stars);

  return (
    <div ref={root} className="cj" data-world={world} data-screen={run.screen} data-calm={slow || undefined} data-danger={edge || undefined}
      data-hand={handing ? game.turn : undefined} style={{ ["--p0" as string]: look.players[0], ["--p1" as string]: look.players[1] }} onClick={dropFocus}>
      {run.screen === "title" ? (
        <StartCard mode={mode} level={level} info={info} game={game} stars={ladder.stars[level] ?? 0} open={open} visit={visit}
          total={totalStars(ladder.stars)} of={LEVEL_COUNT * 3} newcomer={newcomer} size={size} names={names}
          friend={friend && game.seed === friend.game.seed ? friend : null} friendCanvas={friendPreview}
          onMode={guarded(pickMode)} onLevel={guarded((to: number) => { if (reach(to)) load("solo", to); })} onSize={guarded(pickSize)}
          onNames={setNames} onStart={guarded(startPlay)} onSheet={guarded(openSheet)} />
      ) : run.screen === "kata" ? (
        <Kata live={F.kataRunning(run)} slow={slow} restart={kataRestart} onHome={guarded(() => load("solo", now.current.level))} />
      ) : (
        <div className="cj-play" data-cols={game.geo.cols} style={{ ["--ar" as string]: String(game.geo.width / game.geo.height) }}>
          <header className="cj-hud">
            <button type="button" className="cj-badge" onClick={openSheet} disabled={mode !== "solo" || og} aria-haspopup="dialog" aria-label={`${levelBadge}, ${levelSub}. সব লেভেল দেখো`}>
              <b>{levelBadge}</b><span>{levelSub}</span>
            </button>
            <div className="cj-score">
              {([0, 1] as const).map(p => (
                <p key={p} className="cj-pill" data-player={p} data-active={!game.over && game.turn === p || undefined}>
                  <svg viewBox="-42 -42 84 84" aria-hidden="true"><Motif world={world} player={p} mark="" look={look} /></svg>
                  <span className="cj-sr">{shown[p]}: </span><b>{bn(game.score[p])}</b>
                  {juice.key > 0 && juice.who === p && <i key={juice.key} className="cj-float" aria-hidden="true">{juice.text}</i>}
                </p>
              ))}
            </div>
            <span className="cj-bar" aria-hidden="true"><i style={{ transform: `scaleX(${filled / game.geo.boxes})` }} /></span>
          </header>
          {finale && !over && (
            <p className="cj-boss" aria-label={`${shown[1]}: জিততে আর ${bn(needToWin)}টা ফুল`}>
              <b>{shown[1]}</b><span className="cj-boss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, mine / (Math.floor(total / 2) + 1))})` }} /></span><span>জিততে আর {bn(needToWin)}টা</span>
            </p>
          )}

          <div className="cj-board" ref={boardBox} data-bot={botTurn || undefined} data-over={over || undefined}
            role="application" aria-label="নকশিকাঁথার ছক। দুই ফোঁড়ের মাঝে চাপো, ছাড়লে সেলাই। কিবোর্ডে তীর-চিহ্ন দিয়ে বেছে এন্টার চাপো।"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={letGo}
            onLostPointerCapture={event => { if (now.current.finger.id === event.pointerId) letGo(); }}
            onPointerLeave={event => { if (event.pointerType === "mouse" && now.current.finger.hover) letGo(); }}>
            <ClothBoard game={game} world={world} marks={marks} recent={game.moves.length && !game.over ? recent(game) : []}
              ghost={ghost} armed={canPlay ? armed : -1} cursor={canPlay ? cursor : -1} hint={hint} warn={warnBoxes} gift={heldGift} mover={game.turn} />
          </div>

          {over ? (
            <Finish title={finishTitle(game, mode === "solo" ? level : 0, shown, finish.firstClear)} stars={stars} slow={slow} stats={finish.stats}
              line={finishLine} note={finishNote} primary={{ ...primary, run: guarded(primary.run) }}
              secondary={secondary.map(action => ({ ...action, run: guarded(action.run) }))} onSeeCard={card ? seeCard : undefined} />
          ) : (
            <>
              <div className="cj-turn">
                <p className="cj-turn-pill" data-bot={botTurn || undefined} data-player={game.turn}>
                  <svg viewBox="-42 -42 84 84" aria-hidden="true"><Motif world={world} player={game.turn} mark="" look={look} /></svg>
                  <span>{turnText}</span>
                </p>
                <button type="button" className="cj-undo" onClick={guarded(takeBack)} disabled={!canPlay && !botTurn || !canUndo(game) || takeBacks >= limit}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
                  ফিরিয়ে আনো{limit !== Infinity && <small aria-label={`আর ${bn(limit - takeBacks)} বার`}>{bn(limit - takeBacks)}</small>}
                </button>
              </div>
              <p className="cj-hint" role="status" aria-live="polite" data-warn={held >= 0 && heldGift > 0 || undefined}>{hintLine()}</p>
            </>
          )}
        </div>
      )}

      {sheetOpen && (
        <LevelSheet stars={ladder.stars} open={open} visit={visit} current={mode === "solo" ? level : 0} recommended={recommended()} onClose={closeSheet}
          onPick={pickLevel => { setRun(F.sheet(now.current.run, false, clockNow())); load("solo", pickLevel); }} />
      )}

      {card && (
        <section className="cj-result" id="result" ref={resultBox} aria-labelledby="cj-result-title">
          <h2 id="cj-result-title"><em>{scoreLine(shown, game.score)}</em>, কাঁথা তৈরি</h2>
          <p>{rival ? compareLine(mine, rival.game.score[0], rival.name) : humanLine(card.level, game.score, shown, total)}</p>
          <div className="cj-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cj-card-summary" />
              <figcaption id="cj-card-summary" className="cj-sr">ছক-জোড়ার কার্ড: {feat(card)}।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            {shared && (
              <div className="cj-share">
                {mode === "solo" ? (
                  <label className="cj-name">
                    <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                    <input value={names[0]} maxLength={MAX_NAME} onChange={event => setNames([event.target.value, names[1]])} placeholder="যেমন: রাফি" autoComplete="nickname" />
                  </label>
                ) : (
                  <div className="cj-names">
                    {([0, 1] as const).map(p => (
                      <label key={p} className="cj-name" data-player={p}>
                        <span>{p ? "নীল সুতোর নাম" : "লাল সুতোর নাম"}</span>
                        <input value={names[p]} maxLength={MAX_NAME} onChange={event => setNames(p ? [names[0], event.target.value] : [event.target.value, names[1]])} placeholder={p ? "যেমন: মিম" : "যেমন: রাফি"} autoComplete="off" />
                      </label>
                    ))}
                  </div>
                )}
                <FormatToggle value={format} onChange={setFormat} />
                <ShareBar tool={TOOL} fileName="chhok-jora.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                  hint={mode === "solo" ? `বন্ধু লিংক খুললে একই শুরু থেকে ${possessive(rivalOf(level))} সাথে খেলবে। চালগুলো মিলিয়ে দেখা হয়, তাই ফলটা সত্যি।` : "লিংক খুললে পুরো কাঁথাটা দেখা যাবে, চালগুলো মিলিয়ে।"} />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

