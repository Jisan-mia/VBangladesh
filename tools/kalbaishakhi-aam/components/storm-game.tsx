"use client";
// IP: what we avoided — no fruit-catching game's name, look or characters; our own ডালা, mango tree and Boishakh storm, drawn from scratch, with our own rule numbers.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, loop, newSeed, sfx, soundOn, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, tickScene } from "../lib/draw.hot";
import { createGame, starsOf, type Game } from "../lib/game";
import { makeStorm, type Storm, type StormRef } from "../lib/gen";
import { isFinale, levelOf, DEFAULT_MODE, LEVEL_COUNT, MODES, STORY, WORLDS } from "../lib/levels";
import { bn, caption, compareLine, humanLine, nearMiss, resultLine, parseShared, refOf, sharedHash, stormLabel, stormName, type Shared } from "../lib/link";
import { BASKET_MAX, BASKET_MIN, BIG, BRANCH, FOLLOW_SPEED, GOLD, HAIL, MOVE_SPEED, RIPE, STEP, W, windAt } from "../lib/physics";
import {
  afterClear, migrateLadder, milestoneOf, nextMilestone, playable as canPlayLevel, readMode, readUnlock, recommended,
  BEST_KEY, INTRO_KEY, LADDER, LADDER_KEY, MODE_KEY, OLD_LEVELS_KEY, TOOL, TOTAL_KEY, UNLOCK_KEY,
} from "../lib/progress";
import { bindGame, makeScene, type Scene } from "../lib/scene";
import {
  again as sessionAgain, away, back, cheerMayPlay, createSession, finish as sessionFinish, moving, pause as sessionPause, pick as sessionPick,
  reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, windStep, GUARD_MS, type Phase,
} from "../lib/session";
import { dangerSide, stepGame } from "../lib/step.hot";
import { Finish, type Choice } from "./finish";
import { sound } from "./sound";
import { StartCard } from "./start-card";
import { LIST_KEYS, StormList } from "./storm-list";

/** ধীরে খেলো runs the whole storm and the ডালা at this speed together. */
const SLOW_TIME = 0.8;
const TAP_SPEED = MOVE_SPEED * 1.6;
const HOLD_MS = 220;
const HOLD_SKIP = 600;
const PANEL_MS = 3600;

type Result = Shared & {
  ref: StormRef; run: number; at: number; over: 1 | 2; stars: number; caught: number; mangoes: number; pass: number; two: number; three: number;
  left: number; bestStreak: number; ripe: number; gold: number; lives: number; hearts: number; knocked: number;
  record: boolean; best: number | null; milestone: number; total: number; firstClear: boolean;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const sameRef = (a: StormRef, b: StormRef) => ("level" in a && "level" in b && a.level === b.level) || ("stage" in a && "stage" in b && a.stage === b.stage);
const clampX = (x: number) => Math.min(BASKET_MAX, Math.max(BASKET_MIN, x));

export function StormGame() {
  // Before the ladder is first read (this effect runs before useLevels' own): the old storms' stars move over, once.
  useEffect(() => {
    const moved = migrateLadder(read(LADDER_KEY), read(OLD_LEVELS_KEY), read(BEST_KEY));
    if (moved) write(LADDER_KEY, moved);
  }, []);
  const levels = useLevels(LADDER, LEVEL_COUNT);
  const [best, submitBest] = useBest(TOOL);
  const [slow] = useSlowMode();
  const [session] = useState(createSession);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [ref, setRef] = useState<StormRef>({ level: 1 });
  const [storm, setStorm] = useState<Storm>(() => makeStorm(1, { level: 1 }));
  const [unlock, setUnlock] = useState(1);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [panel, setPanel] = useState(0);
  const [booted, setBooted] = useState(false);
  const [gathered, setGathered] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const seed = useRef(1);
  const timers = useRef<number[]>([]);
  const wind = useRef<ReturnType<typeof loop> | null>(null);
  const windLive = useRef(false);
  const heard = useRef({ events: 0, bolt: 0, shake: 0, sweep: 0, creak: 0, creaks: [] as number[] });
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const listPaused = useRef(false);
  // One finger at a time. mode: 0 idle, 1 just pressed, 2 dragging, 3 holding to one side.
  const input = useRef({ id: -1, mode: 0, startX: 0, startBasket: W / 2, downAt: 0, side: 0, noStep: false, keys: 0, target: W / 2, speed: MOVE_SPEED });
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ ref, storm, unlock, mode, friend, result, slow, stars: levels.stars });
  now.current = { ref, storm, unlock, mode, friend, result, slow, stars: levels.stars };

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  // Dev only: lets the Orca autopilot read the run (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __ka: unknown }).__ka = { session, game, scene, input, run: (steps: number) => { for (let i = 0; i < steps; i++) stepRef.current(1 / 60); drawRef.current(); } }; }, []);
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopWind = () => { wind.current?.stop(); wind.current = null; windLive.current = false; };
  const startWind = () => { stopWind(); wind.current = loop("wind"); wind.current.set(0.15); windLive.current = soundOn(); };
  function stopInput() { Object.assign(input.current, { id: -1, mode: 0, keys: 0, target: game.current?.basket ?? W / 2, speed: MOVE_SPEED }); }
  const friendFits = (to: StormRef) => Boolean(now.current.friend) && sameRef(refOf(now.current.friend!), to);
  const levelNumber = "level" in ref ? ref.level : 0;
  const playableLevel = (level: number) => canPlayLevel(level, now.current.unlock, now.current.stars, now.current.friend?.level);

  // ---- choosing a storm: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: StormRef, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    stopWind();
    stopInput();
    sessionReset(session);
    listPaused.current = false;
    seed.current = nextSeed;
    const made = makeStorm(nextSeed, to);
    now.current.ref = to; now.current.storm = made;
    setRef(to); setStorm(made);
    game.current = null;
    if (scene.current) bindGame(scene.current, null);
    setResult(null);
    sync();
  }
  const home = () => load({ level: recommended(now.current.unlock, now.current.stars) });

  /** ঝড় শুরু, the first arrow or drag: a fresh run of the storm on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !story.current.seen && !now.current.friend && "level" in now.current.ref && now.current.ref.level === 1;
    if (!sessionStart(session, firstStory, performance.now())) return false;
    newRun();
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    else { sound.storm(now.current.storm.world); startWind(); }
    sync();
    return true;
  }
  function newRun() {
    clearTimers();
    const played = createGame(now.current.storm, MODES[now.current.mode].hearts);
    game.current = played;
    if (scene.current) bindGame(scene.current, played);
    heard.current = { events: 0, bolt: 0, shake: 0, sweep: 0, creak: 0, creaks: played.drops.filter(drop => drop.kind === BIG).map(drop => drop.t0) };
    stopInput();
    setResult(null);
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    sound.storm(now.current.storm.world);
    startWind();
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sfx.tap(); return current + 1; });
  }

  function pause() { stopInput(); stopWind(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) { if (session.phase === "playing") startWind(); sync(); } }
  function openList() {
    if (session.phase === "playing" || session.phase === "story") { listPaused.current = true; stopInput(); stopWind(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the storm; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this storm from its title.
  const player = useGamePlayer({
    onPause: () => pause(),
    onResume: () => resume(),
    onRestart: () => load(now.current.ref),
  });
  const inPlayer = player.stage.width > 0;

  // ---- the end of a storm ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopWind();
    stopInput();
    const { storm: s, ref: r } = now.current, stars = starsOf(played), level = "level" in r ? r.level : 0;
    const firstClear = level > 0 && stars > 0 && !now.current.stars[level];
    if (level && stars) {
      levels.record(level, stars);
      const opened = afterClear(now.current.unlock, level);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
    }
    const before = best, record = played.score > 0 && submitBest(played.score) && before !== null;
    const oldTotal = Math.max(0, Math.floor(Number(read(TOTAL_KEY)) || 0)), total = oldTotal + played.caught;
    write(TOTAL_KEY, String(total));
    setGathered(total);
    const milestone = milestoneOf(total) > milestoneOf(oldTotal) ? milestoneOf(total) : 0;
    const done: Result = {
      seed: seed.current, score: played.score, count: played.caught, name: "", ...(level ? { level } : "stage" in r && r.stage !== 4 ? { stage: r.stage } : {}),
      ref: r, run: session.run, at, over: played.over as 1 | 2, stars, caught: played.caught, mangoes: s.mangoes, pass: s.pass, two: s.two, three: s.three,
      left: s.duration - played.t, bestStreak: played.bestStreak, ripe: played.ripe, gold: played.gold, lives: played.lives, hearts: played.hearts, knocked: played.knocked,
      record, best: before, milestone, total, firstClear,
    };
    now.current.result = done;
    setResult(done);
    sync();
    // Confetti only for three stars, a new best, a finale's first clear or a new mango badge; a plain clear gets the stars' own notes.
    const run = session.run, party = stars > 0 && (stars === 3 || record || milestone > 0 || (firstClear && isFinale(level)));
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { if (record) sfx.win(); else sfx.levelUp(); if (!now.current.slow) confetti(); }
      else if (!stars) sfx.lose();
    }, stars ? 1000 : 300);
  }

  /** Sounds for what just happened: catches, hits, knocks, the ground, thunder after a flash, the tree's shake, a sweep. */
  function listen(played: Game) {
    const ear = heard.current, { storm: s } = played;
    for (; ear.events < played.eventCount; ear.events++) {
      const event = played.events[ear.events % played.events.length];
      if (event.kind === HAIL) { if (event.caught && event.lost >= 0) sound.clink(); else sound.tick(); continue; }
      if (event.kind === BRANCH || event.kind === BIG) { if (event.caught) { if (event.kind === BIG) sound.bigHit(); else sound.twig(); } continue; }
      if (!event.caught) { sound.ground(); continue; }
      if (event.kind === GOLD) sound.gold(); else if (event.kind === RIPE) sound.ripe(); else sound.green();
      if (event.streak >= 3) sound.combo(event.streak - 3);
    }
    const bolts = scene.current?.bolts ?? [];
    if (ear.bolt < bolts.length && played.t >= bolts[ear.bolt]) { if (!now.current.slow) sound.thunder(0.35); ear.bolt++; }
    if (ear.shake < s.shakes.length && played.t >= s.shakes[ear.shake] - 1) { sound.rustle(); ear.shake++; }
    if (ear.sweep < s.sweeps.length && played.t >= s.sweeps[ear.sweep] - 1) { sound.sweep(); ear.sweep++; }
    if (ear.creak < ear.creaks.length && played.t >= ear.creaks[ear.creak] - 0.4) { sound.creak(); ear.creak++; }
  }

  const step = (dt: number) => {
    const at = performance.now(), played = game.current, control = input.current, calm = now.current.slow;
    if (session.phase === "story" && !session.picking) {
      story.current.clock += dt * 1000;
      if (story.current.holdAt >= 0 && at - story.current.holdAt >= HOLD_SKIP) { story.current.holdAt = -1; endStory(); }
      else if (story.current.clock >= PANEL_MS) nextPanel();
    }
    if (played && !played.over && moving(session, at)) {
      if (control.mode === 1 && at - control.downAt > HOLD_MS) control.mode = 3;
      if (control.mode === 3) { control.target = control.side < 0 ? BASKET_MIN : BASKET_MAX; control.speed = MOVE_SPEED; }
      else if (control.keys) { control.target = control.keys < 0 ? BASKET_MIN : BASKET_MAX; control.speed = MOVE_SPEED; }
      const scale = calm ? SLOW_TIME : 1;
      stepGame(played, dt * scale, control.target, control.speed * dt * scale);
      listen(played);
      // The wind loop comes back whenever sound does (a loop made while muted is a silent stub, so it is made anew).
      const move = windStep(windLive.current, true, soundOn());
      if (move === "start") startWind(); else if (move === "stop") stopWind();
      wind.current?.set(0.12 + 0.75 * Math.abs(windAt(played.storm.gusts, played.t, played.storm.steady)));
      if (played.over) finishRun(played);
    }
    const view = scene.current;
    if (view) tickScene(view, dt, played && session.phase !== "title" ? windAt(played.storm.gusts, played.t, played.storm.steady) : 0.3 * Math.sin(view.clock * 0.5) + 0.1, calm);
  };
  const draw = () => {
    const view = scene.current, played = game.current;
    if (!view) return;
    const showing = session.phase === "title" ? null : played;
    drawScene(view, showing, now.current.slow, showing && session.phase === "playing" ? dangerSide(showing, 0.45) : 0, session.phase !== "story");
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;
  // The yard moves on every screen but the pause; in ধীরে খেলো only during a storm.
  useGameLoop(step, draw, phase !== "paused" && !picking && (!slow || phase === "playing" || phase === "story"));

  // ---- the canvas: rebuilt for its size and the storm's world ----
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
  const look = WORLDS[storm.world].look;
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    scene.current = makeScene(element, size.width, size.height, look, storm.dark, scene.current);
    bindGame(scene.current, game.current);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("কালবৈশাখী টানা ০১২৩৪৫৬৭৮৯ শিলাবৃষ্টি").then(() => { if (!cancelled) drawRef.current(); }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, look, storm.dark]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), jান mode, the story flag, then a friend's storm or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars);
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    story.current.seen = read(INTRO_KEY) === "1";
    setGathered(Math.max(0, Math.floor(Number(read(TOTAL_KEY)) || 0)));
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-storm stops it: its title shows.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      load(refOf(shared), shared.seed);
      return true;
    };
    if (!fromHash()) load({ level: recommended(mine, levels.stars) });
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- away: blur and a hidden tab pause the storm and let go of every key and finger (the player does this too) ----
  useEffect(() => {
    const blur = () => { stopInput(); away(session, "blur"); stopWind(); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { stopInput(); away(session, "hide"); stopWind(); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      stopWind();
    };
  }, []);

  // ---- keys, at the window: ← → hold; Enter or Space start and take the end screen's choice (fresh presses only); P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const dir = event.key === "ArrowLeft" || event.key === "a" || event.key === "A" ? -1 : event.key === "ArrowRight" || event.key === "d" || event.key === "D" ? 1 : 0;
    if (event.type === "keyup") {
      if (dir && dir === input.current.keys) { input.current.keys = 0; input.current.target = game.current?.basket ?? W / 2; }
      if ((event.key === " " || event.key === "Enter") && session.phase === "story" && story.current.holdAt >= 0) { story.current.holdAt = -1; nextPanel(); }
      return;
    }
    if (player.paused) return;
    back(session, "focus"); // a key that reaches the page means the window has focus
    const enter = event.key === "Enter" || event.key === " ", fresh = !event.repeat;
    if (session.picking) {
      const index = LIST_KEYS.indexOf(event.key as typeof LIST_KEYS[number]);
      if (index >= 0 && fresh && playableLevel(index + 1)) { event.preventDefault(); load({ level: index + 1 }); }
      return;
    }
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".ka-play")) return; // a button reached with Tab below the yard does its own job
    switch (session.phase) {
      case "title":
        if ((enter || dir) && fresh) { event.preventDefault(); if (begin() && dir) input.current.keys = dir; }
        return;
      case "story":
        if (enter) { event.preventDefault(); if (fresh) story.current.holdAt = performance.now(); }
        return;
      case "paused":
        if (enter) { event.preventDefault(); if (fresh) resume(); }
        return;
      case "over":
        if (enter) { event.preventDefault(); if (fresh) takePrimary({ at: event.timeStamp, repeat: event.repeat }); }
        return;
      default:
        if (dir) { event.preventDefault(); input.current.keys = dir; }
        else if (enter) event.preventDefault();
        else if ((event.key === "p" || event.key === "P") && fresh) { event.preventDefault(); if (inPlayer) player.requestPause(); else pause(); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", listen);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", listen); };
  }, []);

  // ---- touch and mouse on the yard ----
  const toX = (clientX: number) => { const rect = play.current!.getBoundingClientRect(); return (clientX - rect.left) / rect.width * W; };
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .ka-start, .ka-finish, .ka-sheet")) return;
    const control = input.current;
    back(session, "focus"); // a tap on the yard means the window has focus
    if (event.button > 0 || control.id !== -1 || session.picking) return;
    // The tap that brings you back only resumes; it never moves the ডালা.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase === "story") { story.current.holdAt = performance.now(); control.id = event.pointerId; return; }
    if (session.phase === "over") return;
    const fresh = session.phase === "title";
    if (fresh && !begin()) return;
    if (session.phase !== "playing") return;
    const x = toX(event.clientX);
    Object.assign(control, { id: event.pointerId, mode: 1, startX: x, startBasket: game.current?.basket ?? W / 2, downAt: performance.now(), side: x < W / 2 ? -1 : 1, noStep: fresh });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone: moves still reach the yard */ }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const control = input.current;
    if (event.pointerId !== control.id || session.phase !== "playing") return;
    const x = toX(event.clientX);
    if (control.mode === 1 && Math.abs(x - control.startX) > 6) control.mode = 2;
    if (control.mode !== 2) return;
    // The ডালা follows the finger's movement, not its position, so the thumb never hides it. Re-anchor at the edges.
    let goal = control.startBasket + (x - control.startX) * 1.2;
    if (goal !== clampX(goal)) { control.startBasket += clampX(goal) - goal; goal = clampX(goal); }
    control.target = goal; control.speed = FOLLOW_SPEED;
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const control = input.current;
    if (event.pointerId !== control.id) return;
    if (session.phase === "story") {
      const held = story.current.holdAt >= 0;
      story.current.holdAt = -1; control.id = -1;
      if (held && !cancelled) nextPanel();
      return;
    }
    const basket = game.current?.basket ?? W / 2;
    if (control.mode === 1 && !control.noStep && !cancelled) {
      const from = control.speed === TAP_SPEED ? control.target : basket;
      control.target = clampX(from + control.side * STEP); control.speed = TAP_SPEED;
    } else if (control.mode === 3 || cancelled) control.target = basket;
    Object.assign(control, { id: -1, mode: 0, noStep: false });
  }
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- the end screen's choices ----
  const nextLevel = result && result.stars && levelNumber && levelNumber < LEVEL_COUNT && playableLevel(levelNumber + 1) ? levelNumber + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (!sessionAgain(session, performance.now(), key)) return;
    const r = now.current.ref, fresh = friendFits(r) ? now.current.friend!.seed : newSeed();
    if (fresh !== seed.current) { seed.current = fresh; const made = makeStorm(fresh, r); now.current.storm = made; setStorm(made); }
    newRun();
    sound.storm(now.current.storm.world);
    startWind();
    sync();
  }
  const guardOk = (key?: { at: number; repeat: boolean }) => {
    const r = now.current.result;
    return Boolean(r) && performance.now() - r!.at >= GUARD_MS && (!key || (!key.repeat && key.at > r!.at));
  };
  const primary: Choice = nextLevel ? { label: "পরের ঝড়", run: () => { if (guardOk()) load({ level: nextLevel }); } }
    : !levelNumber ? { label: "আবার খেলো", run: () => again() }
    : { label: "আবার খেলো", run: () => again() };
  const secondary: Choice | null = nextLevel ? { label: "আবার খেলো", run: () => again() }
    : !levelNumber ? { label: "তোমার ঝড়ে ফেরো", run: () => { if (guardOk()) home(); } }
    : { label: "সব ঝড়", run: () => { if (guardOk()) openList(); } };
  function takePrimary(key: { at: number; repeat: boolean }) {
    if (nextLevel) { if (guardOk(key)) load({ level: nextLevel }); }
    else again(key);
  }

  // ---- cards ----
  const card: Shared | null = result ? { seed: result.seed, score: result.score, count: result.count, name: cleanName(name), ...(result.level ? { level: result.level } : result.stage ? { stage: result.stage } : {}) } : null;
  const state = card ? sharedHash(card) : "";
  const extra = result ? { stars: result.stars, milestone: milestoneOf(result.total) } : {};
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("কালবৈশাখী আম ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site, extra);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; phase brings the friend's canvas back with the title.
  }, [state, format, site, friend, phase]);
  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the screens say ----
  const friendHere = Boolean(friend) && sameRef(refOf(friend!), ref);
  const finale = levelNumber > 0 && isFinale(levelNumber);
  const heading = !result ? "" : result.over === 2 ? (result.hearts === 1 ? "ডাল পড়ল ডালায়" : `${bn(result.hearts)}টা জানই শেষ`)
    : !result.stars ? "ঝড় থামল, আম কম পড়ল"
    : result.firstClear && finale ? `${stormName(result.ref)} পার!` : `${stormLabel(result.ref).split(" · ")[0]} থামল`;
  const note = result ? nearMiss({ over: result.over, stars: result.stars, caught: result.caught, pass: result.pass, two: result.two, three: result.three, left: result.left, score: result.score, best: result.best }) : "";
  const tally = result?.milestone ? `এ পর্যন্ত ${bn(result.total)}টা আম, ${bn(result.milestone)}-এর ধাপ পার।` : result?.record ? "এই ফোনে নতুন রেকর্ড।" : "";
  const versus = result && friendHere && friend ? compareLine(result.score, friend.score, friend.name) : "";
  const stats = result ? [
    { label: "আম", value: result.caught, of: result.mangoes },
    { label: "পয়েন্ট", value: result.score },
    { label: "টানা সেরা", value: result.bestStreak },
    { label: "জান বাকি", value: result.lives, of: result.hearts },
  ] : [];
  const badge = "level" in ref ? `${bn(ref.level)} · ${levelOf(ref.level).name}` : `বন্ধুর ঝড় · ${stormName(ref)}`;

  return (
    <div ref={root} className="ka" data-phase={phase} data-look={look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="ka-play" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={event => onPointerUp(event, true)}>
        <canvas ref={canvas} role="img" aria-label="আমগাছের নিচে উঠান, কালবৈশাখীর ঝড়। নিচে একটা ডালা। বাঁ-ডান তীর বা আঙুল দিয়ে ডালা সরিয়ে আম ধরো, শুকনো ডাল আর শিল এড়াও।" />

        {(phase === "playing" || phase === "paused") && (
          <button type="button" className="ka-badge" onClick={openList} aria-haspopup="dialog" aria-label={`${badge}, সব ঝড় দেখো`}>
            <i aria-hidden="true" />{badge}
          </button>
        )}

        {phase === "title" && booted && (
          <StartCard storm={ref} targets={storm} stars={levelNumber ? levels.stars[levelNumber] ?? 0 : 0}
            canPrev={levelNumber > 1} canNext={levelNumber > 0 && playableLevel(levelNumber + 1)} mode={mode}
            friend={friend} friendHere={friendHere} friendCanvas={friendPreview}
            onStart={() => { begin(); }} onPrev={() => load({ level: levelNumber - 1 })} onNext={() => load({ level: levelNumber + 1 })}
            onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, String(next)); sfx.tap(); }}
            onList={openList} onHome={home} />
        )}

        {phase === "story" && (
          <div className="ka-story" aria-live="polite">
            <p className="ka-skip">ধরে রাখো: বাদ দাও</p>
            <p className="ka-panel" key={panel}>{STORY[panel]}</p>
            <p className="ka-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === panel || undefined} />)}</p>
          </div>
        )}

        {phase === "paused" && !player.paused && !picking && (
          <div className="ka-cover">
            <p>থেমে আছে। ঝড়ও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}

        {phase === "over" && result && (
          <Finish countKey={result.run} heading={heading} stars={result.stars} stats={stats} slow={slow}
            line={tally || resultLine(result)} note={note} versus={versus} primary={primary} secondary={secondary} onSeeCard={seeCard} />
        )}

        {picking && (
          <StormList stars={levels.stars} playable={playableLevel} current={levelNumber} recommended={recommended(unlock, levels.stars)}
            onPick={level => load({ level })} onClose={closeList} />
        )}
        <p className="ka-sr" aria-live="polite">{phase === "over" && result ? `${heading}। ${bn(result.caught)}টা আম, ${bn(result.score)} পয়েন্ট। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
      </div>

      {card && result && (
        <section className="ka-result" id="result" ref={resultBox} aria-labelledby="ka-result-title">
          <h2 id="ka-result-title"><em>{bn(card.count)}টা আম</em>, {bn(card.score)} পয়েন্ট</h2>
          <p>{stormLabel(result.ref)} · {versus || resultLine(result)}</p>
          <div className="ka-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ka-card-summary" />
              <figcaption id="ka-card-summary" className="ka-sr">কালবৈশাখী আম{card.name && ` · ${card.name}`}: {bn(card.count)}টা আম, {bn(card.score)} পয়েন্ট। {humanLine(card.score)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ka-share">
              <label className="ka-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="kalbaishakhi-aam.png" makeImage={() => cardBlob(card, format, site, extra)} imageKey={`${state}|${format}|${extra.stars ?? 0}|${extra.milestone ?? 0}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই ঝড়টাই পাবে।" />
            </div>
          </div>
          <p className="ka-tally">{gathered ? <>এ পর্যন্ত কুড়ানো <b>{bn(gathered)}টা আম</b>{nextMilestone(gathered) ? ` · পরের ধাপ ${bn(nextMilestone(gathered))}` : ""}</> : null}</p>
          <p className="ka-safe">সত্যিকারের কালবৈশাখীতে গাছের নিচে যেয়ো না, বাজ পড়ে, ডাল ভাঙে। আম কুড়াও ঝড় থামলে।</p>
        </section>
      )}
    </div>
  );
}
