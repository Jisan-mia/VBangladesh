"use client";
// IP: what we avoided — no "-tris" or look-alike name; no seven-tetromino set (six cane strips of 2 to 4 cells, plus our own
// one-cell সুই and five-cell ডালা); no 10×20 well (ours is 8×14); no ghost piece (the warp threads glow instead); no next-piece
// box (the next strip lies as a tied bundle); none of the familiar seven colours (four natural cane dyes and gold); no
// flashing line clear (rows weave, bloom a নকশা and roll away); our own score numbers (10/25/45/70).
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, newSeed, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, cardLine, drawCard } from "../lib/draw-card";
import { addChips, drawScene, tickScene } from "../lib/draw.hot";
import { CLEAR, EVENT_RING, LOCK, RISE, ROLL, SPAWN, STUCK, SUI_IN } from "../lib/events";
import { createGame, headroom, wovenList, type Game } from "../lib/game";
import { bestSpot, nextButton, type Target } from "../lib/guide";
import { fastFall, letGo as releaseHand, makeHand, slideDir, type Hand } from "../lib/hand";
import { isFinale, levelOf, rowsToward, starsFor, DEFAULT_MODE, LEVEL_COUNT, MODES, STORY, WORLDS } from "../lib/levels";
import { bn, caption, compareLine, levelNear, matName, nearLine, parseShared, sharedHash, ROW_POINTS, type Shared } from "../lib/link";
import { COLOUR, COLS, TURNS } from "../lib/pieces";
import { afterClear, playable as canPlayLevel, readMode, readUnlock, recommended, BEST_KEY, INTRO_KEY, MODE_KEY, TOOL, UNLOCK_KEY } from "../lib/progress";
import { makeScene, type Scene } from "../lib/scene";
import {
  again as sessionAgain, away, back, cheerMayPlay, createSession, finish as sessionFinish, moving, pause as sessionPause, pick as sessionPick,
  reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, GUARD_MS, type Phase,
} from "../lib/session";
import { hardDrop, landing, move, rotate, tick, LEVEL_EVERY } from "../lib/step.hot";
import { Finish, type Choice } from "./finish";
import { CLASSIC_KEY, LevelSheet, LIST_KEYS } from "./level-sheet";
import { sound } from "./sound";
import { StartCard } from "./start-card";

/** Holding ◀ ▶ (or ← →) slides once at once, again after this long, then every REPEAT ms. */
const DELAY_MS = 150;
const REPEAT_MS = 45;
const SLOW_REPEAT_MS = 90;
/** A quick tap of নামাও drops straight down; a longer hold falls fast and stops. */
const TAP_MS = 180;
const HOLD_SKIP = 600;
const PANEL_MS = 3600;
const BEAT_MS = 820;
const TOGETHER = ["", "", "দুই সারি একসাথে", "তিন সারি একসাথে", "চার সারি একসাথে"];
type Action = "left" | "right" | "rotate" | "drop";
const KEYS: Record<string, Action> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "rotate", ArrowDown: "drop", a: "left", d: "right", w: "rotate", s: "drop", x: "rotate", A: "left", D: "right", W: "rotate", S: "drop", X: "rotate" };

type Result = Shared & {
  run: number; at: number; over: 1 | 2; stars: number; goal: number; bestClear: number; strips: number; seconds: number;
  rollsUsed: number; goldRows: number; record: boolean; before: number | null; firstClear: boolean;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

export function LoomGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(TOOL);
  const [slow] = useSlowMode();
  const [session] = useState(createSession);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [level, setLevel] = useState(1);
  const [unlock, setUnlock] = useState(1);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [panel, setPanel] = useState(0);
  const [booted, setBooted] = useState(false);
  const [woven, setWoven] = useState(0);
  const [glow, setGlow] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);

  const play = useRef<HTMLDivElement>(null);
  const frameBox = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const seed = useRef(1);
  const timers = useRef<number[]>([]);
  const heard = useRef(0);
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const listPaused = useRef(false);
  /** The player's menu is open: nothing starts, replays or falls under it (its game is inert, but a script's click() isn't). */
  const menuOpen = useRef(false);
  const target = useRef<Target | null>(null);
  // Every way of holding a control: keys, the four buttons, a finger on the frame. All let go together.
  const held = useRef<Hand>(makeHand());
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ level, unlock, mode, friend, result, slow, stars: levels.stars, best });
  now.current = { level, unlock, mode, friend, result, slow, stars: levels.stars, best };

  const row = levelOf(level), world = WORLDS[row.world];
  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  // Dev only: lets the Orca autopilot read and drive the run (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __pb: unknown }).__pb = { session, game, scene, held, bestSpot, run: (steps: number) => { for (let i = 0; i < steps; i++) stepRef.current(1 / 60); drawRef.current(); } }; }, []);
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const letGo = () => releaseHand(held.current);
  const friendFits = (to: number) => Boolean(now.current.friend) && (now.current.friend!.level ?? 0) === to;
  const playableLevel = (to: number) => canPlayLevel(to, now.current.unlock, now.current.stars, now.current.friend ? now.current.friend.level ?? 0 : -1);

  function hudFor(played: Game) {
    const view = scene.current;
    if (!view) return;
    view.pointsText = bn(played.score);
    view.two = played.row.two; view.three = played.row.three;
    view.finaleText = isFinale(played.level) ? WORLDS[played.row.world].finale : "";
  }
  function bind(played: Game) {
    game.current = played;
    heard.current = played.eventCount;
    hudFor(played);
    setWoven(played.rows);
    target.current = null;
    setGlow(0);
  }

  // ---- choosing a পাটি: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: number, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    letGo();
    sessionReset(session);
    listPaused.current = false;
    seed.current = nextSeed;
    now.current.level = to;
    setLevel(to);
    bind(createGame(nextSeed, to, MODES[now.current.mode].rolls, now.current.slow));
    setResult(null);
    sync();
  }
  const home = () => load(now.current.friend ? now.current.friend.level ?? 0 : recommended(now.current.unlock, now.current.stars));

  function newRun() {
    clearTimers();
    bind(createGame(seed.current, now.current.level, MODES[now.current.mode].rolls, now.current.slow));
    letGo();
    setResult(null);
    if (scene.current) scene.current.spawnAt = performance.now();
    aim();
  }
  /** বোনা শুরু, the first key or tap: a fresh run of the পাটি on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !story.current.seen && !now.current.friend && now.current.level === 1;
    if (menuOpen.current || !sessionStart(session, firstStory, performance.now())) return false;
    newRun();
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    else sound.begin(levelOf(now.current.level).world);
    sync();
    return true;
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    sound.begin(levelOf(now.current.level).world);
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sound.tap(); return current + 1; });
  }

  function pause() { letGo(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) sync(); }
  function openList() {
    if (session.phase === "playing" || session.phase === "story") { listPaused.current = true; letGo(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the frame; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this পাটি from its title.
  const player = useGamePlayer({
    onPause: () => pause(),
    onResume: () => resume(),
    onRestart: () => load(now.current.level),
  });
  const inPlayer = player.stage.width > 0;
  menuOpen.current = player.paused;

  /** পাটি 1 and 2: the button you need next glows. */
  function aim() {
    const played = game.current;
    if (!played || !played.row.guide) { if (glow) setGlow(0); return; }
    if (!target.current) target.current = bestSpot(played);
    setGlow(nextButton(played, target.current));
  }

  // ---- the end of a run ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    letGo();
    setGlow(0);
    if (scene.current) scene.current.floatAt = -1;
    const to = played.level, stars = starsFor(to, played.rows, played.score);
    const firstClear = to > 0 && stars > 0 && !now.current.stars[to];
    // Stars and the unlock are recorded here, at the moment of the result, never in a timer a quick tap could cancel.
    if (to && stars) {
      levels.record(to, stars);
      const opened = afterClear(now.current.unlock, to);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
    }
    const before = now.current.best, record = to === 0 && played.score > 0 && submitBest(played.score) && before !== null;
    const done: Result = {
      seed: seed.current, score: played.score, rows: played.rows, pattern: wovenList(played), name: "", ...(to ? { level: to } : {}),
      run: session.run, at, over: played.over as 1 | 2, stars, goal: played.row.goal, bestClear: played.bestClear, strips: played.strips,
      seconds: Math.round(played.t / 1000), rollsUsed: played.rollsUsed, goldRows: played.goldRows, record, before, firstClear,
    };
    now.current.result = done;
    setResult(done);
    sync();
    // Confetti only for three stars, a new best, or a finale's first clear; a plain clear gets the stars' own notes.
    const run = session.run, party = (to && stars === 3) || record || (firstClear && isFinale(to));
    if (played.over === 2) { sound.lose(); }
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { if (record) sound.win(); else sound.levelUp(); if (!now.current.slow) confetti(); }
    }, stars ? 1000 : 300);
  }

  /** Sounds and juice for what just happened. */
  function listen(played: Game) {
    const view = scene.current, at = performance.now();
    for (; heard.current < played.eventCount; heard.current++) {
      const index = (heard.current % EVENT_RING) * 4, events = played.events;
      const type = events[index], a = events[index + 1], b = events[index + 2], c = events[index + 3];
      if (type === LOCK) {
        sound.rustle();
        if (b) { sound.plonk(); if (view) { view.bumpAt = at; } }
        if (view && !now.current.slow && b) addChips(view, view.wellX + played.x * view.cell, view.wellY + (played.y + 1) * view.cell, view.cell * 2, COLOUR[a], 4);
      } else if (type === CLEAR) {
        const count = a, gold = b === 1, points = ROW_POINTS[count] * (gold ? 2 : 1);
        sound.weave(count, gold);
        if (played.streak >= 2) sound.combo(played.streak - 2);
        if (view) {
          view.pointsText = bn(played.score);
          view.floatAt = at; view.floatText = `+${bn(points)}`;
          const classicMat = !played.row.goal && matName(played.rows) !== matName(played.rows - count) ? matName(played.rows) : "";
          const faster = !played.row.goal && Math.floor(played.rows / LEVEL_EVERY) > Math.floor((played.rows - count) / LEVEL_EVERY);
          view.floatSub = classicMat ? `${classicMat} হলো` : count > 1 ? TOGETHER[count] : gold ? "সোনালি সারি, দ্বিগুণ" : faster ? "গতি বাড়ল" : "";
          view.floatY = view.wellY + (c - (count - 1) / 2 + 0.4) * view.cell;
          if (!now.current.slow) for (let i = 0; i < count; i++) addChips(view, view.wellX, view.wellY + (c - i) * view.cell, view.wellW, gold ? 5 : 1 + ((c + i) % 4), 7);
          if (classicMat) { sound.win(); if (!now.current.slow) confetti({ count: 60 }); } else if (faster) sound.levelUp();
        }
        setWoven(played.rows);
        if (!now.current.slow) buzz(count > 1 ? 18 : 10);
      } else if (type === SPAWN) {
        if (view) view.spawnAt = at;
        target.current = null;
        aim();
      } else if (type === RISE) {
        sound.rise();
        if (view) view.riseAt = at;
        target.current = null;
      } else if (type === ROLL) {
        sound.roll();
        if (view) view.rollAt = at;
      } else if (type === SUI_IN) {
        sound.ting();
        if (view && !now.current.slow) addChips(view, view.wellX + a * view.cell, view.wellY + b * view.cell, view.cell, 1, 5);
      } else if (type === STUCK) {
        sound.stuck();
        if (view) view.stuckAt = at;
      }
    }
  }

  // ---- the controls: every one acts on the press ----
  function act(action: Action, source: "key" | "button" | "touch") {
    const played = game.current, view = scene.current, at = performance.now();
    if (!played || session.phase !== "playing" || session.picking) return;
    if (action === "rotate") { if (rotate(played)) { sound.creak(); if (view) view.turnAt = at; } else if (!played.wet) sound.knock(); }
    else if (action === "drop") {
      if (source === "button") { held.current.softBtn = true; held.current.softAt = at; held.current.softStrip = played.strips; }
      else if (source === "key") held.current.softKey = true;
    } else {
      const dx = action === "left" ? -1 : 1;
      if (move(played, dx)) sound.nudge(); else { sound.knock(); if (view) { view.knockAt = at; view.knockDir = dx; } }
      if (source !== "touch") { if (source === "key") held.current.keyDir = dx; else held.current.btnDir = dx; held.current.das = DELAY_MS; }
    }
    aim();
  }
  function drop() {
    const played = game.current, view = scene.current;
    if (!played || session.phase !== "playing" || session.picking || !played.live) return;
    const top = played.y, bottom = landing(played), cells = TURNS[played.kind][played.turn];
    let left = COLS, right = 0;
    for (let i = 0; i < cells.length; i += 2) { left = Math.min(left, played.x + cells[i]); right = Math.max(right, played.x + cells[i] + 1); }
    if (!hardDrop(played)) return;
    if (view) { view.dropAt = performance.now(); view.dropX = left; view.dropW = right - left; view.dropTop = top; view.dropBottom = bottom + 1; }
  }

  const step = (dt: number) => {
    const at = performance.now(), played = game.current, hand = held.current;
    if (session.phase === "story" && !session.picking) {
      story.current.clock += dt * 1000;
      if (story.current.holdAt >= 0 && at - story.current.holdAt >= HOLD_SKIP) { story.current.holdAt = -1; endStory(); }
      else if (story.current.clock >= PANEL_MS) nextPanel();
    }
    if (played && !played.over && !menuOpen.current && moving(session, at)) {
      const ms = dt * 1000, dir = slideDir(hand);
      if (dir) {
        hand.das -= ms;
        while (hand.das <= 0) { if (move(played, dir)) sound.nudge(); hand.das += now.current.slow ? SLOW_REPEAT_MS : REPEAT_MS; }
      }
      tick(played, ms, fastFall(hand));
      listen(played);
      if (headroom(played.board) <= 4 && scene.current && at - scene.current.beatAt > BEAT_MS) { scene.current.beatAt = at; sound.beat(); }
      if (played.over) finishRun(played);
    }
    if (scene.current) tickScene(scene.current, dt);
  };
  const draw = () => {
    const view = scene.current;
    if (!view) return;
    view.now = performance.now();
    drawScene(view, game.current, now.current.slow, session.phase !== "title");
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;
  // Frames run only while strips fall or the story plays; every other screen is one still frame.
  useGameLoop(step, draw, (phase === "playing" || phase === "story") && !picking);

  // ---- the canvas: rebuilt for its size and the world ----
  useEffect(() => {
    const element = frameBox.current;
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
    scene.current = makeScene(element, size.width, size.height, world.look, world.motif, scene.current);
    if (game.current) hudFor(game.current);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("পাটি বুনি ০১২৩৪৫৬৭৮৯ বরফি নকশা লতাপাতা শাপলা দুই তিন চার সারি একসাথে").then(() => { if (!cancelled) drawRef.current(); }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, world.look, world.motif]);
  // ধীরে খেলো reaches the run at once.
  useEffect(() => { if (game.current) game.current.slow = slow; }, [slow]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), গোটানো mode, the story flag, then a friend's পাটি or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars, read(BEST_KEY));
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    story.current.seen = read(INTRO_KEY) === "1";
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-run stops it: its title shows.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      load(shared.level ?? 0, shared.seed);
      return true;
    };
    if (!fromHash()) load(recommended(mine, levels.stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- away: blur, a hidden tab and the frame scrolled off pause the run and let go of every key and finger ----
  useEffect(() => {
    const blur = () => { letGo(); away(session, "blur"); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { letGo(); away(session, "hide"); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    const box = play.current;
    const observer = box ? new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.5) back(session, "scroll");
      else { letGo(); away(session, "scroll"); sync(); }
    }, { threshold: [0, 0.5, 1] }) : null;
    if (box) observer!.observe(box);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      observer?.disconnect();
      clearTimers();
    };
  }, []);

  // ---- keys, at the window ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const action = KEYS[event.key], hand = held.current;
    if (event.type === "keyup") {
      if (action === "left" && hand.keyDir === -1) hand.keyDir = 0;
      if (action === "right" && hand.keyDir === 1) hand.keyDir = 0;
      if (action === "drop") hand.softKey = false;
      if ((event.key === " " || event.key === "Enter") && session.phase === "story" && story.current.holdAt >= 0) { story.current.holdAt = -1; nextPanel(); }
      return;
    }
    if (player.paused) return;
    back(session, "focus"); // a key that reaches the page means the window has focus
    const enter = event.key === "Enter" || event.key === " ", fresh = !event.repeat;
    if (session.picking) {
      const index = LIST_KEYS.indexOf(event.key as typeof LIST_KEYS[number]);
      if (index >= 0 && fresh && playableLevel(index + 1)) { event.preventDefault(); load(index + 1); }
      else if (event.key.toLowerCase() === CLASSIC_KEY && fresh) { event.preventDefault(); load(0); }
      return;
    }
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".pb-play")) return; // a button reached with Tab below the stage does its own job
    switch (session.phase) {
      case "title":
        if ((enter || action) && fresh) { event.preventDefault(); begin(); }
        return;
      case "story":
        if (enter) { event.preventDefault(); if (fresh) story.current.holdAt = performance.now(); }
        return;
      case "paused":
        if (enter || action) { event.preventDefault(); if (fresh) resume(); }
        return;
      case "over":
        if (enter) { event.preventDefault(); if (fresh) takePrimary({ at: event.timeStamp, repeat: event.repeat }); }
        return;
      default:
        if (action) {
          event.preventDefault();
          // Our own repeat drives a held arrow; the keyboard's repeats are ignored.
          if (fresh) act(action, "key");
        } else if (event.key === " ") { event.preventDefault(); if (fresh) drop(); }
        else if (event.key === "Enter") event.preventDefault();
        else if ((event.key === "p" || event.key === "P") && fresh) { event.preventDefault(); if (inPlayer) player.requestPause(); else pause(); }
    }
  };
  useEffect(() => {
    const listenKey = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listenKey);
    window.addEventListener("keyup", listenKey);
    return () => { window.removeEventListener("keydown", listenKey); window.removeEventListener("keyup", listenKey); };
  }, []);

  // ---- touch and mouse on the frame: drag sideways to slide, tap to turn, flick down to drop ----
  function onFrameDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .pb-start, .pb-finish, .pb-sheet")) return;
    const hand = held.current;
    back(session, "focus"); // a tap on the frame means the window has focus
    if (event.button > 0 || hand.touch !== -1 || session.picking) return;
    // The tap that brings you back only resumes; it never moves the strip.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase === "story") { story.current.holdAt = performance.now(); hand.touch = event.pointerId; return; }
    if (session.phase === "title") { begin(); return; }
    if (session.phase !== "playing") return;
    Object.assign(hand, { touch: event.pointerId, startX: event.clientX, startY: event.clientY, startAt: performance.now(), cols: 0, dragged: false, down: false });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
  }
  function onFrameMove(event: ReactPointerEvent<HTMLDivElement>) {
    const hand = held.current, view = scene.current;
    if (event.pointerId !== hand.touch || session.phase !== "playing" || !view) return;
    const dx = event.clientX - hand.startX, dy = event.clientY - hand.startY, step = view.cell * 0.85;
    if (!hand.down && Math.abs(dx) > 10) hand.dragged = true;
    if (hand.dragged) {
      const cols = Math.trunc(dx / step);
      while (hand.cols < cols) { act("right", "touch"); hand.cols++; }
      while (hand.cols > cols) { act("left", "touch"); hand.cols--; }
    } else if (dy > 24 && dy > Math.abs(dx) * 1.5) { hand.down = true; hand.softTouch = true; }
  }
  function onFrameUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const hand = held.current;
    if (event.pointerId !== hand.touch) return;
    if (session.phase === "story") {
      const was = story.current.holdAt >= 0;
      story.current.holdAt = -1; hand.touch = -1;
      if (was && !cancelled) nextPanel();
      return;
    }
    const quick = performance.now() - hand.startAt < 260, dy = event.clientY - hand.startY;
    if (!cancelled && session.phase === "playing") {
      if (hand.down && quick && dy > 40) drop();
      else if (!hand.dragged && !hand.down && quick) act("rotate", "touch");
    }
    Object.assign(hand, { touch: -1, dragged: false, down: false, softTouch: false });
  }
  // The four buttons react on touch-down, keep working while another thumb holds a different one, and a keyboard "click" (detail 0) still works.
  function press(action: Action) {
    if (session.phase === "title") { begin(); return; }
    if (session.phase === "paused") { resume(); return; }
    act(action, "button");
  }
  function release(action: Action) {
    const hand = held.current;
    if (action === "left" && hand.btnDir === -1) hand.btnDir = 0;
    if (action === "right" && hand.btnDir === 1) hand.btnDir = 0;
    if (action !== "drop" || !hand.softBtn) return;
    hand.softBtn = false;
    // A quick tap puts the same strip straight down; a long hold was a fast fall and just stops.
    if (performance.now() - hand.softAt < TAP_MS && game.current?.strips === hand.softStrip) drop();
  }
  const control = (action: Action) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      back(session, "focus");
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* fine */ }
      press(action);
    },
    onPointerUp: () => release(action),
    onPointerCancel: () => release(action),
    onLostPointerCapture: () => release(action),
    onClick: (event: { detail: number }) => { if (event.detail === 0) { press(action); release(action); } },
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
  });
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- the end screen's choices ----
  const nextLevel = result && result.stars && level && level < LEVEL_COUNT && playableLevel(level + 1) ? level + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (menuOpen.current || !sessionAgain(session, performance.now(), key)) return;
    seed.current = friendFits(now.current.level) ? now.current.friend!.seed : newSeed();
    newRun();
    sound.begin(levelOf(now.current.level).world);
    sync();
  }
  const guardOk = (key?: { at: number; repeat: boolean }) => {
    const r = now.current.result;
    return Boolean(r) && performance.now() - r!.at >= GUARD_MS && (!key || (!key.repeat && key.at > r!.at));
  };
  const primary: Choice = nextLevel ? { label: "পরের পাটি", run: () => { if (guardOk()) load(nextLevel); } } : { label: "আবার খেলো", run: () => again() };
  const secondary: Choice | null = nextLevel ? { label: "আবার খেলো", run: () => again() } : { label: "সব পাটি", run: () => { if (guardOk()) openList(); } };
  function takePrimary(key: { at: number; repeat: boolean }) {
    if (nextLevel) { if (guardOk(key)) load(nextLevel); }
    else again(key);
  }

  // ---- cards ----
  const card: Shared | null = result ? { seed: result.seed, score: result.score, rows: result.rows, pattern: result.pattern, name: cleanName(name), ...(result.level ? { level: result.level } : {}) } : null;
  const state = card ? sharedHash(card) : "";
  const cardData = card ? { ...card, stars: result?.stars ?? 0 } : null;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("পাটি বুনি ১২৩৪ সারি পয়েন্ট ★").then(() => {
      if (cancelled) return;
      if (cardData && preview.current) drawCard(preview.current, cardData, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws but the stars; phase brings the friend's canvas back with the title.
  }, [state, format, site, friend, phase, result?.stars]);
  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the screens say ----
  const friendHere = Boolean(friend) && (friend!.level ?? 0) === level;
  const heading = !result ? "" : !result.level ? "আর জায়গা নেই!"
    : result.over === 2 ? "ফ্রেম ভরে গেল"
    : result.firstClear && isFinale(result.level) ? `${row.name} পুরো হলো!` : `${row.name} বোনা হলো`;
  const note = !result ? "" : result.level ? levelNear(result.level, result.rows, result.score, result.stars) : nearLine(result.score, result.rows, result.before);
  const versus = result && friendHere && friend ? compareLine(result.score, friend.score, friend.name) : "";
  const line = !result ? "" : !result.level ? (result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && best > result.score ? `এই ফোনে সেরা ${bn(best)}` : "")
    : nextLevel && result.firstClear ? `খুলল পাটি ${bn(nextLevel)}: ${levelOf(nextLevel).name}` : result.rollsUsed ? `${bn(result.rollsUsed)} বার গোটাতে হয়েছে।` : "";
  const stats = result ? [
    { label: "সারি", value: rowsToward(result.rows, result.goal), ...(result.goal ? { of: result.goal } : {}) },
    { label: "পয়েন্ট", value: result.score },
    { label: "একসাথে সেরা", value: result.bestClear, unit: " সারি" },
    { label: "ফালি", value: result.strips },
  ] : [];
  const badge = level ? `${bn(level)} · ${row.name}` : row.name;
  const goalText = row.goal ? `${bn(rowsToward(woven, row.goal))}/${bn(row.goal)} সারি` : `${bn(woven)} সারি`;
  const canControl = phase === "playing" || phase === "title" || phase === "paused";

  return (
    <div className="pb" data-phase={phase} data-look={world.look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="pb-play">
        <div ref={frameBox} className="pb-frame" onPointerDown={onFrameDown} onPointerMove={onFrameMove} onPointerUp={onFrameUp} onPointerCancel={event => onFrameUp(event, true)}>
          <canvas ref={canvas} role="img" aria-label={`পাটির ফ্রেম, ৮ ঘর চওড়া। ওপর থেকে বেতের ফালি নামে। ${goalText}।`} />

          {(phase === "playing" || phase === "paused" || phase === "over") && (
            <button type="button" className="pb-badge" data-finale={isFinale(level) || undefined} onClick={openList} aria-haspopup="dialog" aria-label={`${badge}, ${goalText}। সব পাটি দেখো`}>
              <i aria-hidden="true" /><span>{badge}</span><small>{goalText}</small>
            </button>
          )}

          {phase === "title" && booted && (
            <StartCard level={level} stars={level ? levels.stars[level] ?? 0 : 0} mode={mode}
              canPrev={level > 1} canNext={level > 0 && level < LEVEL_COUNT && playableLevel(level + 1)}
              friend={friend} friendHere={friendHere} friendCanvas={friendPreview} best={best}
              onStart={() => { begin(); }} onPrev={() => load(level - 1)} onNext={() => load(level + 1)}
              onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, String(next)); sound.tap(); load(now.current.level, seed.current); }}
              onList={openList} onHome={home} />
          )}

          {phase === "story" && (
            <div className="pb-story" aria-live="polite">
              <p className="pb-skip">ধরে রাখো: বাদ দাও</p>
              <p className="pb-panel" key={panel}>{STORY[panel]}</p>
              <p className="pb-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === panel || undefined} />)}</p>
            </div>
          )}

          {phase === "paused" && !player.paused && !picking && (
            <div className="pb-cover">
              <p>থেমে আছে। ফালিও থেমে আছে।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          )}

          {phase === "over" && result && (
            <Finish countKey={result.run} heading={heading} stars={result.stars} showStars={Boolean(result.level)} stats={stats} slow={slow}
              line={line} note={note} versus={versus} primary={primary} secondary={secondary} onSeeCard={seeCard} />
          )}

          {picking && (
            <LevelSheet stars={levels.stars} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)} best={best}
              onPick={to => load(to)} onClose={closeList} />
          )}
          <p className="pb-sr" aria-live="polite">{phase === "over" && result ? `${heading}। ${bn(result.rows)} সারি, ${bn(result.score)} পয়েন্ট। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
        </div>

        <div className="pb-controls" data-off={!canControl || undefined}>
          <button type="button" className="pb-key" aria-label="বাঁয়ে সরাও" data-glow={glow === 1 || undefined} {...control("left")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          </button>
          <button type="button" className="pb-key" data-glow={glow === 2 || undefined} {...control("rotate")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.6-5.4" /><path d="M19 4v4h-4" /></svg>ঘোরাও
          </button>
          <button type="button" className="pb-key" aria-label="ডানে সরাও" data-glow={glow === 3 || undefined} {...control("right")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <button type="button" className="pb-key" data-glow={glow === 4 || undefined} {...control("drop")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14M6 12l6 6 6-6" /></svg>নামাও
          </button>
        </div>
      </div>

      {card && cardData && result && (
        <section className="pb-result" id="result" ref={resultBox} aria-labelledby="pb-result-title">
          <h2 id="pb-result-title"><em>{bn(card.rows)} সারি</em> বোনা পাটির কার্ড</h2>
          <p>{level ? `পাটি ${bn(level)} · ${row.name}` : row.name} · {versus || cardLine(cardData)}</p>
          <div className="pb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pb-card-summary" />
              <figcaption id="pb-card-summary" className="pb-sr">পাটি বুনির কার্ড: {card.name && `${card.name}, `}{bn(card.rows)} সারি, {bn(card.score)} পয়েন্ট। {cardLine(cardData)}</figcaption>
              {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pb-share">
              <label className="pb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="pati-buni.png" makeImage={() => cardBlob(cardData, format, site)} imageKey={`${state}|${format}|${result.stars}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক একই ফালি একই ক্রমে পাবে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
