"use client";
// IP: what we avoided — no famous racing game's name, cars, track or look, no post office name, logo, uniform, badge or letterbox;
// ours is a plain-shirted village letter carrier on an old roadster, three dusty village roads drawn from scratch, our own rule numbers.
// Thin React over the pure ride: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, loop, newSeed, sfx, soundOn, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, starsOfRide } from "../lib/card";
import { makeCourse, type Course } from "../lib/course";
import { drawScene, resetScene, sceneEvent, tickScene } from "../lib/draw.hot";
import { createGame, fullMeters, starsOf, steer, EV, EVENT_RING, type Game } from "../lib/game";
import { bindCourse, makeScene, type Scene } from "../lib/layers";
import { isFinale, levelOf, DEFAULT_MODE, LEVEL_COUNT, LIST_KEYS, MODES, STORY, WORLDS } from "../lib/levels";
import { bn, caption, headingFor, levelLabel, levelOfShared, nearMiss, parseShared, resultLine, sharedHash, versusLine, type Outcome, type Ride, type Shared } from "../lib/link";
import {
  afterClear, bestSlug, migrateLadder, milestoneOf, nextMilestone, playable as canPlayLevel, readMode, readUnlock, recommended,
  INTRO_KEY, LADDER, LADDER_KEY, MODE_KEY, OLD_BEST_KEY, OLD_LEVELS_KEY, TOOL, TOTAL_KEY, UNLOCK_KEY,
} from "../lib/progress";
import {
  again as sessionAgain, away, back, cheerMayPlay, createSession, friendMayLoad, finish as sessionFinish, loopStep, moving, pause as sessionPause, pick as sessionPick,
  reset as sessionReset, resume as sessionResume, start as sessionStart, steerable, storyDone, GUARD_MS, type Phase,
} from "../lib/session";
import { stepGame } from "../lib/step.hot";
import { Finish, type Choice } from "./finish";
import { LevelList } from "./level-list";
import { sound } from "./sound";
import { StartCard } from "./start-card";

/** ধীরে খেলো runs the whole ride at this speed (reaction gets easier; the targets stay the same). */
const SLOW_TIME = 0.75;
const HOLD_SKIP = 600;
const PANEL_MS = 3400;

type Result = {
  ride: Ride; run: number; at: number; stars: number; finished: boolean; meters: number; full: number; time: number;
  delivered: number; houses: number; goal: number; lost: number; hitKind: number; bells: number;
  record: boolean; best: number | null; milestone: number; tally: number; firstClear: boolean; demo: boolean;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

export function RideGame() {
  // Before the ladder is first read (this effect runs before useLevels' own): the old routes' stars move over, once.
  useEffect(() => {
    const moved = migrateLadder(read(LADDER_KEY), read(OLD_LEVELS_KEY), read(OLD_BEST_KEY));
    if (moved) write(LADDER_KEY, moved);
  }, []);
  const levels = useLevels(LADDER, LEVEL_COUNT);
  const [level, setLevel] = useState(1);
  const [best, submitBest] = useBest(bestSlug(level));
  const [slow] = useSlowMode();
  const [session] = useState(createSession);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [course, setCourse] = useState<Course>(() => makeCourse(1, 1));
  const [unlock, setUnlock] = useState(1);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [panel, setPanel] = useState(0);
  const [booted, setBooted] = useState(false);
  const [tally, setTally] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);

  const play = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const seed = useRef(1);
  const timers = useRef<number[]>([]);
  const road = useRef<ReturnType<typeof loop> | null>(null);
  const roadLive = useRef(false);
  const heard = useRef(0);
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const listPaused = useRef(false);
  const finger = useRef(-1);
  const stageInView = useInView(play);
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ level, course, unlock, mode, friend, result, slow, stars: levels.stars });
  now.current = { level, course, unlock, mode, friend, result, slow, stars: levels.stars };

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopRoad = () => { road.current?.stop(); road.current = null; roadLive.current = false; };
  const startRoad = () => { stopRoad(); road.current = loop("wind", 700); road.current.set(0.05); roadLive.current = soundOn(); };
  function letGo() { finger.current = -1; }
  const friendFits = (to: number) => Boolean(now.current.friend) && now.current.friend!.kind === "ride" && levelOfShared(now.current.friend!) === to;
  const playableLevel = (at: number) => canPlayLevel(at, now.current.unlock, now.current.stars, now.current.friend ? levelOfShared(now.current.friend) : 0);

  // ---- choosing a route: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: number, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    stopRoad();
    letGo();
    sessionReset(session);
    listPaused.current = false;
    seed.current = nextSeed;
    const made = makeCourse(nextSeed, to);
    now.current.level = to; now.current.course = made;
    setLevel(to); setCourse(made);
    game.current = null;
    if (scene.current) { if (scene.current.look === WORLDS[made.world].id) { bindCourse(scene.current, made); resetScene(scene.current); } }
    setResult(null);
    sync();
  }

  /** রওনা দাও, Space, a tap on the road: a fresh ride of the route on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !story.current.seen && !now.current.friend && now.current.level === 1;
    if (!sessionStart(session, firstStory, performance.now())) return false;
    newRun();
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    else { sound.start(now.current.course.world); startRoad(); }
    sync();
    return true;
  }
  function newRun() {
    clearTimers();
    game.current = createGame(now.current.course, now.current.mode);
    heard.current = 0;
    if (scene.current) resetScene(scene.current);
    setResult(null);
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    letGo();
    sound.start(now.current.course.world);
    startRoad();
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sfx.tap(); return current + 1; });
  }

  function pause() { letGo(); stopRoad(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) { letGo(); if (session.phase === "riding") startRoad(); sync(); } }
  function openList() {
    if (session.phase === "riding" || session.phase === "story") { listPaused.current = true; letGo(); stopRoad(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the ride; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this route from its title.
  const player = useGamePlayer({
    onPause: () => pause(),
    onResume: () => resume(),
    onRestart: () => load(now.current.level),
    onLevels: () => openList(),
  });
  const inPlayer = player.stage.width > 0;

  // ---- the end of a ride ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopRoad();
    letGo();
    const r = now.current.level, stars = starsOf(played), c = played.course, score = played.score;
    const firstClear = stars > 0 && !now.current.stars[r];
    // The stars are recorded at the moment the place is reached, not in a timer. A far-ahead friend's route records its stars and opens nothing in between.
    if (stars) {
      levels.record(r, stars);
      const opened = afterClear(now.current.unlock, r);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
    }
    const before = best, record = score > 0 && submitBest(score) && before !== null;
    const oldTally = Math.max(0, Math.floor(Number(read(TOTAL_KEY)) || 0)), total = oldTally + played.delivered;
    write(TOTAL_KEY, String(total));
    setTally(total);
    const milestone = milestoneOf(total) > milestoneOf(oldTally) ? milestoneOf(total) : 0;
    const ride: Ride = { kind: "ride", seed: seed.current, level: r, mode: now.current.mode, score, meters: played.meters, delivered: played.delivered, picked: played.picked, bumps: played.bumps, name: "" };
    const done: Result = {
      ride, run: session.run, at, stars, finished: Boolean(played.finished), meters: played.meters, full: fullMeters(c), time: played.t,
      delivered: played.delivered, houses: c.houses.length, goal: c.spec.goal, lost: played.lost, hitKind: played.hitKind, bells: played.bells,
      record, best: before, milestone, tally: total, firstClear, demo: false,
    };
    now.current.result = done;
    setResult(done);
    sync();
    // Confetti only for three stars, a new best, a finale's first arrival or a new letters badge; a plain arrival gets the stars' own notes.
    const run = session.run, party = stars > 0 && (stars === 3 || record || milestone > 0 || (firstClear && isFinale(r)));
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { if (record) sfx.win(); else sfx.levelUp(); if (!now.current.slow) confetti(); }
      else if (!stars) sfx.lose();
    }, stars ? 1000 : 300);
  }

  /** Preview images only (`&og=1` on a friend's link): shows that ride's end and card without playing. Saves nothing. */
  function demo(shared: Ride) {
    const c = makeCourse(shared.seed, shared.level), stars = starsOfRide(shared);
    const done: Result = {
      ride: { ...shared, name: "" }, run: session.run, at: performance.now(), stars, finished: stars > 0, meters: shared.meters, full: fullMeters(c), time: 0,
      delivered: shared.delivered, houses: c.houses.length, goal: c.spec.goal, lost: 0, hitKind: -1, bells: (shared.score - shared.meters - 10 * shared.delivered - 5 * shared.picked) / 5,
      record: false, best: null, milestone: 0, tally: 0, firstClear: false, demo: true,
    };
    setName(shared.name);
    setResult(done);
  }

  /** Sounds and juice for what just happened. */
  function listen(played: Game) {
    const view = scene.current, calm = now.current.slow;
    for (; heard.current < played.eventCount; heard.current++) {
      const slot = heard.current % EVENT_RING, kind = played.evKind[slot], n = played.evN[slot];
      if (view) sceneEvent(view, kind, played.evX[slot], played.evY[slot], n, calm);
      if (kind === EV.deliver) sound.deliver(n);
      else if (kind === EV.miss) sound.miss();
      else if (kind === EV.pick) sound.pick();
      else if (kind === EV.bell) sound.bell();
      else if (kind === EV.bump) sound.bump(n >> 1, played.over === 1, calm);
      else if (kind === EV.finish) sound.arrive();
      else if (kind === EV.van) sound.van();
      else if (kind === EV.dog) sound.dog();
      else if (kind === EV.gust) sound.gust();
      else if (kind === EV.mud) sound.mud();
      else if (kind === EV.notch) sound.notch(n === 1);
    }
  }

  const step = (dt: number) => {
    const at = performance.now(), played = game.current, calm = now.current.slow;
    if (session.phase === "story" && !session.picking) {
      story.current.clock += dt * 1000;
      if (story.current.holdAt >= 0 && at - story.current.holdAt >= HOLD_SKIP) { story.current.holdAt = -1; endStory(); }
      else if (story.current.clock >= PANEL_MS) nextPanel();
    }
    const scale = calm ? SLOW_TIME : 1;
    if (played && !played.over && moving(session, at)) {
      stepGame(played, dt * scale);
      listen(played);
      // The road loop comes back whenever sound does (a loop made while muted is a silent stub, so it is made anew).
      const move = loopStep(roadLive.current, true, soundOn());
      if (move === "start") startRoad();
      if (road.current) { const speed = Math.min(1, played.v / 400); road.current.set(0.04 + speed * 0.26); road.current.pitch(380 + speed * 900); }
      if (played.over) finishRun(played);
    }
    const view = scene.current;
    if (view) {
      view.hudTop = 10;
      tickScene(view, played && session.phase !== "title" ? played : null, dt * scale, calm, session.phase === "title");
      // The bike's coast after the place goes on after the ride has ended.
    }
  };
  const draw = () => {
    const view = scene.current, played = game.current;
    if (!view) return;
    const showing = session.phase === "title" ? null : played;
    drawScene(view, showing, now.current.slow, session.phase !== "paused" && !session.picking);
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;
  // The scene moves on every screen but the pause and the list; in ধীরে খেলো only while riding.
  useGameLoop(step, draw, phase !== "paused" && !picking && (!slow || phase === "riding" || phase === "story"));

  // Dev only: lets the Orca autopilot read the ride (tests drive the pure code instead).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __pc: unknown }).__pc = { session, game, scene, steerBy: (towards: number) => steerBy(towards), load: (to: number) => load(to), run: (steps: number) => { for (let i = 0; i < steps; i++) stepRef.current(1 / 60); drawRef.current(); } };
  }, []);

  // ---- the canvas: rebuilt for its size and the route's world ----
  useEffect(() => {
    const element = play.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width), height = Math.round(entry.contentRect.height);
      setSize(current => (current.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const look = WORLDS[course.world].id;
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    scene.current = makeScene(element, size.width, size.height, look, scene.current);
    bindCourse(scene.current, now.current.course);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("পিয়নের সাইকেল চিঠি মি. ০১২৩৪৫৬৭৮৯ হাটবার গরুর পাল কালবৈশাখী বটতলা ক্রিং +").then(() => { if (!cancelled && scene.current) { bindCourse(scene.current, now.current.course); drawRef.current(); } }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, look]);
  useEffect(() => { if (scene.current && scene.current.look === look) { bindCourse(scene.current, course); resetScene(scene.current); drawRef.current(); } }, [course]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), the mode, the story flag, then a friend's ride or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars);
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    story.current.seen = read(INTRO_KEY) === "1";
    setTally(Math.max(0, Math.floor(Number(read(TOTAL_KEY)) || 0)));
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-ride is kept for after it: the route on screen never changes under you.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      if (!friendMayLoad(session)) return true;
      load(levelOfShared(shared), shared.kind === "ride" ? shared.seed : undefined);
      if (shared.kind === "ride" && new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
      return true;
    };
    if (!fromHash()) load(recommended(mine, levels.stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- away: blur, a hidden tab and a scrolled-away stage pause the ride (the player does this too) ----
  useEffect(() => {
    const blur = () => { letGo(); away(session, "blur"); stopRoad(); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { letGo(); away(session, "hide"); stopRoad(); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      stopRoad();
    };
  }, []);
  useEffect(() => {
    if (!booted) return;
    if (!stageInView) { letGo(); away(session, "scroll"); stopRoad(); sync(); } else back(session, "scroll");
  }, [stageInView, booted]);

  // ---- steering: one lane a tap ----
  function steerBy(towards: number) {
    const played = game.current;
    if (!played || played.over || !steerable(session)) return false;
    steer(played, towards);
    return true;
  }

  // ---- keys, at the window: ← → / A D change lane; Enter or Space start and take the end screen's choice (fresh presses only); P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const towards = event.key === "ArrowLeft" || event.key === "a" || event.key === "A" ? -1 : event.key === "ArrowRight" || event.key === "d" || event.key === "D" ? 1 : 0;
    if (event.type === "keyup") {
      if ((event.key === " " || event.key === "Enter") && session.phase === "story" && story.current.holdAt >= 0) { story.current.holdAt = -1; nextPanel(); }
      return;
    }
    if (player.paused) return;
    back(session, "focus"); // a key that reaches the page means the window has focus
    const enter = event.key === "Enter" || event.key === " ", fresh = !event.repeat;
    if (session.picking) {
      const index = LIST_KEYS.indexOf(event.key as (typeof LIST_KEYS)[number]);
      if (index >= 0 && fresh && playableLevel(index + 1)) { event.preventDefault(); load(index + 1); }
      return;
    }
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".pc-play")) return; // a button reached with Tab below the stage does its own job
    switch (session.phase) {
      case "title":
        if ((enter || towards) && fresh) { event.preventDefault(); begin(); }
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
        if (towards) { event.preventDefault(); if (fresh) steerBy(towards); }
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

  // ---- touch and mouse on the road: the left half is one lane left, the right half one lane right ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .pc-start, .pc-finish, .pc-sheet, .pc-cover")) return;
    back(session, "focus"); // a press on the stage means the window has focus
    if (event.button > 0 || session.picking) return;
    // The tap that brings you back only resumes; it never changes lane.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase === "story") { story.current.holdAt = performance.now(); finger.current = event.pointerId; return; }
    if (session.phase !== "riding") return;
    const box = event.currentTarget.getBoundingClientRect();
    steerBy(event.clientX - box.left < box.width / 2 ? -1 : 1);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    if (event.pointerId !== finger.current) return;
    finger.current = -1;
    if (session.phase === "story") {
      const held = story.current.holdAt >= 0;
      story.current.holdAt = -1;
      if (held && !cancelled) nextPanel();
    }
  }
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- the end screen's choices ----
  const nextLevel = result && result.stars && level < LEVEL_COUNT && playableLevel(level + 1) ? level + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (result?.demo) { load(now.current.level, now.current.friend?.kind === "ride" ? now.current.friend.seed : undefined); return; }
    if (!sessionAgain(session, performance.now(), key)) return;
    const r = now.current.level, fresh = friendFits(r) ? now.current.friend!.seed : newSeed();
    if (fresh !== seed.current) { seed.current = fresh; const made = makeCourse(fresh, r); now.current.course = made; setCourse(made); if (scene.current) bindCourse(scene.current, made); }
    newRun();
    sound.start(now.current.course.world);
    startRoad();
    sync();
  }
  const guardOk = (key?: { at: number; repeat: boolean }) => {
    const r = now.current.result;
    return Boolean(r) && performance.now() - r!.at >= GUARD_MS && (!key || (!key.repeat && key.at > r!.at));
  };
  const primary: Choice = nextLevel ? { label: "পরের লেভেল", run: () => { if (guardOk()) load(nextLevel); } } : { label: "আবার খেলো", run: () => again() };
  const secondary: Choice | null = nextLevel ? { label: "আবার খেলো", run: () => again() }
    : { label: "সব লেভেল", run: () => { if (guardOk()) openList(); } };
  function takePrimary(key: { at: number; repeat: boolean }) {
    if (nextLevel) { if (guardOk(key)) load(nextLevel); }
    else again(key);
  }

  // ---- cards ----
  const card: Ride | null = result ? { ...result.ride, name: cleanName(name) } : null;
  const state = card ? sharedHash(card) : "";
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("পিয়নের সাইকেল চিঠি মিটার ক্রিং তুমি কত দূর যেতে পারবে ০১২৩৪৫৬৭৮৯ ★").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend?.kind === "ride" && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; phase brings the friend's canvas back with the title.
  }, [state, format, site, friend, phase]);
  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? ("auto" as const) : ("smooth" as const);
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the screens say ----
  const friendHere = Boolean(friend) && levelOfShared(friend!) === level && (friend!.kind === "old" || friend!.seed === seed.current);
  const spec = levelOf(level), finale = isFinale(level);
  const outcome: Outcome | null = result ? { level, finished: result.finished, meters: result.meters, full: result.full, delivered: result.delivered, houses: result.houses, goal: result.goal, lost: result.lost, hitKind: result.hitKind } : null;
  const heading = outcome && result ? headingFor(outcome, result.firstClear && finale) : "";
  const note = result && outcome && !result.demo ? nearMiss(outcome) : "";
  const tallyLine = result?.milestone ? `এ পর্যন্ত ${bn(result.tally)}টা চিঠি পৌঁছেছে, ${bn(result.milestone)}-এর ধাপ পার।` : result?.record ? "এই লেভেলে এই ফোনে নতুন রেকর্ড।" : "";
  // The card compares you with a friend only on the friend's own road.
  const versus = result && !result.demo ? versusLine(result.ride, friend) : "";
  const stats = result ? [
    { label: "চিঠি", value: result.delivered, of: result.houses },
    { label: "মিটার", value: result.meters, of: result.full },
    { label: "ক্রিং", value: result.bells },
    { label: "সময়", value: result.time, unit: "সে.", tenths: true },
  ] : [];
  const badge = `লেভেল ${bn(level)}`;
  const nextLine = nextLevel ? `${levelOf(nextLevel).name}: ${levelOf(nextLevel).line.replace(/^শেষ লেভেল: /, "")}` : "";

  return (
    <div className="pc" data-phase={phase} data-look={look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="pc-play" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={event => onPointerUp(event, true)} onContextMenu={event => event.preventDefault()}>
        <canvas ref={canvas} role="img" aria-label="গ্রামের তিন লেনের পথে চিঠির ঝোলা নিয়ে সাইকেলে পিয়ন। রাস্তার বাঁ বা ডান পাশে চাপলে এক লেন সরে যায়। গেটের পাশের লেন দিয়ে গেলে চিঠি পৌঁছায়।" />

        {(phase === "riding" || phase === "paused") && (
          <button type="button" className="pc-badge" onClick={openList} aria-haspopup="dialog" aria-label={`${badge}, ${spec.name}, সব লেভেল দেখো`}>
            <i aria-hidden="true" />{badge}
          </button>
        )}

        {phase === "title" && booted && !result && (
          <StartCard level={level} meters={fullMeters(course)} targets={{ goal: course.spec.goal, houses: course.houses.length }} stars={levels.stars[level] ?? 0}
            canPrev={level > 1} canNext={playableLevel(level + 1)} mode={mode}
            friend={friend} friendHere={friendHere} friendCanvas={friendPreview}
            onStart={() => { begin(); }} onPrev={() => load(level - 1)} onNext={() => load(level + 1)}
            onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, MODES[next].id); sfx.tap(); }}
            onList={openList} />
        )}

        {phase === "story" && (
          <div className="pc-story" aria-live="polite">
            <p className="pc-skip">ধরে রাখো: বাদ দাও</p>
            <p className="pc-panel" key={panel}>{STORY[panel]}</p>
            <p className="pc-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === panel || undefined} />)}</p>
          </div>
        )}

        {phase === "paused" && !player.paused && !picking && (
          <div className="pc-cover">
            <p>থেমে আছে। সাইকেলও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}

        {result && (phase === "over" || result.demo) && (
          <Finish countKey={result.run} heading={heading} stars={result.stars} stats={stats} slow={slow}
            line={tallyLine || (outcome ? resultLine(outcome) : "")} note={note} versus={versus} primary={primary} secondary={result.demo ? null : secondary} next={nextLine} onSeeCard={seeCard} />
        )}

        {picking && (
          <LevelList stars={levels.stars} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)}
            onPick={pickLevel => load(pickLevel)} onClose={closeList} />
        )}
        <p className="pc-sr" aria-live="polite">{phase === "over" && result ? `${heading}। ${bn(result.delivered)}টা চিঠি, ${bn(result.ride.score)} পয়েন্ট। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
      </div>

      {card && result && (
        <section className="pc-result" id="result" ref={resultBox} aria-labelledby="pc-result-title">
          <h2 id="pc-result-title"><em>{bn(card.score)} পয়েন্ট</em>, {bn(card.delivered)}টা চিঠি</h2>
          <p>{levelLabel(card.level)} · {versus || (outcome ? resultLine(outcome) : "")}</p>
          <div className="pc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pc-card-summary" />
              <figcaption id="pc-card-summary" className="pc-sr">পিয়নের সাইকেল{card.name && ` · ${card.name}`}: {levelLabel(card.level)}, {bn(card.score)} পয়েন্ট, {bn(card.delivered)}টা চিঠি।</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pc-share">
              <label className="pc-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="peoner-cycle.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই রাস্তাটাই পাবে: একই গেট, একই গরু, একই কাদা।" />
            </div>
          </div>
          <p className="pc-tally">{tally ? <>এ পর্যন্ত পৌঁছেছে <b>{bn(tally)}টা চিঠি</b>{nextMilestone(tally) ? ` · পরের ধাপ ${bn(nextMilestone(tally))}` : ""}</> : null}</p>
        </section>
      )}
    </div>
  );
}
