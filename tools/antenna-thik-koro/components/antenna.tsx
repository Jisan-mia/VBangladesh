"use client";
// IP: what we avoided — no BTV or any real channel's logo, ident, test card, programme or presenter; no TV brand on the set; channels are just চ্যানেল ১–৫ showing our own cartoon drawings.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps them, session.ts decides input and sound loops);
// this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, loop, newSeed, readLevels, sfx, silenceScheduled, soundOn, tone, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import {
  angDiff, bn, CELEBRATE, channelName, compareLine, createGame, humanLine, isFinaleChannel, isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO,
  migrateBest, nextAhead, openLevel, parseShared, readAhead, readTimes, seconds, SHOWS, shout, signal, SLUG, starsOf, tenthsOf, timeKey, toNextStar,
  type Game, type Hint, type Mode, type Shared,
} from "../lib/antenna";
import { buildLayers, type Layers } from "../lib/art";
import { drawFrame, SCENE_H, SCENE_W, type FrameState } from "../lib/draw.hot";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const TAP_STEP = 2;
const TICKS = Array.from({ length: 24 }, (_, index) => index * 15);
/** The antenna from above on the dial: [y, half-length], short directors at the front (top). */
const ELEMENTS = [[38, 30], [24, 27], [10, 23], [-6, 20], [-22, 17], [-38, 14]] as const;
/** The lock chime climbs one note per channel. */
const LOCK_NOTES = [784, 880, 988, 1175, 1319];
/** The five-note ident at a level clear, pitched per world. */
const IDENT = [523, 659, 784, 659, 1047];
const WORLD_PITCH = [1, 9 / 8, 4 / 3];

const KEYS = { levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, times: `ektukhani-times-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const labelsFor = (game: Game) => game.rounds.flatMap((round, index) => [channelName(index), `${channelName(index)} · ${SHOWS[round.picture]}`]);

type Screen = S.Screen;
type Run = { seed: number; level: number; mode: Mode; old: boolean };
type Result = EndStats & { shared: Omit<Shared, "name"> };

export function AntennaGame() {
  const sceneBox = useRef<HTMLDivElement>(null), scene = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const dial = useRef<SVGGElement>(null), dialBox = useRef<HTMLDivElement>(null), slider = useRef<HTMLInputElement>(null);
  const clock = useRef<HTMLSpanElement>(null), meter = useRef<HTMLSpanElement>(null), resultRef = useRef<HTMLDivElement>(null);
  const layers = useRef<Layers | null>(null);
  const game = useRef<Game>(createGame(1));
  const labels = useRef<string[]>(labelsFor(game.current));
  const session = useRef<S.Session>(S.createSession(true));
  const hiss = useRef<ReturnType<typeof loop> | null>(null), wind = useRef<ReturnType<typeof loop> | null>(null);
  const frame = useRef<FrameState>({ angle: 0, quality: 0, picture: "cricket", time: 0, frozen: false, label: "", roll: 0, flash: 0, weather: 0 });
  const seen = useRef({ quality: 0, noise: -1, notch: 0, hint: "start" as Hint, index: 0, tenths: -1, angle: -1, edge: "", meter: -1, warn: 0 });
  const drag = useRef({ cx: 0, cy: 0, last: 0 });

  const [screen, setScreen] = useState<Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n", old: false });
  const [hint, setHint] = useState<Hint>("start");
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [site, setSite] = useState("");
  const [mode, setModeState] = useState<Mode>("n");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen });
  live.current = { slow, screen };
  const def = levelDef(run.level, run.old);

  // ---- sound loops: session.ts decides, this does ----
  const loops: S.Loops = {
    start: kind => {
      if (kind === "hiss") { hiss.current?.stop(); hiss.current = loop("static"); seen.current.noise = -1; }
      else { wind.current?.stop(); wind.current = loop("wind"); wind.current.set(0.3); }
    },
    stop: kind => { const handle = kind === "hiss" ? hiss : wind; handle.current?.stop(); handle.current = null; },
  };
  const sync = () => S.syncLoops(session.current, game.current, loops);

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current); sync(); },
    onRestart: () => { S.resume(session.current); if (live.current.screen === "play" || live.current.screen === "over") begin(run); else sync(); },
  });

  function show(next: Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  /** A fresh evening on the play screen, waiting for the first turn. */
  function begin(next: Run) {
    silenceScheduled();
    const fresh = createGame(next.seed, next.level, next.mode, next.old);
    game.current = fresh;
    labels.current = labelsFor(fresh);
    Object.assign(seen.current, { quality: signal(fresh.rounds[0], 0), hint: "start", index: 0, tenths: -1, angle: -1, meter: -1, warn: 0 });
    // Rain all through the storm night; wind lines on a windy evening.
    const ahead = levelDef(next.level, next.old);
    Object.assign(frame.current, { roll: 0, flash: 0, weather: ahead.world === 2 ? 2 : ahead.wind || ahead.gusts ? 1 : 0 });
    setRun(next); setHint("start"); setIndex(0); setResult(null); setSheet(false);
    show("play");
    const stage = resultRef.current?.closest(".gp-stage");
    stage?.scrollTo({ top: 0 });
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    const link = parseShared(window.location.hash);
    setFriend(link);
    setSite(window.location.host);
    session.current.sound = soundOn();
    let saved = readLevels(read(KEYS.levels), LEVEL_COUNT);
    const migrated = migrateBest(saved, read(KEYS.best));
    if (migrated) { levels.record(1, migrated); saved = { 1: migrated }; }
    const savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(link ? link.mode : chosen);
    const first = link ? { seed: link.seed, level: link.level, mode: link.mode, old: link.old } : { seed: newSeed(), level: openLevel(saved, savedAhead), mode: chosen, old: false };
    setRun(first);
    game.current = createGame(first.seed, first.level, first.mode, first.old);
    labels.current = labelsFor(game.current);
    return () => { loops.stop("hiss"); loops.stop("wind"); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __antenna: { game: () => game.current, session: () => session.current } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  // Off also cuts the ident and star chimes already queued (the kit stops only loops).
  useEffect(() => { S.setSound(session.current, sound); if (!sound) silenceScheduled(); sync(); }, [sound]);

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

  // ---- one step: input, rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = game.current, view = seen.current, look = frame.current, slowNow = live.current.slow;
    if (!S.ticking(s)) return;
    S.holdStep(s, dt, slowNow);
    const before = g.phase, warned = g.gustWarn > 0;
    stepGame(g, S.takeTurn(s), dt, slowNow ? 2 : CELEBRATE);
    const locked = g.phase === "got" || g.phase === "over";
    const target = locked ? 1 : signal(g.rounds[g.index], g.angle);
    view.quality += (target - view.quality) * Math.min(1, dt * 7);
    look.time += dt;
    look.roll = Math.max(0, look.roll - dt / 0.45);
    look.flash = Math.max(0, look.flash - dt / 0.3);
    sync();
    const noise = locked ? 0 : Math.max(0.05, 1 - view.quality);
    if (Math.abs(noise - view.noise) > 0.01) { view.noise = noise; hiss.current?.set(noise); }
    if (g.gustWarn > 0 && !warned) sfx.whoosh();
    if (wind.current && g.gustLeft > 0 !== view.warn > 0) { view.warn = g.gustLeft; wind.current.set(g.gustLeft > 0 ? 0.75 : 0.3); }
    const notch = Math.floor(g.dial / 15);
    if (notch !== view.notch) { view.notch = notch; if (g.phase === "search") sfx.tick(); }
    if (g.hint !== view.hint) {
      if (g.hint === "slip-left" || g.hint === "slip-right") sfx.drop();
      view.hint = g.hint; setHint(g.hint);
    }
    if (g.index !== view.index) { view.index = g.index; setIndex(g.index); }
    if (before === g.phase) return;
    if (g.phase === "got") {
      const note = LOCK_NOTES[Math.min(g.index, LOCK_NOTES.length - 1)];
      tone(note, 0.12, 0.08, "sine"); tone(note * 1.5, 0.42, 0.08, "sine", 0.08); buzz(15);
      if (!slowNow) { look.roll = 1; look.flash = 1; }
    }
    if (g.phase === "over") finish();
  }

  function finish() {
    const g = game.current, { level, mode: played, old, seed } = run, info = MODE_INFO[played];
    const tenths = tenthsOf(g.time), earned = starsOf(tenths, level, played, old);
    const times = readTimes(read(KEYS.times)), key = timeKey(level, played), previous = old ? null : times[key] ?? null;
    let best = "";
    if (!old) {
      const nextList = nextAhead(levels.stars, ahead, level);
      write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
      levels.record(level, earned);
      if (previous === null || tenths < previous) { times[key] = tenths; write(KEYS.times, JSON.stringify(times)); }
      best = previous === null ? `এই ফোনে লেভেল ${bn(level)}-এর প্রথম রেকর্ড।` : tenths < previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${seconds(previous)} সেকেন্ড।` : `এই ফোনে সেরা: ${seconds(previous)} সেকেন্ড`;
    }
    const gap = toNextStar(tenths, level, played, old);
    const near = gap > 0 ? `আর ${seconds(gap)} সেকেন্ড কম হলে ${bn(earned + 1)} তারা।`
      : earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।"
      : previous !== null && tenths >= previous ? `আর ${seconds(tenths - previous + 1)} সেকেন্ড কম হলেই নতুন রেকর্ড।` : "";
    const rival = friend && friend.level === level && friend.seed === seed && friend.mode === played && friend.old === old ? friend : null;
    setResult({
      level, name: old ? `বন্ধুর লেভেল` : levelDef(level).name, tenths, stars: earned, maxStars: info.maxStars,
      splits: Array.from(g.splits), slips: g.slips, gusts: g.gusts,
      line: rival ? compareLine(tenths, rival) : humanLine(tenths), near, best,
      shared: { seed, tenths, level, mode: played, old },
    });
    show("over");
    // The ident and the stars are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    const pitch = WORLD_PITCH[levelDef(level, old).world];
    IDENT.forEach((note, at) => tone(note * pitch, 0.16, 0.09, "triangle", 0.12 + at * 0.11));
    for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.9 + star * 0.28);
    if (earned === 3 || (previous !== null && tenths < previous)) confetti();
  }

  function draw() {
    const target = canvas.current, built = layers.current;
    if (!target || !built) return;
    const g = game.current, look = frame.current, view = seen.current, locked = g.phase === "got" || g.phase === "over";
    look.angle = g.angle; look.quality = view.quality; look.picture = g.rounds[g.index].picture; look.frozen = live.current.slow;
    look.label = labels.current[g.index * 2 + (locked ? 1 : 0)];
    drawFrame(target.getContext("2d")!, built, look);
    const tenths = Math.round(g.time * 10);
    if (tenths !== view.tenths && clock.current) { view.tenths = tenths; clock.current.textContent = seconds(tenths); }
    const angle = Math.round(g.dial) % 360;
    if (angle !== view.angle) {
      view.angle = angle;
      dial.current?.setAttribute("transform", `rotate(${angle})`);
      if (slider.current) slider.current.value = String(angle);
    }
    // A gust lights the edge it blows from: a shove to the right comes from the left.
    const edge = g.phase !== "search" ? "" : g.gustWarn > 0 || g.gustLeft > 0 ? (g.gustSide > 0 ? "left" : "right") : g.edge ? "slip" : "";
    if (edge !== view.edge) { view.edge = edge; scene.current?.setAttribute("data-edge", edge); }
    const fill = isFinaleChannel(g.def, g.index) ? Math.round(Math.min(1, g.dwell / g.need) * 100) : -1;
    if (fill !== view.meter && meter.current) { view.meter = fill; meter.current.style.setProperty("--fill", `${Math.max(0, fill)}%`); }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused);

  // ---- size the scene to its box, pre-render the world's layers ----
  const world = def.world;
  useEffect(() => {
    const box = sceneBox.current, target = canvas.current, holder = scene.current;
    if (!box || !target || !holder) return;
    const size = () => {
      const width = Math.floor(Math.min(box.clientWidth, box.clientHeight * SCENE_W / SCENE_H));
      if (width < 60) return;
      const height = Math.round(width * SCENE_H / SCENE_W);
      holder.style.width = `${width}px`; holder.style.height = `${height}px`;
      fitCanvas(target, width, height);
      layers.current = buildLayers(width, Math.min(2, window.devicePixelRatio || 1), world);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    void document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, [screen === "title" || screen === "intro", world]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || sheet) return;
      if (screen === "play" && (key === "ArrowLeft" || key === "ArrowRight" || key === "a" || key === "d")) {
        event.preventDefault();
        if (!event.repeat && S.press(s, key === "ArrowLeft" || key === "a" ? -1 : 1, TAP_STEP)) sfx.tick();
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" || key === "r" ? 1 : key === "3" ? 2 : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key;
      if (key === "ArrowLeft" || key === "a") S.release(session.current, -1);
      if (key === "ArrowRight" || key === "d") S.release(session.current, 1);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- the wheel over the dial: 3° a notch (a native listener, so it can stop the page scrolling) ----
  useEffect(() => {
    const element = dialBox.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => { if (!S.canTurn(session.current)) return; event.preventDefault(); S.nudge(session.current, Math.sign(event.deltaY) * 3); };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [screen]);

  // ---- turning the dial: follow the finger's angle around the centre, wherever it grabbed ----
  const fingerAngle = (event: ReactPointerEvent, cx: number, cy: number) => Math.atan2(event.clientX - cx, cy - event.clientY) * 180 / Math.PI;
  function dialDown(event: ReactPointerEvent<HTMLDivElement>) {
    const s = session.current;
    if (!S.canTurn(s)) return;
    const box = event.currentTarget.getBoundingClientRect(), cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already gone */ }
    s.drag = event.pointerId;
    Object.assign(drag.current, { cx, cy, last: fingerAngle(event, cx, cy) });
  }
  function dialMove(event: ReactPointerEvent<HTMLDivElement>) {
    const s = session.current, hand = drag.current;
    if (s.drag !== event.pointerId || !S.canTurn(s)) return;
    if (Math.hypot(event.clientX - hand.cx, event.clientY - hand.cy) < 14) return;
    const angle = fingerAngle(event, hand.cx, hand.cy);
    s.pending += angDiff(angle, hand.last);
    hand.last = angle;
  }
  const dialUp = () => { session.current.drag = null; };
  const turnButton = (direction: -1 | 1) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already gone */ } if (S.press(session.current, direction, TAP_STEP)) sfx.tick(); },
    onPointerUp: () => S.release(session.current, direction), onPointerCancel: () => S.release(session.current, direction), onLostPointerCapture: () => S.release(session.current, direction),
    onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
  });

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => current.old ? current : { ...current, mode: next }); sfx.tap(); }
  function start() {
    sfx.tap();
    const fromFriend = friend && friend.level === run.level && friend.seed === run.seed;
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode, old: false });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode, old: false }); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    const rival = friend && !friend.old && friend.level === level && friend.mode === mode ? friend : null;
    begin({ seed: rival ? rival.seed : newSeed(), level, mode, old: false });
  }
  const rivalFits = friend && friend.level === run.level && friend.seed === run.seed && friend.mode === run.mode && friend.old === run.old;
  const again = () => begin({ ...run, seed: rivalFits ? run.seed : newSeed() });
  const openAfter = openLevel(levels.stars, ahead);
  const nextLevel = run.old ? openAfter : run.level < LEVEL_COUNT && run.level + 1 <= openAfter ? run.level + 1 : openAfter !== run.level ? openAfter : 0;
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: nextLevel === run.level + 1 && !run.old ? "পরের লেভেল" : `লেভেল ${bn(nextLevel)} খেলো`, run: () => begin({ seed: newSeed(), level: nextLevel, mode, old: false }) }] : []),
    { label: "আবার খেলো", run: again },
    { label: "সব লেভেল", run: () => setSheet(true) },
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const finaleNow = isFinaleChannel(def, index) && screen === "play";
  const total = totalStars(levels.stars);
  const done = index + (hint === "got" || hint === "done" ? 1 : 0);
  const words = shout(hint, index, def);

  return (
    <div className="at-wrap" ref={resultRef}>
      <div className="at" data-slow={slow || undefined} data-screen={screen} data-world={world}>
        {screen === "title" && <TitleScreen level={run.level} mode={run.old ? run.mode : mode} friend={friend} stars={total} onStart={start} onMode={setMode} onLevels={() => setSheet(true)} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {(screen === "play" || screen === "over") && (
          <>
            <div className="at-hud">
              <div className="at-hud-left">
                <p className="at-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
                <ol className="at-dots" aria-label={`${bn(def.channels)}টার মধ্যে ${bn(done)}টা চ্যানেল এসেছে`}>
                  {Array.from({ length: def.channels }, (_, at) => <li key={at} data-done={at < done} data-now={at === index && screen === "play"} data-finale={isFinaleChannel(def, at) || undefined} />)}
                </ol>
              </div>
              <p className="at-boss" data-on={finaleNow || undefined} aria-hidden={!finaleNow}>
                <b>{def.finale ? SHOWS[def.finale.picture] : ""}</b><span ref={meter} className="at-meter"><i /></span>
              </p>
              <p className="at-clock" aria-hidden="true"><span ref={clock}>০.০</span> সে.</p>
            </div>
            <div className="at-scene-box" ref={sceneBox}>
              <div className="at-scene" ref={scene} data-edge="">
                <canvas ref={canvas} className="at-canvas" role="img" aria-label="ছাদে অ্যান্টেনা, নিচের ঘরে ঝিরঝির টিভি" />
                <p className="at-shout" aria-live="polite">{words && <span key={`${hint}-${index}`} data-hint={hint}>{words}</span>}</p>
                <span className="at-gust" data-side="left" aria-hidden="true">হাওয়া</span>
                <span className="at-gust" data-side="right" aria-hidden="true">হাওয়া</span>
              </div>
            </div>
            {screen === "play" ? (
              <div className="at-controls">
                <button type="button" className="at-turn" aria-label="বাঁয়ে ঘোরাও" {...turnButton(-1)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>বাঁয়ে
                </button>
                <div className="at-dial" ref={dialBox} onPointerDown={dialDown} onPointerMove={dialMove} onPointerUp={dialUp} onPointerCancel={dialUp} onLostPointerCapture={dialUp}>
                  <svg viewBox="-80 -80 160 160" aria-hidden="true">
                    <circle className="at-dial-ring" r="77" />
                    {TICKS.map(angle => <line key={angle} className="at-dial-tick" x1="0" y1="-73" x2="0" y2={angle % 90 ? -68 : -63} transform={`rotate(${angle})`} />)}
                    <g ref={dial}>
                      <circle className="at-dial-plate" r="58" />
                      <line className="at-dial-boom" x1="0" y1="46" x2="0" y2="-48" />
                      {ELEMENTS.map(([y, half]) => <line key={y} className="at-dial-element" x1={-half} y1={y} x2={half} y2={y} />)}
                      <path className="at-dial-tip" d="M0 -70 6 -59H-6Z" />
                      <circle className="at-dial-hub" r="9" />
                    </g>
                  </svg>
                  {hint === "start" && <span className="at-dial-hint" aria-hidden="true">ঘোরাও</span>}
                </div>
                <button type="button" className="at-turn" aria-label="ডানে ঘোরাও" {...turnButton(1)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>ডানে
                </button>
                <label className="at-slider">
                  <span className="at-sr">অ্যান্টেনার দিক, ০ থেকে ৩৫৯ ডিগ্রি</span>
                  <input ref={slider} type="range" min={0} max={359} step={1} defaultValue={0}
                    onChange={event => S.nudge(session.current, angDiff(Number(event.currentTarget.value), game.current.dial + session.current.pending))} />
                </label>
              </div>
            ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={toCard} />}
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={() => setSheet(false)} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.shared} site={site} />}
    </div>
  );
}
