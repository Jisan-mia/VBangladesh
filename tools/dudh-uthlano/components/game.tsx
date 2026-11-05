"use client";
// IP: what we avoided — no famous cooking or timing game's name, chef characters, kitchen-timer look, logo or music; the pots, stoves, foam and the voices from the next room are our own.
// The game inside the shared player. Rules live in lib/ (round.ts and step.hot.ts play a pot, pot.ts builds them from a seed,
// session.ts decides pause, input and the hum); this file feeds the finger in, draws, plays sounds and swaps the screens.

import { useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, newSeed, readLevels, sfx, silenceScheduled, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { bn, friendLine, parseShared, potsPlain, versusLine, type Shared } from "../lib/challenge";
import { prepare, newCache, VH, VW, type SceneCache } from "../lib/art";
import { drawFrame } from "../lib/draw.hot";
import { kitchenStars } from "../lib/legacy";
import {
  bestKey, isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, migrateLevels, nextAhead, openLevel, readAhead, readBests, SLUG, starsOf, worldOf, type Mode,
} from "../lib/levels";
import { callerLine, clearKicker, clearLine, coach, edgeOf, glowOf, lossLine, nearMiss, potWord, statusOf, type Status } from "../lib/lines";
import { averageOfRound, liftPot, newRound, spillCount, startPot, SLOW, type Round } from "../lib/round";
import * as S from "../lib/session";
import { alarm, bubble, cleared, doorbell, flare, hum, ignite, lost, pop, powerDown, rattle, setDown, sink, sizzle, starChime } from "../lib/sound";
import { EV_BELL, EV_COLLAPSE, EV_FLARE, EV_NEXT, EV_OVER, EV_POP, EV_SPILL, stepRound } from "../lib/step.hot";
import { againRun, pickedRun, rivalOf, type Run } from "../lib/run";
import { createSlot, windowClock } from "../lib/slot";
import { makeView, type View } from "../lib/view";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, marker: `ektukhani-v-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`,
  bests: `ektukhani-bests-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}`,
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Last = { shared: Omit<Shared, "name">; stars: number };

export function DudhGame() {
  const rootRef = useRef<HTMLDivElement>(null), sceneBox = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null), wrapRef = useRef<HTMLDivElement>(null);
  const bossBar = useRef<HTMLSpanElement>(null), edgeRef = useRef<HTMLDivElement>(null);

  const session = useRef<S.Session>(S.createSession(true));
  const round = useRef<Round>(newRound(1, 1));
  const view = useRef<View>(makeView());
  const cache = useRef<SceneCache | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const voice = useRef<ReturnType<typeof hum> | null>(null);
  const marks = useRef({ status: "" as Status | "", edge: "", glow: -1, bar: -1, tick: 0, alarm: 0, rattle: 0, streak: 0, elapsed: 0, slowUsed: false, bubbles: 0, lastCue: 0 });
  const pending = useRef<Shared | null>(null);
  const timers = useRef({ party: createSlot(windowClock), bell: createSlot(windowClock) });
  const [, bump] = useReducer((count: number) => count + 1, 0);

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n", old: false });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [held, setHeld] = useState(false);
  const [bell, setBell] = useState(false);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Last | null>(null);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  // Before the level store is read: saved progress from the eight old kitchens becomes one star each on the new ladder, once.
  useEffect(() => {
    const moved = migrateLevels(read(KEYS.levels), read(KEYS.best), read(KEYS.marker));
    if (!moved) return;
    if (moved.levels !== null) write(KEYS.levels, moved.levels);
    write(KEYS.marker, moved.marker);
  }, []);
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, run, screen, friend, mode });
  live.current = { slow, run, screen, friend, mode };
  view.current.slow = slow;
  const r = round.current, def = levelDef(run.old ? 1 : run.level), world = run.old ? 0 : def.world;

  // ---- the hum: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { voice.current?.stop(); voice.current = hum(); voice.current.set(round.current.foam); },
    stop: () => { voice.current?.stop(); voice.current = null; },
  };
  const sync = () => S.syncHum(session.current, loops);
  function clearTimers() { timers.current.party.cancel(); timers.current.bell.cancel(); setBell(false); }
  function wakeUp() { S.wake(session.current); sync(); }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); setHeld(false); clearTimers(); sync(); if (pending.current) takeLink(pending.current); },
    onResume: () => { S.resume(session.current); wakeUp(); },
    onRestart: () => {
      S.resume(session.current);
      const { screen: now, run: current } = live.current;
      if (now === "play" || now === "over") begin(again(current));
      else sync();
    },
    onLevels: () => { if (live.current.screen !== "intro") openSheet(); },
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    setHeld(false);
    sync();
  }

  /** The cache for the stage's current size, with whatever the pot on the stove needs painted. */
  function paint() {
    const c = cache.current;
    if (c) prepare(c, round.current.pots[round.current.index]);
  }

  /** A fresh round on the play screen: the first pot waiting on the stove for a press. */
  function begin(next: Run) {
    // A friend's link that arrived mid-round opens now, instead of the round the player asked for.
    if (pending.current) { setSheet(false); S.closeSheet(session.current); takeLink(pending.current); return; }
    silenceScheduled();
    clearTimers();
    round.current = newRound(next.seed, next.level, next.mode, next.old);
    Object.assign(view.current, makeView(), { slow: live.current.slow });
    Object.assign(marks.current, { status: "", edge: "", glow: -1, bar: -1, tick: 0, alarm: 0, rattle: 0, streak: 0, elapsed: 0, slowUsed: false, bubbles: 0 });
    paint();
    setRun(next); setResult(null); setSheet(false); S.closeSheet(session.current); setStatus("ready"); setBell(false);
    show("play");
    if (!next.old && levelDef(next.level).boss === null && worldOf(next.level).scene === 2) powerDown();
    wrapRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
    bump();
  }

  /** The same level again: a friend's seed stays (so the comparison holds), anything else gets fresh pots. */
  function again(current: Run): Run { return againRun(live.current.friend, current, newSeed()); }

  /** A friend's link: their level, on the title with their challenge. */
  function takeLink(link: Shared) {
    pending.current = null;
    silenceScheduled();
    clearTimers();
    setFriend(link);
    setRun({ seed: link.seed, level: link.level, mode: link.mode, old: link.old });
    if (!link.old) setModeState(link.mode);
    round.current = newRound(link.seed, link.level, link.mode, link.old);
    paint();
    if (live.current.screen !== "title") show("title");
    bump();
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    session.current.sound = soundOn();
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(chosen);
    const savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const link = parseShared(window.location.hash);
    if (link) takeLink(link);
    else {
      const level = openLevel(readLevels(read(KEYS.levels), LEVEL_COUNT), savedAhead);
      setRun({ seed: newSeed(), level, mode: chosen, old: false });
      round.current = newRound(1, level, chosen);
      paint();
    }
    // A link pasted into this tab changes only the hash. In-page anchors and junk are ignored; a running round isn't taken over.
    const onHash = () => {
      const next = parseShared(window.location.hash);
      if (!next) return;
      if (S.ticking(session.current) && live.current.screen === "play") { pending.current = next; return; }
      takeLink(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); clearTimers(); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read and step the stove; nothing ships. Assigned every render so it
  // always sees the latest closures.
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    Object.assign(window, { __du: { round: () => round.current, session: () => session.current, view: () => view.current, marks: () => marks.current, begin: (level: number, seed = 7, old = false) => begin({ seed, level, mode: "n", old }), press: () => press(), release: () => release(), step: (dt: number) => step(dt), draw: () => draw(), paint: () => paint() } });
  }

  // ---- the site-wide sound switch: off also cuts queued notes; on starts a fresh hum (never the stub made while muted) ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { voice.current = null; silenceScheduled(); } sync(); }, [sound]);

  // ---- away and back ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); setHeld(false); sync(); if (pending.current) takeLink(pending.current); };
    const onFocus = () => { S.focus(session.current); wakeUp(); };
    const onVisibility = () => { if (document.hidden) { S.hide(session.current); setHeld(false); sync(); if (pending.current) takeLink(pending.current); } else { S.show(session.current); wakeUp(); } };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- one step: the rules, then what changed is heard and seen ----
  function step(dt: number) {
    const s = session.current, rd = round.current, m = marks.current, v = view.current;
    if (!S.ticking(s) || rd.phase === "over") return;
    if (s.breath > 0) { s.breath = Math.max(0, s.breath - dt); return; }
    v.clock += dt;
    const slowNow = live.current.slow, info = MODE_INFO[rd.mode];
    if (slowNow && rd.phase === "rising") m.slowUsed = true;
    if (rd.phase === "rising") m.elapsed += dt;
    const events = stepRound(rd, dt, info.rate * (slowNow ? SLOW : 1), info.ripple * (slowNow ? 0.5 : 1));
    s.rising = rd.phase === "rising";
    const pot = rd.pots[rd.index];
    if (rd.phase === "rising") {
      // Bubbles pop more often and higher as the foam climbs; the tick near the rim says what the edge glow says.
      if ((m.bubbles -= dt * (1 + 8 * rd.foam * rd.foam)) <= 0) { m.bubbles = 1; bubble(rd.foam, Math.random()); }
      if (rd.foam >= 0.9 && !pot.lid && (m.alarm -= dt) <= 0) { m.alarm = 0.2; alarm(); }
      if (pot.lid && rd.foam > 0.6 && (m.rattle -= dt) <= 0) { m.rattle = 0.4 - 0.3 * rd.foam; rattle(); }
      voice.current?.set(rd.foam);
    }
    if (events & EV_BELL) { doorbell(); setBell(true); timers.current.bell.schedule(() => setBell(false), 1600); }
    if (events & EV_FLARE) flare();
    if (events & EV_POP) { pop(); v.popAt = v.clock; }
    if (events & EV_COLLAPSE) { sink(); v.sinkAt = v.clock; }
    if (events & EV_SPILL) {
      s.held = false; setHeld(false);
      sizzle(); m.streak = 0;
      if (!slowNow) shakeScene();
      bump();
    }
    if (events & EV_NEXT) { paint(); bump(); }
    const now = statusOf(rd.phase, pot, rd.t, rd.foam, s.held, false);
    if (now !== m.status) { m.status = now; setStatus(now); }
    edge(rd);
    sync();
    if (events & EV_OVER) finish();
  }

  function shakeScene() {
    const box = sceneBox.current;
    if (!box) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    box.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  }

  /** The danger at the stage's edge, written straight to the DOM only when it changes. */
  function edge(rd: Round) {
    const m = marks.current, el = edgeRef.current;
    if (!el) return;
    const rising = rd.phase === "rising", kind = rising ? edgeOf(rd.foam) : "", glow = rising ? glowOf(rd.foam) : 0;
    if (kind !== m.edge) { m.edge = kind; el.dataset.edge = kind; }
    // Only opacity moves, so the glow costs a composite and nothing else.
    if (glow !== m.glow) { m.glow = glow; el.style.opacity = String(glow); }
  }

  function finish() {
    const rd = round.current, { level, old, mode: played, seed } = rd, slowUsed = marks.current.slowUsed;
    const average = averageOfRound(rd), scores = rd.scores.slice(0, rd.scored), spilled = rd.spills.slice(0, rd.scored);
    const stars = old ? kitchenStars(average) : starsOf(average, played, slowUsed), won = stars >= 1;
    const rival = rivalOf(live.current.friend, { seed, level, old });
    const L = levelDef(old ? 1 : level), boss = !old && L.boss !== null;
    const stats = {
      best: Math.max(...scores), close: scores.filter(score => score >= 90).length, spills: spillCount(rd), seconds: Math.round(marks.current.elapsed),
      scores, spilled, boss, maxStars: old ? 3 : slowUsed ? 2 : MODE_INFO[played].maxStars,
    };
    const near = nearMiss(average, stars, played, slowUsed);
    S.goTo(session.current, "over", performance.now());
    if (won) {
      let record = "", newBest = false;
      if (!old) {
        const nextList = nextAhead(levels.stars, ahead, level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        levels.record(level, stars);
        const bests = readBests(read(KEYS.bests)), key = bestKey(level, played), previous = bests[key] ?? null;
        newBest = previous !== null && average > previous;
        if (previous === null || average > previous) { bests[key] = average; write(KEYS.bests, JSON.stringify(bests)); }
        record = previous === null ? `এই ফোনে লেভেল ${bn(level)}-এর প্রথম গড়।` : newBest ? `নতুন রেকর্ড। আগের সেরা ছিল ${bn(previous)}%।` : `এই ফোনে সেরা: ${bn(previous)}%`;
      } else record = "বন্ধুর পুরোনো রান্নাঘর, তাই তারা জমা হয় না।";
      setResult({ ...stats, won: true, kicker: clearKicker(level, old), title: "", average, stars, line: rival ? versusLine(average, rival.total, rival.name, rd.pots.length) : clearLine(level, old), near, record });
      setLast({ shared: { seed, total: average, scores, spills: spilled, slow: slowUsed, level, mode: played, old }, stars });
      cleared(old ? 0 : L.world);
      for (let star = 0; star < stars; star++) starChime(star, 1.1 + star * 0.28);
      // Confetti only for three stars, a new best or a finale cleared; it belongs to this card, so a new round clears it.
      if (stars === 3 || boss || newBest) timers.current.party.schedule(() => confetti({ colors: ["#ffd166", "#b6462b", "#ffffff", "#2a9d8f"] }), 700);
    } else {
      setResult({ ...stats, won: false, kicker: old ? `পুরোনো রান্নাঘর ${bn(level)}` : `লেভেল ${bn(level)} · ${L.name}`, title: "এবার হলো না", average, stars: 0,
        line: lossLine(level, spillCount(rd), old), near: rival ? versusLine(average, rival.total, rival.name, rd.pots.length) : near, record: "" });
      setLast(null);
      lost();
      if (!live.current.slow) shakeScene();
    }
    setScreen("over");
    setHeld(false);
    sync();
    bump();
  }

  // ---- drawing ----
  function draw() {
    const c = ctx.current, cc = cache.current, rd = round.current;
    if (!c || !cc) return;
    drawFrame(c, cc, rd, view.current);
    const bar = bossBar.current;
    if (bar) {
      const bossPot = rd.pots[rd.index].boss && rd.phase === "rising" && !rd.pots[rd.index].lid ? Math.round(rd.foam * 100) : 0;
      if (bossPot !== marks.current.bar) { marks.current.bar = bossPot; bar.style.transform = `scaleX(${bossPot / 100})`; }
    }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused);

  // ---- size the kitchen to its box (contain), and paint the still layers for that size ----
  const sceneShown = screen === "play" || screen === "over";
  useEffect(() => {
    if (!sceneShown) return;
    const box = sceneBox.current, canvas = canvasRef.current;
    if (!box || !canvas) return;
    const size = () => {
      const width = Math.floor(Math.min(box.clientWidth, (box.clientHeight * VW) / VH));
      if (width < 60) return;
      canvas.style.width = `${width}px`; canvas.style.height = `${Math.round((width * VH) / VW)}px`;
      ctx.current = fitCanvas(canvas, width, (width * VH) / VW);
      cache.current = newCache(canvas.width / VW);
      paint();
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    // The gauge's words are canvas text; repaint once the Bangla fonts are in.
    void document.fonts?.ready.then(size);
    return () => observer.disconnect();
  }, [sceneShown, run.seed, run.level, run.mode, run.old]);

  // ---- the finger on the stove ----
  function liftNow() {
    const rd = round.current, s = session.current, m = marks.current;
    if (!liftPot(rd)) return;
    s.rising = false;
    setDown();
    const score = rd.scores[rd.index];
    m.streak = score >= 90 ? m.streak + 1 : 0;
    if (m.streak > 1) sfx.combo(m.streak - 2); else if (score >= 90) sfx.good();
    if (!live.current.slow) buzz(12);
    edge(rd);
    sync();
    bump();
  }
  function press() {
    const s = session.current, rd = round.current;
    if (!S.press(s, performance.now())) return;
    if (rd.phase === "waiting") {
      startPot(rd); s.rising = true;
      ignite();
      setHeld(true);
      if (marks.current.status === "ready") { marks.current.status = "heat"; setStatus("heat"); }
      sync();
      bump();
    } else if (rd.phase === "rising") liftNow();
    else s.held = false;
  }
  function release() {
    const s = session.current, kind = S.release(s, performance.now());
    setHeld(false);
    // A short tap leaves the milk heating; a real hold lifts the pot the moment it ends.
    if (kind === "hold" && round.current.phase === "rising") liftNow();
  }
  const holdHandlers = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button > 0 || live.current.screen !== "play") return;
      event.preventDefault();
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ }
      press();
    },
    onPointerUp: release, onPointerCancel: release, onLostPointerCapture: release,
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
  };

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => current.old ? current : { ...current, mode: next }); sfx.tap(); }
  function start() {
    sfx.tap();
    const fromFriend = rivalOf(live.current.friend, run);
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode: run.old ? run.mode : mode });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode, old: false }); }
  function openSheet() { S.openSheet(session.current); setSheet(true); sync(); if (pending.current) takeLink(pending.current); }
  function closeSheet() { S.closeSheet(session.current); setSheet(false); wakeUp(); }
  function pickLevel(value: number) {
    if (!isLevel(value) || value > open) return;
    S.closeSheet(session.current);
    begin(pickedRun(live.current.friend, value, mode, newSeed()));
  }

  const won = result?.won ?? false;
  const nextLevel = run.old ? open : run.level < LEVEL_COUNT && run.level + 1 <= open ? run.level + 1 : 0;
  const choices: Choice[] = [
    ...(won && nextLevel ? [{ label: run.old ? `লেভেল ${bn(nextLevel)} খেলো` : "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode, old: false }) }] : []),
    { label: "আবার খেলো", run: () => begin(again(run)) },
    { label: "সব লেভেল", run: openSheet },
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const isPress = (key: string) => key === " " || key === "Enter" || key === "ArrowDown";
    const typing = (event: KeyboardEvent) => Boolean((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]"));
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || typing(event)) return;
      const s = session.current, key = event.key, lower = key.toLowerCase();
      if (s.paused || s.sheet) return;
      if (lower === "p" && s.screen === "play") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ") && !event.repeat) { event.preventDefault(); start(); return; }
      if (s.screen === "play" && isPress(key)) { event.preventDefault(); if (!event.repeat) press(); return; }
      if (s.screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => {
      if (typing(event) || session.current.screen !== "play" || !isPress(event.key)) return;
      event.preventDefault();
      release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  const total = totalStars(levels.stars);
  const finale = !run.old && def.boss;
  const pot = r.pots[r.index];
  const [big, small] = coach(screen === "play" ? status : "ready");
  const caller = screen === "play" && !player.paused ? callerLine(world, r.phase, r.index, r.lastLift, r.spills[r.index] && r.phase === "result", r.index === r.pots.length - 1) : null;
  const lastScore = r.scores[r.index], lastSpilled = r.spills[r.index];

  return (
    <div className="du-wrap" ref={wrapRef}>
      <div className="du" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={world} data-edge="">
        {screen === "title" && (
          <TitleScreen level={run.level} old={run.old} mode={run.old ? run.mode : mode} friend={friend} stars={total} onStart={start} onMode={setMode} onLevels={openSheet} />
        )}
        {screen === "intro" && <Story onDone={storyDone} />}
        {sceneShown && (
          <>
            <div className="du-hud">
              <p className="du-badge"><b>{run.old ? `রান্নাঘর ${bn(run.level)}` : `লেভেল ${bn(run.level)}`}</b>{!run.old && run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}<small>{run.old ? "বন্ধুর পুরোনো রান্নাঘর" : def.name}</small></p>
              <p className="du-boss" data-on={finale ? "1" : undefined} aria-label={finale ? `${def.boss!.name}: শেষ পাতিল` : undefined}>
                {finale && <><b>{def.boss!.name}</b><span className="du-boss-bar" aria-hidden="true"><span ref={bossBar} /></span></>}
              </p>
              <div className="du-count">
                <p aria-hidden="true">পাতিল <b>{bn(Math.min(r.index + 1, r.pots.length))}/{bn(r.pots.length)}</b></p>
                <span className="du-bell" data-on={bell || undefined} aria-live="polite">{bell ? "টিং-টং" : ""}</span>
              </div>
            </div>
            <div className="du-board">
              <div className="du-scene" ref={sceneBox} {...(screen === "play" ? holdHandlers : {})}>
                <canvas ref={canvasRef} role="img" aria-label={`রান্নাঘর: চুলায় ${pot.stove === "gas" ? "গ্যাসের" : "মাটির"} চুলা, পাতিলে দুধের ফেনা উঠছে`} />
                <div className="du-edge" ref={edgeRef} data-edge="" aria-hidden="true" />
                {caller && <p className="du-caller" key={`${r.index}-${r.phase}`}><small>{caller.who}</small>{caller.text}</p>}
                {screen === "play" && r.phase === "result" && (
                  <p className="du-pop" data-spill={lastSpilled} key={r.index}>
                    {lastSpilled ? <b>উথলে গেল!</b> : <><b>{bn(lastScore)}%</b><span>{potWord(lastScore, false)}{marks.current.streak > 1 ? ` · টানা ${bn(marks.current.streak)}টা` : ""}</span></>}
                  </p>
                )}
              </div>
              {screen === "play" ? (
                <>
                  <ol className="du-pots" aria-label={`${potsPlain(r.pots.length)}টা পাতিলের স্কোর`} style={{ gridTemplateColumns: `repeat(${r.pots.length}, minmax(0, 1fr))` }}>
                    {r.pots.map((each, index) => {
                      const scored = index < r.scored, spilled = r.spills[index];
                      return (
                        <li key={index} data-now={index === r.index} data-state={scored ? (spilled ? "spill" : "ok") : "todo"} data-boss={each.boss || undefined}>
                          <span>{bn(index + 1)}{each.boss ? " ×২" : ""}</span>
                          <b>{scored ? (spilled ? "উথলেছে" : `${bn(r.scores[index])}%`) : "—"}</b>
                        </li>
                      );
                    })}
                  </ol>
                  <button type="button" className="du-press" data-held={held || undefined} data-status={status} data-phase={r.phase} disabled={r.phase === "result"} {...holdHandlers}
                    onClick={event => { if (event.detail === 0) { press(); release(); } }}>
                    <b>{big}</b>{small && <small aria-live="polite">{small}</small>}
                  </button>
                </>
              ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={last ? toCard : null} />}
            </div>
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
        <p className="du-sr" aria-live="polite">{screen === "over" && result ? `${result.kicker}। গড় ${bn(result.average)}%।` : ""}</p>
      </div>
      {friend && screen === "title" && <p className="du-sr">{friendLine(friend)}</p>}
      {last && screen === "over" && <ResultCard key={`${last.shared.level}-${last.shared.seed}-${last.shared.total}`} shared={last.shared} stars={last.stars} site={site} />}
    </div>
  );
}

