"use client";
// IP: what we avoided — no film or song title, no game-brand look, no glass-coated (মাঞ্জা) string anywhere; the kites are ঘুড়ি আর ফানুস's own drawings, the rooftops, people and the tension meter are drawn fresh.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps them, session.ts decides input and sound loops);
// this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, hiss, loop, newSeed, readLevels, sfx, silenceScheduled, soundOn, tone, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { bossInSky, createGame, E, rivalsLeft, tenthsOf, type Game } from "../lib/kite";
import { bossOf, isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, readTimes, RIVALS, starsOf, timeKey, type Mode } from "../lib/levels";
import { bn, compareLine, humanLine, lookFromGhuri, LOOKS, migrateBest, parseShared, seconds, SLUG, type Look, type Shared } from "../lib/link";
import * as S from "../lib/session";
import { buildLayers, makeFx, nameWord, WORD, type Fx, type Layers } from "../lib/sky";
import { burst, drawFrame, pop, resetFx, snap, tag, tickFx } from "../lib/draw.hot";
import { stepGame } from "../lib/step.hot";
import type { Card } from "../lib/card";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = { levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, times: `ektukhani-times-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const sameLook = (a: Look, b: Look) => a.pattern === b.pattern && a.color === b.color;

/* ---- sounds: only shared/game-sound.ts, each with a visible twin ---- */
/** Two strings catch: a quick rising zing (the ring at the hook). */
const zing = () => { tone(620, 0.2, 0.07, "triangle", 0, 1700); hiss(0.08, 0.06, 5000, "highpass"); };
/** The signature: the roofs shout "ভো-কাট্টা!", a long rising note and two short ones over the crowd (the pop and the jump). */
const voKatta = (pitch = 1) => {
  tone(392 * pitch, 0.34, 0.09, "triangle", 0, 560 * pitch);
  tone(698 * pitch, 0.09, 0.08, "triangle", 0.36);
  tone(622 * pitch, 0.2, 0.08, "triangle", 0.47);
  hiss(0.7, 0.05, 1100, "lowpass", 0.05);
};
/** The string snaps (the snapped halves). */
const snapSound = () => { hiss(0.09, 0.12, 6000, "highpass"); tone(1500, 0.05, 0.05, "square", 0, 400); };
/** A tell: a whip-crack tick (the red ring or the amber string). */
const tellSound = () => { tone(1800, 0.03, 0.05, "square"); tone(1400, 0.03, 0.05, "square", 0.08); };
/** Your kite is cut: a falling slide (your kite spinning down, the red edge). */
const lostSound = () => { tone(440, 0.5, 0.08, "triangle", 0, 150); hiss(0.25, 0.05, 700); };
/** A champion loses a notch. */
const notchSound = () => { tone(523, 0.1, 0.08, "triangle"); tone(784, 0.18, 0.08, "triangle", 0.08); snapSound(); };
/** The yank hit you while you were tight. */
const yankHitSound = () => { tone(150, 0.18, 0.16, "sine", 0, 60); };
/** A world's four-note motif at the start of a level, pitched per evening; scheduled, so a pause cuts it. */
const MOTIF = [523, 659, 784, 1047];
const WORLD_PITCH = [1, 0.89, 0.75];

type Run = { seed: number; level: number; mode: Mode };
type Result = { stats: EndStats; shared: Omit<Shared, "name" | "won">; card: Omit<Card, "name"> };
type Hud = { kites: number; cuts: number; notches: number; notchMax: number; boss: string };

export function VoKattaGame() {
  const skyBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null), clock = useRef<HTMLSpanElement>(null);
  const layers = useRef<Layers | null>(null);
  const fx = useRef<Fx>(makeFx(LOOKS.length));
  const game = useRef<Game>(createGame(1));
  const session = useRef<S.Session>(S.createSession(true));
  const wind = useRef<ReturnType<typeof loop> | null>(null), hum = useRef<ReturnType<typeof loop> | null>(null);
  const seen = useRef({ tenths: -1, edge: "", flash: 0, kites: -1 });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n" });
  const [hud, setHud] = useState<Hud>({ kites: 3, cuts: 0, notches: 0, notchMax: 0, boss: "" });
  const [ready, setReady] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [site, setSite] = useState("");
  const [mode, setModeState] = useState<Mode>("n");
  const [look, setLook] = useState<Look>(LOOKS[0]);
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, look, run });
  live.current = { slow, screen, look, run };
  const def = levelDef(run.level);

  // ---- sound loops: session.ts decides, this does ----
  const loops: S.Loops = {
    start: kind => {
      if (kind === "wind") { wind.current?.stop(); wind.current = loop("wind"); wind.current.set(0.25); }
      else { hum.current?.stop(); hum.current = loop("hum", 200); hum.current.set(0.3); }
    },
    stop: kind => { const handle = kind === "wind" ? wind : hum; handle.current?.stop(); handle.current = null; },
  };
  const sync = () => S.syncLoops(session.current, game.current, loops);

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current); sync(); },
    onRestart: () => { S.resume(session.current); if (live.current.screen === "play" || live.current.screen === "over") begin(live.current.run); else sync(); },
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  /** The corners: spare kites, cuts, and on a finale the champion's notches (full until it rises, none once it falls). */
  function hudOf(g: Game): Hud {
    const kind = bossOf(g.def), boss = bossInSky(g), max = kind ? RIVALS[kind].notches : 0;
    const notches = boss ? boss.notches : g.cuts >= g.def.roster.length ? 0 : max;
    return { kites: g.kites, cuts: g.cuts, notches, notchMax: max, boss: kind ? RIVALS[kind].name : "" };
  }

  /** A fresh evening on the play screen, waiting for the first touch. */
  function begin(next: Run) {
    silenceScheduled();
    const fresh = createGame(next.seed, next.level, next.mode);
    game.current = fresh;
    resetFx(fx.current);
    // The first rival introduces itself.
    tag(fx.current, nameWord(fresh.rivals[0].kind), 0);
    Object.assign(seen.current, { tenths: -1, edge: "", flash: 0, kites: -1 });
    setRun(next); setHud(hudOf(fresh)); setReady(true); setResult(null); setSheet(false);
    show("play");
    const pitch = WORLD_PITCH[levelDef(next.level).world];
    MOTIF.forEach((note, at) => tone(note * pitch, 0.14, 0.07, "triangle", 0.05 + at * 0.12));
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    const link = parseShared(window.location.hash);
    setFriend(link);
    setSite(window.location.host);
    session.current.sound = soundOn();
    const made = lookFromGhuri(window.location.hash);
    if (made) setLook(made);
    let saved = readLevels(read(KEYS.levels), LEVEL_COUNT);
    const migrated = migrateBest(saved, read(KEYS.best));
    if (migrated) { levels.record(1, migrated); saved = { 1: migrated }; }
    const savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    const playMode = link && !link.old ? link.mode : chosen;
    setModeState(playMode);
    const first = link ? { seed: link.seed, level: link.level, mode: playMode } : { seed: newSeed(), level: openLevel(saved, savedAhead), mode: chosen };
    setRun(first);
    game.current = createGame(first.seed, first.level, first.mode);
    setHud(hudOf(game.current));
    return () => { loops.stop("wind"); loops.stop("hum"); silenceScheduled(); };
  }, []);

  // A friend's link opened on a page that is already here (only the hash changes): back to the title with their sky.
  useEffect(() => {
    const onHash = () => {
      const link = parseShared(window.location.hash);
      if (!link) return;
      silenceScheduled();
      setFriend(link);
      const next = { seed: link.seed, level: link.level, mode: link.old ? live.current.run.mode : link.mode };
      if (!link.old) setModeState(link.mode);
      setRun(next);
      game.current = createGame(next.seed, next.level, next.mode);
      setHud(hudOf(game.current)); setResult(null); setSheet(false);
      show("title");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __vokatta: { game: () => game.current, session: () => session.current, fx: () => fx.current, layers: () => layers.current } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) silenceScheduled(); sync(); }, [sound]);
  useEffect(() => { fx.current.slow = slow; }, [slow]);

  // ---- away and back: release the hand, let the player pause ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); sync(); };
    const onVisibility = () => { if (document.hidden) S.hide(session.current); else S.show(session.current); sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- the sky scrolled off a desktop page: hands off and nothing moves until it's back (ticking needs inView) ----
  useEffect(() => {
    const box = skyBox.current;
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => { S.setInView(session.current, entry.isIntersecting); sync(); }, { threshold: 0.2 });
    observer.observe(box);
    return () => { observer.disconnect(); S.setInView(session.current, true); };
  }, [screen === "play" || screen === "over"]);

  // ---- the level list is a choice screen: nothing moves behind it ----
  useEffect(() => { if (sheet) S.openSheet(session.current); else S.closeSheet(session.current); sync(); }, [sheet]);

  // ---- one step: input, rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = game.current, f = fx.current, slowNow = live.current.slow;
    if (!S.ticking(s) || S.breathing(s, dt)) return;
    const pull = S.applyInput(s, g, dt);
    const before = g.phase;
    stepGame(g, pull, dt, slowNow);
    tickFx(f, dt, g.def.world);
    if (before === "ready" && g.phase !== "ready") setReady(false);
    for (let i = 0; i < g.evCount; i++) onEvent(g, g.ev[i], g.evX[i], g.evY[i], g.evSlot[i]);
    g.evCount = 0;
    sync();
    // Sound that carries the state: the wind's loudness and pitch follow its strength; the string hums higher the harder you pull.
    const gust = Math.min(1, Math.abs(g.wind) / 22) + (g.gustLeft > 0 ? 0.5 : 0);
    wind.current?.set(0.08 + 0.4 * Math.min(1, gust)); wind.current?.pitch(380 + 900 * Math.min(1, gust));
    hum.current?.set(0.18 + 0.3 * g.you.t); hum.current?.pitch(150 + 330 * g.you.t);
  }

  function onEvent(g: Game, kind: number, x: number, y: number, slot: number) {
    const f = fx.current, slowNow = live.current.slow;
    if (kind === E.HOOK) { zing(); buzz(8); }
    else if (kind === E.CUT) {
      const r = g.rivals[Math.max(0, slot)];
      snap(f, r.hx, r.hy, x, y, true);
      burst(f, x, y, 18);
      pop(f, WORD.CUT, x, y);
      f.jump = 0.9; if (!slowNow) f.shake = 0.25;
      snapSound(); voKatta(1 + Math.min(4, g.streak - 1) * 0.06);
      if (g.streak >= 2) sfx.combo(g.streak - 2);
      buzz(18);
      setHud(hudOf(g));
    } else if (kind === E.NOTCH) {
      burst(f, x, y, 8); pop(f, WORD.NOTCH, x, y); if (!slowNow) f.shake = 0.15;
      notchSound(); buzz(10);
      setHud(hudOf(g));
    } else if (kind === E.LOST) {
      snap(f, g.you.hx, g.you.hy, x, y, false);
      pop(f, WORD.LOST, x, y); if (!slowNow) f.shake = 0.2;
      seen.current.flash = 0.6;
      lostSound(); buzz([30, 40, 30]);
      setHud(hudOf(g));
    } else if (kind === E.CHARGE) {
      tag(f, WORD.CHARGE, Math.max(0, slot)); tellSound();
    } else if (kind === E.YANK_WARN) { tag(f, WORD.YANK, Math.max(0, slot)); tellSound(); }
    else if (kind === E.YANK_HIT) { yankHitSound(); buzz(20); if (!slowNow) f.shake = 0.12; }
    else if (kind === E.YANK_OK) sfx.good();
    else if (kind === E.GUST_WARN) sfx.whoosh();
    else if (kind === E.TANGLE) { tone(180, 0.25, 0.08, "sawtooth", 0, 120); buzz(12); }
    else if (kind === E.SPAWN) {
      tag(f, nameWord(g.rivals[Math.max(0, slot)].kind), Math.max(0, slot));
      tone(660, 0.1, 0.06, "triangle"); tone(880, 0.16, 0.06, "triangle", 0.1);
      setHud(hudOf(g));
    } else if (kind === E.RISE) { tone(520, 0.12, 0.05, "triangle", 0, 780); setHud(hudOf(g)); }
    else if (kind === E.WIN || kind === E.FAIL) finish();
  }

  function finish() {
    const g = game.current, { level, mode: played, seed } = live.current.run, info = MODE_INFO[played], d = levelDef(level);
    const tenths = tenthsOf(g.time), won = g.won, earned = starsOf(won, g.lost, played);
    const times = readTimes(read(KEYS.times)), key = timeKey(level, played), previous = times[key] ?? null;
    let best = "";
    if (won) {
      const nextList = nextAhead(levels.stars, ahead, level);
      write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
      levels.record(level, earned);
      if (previous === null || tenths < previous) { times[key] = tenths; write(KEYS.times, JSON.stringify(times)); }
      best = previous === null ? `এই ফোনে লেভেল ${bn(level)}-এর প্রথম রেকর্ড।` : tenths < previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${seconds(previous)} সেকেন্ড।` : `এই ফোনে সেরা: ${seconds(previous)} সেকেন্ড`;
    }
    const rivals = d.roster.length, left = rivalsLeft(g);
    const near = !won ? `আর ${bn(left)}টা কাটলেই পার।`
      : earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।"
      : earned < 3 ? (g.lost === 1 ? "একটাও ঘুড়ি না হারালে ৩ তারা।" : `আর ${bn(g.lost - 1)}টা কম হারালে ২ তারা।`) : "";
    const rival = friend && !friend.old && friend.level === level && friend.seed === seed && friend.mode === played ? friend : null;
    const versus = rival ? compareLine({ won, lost: g.lost, tenths, cuts: g.cuts }, rival) : "";
    setResult({
      stats: {
        level, name: d.name, title: d.title, won, cuts: g.cuts, rivals, lost: g.lost, tenths, stars: earned, maxStars: info.maxStars,
        fastest: Number.isFinite(g.fastest) ? tenthsOf(g.fastest) : 0, bestStreak: g.bestStreak, yanks: g.yanks, yankHits: g.yankHits, gusts: g.gusts, tangles: g.tangles,
        line: versus || humanLine(won, g.lost, g.cuts), near, best,
      },
      shared: { seed, cuts: g.cuts, look: live.current.look, level, mode: played, lost: g.lost, tenths, old: false },
      card: { cuts: g.cuts, look: live.current.look, level, stars: earned, tenths, won, lost: g.lost },
    });
    show("over");
    // The stars and the fanfare are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    if (won) {
      for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
      if (earned === 3 || (previous !== null && tenths < previous)) { [784, 988, 1175, 1568].forEach((note, at) => tone(note, 0.16, 0.08, "triangle", 1.2 + at * 0.06)); confetti(); }
    } else [392, 330, 262].forEach((note, at) => tone(note, 0.24, 0.08, "triangle", 0.2 + at * 0.14));
  }

  function draw() {
    const target = canvas.current, built = layers.current;
    if (!target || !built) return;
    const g = game.current, view = seen.current;
    drawFrame(target.getContext("2d")!, built, g, fx.current, LOOKS.length);
    const tenths = Math.floor(g.time * 10);
    if (tenths !== view.tenths && clock.current) { view.tenths = tenths; clock.current.textContent = seconds(tenths); }
    // Danger and tells light the sky's edge, never its middle.
    if (view.flash > 0) view.flash -= 1 / 60;
    let edge = "";
    if (g.phase === "fly" || g.phase === "end") {
      const charging = g.rivals[0].chargeWarn > 0 ? g.rivals[0] : g.rivals[1].chargeWarn > 0 ? g.rivals[1] : null;
      if (view.flash > 0) edge = "lost";
      else if (g.hooked >= 0 && g.tug < -0.4) edge = "danger";
      else if (charging) edge = charging.x < 180 ? "charge-left" : "charge-right";
      else if (g.gustWarn > 0 || g.gustLeft > 0) edge = g.gustSide > 0 ? "gust-left" : "gust-right";
      else if (g.kites === 1) edge = "last";
    }
    if (edge !== view.edge) { view.edge = edge; skyBox.current?.setAttribute("data-edge", edge); }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the sky to its box, pre-render the evening's layers ----
  const world = def.world;
  useEffect(() => {
    const box = skyBox.current, target = canvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      fitCanvas(target, width, height);
      layers.current = buildLayers(width, height, Math.min(2, window.devicePixelRatio || 1), world, [...LOOKS, live.current.look]);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    void document.fonts?.ready.then(size);
    return () => observer.disconnect();
  }, [screen === "play" || screen === "over", world, look]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || sheet) return;
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
        const gameKey = S.keyOf(key);
        if (gameKey) { event.preventDefault(); if (!event.repeat) S.keyDown(s, gameKey); }
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" || key === "r" || key === "R" ? 1 : key === "3" ? 2 : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => { const gameKey = S.keyOf(event.key); if (gameKey) S.keyUp(session.current, gameKey); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- the sky: finger down is টান, a slide steers, lifting is ঢিল, a still tap is a short tug there ----
  function skyDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button")) return;
    if (!S.pointerDown(session.current, event.pointerId, event.clientX, event.clientY)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already gone */ }
  }
  function skyMove(event: ReactPointerEvent<HTMLDivElement>) {
    S.pointerMove(session.current, event.pointerId, event.clientX, event.clientY, layers.current?.scale ?? 1);
  }
  function skyUp(event: ReactPointerEvent<HTMLDivElement>) {
    const built = layers.current, box = event.currentTarget.getBoundingClientRect();
    const wx = built ? (event.clientX - box.left - built.ox) / built.scale : 0, wy = built ? (event.clientY - box.top - built.oy) / built.scale : 0;
    S.pointerUp(session.current, event.pointerId, wx, wy);
  }
  const skyCancel = (event: ReactPointerEvent<HTMLDivElement>) => S.pointerCancel(session.current, event.pointerId);

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => ({ ...current, mode: next })); sfx.tap(); }
  const friendFits = (level: number, seed: number, played: Mode) => Boolean(friend && friend.level === level && friend.seed === seed && (friend.old || friend.mode === played));
  function start() {
    sfx.tap();
    const fromFriend = friendFits(run.level, run.seed, run.mode);
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode }); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    const rival = friend && friend.level === level && (friend.old || friend.mode === mode) ? friend : null;
    begin({ seed: rival ? rival.seed : newSeed(), level, mode });
  }
  const again = () => begin({ ...run, seed: friendFits(run.level, run.seed, run.mode) ? run.seed : newSeed() });
  const nextLevel = run.level < LEVEL_COUNT && run.level + 1 <= open ? run.level + 1 : 0;
  const won = Boolean(result?.stats.won);
  const choices: Choice[] = won && nextLevel
    ? [{ label: "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode }) }, { label: "আবার খেলো", run: again }, { label: "সব লেভেল", run: () => setSheet(true) }]
    : [{ label: "আবার খেলো", run: again }, ...(mode !== "e" && !won ? [{ label: "সহজে খেলো", run: () => { setMode("e"); begin({ ...run, seed: newSeed(), mode: "e" }); } }] : []), { label: "সব লেভেল", run: () => setSheet(true) }];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };
  function nextLook() {
    const index = LOOKS.findIndex(item => sameLook(item, look));
    setLook(LOOKS[(index + 1) % LOOKS.length]);
    sfx.tap();
  }

  const total = totalStars(levels.stars);
  const finale = def.finale && hud.boss && screen === "play";
  const kites = Math.max(0, hud.kites);
  const spare = MODE_INFO[run.mode].kites;

  return (
    <div className="vk-wrap" ref={wrap}>
      <div className="vk" data-slow={slow || undefined} data-screen={screen} data-world={world}>
        {screen === "title" && <TitleScreen level={run.level} mode={mode} friend={friend} stars={total} look={look} slow={slow} onStart={start} onMode={setMode} onLevels={() => setSheet(true)} onLook={nextLook} />}
        {screen === "intro" && <Story look={look} onDone={storyDone} />}
        {(screen === "play" || screen === "over") && (
          <>
            <div className="vk-hud">
              <div className="vk-hud-left">
                <p className="vk-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
                <p className="vk-kites" aria-label={`নাটাইয়ে ${bn(kites)}টা ঘুড়ি`}>
                  {Array.from({ length: spare }, (_, at) => <i key={at} data-on={at < kites} />)}
                </p>
              </div>
              {finale ? (
                <p className="vk-boss" aria-label={`${hud.boss}: সুতায় ${bn(hud.notches)} দাগ জোর বাকি`}>
                  <b>{hud.boss}</b>
                  <span>{Array.from({ length: hud.notchMax }, (_, at) => <i key={at} data-on={at < hud.notches} />)}</span>
                </p>
              ) : (
                <ol className="vk-roster" aria-label={`${bn(def.roster.length)}টার মধ্যে ${bn(hud.cuts)}টা কাটা`}>
                  {def.roster.map((_, at) => <li key={at} data-done={at < hud.cuts} />)}
                </ol>
              )}
              <div className="vk-hud-right">
                <p className="vk-cuts"><b>{bn(hud.cuts)}</b>/{bn(def.roster.length)} কাটা</p>
                <p className="vk-clock" aria-hidden="true"><span ref={clock}>০.০</span> সে.</p>
              </div>
            </div>
            <div className="vk-sky" ref={skyBox} data-edge="" onPointerDown={skyDown} onPointerMove={skyMove} onPointerUp={skyUp} onPointerCancel={skyCancel} onLostPointerCapture={skyCancel}>
              <canvas ref={canvas} className="vk-canvas" role="img" aria-label={`সাকরাইনের আকাশ, ${def.name}। ${bn(def.roster.length)}টার মধ্যে ${bn(hud.cuts)}টা ঘুড়ি কাটা, নাটাইয়ে ${bn(kites)}টা ঘুড়ি।`} />
              <span className="vk-arrow" data-side="left" aria-hidden="true" />
              <span className="vk-arrow" data-side="right" aria-hidden="true" />
              {screen === "play" && ready && (
                <>
                  <p className="vk-intro"><b>{def.name} · {def.title}</b><span>{def.teach}</span></p>
                  <p className="vk-hint"><span className="vk-finger" aria-hidden="true" />আঙুল রাখো: টান, সরাও: ঘুড়ি সরে, তোলো: ঢিল<small>কম্পিউটারে তীর চিহ্ন আর স্পেস</small></p>
                </>
              )}
              {screen === "over" && result && <EndScreen stats={result.stats} slow={slow} choices={choices} onCard={toCard} />}
            </div>
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={() => setSheet(false)} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.shared} card={result.card} site={site} />}
    </div>
  );
}
