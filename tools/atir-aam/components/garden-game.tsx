"use client";
// IP: what we avoided — no numbered tiles, no numbers anywhere on the board, no beige grid of rounded squares and no warm number colour ramp, no "2048" name or look; ours is a garden bed in a bamboo fence with round painted clay plates (সরা) showing a mango's life in drawings, nine stages that end, seasons with rain, hail, gusts, crows and weeds, and our own seeded drop rule (one in eight a চারা).
// The game inside the shared player. Rules live in lib/ (rules.ts plays a swipe, session.ts decides input and the wind,
// scene.ts + draw.hot.ts animate the bed); this file feeds input, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, newSeed, sfx, silenceScheduled, soundOn, totalStars, useBest, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { drawStage } from "../lib/art";
import { stageName, STONE, TOP, type Dir } from "../lib/board";
import { drawCard } from "../lib/card";
import { fromGame, parseShared, sameRun, type Shared } from "../lib/challenge";
import { drawScene } from "../lib/draw.hot";
import { finaleName, isFinale, isLevel, isMode, LEVEL_COUNT, levelAt, MODE_INFO, WORLDS, worldOf, type Mode } from "../lib/levels";
import {
  createGame, danger, E_FLY, E_GUST, E_HAIL, E_MERGE, E_PEAK, E_PULL, E_RAIN, E_CROW, E_SHOO, gardenStars, limitOf, move, movesLeft, pickOffer,
  shortBy, starsOf, stopHere, takeBack, type Game, type Run,
} from "../lib/rules";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import { burst, makeScene, resizeScene, settle, stageMove } from "../lib/scene";
import * as S from "../lib/session";
import { bestSwipeLine, bn, compareLine, endKicker, endWhy, goalText, hintLine, runLabel, seasonLine, stageLine } from "../lib/words";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { OfferSheet } from "./offer-sheet";
import { ResultCard } from "./result-card";
import { sound } from "./sound";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const SLUG = "atir-aam";
const KEYS = { open: OPEN_KEY, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** How far a finger travels before it is a swipe: the move happens then, not when it lifts. */
const SWIPE_PX = 18;
const GAME_KEYS: Record<string, Dir> = { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3, w: 0, s: 1, a: 2, d: 3, W: 0, S: 1, A: 2, D: 3 };
const ARROWS: Array<{ dir: Dir; label: string; path: string }> = [
  { dir: 2, label: "বাঁয়ে সরাও", path: "M15 5l-7 7 7 7" },
  { dir: 0, label: "ওপরে সরাও", path: "M5 15l7-7 7 7" },
  { dir: 1, label: "নিচে সরাও", path: "M5 9l7 7 7-7" },
  { dir: 3, label: "ডানে সরাও", path: "M9 5l7 7-7 7" },
];
const GUST_EDGE = ["up", "down", "left", "right"] as const;
const GUST_WORD = ["হাওয়া ↑", "হাওয়া ↓", "← হাওয়া", "হাওয়া →"] as const;
const CONFETTI = ["#f2b632", "#e0602a", "#6fb544", "#2f7f3a", "#f6efdc"];

/** The nine plates as small images, drawn once, for the HUD, the road and the goal. */
function usePlates() {
  const [plates, setPlates] = useState<string[]>([]);
  useEffect(() => {
    const sheet = document.createElement("canvas");
    sheet.width = sheet.height = 96;
    const c = sheet.getContext("2d");
    if (!c) return;
    const out: string[] = [];
    for (let stage = 0; stage <= TOP; stage++) { c.clearRect(0, 0, 96, 96); drawStage(c, stage === 0 ? STONE : stage, 0, 0, 96); out[stage] = sheet.toDataURL(); }
    setPlates(out);
  }, []);
  return plates;
}

type Finished = { stats: EndStats; shared: Shared | null; line: string };

export function GardenGame() {
  const wrap = useRef<HTMLDivElement>(null), bedBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const scene = useRef(makeScene());
  const session = useRef<S.Session>(S.createSession(true));
  const raf = useRef(0);
  const wind = useRef<ReturnType<typeof sound.wind> | null>(null);
  const press = useRef<{ id: number; x: number; y: number } | null>(null);
  const finished = useRef<Game | null>(null);
  const clock = useRef({ total: 0, since: 0 });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ v: 2, kind: "level", level: 1, seed: 1, mode: "n" });
  const [game, setGameState] = useState<Game>(() => createGame({ v: 2, kind: "level", level: 1, seed: 1, mode: "n" }));
  const gameRef = useRef(game);
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [open, setOpen] = useState(1);
  const [sheet, setSheet] = useState(false);
  const [booted, setBooted] = useState(false);
  const [done, setDone] = useState<Finished | null>(null);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const [bestScore, submitScore] = useBest(SLUG);
  const [bestStage, submitStage] = useBest(`${SLUG}-stage`);
  const plates = usePlates();
  const live = useRef({ slow, screen, run, bestStage: bestStage ?? 0, open, sheet });
  live.current = { slow, screen, run, bestStage: bestStage ?? 0, open, sheet };
  scene.current.slow = slow;

  const setGame = (next: Game) => { gameRef.current = next; setGameState(next); };

  // ---- the bed: draw while something moves, then rest ----
  function frame() {
    raf.current = 0;
    const c = ctx.current;
    if (!c) return;
    const moving = drawScene(c, scene.current, performance.now());
    const s = session.current;
    // keep animating on the end screen too (the last swipe lands under it); stop only for the menu or when away
    if (moving && !s.paused && s.focused && s.visible) raf.current = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf.current) raf.current = requestAnimationFrame(frame); };
  const still = () => { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; } const c = ctx.current; if (c) drawScene(c, scene.current, performance.now()); };

  // ---- the wind loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { wind.current?.stop(); wind.current = sound.wind(); },
    stop: () => { wind.current?.stop(); wind.current = null; },
  };
  const sync = () => S.syncLoops(session.current, gameRef.current, loops);

  // ---- the play clock: only while the bed is live ----
  const clockOn = () => { if (!clock.current.since) clock.current.since = performance.now(); };
  const clockOff = () => { if (clock.current.since) { clock.current.total += performance.now() - clock.current.since; clock.current.since = 0; } };
  const clockNow = () => clock.current.total + (clock.current.since ? performance.now() - clock.current.since : 0);
  const syncClock = () => { if (S.live(session.current) && !gameRef.current.over) clockOn(); else clockOff(); };

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    live.current.screen = next;
    setScreen(next);
    press.current = null;
    sync(); syncClock();
  }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); press.current = null; sync(); syncClock(); still(); },
    onResume: () => { if (live.current.sheet) return; S.resume(session.current, performance.now()); sync(); syncClock(); kick(); },
    onRestart: () => { S.resume(session.current, performance.now()); setSheet(false); if (live.current.screen === "play" || live.current.screen === "over") again(); else sync(); },
  });

  /** A fresh run on the play screen. */
  function begin(next: Run) {
    silenceScheduled();
    const fresh = createGame(next);
    finished.current = null;
    clock.current = { total: 0, since: 0 };
    setRun(next); live.current.run = next;
    setGame(fresh);
    setDone(null); setSheet(false); live.current.sheet = false;
    if (session.current.paused && !player.paused) S.resume(session.current, performance.now());
    show("play");
    const sc = scene.current, world = next.kind === "level" && next.v === 2 ? worldOf(next.level) : 0;
    if (sc.side) resizeScene(sc, sc.side, sc.ratio, fresh.size, world, fresh.spec.stones);
    settle(sc, fresh, performance.now());
    still(); kick();
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: saved progress, a friend's link, the remembered mode ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    setBooted(true);
    setSite(window.location.host);
    session.current.sound = soundOn();
    const mine = readOpen(read(KEYS.open), levels.stars);
    if (read(KEYS.open) === null) write(KEYS.open, String(mine));
    setOpen(mine); live.current.open = mine;
    const savedMode = read(KEYS.mode), chosen: Mode = isMode(savedMode) ? savedMode : "n";
    setModeState(chosen);
    const fromHash = () => {
      const link = parseShared(window.location.hash);
      if (!link) return false;
      setFriend(link);
      if (link.kind === "level") setVisit(link.level);
      const first: Run = { v: link.v, kind: link.kind, level: link.level, seed: link.seed, mode: link.mode };
      setModeState(link.mode);
      setRun(first); live.current.run = first;
      setGame(createGame(first));
      if (live.current.screen !== "title") show("title");
      return true;
    };
    if (!fromHash()) {
      const first: Run = { v: 2, kind: "level", level: startLevel(levels.stars, mine), seed: 1, mode: chosen };
      setRun(first); live.current.run = first;
      setGame(createGame(first));
    }
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read and drive the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __atir: { game: () => gameRef.current, session: () => session.current, scene: () => scene.current, swipe: (dir: Dir) => swipe(dir, performance.now() + 1e6), pick: (index: number) => pick(index), peek: (dir: Dir) => move(gameRef.current, dir), play: (target: Run) => begin(target) } });
  });

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, soundIsOn); if (!soundIsOn) silenceScheduled(); sync(); }, [soundIsOn]);

  // ---- away and back: a press in flight never lands; the player pauses ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); press.current = null; sync(); syncClock(); };
    const onFocus = () => { S.focus(session.current); sync(); syncClock(); kick(); };
    const onVisibility = () => { if (document.hidden) { S.hide(session.current); press.current = null; } else S.show(session.current); sync(); syncClock(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility);
      loops.stop("wind"); silenceScheduled();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // ---- size the bed to its box ----
  useEffect(() => {
    const holder = bedBox.current, target = canvas.current;
    if (!holder || !target) return;
    const fit = () => {
      const side = Math.floor(Math.min(holder.clientWidth, holder.clientHeight));
      if (side < 80) return;
      target.style.width = `${side}px`; target.style.height = `${side}px`;
      ctx.current = fitCanvas(target, side, side);
      const g = gameRef.current, r = live.current.run, world = r.kind === "level" && r.v === 2 ? worldOf(r.level) : 0;
      resizeScene(scene.current, side, Math.min(2, window.devicePixelRatio || 1), g.size, world, g.spec.stones);
      if (performance.now() > scene.current.end) settle(scene.current, g, performance.now());
      still(); kick();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    fit();
    return () => observer.disconnect();
  }, [screen === "play" || screen === "over"]);

  // ---- a swipe ----
  function swipe(dir: Dir, at: number) {
    const before = gameRef.current, s = session.current;
    if (!S.canSwipe(s, at) || before.over || before.offer) return;
    const next = move(before, dir);
    if (!next) {
      sound.thump();
      const dx = dir === 2 ? -6 : dir === 3 ? 6 : 0, dy = dir === 0 ? -6 : dir === 1 ? 6 : 0;
      if (!live.current.slow) bedBox.current?.animate?.([{ transform: "translate(0,0)" }, { transform: `translate(${dx}px,${dy}px)` }, { transform: "translate(0,0)" }], { duration: 200, easing: "ease-out" });
      return;
    }
    const now = performance.now();
    stageMove(scene.current, before, next, now);
    setGame(next);
    kick();
    sound.rustle();
    const ev = next.events;
    if (ev & E_MERGE) { const pairs = (next.last?.grown.length ?? 0) + (next.gust?.grown.length ?? 0); for (let i = 0; i < Math.min(pairs, 4); i++) sound.merge(Math.max(0, next.streak - 1) + i, 0.06 + i * 0.07); }
    if (ev & E_PULL) sound.pull();
    if (ev & E_RAIN) sound.rain();
    if (ev & E_HAIL) sound.hail();
    if (ev & E_GUST) sound.gust();
    if (ev & (E_CROW | E_SHOO | E_FLY)) sound.caw();
    if ((next.hailAt && next.hailAt !== before.hailAt) || (next.gustAt && next.gustAt !== before.gustAt)) sound.warn();
    if (ev & E_PEAK) sound.grow(next.peak, 0.12 + (next.gust ? 0.12 : 0));
    const cheer = S.cheerOf(before, next, live.current.bestStage);
    if (cheer) { sfx.levelUp(); if (!live.current.slow) confetti({ colors: CONFETTI }); }
    sync();
    if (next.over) finish(next);
  }

  function undo() {
    const before = gameRef.current;
    if (!S.live(session.current)) return;
    const next = takeBack(before);
    if (!next) return;
    // whatever the undone swipe set off (its chord, its burst, its new-stage line) goes with it
    silenceScheduled();
    settle(scene.current, next, performance.now());
    setGame(next);
    still(); kick();
    sound.back();
    sync();
  }

  function pick(index: number) {
    const before = gameRef.current;
    if (!before.offer || !S.live(session.current)) return;
    const next = pickOffer(before, index);
    if (!next) return;
    const now = performance.now();
    settle(scene.current, next, now);
    for (const cell of next.rained) burst(scene.current, cell, 5, 6, 0.6, 0, 0.5);
    scene.current.end = now + 700;
    setGame(next);
    still(); kick();
    sound.pick();
    if (next.rained.length) sound.rain();
    sync();
    if (next.over) finish(next);
  }

  function stop() {
    const next = stopHere(gameRef.current);
    if (!next || !S.live(session.current)) return;
    setGame(next);
    finish(next);
  }

  // ---- the end of a run: record once, celebrate what's real ----
  function finish(g: Game) {
    if (finished.current === g) return;
    finished.current = g;
    clockOff();
    const r = g.run, level = r.kind === "level", stars = starsOf(g), world = level && r.v === 2 ? worldOf(r.level) : 0;
    const rival = friend && sameRun(friend, r) ? friend : null;
    let line = "", near = "", best = "", big = false;
    if (level) {
      if (g.won && r.v === 2) {
        const first = !levels.stars[r.level];
        levels.record(r.level, stars);
        const opened = openAfter(live.current.open, r.level);
        if (opened !== live.current.open) { live.current.open = opened; setOpen(opened); write(KEYS.open, String(opened)); }
        big = stars === 3 || (first && isFinale(r.level));
        line = first && isFinale(r.level) ? seasonLine(r.level) : stageLine(g.spec.target);
      } else if (g.won) line = stageLine(g.spec.target);
      if (g.won) {
        const short = shortBy(g), max = MODE_INFO[r.mode].maxStars;
        near = short > 0 ? `আর ${bn(short)} চাল কম হলে ${bn(stars + 1)} তারা।` : stars === max && max < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে স্বাভাবিকে খেলো।" : "";
        sound.call(WORLDS[world].call, big, 0.3 + 0.28 * stars);
      } else {
        near = g.top + 1 >= g.spec.target ? `আর একটা ${stageName(g.top)} হলেই ${stageName(g.top + 1)}।` : `${goalText(g.spec.target, g.spec.count)}: দেখো কোথায় জায়গা আটকাল।`;
        line = g.end === "moves" ? `${bn(limitOf(g.spec, r.mode))} চাল শেষ।` : "বেড ভরে গেছে, আর কোনো দিকে সরে না।";
        sound.lose(0.15);
      }
    } else {
      const previous = bestScore;
      const record = submitScore(g.score) && previous !== null;
      submitStage(g.top);
      big = record || gardenStars(g.top) === 3;
      best = record ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(previous!)} পয়েন্ট।` : previous !== null ? `এই ফোনে তোমার সেরা ${bn(Math.max(previous, g.score))} পয়েন্ট।` : "এই ফোনে প্রথম বাগান।";
      near = g.top < TOP ? `আর একটা ${stageName(g.top)} হলেই ${stageName(g.top + 1)}।` : "";
      line = stageLine(g.top);
      if (stars) sound.call(WORLDS[0].call, big, 0.3 + 0.28 * stars); else sound.lose(0.15);
    }
    if (rival) line = compareLine(level ? g.moves.length : g.score, level ? rival.count : rival.score, rival.name, level);
    for (let star = 0; star < stars; star++) sound.star(star, 0.3 + star * 0.28);
    if (big && !live.current.slow) confetti({ colors: CONFETTI });
    const shared = fromGame(g, "");
    setDone({
      shared, line,
      stats: {
        kicker: endKicker(g), why: endWhy(g), won: level ? g.won : stars > 0, stars, maxStars: level ? MODE_INFO[r.mode].maxStars : 3, showStars: !level || g.won,
        top: g.top, moves: g.moves.length, limit: level ? limitOf(g.spec, r.mode) : 0, score: g.score, pairs: g.merges, streak: g.bestStreak,
        undos: g.undosUsed, seconds: Math.round(clockNow() / 1000), weeds: g.pairs, swipe: bestSwipeLine(g), line, near, best,
      },
    });
    show("over");
  }

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); sfx.tap(); }
  const canPick = (level: number) => isLevel(level) && (level <= live.current.open || level === visit);
  const rivalFits = (target: Run) => friend !== null && sameRun(friend, target);
  function start() {
    sfx.tap();
    const target: Run = rivalFits(run) ? run : { ...run, mode };
    if (!read(KEYS.intro) && !friend) { setRun(target); live.current.run = target; show("intro"); return; }
    begin(target);
  }
  function storyDone() { write(KEYS.intro, "1"); begin(live.current.run); }
  /** On the title, ‹ › and the list only choose; playing starts from the plate. */
  function chooseLevel(level: number) {
    if (!canPick(level)) return;
    const target: Run = { v: 2, kind: "level", level, seed: 1, mode };
    const pickFriend = friend && friend.kind === "level" && friend.level === level ? { ...target, v: friend.v, mode: friend.mode } : target;
    if (live.current.screen === "title") { setRun(pickFriend); live.current.run = pickFriend; setGame(createGame(pickFriend)); closeSheet(false); }
    else begin(pickFriend);
  }
  function chooseGarden() {
    const target: Run = friend && friend.kind === "garden" ? { v: friend.v, kind: "garden", level: 0, seed: friend.seed, mode: friend.mode } : { v: 2, kind: "garden", level: 0, seed: newSeed(), mode };
    if (live.current.screen === "title") { setRun(target); live.current.run = target; setGame(createGame(target)); closeSheet(false); }
    else begin(target);
  }
  function again() {
    const current = live.current.run;
    begin(rivalFits(current) ? current : current.kind === "garden" ? { ...current, v: 2, seed: newSeed() } : current);
  }
  function openSheet() { S.pause(session.current); press.current = null; live.current.sheet = true; setSheet(true); sync(); syncClock(); still(); }
  function closeSheet(resume = true) {
    live.current.sheet = false; setSheet(false);
    if (!player.paused) S.resume(session.current, performance.now());
    if (resume) { sync(); syncClock(); kick(); }
  }

  const r = run, levelRun = r.kind === "level";
  const cleared = done !== null && levelRun && game.won;
  const nextLevel = cleared && r.v === 2 && r.level < LEVEL_COUNT && canPick(r.level + 1) ? r.level + 1 : 0;
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের লেভেল", run: () => chooseLevel(nextLevel) }] : []),
    { label: "আবার খেলো", run: again },
    { label: "সব লেভেল", run: openSheet },
  ];

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key, fresh = !event.repeat;
      if (s.paused || live.current.sheet) return;
      const enter = key === "Enter" || key === " ";
      if (screen === "title") { if (enter && fresh) { event.preventDefault(); start(); } return; }
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); if (fresh) player.requestPause(); return; }
        const g = gameRef.current;
        if (g.offer) {
          const digit = /^[1-3]$/.test(key) ? Number(key) - 1 : "১২৩".indexOf(key);
          if (digit >= 0 && digit < g.offer.length) { event.preventDefault(); if (fresh) pick(digit); }
          else if (enter) event.preventDefault();
          return;
        }
        if (key in GAME_KEYS) { event.preventDefault(); if (fresh) swipe(GAME_KEYS[key], event.timeStamp); return; }
        if (key === "u" || key === "U" || key === "z" || key === "Z") { event.preventDefault(); if (fresh) undo(); return; }
        if (enter) event.preventDefault();
        return;
      }
      if (screen === "over") {
        if (S.freshResultKey(s, event)) {
          const index = enter ? 0 : /^[1-3]$/.test(key) ? Number(key) - 1 : "১২৩".indexOf(key);
          if (index >= 0 && choices[index]) { event.preventDefault(); choices[index].run(); }
        } else if (enter || key in GAME_KEYS) event.preventDefault();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // ---- pointer: swipe anywhere on the play area; the move fires once the finger has travelled ----
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || screen !== "play" || (event.target as Element).closest("button")) return;
    if (!S.press(session.current, event.timeStamp)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id || !session.current.pressing) return;
    const dx = event.clientX - held.x, dy = event.clientY - held.y;
    if (Math.hypot(dx, dy) < SWIPE_PX) return;
    press.current = null; S.release(session.current);
    swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 1 : 0), event.timeStamp);
  }
  const onUp = () => { press.current = null; S.release(session.current); };

  // ---- the friend's card on the title ----
  useEffect(() => {
    if (!friend || screen !== "title") return;
    let cancelled = false;
    loadCardFonts("আঁটি থেকে আম রাফির বাগানে পাকা আম ১২৪০ পয়েন্ট").then(() => { if (!cancelled && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site); }).catch(() => {});
    return () => { cancelled = true; };
  }, [friend, screen, site]);

  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior: slow ? "auto" : "smooth" });
    else card?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "start" });
  };

  // ---- what the screen shows ----
  const spec = game.spec, world = levelRun && r.v === 2 ? worldOf(r.level) : 0;
  const finale = levelRun && r.v === 2 ? finaleName(r.level) : "";
  const left = movesLeft(game), limit = limitOf(spec, r.mode);
  const news = S.newsOf(game);
  const edge = game.gustAt && !game.over ? `gust-${GUST_EDGE[game.gustDir]}` : danger(game) ? "danger" : "";
  const nextStage = Math.min(TOP, game.top + 1);
  const rainLeft = spec.rain ? spec.rain - (game.moves.length % spec.rain) : 0;
  const total = totalStars(levels.stars);
  const recommended = startLevel(levels.stars, open);

  return (
    <div className="aa-wrap" ref={wrap}>
      <div className="aa" data-screen={screen} data-world={world} data-slow={slow || undefined} data-finale={finale ? "" : undefined}>
        {screen === "title" && (
          <TitleScreen run={run} mode={mode} friend={friend} friendCanvas={friendCanvas} stars={total} levelStars={levelRun ? levels.stars[r.level] ?? 0 : 0} best={bestScore}
            canBack={levelRun && r.level > 1} canNext={levelRun && canPick(r.level + 1)}
            onStart={start} onMode={setMode} onLevel={chooseLevel} onLevels={openSheet} onGarden={chooseGarden} />
        )}
        {screen === "intro" && <Story onDone={storyDone} />}
        {(screen === "play" || screen === "over") && (
          <div className="aa-play" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}>
            <div className="aa-hud">
              <button type="button" className="aa-badge" onClick={event => { event.currentTarget.blur(); openSheet(); }} aria-haspopup="dialog" aria-label={`${runLabel(r)}, সব লেভেল দেখো`}>
                <b>{levelRun ? (finale ? "শেষ ধাপ" : `লেভেল ${bn(r.level)}`) : "খোলা বাগান"}</b>
                <span>{levelRun ? (r.v === 2 ? levelAt(r.level).name : "পুরোনো লেভেল") : r.mode !== "n" ? MODE_INFO[r.mode].name : `সেরা ${bn(bestScore ?? 0)}`}</span>
              </button>
              {finale ? (
                <div className="aa-boss" aria-label={`${finale}: আর ${bn(left)} চাল`}>
                  <b>{finale}</b>
                  <span className="aa-meter"><i style={{ width: `${Math.round((left / Math.max(1, limit)) * 100)}%` }} /></span>
                </div>
              ) : (
                <div className="aa-goal" aria-label={levelRun ? `লক্ষ্য: ${goalText(spec.target, spec.count)}` : `পরের ধাপ: ${stageName(nextStage)}`}>
                  {plates[levelRun ? spec.target : nextStage] && <img src={plates[levelRun ? spec.target : nextStage]} alt="" />}
                  <span><small>{levelRun ? "লক্ষ্য" : "পরের ধাপ"}</small><b>{stageName(levelRun ? spec.target : nextStage)}{levelRun && spec.count > 1 ? ` ${bn(Math.min(game.made, spec.count))}/${bn(spec.count)}` : ""}</b></span>
                </div>
              )}
              <p className="aa-count" data-low={levelRun && left <= 5 ? "" : undefined} aria-label={levelRun ? `চাল ${bn(game.moves.length)}, সীমা ${bn(limit)}` : `পয়েন্ট ${bn(game.score)}`}>
                {levelRun ? <><b>{bn(game.moves.length)}</b><small>/{bn(limit)} চাল</small></> : <><b key={game.score} className={game.score && !slow ? "aa-bump" : ""}>{bn(game.score)}</b><small>পয়েন্ট</small></>}
              </p>
            </div>
            <ol className="aa-road" aria-label={`ধাপ: ${stageName(game.top)} পর্যন্ত হয়েছে`}>
              {Array.from({ length: TOP }, (_, index) => {
                const stage = index + 1;
                return <li key={stage} data-on={stage <= game.top || undefined} data-next={stage === game.top + 1 || undefined} data-new={stage === news || undefined}
                  data-goal={levelRun && stage === spec.target || undefined} title={stageName(stage)}>{plates[stage] && <img src={plates[stage]} alt="" />}</li>;
              })}
            </ol>
            <div className="aa-bed" ref={bedBox}>
              <div className="aa-frame" data-edge={edge}>
                <canvas ref={canvas} className="aa-canvas" role="img" aria-label={`বাগানের ছক, ${bn(game.size)}×${bn(game.size)}। সবচেয়ে বড় ${stageName(game.top)}। আঙুল টেনে বা নিচের তীর চেপে সরাও।`} />
                {edge.startsWith("gust") && <span className="aa-gust" data-side={GUST_EDGE[game.gustDir]} aria-hidden="true">{GUST_WORD[game.gustDir]}</span>}
              </div>
              {(rainLeft > 0 || game.boost > 0 || game.crowCell >= 0) && screen === "play" && (
                <p className="aa-weather" aria-hidden="true">
                  {rainLeft > 0 && <span data-kind="rain"><svg viewBox="0 0 24 24"><path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.5A3.3 3.3 0 0 1 17 14z" /><path d="M9 17l-1 3M14 17l-1 3" /></svg>{bn(rainLeft)}</span>}
                  {game.boost > 0 && <span data-kind="boost">সার {bn(game.boost)}</span>}
                  {game.crowCell >= 0 && <span data-kind="crow">কাক {bn(game.crowLeft)}</span>}
                </p>
              )}
              {game.streak > 1 && screen === "play" && !slow && !game.offer && <span className="aa-streak" key={game.moves.length} aria-hidden="true">টানা ×{bn(game.streak)}</span>}
              {game.offer && screen === "play" && <OfferSheet game={game} onPick={pick} />}
            </div>
            {screen === "play" && (
              <>
                <p className="aa-status" role="status" aria-live="polite">{news ? <><b>নতুন ধাপ: {stageName(news)}।</b> {stageLine(news)}</> : hintLine(game)}</p>
                <div className="aa-tools">
                  <button type="button" className="aa-tool" onClick={event => { event.currentTarget.blur(); undo(); }} disabled={!game.prev || game.undos <= 0 || !!game.offer}
                    aria-label={`ফেরত নাও, আর ${bn(game.undos)} বার`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 4 10l5 5" /><path d="M4 10h10a6 6 0 0 1 0 12h-3" /></svg><span>ফেরত</span><i>{bn(game.undos)}</i>
                  </button>
                  <div className="aa-pad">
                    {ARROWS.map(arrow => (
                      <button key={arrow.dir} type="button" aria-label={arrow.label} onClick={event => { event.currentTarget.blur(); swipe(arrow.dir, event.timeStamp); }} disabled={!!game.offer}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={arrow.path} /></svg>
                      </button>
                    ))}
                  </div>
                  {levelRun
                    ? <button type="button" className="aa-tool" onClick={event => { event.currentTarget.blur(); again(); }} disabled={!game.moves.length}><span>আবার শুরু</span></button>
                    : <button type="button" className="aa-tool" onClick={event => { event.currentTarget.blur(); stop(); }} disabled={!game.moves.length || !!game.offer}><span>থামো</span></button>}
                </div>
              </>
            )}
            {screen === "over" && done && <EndScreen stats={done.stats} slow={slow} choices={choices} onCard={toCard} />}
          </div>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={levelRun ? r.level : 0} recommended={recommended} best={bestScore}
          onPick={level => { if (canPick(level)) chooseLevel(level); }} onGarden={chooseGarden} onClose={() => closeSheet(true)} />}
      </div>
      {screen === "over" && done?.shared && <ResultCard result={done.shared} site={site} line={done.line} />}
    </div>
  );
}

