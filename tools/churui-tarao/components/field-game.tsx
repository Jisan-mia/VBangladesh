"use client";
// IP: what we avoided — no light-gun duck game's dog, ducks, laughing gag, zapper or crosshair, and no gun at all: birds are
// shooed with a clap (a ring and "হুশ!"), never hurt. Our own paddy field, sparrows, শালিক, মুনিয়া and টিয়া and a clay-pot
// কাকতাড়ুয়া, drawn from scratch, with our own rule numbers.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves it, lib/draw.hot.ts draws it.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, newSeed, readLevels, sfx, shake, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { createGame, gameStars, starsOf, toDusk, DUSK, LOST, ON, SHOOED, type Game } from "../lib/afternoon";
import { cardBlob, drawCard } from "../lib/card";
import { parseShared, sharedHash, type Shared } from "../lib/challenge";
import { drawScene } from "../lib/draw.hot";
import { FIELD } from "../lib/field";
import { migrateBest } from "../lib/legacy";
import { isFinale, levelOf, DEFAULT_MODE, LEVEL_COUNT, WORLDS } from "../lib/levels";
import { bn, caption, clearLine, compareLine, heading as headingOf, humanLine, levelLabel, levelTitle, lossLine, nearMissLine, tallyLine } from "../lib/lines";
import { afterClear, bestKey, playable as canPlayLevel, readMode, readUnlock, recommended, INTRO_KEY, LEVELS_KEY, MODE_KEY, TOOL, UNLOCK_KEY } from "../lib/progress";
import { bindGame, makeScene, readEvents, showClap, tickScene, MASK, type Heard, type Scene } from "../lib/scene";
import {
  again as sessionAgain, away, back, canClap, cheerMayPlay, choiceOk, createSession, finish as sessionFinish, loopStep, moving, pause as sessionPause,
  pick as sessionPick, reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, type Phase,
} from "../lib/session";
import { clap, eating, nextBird, stepGame } from "../lib/step.hot";
import { FieldList, LIST_KEYS } from "./field-list";
import { Finish, type Choice, type Stat } from "./finish";
import { makeRustle, sound } from "./sound";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

/** ধীরে খেলো runs the whole afternoon at this speed. */
const SLOW_TIME = 0.7;

type Result = {
  level: number; seed: number; mode: number; run: number; at: number; lost: boolean; stars: number; grain: number; shooed: number; count: number;
  bestCombo: number; bestMulti: number; secondsLeft: number; bossLeft: boolean; firstClear: boolean; improved: boolean; best: number | null;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const readBest = (level: number) => { const raw = read(bestKey(level)), value = Number(raw); return raw !== null && raw !== "" && Number.isFinite(value) ? value : null; };

export function FieldGame() {
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
  const rustle = useRef<ReturnType<typeof makeRustle> | null>(null);
  const loops = useRef({ rustle: false, tick: 0 });
  const heard = useRef<Heard>({ mask: 0, landed: 0, hits: 0 });
  const listPaused = useRef(false);
  const demoing = useRef(false);
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ level, unlock, mode, friend, result, slow, stars: levels.stars });
  now.current = { level, unlock, mode, friend, result, slow, stars: levels.stars };

  const sync = () => { setPhase(session.phase); setPicking(session.picking); };
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopRustle = () => { rustle.current?.stop(); rustle.current = null; loops.current.rustle = false; };
  const friendFits = (to: number) => Boolean(now.current.friend) && now.current.friend!.level === to;
  const playableLevel = (to: number) => canPlayLevel(to, now.current.unlock, now.current.stars, now.current.friend?.level);
  // Dev only: lets the Orca autopilot read the afternoon (tests drive the pure code instead).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __ct: unknown }).__ct = { session, game, scene, loops, run: (steps: number) => { for (let i = 0; i < steps; i++) stepRef.current(1 / 60); drawRef.current(); } }; }, []);

  // ---- choosing a ক্ষেত: always back to its title, with a fresh seed (or the friend's) ----
  function load(to: number, nextSeed = friendFits(to) ? now.current.friend!.seed : newSeed()) {
    clearTimers();
    stopRustle();
    sessionReset(session);
    listPaused.current = false;
    demoing.current = false;
    seed.current = nextSeed;
    now.current.level = to;
    setLevel(to);
    game.current = null;
    if (scene.current) { bindGame(scene.current, null); scene.current.handOn = false; }
    setResult(null);
    sync();
  }
  const home = () => { const f = now.current.friend; load(f ? f.level : recommended(now.current.unlock, now.current.stars)); };

  function newRun() {
    clearTimers();
    const made = createGame(now.current.level, seed.current, now.current.mode);
    game.current = made;
    if (scene.current) bindGame(scene.current, made);
    setResult(null);
  }
  /** মাঠে নামো, Enter or Space: a fresh run of the ক্ষেত on screen (the story first, the very first time). */
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

  function pause() { stopRustle(); if (sessionPause(session)) sync(); }
  function resume() { if (sessionResume(session, performance.now())) sync(); }
  function openList() {
    if (session.phase === "playing" || session.phase === "story") { listPaused.current = true; stopRustle(); }
    sessionPick(session, true);
    sync();
  }
  function closeList() {
    sessionPick(session, false);
    if (listPaused.current) { listPaused.current = false; resume(); }
    sync();
  }

  // The player's menu: pause freezes the field; চালিয়ে যাও brings it back after a breath; নতুন করে শুরু replays this ক্ষেত from
  // its title; সব লেভেল opens our own list (which pauses again).
  const player = useGamePlayer({ onPause: () => pause(), onResume: () => resume(), onRestart: () => load(now.current.level), onLevels: () => openList() });
  const inPlayer = player.stage.width > 0;

  // ---- the end of an afternoon ----
  function finishRun(played: Game) {
    const at = performance.now();
    if (!sessionFinish(session, at)) return;
    stopRustle();
    const lost = played.over === LOST, stars = gameStars(played), fieldLevel = played.level;
    const before = now.current.stars[fieldLevel] ?? 0, firstClear = stars > 0 && !before;
    const bestBefore = readBest(fieldLevel);
    let improved = false, best = false;
    // Recorded at the moment the round ends, never inside a timer a quick tap could cancel.
    if (stars) {
      improved = levels.record(fieldLevel, stars) && before > 0;
      const opened = afterClear(now.current.unlock, fieldLevel);
      if (opened !== now.current.unlock) { setUnlock(opened); now.current.unlock = opened; write(UNLOCK_KEY, String(opened)); }
    }
    if (!lost && (bestBefore === null || played.grain > bestBefore)) { write(bestKey(fieldLevel), String(played.grain)); best = bestBefore !== null; }
    const boss = played.boss, bossLeft = boss >= 0 && played.state[boss] !== SHOOED;
    const done: Result = {
      level: fieldLevel, seed: played.seed, mode: now.current.mode, run: session.run, at, lost, stars, grain: played.grain, shooed: played.shooed, count: played.n,
      bestCombo: played.bestCombo, bestMulti: played.bestMulti, secondsLeft: toDusk(played), bossLeft, firstClear, improved, best: best ? played.grain : null,
    };
    now.current.result = done;
    setResult(done);
    sync();
    if (played.over === DUSK) sound.dusk();
    // Confetti only for three stars, a finale's first clear or a new record; a plain clear gets the stars' own notes.
    const run = session.run, party = stars > 0 && (stars === 3 || (firstClear && isFinale(fieldLevel)) || improved);
    later(() => {
      if (!cheerMayPlay(session, run)) return;
      if (party) { sfx.levelUp(); if (!now.current.slow) confetti({ colors: ["#ffd257", "#f0c35c", "#fff6dc", "#5e6b14", "#e2a83e"] }); }
      else if (!stars) sfx.lose();
    }, stars ? 1000 : 300);
    if (!stars) shake(play.current);
  }

  /** Sounds for what the afternoon did on its own: landings, pecks, a tenth of the grain gone. (A clap's own sounds play in clapAt.) */
  function listen(played: Game) {
    const view = scene.current;
    if (!view) return;
    const got = readEvents(view, played, heard.current);
    if (got.mask & MASK.bossIn) sound.bossIn(view.world);
    else if (got.mask & MASK.land) sound.land(got.landed, view.world);
    if (got.mask & MASK.tenth) sound.tenth();
    else if (got.mask & MASK.peck) sound.peck();
  }

  /** The rustle follows the afternoon every step: on while a bird eats in a live round, louder with more. */
  function steerLoops(played: Game | null, live: boolean) {
    const on = soundOn(), state = loops.current, eaters = live && played ? eating(played) : 0;
    const move = loopStep(state.rustle, eaters > 0, on);
    if (move === "start") { stopRustle(); rustle.current = makeRustle(); state.rustle = true; } else if (move === "stop") stopRustle();
    if (!played || ++state.tick % 6) return;
    rustle.current?.set(Math.min(1, eaters / 5));
  }

  const step = (dt: number) => {
    const at = performance.now(), played = game.current, view = scene.current;
    if (view) tickScene(view, dt);
    const live = played !== null && played.over === ON && moving(session, at);
    if (live && played) {
      stepGame(played, dt * (now.current.slow ? SLOW_TIME : 1));
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
  // The field breathes on every screen but the pause and the list (the pops after the last clap finish behind the card).
  useGameLoop(step, draw, phase !== "paused" && !picking);

  // ---- one clap, answered in the same event: the sim, the sounds and a drawn frame, before the next animation frame ----
  function clapAt(x: number, y: number) {
    const played = game.current, view = scene.current;
    if (!played || !view || !canClap(session) || played.over !== ON) return;
    const hits = clap(played, x, y);
    showClap(view, x, y, hits);
    sound.clap();
    const got = readEvents(view, played, heard.current);
    if (got.mask & MASK.bossGone) sound.bossGone();
    else if (got.mask & MASK.bossHit) sound.bossHit();
    if (got.mask & MASK.hop) sound.hop();
    if (hits && !(got.mask & (MASK.bossHit | MASK.bossGone))) sound.shoo(hits, played.combo);
    else if (got.mask & MASK.near) sound.near();
    drawRef.current();
  }

  // ---- the canvas: rebuilt for its size and the ক্ষেত's world ----
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
  const row = levelOf(level), world = row.world;
  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width || !size.height) return;
    scene.current = makeScene(element, size.width, size.height, world, scene.current);
    bindGame(scene.current, session.phase === "title" ? null : game.current);
    drawRef.current();
    let cancelled = false;
    loadCardFonts("হুশ! যাহ্ আরেকবার একটুর জন্য টানা এক তালিতে ০১২৩৪৫৬৭৮৯% পালের গোদা ঝুঁটি শালিক ডাকাত টিয়া পালাল আর তালি").then(() => { if (!cancelled) drawRef.current(); }).catch(() => { /* the system font draws the numbers */ });
    return () => { cancelled = true; };
  }, [size.width, size.height, world]);

  // ---- boot once this phone's stars are read: the old best (once), own unlock (migrated once), the mode, the story flag, then a friend's ক্ষেত or yours ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    let stars = levels.stars;
    // Before levels this phone kept one best %; it becomes field 1's stars once, while the levels key is still empty.
    const moved = migrateBest(read(LEVELS_KEY) !== null && Object.keys(readLevels(read(LEVELS_KEY), LEVEL_COUNT)).length > 0, read(bestKey(1)));
    if (moved) { levels.record(1, moved); stars = { ...stars, 1: Math.max(stars[1] ?? 0, moved) }; }
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), stars);
    if (migrated) write(UNLOCK_KEY, String(mine));
    setUnlock(mine); now.current.unlock = mine; now.current.stars = stars;
    const chosenMode = readMode(read(MODE_KEY));
    setMode(chosenMode); now.current.mode = chosenMode;
    setStorySeen(read(INTRO_KEY) === "1");
    setSite(window.location.host);
    setBooted(true);
    // In-page anchors also change the hash, so only a real challenge counts. A link opened mid-round stops it: its title shows.
    const fromHash = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared); now.current.friend = shared;
      if (!shared.old) { setMode(shared.mode); now.current.mode = shared.mode; }
      load(shared.level, shared.seed);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
      return true;
    };
    if (!fromHash()) load(recommended(mine, stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  /** Preview images only (`&og=1` on a link): the friend's afternoon on its card, without playing. Saves nothing on the phone. */
  function demo(found: Shared) {
    demoing.current = true;
    session.phase = "over"; session.overAt = performance.now();
    const stars = starsOf(found.level, found.grain);
    setResult({
      level: found.level, seed: found.seed, mode: found.mode, run: session.run, at: session.overAt, lost: false, stars, grain: found.grain, shooed: found.shooed,
      count: createGame(found.level, found.seed, found.mode).n, bestCombo: 0, bestMulti: 0, secondsLeft: 0, bossLeft: false, firstClear: false, improved: false, best: null,
    });
    setName(found.name);
    sync();
  }

  // ---- away: blur and a hidden tab pause the afternoon (the player does this too) ----
  useEffect(() => {
    const blur = () => { away(session, "blur"); stopRustle(); sync(); };
    const focus = () => { back(session, "focus"); };
    const hide = () => { if (document.hidden) { away(session, "hide"); stopRustle(); sync(); } else back(session, "show"); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      stopRustle();
    };
  }, []);

  // ---- the end screen's choices ----
  const nextLevel = result && result.stars > 0 && level < LEVEL_COUNT && playableLevel(level + 1) ? level + 1 : 0;
  function again(key?: { at: number; repeat: boolean }) {
    if (!sessionAgain(session, performance.now(), key)) return;
    seed.current = friendFits(now.current.level) ? now.current.friend!.seed : newSeed();
    newRun();
    sound.start(levelOf(now.current.level).world);
    sync();
  }
  const guarded = (run: () => void, key?: { at: number; repeat: boolean }) => { if (choiceOk(session, performance.now(), key)) run(); };
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের ক্ষেত", run: () => guarded(() => load(nextLevel)) }] : []),
    { label: "আবার খেলো", run: () => again() },
    { label: "সব ক্ষেত", run: () => guarded(openList) },
  ];
  function takeChoice(index: number, key: { at: number; repeat: boolean }) {
    if (index >= choices.length) return;
    if (choices[index].label === "আবার খেলো") again(key);
    else guarded(choices[index].label === "পরের ক্ষেত" ? () => load(nextLevel) : openList, key);
  }

  // ---- keys, at the window: arrows hop the hand to a bird; Space or Enter claps, starts, and takes the end screen's first choice (fresh presses only); P pauses ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.type !== "keydown" || event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (player.paused) return;
    back(session, "focus"); // a key that reaches the page means the window has focus
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const arrow = key === "ArrowLeft" ? 0 : key === "ArrowRight" ? 1 : key === "ArrowUp" ? 2 : key === "ArrowDown" ? 3 : -1;
    const enter = key === "Enter" || key === " ", fresh = !event.repeat;
    if (session.picking) {
      const index = LIST_KEYS.indexOf(key as typeof LIST_KEYS[number]);
      if (index >= 0 && fresh && playableLevel(index + 1)) { event.preventDefault(); load(index + 1); }
      return;
    }
    // A button reached with Tab below the field (the share bar) does its own job.
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".ct-play")) return;
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
      default: {
        const view = scene.current, played = game.current;
        if (arrow >= 0 && view && played) {
          event.preventDefault();
          const dx = arrow === 0 ? -1 : arrow === 1 ? 1 : 0, dy = arrow === 2 ? -1 : arrow === 3 ? 1 : 0;
          const index = nextBird(played, view.handOn ? view.handX : 180, view.handOn ? view.handY : 400, dx, dy);
          if (index >= 0) { view.handX = played.x[index]; view.handY = played.y[index]; }
          else if (view.handOn) {
            view.handX = Math.min(FIELD.right, Math.max(FIELD.left, view.handX + dx * 40));
            view.handY = Math.min(FIELD.bottom, Math.max(FIELD.top, view.handY + dy * 40));
          }
          view.handOn = true;
        } else if (enter) { event.preventDefault(); if (fresh && view) { view.handOn = true; clapAt(view.handX, view.handY); } }
        else if (key === "p" && fresh) { event.preventDefault(); if (inPlayer) player.requestPause(); else pause(); }
      }
    }
  };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  // ---- touch and mouse on the field: the clap happens in pointerdown itself ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, a, input, .ct-start, .ct-finish, .ct-sheet, .ct-story, .ct-cover")) return;
    if (event.button > 0 || !event.isPrimary || session.picking) return;
    back(session, "focus"); // a tap on the field means the window has focus
    // The tap that brings you back only resumes; it never claps.
    if (session.phase === "paused") { resume(); return; }
    if (session.phase !== "playing") return;
    const view = scene.current, rect = event.currentTarget.getBoundingClientRect();
    if (!view) return;
    view.handOn = false;
    clapAt((event.clientX - rect.left - view.ox) / view.s, (event.clientY - rect.top - view.oy) / view.s);
  }
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- cards: only for a ক্ষেত passed ----
  const card: Shared | null = result && result.stars > 0 ? { level: result.level, seed: result.seed, grain: result.grain, shooed: result.shooed, name: cleanName(name), mode: result.mode, old: false } : null;
  const state = card ? sharedHash(card) : "";
  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    loadCardFonts(`চড়ুই তাড়াও ${levelTitle(card.level)} ${card.name || "রাফি"} ০১২৩৪৫৬৭৮৯% ধান বাঁচল ${humanLine(card)} ${tallyLine(card)}`).then(() => {
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
  const versus = result && result.stars > 0 && rival ? compareLine(result, rival, rival.name) : "";
  const note = !result ? "" : !result.stars ? `${nearMissLine(result.level, result.grain, 0)} ${lossLine(result.level, result.lost ? result.secondsLeft : 0, result.bossLeft)}`
    : result.improved ? `এই ক্ষেতে নতুন রেকর্ড, ${bn(result.stars)} তারা!` : result.best !== null ? `এই ক্ষেতে তোমার সবচেয়ে বেশি, ${bn(result.best)}% ধান!` : nearMissLine(result.level, result.grain, result.stars);
  const stats: Stat[] = result ? [
    { label: "ধান", value: result.grain, unit: "%" },
    { label: "হুশ", value: result.shooed, of: result.count },
    { label: "টানা সেরা", value: result.bestCombo },
    { label: "এক তালিতে", value: result.bestMulti },
  ] : [];
  const badge = `${levelLabel(level)} · ${row.name}`;
  const title = result ? headingOf({ level: result.level, stars: result.stars, lost: result.lost, firstClear: result.firstClear }) : "";

  return (
    <div className="ct" data-phase={phase} data-look={WORLDS[world].look} data-calm={slow || undefined} data-player={inPlayer || undefined} onClick={dropFocus}>
      <div ref={play} className="ct-play" onPointerDown={onPointerDown}>
        <canvas ref={canvas} role="img" aria-label={`পাকা ধানক্ষেত, এক পাশে কাকতাড়ুয়া। পাখি এসে ধানে বসে খায়। পাখির ওপর বা তার ছায়ায় চাপলে হুশ করে উড়ে যায়। কিবোর্ডে তীর দিয়ে হাত সরাও, Space চাপলে তালি।`} />

        {(phase === "playing" || phase === "paused") && (
          <button type="button" className="ct-badge" onClick={event => { event.currentTarget.blur(); openList(); }} aria-haspopup="dialog" aria-label={`${badge}, সব ক্ষেত দেখো`}>
            <i aria-hidden="true" />{levelLabel(level)}
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
          <div className="ct-cover">
            <p>থেমে আছে। পাখিরাও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={event => { event.currentTarget.blur(); resume(); }}>চালিয়ে যাও</button>
          </div>
        )}

        {phase === "over" && result && (
          <Finish countKey={result.run} kicker={levelTitle(result.level)} won={result.stars > 0} stars={result.stars} stats={stats} slow={slow}
            heading={title}
            line={result.stars ? clearLine(result.level) : rival ? `${rival.name || "বন্ধু"} এই ক্ষেতে ${bn(rival.grain)}% ধান বাঁচিয়েছিল।` : `${bn(result.shooed)}টা পাখি হুশ হয়েছিল।`}
            note={note} versus={versus} choices={choices} onSeeCard={card ? seeCard : null} />
        )}

        {picking && (
          <FieldList stars={levels.stars} playable={playableLevel} current={level} recommended={recommended(unlock, levels.stars)}
            onPick={to => load(to)} onClose={closeList} />
        )}
        <p className="ct-sr" aria-live="polite">{phase === "over" && result ? `${title}। ${bn(result.grain)}% ধান রইল। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${note}` : ""}</p>
      </div>

      <section className="ct-result" id="result" ref={resultBox} aria-labelledby="ct-result-title">
        <h2 id="ct-result-title">{card ? <><em>{bn(card.grain)}% ধান</em> বাঁচল, {bn(card.shooed)}টা পাখি হুশ!</> : "ক্ষেত পার হলে তোমার কার্ড"}</h2>
        <p>{card ? `${levelTitle(card.level)} · ${versus || humanLine(card)}` : `সন্ধ্যা পর্যন্ত ধান বাঁচালে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই ক্ষেত, একই পাখি পাবে। মোট ★ ${bn(totalStars(levels.stars))}/${bn(LEVEL_COUNT * 3)}`}</p>
        {card && (
          <div className="ct-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`চড়ুই তাড়াওয়ের কার্ড: ${levelTitle(card.level)}, ${tallyLine(card)}।`} />
              {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ct-share">
              <label className="ct-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`churui-tarao-${card.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint="বন্ধু লিংক খুললে একই ক্ষেত, একই পাখি একই জায়গায় পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
