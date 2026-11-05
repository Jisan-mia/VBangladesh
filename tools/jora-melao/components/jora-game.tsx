"use client";
// IP: what we avoided — no cartoon characters, mascots or licensed toys, no card-back or layout from any boxed memory game or app, no famous game's name; the toys, fruits and birds are drawn fresh as plain shapes, on a jute stall, a bamboo ডালা and a বিল.
// The rules, the clocks and what the phone keeps are pure (lib/play.ts, lib/session.ts, lib/save.ts, lib/link.ts); the cards are
// buttons that turn on pointerdown. This file feeds them taps, keys and performance.now(), and plays the sounds.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { MAX_NAME, confetti, newSeed, readLevels, shake, silenceScheduled, totalStars, useBest, useLevels, useSlowMode } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { PLAYER_COLORS, cardBlob, drawCard } from "../lib/draw-card";
import { migrateOldBests } from "../lib/legacy";
import { LEVELS, LEVEL_COUNT, WORLDS, cardsOf, colsOf, duoSpec, finaleName, isFinale, levelAt, rowsOfCards, worldOf, type DuoSize } from "../lib/levels";
import { bn, caption, cardHash, cardOf, duoScore, humanLine, levelTitle, parseCard, playerName, sameGame, versusLine, winner, winnerTitle, type Card } from "../lib/link";
import { PICTURES, pictureName } from "../lib/pictures";
import { atStake, isUp, legacyGame, movesToNextStar, newGame, reachable, starsOf, type Game, type Players } from "../lib/play";
import { OLD_COUNT, OLD_STARS_KEY, OPEN_KEY, STARS_SLUG, TOOL, bestSlug, allCleared, openAfter, readOpen, startLevel } from "../lib/save";
import * as session from "../lib/session";
import { leftFraction } from "../lib/tick.hot";
import { clock, Finish, type Choice, type FinishStats } from "./finish";
import { LevelSheet } from "./level-sheet";
import { Pic, Symbols } from "./picture";
import { sound } from "./sound";
import { StartInfo, type Mode } from "./start-info";

/** The last pair gets a moment on the board before the end screen. */
const OVER_DELAY_MS = 650, OVER_DELAY_SLOW_MS = 250;
/** A key held through the end of a board must not skip the end screen. */
const RESULT_KEY_GUARD_MS = 400;
const FLIGHT_MS = 650, FLIGHT_SLOW_MS = 900;
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };
const COLORS = ["#e03131", "#f2a516", "#17707a", "#e64980", "#2f9e44", "#3b5bdb"];
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/** What is being played: a ladder level (v 2), two players (v 2, level 0), or an old board from a friend's old link (v 1). */
type Deal = { level: number; v: 1 | 2; players: Players; seed: number; cards: number };
type Finished = { stars: number; stats: FinishStats; previousBest: number | null; firstClear: boolean; beaten: boolean; cleared: boolean };

function gameFor(deal: Deal): Game {
  if (deal.v === 1) return legacyGame(deal.seed, deal.cards as 8 | 12 | 16 | 20, deal.players);
  if (deal.players === 2) return newGame(deal.seed, duoSpec(deal.cards as DuoSize), 2);
  return newGame(deal.seed, levelAt(deal.level), 1);
}
const dealOf = (card: Card): Deal => ({ level: card.v === 2 ? card.level : 0, v: card.v, players: card.players, seed: card.seed, cards: card.cards });

export function JoraGame() {
  const first: Deal = { level: 1, v: 2, players: 1, seed: 1, cards: cardsOf(LEVELS[0]) };
  const [deal, setDeal] = useState<Deal>(first);
  const [run, setRun] = useState<session.Run>(() => session.ready(gameFor(first)));
  const [duoCards, setDuoCards] = useState<DuoSize>(16);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [showOver, setShowOver] = useState(false);
  const [left, setLeft] = useState(0);
  const [pop, setPop] = useState({ key: 0, text: "", place: 0 });
  const [crack, setCrack] = useState({ key: 0, star: 0 });
  const [flight, setFlight] = useState({ key: 0, places: [] as number[] });
  const [cursor, setCursor] = useState(0);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const [slow] = useSlowMode();

  const root = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const overTimer = useRef(0);
  const timers = useRef<number[]>([]);
  const overAt = useRef(0);
  const recorded = useRef(-1);
  const play = useRef(0);
  const second = useRef(-1);
  const inView = useInView(root);

  const levels = useLevels(STARS_SLUG, LEVEL_COUNT);
  const [best, submitBest] = useBest(bestSlug(deal.level || 0), false);
  const timing = slow ? session.SLOW_TIMING : session.TIMING;
  const game = run.game, spec = game.spec;
  const two = deal.players === 2, old = deal.v === 1, ladder = deal.v === 2 && deal.level > 0 && !two;
  const world = ladder ? worldOf(deal.level) : 0;
  // The latest of everything, for the frame loop and listeners that outlive a render.
  const now = useRef({ deal, run, slow, timing, open, sheet, finish, best, stars: levels.stars, names, duoCards });
  now.current = { ...now.current, deal, slow, timing, open, sheet, finish, best, stars: levels.stars, names, duoCards };

  // ---- the frame loop: only while a clock runs (the peek, a missed pair waiting) ----
  function frame() {
    raf.current = 0;
    const at = performance.now(), before = now.current.run;
    const after = session.tick(before, at);
    if (after !== before) commit(after, before);
    const s = now.current.run;
    touch(s, at);
    if (session.running(s) && s.timer && !raf.current) raf.current = requestAnimationFrame(frame);
  }
  /** The per-frame touches outside React: the peek's draining bar and its seconds. */
  function touch(s: session.Run, at: number) {
    if (s.timer === "peek") {
      const el = session.elapsed(s, at);
      if (bar.current) bar.current.style.transform = `scaleX(${leftFraction(el, s.dur)})`;
      const sec = session.peekLeft(s, at);
      if (sec !== second.current) { second.current = sec; setLeft(sec); }
    }
  }

  /** Every change to the run goes through here: it stores it, starts or stops the frame loop, and plays what the change means. */
  function commit(next: session.Run, before: session.Run) {
    if (next === before) return;
    now.current.run = next;
    setRun(next);
    effects(before.game, next.game, next);
    if (session.running(next) && next.timer) { if (!raf.current) raf.current = requestAnimationFrame(frame); }
    else if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    touch(next, performance.now());
  }

  /** A timer that load() and unmount clear, so a celebration never lands on the next board. */
  function later(ms: number, run: () => void) { timers.current.push(window.setTimeout(run, ms)); }

  function effects(g0: Game, g1: Game, r: session.Run) {
    const still = now.current.slow;
    if (g0.phase === "ready" && g1.phase === "peek") for (let i = 0; i < 6; i++) sound.flip(i * 0.05);
    if (g1.flips.length > g0.flips.length) sound.flip();
    if (g1.moves > g0.moves) {
      const lastFlip = g1.flips[g1.flips.length - 1];
      if (g1.last === "match") {
        sound.bell(g1.streak);
        setPop(current => ({ key: current.key + 1, text: g1.streak > 1 ? `পরপর ${bn(g1.streak)}টা!` : "মিলেছে!", place: lastFlip }));
      } else {
        sound.miss();
        if (!still) later(300, () => { const tiles = grid.current?.querySelectorAll(".jm-tile"); shake(tiles?.[g1.open[0]]); shake(tiles?.[g1.open[1]]); });
      }
    }
    if (g1.cracked && g1.moves > g0.moves) { sound.crack(); setCrack(current => ({ key: current.key + 1, star: g1.cracked })); }
    else if (atStake(g1) > 0 && atStake(g0) === 0 && g1.phase === "play") sound.stake();
    if (g1.flown !== g0.flown && g1.flown.length) { sound.flutter(); setFlight(current => ({ key: current.key + 1, places: g1.flown })); }
    if (g1.phase === "over" && g0.phase !== "over") finalize(r);
  }

  // ---- loading a board: everything about the last one goes (scheduled notes, the end timer, picks and result) ----
  function load(next: Deal) {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    window.clearTimeout(overTimer.current);
    timers.current.forEach(clearTimeout); timers.current = [];
    silenceScheduled();
    play.current++;
    const s = session.ready(gameFor(next));
    now.current = { ...now.current, deal: next, run: s, sheet: false, finish: null };
    second.current = -1;
    setDeal(next);
    setRun(s);
    setFinish(null);
    setShowOver(false);
    setSheet(false);
    setLeft(s.game.spec.peek);
    setCursor(0);
    setPop({ key: 0, text: "", place: 0 });
    setCrack({ key: 0, star: 0 });
    setFlight({ key: 0, places: [] });
    if (bar.current) bar.current.style.transform = "";
  }
  const canPick = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const rival = friend && sameGame(cardOf(game, names, deal.level, deal.v), friend) ? friend : null;
  const dropFriend = () => {
    setFriend(null); setVisit(0);
    if (window.location.hash) history.replaceState(history.state, "", window.location.pathname + window.location.search);
  };
  function pickLevel(to: number) {
    if (!canPick(to)) return;
    if (friend && !(to === visit && friend.level === to)) dropFriend();
    load({ level: to, v: 2, players: 1, seed: newSeed(), cards: cardsOf(levelAt(to)) });
  }
  function chooseMode(mode: Mode) {
    if ((mode === "duo") === two && !old) return;
    sound.flip();
    dropFriend();
    if (mode === "solo") { const level = startLevel(now.current.stars, now.current.open); load({ level, v: 2, players: 1, seed: newSeed(), cards: cardsOf(levelAt(level)) }); }
    else load({ level: 0, v: 2, players: 2, seed: newSeed(), cards: now.current.duoCards });
  }
  function chooseDuoCards(cards: DuoSize) {
    setDuoCards(cards);
    if (!two || game.phase !== "ready") return;
    dropFriend();
    load({ level: 0, v: 2, players: 2, seed: newSeed(), cards });
  }
  /** আবার খেলো: a memory board can't be replayed fairly (you'd remember it), so it always deals a new one. */
  function again() {
    dropFriend();
    if (two) load({ level: 0, v: 2, players: 2, seed: newSeed(), cards: deal.cards });
    else if (deal.v === 2 && deal.level) load({ level: deal.level, v: 2, players: 1, seed: newSeed(), cards: deal.cards });
    else pickLevel(startLevel(now.current.stars, now.current.open));
  }

  // ---- moves ----
  function start() {
    const s = now.current.run;
    if (s.game.phase !== "ready") return;
    commit(session.start(s, performance.now()), s);
  }
  function pauseFor(why: session.Why) {
    const s = now.current.run;
    commit(session.pause(s, performance.now(), why), s);
  }
  function resumeFrom(why: session.Why) {
    const s = now.current.run;
    commit(session.resume(s, performance.now(), why, now.current.timing.breath), s);
  }
  function tap(index: number) {
    const s = now.current.run;
    // The tap that brings the window back only wakes the board: it never turns a card.
    if (s.why === "away") { resumeFrom("away"); return; }
    if (s.why || now.current.sheet) return;
    commit(session.tap(s, performance.now(), index, now.current.timing), s);
  }

  /** The last pair is found: record the stars and the best once, right now (not behind the end screen's delay). */
  function finalize(r: session.Run) {
    if (recorded.current === play.current) return;
    recorded.current = play.current;
    const g = r.game, d = now.current.deal, sp = g.spec;
    const stars = d.v === 2 && d.level && d.players === 1 ? starsOf(sp, g.moves) : 0;
    const firstClear = stars > 0 && !now.current.stars[d.level];
    let cleared = false;
    if (stars) {
      levels.record(d.level, stars);
      const opened = openAfter(now.current.open, d.level);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
      cleared = allCleared({ ...now.current.stars, [d.level]: Math.max(stars, now.current.stars[d.level] ?? 0) });
    }
    const previousBest = now.current.best;
    const beaten = stars > 0 && submitBest(g.moves) && previousBest !== null;
    const stats: FinishStats = { moves: g.moves, misses: g.misses, bestStreak: g.bestStreak, remembered: g.remembered, pairs: sp.pairs, seconds: Math.round(session.playMs(r, performance.now()) / 1000), stars };
    const done: Finished = { stars, stats, previousBest, firstClear, beaten, cleared };
    now.current.finish = done;
    setFinish(done);
    const still = now.current.slow, wait = (still ? OVER_DELAY_SLOW_MS : OVER_DELAY_MS) / 1000;
    const big = stars === 3 || beaten || (firstClear && isFinale(d.level));
    if (d.players === 2) { if (g.pairs[0] !== g.pairs[1]) { sound.ident(0, true, wait); if (!still) confetti({ colors: COLORS }); } else sound.ident(0, false, wait); }
    else if (stars) sound.ident(worldOf(d.level), big, wait + 0.26 * (stars + 1));
    else sound.ident(0, false, wait);
    if (big && !still && d.players === 1) later(260 * (stars + 1) + wait * 1000, () => confetti({ colors: COLORS }));
    window.clearTimeout(overTimer.current);
    overTimer.current = window.setTimeout(() => { overAt.current = performance.now(); setShowOver(true); }, wait * 1000);
  }

  // The player's menu: pause stops every clock and covers the board; চালিয়ে যাও brings it back after a breath.
  const player = useGamePlayer({
    onPause: () => pauseFor("away"),
    onResume: () => resumeFrom("away"),
    onRestart: () => again(),
    onLevels: () => { if (!two) openSheet(); },
  });

  // Away without the player (or before its menu engages): blur and a hidden tab pause too.
  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      if (raf.current) cancelAnimationFrame(raf.current);
      window.clearTimeout(overTimer.current);
      timers.current.forEach(clearTimeout);
      silenceScheduled();
    };
  }, []);

  // Boot once this phone's stars are read: the old best-of moves become old stars (once), your own open level is set
  // from them, then a friend's board from the link, or where you left off.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const moved = migrateOldBests(read(OLD_STARS_KEY), read(`ektukhani-best-${TOOL}-12`), read(`ektukhani-best-${TOOL}-16`));
    if (moved) write(OLD_STARS_KEY, moved);
    const mine = readOpen(read(OPEN_KEY), levels.stars, readLevels(read(OLD_STARS_KEY), OLD_COUNT));
    if (read(OPEN_KEY) === null) write(OPEN_KEY, String(mine));
    now.current.open = mine;
    setOpen(mine);
    setSite(window.location.host);
    setBooted(true);
    const fromHash = () => {
      const got = parseCard(window.location.hash);
      if (!got) return false;
      setFriend(got);
      setVisit(got.v === 2 ? got.level : 0);
      if (got.players === 2) setDuoCards(got.cards === 12 ? 12 : 16);
      setNames(current => got.players === 2 ? [current[0], current[1]] : current);
      load(dealOf(got));
      return true;
    };
    if (!fromHash()) { const level = startLevel(levels.stars, mine); load({ level, v: 2, players: 1, seed: newSeed(), cards: cardsOf(levelAt(level)) }); }
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- sizing: CSS decides (container units of the table box), so every board fits the stage without scrolling ----
  const cards = game.board.length, cols = colsOf(cards), rows = rowsOfCards(cards);
  const gap = cards > 16 ? 6 : 9;

  // ---- the birds fly: the two face-down cards of each pair cross over (a still straight glide in ধীরে খেলো) ----
  useLayoutEffect(() => {
    if (!flight.key || !grid.current) return;
    const tiles = grid.current.querySelectorAll<HTMLElement>(".jm-tile");
    for (let i = 0; i + 1 < flight.places.length; i += 2) {
      const a = tiles[flight.places[i]], b = tiles[flight.places[i + 1]];
      if (!a || !b || !a.animate) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const move = (el: HTMLElement, dx: number, dy: number) => {
        const lift = slow ? 0 : -26;
        el.animate(slow
          ? [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }]
          : [{ transform: `translate(${dx}px, ${dy}px) scale(1)`, zIndex: 3 }, { transform: `translate(${dx / 2}px, ${dy / 2 + lift}px) scale(1.14)`, zIndex: 3, offset: 0.5 }, { transform: "none", zIndex: 3 }],
          { duration: slow ? FLIGHT_SLOW_MS : FLIGHT_MS, easing: "cubic-bezier(.4,0,.2,1)" });
      };
      move(a, rb.left - ra.left, rb.top - ra.top);
      move(b, ra.left - rb.left, ra.top - rb.top);
    }
  }, [flight.key]);

  // ---- cards ----
  const over = game.phase === "over" && finish !== null;
  const card: Card | null = over ? cardOf(game, names, deal.v === 2 ? deal.level : 0, deal.v) : null;
  const state = card ? cardHash(card) : "";
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("জোড়া মেলাও লেভেল ২৩ চালে মেলার শেষ দোকান").then(() => {
      if (cancelled) return;
      if (card && cardCanvas.current) drawCard(cardCanvas.current, card, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; run.game.phase brings the friend's canvas back with the start screen.
  }, [state, format, site, friend, game.phase, showOver]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- choices: the sheet pauses play ----
  function openSheet() {
    pauseFor("sheet");
    now.current.sheet = true;
    setSheet(true);
  }
  function closeSheet() { now.current.sheet = false; setSheet(false); resumeFrom("sheet"); }

  const recommended = startLevel(levels.stars, open);
  const nextOpen = ladder && deal.level < LEVEL_COUNT && canPick(deal.level + 1);
  const total = totalStars(levels.stars);
  const redo: Choice = { label: "আবার খেলো", run: again };
  const all: Choice = { label: "সব লেভেল", run: openSheet };
  const endChoices: Choice[] = two ? [redo, { label: "একা খেলো", run: () => chooseMode("solo") }]
    : ladder && (finish?.stars ?? 0) > 0 ? (nextOpen ? [{ label: "পরের লেভেল", run: () => pickLevel(deal.level + 1) }, redo, all]
      : deal.level > open ? [{ label: `লেভেল ${bn(recommended)} খেলো`, run: () => pickLevel(recommended) }, redo, all] : [all, redo])
    : ladder ? [redo, all] : [redo, { label: "লেভেলে খেলো", run: () => pickLevel(recommended) }];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the end screen shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (now.current.sheet || !inView) return;
    const key = event.key, enter = key === "Enter" || key === " ", fresh = !event.repeat, s = now.current.run, phase = s.game.phase;
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab does its own job (a card too)
    const digit = "১২৩".includes(key) ? "১২৩".indexOf(key) : /^[1-3]$/.test(key) ? Number(key) - 1 : -1;
    if ((key === "p" || key === "P") && fresh && session.running(s)) {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor("away");
      return;
    }
    if (s.why === "away") { if (enter) { event.preventDefault(); if (fresh) resumeFrom("away"); } return; }
    if (s.why) return;
    if (phase === "over") {
      if (!showOver) return;
      if ((enter || (digit >= 0 && digit < endChoices.length)) && fresh && event.timeStamp > overAt.current + RESULT_KEY_GUARD_MS) {
        event.preventDefault();
        endChoices[enter ? 0 : digit].run();
      } else if (enter) event.preventDefault();
      return;
    }
    if (phase === "ready") {
      if (enter) { event.preventDefault(); if (fresh) start(); return; }
      if (digit === 0 || digit === 1) { event.preventDefault(); if (fresh) chooseMode(digit === 0 ? "solo" : "duo"); return; }
      if ((key === "ArrowLeft" || key === "ArrowRight") && fresh && ladder) { event.preventDefault(); pickLevel(deal.level + (key === "ArrowLeft" ? -1 : 1)); }
      return;
    }
    // In play: the arrows pick up the cursor when no card has focus.
    if (STEPS[key] && !element?.closest?.(".jm-tile") && phase === "play") {
      event.preventDefault();
      grid.current?.querySelectorAll<HTMLButtonElement>(".jm-tile")[cursor]?.focus({ preventScroll: true });
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement && !button.classList.contains("jm-tile")) button.blur();
  }
  function arrows(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = STEPS[event.key];
    if (!step) return;
    const tiles = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(".jm-tile")];
    const from = tiles.indexOf(document.activeElement as HTMLButtonElement);
    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
    const to = from + (vertical ? step * cols : step);
    if (from < 0 || to < 0 || to >= tiles.length || (!vertical && Math.floor(to / cols) !== Math.floor(from / cols))) return;
    event.preventDefault();
    tiles[to].focus({ preventScroll: true });
  }

  // ---- what the screen shows ----
  const covered = run.why !== null && session.started(run);
  const ready = game.phase === "ready", peeking = game.phase === "peek", playing = game.phase === "play";
  const finale = ladder ? finaleName(deal.level) : "";
  const found = game.pairs[0] + game.pairs[1], leftPairs = spec.pairs - found;
  const stake = covered ? 0 : atStake(game);
  const best3 = reachable(game);
  const turnName = playerName(names, game.turn);
  const lastFlip = game.flips[game.flips.length - 1] ?? 0;

  function status() {
    if (covered) return "থেমে আছে। কার্ডগুলো যেখানে ছিল, সেখানেই আছে।";
    if (ready) return rival ? "বন্ধুর বোর্ড। সাইনে চাপলেই শুরু।" : ladder && levels.stars[deal.level] ? `আগের বার ${bn(levels.stars[deal.level])} তারা। আরও কম চালে পারো?` : "সাইনে চাপলেই কার্ড খোলা শুরু।";
    if (peeking) return "দেখে নাও, কোনটা কোথায়।";
    if (game.phase === "over") return "";
    if (game.last === "match") return `মিলেছে। ${pictureName(game.board[lastFlip])}।${two ? ` আবার ${possessive(turnName)} পালা।` : ""}`;
    if (game.last === "miss") return `মেলেনি।${two ? ` এবার ${possessive(turnName)} পালা।` : ""}`;
    if (game.flown.length) return "পাখি উড়ে জায়গা বদলাল। আগের মনে রাখা আর মিলবে না।";
    if (game.open.length === 1) return `${pictureName(game.board[game.open[0]])}। এবার এর জোড়াটা খোঁজো।`;
    if (game.flips.length === 0 && game.demo) return "একটা জোড়া খোলা আছে। যেকোনো কার্ড চাপো।";
    return two ? `${playerName(names, game.turn)}, তোমার পালা।` : "একটা কার্ড চাপো।";
  }

  const owners = two ? game.found : undefined;
  const winnerSeat = winner({ pairs: game.pairs });
  const nearLine = ladder && finish && finish.stars > 0 && finish.stars < 3 ? `আর ${bn(movesToNextStar(spec, game.moves))} চাল কম হলে ${bn(finish.stars + 1)} তারা।` : "";
  const nextWorld = finale && finish?.firstClear && world < WORLDS.length - 1 ? WORLDS[world + 1].name : "";
  const overCard = card;
  const overTitle = !finish ? "" : two ? winnerTitle(card!) : ladder ? (finish.stars ? (finale ? `${finale} পার` : `লেভেল ${bn(deal.level)} শেষ`) : `লেভেল ${bn(deal.level)}: আরেকবার?`) : "সব জোড়া মিলেছে";
  const overLine = !finish || !overCard ? "" : two ? humanLine(overCard)
    : rival && !two ? versusLine(game.moves, rival.moves, rival.names[0])
    : finish.cleared && finish.firstClear ? "তিন টেবিলের সব বোর্ড শেষ। মেলার ঘণ্টা তোমার নামে।"
    : finale && finish.firstClear ? `${WORLDS[world].of} সব বোর্ড শেষ।${nextWorld ? ` এবার ${nextWorld}।` : ""}`
    : finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড। আগের সেরা ছিল ${bn(finish.previousBest)} চাল।`
    : finish.stars === 3 ? `${bn(spec.three)} চালের মধ্যে, পুরো ৩ তারা।` : humanLine(overCard);
  const bestLine = finish && finish.previousBest !== null && finish.previousBest < game.moves && ladder ? `এই লেভেলে তোমার সেরা ${bn(finish.previousBest)} চাল।` : "";
  const cardSummary = card ? `জোড়া মেলাও, ${card.level ? `${levelTitle(card.level)}, ` : ""}${bn(card.cards / 2)} জোড়া। ${two ? duoScore(card) : `${card.names[0] ? `${card.names[0]}, ` : ""}${bn(card.moves)} চালে`}${finish?.stars ? `, ${bn(finish.stars)} তারা` : ""}। ${humanLine(card)}` : "";
  const tierBar = ladder && playing ? Math.min(1, game.moves / spec.three) : 0;
  const tier = game.moves <= spec.three ? "three" : game.moves <= spec.two ? "two" : "one";
  const sinceFlight = spec.every ? game.misses % spec.every : 0;

  return (
    <div ref={root} className="jm" data-phase={game.phase} data-world={world} data-calm={slow || undefined} data-danger={stake > 0 || undefined} data-finale={finale ? "" : undefined} onClick={dropFocus}>
      <Symbols world={spec.world} />
      <div className="jm-play" hidden={game.phase === "over" && showOver}>
        <header className="jm-hud">
          <button type="button" className="jm-badge" onClick={() => { if (!two) openSheet(); }} disabled={two} aria-haspopup="dialog" aria-label={two ? "দুজনে খেলা" : `লেভেল ${bn(deal.level || 0)}, সব লেভেল দেখো`}>
            <b>{two ? "দুজনে" : old ? "পুরোনো বোর্ড" : finale ? "শেষ বোর্ড" : `লেভেল ${bn(deal.level)}`}</b>
            <span>{two ? `${bn(spec.pairs)} জোড়া` : old ? `${bn(spec.pairs)} জোড়া` : finale ? `লেভেল ${bn(deal.level)}` : WORLDS[world].name}</span>
          </button>
          {two ? (
            <p className="jm-turn" style={{ "--who": PLAYER_COLORS[game.turn] } as CSSProperties} key={`${game.turn}-${game.moves}`}>{ready ? playerName(names, 0) : playerName(names, game.turn)}<small>এর পালা</small></p>
          ) : finale ? (
            <div className="jm-boss" aria-label={`${finale}: বাকি ${bn(leftPairs)} জোড়া`}>
              <b>{finale}</b>
              <span><i style={{ transform: `scaleX(${spec.pairs ? leftPairs / spec.pairs : 0})` }} /></span>
              <small>বাকি {bn(leftPairs)} জোড়া</small>
            </div>
          ) : (
            <ol className="jm-pips" aria-label={`জোড়া ${bn(found)}/${bn(spec.pairs)}`}>
              {Array.from({ length: spec.pairs }, (_, index) => <li key={index} data-on={index < found || undefined} />)}
            </ol>
          )}
          {two ? (
            <p className="jm-score duo">
              {([0, 1] as const).map(seat => <span key={seat} data-on={seat === game.turn && playing || undefined} style={{ "--who": PLAYER_COLORS[seat] } as CSSProperties}><i aria-hidden="true" />{bn(game.pairs[seat])}</span>)}
            </p>
          ) : (
            <p className="jm-score">
              <b>চাল {bn(game.moves)}</b>
              {ladder ? (
                <span className="jm-track" aria-label={`এখনো ${bn(best3)} তারা পাওয়া যাবে`}>
                  {[1, 2, 3].map(n => <i key={n} data-on={n <= best3 || undefined} data-stake={stake === n || undefined} data-lost={crack.star === n && n > best3 || undefined}>★</i>)}
                </span>
              ) : <small>জোড়া {bn(found)}/{bn(spec.pairs)}</small>}
            </p>
          )}
        </header>
        <div className="jm-bar" data-kind={peeking ? "peek" : "moves"} data-tier={tier} aria-hidden="true"><i ref={bar} style={playing ? { transform: `scaleX(${tierBar})` } : undefined} /></div>

        <div className="jm-table" ref={table}>
          <div className="jm-mat" data-world={spec.world} style={{ "--cols": cols, "--rows": rows, "--gap": `${gap}px` } as CSSProperties}>
            <div className="jm-grid" ref={grid} role="group" aria-label="কার্ড, তীর চিহ্ন দিয়ে সরতে পারো" onKeyDown={arrows}>
              {game.board.map((id, index) => {
                const owner = game.found[index], up = isUp(game, index) && (!covered || owner >= 0);
                const name = PICTURES[id].name;
                const label = owner >= 0 ? `${name}, মিলেছে` : up ? `${bn(index + 1)}: ${name}` : `${bn(index + 1)} নম্বর কার্ড`;
                return (
                  <button key={index} type="button" className="jm-tile" data-up={up || undefined} data-peek={peeking || undefined} data-demo={playing && game.demo && game.flips.length === 0 && game.demo.includes(index) ? "" : undefined}
                    data-owner={owner >= 0 ? (two ? owner : "solo") : undefined}
                    style={{ "--i": index, ...(two && owner >= 0 ? { "--who": PLAYER_COLORS[owner] } : {}) } as CSSProperties}
                    tabIndex={index === cursor ? 0 : -1} aria-label={label} disabled={ready || game.phase === "over"} onFocus={() => setCursor(index)}
                    onPointerDown={event => onTilePress(event, index)} onClick={event => { if (event.detail === 0) tap(index); }}>
                    <span className="jm-inner">
                      <span className="jm-back" aria-hidden="true" />
                      <span className="jm-face" style={{ "--tint": PICTURES[id].tint } as CSSProperties}><Pic id={id} /><small>{name}</small></span>
                    </span>
                  </button>
                );
              })}
              {pop.text && playing && !slow && (
                <em className="jm-pop" key={pop.key} aria-hidden="true" style={{ left: `${Math.min(80, Math.max(20, ((pop.place % cols) + 0.5) * (100 / cols)))}%`, top: `${Math.floor(pop.place / cols) * (100 / rows)}%` }}>{pop.text}</em>
              )}
            </div>
            {peeking && !covered && <span className="jm-count" aria-hidden="true">{bn(left)}</span>}
            {crack.key > 0 && <i className="jm-flash" key={crack.key} aria-hidden="true" />}
            {ready && (
              <button type="button" className="jm-sign" onClick={event => { event.currentTarget.blur(); start(); }} aria-label={`কার্ড খোলো, ${bn(spec.pairs)} জোড়া`}>
                <span className="jm-sign-board">
                  <b>{rival ? "বন্ধুর বোর্ড" : "কার্ড খোলো"}</b>
                  <small>{old ? `${bn(spec.pairs)} জোড়া · পুরোনো বোর্ড` : two ? `${bn(spec.pairs)} জোড়া · দুজনে` : `${bn(spec.pairs)} জোড়া${spec.peek ? ` · ${bn(spec.peek)} সে. ঝলক` : ""}`}</small>
                </span>
              </button>
            )}
            {covered && (
              <div className="jm-cover">
                <p>থেমে আছে। কার্ডগুলো যেখানে ছিল, সেখানেই আছে।</p>
                <button type="button" className="jm-resume" onClick={event => { event.currentTarget.blur(); resumeFrom(run.why === "sheet" ? "sheet" : "away"); }}>চালিয়ে যাও</button>
              </div>
            )}
          </div>
        </div>

        <p className="jm-status" role="status" aria-live="polite">{status()}</p>

        <div className="jm-below">
          {ready ? (
            <StartInfo level={deal.level} spec={spec} old={old} mode={two ? "duo" : "solo"} duoCards={duoCards} stars={levels.stars[deal.level] ?? 0}
              canBack={deal.level > 1 && canPick(deal.level - 1)} canNext={canPick(deal.level + 1)} friend={rival} friendCanvas={friendCanvas} names={names}
              onLevel={pickLevel} onSheet={openSheet} onMode={chooseMode} onDuoCards={chooseDuoCards}
              onName={(seat, value) => setNames(current => seat === 0 ? [value, current[1]] : [current[0], value])} />
          ) : (
            <div className="jm-par">
              {ladder ? (
                <>
                  <p className="jm-par-line"><span data-on={best3 >= 3 || undefined}>★★★ {bn(spec.three)} চালে</span><span data-on={best3 >= 2 || undefined}>★★ {bn(spec.two)} চালে</span></p>
                  {spec.every > 0 && (
                    <p className="jm-flight" data-due={sinceFlight === spec.every - 1 || undefined}>
                      <span>পাখি ওড়ে প্রতি {bn(spec.every)} ভুলে</span>
                      <span aria-hidden="true">{Array.from({ length: spec.every }, (_, i) => <i key={i} data-on={i < sinceFlight || undefined} />)}</span>
                    </p>
                  )}
                  {stake > 0 && <p className="jm-warn">পরের ভুলে {bn(stake)} তারা যাবে।</p>}
                  {peeking && <p className="jm-note">সময় শেষ হলে সব উল্টে যাবে।</p>}
                </>
              ) : <p className="jm-note">{two ? `${duoScore(cardOf(game, names, 0, deal.v))}` : "এই বোর্ডে তারা জমে না।"}</p>}
            </div>
          )}
        </div>
      </div>

      {game.phase === "over" && showOver && finish && card && (
        <Finish title={overTitle} sub={two ? "দুজনে · সব জোড়া মিলেছে" : ladder ? `${WORLDS[world].name} · ${bn(spec.pairs)} জোড়া` : "পুরোনো বোর্ড · সব জোড়া মিলেছে"}
          stats={finish.stats} board={game.board} cols={cols} owners={owners} slow={slow} finale={Boolean(finale && finish.stars)}
          duo={two ? { names: [playerName(names, 0), playerName(names, 1)], pairs: game.pairs, top: winnerSeat } : undefined}
          line={overLine} near={nearLine} best={bestLine} choices={endChoices} onCard={seeCard} />
      )}

      {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={deal.level} recommended={recommended} onPick={pickLevel} onClose={closeSheet} />}

      {card && showOver && (
        <section className="jm-result" id="result" ref={resultBox} aria-labelledby="jm-result-title">
          <h2 id="jm-result-title">{overLine}</h2>
          <div className="jm-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="jm-card-summary" />
              <figcaption id="jm-card-summary" className="jm-sr">{cardSummary}</figcaption>
              {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="jm-share">
              {!two && (
                <label className="jm-name">
                  <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={names[0]} maxLength={MAX_NAME} onChange={event => { const value = event.target.value; setNames(current => [value, current[1]]); }} placeholder="যেমন: রাফি" autoComplete="off" />
                </label>
              )}
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="jora-melao.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint="বন্ধু লিংক খুললে ঠিক এই ছবিগুলো, এই জায়গাতেই পাবে।" />
            </div>
          </div>
        </section>
      )}
      <p className="jm-sr" aria-live="polite">{game.phase === "over" && finish ? `${overTitle}। ${bn(game.moves)} চালে।${finish.stars ? ` ${bn(finish.stars)} তারা।` : ""}` : ""}</p>
    </div>
  );

  /** A card turns the moment the finger lands: a touch or a left mouse button, and never while paused. */
  function onTilePress(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!event.isPrimary) return;
    tap(index);
  }
}
