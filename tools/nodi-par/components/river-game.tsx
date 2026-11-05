"use client";
// IP: what we avoided — no famous lane-hopping game's name, animal hero, cars, road, voxel/blocky 3D look or sounds; ours is a school kid with a bag and a গামছা
// on a gently top-down Bangladeshi river (নৌকা, ভেলা, কচুরিপানা, a ferry and its wake, brick ghats with a bell), drawn from scratch, with our own rules:
// a fall is a splash and a quick restart from the last bank.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, readLevels, sfx, shake, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, settleCamera, tickScene } from "../lib/draw.hot";
import { isFinale, riverName, DEFAULT_MODE, LEVEL_COUNT, WORLDS, worldOf } from "../lib/levels";
import { makeScene, markRespawn, popup, resetHud, ringBell, type Scene } from "../lib/paint";
import { afterClear, bestKey, playable as canPlayLevel, readMode, readUnlock, recommended, INTRO_KEY, LEVELS_KEY, MODE_KEY, TOOL, UNLOCK_KEY } from "../lib/progress";
import { bn, caption, compareLine, detailLine, heading as headingOf, humanLine, nearLine, parseShareHash, secs, shareHash, worldLine, PLACES, type Shared } from "../lib/result";
import {
  ARRIVED, BLOCKED, DANGER, DOWN, FERRY_IN, HOPPED, LEFT, MANGO, NEAR, RESPAWNED, RIGHT, SPLASHED, UP, WATER, floaterAt, makeRiver, starsOf, target, tenths as toTenths,
} from "../lib/river";
import { createRun, type Run } from "../lib/run";
import {
  again as sessionAgain, away, back, canHop, cheerMayPlay, choiceOk, createSession, finish as sessionFinish, loopStep, moving, pause as sessionPause,
  pick as sessionPick, reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, type Phase,
} from "../lib/session";
import { act, drain, stepRun } from "../lib/step.hot";
import { Finish, type Choice, type Stat } from "./finish";
import { RiverList } from "./river-list";
import { makeWater, sound } from "./sound";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

/** ধীরে খেলো runs the whole river (and its clock) at this speed, so times and stars read the same; the slower river buys reaction time. */
const SLOW_TIME = 0.6;
/** A finger that has moved this far within SWIPE_WAIT ms of touching down is a swipe, not a tap. */
const SWIPE_PX = 12, SWIPE_WAIT = 40;

type Result = {
  level: number; seed: number; mode: number; run: number; at: number; tenths: number; mangoes: number; splashes: number; hops: number; bestChain: number;
  stars: number; firstClear: boolean; improved: boolean; record: boolean; previousBest: number | null;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const readBest = (level: number) => { const raw = read(bestKey(level)), value = Number(raw); return raw !== null && raw !== "" && Number.isFinite(value) ? value : null; };

export function RiverGame() {
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
  const [bests, setBests] = useState<Record<number, number>>({});

  const view = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const run = useRef<Run | null>(null);
  const timers = useRef<number[]>([]);
  const water = useRef<ReturnType<typeof makeWater> | null>(null);
  const loops = useRef({ water: false, volume: -1 });
  const hornAt = useRef(-9);
  const listPaused = useRef(false);
  const demoing = useRef(false);
  const touch = useRef<{ id: number; x: number; y: number; acted: boolean; timer: number } | null>(null);
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ level, unlock, mode, friend, result, slow, stars: levels.stars });
  now.current = { level, unlock, mode, friend, result, slow, stars: levels.stars };

  const river = useMemo(() => makeRiver(level), [level]);
  const riverRef = useRef(river);
  riverRef.current = river;

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const dropTouch = () => { const t = touch.current; if (t) window.clearTimeout(t.timer); touch.current = null; };
  const stopWater = () => { water.current?.stop(); water.current = null; loops.current.water = false; loops.current.volume = -1; };
  const friendFits = (to: number) => Boolean(now.current.friend) && now.current.friend!.level === to;
  const playableLevel = (to: number) => canPlayLevel(to, now.current.unlock, now.current.stars, now.current.friend?.level);
  // Dev only: lets the Orca autopilot read the crossing (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __np: unknown }).__np = { session, run, scene, loops, now, input: (action: number) => inputRef.current(action), sim: { floaterAt, target }, steps: (count: number) => { for (let i = 0; i < count; i++) stepRef.current(1 / 60); drawRef.current(); } }; }, []);

  // ---- choosing a river: always back to its title ----
  function load(to: number) {
    clearTimers();
    dropTouch();
    stopWater();
    sessionReset(session);
    listPaused.current = false;
    demoing.current = false;
    now.current.level = to;
    riverRef.current = makeRiver(to);
    setLevel(to);
    run.current = null;
    if (scene.current) settleCamera(scene.current, 0);
    setResult(null);
    sync();
  }
  const home = () => { const f = now.current.friend; load(f ? f.level : recommended(now.current.unlock, now.current.stars)); };

  function newRun() {
    clearTimers();
    dropTouch();
    run.current = createRun(riverRef.current, now.current.mode);
    hornAt.current = -9;
    if (scene.current) settleCamera(scene.current, 0);
    setResult(null);
  }
  /** লাফ দাও, Enter or Space: a fresh crossing of the river on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !storySeen && !now.current.friend && now.current.level === 1;
    if (!sessionStart(session, firstStory, performance.now())) return false;
    newRun();
    if (!firstStory) sound.start(worldOf(now.current.level));
    sync();
    return true;
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    setStorySeen(true);
    write(INTRO_KEY, "1");
    sound.start(worldOf(now.current.level));
    sync();
  }

  function pause() { stopWater(); dropTouch(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) sync(); }
  function openBests() {
    const found: Record<number, number> = {};
    for (let each = 1; each <= LEVEL_COUNT; each++) { const best = readBest(each); if (best !== null) found[each] = best; }
    setBests(found);
  }
  function openList() {
    if (session.phase === "playing" || session.phase === "story") { listPaused.current = true; stopWater(); dropTouch(); }
    openBests();
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the river; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this river from its title;
  // সব লেভেল opens our own list (which pauses again).
  const player = useGamePlayer({ onPause: () => pause(), onResume: () => resume(), onRestart: () => load(now.current.level), onLevels: () => openList() });
  const inPlayer = player.stage.width > 0;

  // ---- the end of a crossing ----
  function finishRun(played: Run) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopWater();
    // The result belongs to the river that was crossed, whatever the page shows by now (a friend's link can arrive mid-crossing).
    const crossed = played.river.level, time = toTenths(played.time), stars = starsOf(played.river, time / 10, played.got);
    const before = now.current.stars[crossed] ?? 0, firstClear = !before;
    const previousBest = readBest(crossed);
    // Recorded at the moment the crossing ends, never inside a timer a quick tap could cancel.
    const improved = levels.record(crossed, stars) && before > 0;
    const opened = afterClear(now.current.unlock, crossed);
    if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
    const record = previousBest !== null && time < previousBest;
    if (previousBest === null || time < previousBest) write(bestKey(crossed), String(time));
    const done: Result = {
      level: crossed, seed: played.river.seed, mode: played.mode, run: session.run, at, tenths: time, mangoes: played.got, splashes: played.splashes, hops: played.hops,
      bestChain: played.bestChain, stars, firstClear, improved, record, previousBest,
    };
    now.current.result = done;
    setResult(done);
    sync();
    // The big cheer is for three stars, a finale's first clear or a new best; a plain clear gets the stars' own notes.
    const id = session.run, party = stars === 3 || record || (firstClear && isFinale(crossed));
    later(() => {
      if (!cheerMayPlay(session, id)) return;
      if (party) { sfx.win(); if (!now.current.slow) confetti({ colors: ["#ffd84a", "#7fd1c4", "#fff6dc", "#1f6f78", "#f3a33b"] }); } else sfx.good();
    }, 320 + 260 * (stars + 1)); // after the card's own wait (the bell is seen first)
  }

  /** Turns what happened in the river into sound, a little motion and small words. */
  function react(events: number, played: Run) {
    const scene0 = scene.current, calm = now.current.slow;
    if (events & HOPPED) sound.hop(played.falling ? 1 : played.surface, played.chain);
    if (events & BLOCKED) sound.blocked();
    if (events & MANGO) { sound.mango(); if (scene0) popup(scene0, "+১", played.x, played.row, "#ffd84a"); }
    if (events & SPLASHED) {
      sound.splash(calm);
      if (!calm) shake(play.current);
      if (scene0) popup(scene0, events & NEAR ? "একটুর জন্য" : "ছপাৎ!", played.splashX, played.splashRow);
    }
    if (events & RESPAWNED) { sound.back(); if (scene0) markRespawn(scene0); }
    if (events & FERRY_IN && played.t - hornAt.current > 3) { hornAt.current = played.t; sound.horn(); }
    if (events & DANGER) sound.danger();
    if (events & ARRIVED) { sound.bell(); if (scene0) ringBell(scene0); }
  }

  /** The water follows the current under the boy: on while a crossing is live, louder on fast water; it comes back after sound is turned off and on. */
  function steerWater(played: Run | null, live: boolean) {
    const state = loops.current, wanted = live && played !== null && !played.done, step = loopStep(state.water, wanted, soundOn());
    if (step === "start") { stopWater(); water.current = makeWater(); state.water = true; } else if (step === "stop") stopWater();
    if (!wanted || !played || !water.current) return;
    const lane = played.river.lanes[played.row], isWater = lane.type === WATER;
    const volume = played.down > 0 ? 0.2 : isWater ? 0.32 + (played.river.rain ? 0.1 : 0) : 0.12;
    if (Math.abs(volume - state.volume) > 0.01) { state.volume = volume; water.current.set(volume, isWater ? 360 + lane.speed * 240 : 320); }
  }

  const step = (dt: number) => {
    const at = performance.now(), played = run.current, view0 = scene.current;
    const live = played !== null && !played.done && moving(session, at);
    if (view0) tickScene(view0, dt * (now.current.slow ? SLOW_TIME : 1), session.phase === "title" ? null : played);
    if (live && played) {
      stepRun(played, dt * (now.current.slow ? SLOW_TIME : 1));
      react(drain(played), played);
      if (played.done) finishRun(played);
    }
    steerWater(played, live);
  };
  const draw = () => {
    const view0 = scene.current;
    if (view0) drawScene(view0, session.phase === "title" || session.phase === "story" ? null : run.current, now.current.slow, session.phase === "playing" || session.phase === "paused");
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;
  // The river flows on every screen but the pause and the list (the pops after the last hop finish behind the card).
  useGameLoop(step, draw, phase !== "paused" && !picking);

  // ---- one hop, answered in the same event: the sim, the sound and a drawn frame, before the next animation frame ----
  function input(action: number) {
    const played = run.current;
    if (!played || !canHop(session) || played.done) return;
    act(played, action);
    react(drain(played), played);
    drawRef.current();
  }
  const inputRef = useRef(input);
  inputRef.current = input;

  // ---- the canvas: rebuilt for the stage's size and the river ----
  useEffect(() => {
    const element = view.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width), height = Math.round(entry.contentRect.height);
      setSize(current => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    scene.current = makeScene(element, size.width, size.height, river, scene.current);
    settleCamera(scene.current, run.current && run.current.river === river ? run.current.row : 0);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("নদী পার আম সে ০১২৩৪৫৬৭৮৯ ছপাৎ একটুর জন্য টানা +১ খালের মোড় ফেরিঘাটের ঢেউ নানুবাড়ির ঘাট").then(() => {
      if (cancelled || !scene.current) return;
      resetHud(scene.current); // the pills were measured in the fallback font
      drawRef.current();
    }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, river]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), the mode, the story flag, then a friend's river or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const stars = readLevels(read(LEVELS_KEY), LEVEL_COUNT);
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), stars);
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine; now.current.stars = stars;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    setStorySeen(read(INTRO_KEY) === "1");
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-crossing stops it: its title shows.
    const fromHash = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      load(shared.level);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
      return true;
    };
    if (!fromHash()) load(recommended(mine, stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  /** Preview images only (`&og=1` on a link): the friend's crossing on its card, without playing. Saves nothing on the phone. */
  function demo(found: Shared) {
    demoing.current = true;
    session.phase = "over"; session.overAt = performance.now();
    setResult({
      level: found.level, seed: found.seed, mode: found.mode, run: session.run, at: session.overAt, tenths: found.tenths, mangoes: found.mangoes, splashes: found.splashes, hops: 0,
      bestChain: 0, stars: starsOf(makeRiver(found.level), found.tenths / 10, found.mangoes), firstClear: false, improved: false, record: false, previousBest: null,
    });
    setName(found.name);
    sync();
  }

  // ---- away: blur and a hidden tab pause the crossing (the player does this too), and drop a drag in flight ----
  useEffect(() => {
    const blur = () => { away(session, "blur"); stopWater(); dropTouch(); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { away(session, "hide"); stopWater(); dropTouch(); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      dropTouch();
      stopWater();
    };
  }, []);

  // ---- the end screen's choices ----
  const nextLevel = result && level < LEVEL_COUNT && playableLevel(level + 1) ? level + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (!sessionAgain(session, performance.now(), key)) return;
    newRun();
    sound.start(worldOf(now.current.level));
    sync();
  }
  const guarded = (go: () => void, key?: { at: number; repeat: boolean }) => { if (choiceOk(session, performance.now(), key)) go(); };
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের নদী", run: () => guarded(() => load(nextLevel)) }] : []),
    { label: "আবার খেলো", run: () => again() },
    { label: "সব নদী", run: () => guarded(openList) },
  ];
  function takeChoice(index: number, key: { at: number; repeat: boolean }) {
    if (index >= choices.length) return;
    if (choices[index].label === "আবার খেলো") again(key);
    else guarded(choices[index].label === "পরের নদী" ? () => load(nextLevel) : openList, key);
  }

  // ---- keys, at the window: arrows and WASD hop; Space or Enter hops forward, starts, and takes the end screen's first choice (fresh presses only); P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.type !== "keydown" || event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (player.paused || session.picking) return;
    back(session, "focus"); // a key that reaches the page means the window has focus
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const action = key === "ArrowUp" || key === "w" ? UP : key === "ArrowDown" || key === "s" ? DOWN : key === "ArrowLeft" || key === "a" ? LEFT : key === "ArrowRight" || key === "d" ? RIGHT : 0;
    const enter = key === "Enter" || key === " ", fresh = !event.repeat;
    // A button reached with Tab below the river (the share bar) does its own job.
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".np-play")) return;
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
        if (action) { event.preventDefault(); if (fresh) input(action); }
        else if (enter) { event.preventDefault(); if (fresh) input(UP); }
        else if (key === "p" && fresh) { event.preventDefault(); if (inPlayer) player.requestPause(); else pause(); }
    }
  };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  // ---- touch and mouse on the river: a tap hops forward in pointerdown itself; a finger already moving within 40 ms is a swipe ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .np-start, .np-finish, .np-sheet, .np-story, .np-cover")) return;
    if (event.button > 0 || !event.isPrimary || session.picking) return;
    // The tap that brings you back only resumes; it never hops. (Any press on the page already told the session the window has focus.)
    if (session.phase === "paused") { resume(); return; }
    if (session.phase !== "playing") return;
    dropTouch();
    if (event.pointerType !== "touch") { input(UP); return; }
    const id = event.pointerId;
    try { event.currentTarget.setPointerCapture(id); } catch { /* a pointer the browser no longer knows */ }
    const pending = { id, x: event.clientX, y: event.clientY, acted: false, timer: 0 };
    pending.timer = window.setTimeout(() => { if (touch.current === pending && !pending.acted) { pending.acted = true; input(UP); } }, SWIPE_WAIT);
    touch.current = pending;
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pending = touch.current;
    if (!pending || pending.id !== event.pointerId) return;
    const dx = event.clientX - pending.x, dy = event.clientY - pending.y;
    if (pending.acted || Math.hypot(dx, dy) < SWIPE_PX) return;
    pending.acted = true;
    window.clearTimeout(pending.timer);
    input(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : dy < 0 ? UP : DOWN);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const pending = touch.current;
    if (!pending || pending.id !== event.pointerId) return;
    window.clearTimeout(pending.timer);
    touch.current = null;
    // A tap shorter than the wait still hops at once.
    if (!pending.acted && event.type === "pointerup") input(UP);
  }
  /** The pad answers on touch-down for speed; a keyboard "click" (detail 0) still works. */
  const pad = (action: number) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { event.stopPropagation(); if (event.button <= 0) input(action); },
    onClick: (event: { detail: number }) => { if (event.detail === 0) input(action); },
  });
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- the card ----
  const card: Shared | null = result ? { level: result.level, seed: result.seed, tenths: result.tenths, mangoes: result.mangoes, splashes: result.splashes, name: cleanName(name), mode: result.mode } : null;
  const state = card ? shareHash(card) : "";
  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    loadCardFonts(`নদী পার সেকেন্ড আম ওপারে ঘাট ০১২৩৪৫৬৭৮৯ ${card.name} ${riverName(card.level)} ${humanLine(card)} ${detailLine(card)}`).then(() => {
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
  const rival = friend && friendHere && result && result.level === friend.level ? friend : null;
  const versus = rival && result ? compareLine(result.tenths, rival.tenths, rival.name) : "";
  const near = result ? nearLine(result.tenths, result.mangoes, result.level) : "";
  const note = !result ? "" : near || (result.record ? `এই নদীতে নতুন সেরা সময়, ${secs(result.tenths)} সেকেন্ড!` : result.previousBest !== null && result.stars < 3 ? `এই নদীতে তোমার সেরা ${secs(result.previousBest)} সেকেন্ড।` : "");
  const stats: Stat[] = result ? [
    { label: "সময়", value: result.tenths, tenths: true, unit: " সে" },
    { label: "আম", value: result.mangoes, of: river.mangoes.length },
    { label: "ছপাৎ", value: result.splashes },
    { label: "লাফ", value: result.hops },
  ] : [];
  const worldNow = WORLDS[worldOf(level)];
  const title = result ? headingOf(result.level, result.stars) : "";
  const kicker = result ? `নদী ${bn(result.level)} · ওপারে ${PLACES[result.level - 1]}` : "";
  const total = totalStars(levels.stars);

  return (
    <div className="np" data-phase={phase} data-look={worldNow.look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus} onPointerDownCapture={() => back(session, "focus")}>
      <div ref={play} className="np-play" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div ref={view} className="np-view">
          <canvas ref={canvas} role="img" aria-label="ওপর থেকে দেখা নদী: নৌকা, ভেলা আর কচুরিপানা স্রোতে ভাসছে, নিচের ঘাটে স্কুলব্যাগ কাঁধে একটা ছেলে। চাপ দিলে সামনে লাফ, আঙুল ডানে-বাঁয়ে টানলে পাশে। কিবোর্ডে তীর-চিহ্ন।" />
        </div>
        <div className="np-pad" aria-label="লাফের বোতাম">
          <button type="button" className="np-key" aria-label="এক ঘর বাঁয়ে" disabled={phase !== "playing"} {...pad(LEFT)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          </button>
          <button type="button" className="np-key np-up" aria-label="সামনে লাফ" disabled={phase !== "playing"} {...pad(UP)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 7-7 7 7" /></svg>সামনে
          </button>
          <button type="button" className="np-key" aria-label="এক ঘর ডানে" disabled={phase !== "playing"} {...pad(RIGHT)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <button type="button" className="np-key np-back" aria-label="এক সারি পিছনে" disabled={phase !== "playing"} {...pad(DOWN)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>পিছনে
          </button>
        </div>

        {(phase === "playing" || phase === "paused") && (
          <button type="button" className="np-badge" onClick={event => { event.currentTarget.blur(); openList(); }} aria-haspopup="dialog" aria-label={`নদী ${bn(level)}, সব নদী দেখো`}>
            <i aria-hidden="true" />নদী {bn(level)}
          </button>
        )}

        {phase === "title" && booted && (
          <TitleScreen level={level} stars={levels.stars[level] ?? 0} canPrev={level > 1 && playableLevel(level - 1)} canNext={level < LEVEL_COUNT && playableLevel(level + 1)}
            mode={mode} friend={friend} friendHere={friendHere}
            onStart={() => { begin(); }} onPrev={() => load(level - 1)} onNext={() => load(level + 1)}
            onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, String(next)); sfx.tap(); }}
            onList={openList} onHome={home} />
        )}

        {phase === "story" && <Story onDone={endStory} />}

        {phase === "paused" && !player.paused && !picking && (
          <div className="np-cover">
            <p>থেমে আছে। নদীও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={event => { event.currentTarget.blur(); resume(); }}>চালিয়ে যাও</button>
          </div>
        )}

        {phase === "over" && result && (
          <Finish countKey={result.run} kicker={kicker} won stars={result.stars} stats={stats} slow={slow}
            heading={title}
            line={worldLine(result.level) || humanLine({ splashes: result.splashes, mangoes: result.mangoes, level: result.level })}
            note={note} versus={versus} choices={choices} onSeeCard={card ? seeCard : null} />
        )}

        {picking && (
          <RiverList stars={levels.stars} bests={bests} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)}
            onPick={to => load(to)} onClose={closeList} />
        )}
        <p className="np-sr" aria-live="polite">{phase === "over" && result ? `${title}। ${secs(result.tenths)} সেকেন্ড, ${detailLine(result)}। ${bn(result.stars)} তারা।${result.record ? " এই নদীতে এই ফোনের নতুন রেকর্ড।" : ""}` : ""}</p>
      </div>

      <section className="np-result" id="result" ref={resultBox} aria-labelledby="np-result-title">
        <h2 id="np-result-title">{card ? <>নদী {bn(card.level)} পার: <em>{secs(card.tenths)} সেকেন্ড</em></> : "নদী পার হলে তোমার কার্ড"}</h2>
        <p>{card ? (versus ? `${versus} ${humanLine(card)}` : humanLine(card)) : `ওপারের ঘাটে পৌঁছালে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই নদী পাবে। মোট ★ ${bn(total)}/${bn(LEVEL_COUNT * 3)}`}</p>
        {card && (
          <div className="np-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`নদী পার কার্ড${card.name ? `, ${card.name}` : ""}: নদী ${bn(card.level)}, ${secs(card.tenths)} সেকেন্ড, ${detailLine(card)}। ${humanLine(card)}`} />
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="np-share">
              <label className="np-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`nodi-par-${card.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint="বন্ধু লিংক খুললে ঠিক এই নদীটাই পাবে। সময়টা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
