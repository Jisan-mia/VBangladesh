"use client";
// IP: what we avoided — no colour-shifting gradient blocks, slicing or look of the famous stacking app; real rice and jute sacks on a painted truck instead, a plumb-line lean rule instead of trimming, and every figure drawn fresh from plain shapes.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps them, session.ts decides input and the wind loop);
// this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, hiss, loop, newSeed, readLevels, sfx, silenceScheduled, soundOn, tone, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { drawFrame, updateScene } from "../lib/draw.hot";
import { defOf, isLevel, isMode, LEVEL_COUNT, LEVELS, migrateBest, MODE_INFO, nextAhead, openLevel, readAhead, starsOf, toNextStar, WORLDS, type Mode, type Run } from "../lib/levels";
import { bn, parseCard, playLabel, SLUG, versusLine, type Card } from "../lib/link";
import {
  createRun, E_CLEAR, E_DANGER, E_DARK, E_GUST, E_GUST_WARN, E_LAND, E_LATE, E_OVER, E_PERFECT, E_SLIP, E_TOPPLE, filled, scoreOf, strainOf, DANGER,
  type Game,
} from "../lib/rules";
import { makeScene, onGust, onLand, onMiss, paint, resizeScene, restartScene, setWorld } from "../lib/scene";
import * as S from "../lib/session";
import { stepGame, tap } from "../lib/step.hot";
import { dropNews, endLine, humanLine, levelLine } from "../lib/words";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, khola: `ektukhani-best-${SLUG}-khola`,
  mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}`,
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const readBest = () => { const raw = read(KEYS.khola), value = Number(raw); return raw !== null && Number.isInteger(value) && value >= 0 ? value : null; };

/* Sounds (all through the kit; every one has a picture on screen too). */
/** The rope lets go: a short swish, so the tap answers at once. You see the hook spring up. */
const release = () => hiss(0.08, 0.06, 1800, "bandpass");
/** The sack lands: a low thump with a little burlap. You see the squash and the dust. */
const thump = (heavy: boolean) => { tone(heavy ? 110 : 140, 0.18, 0.22, "sine", 0, 60); hiss(0.07, heavy ? 0.1 : 0.07, 500); };
/** The sack slides off and splashes. You see it tumble into the river. */
const splash = () => { tone(220, 0.35, 0.16, "sine", 0, 90); hiss(0.32, 0.16, 900, "lowpass", 0.3); };
/** The pile groans when it strains past the danger line. You see the edge glow and the wobble. */
const creak = () => { tone(96, 0.32, 0.07, "sawtooth", 0, 72); tone(150, 0.16, 0.04, "square", 0.12, 120); };
/** The pile topples: a rumble of thuds. */
const crash = () => { for (let at = 0; at < 5; at++) tone(150 - at * 18, 0.2, 0.18, "sine", at * 0.11, 50); hiss(0.6, 0.18, 400, "lowpass", 0.05); buzz([40, 30, 60]); };
/** The signature: the launch horn, two low notes, pitched per world. */
const horn = (pitch: number, late = false) => { tone(196 * pitch, 0.5, 0.12, "sawtooth"); tone((late ? 147 : 247) * pitch, 0.8, 0.12, "sawtooth", 0.45); };
/** Each world opens with a four-note motif. */
const MOTIF = [392, 523, 494, 659];
/** Lights out: the fuse's tick. */
const fuse = () => tone(1400, 0.03, 0.05, "square");

type Result = EndStats & { card: Omit<Card, "name"> };

export function CraneGame() {
  const box = useRef<HTMLDivElement>(null), stageBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const meter = useRef<HTMLSpanElement>(null), line = useRef<HTMLSpanElement>(null), wrap = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef<Game>(createRun({ seed: 1, kind: "level", level: 1, mode: "n" }));
  const scene = useRef(makeScene());
  const session = useRef<S.Session>(S.createSession(true));
  const wind = useRef<ReturnType<typeof loop> | null>(null), loud = useRef(false);
  const seen = useRef({ edge: "", meter: -1, line: -1, strain: -1 });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, kind: "level", level: 1, mode: "n" });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Card | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [hud, setHud] = useState({ score: 0, combo: 0, lost: 0 });
  const [news, setNews] = useState("");
  const [zooming, setZooming] = useState(false);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, run });
  live.current = { slow, screen, run };
  const def = defOf(run);

  // ---- the wind loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { wind.current?.stop(); wind.current = loop("wind"); wind.current.set(0.25); },
    stop: () => { wind.current?.stop(); wind.current = null; },
  };
  const sync = () => S.syncLoops(session.current, game.current, loops);

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current, performance.now()); sync(); },
    onRestart: () => { S.resume(session.current, performance.now()); if (live.current.screen === "play" || live.current.screen === "over") again(); else sync(); },
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  /** A fresh round on the play screen, the first sack swinging. */
  function begin(next: Run) {
    silenceScheduled();
    game.current = createRun(next);
    const look = defOf(next), sc = scene.current, world = sc.world, features = `${sc.night}${sc.pontoon}${sc.gusty}${sc.rain}`;
    setWorld(sc, look);
    if (world !== sc.world || features !== `${sc.night}${sc.pontoon}${sc.gusty}${sc.rain}`) { if (sc.w) resizeScene(sc, sc.w, sc.h, sc.ratio); }
    restartScene(sc);
    Object.assign(seen.current, { edge: "", meter: -1, line: -1, strain: -1 });
    stageBox.current?.setAttribute("data-edge", "");
    setRun(next); setResult(null); setSheet(false); setHud({ score: 0, combo: 0, lost: 0 }); setNews(""); setZooming(false);
    show("play");
    if (next.kind === "level") { const pitch = WORLDS[look.world].horn; MOTIF.forEach((note, at) => tone(note * pitch, 0.14, 0.06, "triangle", 0.1 + at * 0.13)); }
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
    setBest(readBest());
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(link && link.kind !== "old" ? link.mode : chosen);
    const first: Run = link ? { seed: link.seed, kind: link.kind, level: link.level, mode: link.mode } : { seed: newSeed(), kind: "level", level: openLevel(saved, savedAhead), mode: chosen };
    setRun(first);
    game.current = createRun(first);
    setWorld(scene.current, defOf(first));
    return () => { loops.stop("wind"); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __bostar: { game: () => game.current, session: () => session.current, scene: () => scene.current } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) silenceScheduled(); sync(); }, [sound]);

  // ---- away and back: release the key, let the player pause ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); sync(); };
    const onVisibility = () => { if (document.hidden) S.hide(session.current); else S.show(session.current); sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- one step: rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = game.current, slowNow = live.current.slow, sc = scene.current;
    if (s.screen === "over") { updateScene(sc, g, dt, slowNow); if (sc.settled) setZooming(false); return; }
    if (!S.ticking(s)) return;
    stepGame(g, dt, slowNow);
    updateScene(sc, g, dt, slowNow);
    const events = g.events;
    g.events = 0;
    sync();
    if (loud.current && sc.gustT > 0.8) { loud.current = false; wind.current?.set(0.25); }
    if (!events) return;
    const pitch = WORLDS[g.def.world].horn, goal = g.def.goal;
    if (events & E_LAND) {
      onLand(sc, g);
      thump(g.def.heavy && g.kinds[g.n - 1] === 2);
      // ঠিক মাঝে climbs a note with every one in a row.
      if (events & E_PERFECT) sfx.combo(g.combo - 1);
      if (!slowNow) buzz(events & E_PERFECT ? 18 : 8);
      setHud({ score: scoreOf(g), combo: g.combo, lost: g.lost });
      setNews(dropNews(g.verdict ?? "good", scoreOf(g), goal));
    }
    if (events & E_SLIP) {
      onMiss(sc, g);
      splash();
      if (!slowNow) stageBox.current?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
      setHud({ score: scoreOf(g), combo: 0, lost: g.lost });
      setNews(dropNews("slip", scoreOf(g), goal));
    }
    if (events & E_TOPPLE) {
      crash();
      if (!slowNow) stageBox.current?.animate?.([{ transform: "translate(0,0)" }, { transform: "translate(-7px,3px)" }, { transform: "translate(6px,-2px)" }, { transform: "translate(0,0)" }], { duration: 320, easing: "ease-out" });
      setNews("পাহাড় হেলে ভেঙে পড়ল।");
    }
    if (events & E_DANGER) creak();
    if (events & E_GUST_WARN) sfx.tick();
    if (events & E_GUST) { onGust(sc, g.gustHit); sfx.whoosh(); wind.current?.set(0.7); loud.current = true; }
    if (events & E_DARK) fuse();
    if (events & E_CLEAR) horn(pitch);
    if (events & E_LATE) horn(pitch, true);
    if (events & E_OVER) finish();
  }

  function finish() {
    const g = game.current, current = live.current.run, info = MODE_INFO[current.mode], sacks = scoreOf(g);
    const levelRun = current.kind === "level", full = filled(g);
    const earned = levelRun ? starsOf(current.level, full, g.perfect, current.mode) : 0;
    let bestLine = "", near = "", record = false;
    if (levelRun) {
      if (earned > 0) {
        const nextList = nextAhead(levels.stars, ahead, current.level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        levels.record(current.level, earned);
      }
      const gap = full ? toNextStar(current.level, g.perfect, current.mode) : 0;
      near = !full ? `আর ${bn(g.def.goal - sacks)}টা হলেই ট্রাক ভরত।`
        : gap > 0 ? `আর ${bn(gap)}টা ঠিক মাঝে হলে ${bn(earned + 1)} তারা।`
        : earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : "";
    } else if (current.kind === "endless") {
      const previous = readBest();
      record = previous === null || sacks > previous;
      if (record) { write(KEYS.khola, String(sacks)); setBest(sacks); }
      bestLine = previous === null ? "এই ফোনে খোলা ঘাটের প্রথম রেকর্ড।" : record ? `নতুন রেকর্ড। আগের সেরা ছিল ${bn(previous)}টা।` : `এই ফোনের সেরা: ${bn(previous)}টা।`;
      if (!record && previous !== null) near = `আর ${bn(previous - sacks + 1)}টা হলেই নতুন সেরা।`;
    }
    const rival = friend && friend.seed === current.seed && friend.kind === current.kind && friend.level === current.level && friend.mode === current.mode ? friend : null;
    const card = { seed: current.seed, sacks: Math.min(999, sacks), perfect: Math.min(sacks, g.perfect), streak: Math.min(sacks, g.bestCombo), level: current.level, kind: current.kind, mode: current.mode };
    setResult({
      kicker: levelRun ? (full ? `লেভেল ${bn(current.level)} পার · ${g.def.name}` : `লেভেল ${bn(current.level)} · ${g.def.name}`) : playLabel(current),
      why: endLine(g.end, g.verdict), sacks, goal: g.def.goal, stars: earned, maxStars: info.maxStars, levelRun,
      perfect: g.perfect, streak: g.bestCombo, lost: g.lost, seconds: g.time, gusts: g.gusted,
      line: levelRun ? levelLine(earned, g.perfect, g.def.goal) : humanLine(sacks), near, best: bestLine,
      versus: rival ? versusLine(card, rival) : "", card,
    });
    setZooming(true);
    show("over");
    // The stars are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
    if (earned === 3 || record) { confetti(); if (earned === 3) sfx.win(); }
    else if (!full && levelRun) sfx.lose();
  }

  function draw() {
    const c = context.current, g = game.current, sc = scene.current, view = seen.current;
    if (!c) return;
    drawFrame(c, sc, g);
    // The HUD's live parts, written straight to the DOM only when they change.
    const fill = g.def.clock > 0 ? Math.round((g.left / g.def.clock) * 100) : -1;
    if (fill !== view.meter && meter.current) { view.meter = fill; meter.current.style.setProperty("--fill", `${Math.max(0, fill)}%`); }
    const load = g.def.goal ? Math.round(Math.min(1, scoreOf(g) / g.def.goal) * 100) : -1;
    if (load !== view.line && line.current) { view.line = load; line.current.style.width = `${Math.max(0, load)}%`; }
    const strain = strainOf(g), playing = g.phase !== "end" && g.phase !== "over";
    const tension = g.n > 1 ? g.xs[g.n - 1] - g.xs[0] + g.sway : 0;
    const edge = !playing ? "" : g.gustAt < 1 && g.def.gusts > 0 && g.started ? (g.gustSide > 0 ? "gust-left" : "gust-right") : strain > DANGER ? (tension > 0 ? "right" : "left") : "";
    if (edge !== view.edge) { view.edge = edge; stageBox.current?.setAttribute("data-edge", edge); }
    const level = Math.round(Math.min(1, Math.max(0, (strain - DANGER) / (1 - DANGER))) * 10) / 10;
    if (level !== view.strain) { view.strain = level; stageBox.current?.style.setProperty("--strain", String(level)); }
  }

  useGameLoop(step, draw, (screen === "play" || (screen === "over" && zooming)) && !player.paused);

  // ---- size the scene to its box ----
  useEffect(() => {
    const holder = stageBox.current, target = canvas.current;
    if (!holder || !target) return;
    const fit = () => {
      const width = holder.clientWidth, height = holder.clientHeight;
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      context.current = fitCanvas(target, width, height);
      const sc = scene.current, g = game.current;
      resizeScene(sc, width, height, Math.min(2, window.devicePixelRatio || 1));
      sc.cam = Math.max(0, sc.targetLine - (sc.bedTop - g.n * sc.sackH));
      if (live.current.screen === "over") { sc.zoomT = 0; sc.settled = false; setZooming(true); }
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    fit();
    // The sacks and the godown carry Bangla words: paint them again once the fonts arrive.
    loadCardFonts("চাল পাট গুদাম নিচের বস্তার ঠিক ওপরে এলেই চাপো").then(() => { paint(scene.current); draw(); }).catch(() => {});
    return () => observer.disconnect();
  }, [screen === "title" || screen === "intro"]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || sheet) return;
      const dropKey = key === " " || key === "Enter" || key === "ArrowDown";
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
        if (dropKey) { event.preventDefault(); if (S.keyDown(s, event) && tap(game.current)) release(); }
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : key === "r" || key === "R" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      } else if (screen === "over" && dropKey) event.preventDefault();
    };
    const up = (event: KeyboardEvent) => { if (event.key === " " || event.key === "Enter" || event.key === "ArrowDown") S.keyUp(session.current); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // Taps act on pointer-down (no finger-lift delay). The first tap after a pause only wakes the game.
  function onStage(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || screen !== "play") return;
    event.preventDefault();
    if (S.canDrop(session.current, event.timeStamp) && tap(game.current)) release();
  }

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
  const endless = () => begin({ seed: friend && friend.kind === "endless" && friend.mode === mode ? friend.seed : newSeed(), kind: "endless", level: 1, mode });
  function again() { const current = live.current.run; begin({ ...current, seed: rivalFits(current) ? current.seed : newSeed() }); }
  const cleared = result !== null && run.kind === "level" && result.stars > 0;
  const nextLevel = run.kind === "level" && cleared && run.level < LEVEL_COUNT && run.level + 1 <= open ? run.level + 1 : 0;
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের লেভেল", run: () => pickLevel(nextLevel) }] : []),
    { label: "আবার খেলো", run: again },
    ...(run.kind === "old" ? [{ label: `লেভেল ${bn(open)} খেলো`, run: () => pickLevel(open) }] : [{ label: "সব লেভেল", run: () => setSheet(true) }]),
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const total = totalStars(levels.stars), spares = MODE_INFO[run.mode].spares;
  const badge = run.kind === "level" ? `লেভেল ${bn(run.level)}` : run.kind === "endless" ? "খোলা ঘাট" : "পুরোনো দোল";
  const playing = screen === "play" || screen === "over";

  return (
    <div className="bp-wrap" ref={wrap}>
      <div className="bp" data-slow={slow || undefined} data-screen={screen} data-world={def.world}>
        {screen === "title" && <TitleScreen run={run} mode={mode} friend={friend} stars={total} best={best} onStart={start} onMode={setMode} onLevels={() => setSheet(true)} onEndless={endless} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {playing && (
          <>
            <div className="bp-hud">
              <p className="bp-badge"><b>{badge}</b>{run.kind === "level" && <span>{def.name}</span>}{run.mode !== "n" && run.kind !== "old" && <i>{MODE_INFO[run.mode].name}</i>}</p>
              <p className="bp-boss" data-on={(def.finale !== "" && screen === "play") || undefined} aria-hidden={def.finale === ""}>
                <b>{def.finale}</b>{def.clock > 0 && <span ref={meter} className="bp-meter"><i /></span>}
              </p>
              <div className="bp-load">
                <p aria-label={def.goal ? `${bn(def.goal)}টার মধ্যে ${bn(Math.min(hud.score, def.goal))}টা বস্তা` : `${bn(hud.score)}টা বস্তা`}><b>{bn(def.goal ? Math.min(hud.score, def.goal) : hud.score)}</b>{def.goal ? `/${bn(def.goal)}` : "টা"}</p>
                {run.kind === "level" && (
                  <ol className="bp-spares" aria-label={`বাড়তি বস্তা ${bn(Math.max(0, spares - hud.lost))}টা`}>
                    {Array.from({ length: spares }, (_, index) => <li key={index} data-gone={index >= spares - hud.lost || undefined} />)}
                  </ol>
                )}
              </div>
            </div>
            <div className="bp-stage" ref={stageBox} data-edge="" onPointerDown={onStage} onContextMenu={event => event.preventDefault()}>
              <canvas ref={canvas} className="bp-canvas" role="img" aria-label="নদীঘাটে ক্রেন, দুলছে চালের বস্তা, নিচে ট্রাক" />
              {def.goal > 0 && <span className="bp-line" aria-hidden="true"><span ref={line} /></span>}
              {hud.combo >= 2 && screen === "play" && <span className="bp-combo" key={hud.combo} aria-hidden="true">ঠিক মাঝে ×{bn(hud.combo)}</span>}
              <span className="bp-gust" data-side="left" aria-hidden="true">হাওয়া →</span>
              <span className="bp-gust" data-side="right" aria-hidden="true">← হাওয়া</span>
              <p className="bp-sr" aria-live="polite">{news}</p>
            </div>
            {screen === "over" && result && <EndScreen stats={result} slow={slow} choices={choices} onCard={toCard} />}
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} best={best} onMode={setMode} onPick={pickLevel} onEndless={endless} onClose={() => setSheet(false)} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.card} site={site} />}
    </div>
  );
}
