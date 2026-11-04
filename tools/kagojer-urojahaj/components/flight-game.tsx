"use client";
// IP: what we avoided — no paper-plane game's name, look, levels or sounds; our own exercise-book plane, a Bangladeshi
// classroom, Old Dhaka roofs on a kite day and a river ghat at dusk, drawn from plain shapes, with our own rule numbers.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, loop, newSeed, sfx, soundOn, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { makeCourse } from "../lib/course";
import { drawFinaleBar, drawScene, sceneEvent, tickScene } from "../lib/draw.hot";
import { createGame, metersOf, pointsOf, starsOf, CRASH, EV, EVENT_RING, type Game } from "../lib/flight";
import { isFinale, levelOf, DEFAULT_MODE, LEVEL_COUNT, LIST_KEYS, MODES, STORY, WORLDS } from "../lib/levels";
import { bindCourse, makeScene, type Scene } from "../lib/layers";
import { bn, caption, compareLine, levelLabel, levelOfShared, nearMiss, parseShared, resultLine, sharedHash, type Flight, type Shared } from "../lib/link";
import { WIND, type Course } from "../lib/physics";
import {
  afterClear, bestSlug, migrateLadder, milestoneOf, nextMilestone, playable as canPlayLevel, readMode, readUnlock, recommended,
  INTRO_KEY, LADDER, LADDER_KEY, MODE_KEY, OLD_LEVELS_KEY, TOOL, TOTAL_KEY, UNLOCK_KEY,
} from "../lib/progress";
import {
  again as sessionAgain, away, back, cheerMayPlay, createSession, finish as sessionFinish, holding, moving, pause as sessionPause, pick as sessionPick,
  press, reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, windStep, GUARD_MS, type Phase,
} from "../lib/session";
import { stepGame } from "../lib/step.hot";
import { Finish, type Choice } from "./finish";
import { LevelList } from "./level-list";
import { sound } from "./sound";
import { StartCard } from "./start-card";

/** ধীরে খেলো runs the whole flight at this speed (reaction gets easier; the targets stay the same). */
const SLOW_TIME = 0.75;
const HOLD_SKIP = 600;
const PANEL_MS = 3400;
const HOLD_KEYS = new Set([" ", "ArrowUp", "w", "W"]);

type Result = {
  flight: Flight; run: number; at: number; stars: number; meters: number; full: number; time: number; left: number; pages: number;
  crashes: number; bestStreak: number; bullMiss: number; total: number; goal: number;
  record: boolean; best: number | null; milestone: number; tally: number; firstClear: boolean; demo: boolean;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

export function FlightGame() {
  // Before the ladder is first read (this effect runs before useLevels' own): the old waves' stars move over, once.
  useEffect(() => {
    const moved = migrateLadder(read(LADDER_KEY), read(OLD_LEVELS_KEY));
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
  const wind = useRef<ReturnType<typeof loop> | null>(null);
  const windLive = useRef(false);
  const heard = useRef(0);
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const listPaused = useRef(false);
  const finger = useRef(-1);
  const keysDown = useRef(new Set<string>());
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ level, course, unlock, mode, friend, result, slow, stars: levels.stars });
  now.current = { level, course, unlock, mode, friend, result, slow, stars: levels.stars };

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  // Dev only: lets the Orca autopilot read the run (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __ku: unknown }).__ku = { session, game, scene, run: (steps: number) => { for (let i = 0; i < steps; i++) stepRef.current(1 / 60); drawRef.current(); } }; }, []);
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopWind = () => { wind.current?.stop(); wind.current = null; windLive.current = false; };
  const startWind = () => { stopWind(); wind.current = loop("wind", 700); wind.current.set(0.1); windLive.current = soundOn(); };
  function letGo() { finger.current = -1; keysDown.current.clear(); press(session, false); }
  const friendFits = (to: number) => Boolean(now.current.friend) && levelOfShared(now.current.friend!) === to;
  const playableLevel = (at: number) => canPlayLevel(at, now.current.unlock, now.current.stars, now.current.friend ? levelOfShared(now.current.friend) : 0);

  // ---- choosing a flight: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: number, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    stopWind();
    letGo();
    sessionReset(session);
    listPaused.current = false;
    seed.current = nextSeed;
    const made = makeCourse(nextSeed, to);
    now.current.level = to; now.current.course = made;
    setLevel(to); setCourse(made);
    game.current = null;
    if (scene.current) { if (scene.current.look === WORLDS[made.world].look) bindCourse(scene.current, made); scene.current.camX = -40; }
    setResult(null);
    sync();
  }
  const home = () => load(recommended(now.current.unlock, now.current.stars));

  /** ছোড়ো, Space, a press on the scene: a fresh flight of the level on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !story.current.seen && !now.current.friend && now.current.level === 1;
    if (!sessionStart(session, firstStory, performance.now())) return false;
    newRun();
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    else { sound.throw(now.current.course.world); startWind(); }
    sync();
    return true;
  }
  function newRun() {
    clearTimers();
    game.current = createGame(now.current.course, MODES[now.current.mode].pages);
    heard.current = 0;
    if (scene.current) { scene.current.trailCount = 0; scene.current.camX = -40; }
    setResult(null);
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    letGo();
    sound.throw(now.current.course.world);
    startWind();
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sfx.tap(); return current + 1; });
  }

  function pause() { letGo(); stopWind(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) { letGo(); if (session.phase === "flying") startWind(); sync(); } }
  function openList() {
    if (session.phase === "flying" || session.phase === "story") { listPaused.current = true; letGo(); stopWind(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the flight; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this level from its title.
  const player = useGamePlayer({
    onPause: () => pause(),
    onResume: () => resume(),
    onRestart: () => load(now.current.level),
  });
  const inPlayer = player.stage.width > 0;

  // ---- the end of a flight ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopWind();
    letGo();
    const r = now.current.level, stars = starsOf(played), c = played.course, score = pointsOf(played);
    const firstClear = stars > 0 && !now.current.stars[r];
    if (stars) {
      levels.record(r, stars);
      const opened = afterClear(now.current.unlock, r);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
    }
    const before = best, record = score > 0 && submitBest(score) && before !== null;
    const oldTally = Math.max(0, Math.floor(Number(read(TOTAL_KEY)) || 0)), total = oldTally + played.candies;
    write(TOTAL_KEY, String(total));
    setTally(total);
    const milestone = milestoneOf(total) > milestoneOf(oldTally) ? milestoneOf(total) : 0;
    const pw = c.pad.x1 - c.pad.x0;
    const done: Result = {
      flight: { kind: "flight", seed: seed.current, level: r, score, candies: played.candies, landing: played.landing, name: "" },
      run: session.run, at, stars, meters: metersOf(played), full: c.meters, time: played.t, left: played.left, pages: played.pages,
      crashes: played.crashes, bestStreak: played.bestStreak, bullMiss: played.landing === 1 ? Math.max(0, Math.abs(played.touchX - pw / 2) - c.pad.bull) : 0,
      total: c.candyCount, goal: c.goal, record, best: before, milestone, tally: total, firstClear, demo: false,
    };
    now.current.result = done;
    setResult(done);
    sync();
    // Confetti only for three stars, a new best, a finale's first landing or a new candy badge; a plain landing gets the stars' own notes.
    const run = session.run, party = stars > 0 && (stars === 3 || record || milestone > 0 || (firstClear && isFinale(r)));
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { if (record) sfx.win(); else sfx.levelUp(); if (!now.current.slow) confetti(); }
      else if (!stars) sfx.lose();
    }, stars ? 1000 : 300);
  }

  /** Preview images only (`&og=1` on a friend's link): shows that flight's end and card without playing. Saves nothing. */
  function demo(shared: Flight) {
    const c = makeCourse(shared.seed, shared.level);
    const done: Result = {
      flight: { ...shared, name: "" }, run: session.run, at: performance.now(), stars: 0, meters: c.meters, full: c.meters, time: 0, left: 0, pages: 0, crashes: 0, bestStreak: 0,
      bullMiss: 0, total: c.candyCount, goal: c.goal, record: false, best: null, milestone: 0, tally: 0, firstClear: false, demo: true,
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
      if (kind === EV.candy) sound.candy(n);
      else if (kind === EV.crash) sound.crash(n === CRASH.water);
      else if (kind === EV.land) sound.land(n === 2);
      else if (kind === EV.bump) sound.knock();
      else if (kind === EV.stall) sound.stall();
      else if (kind === EV.rethrow) sound.rethrow();
      else if (kind === EV.warn) sound.warn(played.course.world);
      else if (kind === EV.checkpoint) sound.checkpoint();
      else if (kind === EV.wind) { if (n === WIND.warm) sound.warm(); else if (n === WIND.fan || n === WIND.bell) sound.fan(); else if (n === WIND.gust) sound.gust(); else if (n === WIND.rain) sound.rain(); }
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
      stepGame(played, holding(session, at), dt * scale);
      listen(played);
      // The wind loop comes back whenever sound does (a loop made while muted is a silent stub, so it is made anew).
      const move = windStep(windLive.current, played.state === 0, soundOn());
      if (move === "start") startWind(); else if (move === "stop") stopWind();
      if (wind.current) { const speed = Math.min(1, played.v / 220); wind.current.set(0.06 + speed * 0.35 + (played.windArt >= 0 ? 0.12 : 0)); wind.current.pitch(400 + speed * 1200); }
      if (played.over) finishRun(played);
    }
    const view = scene.current;
    if (view) tickScene(view, played && session.phase !== "title" ? played : null, dt * scale, calm);
  };
  const draw = () => {
    const view = scene.current, played = game.current;
    if (!view) return;
    const showing = session.phase === "title" ? null : played;
    drawScene(view, showing, now.current.slow, session.phase === "flying" || session.phase === "paused");
    const spec = levelOf(now.current.level);
    if (showing && spec.bar && (session.phase === "flying" || session.phase === "paused")) drawFinaleBar(view, showing, spec.bar, showing.warned > showing.beatsHeard, now.current.slow);
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;
  // The scene moves on every screen but the pause and the list; in ধীরে খেলো only while flying.
  useGameLoop(step, draw, phase !== "paused" && !picking && (!slow || phase === "flying" || phase === "story"));

  // ---- the canvas: rebuilt for its size and the flight's world ----
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
  const look = WORLDS[course.world].look;
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    scene.current = makeScene(element, size.width, size.height, look, scene.current);
    bindCourse(scene.current, now.current.course);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("লজেন্স মি. +১০ ০১২৩৪৫৬৭৮৯ টিফিনের ঘণ্টা ঘুড়ি কাটাকাটি শেষ খেয়া অ আ ক খ").then(() => { if (!cancelled && scene.current) { bindCourse(scene.current, now.current.course); scene.current = makeScene(element, size.width, size.height, look, scene.current); drawRef.current(); } }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, look]);
  useEffect(() => { if (scene.current && scene.current.look === look) { bindCourse(scene.current, course); drawRef.current(); } }, [course]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), the পাতা mode, the story flag, then a friend's flight or yours ----
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
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-flight stops it: its title shows.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      load(levelOfShared(shared), shared.seed);
      if (shared.kind === "flight" && new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
      return true;
    };
    if (!fromHash()) load(recommended(mine, levels.stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- away: blur and a hidden tab pause the flight and let go of every key and finger (the player does this too) ----
  useEffect(() => {
    const blur = () => { letGo(); away(session, "blur"); stopWind(); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { letGo(); away(session, "hide"); stopWind(); sync(); } else back(session, "show"); };
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

  // ---- keys, at the window: Space / ↑ / W hold the nose up; Enter or Space throw and take the end screen's choice (fresh presses only); P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const hold = HOLD_KEYS.has(event.key);
    if (event.type === "keyup") {
      if (hold) { keysDown.current.delete(event.key); if (!keysDown.current.size && finger.current < 0) press(session, false); }
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
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".ku-play")) return; // a button reached with Tab below the scene does its own job
    switch (session.phase) {
      case "title":
        if ((enter || hold) && fresh) { event.preventDefault(); if (begin() && hold) { keysDown.current.add(event.key); press(session, true); } }
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
        if (hold) { event.preventDefault(); if (fresh) { keysDown.current.add(event.key); press(session, true); } }
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

  // ---- touch and mouse on the scene: press anywhere to hold the nose up ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .ku-start, .ku-finish, .ku-sheet, .ku-cover")) return;
    back(session, "focus"); // a press on the scene means the window has focus
    if (event.button > 0 || finger.current !== -1 || session.picking) return;
    // The tap that brings you back only resumes; it never lifts the nose.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase === "story") { story.current.holdAt = performance.now(); finger.current = event.pointerId; return; }
    if (session.phase === "over") return;
    if (session.phase === "title" && !begin()) return;
    if (session.phase !== "flying") return;
    finger.current = event.pointerId;
    press(session, true);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    if (event.pointerId !== finger.current) return;
    finger.current = -1;
    if (session.phase === "story") {
      const held = story.current.holdAt >= 0;
      story.current.holdAt = -1;
      if (held && !cancelled) nextPanel();
      return;
    }
    if (!keysDown.current.size) press(session, false);
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
    if (result?.demo) { load(now.current.level, now.current.friend?.seed); return; }
    if (!sessionAgain(session, performance.now(), key)) return;
    const r = now.current.level, fresh = friendFits(r) ? now.current.friend!.seed : newSeed();
    if (fresh !== seed.current) { seed.current = fresh; const made = makeCourse(fresh, r); now.current.course = made; setCourse(made); if (scene.current) bindCourse(scene.current, made); }
    newRun();
    sound.throw(now.current.course.world);
    startWind();
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
  const card: Flight | null = result ? { ...result.flight, name: cleanName(name) } : null;
  const state = card ? sharedHash(card) : "";
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("কাগজের উড়োজাহাজ পয়েন্ট লজেন্স ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend?.kind === "flight" && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
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
  const friendHere = Boolean(friend) && levelOfShared(friend!) === level && friend!.seed === seed.current;
  const spec = levelOf(level), finale = isFinale(level);
  const heading = !result ? "" : result.demo ? (result.flight.landing ? "প্লেন নামল" : "পাতা ফুরিয়ে গেল")
    : !result.flight.landing ? "পাতা ফুরিয়ে গেল"
    : result.firstClear && finale ? `${spec.bar ?? spec.name} পার!`
    : result.flight.landing === 2 ? "ঠিক মাঝখানে!" : "প্লেন নামল";
  const outcome = result ? { landing: result.flight.landing, candies: result.flight.candies, total: result.total, goal: result.goal, meters: result.meters, full: result.full, crashes: result.crashes, level } : null;
  const note = result && outcome && !result.demo ? nearMiss({ ...outcome, bullMiss: result.bullMiss }) : "";
  const tallyLine = result?.milestone ? `এ পর্যন্ত ${bn(result.tally)}টা লজেন্স, ${bn(result.milestone)}-এর ধাপ পার।` : result?.record ? "এই লেভেলে এই ফোনে নতুন রেকর্ড।" : "";
  const versus = result && friendHere && friend && friend.kind === "flight" && !result.demo ? compareLine(result.flight.score, friend.score, friend.name) : "";
  const stats = result ? [
    { label: "দূরত্ব", value: result.meters, of: result.full, unit: "মি." },
    { label: "লজেন্স", value: result.flight.candies, of: result.total },
    { label: "সময়", value: result.time, unit: "সে.", tenths: true },
    { label: "পাতা বাকি", value: result.left, of: result.pages },
  ] : [];
  const badge = `${bn(level)} · ${spec.name}`;
  const nextLine = nextLevel ? `${levelOf(nextLevel).name}: ${levelOf(nextLevel).line.replace(/^শেষ লেভেল: /, "")}` : "";

  return (
    <div className="ku" data-phase={phase} data-look={look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="ku-play" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={event => onPointerUp(event, true)} onContextMenu={event => event.preventDefault()}>
        <canvas ref={canvas} role="img" aria-label="কাগজের উড়োজাহাজ উড়ছে। চেপে ধরলে নাক ওঠে, ছাড়লে নামে। লাল দাগে নামাও, পথে লজেন্স ধরো।" />

        {(phase === "flying" || phase === "paused") && (
          <button type="button" className="ku-badge" onClick={openList} aria-haspopup="dialog" aria-label={`${badge}, সব লেভেল দেখো`}>
            <i aria-hidden="true" />{badge}
          </button>
        )}

        {phase === "title" && booted && !result && (
          <StartCard level={level} targets={{ goal: course.goal, candies: course.candyCount }} stars={levels.stars[level] ?? 0}
            canPrev={level > 1} canNext={playableLevel(level + 1)} mode={mode}
            friend={friend} friendHere={friendHere} friendCanvas={friendPreview}
            onStart={() => { begin(); }} onPrev={() => load(level - 1)} onNext={() => load(level + 1)}
            onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, String(next)); sfx.tap(); }}
            onList={openList} />
        )}

        {phase === "story" && (
          <div className="ku-story" aria-live="polite">
            <p className="ku-skip">ধরে রাখো: বাদ দাও</p>
            <p className="ku-panel" key={panel}>{STORY[panel]}</p>
            <p className="ku-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === panel || undefined} />)}</p>
          </div>
        )}

        {phase === "paused" && !player.paused && !picking && (
          <div className="ku-cover">
            <p>থেমে আছে। প্লেনও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}

        {result && (phase === "over" || result.demo) && (
          <Finish countKey={result.run} heading={heading} stars={result.demo ? 0 : result.stars} stats={stats} slow={slow}
            line={tallyLine || (outcome ? resultLine(outcome) : "")} note={note} versus={versus} primary={primary} secondary={result.demo ? null : secondary} next={nextLine} onSeeCard={seeCard} />
        )}

        {picking && (
          <LevelList stars={levels.stars} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)}
            onPick={pickLevel => load(pickLevel)} onClose={closeList} />
        )}
        <p className="ku-sr" aria-live="polite">{phase === "over" && result ? `${heading}। ${bn(result.flight.candies)}টা লজেন্স, ${bn(result.flight.score)} পয়েন্ট। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
      </div>

      {card && result && (
        <section className="ku-result" id="result" ref={resultBox} aria-labelledby="ku-result-title">
          <h2 id="ku-result-title"><em>{bn(card.score)} পয়েন্ট</em>, {bn(card.candies)}টা লজেন্স</h2>
          <p>{levelLabel(card.level)} · {versus || (outcome ? resultLine(outcome) : "")}</p>
          <div className="ku-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ku-card-summary" />
              <figcaption id="ku-card-summary" className="ku-sr">কাগজের উড়োজাহাজ{card.name && ` · ${card.name}`}: {levelLabel(card.level)}, {bn(card.score)} পয়েন্ট, {bn(card.candies)}টা লজেন্স।</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ku-share">
              <label className="ku-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="kagojer-urojahaj.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই উড়ানটাই পাবে: একই লজেন্স, একই হাওয়া।" />
            </div>
          </div>
          <p className="ku-tally">{tally ? <>এ পর্যন্ত ধরা <b>{bn(tally)}টা লজেন্স</b>{nextMilestone(tally) ? ` · পরের ধাপ ${bn(nextMilestone(tally))}` : ""}</> : null}</p>
        </section>
      )}
    </div>
  );
}
