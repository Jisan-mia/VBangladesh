"use client";
// IP: what we avoided — no name, logo, colours, sounds or look from the old phone game with the falling ball; no red ball, no spike rows, no LCD style. Ours is a glass marble on stair steps, brick parapets and bamboo planks, a striped awning edge at the top and clay cactus pots, all drawn fresh from plain shapes.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, newSeed, sfx, shake, soundOn, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { drawFrame, tickScene } from "../lib/draw.hot";
import { bestDrop, makeFloor } from "../lib/gen";
import { colourFor, isFinale, levelOf, openColours, DEFAULT_MODE, LEVEL_COUNT, MARBLES, MODES, STORY } from "../lib/levels";
import {
  bn, caption, compareLine, floorLabel, floorLine, floorName, nearMiss, oldLine, oldNearMiss, parseShared, seconds, sharedHash, stageName, reachedStage, type Shared,
} from "../lib/link";
import {
  afterClear, floorBestSlug, migrateLadder, oldBestSlug, playable as canPlayLevel, readMode, readUnlock, recommended,
  COLOUR_KEY, INTRO_KEY, LADDER, LADDER_KEY, MODE_KEY, OLD_LEVELS_KEY, TOOL, UNLOCK_KEY,
} from "../lib/progress";
import { createEndless, createGame, extend, starsOf, stepsOf, BONUS, CACTUS, CRACKED, GUST, HURT, LAND, PICK, SURGED, TOP_HIT, WIN, type Endless, type Game } from "../lib/game";
import { lookOf, makeScene, type Scene } from "../lib/scene";
import {
  again as sessionAgain, away, back, cheerMayPlay, menu as sessionMenu, createSession, finish as sessionFinish, humStep, moving, pause as sessionPause, pick as sessionPick,
  reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, GUARD_MS, type Phase,
} from "../lib/session";
import { stepGame } from "../lib/step.hot";
import { direction, lift as liftHand, makeHands, press as pressHand, release as releaseHand } from "../lib/hands";
import { Finish, type Choice, type Stat } from "./finish";
import { FloorList, LIST_KEYS } from "./floor-list";
import { rollHum, sound } from "./sound";
import { StartCard } from "./start-card";

/** ধীরে খেলো runs the stairs and the marble at this speed together. */
const SLOW_TIME = 0.75;
const HOLD_SKIP = 600;
const PANEL_MS = 3600;

/** A floor of the new ladder, or an old link's endless stairs from old stage 1..8. */
type Where = { level: number } | { stage: number };
type Result = {
  card: Shared; run: number; at: number; won: boolean; stars: number; falls: number; steps: number; of: number; tenths: number;
  picks: number; bestStreak: number; chances: number; most: number; record: boolean; best: number | null; firstClear: boolean; fresh: number;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const levelIn = (where: Where) => "level" in where ? where.level : 0;
const whereOf = (card: Shared): Where => card.v === 2 ? { level: card.level } : { stage: card.stage };
const sameWhere = (a: Where, b: Where) => ("level" in a && "level" in b && a.level === b.level) || ("stage" in a && "stage" in b && a.stage === b.stage);

export function MarbleGame() {
  // Before the ladder is first read (this effect runs before useLevels' own): the old stages' stars move over, once.
  useEffect(() => {
    const moved = migrateLadder(read(LADDER_KEY), read(OLD_LEVELS_KEY));
    if (moved) write(LADDER_KEY, moved);
  }, []);
  const levels = useLevels(LADDER, LEVEL_COUNT);
  const [slow] = useSlowMode();
  const [session] = useState(createSession);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [where, setWhere] = useState<Where>({ level: 1 });
  const [unlock, setUnlock] = useState(1);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [colour, setColourState] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [shown, setShown] = useState(false);
  const [panel, setPanel] = useState(0);
  const [booted, setBooted] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const [preview, setPreview] = useState(false);
  const level = levelIn(where);
  const [best, submitBest] = useBest(level ? floorBestSlug(level) : oldBestSlug("stage" in where ? where.stage : 1), !level);

  const play = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const previewCanvas = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const endless = useRef<Endless | null>(null);
  const seed = useRef(1);
  const timers = useRef<number[]>([]);
  const hum = useRef<ReturnType<typeof rollHum> | null>(null);
  const humLive = useRef(false);
  const finishAt = useRef(-1);
  const shownAt = useRef(0);
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const listPaused = useRef(false);
  // Held sides, counted on press and release (never per frame): pointers on the board and the arrow keys.
  const held = useRef(makeHands());
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ where, unlock, mode, colour, friend, result, slow, stars: levels.stars, shown });
  now.current = { where, unlock, mode, colour, friend, result, slow, stars: levels.stars, shown };

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  // Dev only: lets the Orca autopilot read the run (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __ms: unknown }).__ms = { session, game, scene, held, hum, now, bestDrop, press, lift, load: (level: number) => load({ level }) }; }, []);
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopHum = () => { hum.current?.stop(); hum.current = null; humLive.current = false; };
  const startHum = () => { stopHum(); hum.current = rollHum(); humLive.current = soundOn(); };
  const release = () => releaseHand(held.current);
  const press = (id: string, side: -1 | 1) => pressHand(held.current, id, side);
  const lift = (id: string) => liftHand(held.current, id);
  const friendFits = (to: Where) => Boolean(now.current.friend) && sameWhere(whereOf(now.current.friend!), to);
  const playableLevel = (at: number) => canPlayLevel(at, now.current.unlock, now.current.stars, now.current.friend?.v === 2 ? now.current.friend.level : 0);
  function setColour(next: number) { setColourState(next); now.current.colour = next; write(COLOUR_KEY, String(next)); }

  /** A fresh run of the stairs on screen, from the seed: the floor's own ledges, or the old endless stairs. */
  function freshGame() {
    const to = now.current.where, chances = MODES[now.current.mode].chances;
    if ("level" in to) {
      const rows = makeFloor(seed.current, to.level);
      endless.current = null;
      game.current = createGame(seed.current, rows, rows.length - 1, chances);
    } else {
      endless.current = createEndless(seed.current, to.stage, chances);
      game.current = endless.current.game;
    }
    if (scene.current) scene.current.game = game.current;
    finishAt.current = -1;
  }

  // ---- choosing a floor: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: Where, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    stopHum();
    release();
    sessionReset(session);
    listPaused.current = false;
    seed.current = nextSeed;
    now.current.where = to;
    setWhere(to);
    freshGame();
    setResult(null); setShown(false);
    sync();
  }
  const home = () => load({ level: recommended(now.current.unlock, now.current.stars) });

  /** গড়াও, an arrow, Space: a fresh run of the floor on screen (the story first, the very first time). */
  function begin() {
    const firstStory = !story.current.seen && !now.current.friend && levelIn(now.current.where) === 1;
    if (!sessionStart(session, firstStory, performance.now())) return false;
    clearTimers();
    freshGame();
    release();
    setResult(null); setShown(false);
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    else { startHum(); sound.start(levelOf(levelIn(now.current.where) || 1).world); }
    sync();
    return true;
  }
  function endStory() {
    if (!storyDone(session, performance.now())) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    startHum();
    sound.start(0);
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sfx.tap(); return current + 1; });
  }

  function pause() { release(); stopHum(); story.current.holdAt = -1; if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) { release(); if (session.phase === "playing") startHum(); sync(); } }
  function openList() {
    if (session.phase === "playing" || session.phase === "story") { listPaused.current = true; release(); stopHum(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the stairs; চালিয়ে যাও brings them back after a breath; নতুন করে শুরু replays this floor from its title.
  const player = useGamePlayer({
    onPause: () => { sessionMenu(session, true); pause(); },
    onResume: () => { sessionMenu(session, false); resume(); },
    onRestart: () => { sessionMenu(session, false); load(now.current.where); },
  });
  const inPlayer = player.stage.width > 0;

  // ---- the end of a floor ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopHum();
    release();
    const to = now.current.where, at12 = levelIn(to), won = played.over === 1, stars = starsOf(played);
    const tenths = Math.max(1, Math.round(played.t * 10));
    const firstClear = at12 > 0 && won && !now.current.stars[at12];
    let fresh = -1;
    if (at12 && won) {
      levels.record(at12, stars);
      const opened = afterClear(now.current.unlock, at12);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
      const colourHere = colourFor(at12);
      if (firstClear && colourHere > 0) { fresh = colourHere; setColour(colourHere); }
    }
    const before = best;
    const record = at12 ? won && submitBest(tenths) && before !== null : stepsOf(played) > 0 && submitBest(stepsOf(played)) && before !== null;
    const card: Shared = at12
      ? { v: 2, seed: seed.current, level: at12, tenths, marbles: Math.min(played.picks, levelOf(at12).steps), falls: Math.min(9, played.falls), colour: now.current.colour, name: "" }
      : { v: 1, seed: seed.current, stage: (to as { stage: number }).stage, score: Math.min(9999, stepsOf(played)), marbles: Math.min(played.picks, stepsOf(played)), colour: now.current.colour, name: "" };
    if (fresh > 0) card.colour = fresh;
    const done: Result = {
      card, run: session.run, at, won, stars, falls: played.falls, steps: stepsOf(played), of: played.steps, tenths, picks: played.picks,
      bestStreak: played.bestStreak, chances: played.chances, most: played.most, record, best: before, firstClear, fresh,
    };
    now.current.result = done;
    setResult(done); setShown(false);
    sync();
    const run = session.run, finalFloor = at12 === LEVEL_COUNT && won, party = won && (stars === 3 || record || (firstClear && isFinale(at12)));
    // The last floor's marble rolls into the hole first; the card waits for it.
    if (finalFloor) sound.hole();
    later(() => { if (session.phase !== "over" || session.run !== run) return; setShown(true); now.current.shown = true; shownAt.current = performance.now(); }, finalFloor && !now.current.slow ? 1900 : 550);
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { if (record) sfx.win(); else sfx.levelUp(); if (!now.current.slow) confetti({ colors: ["#2e7d6b", "#d64545", "#e8b923", "#3a9bd8", "#ffffff"] }); }
      else if (!won) sound.lose();
    }, won ? (finalFloor ? 2600 : 1300) : 500);
  }

  /** Sounds and juice for what just happened this step. */
  function listen(played: Game) {
    const events = played.events, view = scene.current, at = performance.now() / 1000;
    if (!events) return;
    if (events & HURT) {
      if (played.hurt === CACTUS) sound.oof(); else if (played.hurt === TOP_HIT) sound.awning(); else { sfx.drop(); sfx.whoosh(); }
      if (view) view.hitAt = at;
      if (!now.current.slow) shake(play.current);
    } else if (events & LAND) sound.land(played.impact);
    if (events & PICK) { sound.ting(played.streak - 1); if (view) { view.pickAt = at; view.pickX = played.pickX; view.pickY = played.pickY; } }
    if (events & BONUS) { sound.bonus(); if (view) view.bonusAt = at; }
    if (events & CRACKED) sound.crack();
    if (events & GUST) sound.gust();
    if (events & SURGED) sound.whistle();
    if (events & WIN) { sound.floor(levelOf(levelIn(now.current.where) || 1).world); finishAt.current = at; }
  }

  const step = (dt: number) => {
    const at = performance.now(), played = game.current, calm = now.current.slow;
    if (session.phase === "story" && !session.picking) {
      story.current.clock += dt * 1000;
      if (story.current.holdAt >= 0 && at - story.current.holdAt >= HOLD_SKIP) { story.current.holdAt = -1; endStory(); }
      else if (story.current.clock >= PANEL_MS) nextPanel();
    }
    const live = Boolean(played && !played.over && moving(session, at));
    if (played && live) {
      stepGame(played, dt * (calm ? SLOW_TIME : 1), direction(held.current));
      if (endless.current) extend(endless.current);
      listen(played);
      if (played.over) finishRun(played);
    }
    // The roll hum comes back whenever sound does (a loop made while muted is a silent stub, so it is made anew).
    const move = humStep(humLive.current, live && !played?.over, soundOn());
    if (move === "start") startHum(); else if (move === "stop") stopHum();
    if (played) hum.current?.update(played.speed, played.vx, played.on >= 0 && played.wait === 0);
    if (scene.current) tickScene(scene.current, dt, calm);
  };
  const draw = () => {
    const view = scene.current;
    if (!view) return;
    view.hud = session.phase !== "title";
    drawFrame(view, game.current, now.current.slow, performance.now() / 1000, finishAt.current);
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  // The board moves on every screen but the pause and a choice; in ধীরে খেলো only while rolling.
  useGameLoop(step, draw, phase !== "paused" && !picking && (!slow || phase === "playing" || phase === "story" || (phase === "over" && !shown)));

  // ---- the canvas: rebuilt for its size, the floor's look and the marble's colour ----
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
  const look = level ? lookOf(level) : "roof", dark = level ? levelOf(level).dark : false;
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    const made = makeScene(element, size.width, size.height, look, dark, level || 1, colour);
    if (!level) made.finale = "";
    if (scene.current) { made.clock = scene.current.clock; }
    made.game = game.current;
    scene.current = made;
    drawRef.current();
    let cancelled = false;
    loadCardFonts("টানা আর ধাপ ০১২৩৪৫৬৭৮৯ +−দমকা হাওয়া লোডশেডিং গলির গর্ত").then(() => { if (!cancelled) drawRef.current(); }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, look, dark, level, colour]);

  // ---- boot once this phone's stars are read: own unlock (migrated once), mode, colour, the story flag, then a friend's floor or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars);
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    const saved = Number(read(COLOUR_KEY)), open = openColours(levels.stars);
    const firstColour = Number.isInteger(saved) && saved > 0 && saved < MARBLES.length && open[saved] ? saved : 0;
    setColourState(firstColour); now.current.colour = firstColour;
    story.current.seen = read(INTRO_KEY) === "1";
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-floor stops it: its title shows.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      load(whereOf(shared), shared.seed);
      // Preview images only (`&og=1`): the friend's own run as a finished card, without saving anything on this phone.
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") { setPreview(true); setName(shared.name); }
      return true;
    };
    if (!fromHash()) load({ level: recommended(mine, levels.stars) });
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- away: blur and a hidden tab pause the stairs and let go of every key and finger (the player does this too) ----
  useEffect(() => {
    const blur = () => { release(); away(session, "blur"); stopHum(); story.current.holdAt = -1; sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { release(); away(session, "hide"); stopHum(); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      stopHum();
    };
  }, []);

  // ---- the end screen's choices ----
  const nextLevel = result && result.won && level && level < LEVEL_COUNT && playableLevel(level + 1) ? level + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (!now.current.shown && !preview) return;
    if (!sessionAgain(session, performance.now(), key)) return;
    const to = now.current.where;
    seed.current = friendFits(to) ? now.current.friend!.seed : newSeed();
    clearTimers();
    freshGame();
    release();
    setResult(null); setShown(false);
    startHum();
    sound.start(levelOf(levelIn(to) || 1).world);
    sync();
  }
  const guardOk = (key?: { at: number; repeat: boolean }) => {
    const r = now.current.result;
    if (!r || !now.current.shown) return false;
    return performance.now() - r.at >= GUARD_MS && (!key || (!key.repeat && key.at > shownAt.current));
  };
  const choices: Choice[] = !result ? [] : [
    ...(nextLevel ? [{ label: "পরের তলা", run: () => { if (guardOk()) load({ level: nextLevel }); } }] : []),
    { label: result.won && level ? "আবার এই তলা" : "আবার", run: () => again() },
    level ? { label: "সব তলা", run: () => { if (guardOk()) openList(); } } : { label: "তোমার তলায় ফেরো", run: () => { if (guardOk()) home(); } },
  ];
  function takeChoice(index: number, key: { at: number; repeat: boolean }) {
    const choice = choices[index];
    if (!choice) return;
    if (choice.label.startsWith("আবার")) again(key);
    else if (guardOk(key)) choice.run();
  }

  // ---- keys, at the window: ← → hold; Enter or Space start and take choice ১ (fresh presses only); 1–3 at the end; P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const dir = event.key === "ArrowLeft" || event.key === "a" || event.key === "A" ? -1 : event.key === "ArrowRight" || event.key === "d" || event.key === "D" ? 1 : 0;
    if (event.type === "keyup") {
      if (dir) lift(`key${dir}`);
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
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".ms-play")) return; // a button reached with Tab below the board does its own job
    switch (session.phase) {
      case "title":
        if ((enter || dir) && fresh) { event.preventDefault(); if (begin() && dir) press(`key${dir}`, dir); }
        return;
      case "story":
        if (enter) { event.preventDefault(); if (fresh) story.current.holdAt = performance.now(); }
        return;
      case "paused":
        if (enter) { event.preventDefault(); if (fresh) resume(); }
        return;
      case "over": {
        const number = event.key === "1" ? 0 : event.key === "2" ? 1 : event.key === "3" ? 2 : enter ? 0 : -1;
        if (number >= 0) { event.preventDefault(); if (fresh) takeChoice(number, { at: event.timeStamp, repeat: event.repeat }); }
        return;
      }
      default:
        if (dir) { event.preventDefault(); if (fresh) press(`key${dir}`, dir); }
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

  // ---- touch and mouse: hold the left or right half of the board; sliding across the middle switches sides ----
  const sideOf = (clientX: number) => { const rect = play.current!.getBoundingClientRect(); return clientX - rect.left < rect.width / 2 ? -1 : 1; };
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .ms-start, .ms-finish, .ms-sheet")) return;
    back(session, "focus"); // a tap on the board means the window has focus
    if (event.button > 0 || session.picking) return;
    // The tap that brings you back only resumes; it never rolls the marble.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase === "story") { story.current.holdAt = performance.now(); return; }
    if (session.phase !== "playing") return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone: moves still reach the board */ }
    press(`p${event.pointerId}`, sideOf(event.clientX));
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const id = `p${event.pointerId}`;
    if (held.current.sides.has(id) && session.phase === "playing") { const side = sideOf(event.clientX); if (held.current.sides.get(id) !== side) press(id, side); }
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    if (session.phase === "story") {
      const heldDown = story.current.holdAt >= 0;
      story.current.holdAt = -1;
      if (heldDown && !cancelled) nextPanel();
      return;
    }
    lift(`p${event.pointerId}`);
  }
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- cards ----
  const shownCard: Shared | null = preview && friend ? friend : result ? { ...result.card, name: cleanName(name) } : null;
  const state = shownCard ? sharedHash(shownCard) : "";
  useEffect(() => {
    if (!shownCard) return;
    let cancelled = false;
    loadCardFonts("মার্বেল-সিঁড়ি ১২৩ ধাপ সেকেন্ডে রাফি ★☆ ছাদ সিঁড়িঘর বাঁশের ভারা").then(() => {
      if (cancelled || !previewCanvas.current) return;
      drawCard(previewCanvas.current, shownCard, format, site);
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
  const friendHere = Boolean(friend) && sameWhere(whereOf(friend!), where) && seed.current === friend!.seed;
  const finale = level > 0 && isFinale(level);
  const heading = !result ? "" : !result.won ? (level ? (result.most === 1 ? "একবারেই শেষ" : `${bn(result.most)}টা সুযোগই শেষ`) : `${bn(result.steps)} ধাপ নামল`)
    : level === LEVEL_COUNT ? "ছাদ থেকে গলি, পুরো বাড়ি পার" : `${floorName(level)} পার${result.firstClear && finale ? "!" : ""}`;
  const kicker = level ? floorLabel(level) : `বন্ধুর সিঁড়ি · শুরু ${stageName(("stage" in where ? where.stage : 1) - 1)} থেকে`;
  const note = !result ? "" : level
    ? nearMiss({ won: result.won, falls: result.falls, left: result.of - result.steps, tenths: result.tenths, best: result.best, level })
    : oldNearMiss(result.steps, "stage" in where ? where.stage : 1, result.best);
  const versus = result && friendHere && friend ? compareLine(result.card, friend) : "";
  const line = !result ? "" : level === LEVEL_COUNT && result.won ? `সব মিলিয়ে ${bn(totalStars(levels.stars))}/${bn(LEVEL_COUNT * 3)} তারা। ${floorLine(level)}`
    : result.record ? (level ? "এই তলায় এই ফোনে এটাই সবচেয়ে তাড়াতাড়ি।" : "নতুন রেকর্ড। এই ফোনে এটাই সেরা।")
    : level ? (result.won ? floorLine(level) : `${bn(result.of - result.steps)} ধাপ বাকি ছিল।`) : oldLine(result.steps, "stage" in where ? where.stage : 1);
  const stats: Stat[] = !result ? [] : level ? [
    { label: "ধাপ", value: result.steps, of: result.of },
    { label: "সেকেন্ড", value: result.tenths, tenths: true },
    { label: "মার্বেল", value: result.picks },
    { label: "পড়েছ", value: result.falls },
  ] : [
    { label: "ধাপ", value: result.steps },
    { label: "মার্বেল", value: result.picks },
    { label: "টানা সেরা", value: result.bestStreak },
    { label: "পড়েছ", value: result.falls },
  ];
  const badge = level ? `${bn(level)} · ${floorName(level)}` : "বন্ধুর সিঁড়ি";
  const open = openColours(levels.stars);

  return (
    <div className="ms" data-phase={phase} data-look={look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="ms-play" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={event => onPointerUp(event, true)} onLostPointerCapture={event => lift(`p${event.pointerId}`)} onContextMenu={event => event.preventDefault()}>
        <canvas ref={canvas} role="img" aria-label="একটা কাচের মার্বেল, বাড়ির তাকে তাকে। স্ক্রিনের বাঁ বা ডান পাশ চেপে ধরো, মার্বেল সেদিকে গড়াবে। ওপরের সামিয়ানায় ঠেকো না, ক্যাকটাস ছুঁয়ো না।" />

        {(phase === "playing" || phase === "paused") && (
          <button type="button" className="ms-badge" onClick={openList} aria-haspopup="dialog" aria-label={`${badge}, সব তলা দেখো`} disabled={!level}>
            <i aria-hidden="true" />{badge}
          </button>
        )}
        {phase === "playing" && level <= 2 && (
          <p className="ms-halves" aria-hidden="true"><span>◀ চেপে ধরো</span><span>চেপে ধরো ▶</span></p>
        )}

        {phase === "title" && booted && !preview && (
          <StartCard level={level} oldStage={"stage" in where ? where.stage : 1} look={look} stars={levels.stars} best={level && best !== null ? best : 0}
            canPrev={level > 1} canNext={level > 0 && playableLevel(level + 1)} mode={mode} colour={colour} open={open}
            friend={friend} friendHere={friendHere}
            onStart={() => { begin(); }} onPrev={() => load({ level: level - 1 })} onNext={() => load({ level: level + 1 })}
            onMode={next => { setMode(next); now.current.mode = next; write(MODE_KEY, String(next)); freshGame(); sfx.tap(); }}
            onColour={next => { setColour(next); sfx.tap(); }}
            onList={openList} onHome={home} />
        )}

        {phase === "story" && (
          <div className="ms-story" aria-live="polite">
            <p className="ms-skip">ধরে রাখো: বাদ দাও</p>
            <p className="ms-panel" key={panel}>{STORY[panel]}</p>
            <p className="ms-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === panel || undefined} />)}</p>
          </div>
        )}

        {phase === "paused" && !player.paused && !picking && (
          <div className="ms-cover">
            <p>থেমে আছে। সিঁড়িও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}

        {phase === "over" && result && shown && (
          <Finish countKey={result.run} kicker={kicker} heading={heading} stars={result.stars} stats={stats} slow={slow}
            line={line} note={note} versus={versus} fresh={result.fresh} choices={choices} onSeeCard={seeCard} />
        )}

        {picking && (
          <FloorList stars={levels.stars} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)}
            onPick={at => load({ level: at })} onClose={closeList} />
        )}
        <p className="ms-sr" aria-live="polite">{phase === "over" && result && shown ? `${heading}। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
      </div>

      {shownCard && (
        <section className="ms-result" id="result" ref={resultBox} aria-labelledby="ms-result-title">
          <h2 id="ms-result-title">{shownCard.v === 2 ? <>{floorName(shownCard.level)} <em>{seconds(shownCard.tenths)} সেকেন্ডে</em></> : <>মার্বেল নামল <em>{bn(shownCard.score)} ধাপ</em></>}</h2>
          <p>{versus || (shownCard.v === 2 ? floorLine(shownCard.level) : oldLine(shownCard.score, shownCard.stage))}</p>
          <div className="ms-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={previewCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ms-card-summary" />
              <figcaption id="ms-card-summary" className="ms-sr">মার্বেল-সিঁড়ির কার্ড{shownCard.name && `, ${shownCard.name}`}: {shownCard.v === 2 ? `${floorLabel(shownCard.level)}, ${seconds(shownCard.tenths)} সেকেন্ড` : `${bn(shownCard.score)} ধাপ, ${stageName(reachedStage(shownCard.score, shownCard.stage))} পর্যন্ত`}।</figcaption>
              {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            {!preview && (
              <div className="ms-share">
                <label className="ms-name">
                  <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
                </label>
                <FormatToggle value={format} onChange={setFormat} />
                <ShareBar tool={TOOL} fileName={`marble-sinri-${shownCard.v === 2 ? `floor-${shownCard.level}` : shownCard.score}.png`} makeImage={() => cardBlob(shownCard, format, site)} imageKey={`${state}|${format}`} caption={caption(shownCard)} state={state}
                  hint="বন্ধু লিংক খুললে একই সিঁড়ি পাবে। সময়টা তোমার ফোনের হিসাব।" />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

