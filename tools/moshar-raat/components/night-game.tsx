"use client";
// IP: what we avoided — no real mosquito-bat, coil or repellent brand, logo, packaging or ad jingle, and no whack-a-mole game's
// look; ours is an unbranded yellow-and-blue bat in a dark Bangladeshi bedroom (খাট, কাঁথা, ঘুলঘুলি, হারিকেন) with round
// cartoon mosquitoes that turn into grey specks, never anything gory.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, newSeed, sfx, shake, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { parseShared, sharedHash, type Shared } from "../lib/challenge";
import { drawScene } from "../lib/draw.hot";
import { createGame, gameStars, starsOf, toDawn, FLY, ON, WON, type Game } from "../lib/game";
import { countOf, heartsOf, isFinale, levelOf, needZaps, DEFAULT_MODE, LEVEL_COUNT, MODES, WORLDS } from "../lib/levels";
import {
  bn, caption, clearLine, compareLine, heading as headingOf, humanLine, levelLabel, levelTitle, lossLine, nearMissLine, tallyLine,
} from "../lib/lines";
import { afterClear, playable as canPlayLevel, readMode, readUnlock, recommended, INTRO_KEY, MODE_KEY, TOOL, UNLOCK_KEY } from "../lib/progress";
import { H, W } from "../lib/room";
import { bindGame, makeScene, readEvents, showSwing, tickScene, type Scene } from "../lib/scene";
import {
  again as sessionAgain, away, back, canSwing, cheerMayPlay, choiceOk, createSession, finish as sessionFinish, loopStep, moving, pause as sessionPause,
  pick as sessionPick, reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, type Phase,
} from "../lib/session";
import { stepGame, swing } from "../lib/step.hot";
import { Finish, type Choice, type Stat } from "./finish";
import { LIST_KEYS, NightList } from "./night-list";
import { makeDrone, makeWhine, sound } from "./sound";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

/** ধীরে খেলো runs the whole night at this speed. */
const SLOW_TIME = 0.7;
/** The aim ring's speed under held arrows, units a second. */
const AIM_SPEED = 300;
/** The whine is heard from this far from the pillow. */
const HEAR = 320;

type Result = {
  level: number; seed: number; mode: number; run: number; at: number; won: boolean; stars: number; zaps: number; bites: number; count: number; hearts: number;
  bestCombo: number; bestMulti: number; slaps: number; secondsLeft: number; bossLeft: boolean; firstClear: boolean; improved: boolean; best: number | null;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const bestKey = (level: number) => `ektukhani-best-${TOOL}-${level}`;
const readBest = (level: number) => { const raw = read(bestKey(level)), value = Number(raw); return raw !== null && Number.isFinite(value) ? value : null; };

export function NightGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow] = useSlowMode();
  const [session] = useState(createSession);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [level, setLevel] = useState(1);
  const [unlock, setUnlock] = useState(1);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [booted, setBooted] = useState(false);
  const [storySeen, setStorySeen] = useState(true);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);

  const play = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const seed = useRef(1);
  const timers = useRef<number[]>([]);
  const whine = useRef<ReturnType<typeof makeWhine> | null>(null);
  const drone = useRef<ReturnType<typeof makeDrone> | null>(null);
  const loops = useRef({ whine: false, drone: false, tick: 0 });
  const keys = useRef({ left: false, right: false, up: false, down: false });
  const listPaused = useRef(false);
  const demoing = useRef(false);
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ level, unlock, mode, friend, result, slow, stars: levels.stars });
  now.current = { level, unlock, mode, friend, result, slow, stars: levels.stars };

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopWhine = () => { whine.current?.stop(); whine.current = null; loops.current.whine = false; };
  const stopDrone = () => { drone.current?.stop(); drone.current = null; loops.current.drone = false; };
  const stopLoops = () => { stopWhine(); stopDrone(); };
  const stopInput = () => { Object.assign(keys.current, { left: false, right: false, up: false, down: false }); };
  const friendFits = (to: number) => Boolean(now.current.friend) && now.current.friend!.level === to;
  const playableLevel = (to: number) => canPlayLevel(to, now.current.unlock, now.current.stars, now.current.friend?.level);
  // Dev only: lets the Orca autopilot read the night (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __mr: unknown }).__mr = { session, game, scene, loops, run: (steps: number) => { for (let i = 0; i < steps; i++) stepRef.current(1 / 60); drawRef.current(); } }; }, []);

  // ---- choosing a night: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: number, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    stopLoops();
    stopInput();
    sessionReset(session);
    listPaused.current = false;
    demoing.current = false;
    seed.current = nextSeed;
    now.current.level = to;
    setLevel(to);
    game.current = null;
    if (scene.current) bindGame(scene.current, null);
    setResult(null);
    sync();
  }
  const home = () => { const f = now.current.friend; load(f ? f.level : recommended(now.current.unlock, now.current.stars)); };

  function newRun() {
    clearTimers();
    const made = createGame(now.current.level, seed.current, heartsOf(now.current.mode));
    game.current = made;
    if (scene.current) bindGame(scene.current, made);
    stopInput();
    setResult(null);
  }
  /** রাত শুরু, Enter or a tap: a fresh run of the night on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !storySeen && !now.current.friend && now.current.level === 1;
    if (!sessionStart(session, firstStory, performance.now())) return false;
    newRun();
    if (!firstStory) sound.start(levelOf(now.current.level).world);
    sync();
    return true;
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    setStorySeen(true);
    write(INTRO_KEY, "1");
    sound.start(levelOf(now.current.level).world);
    sync();
  }

  function pause() { stopInput(); stopLoops(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) sync(); }
  function openList() {
    if (session.phase === "playing" || session.phase === "story") { listPaused.current = true; stopInput(); stopLoops(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the night; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this রাত from its title.
  const player = useGamePlayer({ onPause: () => pause(), onResume: () => resume(), onRestart: () => load(now.current.level) });
  const inPlayer = player.stage.width > 0;

  // ---- the end of a night ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopLoops();
    stopInput();
    const won = played.over === WON, stars = gameStars(played), nightLevel = played.level;
    const before = now.current.stars[nightLevel] ?? 0, firstClear = won && !before;
    const bestBefore = readBest(nightLevel);
    let improved = false, best = false;
    if (won) {
      improved = levels.record(nightLevel, stars) && before > 0;
      const opened = afterClear(now.current.unlock, nightLevel);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
      if (bestBefore === null || played.zaps > bestBefore) { write(bestKey(nightLevel), String(played.zaps)); best = bestBefore !== null; }
    }
    const boss = played.boss, bossLeft = boss >= 0 && played.state[boss] === FLY && played.dawnHeld;
    const done: Result = {
      level: nightLevel, seed: played.seed, mode: now.current.mode, run: session.run, at, won, stars, zaps: played.zaps, bites: played.bites, count: played.count, hearts: played.hearts,
      bestCombo: played.bestCombo, bestMulti: played.bestMulti, slaps: played.slaps, secondsLeft: toDawn(played), bossLeft, firstClear, improved, best: best ? played.zaps : null,
    };
    now.current.result = done;
    setResult(done);
    sync();
    if (won) sound.dawn();
    // Confetti only for three stars, a finale's first clear or a new record; a plain clear gets the stars' own notes.
    const run = session.run, party = won && (stars === 3 || (firstClear && isFinale(nightLevel)) || improved);
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { sfx.levelUp(); if (!now.current.slow) confetti({ colors: ["#ffd166", "#f2c230", "#96d7ff", "#ffffff", "#e0443e"] }); }
      else if (!won) sfx.lose();
    }, won ? 1000 : 300);
  }

  /** Sounds and shakes for what the night did on its own: bites. (A swing's own sounds play in swingAt, at once.) */
  function listen(played: Game) {
    const view = scene.current;
    if (!view) return;
    const mask = readEvents(view, played, now.current.slow);
    if (mask & 2) { sound.bite(); shake(play.current); }
  }

  /** The sound loops follow the night every step: the whine while a mosquito flies, the drone while the boss does. */
  function steerLoops(played: Game | null, live: boolean) {
    const on = soundOn(), state = loops.current;
    const wantWhine = live && played !== null && played.near >= 0;
    const boss = played ? played.boss : -1, wantDrone = live && played !== null && boss >= 0 && played.state[boss] === FLY;
    const moveW = loopStep(state.whine, wantWhine, on);
    if (moveW === "start") { stopWhine(); whine.current = makeWhine(); state.whine = true; } else if (moveW === "stop") stopWhine();
    const moveD = loopStep(state.drone, wantDrone, on);
    if (moveD === "start") { stopDrone(); drone.current = makeDrone(); state.drone = true; } else if (moveD === "stop") stopDrone();
    if (!played || ++state.tick % 4) return;
    const flutter = Math.sin((scene.current?.clock ?? 0) * 9);
    whine.current?.set(played.near < 0 ? 0 : Math.max(0, 1 - played.nearD / HEAR), flutter);
    if (boss >= 0) drone.current?.set(Math.max(0.25, 1 - Math.hypot(played.x[boss] - played.tx[boss], played.y[boss] - played.ty[boss]) / HEAR), flutter);
  }

  const step = (dt: number) => {
    const at = performance.now(), played = game.current, view = scene.current, calm = now.current.slow;
    if (view) tickScene(view, dt);
    const live = played !== null && played.over === ON && moving(session, at);
    if (live && played && view) {
      const k = keys.current, dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      if (dx || dy) {
        view.aimOn = true;
        view.aimX = Math.min(W - 10, Math.max(10, view.aimX + dx * AIM_SPEED * dt));
        view.aimY = Math.min(H - 20, Math.max(40, view.aimY + dy * AIM_SPEED * dt));
      }
      stepGame(played, dt * (calm ? SLOW_TIME : 1));
      listen(played);
      if (played.over !== ON) finishRun(played);
    }
    steerLoops(played, live && played?.over === ON);
  };
  const draw = () => {
    const view = scene.current;
    if (!view) return;
    const showing = session.phase === "title" ? null : game.current;
    drawScene(view, showing, now.current.slow, session.phase !== "story" && session.phase !== "title");
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;
  // The room breathes on every screen but the pause and the list (the pops after the last swing finish behind the card).
  useGameLoop(step, draw, phase !== "paused" && !picking);

  // ---- one swing, answered in the same event: the sim, the sounds and a drawn frame, before the next animation frame ----
  function swingAt(x: number, y: number) {
    const played = game.current, view = scene.current;
    if (!played || !view || !canSwing(session) || played.over !== ON) return;
    const hits = swing(played, x, y);
    showSwing(view, x, y, hits);
    const mask = readEvents(view, played, now.current.slow);
    if (mask & 16) sound.bossDown();
    else if (mask & 8) sound.bossHit();
    else if (hits) sound.zap(hits, played.combo);
    else if (mask & 4) { sound.slap(); shake(play.current); }
    else sound.swish();
    drawRef.current();
    if (played.over !== ON) finishRun(played);
  }

  // ---- the canvas: rebuilt for its size and the night's world and মশারি ----
  useEffect(() => {
    const element = play.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width), height = Math.round(entry.contentRect.height);
      setSize(current => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const row = levelOf(level), world = row.world, holes = row.net.join(",");
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    scene.current = makeScene(element, size.width, size.height, world, levelOf(now.current.level).net, scene.current);
    bindGame(scene.current, session.phase === "title" ? null : game.current);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("চট! উঁহু ঠাস পিন-পিন একটুর জন্য টানা মশা ০১২৩৪৫৬৭৮৯ পালোয়ান বিজলি ভূতুড়ে রাজা কাত চাপ").then(() => { if (!cancelled) drawRef.current(); }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, world, holes]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), the mode, the story flag, then a friend's night or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars);
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    setStorySeen(read(INTRO_KEY) === "1");
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-night stops it: its title shows.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      if (!shared.old) { setMode(shared.mode); now.current.mode = shared.mode; }
      load(shared.level, shared.seed);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
      return true;
    };
    if (!fromHash()) load(recommended(mine, levels.stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  /** Preview images only (`&og=1` on a link): the friend's night on its card, without playing. Saves nothing on the phone. */
  function demo(found: Shared) {
    demoing.current = true;
    session.phase = "over"; session.overAt = performance.now();
    const stars = starsOf(found.level, found.zaps, found.bites);
    setResult({
      level: found.level, seed: found.seed, mode: found.mode, run: session.run, at: session.overAt, won: true, stars, zaps: found.zaps, bites: found.bites, count: countOf(found.level),
      hearts: heartsOf(found.mode), bestCombo: 0, bestMulti: 0, slaps: 0, secondsLeft: 0, bossLeft: false, firstClear: false, improved: false, best: null,
    });
    setName(found.name);
    sync();
  }

  // ---- away: blur and a hidden tab pause the night and let go of every key (the player does this too) ----
  useEffect(() => {
    const blur = () => { stopInput(); away(session, "blur"); stopLoops(); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { stopInput(); away(session, "hide"); stopLoops(); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      stopLoops();
    };
  }, []);

  // ---- the end screen's choices ----
  const nextLevel = result && result.won && level < LEVEL_COUNT && playableLevel(level + 1) ? level + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (!sessionAgain(session, performance.now(), key)) return;
    seed.current = friendFits(now.current.level) ? now.current.friend!.seed : newSeed();
    newRun();
    sound.start(levelOf(now.current.level).world);
    sync();
  }
  const guarded = (run: () => void, key?: { at: number; repeat: boolean }) => { if (choiceOk(session, performance.now(), key)) run(); };
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের রাত", run: () => guarded(() => load(nextLevel)) }] : []),
    { label: "আবার খেলো", run: () => again() },
    { label: "সব রাত", run: () => guarded(openList) },
  ];
  function takeChoice(index: number, key: { at: number; repeat: boolean }) {
    if (index >= choices.length) return;
    if (choices[index].label === "আবার খেলো") again(key);
    else guarded(choices[index].label === "পরের রাত" ? () => load(nextLevel) : openList, key);
  }

  // ---- keys, at the window: arrows aim; Space or Enter swings, starts, and takes the end screen's first choice (fresh presses only); P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const arrow = key === "ArrowLeft" || key === "a" ? "left" : key === "ArrowRight" || key === "d" ? "right" : key === "ArrowUp" || key === "w" ? "up" : key === "ArrowDown" || key === "s" ? "down" : null;
    if (event.type === "keyup") { if (arrow) keys.current[arrow] = false; return; }
    if (player.paused) return;
    back(session, "focus"); // a key that reaches the page means the window has focus
    const enter = key === "Enter" || key === " ", fresh = !event.repeat;
    if (session.picking) {
      const index = LIST_KEYS.indexOf(key as typeof LIST_KEYS[number]);
      if (index >= 0 && fresh && playableLevel(index + 1)) { event.preventDefault(); load(index + 1); }
      return;
    }
    // A button reached with Tab below the room (the share bar) does its own job.
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".mr-play")) return;
    switch (session.phase) {
      case "title":
        if (enter && fresh) { event.preventDefault(); begin(); }
        return;
      case "story":
        if (enter) { event.preventDefault(); if (fresh) endStory(); }
        return;
      case "paused":
        if (enter) { event.preventDefault(); if (fresh) resume(); }
        return;
      case "over": {
        const index = enter ? 0 : ["1", "2", "3"].indexOf(key);
        if (index >= 0) { event.preventDefault(); if (fresh) takeChoice(index, { at: event.timeStamp, repeat: event.repeat }); }
        return;
      }
      default:
        if (arrow) { event.preventDefault(); keys.current[arrow] = true; if (scene.current) scene.current.aimOn = true; }
        else if (enter) { event.preventDefault(); if (fresh && scene.current) { scene.current.aimOn = true; swingAt(scene.current.aimX, scene.current.aimY); } }
        else if (key === "p" && fresh) { event.preventDefault(); if (inPlayer) player.requestPause(); else pause(); }
    }
  };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", handle);
    window.addEventListener("keyup", handle);
    return () => { window.removeEventListener("keydown", handle); window.removeEventListener("keyup", handle); };
  }, []);

  // ---- touch and mouse on the room: the swing happens in pointerdown itself ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .mr-start, .mr-finish, .mr-sheet, .mr-story, .mr-cover")) return;
    if (event.button > 0 || !event.isPrimary || session.picking) return;
    back(session, "focus"); // a tap on the room means the window has focus
    // The tap that brings you back only resumes; it never swings.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase !== "playing") return;
    const view = scene.current, rect = event.currentTarget.getBoundingClientRect();
    if (!view) return;
    view.aimOn = false;
    swingAt((event.clientX - rect.left - view.ox) / view.s, (event.clientY - rect.top - view.oy) / view.s);
  }
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- cards ----
  const card: Shared | null = result && result.won ? { level: result.level, seed: result.seed, zaps: result.zaps, bites: result.bites, name: cleanName(name), mode: result.mode, old: false } : null;
  const state = card ? sharedHash(card) : "";
  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    loadCardFonts(`মশার রাত ${levelTitle(card.level)} ${card.name || "রাফি"} ০১২৩৪৫৬৭৮৯ ${humanLine(card)} ${tallyLine(card)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws.
  }, [state, format, site]);
  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the screens say ----
  const friendHere = Boolean(friend) && friend!.level === level;
  const rival = friend && !friend.old && friendHere && result && result.seed === friend.seed ? friend : null;
  const versus = result && result.won && rival ? compareLine(result, rival, rival.name) : "";
  const note = !result ? "" : !result.won ? lossLine(result.level, result.secondsLeft, result.slaps, result.bossLeft)
    : result.improved ? `এই রাতে নতুন রেকর্ড, ${bn(result.stars)} তারা!` : result.best !== null ? `এই রাতে তোমার সবচেয়ে বেশি, ${bn(result.best)}টা!` : nearMissLine(result.level, result.zaps, result.bites);
  const stats: Stat[] = result ? [
    { label: "মশা", value: result.zaps, of: result.count },
    { label: "কামড়", value: result.bites, of: result.hearts },
    { label: "টানা সেরা", value: result.bestCombo },
    { label: "এক চাপে সেরা", value: result.bestMulti },
  ] : [];
  const badge = `${levelLabel(level)} · ${row.name}`;

  return (
    <div className="mr" data-phase={phase} data-look={WORLDS[world].look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="mr-play" onPointerDown={onPointerDown}>
        <canvas ref={canvas} role="img" aria-label={`বাতি নেভানো ঘর, খাটে ${row.net.length ? "মশারির ভেতরে " : ""}ছোট ভাই ঘুমাচ্ছে। মশার ওপর চাপলে ব্যাট নামবে। কিবোর্ডে তীর দিয়ে হলুদ গোলটা সরাও, Space চাপলে ব্যাট।`} />

        {(phase === "playing" || phase === "paused") && (
          <button type="button" className="mr-badge" onClick={event => { event.currentTarget.blur(); openList(); }} aria-haspopup="dialog" aria-label={`${badge}, সব রাত দেখো`}>
            <i aria-hidden="true" />{levelLabel(level)}
          </button>
        )}

        {phase === "title" && booted && (
          <TitleScreen level={level} stars={levels.stars[level] ?? 0} canPrev={level > 1 && playableLevel(level - 1)} canNext={level < LEVEL_COUNT && playableLevel(level + 1)}
            mode={mode} need={needZaps(level)} count={countOf(level)} friend={friend} friendHere={friendHere}
            onStart={() => { begin(); }} onPrev={() => load(level - 1)} onNext={() => load(level + 1)}
            onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, String(next)); sfx.tap(); }}
            onList={openList} onHome={home} />
        )}

        {phase === "story" && <Story onDone={endStory} />}

        {phase === "paused" && !player.paused && !picking && (
          <div className="mr-cover">
            <p>থেমে আছে। মশারাও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={event => { event.currentTarget.blur(); resume(); }}>চালিয়ে যাও</button>
          </div>
        )}

        {phase === "over" && result && (
          <Finish countKey={result.run} kicker={levelTitle(result.level)} won={result.won} stars={result.stars} stats={stats} slow={slow}
            heading={headingOf({ level: result.level, won: result.won, firstClear: result.firstClear, hearts: result.hearts })}
            line={result.won ? clearLine(result.level) : rival ? `${rival.name || "বন্ধু"} এই রাতে ${bn(rival.zaps)}টা মশা মেরেছিল।` : `${bn(result.zaps)}টা মশা ব্যাটে পড়েছিল।`}
            note={note} versus={versus} choices={choices} onSeeCard={card ? seeCard : null} />
        )}

        {picking && (
          <NightList stars={levels.stars} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)}
            onPick={to => load(to)} onClose={closeList} />
        )}
        <p className="mr-sr" aria-live="polite">{phase === "over" && result ? `${headingOf({ level: result.level, won: result.won, firstClear: result.firstClear, hearts: result.hearts })}। ${bn(result.zaps)}টা মশা। ${result.won ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
      </div>

      <section className="mr-result" id="result" ref={resultBox} aria-labelledby="mr-result-title">
        <h2 id="mr-result-title">{card ? <><em>{bn(card.zaps)}টা মশা</em> তোমার ব্যাটে</> : "ভোর হলে তোমার কার্ড"}</h2>
        <p>{card ? `${levelTitle(card.level)} · ${versus || humanLine(card)}` : `ভোর পর্যন্ত টিকলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই রাত, একই মশা পাবে। মোট ★ ${bn(totalStars(levels.stars))}/${bn(LEVEL_COUNT * 3)}`}</p>
        {card && (
          <div className="mr-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`মশার রাতের কার্ড: ${levelTitle(card.level)}, ${tallyLine(card)}।`} />
              {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="mr-share">
              <label className="mr-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`moshar-raat-${card.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint="বন্ধু লিংক খুললে একই রাত, একই মশা পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

