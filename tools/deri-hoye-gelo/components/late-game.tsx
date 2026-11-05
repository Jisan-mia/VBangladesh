"use client";
// IP: what we avoided — no famous runner game's name, look, camera or characters: no three-lane chase from behind, no rails, trains, guards, temples or coins, no "run"/"surf" in the title; ours is a side-on village lane drawn from scratch, a kid in a plain school shirt with a satchel, and our own rule numbers.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps them, session.ts decides what input counts);
// this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, newSeed, readLevels, silenceScheduled, sfx, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { finaleStart, girlFor, KID_X, PAGE, PUDDLE, MUD, UNIT } from "../lib/course";
import { drawFrame } from "../lib/draw.hot";
import { ARRIVED, createRun, E, END, pieceAt, READY, RUN, tenthsOf, type Run } from "../lib/game";
import type { Card } from "../lib/card";
import { isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, starsOf, type Mode } from "../lib/levels";
import {
  bn, bumpLine, compareLine, friendFits, headline, humanLine, KEYS, LADDER, migrateLadder, nearMiss, parseShared, SLUG, starsOfShared, type Shared,
} from "../lib/link";
import { clearFlag, flyPage, makeScene, milestoneWord, puff, resetFx, say, setFlag, setKid, splash, WORD, type Scene, type Sprite } from "../lib/scene";
import * as S from "../lib/session";
import { stepRun } from "../lib/step.hot";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { sound } from "./sound";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";
import { loadCardFonts } from "../../../shared/card-canvas";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Plan = { seed: number; level: number; mode: Mode };
type Result = { stats: EndStats; shared: Omit<Shared, "name" | "won" | "oldDay">; card: Omit<Card, "name"> };
type Hud = { pages: number; stumbles: number; bell: number; bossLeft: number; bossOn: boolean; ready: boolean; late: boolean; tiffin: boolean };

const hudOf = (g: Run): Hud => ({
  pages: g.pages, stumbles: g.stumbles, bell: g.endless ? 0 : Math.max(0, Math.ceil(g.bell - (g.phase >= END ? g.endAt : g.t))), bossLeft: g.bossLeft,
  bossOn: g.bossMax > 0 && g.meters >= finaleStart(g.def) - 8, ready: g.phase === READY, late: g.late, tiffin: g.tiffin,
});
const sameHud = (a: Hud, b: Hud) => a.pages === b.pages && a.stumbles === b.stumbles && a.bell === b.bell && a.bossLeft === b.bossLeft && a.bossOn === b.bossOn && a.ready === b.ready && a.late === b.late && a.tiffin === b.tiffin;

const Bell = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="dh-bell-icon"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
);

/** A new run takes down any confetti still falling from the last card (the kit draws it on a canvas of its own, over the page). */
function clearConfetti() {
  document.querySelectorAll<HTMLCanvasElement>('body > canvas[aria-hidden="true"]').forEach(node => { if (node.style.zIndex === "9999") node.remove(); });
}

/** The piece that made an event at `x` (page flights start from where the page was). */
function pieceAtX(g: Run, x: number) {
  for (let index = g.first; index < g.count; index++) if (pieceAt(g, index).x === x) return pieceAt(g, index);
  return null;
}

export function LateGame() {
  const lane = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null);
  const gateText = useRef<HTMLElement>(null), bar = useRef<HTMLSpanElement>(null);
  const scene = useRef<Scene | null>(null);
  const run = useRef<Run>(createRun(1, 1));
  const session = useRef<S.Session>(S.createSession());
  const fonts = useRef(false);
  const view = useRef({ edge: "", flash: 0, clock: 0, stride: 0, mile: null as Sprite | null, mileAt: -9, hud: null as Hud | null });
  const bestAtStart = useRef<number | null>(null);

  const [screen, setScreen] = useState<S.Screen>("title");
  const [plan, setPlan] = useState<Plan>({ seed: 1, level: 1, mode: "n" });
  const [hud, setHud] = useState<Hud>(() => hudOf(run.current));
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  /** Preview images only (`&og=1`): the friend's own run as a finished card, nothing saved on this phone. */
  const [preview, setPreview] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [site, setSite] = useState("");
  const [mode, setModeState] = useState<Mode>("n");
  const [slow] = useSlowMode();
  const [soundSwitch] = useSound();
  const levels = useLevels(LADDER, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, plan, friend, levels, ahead, best });
  live.current = { slow, screen, plan, friend, levels, ahead, best };
  const def = levelDef(plan.level), world = def.world, girl = girlFor(plan.seed);

  const player = useGamePlayer({
    onPause: () => S.pause(session.current, run.current),
    onResume: () => S.resume(session.current, run.current),
    onRestart: () => { S.resume(session.current, run.current); if (live.current.screen === "play" || live.current.screen === "over") begin(live.current.plan); },
    onLevels: () => setSheet(true),
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now(), run.current);
    setScreen(next);
  }

  /** A fresh run on the play screen, waiting for the first press. Cuts the last card's chimes. */
  function begin(next: Plan) {
    silenceScheduled();
    clearConfetti();
    const fresh = createRun(next.seed, next.level, next.mode);
    run.current = fresh;
    if (scene.current) { resetFx(scene.current); setKid(scene.current, girlFor(next.seed)); }
    Object.assign(view.current, { edge: "", flash: 0, stride: 0, mile: null, mileAt: -9, hud: hudOf(fresh) });
    lane.current?.setAttribute("data-edge", "");
    setPlan(next); setHud(hudOf(fresh)); setResult(null); setSheet(false);
    show("play");
    sound.motif(levelDef(next.level).world);
    applyFlag(next);
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The friend's flag stands where they stopped, on their own road only. */
  function applyFlag(next: Plan = live.current.plan) {
    const sc = scene.current, link = live.current.friend;
    if (!sc) return;
    if (link && !link.oldDay && friendFits(link, next.seed, next.level, next.mode) && (!link.won || !link.level)) setFlag(sc, link.meters, link.name);
    else clearFlag(sc);
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    const link = parseShared(window.location.hash);
    setFriend(link);
    live.current.friend = link;
    setSite(window.location.host);
    if (link && new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") setPreview(true);
    // Before the ladder is read: an old phone's six days (or its endless best) open the first levels, once.
    const moved = migrateLadder(read(KEYS.ladder), read(KEYS.days), read(KEYS.best));
    if (moved) { write(KEYS.ladder, moved); for (const [level, earned] of Object.entries(JSON.parse(moved) as Record<string, number>)) levels.record(Number(level), earned); }
    const saved = readLevels(read(KEYS.ladder), LEVEL_COUNT), savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedBest = Number(read(KEYS.best));
    setBest(read(KEYS.best) !== null && Number.isFinite(savedBest) ? savedBest : null);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    const playMode = link && !link.oldDay && link.level > 0 ? link.mode : chosen;
    setModeState(playMode);
    const first: Plan = link ? { seed: link.seed, level: link.level, mode: playMode } : { seed: newSeed(), level: openLevel(saved, savedAhead), mode: chosen };
    setPlan(first);
    run.current = createRun(first.seed, first.level, first.mode);
    setHud(hudOf(run.current));
    return () => { silenceScheduled(); };
  }, []);

  // A friend's link opened on a page that is already here (only the hash changes): never under a run, so the run ends
  // and the title shows their road.
  useEffect(() => {
    const onHash = () => {
      const link = parseShared(window.location.hash);
      if (!link) return;
      silenceScheduled();
      setFriend(link);
      live.current.friend = link;
      const played = link.oldDay || link.level === 0 ? live.current.plan.mode : link.mode;
      if (!link.oldDay && link.level > 0) setModeState(link.mode);
      const next: Plan = { seed: link.seed, level: link.level, mode: played };
      run.current = createRun(next.seed, next.level, next.mode);
      setPlan(next); setHud(hudOf(run.current)); setResult(null); setSheet(false);
      show("title");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __dh: { run: () => run.current, session: () => session.current, scene: () => scene.current, plan: () => live.current.plan } });
  }, []);

  useEffect(() => { if (!soundSwitch) silenceScheduled(); }, [soundSwitch]);

  // ---- away and back: the real blur or a hidden tab lets go of every key and finger ----
  useEffect(() => {
    const onBlur = () => S.blur(session.current, run.current);
    const onFocus = () => S.focus(session.current);
    const onVisibility = () => { if (document.hidden) S.hide(session.current, run.current); else S.show(session.current); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- the lane scrolled off a desktop page: hands off and nothing moves until it's back (ticking needs inView) ----
  const playing = screen === "play" || screen === "over";
  useEffect(() => {
    const box = lane.current;
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => S.setInView(session.current, entry.isIntersecting, run.current), { threshold: 0.2 });
    observer.observe(box);
    return () => { observer.disconnect(); S.setInView(session.current, true); };
  }, [playing]);

  // ---- the level list is a choice screen: nothing moves behind it ----
  useEffect(() => { if (sheet) S.openSheet(session.current, run.current); else S.closeSheet(session.current, run.current); }, [sheet]);

  // ---- one step: input, rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = run.current;
    if (!S.ticking(s) || S.breathing(s, dt)) return;
    S.takeInput(s, g);
    stepRun(g, dt, live.current.slow);
    for (let i = 0; i < g.evCount; i++) onEvent(g, g.ev[i], g.evX[i]);
    g.evCount = 0;
    // Soft footsteps each stride on the ground.
    const stride = Math.floor(g.d / 36);
    if (stride !== view.current.stride) { view.current.stride = stride; if (g.phase === RUN && g.air < 0 && !g.ducking && g.speed > 0) sound.step(stride % 2 === 0); }
    const now = hudOf(g);
    if (!view.current.hud || !sameHud(view.current.hud, now)) { view.current.hud = now; setHud(now); }
  }

  function onEvent(g: Run, kind: number, x: number) {
    const sc = scene.current, slowNow = live.current.slow, t = g.t, ground = sc?.groundY ?? 0, kid = g.d + KID_X;
    if (kind === E.JUMP) { sound.hop(); if (sc) { sc.takeoffAt = t; if (!slowNow) puff(sc, kid, ground, t, 3); } }
    else if (kind === E.LAND) { sound.land(); if (sc) { sc.landAt = t; if (!slowNow) puff(sc, kid, ground, t, 3.5); } }
    else if (kind === E.STUMBLE) {
      const wet = g.hitKind === PUDDLE || g.hitKind === MUD;
      if (wet) sound.splash(); else sound.bump();
      if (sc) {
        if (wet && !slowNow) splash(sc, kid, ground - 2, t);
        say(sc, wet ? WORD.SPLASH : WORD.OOF, t);
        if (!slowNow) sc.shakeAt = t;
      }
      view.current.flash = 0.5;
    } else if (kind === E.PAGE) {
      sound.page(g.pages - 1);
      const piece = pieceAtX(g, x);
      if (sc) flyPage(sc, x + 9, ground - (piece && piece.kind === PAGE ? piece.y : 8) - 8, t);
    } else if (kind === E.TIFFIN) { sound.tiffin(); if (sc) say(sc, WORD.TIFFIN, t); }
    else if (kind === E.SAVED) { sound.saved(); if (sc) say(sc, WORD.SAVED, t); view.current.flash = 0.35; }
    else if (kind === E.MILESTONE) { sound.milestone(); if (sc) { view.current.mile = milestoneWord(sc, g.meters - (g.meters % 100), `${bn(g.meters - (g.meters % 100))} মিটার!`); view.current.mileAt = t; } }
    else if (kind === E.GATE_M) { sound.bell(false); if (sc) say(sc, WORD.GATE, t); }
    else if (kind === E.BOSS) sound.notch();
    else if (kind === E.TICK) sound.tick();
    else if (kind === E.WARN) sound.whoosh();
    else if (kind === E.ARRIVE) { keepStars(g); sound.bell(false); if (sc) say(sc, WORD.MADE_IT, t); }
    else if (kind === E.LATE) { sound.bell(true); if (sc) say(sc, WORD.LATE, t); view.current.flash = 0.6; }
    else if (kind === E.CRASH) {
      const wet = g.hitKind === PUDDLE || g.hitKind === MUD;
      if (wet) sound.splash(); else sound.bump();
      if (sc) { if (wet && !slowNow) splash(sc, kid, ground - 2, t); say(sc, wet ? WORD.SPLASH : WORD.OOF, t); if (!slowNow) sc.shakeAt = t; }
      view.current.flash = 0.6;
      keepBest(g.meters);
    } else if (kind === E.OVER) finish();
  }

  /** The level is cleared: stars are recorded now, so a quick tap on the end moment can't lose them. */
  function keepStars(g: Run) {
    if (g.endless) return;
    const { level } = live.current.plan, earned = starsOf(true, g.stumbles, g.pages, level);
    const list = nextAhead(live.current.levels.stars, live.current.ahead, level);
    write(KEYS.ahead, JSON.stringify(list)); setAhead(list);
    live.current.levels.record(level, earned);
  }
  /** The endless best is kept the moment the run ends, not when the end screen shows. */
  function keepBest(meters: number) {
    const before = live.current.best;
    bestAtStart.current = before;
    if (meters > 0 && (before === null || meters > before)) { write(KEYS.best, String(meters)); setBest(meters); live.current.best = meters; }
  }

  function finish() {
    const g = run.current, { level, mode: played, seed } = live.current.plan, d = levelDef(level), link = live.current.friend;
    const won = g.endKind === ARRIVED, earned = starsOf(won, g.stumbles, g.pages, level), tenths = tenthsOf(g.endAt);
    const previous = g.endless ? bestAtStart.current : null;
    const bestLine = !g.endless ? "" : previous === null ? `এই ফোনে প্রথম রেকর্ড: ${bn(g.meters)} মিটার।` : g.meters > previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(previous)} মিটার।` : `এই ফোনে সেরা ${bn(previous)} মিটার।`;
    const rival = link && friendFits(link, seed, level, played) ? link : null;
    const versus = rival ? compareLine({ won, stumbles: g.stumbles, pages: g.pages, tenths, meters: g.meters }, rival) : "";
    const slowUsed = live.current.slow;
    setResult({
      stats: {
        level, name: d.name, title: d.title, finale: d.finale?.name ?? "", won, meters: g.meters, gate: g.gateM, stars: earned,
        jobs: [won, won && g.stumbles === 0, g.pages >= 3], pages: g.pages, stumbles: g.stumbles, tenths, spare: won ? Math.max(0, Math.round((g.bell - g.endAt) * 10)) : 0,
        jumps: g.jumps, ducks: g.ducks, cleared: g.cleared, bestStreak: g.bestStreak,
        headline: headline(level, won, g.meters), trip: g.hitKind >= 0 ? bumpLine(g.hitKind) : "ঘণ্টা পড়ে গেল!",
        line: versus || humanLine({ level, won, stumbles: g.stumbles, pages: g.pages, meters: g.meters }),
        near: nearMiss({ level, won, stumbles: g.stumbles, pages: g.pages, meters: g.meters, best: previous, mode: played }), best: bestLine,
      },
      shared: { seed, meters: g.meters, level, mode: played, slow: slowUsed, stumbles: g.stumbles, pages: g.pages, tenths },
      card: { seed, meters: g.meters, level, mode: played, stars: earned, won, stumbles: g.stumbles, pages: g.pages, tenths, slow: slowUsed },
    });
    show("over");
    // The stars and the fanfare are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    const record = g.endless && g.meters > 0 && (previous === null || g.meters > previous);
    if (won) { sound.stars(earned, earned === 3); if (earned === 3) confetti(); }
    else if (record) { sound.stars(0, true); confetti(); }
    else sound.lose();
  }

  function draw() {
    const target = canvas.current, sc = scene.current;
    if (!target || !sc) return;
    const g = run.current, v = view.current, now = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (v.clock || now)));
    v.clock = now;
    if (S.ticking(session.current)) sc.clock += dt;
    drawFrame(sc, g, live.current.slow, v.mile, v.mileAt);
    if (v.flash > 0) v.flash -= dt;
    const edge = v.flash > 0 ? "hit" : g.phase === RUN && g.late ? "late" : "";
    if (edge !== v.edge) { v.edge = edge; lane.current?.setAttribute("data-edge", edge); }
    const wide = g.endless ? 1 : g.gateM;
    if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, g.d / UNIT / wide)})`;
    if (gateText.current) gateText.current.textContent = bn(g.endless ? g.meters : Math.max(0, g.gateM - g.meters));
  }

  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the lane to its box and pre-render this world's sprites ----
  useEffect(() => {
    const box = lane.current, target = canvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      scene.current = makeScene(target, width, height, Math.min(2, window.devicePixelRatio || 1), world, girl, fonts.current, scene.current);
      const sc = scene.current;
      // The pads sit in the verge below the road; on a short stage they ride over the road's foot.
      const room = (sc.viewH - sc.groundY - 44) * (width / 360);
      box.style.setProperty("--pad-h", `${Math.round(Math.max(60, Math.min(124, room - 14)))}px`);
      applyFlag();
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    // The shop signs are Bangla text baked into a sprite; paint them again once the font is in.
    void loadCardFonts("চা মুদি দর্জি স্কুল ঠিক সময়ে ঢং ঢং গেট পার ছপাৎ উফ চলো টিফিন বাঁচলে").then(() => { fonts.current = true; size(); }).catch(() => { /* the system font draws the signs */ });
    return () => observer.disconnect();
  }, [playing, world]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || sheet) return;
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
        const pressedKey = S.keyOf(key);
        if (pressedKey) { event.preventDefault(); if (!event.repeat) S.keyDown(s, pressedKey); }
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        const onButton = target?.closest?.("button");
        if (onButton && !onButton.classList.contains("dh-title-start")) return;
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" || key === "r" || key === "R" ? 1 : key === "3" ? 2 : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => {
      const pressedKey = S.keyOf(event.key);
      if (!pressedKey) return;
      // Space on a focused button would also "click" it on keyup: during play the key belongs to the game.
      if (screen === "play") event.preventDefault();
      S.keyUp(session.current, pressedKey);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- the road: a thumb here jumps (hold for higher), swiped down it ducks; the two pads do the same ----
  function laneDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button, a")) return;
    if (!S.laneDown(session.current, event.pointerId, event.clientX, event.clientY)) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already gone */ }
  }
  const laneMove = (event: ReactPointerEvent<HTMLDivElement>) => { S.laneMove(session.current, event.pointerId, event.clientX, event.clientY); };
  const laneUp = (event: ReactPointerEvent<HTMLDivElement>) => S.laneUp(session.current, event.pointerId);
  function padDown(event: ReactPointerEvent<HTMLButtonElement>, duck: boolean) {
    if (event.button > 0) return;
    if (!S.padDown(session.current, duck, event.pointerId)) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* fine */ }
  }
  const padUp = (event: ReactPointerEvent<HTMLButtonElement>, duck: boolean) => S.padUp(session.current, duck, event.pointerId);
  /** A keyboard "click" (detail 0) on a pad is a quick tap. */
  function padClick(event: ReactMouseEvent<HTMLButtonElement>, duck: boolean) {
    if (event.detail !== 0) return;
    if (S.padDown(session.current, duck, -2)) S.padUp(session.current, duck, -2);
  }

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setPlan(current => ({ ...current, mode: next })); sfx.tap(); }
  const lockedMode = friend !== null && !friend.oldDay && friend.level > 0 && friend.level === plan.level && friend.seed === plan.seed;
  function start() {
    sfx.tap();
    const fits = friendFits(friend, plan.seed, plan.level, lockedMode ? plan.mode : mode);
    if (!read(KEYS.intro) && !friend) { show("intro"); return; }
    begin(fits || lockedMode ? plan : { ...plan, mode });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...plan, mode }); }
  function pickLevel(level: number) {
    if (level !== 0 && (!isLevel(level) || level > open)) return;
    const rival = friend && friend.level === level && (friend.oldDay || friend.level === 0 || friend.mode === mode) ? friend : null;
    begin({ seed: rival ? rival.seed : newSeed(), level, mode: rival && !rival.oldDay && rival.level > 0 ? rival.mode : mode });
  }
  function ownGame() {
    setFriend(null);
    live.current.friend = null;
    history.replaceState(history.state, "", location.pathname + location.search);
    const saved = readLevels(read(KEYS.ladder), LEVEL_COUNT), level = openLevel(saved, ahead);
    const next: Plan = { seed: newSeed(), level, mode };
    run.current = createRun(next.seed, next.level, next.mode);
    setPlan(next); setHud(hudOf(run.current));
  }
  const again = () => begin({ ...plan, seed: friendFits(friend, plan.seed, plan.level, plan.mode) ? plan.seed : newSeed() });
  const nextLevel = plan.level > 0 && plan.level < LEVEL_COUNT && plan.level + 1 <= open ? plan.level + 1 : 0;
  const won = Boolean(result?.stats.won);
  const choices: Choice[] = won && nextLevel
    ? [{ label: "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode }) }, { label: "আবার খেলো", run: again }, { label: "সব লেভেল", run: () => setSheet(true) }]
    : [{ label: "আবার খেলো", run: again },
      ...(mode !== "e" && !won && plan.level > 0 ? [{ label: "সহজে খেলো", run: () => { setMode("e"); begin({ ...plan, seed: newSeed(), mode: "e" }); } }]
        : won && plan.level === LEVEL_COUNT ? [{ label: "যত দূর পারো", run: () => begin({ seed: newSeed(), level: 0, mode }) }] : []),
      { label: "সব লেভেল", run: () => setSheet(true) }];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const total = totalStars(levels.stars);
  const endless = plan.level === 0, finale = def.finale;
  const shownMode = lockedMode ? plan.mode : mode;

  return (
    <div className="dh-wrap" ref={wrap}>
      <div className="dh" data-slow={slow || undefined} data-screen={screen} data-world={world}>
        {screen === "title" && <TitleScreen level={plan.level} mode={shownMode} friend={friend} stars={total} girl={girl} slow={slow} lockedMode={lockedMode} onStart={start} onMode={setMode} onLevels={() => setSheet(true)} onOwn={ownGame} />}
        {screen === "intro" && <Story girl={girl} onDone={storyDone} />}
        {playing && (
          <div className="dh-play">
            <div className="dh-lane" ref={lane} data-edge="" onPointerDown={laneDown} onPointerMove={laneMove} onPointerUp={laneUp} onPointerCancel={laneUp} onLostPointerCapture={laneUp} onContextMenu={event => event.preventDefault()}>
              <canvas ref={canvas} className="dh-canvas" role="img" aria-label={`${def.name}-এর পথে স্কুলের দিকে এক বাচ্চা। ${endless ? "" : `গেট ${bn(def.gate)} মিটারে, ঘণ্টার আগে পৌঁছাও। `}চাপ দিলে লাফ, নিচে টানলে মাথা নিচু।`} />
              {!endless && <span className="dh-progress" aria-hidden="true" ref={bar} />}
              <div className="dh-hud" aria-hidden={screen !== "play"}>
                <div className="dh-hud-left">
                  <p className="dh-badge"><b>{endless ? "যত দূর পারো" : `লেভেল ${bn(plan.level)}`}</b>{!endless && plan.mode !== "n" && <span>{MODE_INFO[plan.mode].name}</span>}</p>
                  {endless ? <p className="dh-tiffin" data-on={hud.tiffin || undefined}>টিফিন {hud.tiffin ? "আছে" : "নেই"}</p>
                    : <p className="dh-pages" aria-label={`খাতার ${bn(hud.pages)}টা পাতা`}>{[0, 1, 2].map(at => <i key={at} data-on={at < hud.pages} />)}</p>}
                </div>
                <div className="dh-hud-mid">
                  {!endless && (
                    <p className="dh-clock" data-late={hud.late || undefined} aria-label={`ঘণ্টা পড়তে আর ${bn(hud.bell)} সেকেন্ড`}>
                      <Bell /><b>{bn(hud.bell)}</b>
                    </p>
                  )}
                  {finale && hud.bossOn && (
                    <p className="dh-boss" aria-label={`${finale.name}: আর ${bn(hud.bossLeft)}টা বাকি`}>
                      <b>{finale.name}</b>
                      <span>{Array.from({ length: run.current.bossMax }, (_, at) => <i key={at} data-on={at < hud.bossLeft} />)}</span>
                    </p>
                  )}
                </div>
                <div className="dh-hud-right">
                  <p className="dh-gate">{endless ? "" : "গেট "}<b ref={gateText}>{bn(endless ? 0 : def.gate)}</b> {endless ? "মিটার" : "মি"}</p>
                  {!endless && <p className="dh-stumbles" data-on={hud.stumbles > 0 || undefined}>হোঁচট {bn(hud.stumbles)}</p>}
                </div>
              </div>
              {screen === "play" && hud.ready && (
                <>
                  <p className="dh-intro"><b>{endless ? def.title : `${def.name} · ${def.title}`}</b><span>{def.teach}</span></p>
                  <p className="dh-hint"><span className="dh-finger" aria-hidden="true" />চাপ দাও: রওনা<small>কম্পিউটারে স্পেস চাপো</small></p>
                </>
              )}
              {screen === "play" && (
                <div className="dh-pad" aria-label="লাফ আর নিচু হওয়ার বোতাম">
                  <button type="button" className="dh-duck" onPointerDown={event => padDown(event, true)} onPointerUp={event => padUp(event, true)} onPointerCancel={event => padUp(event, true)} onLostPointerCapture={event => padUp(event, true)} onClick={event => padClick(event, true)}>
                    <span aria-hidden="true">↓</span>নিচু হও
                  </button>
                  <button type="button" className="dh-jump" onPointerDown={event => padDown(event, false)} onPointerUp={event => padUp(event, false)} onPointerCancel={event => padUp(event, false)} onLostPointerCapture={event => padUp(event, false)} onClick={event => padClick(event, false)}>
                    <span aria-hidden="true">↑</span>লাফ দাও
                  </button>
                </div>
              )}
              {screen === "over" && result && <EndScreen stats={result.stats} slow={slow} choices={choices} onCard={toCard} />}
            </div>
          </div>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={plan.level} mode={shownMode} best={best} onMode={setMode} onPick={pickLevel} onClose={() => setSheet(false)} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.shared} card={result.card} site={site} />}
      {preview && friend && (
        <ResultCard site={site} startName={friend.name}
          result={{ seed: friend.seed, meters: friend.meters, level: friend.level, mode: friend.mode, slow: friend.slow, stumbles: friend.stumbles, pages: friend.pages, tenths: friend.tenths }}
          card={{ seed: friend.seed, meters: friend.meters, level: friend.level, mode: friend.mode, stars: starsOfShared(friend), won: friend.won, stumbles: friend.stumbles, pages: friend.pages, tenths: friend.tenths, slow: friend.slow }} />
      )}
      <p className="dh-sr" aria-live="polite">{screen === "play" && hud.ready ? "চাপ দিলে দৌড় শুরু। আবার চাপলে লাফ, নিচে টানলে মাথা নিচু।" : ""}</p>
    </div>
  );
}
