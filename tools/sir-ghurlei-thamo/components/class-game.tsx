"use client";
// IP: what we avoided — nothing from the famous red-light/green-light series (no doll, song, track suits, numbered players or elimination); no real school, uniform badge or textbook; the teacher is kind (no cane, no scolding past a raised eyebrow) and the chit is never about exams.
// The game inside the shared player. Rules live in lib/ (class.ts builds the seeded routines, step.hot.ts plays them,
// session.ts decides pause, input and the hum); this file feeds the finger in, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, newSeed, readLevels, sfx, shake, silenceScheduled, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { atThrow, scoreOf, starTargets, type Targets } from "../lib/bot";
import { bn, compareLine, parseShared, seconds, type Shared } from "../lib/challenge";
import {
  BACK, benchCount, benchesReached, BLIND, COUGH, createGame, DARK, DIM, DROP, FLICK, LENS, makeClass, PEEK, REPLIES, TELL, TITLE, W_TELL, WIPE, WRITE,
  type Game,
} from "../lib/class";
import { drawFrame, makeView } from "../lib/draw.hot";
import { CLASSIC } from "../lib/legacy";
import { bestKey, isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, readBests, SLUG, starsOf, WORLDS, type Mode } from "../lib/levels";
import { clearKicker, clearLine, coach, edgeOf, lossLine, lostBy, migrateLevels, nearMiss, statusOf, type Status } from "../lib/lines";
import { openChit } from "../lib/panels";
import { buildLayers, SCENE_H, SCENE_W, type Layers } from "../lib/scene";
import * as S from "../lib/session";
import { bell, chalk, cleared, corridor, cough, duster, footsteps, hum, knock, lost, phew, powerDown, powerUp, rustle, snore, squeak, starChime, toss } from "../lib/sound";
import { stepGame } from "../lib/step.hot";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, bests: `ektukhani-times-${SLUG}`,
  mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}`, tap: `ektukhani-tap-${SLUG}`,
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** Fixed clock strings, so a frame never formats a number. */
const CLOCK = Array.from({ length: 1201 }, (_, tenths) => seconds(tenths));

type Run = { seed: number; level: number; mode: Mode; old: boolean };
type Last = { shared: Omit<Shared, "name">; stars: number };

export function ClassGame() {
  const rootRef = useRef<HTMLDivElement>(null), sceneBox = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null), barRef = useRef<HTMLSpanElement>(null), wrapRef = useRef<HTMLDivElement>(null);

  const session = useRef<S.Session>(S.createSession(true));
  const game = useRef<Game>(createGame(makeClass(1, 1)));
  const view = useRef(makeView());
  const layers = useRef<Layers | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const targets = useRef<Targets>({ three: 0, two: 0 });
  const voice = useRef<ReturnType<typeof hum> | null>(null);
  const marks = useRef({ kind: -1, wKind: -1, light: -1, catches: 0, close: 0, bench: 0, throwing: false, status: "" as Status | "", edge: "", glow: -1, tenths: -1, bar: -1, scratch: 0, stroke: 0, run: 0, lastDraw: 0, origin: false });
  const pending = useRef<Shared | null>(null), pulse = useRef(0);

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n", old: false });
  const [mode, setModeState] = useState<Mode>("n");
  const [tapMode, setTapModeState] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [held, setHeld] = useState(false);
  const [catches, setCatches] = useState(0);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Last | null>(null);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  // Before the level store is read: an old phone's best time from the original class 5 opens levels 1–6, once.
  useEffect(() => {
    const moved = migrateLevels(read(KEYS.levels), read(KEYS.best));
    if (moved) write(KEYS.levels, moved);
  }, []);
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, run, screen, friend });
  live.current = { slow, run, screen, friend };
  view.current.slow = slow;
  const def = levelDef(run.level), world = run.old ? 0 : def.world, klass = game.current.klass;

  // ---- the hum: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { voice.current?.stop(); voice.current = hum(); },
    stop: () => { voice.current?.stop(); voice.current = null; },
  };
  const sync = () => S.syncHum(session.current, loops);
  const setHolding = (next: boolean) => { if (next !== session.current.held) return; setHeld(next); };

  function wakeUp() { S.wake(session.current); sync(); }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); setHeld(false); sync(); if (pending.current) takeLink(pending.current); },
    onResume: () => { S.resume(session.current); wakeUp(); },
    onRestart: () => {
      S.resume(session.current);
      const { screen: now, run: current } = live.current;
      if (now === "play" || now === "over") begin(again(current));
      else sync();
    },
    onLevels: () => { if (live.current.screen === "play" || live.current.screen === "over" || live.current.screen === "title") openSheet(); },
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    setHeld(false);
    sync();
  }

  /** A fresh class on the play screen: the bell, the teacher writing, the chit waiting on the first bench for a press. */
  function begin(next: Run) {
    // A friend's link that arrived mid-class opens now, instead of the class the player asked for.
    if (pending.current) { setSheet(false); S.closeSheet(session.current); takeLink(pending.current); return; }
    silenceScheduled();
    const k = makeClass(next.seed, next.level, next.mode, next.old);
    game.current = createGame(k);
    targets.current = starTargets(next.seed, next.level, next.mode, next.old);
    Object.assign(view.current, makeView(), { slow: live.current.slow });
    Object.assign(marks.current, { kind: -1, wKind: -1, light: -1, catches: 0, close: 0, bench: 1, throwing: false, status: "", edge: "", glow: -1, tenths: -1, bar: -1, run: 0, origin: false });
    const box = sceneBox.current;
    if (box && layers.current) layers.current = buildLayers(layers.current.k * SCENE_W / Math.min(2, window.devicePixelRatio || 1), Math.min(2, window.devicePixelRatio || 1), k, layers.current);
    setRun(next); setResult(null); setSheet(false); S.closeSheet(session.current); setCatches(0); setStatus("ready");
    show("play");
    bell();
    wrapRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The same class again: a friend's seed stays (so the comparison holds), anything else gets a fresh routine. */
  function again(current: Run): Run {
    const f = live.current.friend;
    const rival = f && f.level === current.level && f.seed === current.seed && f.mode === current.mode && f.old === current.old;
    return { ...current, seed: rival ? current.seed : newSeed() };
  }

  /** A friend's link: their class, on the title with their challenge. */
  function takeLink(link: Shared) {
    pending.current = null;
    silenceScheduled();
    setFriend(link);
    setRun({ seed: link.seed, level: link.level, mode: link.mode, old: link.old });
    if (!link.old) setModeState(link.mode);
    game.current = createGame(makeClass(link.seed, link.level, link.mode, link.old));
    if (live.current.screen !== "title") show("title");
  }

  // ---- first load: a friend's link, saved progress, the remembered mode and one-tap choice ----
  useEffect(() => {
    setSite(window.location.host);
    session.current.sound = soundOn();
    const tap = read(KEYS.tap) === "1";
    S.setTapMode(session.current, tap); setTapModeState(tap);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(chosen);
    const savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const link = parseShared(window.location.hash);
    if (link) takeLink(link);
    else {
      const level = openLevel(readLevels(read(KEYS.levels), LEVEL_COUNT), savedAhead);
      setRun({ seed: newSeed(), level, mode: chosen, old: false });
    }
    // A link pasted into this tab changes only the hash. In-page anchors and junk are ignored; a running class isn't taken over.
    const onHash = () => {
      const next = parseShared(window.location.hash);
      if (!next) return;
      if (S.ticking(session.current) && live.current.screen === "play") { pending.current = next; return; }
      takeLink(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); window.clearTimeout(pulse.current); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the class; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __sg: { game: () => game.current, session: () => session.current, targets: () => targets.current } });
  }, []);

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
    const s = session.current, g = game.current, m = marks.current;
    if (!S.ticking(s) || g.phase === "over") return;
    if (s.breath > 0) { s.breath = Math.max(0, s.breath - dt); return; }
    stepGame(g, s.held, dt);
    const k = g.klass, playing = g.phase === "playing" && g.scold === 0;
    const kind = k.kinds[g.seg], w = k.wKinds.length ? k.wKinds[g.wSeg] : -1, light = k.dKinds.length ? k.dKinds[g.dSeg] : -1;
    if (kind !== m.kind) {
      m.kind = kind;
      if (playing) {
        if (kind === TELL || kind === LENS || kind === BACK) { footsteps(); if (g.moving) buzz(12); }
        else if (kind === COUGH || kind === DROP) cough();
        else if (kind === BLIND) squeak();
        else if (kind === WIPE) duster();
      }
    }
    if (w !== m.wKind) { m.wKind = w; if (playing && w === W_TELL) { if (k.watcher === "door") corridor(); else footsteps(); } }
    if (light !== m.light) { m.light = light; if (g.phase === "playing") { if (light === DIM) powerDown(); else if (light === FLICK) powerUp(); } }
    // Chalk on the board while the teacher writes (silent in the dark: nobody writes then, the scratch would lie).
    if (playing && kind === WRITE && light !== DARK && (m.scratch -= dt) <= 0) { m.stroke = (m.stroke + 1) % 5; chalk(m.stroke % 3); m.scratch = 0.28 + (m.stroke % 2) * 0.16; }
    if (g.catches !== m.catches) {
      m.catches = g.catches;
      S.caught(s); setHeld(s.held);
      knock();
      if (!live.current.slow) shake(sceneBox.current);
      setCatches(g.catches);
    }
    if (g.close !== m.close) { m.close = g.close; phew(); }
    if (g.throwing && !m.throwing) toss();
    m.throwing = g.throwing;
    const origin = atThrow(g);
    if (origin && !m.origin) snore();
    m.origin = origin;
    const reached = benchesReached(g);
    if (reached !== m.bench) {
      // Each new bench rings one note higher; sliding back after a catch is silent.
      if (reached > m.bench && reached < benchCount(k)) { rustle(); sfx.combo(reached - 2); }
      m.bench = reached;
    }
    m.run = g.moving ? m.run + dt : 0;
    voice.current?.set(g.moving, m.run);
    const next = statusOf(g, s.held, origin);
    if (next !== m.status) { m.status = next; setStatus(next); }
    edge(next, g);
    sync();
    if (game.current.phase === "over") finish();
  }

  /** The danger at the stage's edge, written straight to the DOM only when it changes. */
  function edge(now: Status, g: Game) {
    const m = marks.current, root = rootRef.current;
    if (!root) return;
    const kind = edgeOf(now), glow = kind === "watch" ? 1 : kind === "warn" ? Math.round(Math.max(0.2, Math.min(1, 1 - g.dangerIn / 1.3)) * 10) / 10 : 0;
    if (kind !== m.edge) { m.edge = kind; root.dataset.edge = kind; }
    if (glow !== m.glow) { m.glow = glow; root.style.setProperty("--edge", String(glow)); }
  }

  function finish() {
    const g = game.current, current = live.current.run, { level, mode: played, old, seed } = current, info = MODE_INFO[played];
    const f = live.current.friend;
    const rival = f && f.level === level && f.seed === seed && f.mode === played && f.old === old ? f : null;
    const L = levelDef(level), k = g.klass;
    const base = { catches: g.catches, close: g.close, braved: g.braved, throws: g.throws, maxStars: old ? 3 : info.maxStars,
      fakes: !old && L.cough + L.peek + L.glasses + (L.dark ? 1 : 0) > 0, sleepers: !old && L.sleepers.length > 0, lives: k.lives };
    if (layers.current && ctx.current) openChit(view.current, ctx.current, k);
    if (g.won) {
      const tenths = scoreOf(g), stars = starsOf(tenths, targets.current, old ? "n" : played);
      let record = "";
      if (!old) {
        const nextList = nextAhead(levels.stars, ahead, level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        levels.record(level, stars);
        const bests = readBests(read(KEYS.bests)), key = bestKey(level, played), previous = bests[key] ?? null;
        if (previous === null || tenths < previous) { bests[key] = tenths; write(KEYS.bests, JSON.stringify(bests)); }
        record = previous === null ? `এই ফোনে লেভেল ${bn(level)}-এর প্রথম সময়।` : tenths < previous ? `নতুন রেকর্ড। আগের সেরা ছিল ${seconds(previous)} সেকেন্ড।` : `এই ফোনে সেরা: ${seconds(previous)} সেকেন্ড`;
        const near = nearMiss({ tenths, stars, targets: targets.current, mode: played, best: previous });
        setResult({ ...base, won: true, kicker: clearKicker(level), title: "", tenths, stars, line: rival ? compareLine(tenths, rival) : clearLine(level), near, record });
        if (stars === 3 || L.finale || (previous !== null && tenths < previous)) confetti({ colors: ["#ffd166", "#2b4fa0", "#ffffff", "#e5383b"] });
      } else {
        setResult({ ...base, won: true, kicker: clearKicker(level, true), title: "", tenths, stars, line: rival ? compareLine(tenths, rival) : clearLine(level, true), near: "", record: "বন্ধুর পুরোনো ক্লাস, তাই তারা জমা হয় না।" });
      }
      setLast({ shared: { seed, tenths, catches: g.catches, level, mode: played, old }, stars });
      show("over");
      cleared(world);
      for (let star = 0; star < stars; star++) starChime(star, 1.1 + star * 0.28);
    } else {
      setResult({ ...base, won: false, kicker: `লেভেল ${bn(level)} · ${L.name}`, title: "এবার হলো না", tenths: scoreOf(g), stars: 0,
        line: lossLine(level, k.teacher, lostBy(g)), near: rival ? `${rival.name || "বন্ধু"} এই ক্লাস ${seconds(rival.tenths)} সেকেন্ডে পার করেছিল।` : "", record: "" });
      setLast(null);
      show("over");
      lost();
      if (!live.current.slow) shake(sceneBox.current);
    }
    setHeld(false);
  }

  // ---- drawing ----
  function draw() {
    const c = ctx.current, L = layers.current, g = game.current, m = marks.current;
    if (!c || !L) return;
    const now = performance.now(), dt = m.lastDraw ? Math.min(0.1, (now - m.lastDraw) / 1000) : 0;
    m.lastDraw = now;
    drawFrame(c, L, g, view.current, S.ticking(session.current) ? dt : 0);
    const tenths = Math.min(CLOCK.length - 1, Math.round(g.time * 10));
    if (tenths !== m.tenths && clockRef.current) { m.tenths = tenths; clockRef.current.textContent = CLOCK[tenths]; }
    const share = Math.round(((g.pos - g.klass.from) / (benchCount(g.klass) - 1)) * 100);
    if (share !== m.bar && barRef.current) { m.bar = share; barRef.current.style.width = `${share}%`; }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused);

  // ---- size the classroom to its box (contain), and paint the still layers for that size and class ----
  const sceneShown = screen === "play" || screen === "over";
  useEffect(() => {
    if (!sceneShown) return;
    const box = sceneBox.current, canvas = canvasRef.current;
    if (!box || !canvas) return;
    const size = () => {
      const width = Math.floor(Math.min(box.clientWidth, (box.clientHeight * SCENE_W) / SCENE_H));
      if (width < 60) return;
      canvas.style.width = `${width}px`; canvas.style.height = `${Math.round((width * SCENE_H) / SCENE_W)}px`;
      ctx.current = fitCanvas(canvas, width, (width * SCENE_H) / SCENE_W);
      layers.current = buildLayers(width, Math.min(2, window.devicePixelRatio || 1), game.current.klass, layers.current);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    // The board's chalk is painted with the display font; repaint once it has loaded.
    void document.fonts?.ready.then(() => { layers.current = null; size(); });
    return () => observer.disconnect();
  }, [sceneShown, run.seed, run.level, run.mode, run.old]);

  // ---- the finger on the chit ----
  function press() {
    const s = session.current;
    if (!S.press(s)) return;
    sfx.tap();
    setHeld(s.held);
    sync();
  }
  function release() { const s = session.current; S.release(s); setHeld(s.held); }
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
  function toggleTap() { const on = !session.current.tapMode; S.setTapMode(session.current, on); setTapModeState(on); write(KEYS.tap, on ? "1" : "0"); sfx.tap(); }
  function start() {
    sfx.tap();
    const f = live.current.friend, fromFriend = f && f.level === run.level && f.seed === run.seed && f.old === run.old;
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode, old: false });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode, old: false }); }
  function openSheet() { S.openSheet(session.current); setSheet(true); sync(); if (pending.current) takeLink(pending.current); }
  function closeSheet() { S.closeSheet(session.current); setSheet(false); wakeUp(); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    const f = live.current.friend, rival = f && !f.old && f.level === level && f.mode === mode ? f : null;
    S.closeSheet(session.current);
    begin({ seed: rival ? rival.seed : newSeed(), level, mode, old: false });
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
    const isPass = (key: string) => key === " " || key === "Enter" || key === "ArrowDown";
    const typing = (event: KeyboardEvent) => Boolean((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]"));
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || typing(event)) return;
      const s = session.current, key = event.key, lower = key.toLowerCase();
      if (s.paused || s.sheet) return;
      if (lower === "p" && s.screen === "play") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ") && !event.repeat) { event.preventDefault(); start(); return; }
      if (s.screen === "play" && isPass(key)) { event.preventDefault(); if (!event.repeat) press(); return; }
      if (s.screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => {
      if (typing(event) || session.current.screen !== "play" || !isPass(event.key)) return;
      event.preventDefault();
      release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  const total = totalStars(levels.stars);
  const finale = !run.old && def.finale;
  const who = TITLE[klass.teacher];
  const [big, small] = coach(status, held, tapMode, who, REPLIES[klass.reply]);
  const pips = finale ? Math.max(0, klass.lives - catches) : 0;

  return (
    <div className="sg-wrap" ref={wrapRef}>
      <div className="sg" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={world} data-edge="">
        {screen === "title" && (
          <TitleScreen level={run.level} old={run.old} mode={run.old ? run.mode : mode} friend={friend} stars={total} tapMode={tapMode} teacher={klass.teacher}
            onStart={start} onMode={setMode} onLevels={openSheet} onTap={toggleTap} />
        )}
        {screen === "intro" && <Story onDone={storyDone} />}
        {sceneShown && (
          <>
            <div className="sg-hud">
              <p className="sg-badge"><b>{run.old ? `ক্লাস ${bn(run.level)}` : `লেভেল ${bn(run.level)}`}</b>{!run.old && run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}<small>{run.old ? "বন্ধুর পুরোনো ক্লাস" : def.name}</small></p>
              <p className="sg-boss" data-on={finale ? "1" : undefined} aria-label={finale ? `${def.finale!.boss}: আর ${bn(pips)} বার সুযোগ` : undefined}>
                {finale && <><b>{def.finale!.boss}</b><span className="sg-pips" aria-hidden="true">{[0, 1, 2].map(i => <i key={i} data-on={i < pips} />)}</span></>}
              </p>
              <div className="sg-clock-box">
                <p className="sg-clock" aria-hidden="true"><span ref={clockRef}>০.০</span> সে.</p>
                <span className="sg-progress" aria-hidden="true"><span ref={barRef} /></span>
              </div>
            </div>
            <div className="sg-board">
              <div className="sg-scene" ref={sceneBox} {...(screen === "play" ? holdHandlers : {})}>
                <canvas ref={canvasRef} role="img" aria-label={`ক্লাসঘর: ${who} বোর্ডে লিখছেন, সারি সারি বেঞ্চে ছাত্রছাত্রী, মাঝের সারিতে একটা চিরকুট`} />
              </div>
              {screen === "play" ? (
                <button type="button" className="sg-pass" data-held={held || undefined} data-status={status} aria-pressed={tapMode ? held : undefined} {...holdHandlers}
                  onClick={event => { if (event.detail === 0) { press(); if (!session.current.tapMode) { window.clearTimeout(pulse.current); pulse.current = window.setTimeout(release, 0); } } }}>
                  <svg viewBox="0 0 48 36" aria-hidden="true"><path d="M4 6h40v24H4z" /><path d="m4 6 20 14L44 6" /></svg>
                  <span><b>{big}</b><small aria-live="polite">{small}</small></span>
                </button>
              ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={last ? toCard : null} />}
            </div>
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {last && screen === "over" && <ResultCard key={`${last.shared.level}-${last.shared.seed}-${last.shared.tenths}`} shared={last.shared} stars={last.stars} site={site} />}
    </div>
  );
}

export { CLASSIC, WORLDS, PEEK };
