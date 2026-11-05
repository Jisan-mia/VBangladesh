"use client";
// IP: what we avoided — no "Breakout"/"Arkanoid" or any arcade name, no rainbow wall of bricks, no lettered power-up capsules, no capsule spaceship paddle, no space setting or arcade bleeps; ours is a মেলা stall with painted clay pots on ropes, a cloth ball you aim and throw and a bamboo লাঠি, and nobody is blindfolded.
// The game inside the shared player. Rules live in lib/ (rules.ts builds a stall, step.hot.ts steps it, session.ts decides
// what input and the wind loop may do); this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, hiss, loop, newSeed, readLevels, sfx, silenceScheduled, soundOn, tone, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { useInView } from "../../../shared/share-kit";
import {
  parseCard, bn, playLabel, SLUG, versusLine, type Card,
} from "../lib/link";
import { drawFrame, updateScene } from "../lib/draw.hot";
import {
  BALL_POINTS, BOSS_POINTS, defOf, isLevel, isMode, LEVELS, LEVEL_COUNT, migrateBest, MODE_INFO, nextAhead, openLevel, potPoints, readAhead, readBests,
  starsOf, WORLDS, type Mode, type Run,
} from "../lib/levels";
import { E_BLAST, E_BOSS_HIT, E_BREAK, E_CATCH, E_CLEAR, E_CRACK, E_KNOT, E_LASTCALL, E_LOST, E_OUT, E_OVER, E_STICK, E_THROW, K_BOSS, K_CRACKER, left as potsLeft, aimToward, type Game } from "../lib/rules";
import { makeScene, onBell, onBlast, onBreak, onCrack, onFlight, onKnot, onStick, paint, resizeScene, restartScene, setStall } from "../lib/scene";
import * as S from "../lib/session";
import { landingX, moveStick, newGame, setAim, stepGame, nudge, throwBall, traceAim, unreachable } from "../lib/step.hot";
import { endLine, humanLine, levelLine, nearLine } from "../lib/words";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, bests: `ektukhani-bests-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`,
  mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}`,
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/* Sounds (all through the kit; every one has a picture on screen too). */
/** The cloth swish as the ball leaves. You see the dots vanish and the ball go. */
const swish = () => hiss(0.18, 0.12, 2600, "bandpass");
/** The ball on bamboo. You see the লাঠি squash. */
const tock = (pitch: number) => tone(190 * pitch, 0.09, 0.2, "triangle", 0, 120);
/** A thick pot or the মটকা rings and swings. You see the crack and the rocking. */
const ring = (pitch: number) => { tone(560 * pitch, 0.4, 0.09, "triangle", 0, 480); tone(843 * pitch, 0.3, 0.05, "sine", 0.02); };
/** The signature: a clay crash over a low knock; a run of pots in one flight climbs in pitch. You see the shards, "+১৫" and the hit-stop. */
const smash = (flight: number, boss: boolean) => {
  const rise = 1 + Math.min(8, flight) * 0.07;
  hiss(boss ? 0.45 : 0.22, boss ? 0.26 : 0.18, 1900 * rise, "bandpass");
  tone((boss ? 90 : 150) * rise, boss ? 0.4 : 0.14, boss ? 0.28 : 0.18, "sine", 0, boss ? 40 : 70);
  tone(880 * rise, 0.07, 0.05, "square", 0.01);
};
/** A crackle of pops. You see the flash and the neighbours crack. */
const crackle = () => { for (let at = 0; at < 6; at++) hiss(0.04, 0.14, 3400, "highpass", at * 0.045); tone(120, 0.2, 0.2, "sine", 0, 50); };
/** Two brass strikes for শেষ ডাক and at a clear. You see the gold ripple and the chip. */
const bell = (pitch: number) => { for (let at = 0; at < 2; at++) { tone(784 * pitch, 0.9, 0.1, "sine", at * 0.3); tone(1568 * pitch, 0.5, 0.04, "sine", at * 0.3); } };
/** The ball is lost. You see the red chevron on the floor and a ball drop out of the corner. */
const lostBall = () => { tone(200, 0.28, 0.14, "sine", 0, 70); hiss(0.2, 0.1, 500, "lowpass"); };
/** A knot knocks the ball away. */
const knock = () => tone(130, 0.07, 0.2, "square", 0, 90);
/** Each মেলা opens with a four-note motif. */
const MOTIF = [392, 523, 494, 659];

type Result = EndStats & { card: Omit<Card, "name"> };
type Hud = { balls: number; lost: number; score: number; broken: number; total: number; last: boolean; throws: number };
const startHud = (g: Game): Hud => ({ balls: g.balls + g.lost, lost: g.lost, score: g.score, broken: g.broken, total: g.total, last: g.catching && g.def.catchAt < 99, throws: g.throws });

export function HandiStall() {
  const box = useRef<HTMLDivElement>(null), stageBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const bossBar = useRef<HTMLSpanElement>(null), progress = useRef<HTMLSpanElement>(null), wrap = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const initial: Run = { seed: 1, kind: "level", level: 1, mode: "n" };
  const game = useRef<Game>(newGame(initial));
  const scene = useRef(makeScene());
  const session = useRef<S.Session>(S.createSession(true));
  const wind = useRef<ReturnType<typeof loop> | null>(null);
  const seen = useRef({ edge: "", boss: -1, line: -1 });
  const gesture = useRef({ x0: 0, stick0: 0, aim0: 0 });
  const settle = useRef(0);
  const stepRef = useRef<(dt: number) => void>(() => {});

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>(initial);
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Card | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [hud, setHud] = useState<Hud>(() => startHud(game.current));
  const [fx, setFx] = useState(false);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, run, mode, levels, ahead, friend, open });
  live.current = { slow, screen, run, mode, levels, ahead, friend, open };
  const def = defOf(run);
  const inView = useInView(wrap);

  // ---- the wind loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { wind.current?.stop(); wind.current = loop("wind"); wind.current.set(0.2); },
    stop: () => { wind.current?.stop(); wind.current = null; },
  };
  const sync = () => S.syncLoops(session.current, game.current, loops);

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current, performance.now()); sync(); },
    onRestart: () => { S.resume(session.current, performance.now()); if (live.current.screen === "play" || live.current.screen === "over") again(); else sync(); },
    onLevels: () => openSheet(),
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  function openSheet() {
    S.openSheet(session.current);
    setSheet(true);
    sync();
  }
  function closeSheet() {
    S.closeSheet(session.current, performance.now());
    setSheet(false);
    sync();
  }

  /** A fresh round on the play screen. */
  function begin(next: Run) {
    silenceScheduled();
    window.clearTimeout(settle.current);
    const g = newGame(next);
    game.current = g;
    const sc = scene.current;
    sc.compact = false;
    setStall(sc, g.def, g.stickW);
    if (sc.w) resizeScene(sc, sc.w, sc.h, sc.ratio);
    restartScene(sc);
    seen.current.edge = ""; seen.current.boss = -1; seen.current.line = -1;
    stageBox.current?.setAttribute("data-edge", "");
    S.closeSheet(session.current, performance.now());
    setRun(next); setResult(null); setSheet(false); setHud(startHud(g)); setFx(false);
    show("play");
    if (next.kind === "level") { const pitch = WORLDS[g.def.world].motif; MOTIF.forEach((note, at) => tone(note * pitch, 0.14, 0.06, "triangle", 0.1 + at * 0.13)); }
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    const link = parseCard(window.location.hash);
    setFriend(link);
    setSite(window.location.host);
    session.current.sound = soundOn();
    let saved = readLevels(read(KEYS.levels), LEVEL_COUNT);
    const migrated = migrateBest(saved, read(KEYS.best));
    if (migrated) { levels.record(1, migrated); saved = { 1: migrated }; }
    const savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(link && link.kind !== "old" ? link.mode : chosen);
    const first: Run = link ? { seed: link.seed, kind: link.kind, level: link.level, mode: link.mode } : { seed: newSeed(), kind: "level", level: openLevel(saved, savedAhead), mode: chosen };
    setRun(first);
    const g = newGame(first);
    game.current = g;
    setStall(scene.current, g.def, g.stickW);
    setHud(startHud(g));
    // `#og=1` shows a finished round, for the share image script (scripts/og-image.mjs reads the card canvas).
    if (!link && new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo();
    return () => { loops.stop("wind"); silenceScheduled(); window.clearTimeout(settle.current); };
  }, []);

  /** A tidy finished stall 4 (three stars, no ball lost) with a fixed seed. Only `#og=1` reaches it. */
  function demo() {
    const next: Run = { seed: 48213, kind: "level", level: 4, mode: "n" }, g = newGame(next);
    game.current = g;
    setStall(scene.current, g.def, g.stickW);
    scene.current.compact = true;
    setRun(next);
    setResult({
      kicker: `লেভেল ${bn(4)} পার · ${g.def.name}`, why: endLine(g.def, true, 0), stars: 3, maxStars: 3, levelRun: true, cleared: true,
      score: 780, pots: g.total, total: g.total, flight: 4, lost: 0, throws: 11, seconds: 52.4, line: levelLine(3, true, g.def.finale), near: "", best: "", versus: "",
      card: { seed: 48213, kind: "level", level: 4, mode: "n", score: 780, pots: g.total, lost: 0 },
    });
    S.goTo(session.current, "over", performance.now());
    setScreen("over");
  }

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __handi: { game: () => game.current, session: () => session.current, scene: () => scene.current, land: () => landingX(game.current), step: (dt: number) => stepRef.current(dt) } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) silenceScheduled(); sync(); }, [sound]);

  // ---- away and back: release every key and finger, and the stall waits ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); session.current.resumeAt = performance.now(); sync(); };
    const onVisibility = () => { if (document.hidden) S.hide(session.current); else { S.show(session.current); session.current.resumeAt = performance.now(); } sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  // The stall scrolled off a desktop page: nothing flies where nobody sees.
  useEffect(() => { S.setInView(session.current, inView); sync(); }, [inView]);

  // ---- one step: input, rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = game.current, sc = scene.current, slowNow = live.current.slow;
    if (s.screen === "over") { updateScene(sc, g, dt, slowNow); return; }
    if (!S.ticking(s)) return;
    if (sc.freeze > 0 && !slowNow) { sc.freeze -= dt; return; }
    const dir = S.steer(s);
    if (dir) nudge(g, dir, dt);
    stepGame(g, dt, slowNow);
    if (g.phase === "aim") traceAim(g, slowNow);
    updateScene(sc, g, dt, slowNow);
    sc.land = g.phase === "fly" ? unreachable(g, slowNow) : NaN;
    sync();
    if (g.events) events(g, slowNow);
  }

  function events(g: Game, slowNow: boolean) {
    const sc = scene.current, flags = g.events, pitch = WORLDS[g.def.world].motif;
    const list = g.hitList, n = g.hitN;
    g.events = 0; g.hitN = 0;
    if (flags & E_THROW && !slowNow) buzz(6);
    if (flags & (E_STICK | E_CATCH)) { tock(pitch); onStick(sc); }
    if (flags & E_KNOT) { knock(); onKnot(sc, g.x, g.y); }
    if (flags & (E_BREAK | E_CRACK | E_BOSS_HIT)) {
      let broken = 0, bossBroken = false, cracked = false;
      for (let j = 0; j < n; j++) if (g.hits[list[j]] <= 0) broken++;
      let k = 0;
      for (let j = 0; j < n; j++) {
        const i = list[j];
        let dup = false;
        for (let m = 0; m < j; m++) if (list[m] === i) dup = true;
        if (dup) continue;
        if (g.hits[i] > 0) { onCrack(sc, g, i); cracked = true; continue; }
        k++;
        const boss = g.kinds[i] === K_BOSS;
        const points = g.def.old ? 10 : boss ? BOSS_POINTS : potPoints(Math.max(1, g.flight - (broken - k)));
        onBreak(sc, g, i, points, g.flight - (broken - k));
        if (boss) bossBroken = true;
        if (g.kinds[i] === K_CRACKER) onBlast(sc, g, i);
      }
      if (broken) { smash(g.flight, bossBroken); if (!slowNow) buzz(bossBroken ? [30, 30, 50] : 10); }
      if (cracked) ring(pitch);
      if (g.flight >= 3 && broken) onFlight(sc, g.x, g.y, g.flight);
    }
    if (flags & E_BLAST) crackle();
    if (flags & E_LOST) { lostBall(); if (!slowNow) { buzz(40); stageBox.current?.animate?.([{ transform: "translateY(0)" }, { transform: "translateY(4px)" }, { transform: "translateY(0)" }], { duration: 180, easing: "ease-out" }); } }
    if (flags & E_LASTCALL) { bell(pitch); onBell(sc, g.stick); }
    if (flags & E_CLEAR) { bell(pitch * 1.12); onBell(sc, g.stick); }
    if (flags & E_OUT) sfx.lose();
    setHud(current => {
      const next: Hud = startHud(g);
      return current.balls === next.balls && current.lost === next.lost && current.score === next.score && current.broken === next.broken && current.last === next.last && current.throws === next.throws ? current : next;
    });
    sync();
    if (flags & E_OVER) finish();
  }

  function finish() {
    const g = game.current, current = live.current.run, info = MODE_INFO[current.mode];
    const cleared = g.end === "clear", levelRun = current.kind === "level";
    const earned = levelRun ? starsOf(cleared, g.lost, current.mode) : 0, remaining = potsLeft(g);
    let bestLine = "", record = false, previous: number | null = null;
    if (levelRun) {
      if (earned > 0) {
        const nextList = nextAhead(live.current.levels.stars, live.current.ahead, current.level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        live.current.levels.record(current.level, earned);
      }
      const bests = readBests(read(KEYS.bests));
      previous = bests[current.level] ?? null;
      record = previous === null || g.score > previous;
      if (record) write(KEYS.bests, JSON.stringify({ ...bests, [current.level]: g.score }));
      bestLine = previous === null ? "এই ফোনে এই দোকানের প্রথম স্কোর।" : record ? `নতুন সেরা। আগের সেরা ছিল ${bn(previous)}।` : `এই ফোনের সেরা: ${bn(previous)}।`;
    }
    const rival = live.current.friend && live.current.friend.seed === current.seed && live.current.friend.kind === current.kind && live.current.friend.level === current.level && live.current.friend.mode === current.mode ? live.current.friend : null;
    const card = { seed: current.seed, kind: current.kind, level: current.level, mode: current.mode, score: Math.min(99_999, g.score), pots: g.broken, lost: g.lost };
    setResult({
      kicker: levelRun ? (cleared ? `লেভেল ${bn(current.level)} পার · ${g.def.name}` : `লেভেল ${bn(current.level)} · ${g.def.name}`) : playLabel(current),
      why: endLine(g.def, cleared, remaining),
      stars: earned, maxStars: info.maxStars, levelRun, cleared,
      score: g.score, pots: g.broken, total: g.total, flight: g.bestFlight, lost: g.lost, throws: g.throws, seconds: g.time,
      line: levelRun ? levelLine(earned, cleared, g.def.finale) : humanLine(g.score),
      near: levelRun ? nearLine(earned, cleared, g.lost, remaining, current.mode, previous, g.score) : "",
      best: bestLine, versus: rival ? versusLine(g.score, rival) : "", card,
    });
    scene.current.compact = true;
    show("over");
    setFx(true);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => setFx(false), 2600);
    // The stars chime in one by one. They are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
    if (earned === 3 || (record && cleared) || (cleared && g.def.finale)) { if (!live.current.slow) confetti(); if (earned === 3) sfx.win(); }
  }

  function draw() {
    const c = context.current, g = game.current, sc = scene.current, view = seen.current;
    if (!c) return;
    drawFrame(c, sc, g, live.current.slow);
    // The HUD's live parts, written straight to the DOM only when they change.
    if (g.boss >= 0 && bossBar.current) {
      const fill = Math.round(Math.max(0, g.hits[g.boss]) / g.maxHits[g.boss] * 100);
      if (fill !== view.boss) { view.boss = fill; bossBar.current.style.setProperty("--fill", `${fill}%`); }
    }
    const done = g.total ? Math.round(g.broken / g.total * 100) : 0;
    if (done !== view.line && progress.current) { view.line = done; progress.current.style.width = `${done}%`; }
    // Danger at the edges: the last ball, a ball the লাঠি won't reach, the wind.
    const playing = g.phase === "aim" || g.phase === "fly";
    const land = sc.land === sc.land ? (sc.land < g.stick ? "fall-l" : "fall-r") : "";
    const last = playing && g.balls === 1 ? "last" : "";
    const windy = playing && g.def.wind && Math.abs(Math.sin(g.clock * 0.3 + g.windPhase)) > 0.35 ? (Math.sin(g.clock * 0.3 + g.windPhase) > 0 ? "wind-l" : "wind-r") : "";
    const edge = `${last} ${land} ${windy}`.trim();
    if (edge !== view.edge) { view.edge = edge; stageBox.current?.setAttribute("data-edge", edge); }
  }

  stepRef.current = step;
  useGameLoop(step, draw, (screen === "play" || (screen === "over" && fx)) && !player.paused && !sheet);

  // ---- size the scene to its box ----
  useEffect(() => {
    const holder = stageBox.current, target = canvas.current;
    if (!holder || !target) return;
    const fit = () => {
      const width = holder.clientWidth, height = holder.clientHeight;
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      context.current = fitCanvas(target, width, height);
      resizeScene(scene.current, width, height, Math.min(2, window.devicePixelRatio || 1));
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    fit();
    // The title and the bell chips carry Bangla words: paint again once the fonts arrive.
    loadCardFonts("শেষ ডাক এক ছোড়ায় ১২৩৪৫৬৭৮৯০ +").then(() => { paint(scene.current); draw(); }).catch(() => {});
    return () => observer.disconnect();
  }, [screen === "title" || screen === "intro"]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || s.sheet) return;
      const throwKey = key === " " || key === "Enter" || key === "ArrowUp";
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
        if (key === "ArrowLeft" || key === "a" || key === "A") { event.preventDefault(); S.arrow(s, "left", true); return; }
        if (key === "ArrowRight" || key === "d" || key === "D") { event.preventDefault(); S.arrow(s, "right", true); return; }
        if (throwKey) { event.preventDefault(); if (S.throwKeyDown(s, event) && throwBall(game.current)) { swish(); sync(); } }
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : key === "r" || key === "R" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      } else if (screen === "over" && throwKey) event.preventDefault();
    };
    const up = (event: KeyboardEvent) => {
      const s = session.current, key = event.key;
      if (key === "ArrowLeft" || key === "a" || key === "A") S.arrow(s, "left", false);
      else if (key === "ArrowRight" || key === "d" || key === "D") S.arrow(s, "right", false);
      else if (key === " " || key === "Enter" || key === "ArrowUp") S.throwKeyUp(s);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- touch and mouse: everything answers on pointer-down; the first tap after a pause only wakes the game ----
  const toWorld = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect(), sc = scene.current;
    return { x: (event.clientX - rect.left - sc.ox) / sc.s, y: (event.clientY - rect.top - sc.oy) / sc.s };
  };
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || screen !== "play") return;
    event.preventDefault();
    const s = session.current, g = game.current, slowNow = live.current.slow;
    const hand = g.phase === "aim" ? "aim" : g.phase === "fly" ? "move" : null;
    if (!hand || !S.pointerDown(s, event.nativeEvent, hand)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ }
    gesture.current.x0 = event.clientX;
    if (hand === "aim") {
      // A touch above the ball aims at that spot; a touch low on the stall keeps the suggested aim.
      const at = toWorld(event);
      if (at.y < g.y - 44) setAim(g, aimToward(g, at.x, at.y));
      gesture.current.aim0 = g.aim;
      traceAim(g, slowNow);
    } else gesture.current.stick0 = g.stick;
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const s = session.current, g = game.current;
    if (!S.pointerMove(s, event.nativeEvent)) return;
    const dx = event.clientX - gesture.current.x0;
    if (s.hand === "move") moveStick(g, gesture.current.stick0 + 1.25 * dx / scene.current.s);
    else if (s.hand === "aim" && Math.abs(dx) > 4) { setAim(g, gesture.current.aim0 + dx / 130); traceAim(g, live.current.slow); }
  }
  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const hand = S.pointerUp(session.current, event.nativeEvent);
    if (hand === "aim" && throwBall(game.current)) { swish(); sync(); }
  }
  const onCancel = () => S.release(session.current);

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => current.kind === "old" ? current : { ...current, mode: next }); sfx.tap(); }
  const rivalFits = (target: Run) => friend !== null && friend.seed === target.seed && friend.kind === target.kind && friend.level === target.level && friend.mode === target.mode;
  function start() {
    sfx.tap();
    if (!read(KEYS.intro) && !rivalFits(run)) { show("intro"); return; }
    begin(rivalFits(run) ? run : { ...run, mode });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode }); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    const target: Run = { seed: newSeed(), kind: "level", level, mode };
    begin(friend && friend.kind === "level" && friend.level === level && friend.mode === mode ? { ...target, seed: friend.seed } : target);
  }
  function again() { const current = live.current.run; begin({ ...current, seed: rivalFits(current) ? current.seed : newSeed() }); }
  const cleared = result !== null && run.kind === "level" && result.stars > 0;
  const nextLevel = run.kind === "level" && cleared && run.level < LEVEL_COUNT && run.level + 1 <= open ? run.level + 1 : 0;
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের লেভেল", run: () => pickLevel(nextLevel) }] : []),
    { label: "আবার খেলো", run: again },
    ...(run.kind === "old" ? [{ label: `লেভেল ${bn(open)} খেলো`, run: () => pickLevel(open) }] : [{ label: "সব লেভেল", run: () => openSheet() }]),
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const total = totalStars(levels.stars);
  const playing = screen === "play" || screen === "over";
  const badge = run.kind === "level" ? `লেভেল ${bn(run.level)}` : `পুরোনো দোকান ${bn(run.level)}`;
  const ballCount = MODE_INFO[run.mode].balls;
  const sky = LEVELS[Math.min(LEVELS.length, run.level) - 1].world;

  return (
    <div className="hb-wrap" ref={wrap}>
      <div className="hb" ref={box} data-slow={slow || undefined} data-screen={screen} data-world={run.kind === "old" ? 0 : sky}>
        {screen === "title" && <TitleScreen run={run} mode={mode} friend={friend} stars={total} onStart={start} onMode={setMode} onLevels={openSheet} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {playing && (
          <>
            <div className="hb-hud">
              <button type="button" className="hb-badge" onClick={event => { event.currentTarget.blur(); if (screen === "play") openSheet(); }} aria-label={`${badge}, ${def.name}। সব লেভেল খোলো`}>
                <b>{badge}</b><span>{def.name}</span>{run.mode !== "n" && run.kind !== "old" && <i>{MODE_INFO[run.mode].name}</i>}
              </button>
              <p className="hb-mid" aria-live="polite">
                {screen !== "play" ? null : def.finale ? <>{hud.last ? <b className="hb-lastcall">শেষ ডাক</b> : <b>{def.finale}</b>}<span ref={bossBar} className="hb-bossbar"><i /></span></> : hud.last ? <b className="hb-lastcall">শেষ ডাক</b> : null}
              </p>
              <div className="hb-right">
                <p className="hb-score" aria-label={`${bn(hud.score)} পয়েন্ট`}><b>{bn(hud.score)}</b></p>
                <ol className="hb-balls" aria-label={`বল বাকি ${bn(Math.max(0, hud.balls - hud.lost))}টা`}>
                  {Array.from({ length: run.kind === "old" ? 3 : ballCount }, (_, index) => <li key={index} data-gone={index >= (run.kind === "old" ? 3 : ballCount) - hud.lost || undefined} />)}
                </ol>
              </div>
            </div>
            <span className="hb-line" aria-hidden="true"><span ref={progress} /></span>
            <div className="hb-stage" ref={stageBox} data-edge="" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onLostPointerCapture={onCancel} onContextMenu={event => event.preventDefault()}>
              <canvas ref={canvas} className="hb-canvas" role="img" aria-label="মেলার হাঁড়ির দোকান: দড়িতে ঝুলছে হাঁড়ি, নিচে বাঁশের লাঠি আর বল" />
              <span className="hb-gust" data-side="l" aria-hidden="true">হাওয়া →</span>
              <span className="hb-gust" data-side="r" aria-hidden="true">← হাওয়া</span>
              {screen === "play" && run.kind === "level" && run.level === 1 && hud.throws === 0 && !sheet && (
                <p className="hb-coach" aria-hidden="true"><span className="hb-coach-touch">হাঁড়ি ছুঁয়ে তাক করো, আঙুল তুলে ছোড়ো।</span><span className="hb-coach-keys">← → দিয়ে তাক করো, স্পেস দিয়ে ছোড়ো।</span></p>
              )}
            </div>
            {screen === "over" && result && <EndScreen stats={result} slow={slow} choices={choices} onCard={toCard} />}
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.card} site={site} />}
    </div>
  );
}
