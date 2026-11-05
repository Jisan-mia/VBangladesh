"use client";
// IP: what we avoided — no bird, no green pipes, no pixel art, no tap-to-flap sounds, no medal screen or any famous flappy game's name or look; a balloon held up by a finger, drooping Dhaka wires, poles, crows and shop signs, all drawn fresh.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps them, session.ts decides input and sound
// loops); this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, loop, newSeed, readLevels, sfx, silenceScheduled, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { buildLayers, makeFx, PALETTES, type Fx, type Layers } from "../lib/art";
import { BOSS_CROW, BX, createGame, E, FLY, GROUND, READY, tenthsOf, type Game } from "../lib/belun";
import { burst, drawFrame, puff, resetFx, say, spark, tickFx, WORD } from "../lib/draw.hot";
import { BOSS_NAME, isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, starsOf, type Mode } from "../lib/levels";
import { bn, compareLine, humanLine, migrateLevels, nearMiss, parseShared, SLUG, type Shared } from "../lib/link";
import type { Card } from "../lib/card";
import * as S from "../lib/session";
import { stepGame } from "../lib/step.hot";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { sound } from "./sound";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = { levels: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Run = { seed: number; level: number; mode: Mode };
type Result = { stats: EndStats; shared: Omit<Shared, "name" | "won">; card: Omit<Card, "name"> };
type Hud = { score: number; grazes: number; balloons: number; bossLeft: number; ready: boolean; respawn: boolean };

/** What the lane's edge says right now (CSS draws it; the middle stays clear). */
function edgeOf(g: Game, flash: number) {
  if (flash > 0) return "lost";
  if (g.phase !== FLY) return "";
  if (g.y > GROUND - 64 && g.vy > 40) return "low";
  if (g.near < 7) return "near";
  if (g.gustSoon > 0) return "gust-down";
  if (g.gustSoon < 0) return "gust-up";
  if (g.balloons === 1 && MODE_INFO[g.mode].balloons > 1) return "last";
  return "";
}

export function BelunGame() {
  const lane = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null);
  const layers = useRef<Layers | null>(null);
  const fx = useRef<Fx>(makeFx());
  const game = useRef<Game>(createGame(1));
  const session = useRef<S.Session>(S.createSession(true));
  const hum = useRef<ReturnType<typeof loop> | null>(null), wind = useRef<ReturnType<typeof loop> | null>(null);
  const seen = useRef({ edge: "", flash: 0, clock: 0 });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n" });
  const [hud, setHud] = useState<Hud>({ score: 0, grazes: 0, balloons: 2, bossLeft: 0, ready: true, respawn: false });
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [site, setSite] = useState("");
  const [mode, setModeState] = useState<Mode>("n");
  const [slow] = useSlowMode();
  const [soundSwitch] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, run, friend, levels, ahead, best });
  live.current = { slow, screen, run, friend, levels, ahead, best };
  const def = levelDef(run.level), world = def.world;

  // ---- sound loops: session.ts decides, this does ----
  const loops: S.Loops = {
    start: kind => {
      if (kind === "hum") { hum.current?.stop(); hum.current = loop("hum", 96); hum.current.set(0); }
      else { wind.current?.stop(); wind.current = loop("wind"); wind.current.set(0); }
    },
    stop: kind => { const handle = kind === "hum" ? hum : wind; handle.current?.stop(); handle.current = null; },
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

  const hudOf = (g: Game): Hud => ({ score: g.score, grazes: g.grazes, balloons: g.balloons, bossLeft: g.bossLeft, ready: g.phase === READY, respawn: g.respawn });

  /** A fresh run on the play screen, waiting for the first press. Cuts the last card's chimes. */
  function begin(next: Run) {
    silenceScheduled();
    const fresh = createGame(next.seed, next.level, next.mode);
    game.current = fresh;
    resetFx(fx.current);
    Object.assign(seen.current, { edge: "", flash: 0 });
    lane.current?.setAttribute("data-edge", "");
    setRun(next); setHud(hudOf(fresh)); setResult(null); setSheet(false);
    show("play");
    sound.motif(levelDef(next.level).world);
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    const link = parseShared(window.location.hash);
    setFriend(link);
    setSite(window.location.host);
    session.current.sound = soundOn();
    // Before the level store is read: an old phone's best on the endless street opens the first levels (once).
    const moved = migrateLevels(read(KEYS.levels), read(KEYS.best));
    if (moved) { write(KEYS.levels, moved); for (const [level, earned] of Object.entries(JSON.parse(moved) as Record<string, number>)) levels.record(Number(level), earned); }
    const saved = readLevels(read(KEYS.levels), LEVEL_COUNT), savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedBest = Number(read(KEYS.best));
    setBest(read(KEYS.best) !== null && Number.isFinite(savedBest) ? savedBest : null);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    const playMode = link ? (link.old ? (link.mode === "e" ? "e" : chosen) : link.mode) : chosen;
    setModeState(playMode);
    const first = link ? { seed: link.seed, level: link.level, mode: playMode } : { seed: newSeed(), level: openLevel(saved, savedAhead), mode: chosen };
    setRun(first);
    game.current = createGame(first.seed, first.level, first.mode);
    setHud(hudOf(game.current));
    return () => { loops.stop("hum"); loops.stop("wind"); silenceScheduled(); };
  }, []);

  // A friend's link opened on a page that is already here (only the hash changes): back to the title with their street.
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
    Object.assign(window, { __belun: { game: () => game.current, session: () => session.current, fx: () => fx.current, layers: () => layers.current } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar: loops come back at once ----
  useEffect(() => { S.setSound(session.current, soundSwitch); if (!soundSwitch) silenceScheduled(); sync(); }, [soundSwitch]);
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

  // ---- the lane scrolled off a desktop page: hands off and nothing moves until it's back (ticking needs inView) ----
  const playing = screen === "play" || screen === "over";
  useEffect(() => {
    const box = lane.current;
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => { S.setInView(session.current, entry.isIntersecting); sync(); }, { threshold: 0.2 });
    observer.observe(box);
    return () => { observer.disconnect(); S.setInView(session.current, true); };
  }, [playing]);

  // ---- the level list is a choice screen: nothing moves behind it ----
  useEffect(() => { if (sheet) S.openSheet(session.current); else S.closeSheet(session.current); sync(); }, [sheet]);

  // ---- one step: input, rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = game.current, slowNow = live.current.slow;
    if (!S.ticking(s) || S.breathing(s, dt)) return;
    const hold = S.takeInput(s);
    stepGame(g, hold, dt, slowNow);
    for (let i = 0; i < g.evCount; i++) onEvent(g, g.ev[i], g.evX[i], g.evY[i]);
    g.evCount = 0;
    sync();
    // Sound that carries the state: the wires hum louder and higher as the balloon nears one (the orange edge);
    // the wind follows the gust (the streaks and the edge chevrons).
    const near = Math.max(0, Math.min(1, 1 - g.near / 36));
    hum.current?.set(near * near * 0.75); hum.current?.pitch(96 + 70 * near);
    wind.current?.set(Math.min(1, Math.abs(g.wind) / 300) * 0.8);
  }

  function onEvent(g: Game, kind: number, x: number, y: number) {
    const f = fx.current, slowNow = live.current.slow;
    if (kind === E.PASS) { sound.pass(x); setHud(hudOf(g)); }
    else if (kind === E.SCRAPE) { sound.squeak(); spark(f, BX, y, y < g.cy[g.grazedAt], g.grazedAt); say(f, WORD.SCRAPE, BX, y); setHud(hudOf(g)); }
    else if (kind === E.POP) {
      sound.pop(); burst(f, BX, y); say(f, WORD.POP, BX + 30, y);
      if (!slowNow) f.shake = 0.3;
      seen.current.flash = 0.5;
      setHud(hudOf(g));
      // যত দূর পারো ends on the last balloon: the best is kept the moment it pops, not when the card shows.
      if (g.endless && g.balloons === 0) keepBest(g.score);
    } else if (kind === E.CROW_WARN) { sound.caw(x === BOSS_CROW); say(f, WORD.CAW, (layers.current?.viewW ?? 300) - 70, y); }
    else if (kind === E.CROW_PASS) sound.flap();
    else if (kind === E.GUST_WARN) sound.gust(y === 1);
    else if (kind === E.KNOT || kind === E.BOSS) { sound.notch(); if (kind === E.KNOT) say(f, WORD.KNOT, BX + 40, y); setHud(hudOf(g)); }
    else if (kind === E.RESPAWN) { sound.fresh(); setHud(hudOf(g)); }
    else if (kind === E.START) setHud(hudOf(g));
    else if (kind === E.WIN) { keepStars(g); sound.seller(); }
    else if (kind === E.OVER) finish();
  }

  /** The level is cleared: stars are recorded now, so a quick tap on the end glide can't lose them. */
  function keepStars(g: Game) {
    if (g.endless) return;
    const { level, mode: played } = live.current.run, earned = starsOf(true, g.lost, g.grazes, level, played);
    const nextList = nextAhead(live.current.levels.stars, live.current.ahead, level);
    write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
    live.current.levels.record(level, earned);
  }
  const bestAtStart = useRef<number | null>(null);
  function keepBest(score: number) {
    const before = live.current.best;
    bestAtStart.current = before;
    if (before === null || score > before) { write(KEYS.best, String(score)); setBest(score); }
  }

  function finish() {
    const g = game.current, { level, mode: played, seed } = live.current.run, info = MODE_INFO[played], d = levelDef(level);
    const tenths = tenthsOf(g.flyTime), won = g.won, earned = starsOf(won, g.lost, g.grazes, level, played);
    const previous = g.endless ? bestAtStart.current : null;
    const bestLine = !g.endless ? "" : previous === null ? `এই ফোনে প্রথম রেকর্ড: ${bn(g.score)}টা ফাঁক।` : g.score > previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(previous)}টা।` : `এই ফোনে সেরা ${bn(previous)}টা ফাঁক।`;
    const rival = friend && !friend.old && friend.level === level && friend.seed === seed && friend.mode === played ? friend : null;
    const you = { won, lost: g.lost, grazes: g.grazes, tenths, score: g.score };
    const versus = rival ? compareLine(you, rival) : "";
    const slowUsed = live.current.slow;
    setResult({
      stats: {
        level, name: d.name, won, score: g.score, goal: g.goal, lost: g.lost, balloons: info.balloons, tenths, stars: earned, maxStars: info.maxStars,
        grazes: g.grazes, bestStreak: g.bestStreak, dodged: g.crowsDodged, gusts: g.gustsRidden, popped: g.popped,
        line: versus || humanLine({ level, won, lost: g.lost, grazes: g.grazes, score: g.score }),
        near: nearMiss({ level, won, lost: g.lost, grazes: g.grazes, score: g.score, best: previous, mode: played }), best: bestLine,
      },
      shared: { seed, score: g.score, level, mode: played, slow: slowUsed, lost: g.lost, grazes: g.grazes, tenths, old: false },
      card: { score: g.score, level, mode: played, stars: earned, won, lost: g.lost, grazes: g.grazes, tenths, slow: slowUsed },
    });
    show("over");
    // The stars and the fanfare are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    const record = g.endless && g.score > 0 && (previous === null || g.score > previous);
    if (won) { sound.stars(earned, earned === 3); if (earned === 3) confetti(); }
    else if (record) { sound.stars(0, true); confetti(); }
    else sound.lose();
  }

  function draw() {
    const target = canvas.current, built = layers.current;
    if (!target || !built) return;
    const g = game.current, view = seen.current, now = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (view.clock || now)));
    view.clock = now;
    if (S.ticking(session.current)) tickFx(fx.current, dt, PALETTES[built.world].night);
    drawFrame(target.getContext("2d")!, built, g, fx.current, now);
    if (view.flash > 0) view.flash -= dt;
    const edge = edgeOf(g, view.flash);
    if (edge !== view.edge) { view.edge = edge; lane.current?.setAttribute("data-edge", edge); }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the lane to its box, pre-render the পাড়া's layers ----
  useEffect(() => {
    const box = lane.current, target = canvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      fitCanvas(target, width, height);
      layers.current = buildLayers(width, height, Math.min(2, window.devicePixelRatio || 1), world);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    // The shop signs are Bangla text baked into a layer; repaint them once the font is in.
    void document.fonts?.ready.then(size);
    return () => observer.disconnect();
  }, [playing, world]);

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
        const lift = S.keyOf(key);
        if (lift) { event.preventDefault(); if (!event.repeat && S.keyDown(s, lift)) pressed(); }
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" || key === "r" || key === "R" ? 1 : key === "3" ? 2 : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => { const lift = S.keyOf(event.key); if (lift) S.keyUp(session.current, lift); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  /** A press that counts: answered at once with a breath and a squash, before the next step lifts the balloon. */
  function pressed() {
    const g = game.current;
    if (g.phase !== READY && g.phase !== FLY) return;
    sound.breath();
    puff(fx.current, BX, g.y + 22);
  }

  // ---- the lane: hold anywhere to lift, lift the finger to sink ----
  function laneDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button, a")) return;
    if (!S.pointerDown(session.current, event.pointerId)) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already gone */ }
    pressed();
  }
  const laneUp = (event: ReactPointerEvent<HTMLDivElement>) => S.pointerUp(session.current, event.pointerId);

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => ({ ...current, mode: next })); sfx.tap(); }
  const lockedMode = friend !== null && !friend.old && friend.level === run.level && friend.seed === run.seed;
  const friendFits = (level: number, seed: number, played: Mode) => Boolean(friend && friend.level === level && friend.seed === seed && (friend.old || friend.mode === played));
  function start() {
    sfx.tap();
    const fromFriend = friendFits(run.level, run.seed, lockedMode ? run.mode : mode);
    if (!read(KEYS.intro) && !friend) { show("intro"); return; }
    begin(fromFriend || lockedMode ? run : { ...run, mode });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode }); }
  function pickLevel(level: number) {
    if (level !== 0 && (!isLevel(level) || level > open)) return;
    const rival = friend && friend.level === level && (friend.old || friend.mode === mode) ? friend : null;
    begin({ seed: rival ? rival.seed : newSeed(), level, mode: rival && !rival.old ? rival.mode : mode });
  }
  function ownGame() {
    setFriend(null);
    history.replaceState(history.state, "", location.pathname + location.search);
    const saved = readLevels(read(KEYS.levels), LEVEL_COUNT), level = openLevel(saved, ahead);
    setRun({ seed: newSeed(), level, mode });
    game.current = createGame(1, level, mode);
  }
  const again = () => begin({ ...run, seed: friendFits(run.level, run.seed, run.mode) ? run.seed : newSeed() });
  const nextLevel = run.level > 0 && run.level < LEVEL_COUNT && run.level + 1 <= open ? run.level + 1 : 0;
  const won = Boolean(result?.stats.won);
  const choices: Choice[] = won && nextLevel
    ? [{ label: "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode }) }, { label: "আবার খেলো", run: again }, { label: "সব লেভেল", run: () => setSheet(true) }]
    : [{ label: "আবার খেলো", run: again },
      ...(mode !== "e" && !won && run.level > 0 ? [{ label: "সহজে খেলো", run: () => { setMode("e"); begin({ ...run, seed: newSeed(), mode: "e" }); } }]
        : won && run.level === LEVEL_COUNT ? [{ label: "যত দূর পারো", run: () => begin({ seed: newSeed(), level: 0, mode }) }] : []),
      { label: "সব লেভেল", run: () => setSheet(true) }];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const total = totalStars(levels.stars);
  const finale = def.boss && screen === "play" && hud.bossLeft > 0 && !hud.ready;
  const spare = MODE_INFO[run.mode].balloons;
  const goal = def.crossings, endless = run.level === 0;

  return (
    <div className="tb-wrap" ref={wrap}>
      <div className="tb" data-slow={slow || undefined} data-screen={screen} data-world={world}>
        {screen === "title" && <TitleScreen level={run.level} mode={lockedMode ? run.mode : mode} friend={friend} stars={total} slow={slow} lockedMode={lockedMode} onStart={start} onMode={setMode} onLevels={() => setSheet(true)} onOwn={ownGame} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {playing && (
          <div className="tb-play">
            <div className="tb-lane" ref={lane} data-edge="" onPointerDown={laneDown} onPointerUp={laneUp} onPointerCancel={laneUp} onLostPointerCapture={laneUp} onContextMenu={event => event.preventDefault()}>
              <canvas ref={canvas} className="tb-canvas" role="img" aria-label={`${def.name}-এর গলি। ${endless ? `${bn(hud.score)}টা ফাঁক পার` : `${bn(goal)}টার মধ্যে ${bn(hud.score)}টা ফাঁক পার`}, হাতে ${bn(Math.max(0, hud.balloons))}টা বেলুন।`} />
              {!endless && <span className="tb-progress" aria-hidden="true" style={{ transform: `scaleX(${hud.score / goal})` }} />}
              <div className="tb-hud" aria-hidden={screen !== "play"}>
                <div className="tb-hud-left">
                  <p className="tb-badge"><b>{endless ? "যত দূর পারো" : `লেভেল ${bn(run.level)}`}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
                  <p className="tb-balloons" aria-label={`হাতে ${bn(Math.max(0, hud.balloons))}টা বেলুন`}>
                    {Array.from({ length: spare }, (_, at) => <i key={at} data-on={at < hud.balloons} />)}
                  </p>
                </div>
                {finale ? (
                  <p className="tb-boss" aria-label={`${BOSS_NAME[def.boss!]}: আর ${bn(hud.bossLeft)} বাকি`}>
                    <b>{BOSS_NAME[def.boss!]}</b>
                    <span>{Array.from({ length: game.current.bossMax }, (_, at) => <i key={at} data-on={at < hud.bossLeft} />)}</span>
                  </p>
                ) : !endless && goal <= 14 ? (
                  <ol className="tb-dots" aria-hidden="true">{Array.from({ length: goal }, (_, at) => <li key={at} data-done={at < hud.score} />)}</ol>
                ) : <span />}
                <div className="tb-hud-right">
                  <p className="tb-count"><b>{bn(hud.score)}</b>{endless ? "" : `/${bn(goal)}`} ফাঁক</p>
                  <p className="tb-grazes" data-on={hud.grazes > 0 || undefined}>ঘষা {bn(hud.grazes)}</p>
                </div>
              </div>
              <span className="tb-chevrons" data-side="top" aria-hidden="true" />
              <span className="tb-chevrons" data-side="bottom" aria-hidden="true" />
              {screen === "play" && hud.ready && (
                <>
                  {!hud.respawn && <p className="tb-intro"><b>{endless ? def.title : `${def.name} · ${def.title}`}</b><span>{def.teach}</span></p>}
                  <p className="tb-hint"><span className="tb-finger" aria-hidden="true" />{hud.respawn ? "নতুন বেলুন! চেপে ধরলেই উড়বে" : "চেপে ধরো: বেলুন ওঠে · ছাড়ো: নামে"}<small>কম্পিউটারে স্পেস বা ↑ চেপে ধরো</small></p>
                </>
              )}
              {screen === "over" && result && <EndScreen stats={result.stats} slow={slow} choices={choices} onCard={toCard} />}
            </div>
          </div>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} best={best} onMode={setMode} onPick={pickLevel} onClose={() => setSheet(false)} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.shared} card={result.card} site={site} />}
      <p className="tb-sr" aria-live="polite">{screen === "play" && hud.ready ? (hud.respawn ? "নতুন বেলুন। চেপে ধরলেই উড়বে।" : "চেপে ধরলে বেলুন ওঠে, ছাড়লে নামে।") : ""}</p>
    </div>
  );
}

