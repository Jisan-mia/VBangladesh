"use client";
// IP: what we avoided — no named maze game, mascot or level map from any app; our own seeded mazes, a round walker of our own,
// a house, a জিলাপির দোকান, bamboo gates, canal currents and রিকশা stands drawn fresh, and our own bell and footstep sounds.
// The game inside the shared player. Rules live in lib/ (step.hot.ts walks, session.ts decides input); this file feeds
// input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, hiss, readLevels, silenceScheduled, tone, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { buildLayers, type Layers } from "../lib/art";
import { DIRS, E, N, S, W, type Dir } from "../lib/board";
import { drawFrame, follow, type Frame, type View } from "../lib/draw.hot";
import { createGame, EV, tenthsOf, trailOf, walkedOf, type Game } from "../lib/game";
import {
  bestOf, boardOf, dhakaDate, isLevel, levelDef, LEVEL_COUNT, MODE_INFO, isMode, nextAhead, openingLevel, openLevel, parOf, readAhead, starsOf,
  WORLDS, type Mode, type Par, type Where,
} from "../lib/levels";
import { bn, compareLine, fullLabel, humanLine, nearLine, parseShared, seconds, type Shared } from "../lib/link";
import { choiceForKey, endChoices } from "../lib/choices";
import * as Sess from "../lib/session";
import { hintSide, type Swipe } from "../lib/solve";
import { stepGame, steer, walkTo } from "../lib/step.hot";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const SLUG = "golokdhadha";
const KEYS = { levels: `ektukhani-levels-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** The old best keys stay for normal play at full speed; other modes and slow play get their own. */
const bestKey = (where: Where, mode: Mode, slow: boolean) => `ektukhani-best-${SLUG}-${where.level ? `l${where.level}` : `d${where.seed}`}${mode === "n" ? "" : mode}${slow ? "w" : ""}`;

const MIN_CELL = 20, MAX_CELL = 72;
const KEYMAP: Record<string, Dir> = { ArrowUp: N, ArrowRight: E, ArrowDown: S, ArrowLeft: W, w: N, d: E, s: S, a: W, W: N, D: E, S: S, A: W };
const PAD: ReadonlyArray<readonly [Dir, string, number]> = [[W, "বাঁয়ে", -90], [N, "ওপরে", 0], [S, "নিচে", 180], [E, "ডানে", 90]];
/** Four notes on a level's first move, one tune per world. */
const MOTIF = [[523, 659, 784, 659], [587, 698, 880, 784], [494, 587, 740, 659], [440, 523, 659, 587], [659, 784, 988, 1175]];

const footstep = (count: number) => tone(count % 2 ? 540 : 470, 0.03, 0.035, "triangle");
const bumpSound = () => tone(150, 0.12, 0.12, "sine", 0, 85);
const keySound = () => { tone(1568, 0.08, 0.08, "triangle"); tone(2349, 0.22, 0.06, "sine", 0.07); };
const gateSound = () => tone(210, 0.24, 0.06, "sawtooth", 0.12, 320);
const bellSound = () => { for (const at of [0, 0.15]) { tone(2650, 0.05, 0.05, "square", at); tone(2950, 0.06, 0.04, "square", at + 0.05); } };
const splash = () => hiss(0.22, 0.08, 900);
/** The signature: the sweet shop's bell, টুং-টাং. Scheduled tones, so the player's pause cuts them. */
const shopBell = () => { tone(1760, 0.5, 0.07, "triangle"); tone(2637, 0.35, 0.035, "sine"); tone(1568, 0.6, 0.07, "triangle", 0.16); tone(2349, 0.4, 0.03, "sine", 0.16); };

type Screen = Sess.Screen;
type Run = { where: Where; mode: Mode };
type Result = EndStats & { shared: Omit<Shared, "name">; trail: number[]; walked: number[] };

export function GolokdhadhaGame() {
  const wrap = useRef<HTMLDivElement>(null), boardBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLElement>(null), bar = useRef<HTMLElement>(null);
  const game = useRef<Game>(createGame({ level: 1, seed: 0, old: false }, "n", false));
  const session = useRef<Sess.Session>(Sess.createSession());
  const layers = useRef<Layers | null>(null), context = useRef<CanvasRenderingContext2D | null>(null);
  const view = useRef<View>({ side: 0, camX: 0, camY: 0 });
  const frame = useRef<Frame>({ time: 0, slow: false, hint: -1 });
  const seen = useRef({ tenths: -1, danger: "", progress: -1, last: 0, startTogo: 1, par: { three: 0, two: 0 } as Par });
  const probe = useRef<Swipe>({ cell: 0, mask: 0, cells: 0, rides: 0, done: false, picked: 0 });
  const drag = useRef({ x: 0, y: 0, moved: false });

  const [screen, setScreen] = useState<Screen>("title");
  const [round, setRound] = useState(0);
  const [run, setRun] = useState<Run>({ where: { level: 1, seed: 0, old: false }, mode: "n" });
  const [mode, setModeState] = useState<Mode>("n");
  const [par, setPar] = useState<Par>({ three: 0, two: 0 });
  const [mask, setMask] = useState(0);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [site, setSite] = useState("");
  const [today, setToday] = useState(0);
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, sheet });
  live.current = { slow, screen, sheet };

  const player = useGamePlayer({
    // A turn asked for before the pause is dropped: nobody remembers a swipe from before the menu.
    onPause: () => { Sess.pause(session.current); game.current.pending = 0; },
    onResume: () => Sess.resume(session.current),
    onRestart: () => { Sess.resume(session.current); if (live.current.screen === "play" || live.current.screen === "over") begin(run); },
  });

  function show(next: Screen) {
    Sess.goTo(session.current, next, performance.now());
    setScreen(next);
  }

  /** A fresh walk on the play screen, waiting at home for the first swipe. The speed is fixed here for the whole run. */
  function begin(next: Run) {
    silenceScheduled();
    const fresh = createGame(next.where, next.mode, live.current.slow);
    game.current = fresh;
    const nextPar = parOf(next.where, next.mode, fresh.slow);
    Object.assign(seen.current, { tenths: -1, danger: "", progress: -1, startTogo: Math.max(1, fresh.graph.togo[fresh.board.start * 4]), par: nextPar });
    frame.current.hint = -1;
    layers.current = null;
    setRun(next); setRound(value => value + 1); setPar(nextPar); setMask(0); setResult(null); setSheet(false);
    setNote(next.mode === "e" ? "মোড়ে থামলে ঠিক দিকে হলুদ তীর জ্বলবে।" : "বোর্ডে আঙুল টানো, নয়তো নিচের তীর চাপো।");
    updateHint();
    show("play");
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    const date = dhakaDate();
    setToday(date);
    const saved = readLevels(read(KEYS.levels), LEVEL_COUNT), savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(chosen);
    const readFriend = () => {
      const link = parseShared(window.location.hash);
      setFriend(link);
      if (link) { setRun({ where: { level: link.level, seed: link.seed, old: link.old }, mode: link.mode }); if (live.current.screen !== "play") show("title"); }
      return link;
    };
    if (!readFriend()) setRun({ where: { level: openingLevel(saved, savedAhead), seed: 0, old: false }, mode: chosen });
    // A link changed in place: a valid one opens its maze; a broken one drops the old friend instead of keeping it.
    const onHash = () => { readFriend(); };
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __golok: { game: () => game.current, session: () => session.current, steer: (dir: Dir) => steerNow(dir) } });
  });

  // ---- sound off cuts the bell and the chimes already queued ----
  useEffect(() => { if (!sound) silenceScheduled(); }, [sound]);

  // ---- away and back: let go of the finger; the player pauses ----
  useEffect(() => {
    const onBlur = () => { Sess.blur(session.current); game.current.pending = 0; };
    const onFocus = (event: FocusEvent) => Sess.focus(session.current, event.timeStamp);
    const onVisibility = (event: Event) => { if (document.hidden) Sess.hide(session.current); else Sess.show(session.current, event.timeStamp); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  /** Easy mode: which side leads on from where the walker stands (only while it stands). */
  function updateHint() {
    const g = game.current;
    frame.current.hint = g.mode === "e" && g.phase !== "over" ? hintSide(g.graph, g.at, g.mask, probe.current) : -1;
  }

  // ---- one step: the rules, then sound and juice for what happened ----
  function step(dt: number) {
    const s = session.current, g = game.current, view = seen.current;
    if (!Sess.ticking(s)) return;
    stepGame(g, dt);
    const events = g.events;
    g.events = 0;
    if (events) react(g, events);
    if (g.phase === "walk") {
      const tenths = tenthsOf(g.elapsed), left = view.par.three - tenths;
      const danger = left > 0 && left <= 15 ? (live.current.slow ? "steady" : "pulse") : "";
      if (danger !== view.danger) { view.danger = danger; boardBox.current?.setAttribute("data-danger", danger); }
    }
  }

  function react(g: Game, events: number) {
    const slowNow = live.current.slow;
    if (events & EV.start) MOTIF[g.board.world].forEach((note, at) => tone(note, 0.12, 0.05, "triangle", at * 0.09));
    if (events & EV.step) footstep(g.steps);
    if (events & EV.current) splash();
    if (events & EV.bump) {
      bumpSound();
      if (!slowNow) buzz(12);
      const colour = g.bumpKind === 2 ? g.board.gate[g.at * 4 + DIRS.indexOf(g.bumpDir)] : 0;
      setNote(g.bumpKind === 2 ? `ঝাঁপে তালা। আগে ${colour === 2 ? "চৌকো নীল" : "গোল লাল"} চাবিটা খোঁজো।`
        : g.bumpKind === 3 ? (g.board.world === 2 ? "স্রোতের উল্টো দিকে নৌকা যায় না।" : "একমুখী পথ, উল্টো দিকে যাওয়া যায় না।")
        : "ওদিকে দেয়াল।");
    }
    if (events & EV.key) { keySound(); gateSound(); if (!slowNow) buzz(15); setMask(g.mask); setNote("চাবি পেলে! ওই রঙের ঝাঁপ খুলে গেছে।"); }
    if (events & EV.ride) { bellSound(); setNote("রিকশায় চড়ে ওপারের স্ট্যান্ডে।"); }
    if (events & (EV.stop | EV.key | EV.ride | EV.start)) {
      updateHint();
      const togo = g.graph.togo[g.at * 4 + g.mask], view = seen.current;
      const progress = Number.isFinite(togo) ? Math.max(0, Math.min(1, 1 - togo / view.startTogo)) : view.progress;
      if (progress !== view.progress && bar.current) { view.progress = progress; bar.current.style.setProperty("--done", `${Math.round(progress * 100)}%`); }
    }
    if (events & EV.finish) finish();
  }

  function finish() {
    const g = game.current, { where, mode: played } = run, info = MODE_INFO[played];
    // Graded at the speed and mode the run started with, whatever the menu says now.
    const tenths = tenthsOf(g.elapsed), nextPar = parOf(g.where, g.mode, g.slow), earned = starsOf(tenths, nextPar, played);
    const key = bestKey(where, played, g.slow), before = Number(read(key)), previous = read(key) !== null && Number.isFinite(before) && before > 0 ? before : null;
    let best = "", firstClear = false;
    if (!where.old) {
      if (where.level) {
        firstClear = !levels.stars[where.level];
        const nextList = nextAhead(levels.stars, ahead, where.level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        levels.record(where.level, earned);
      }
      if (previous === null || tenths < previous) write(key, String(tenths));
      best = previous === null ? "" : tenths < previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${seconds(previous)} সেকেন্ড।` : `এই ফোনে তোমার সেরা ${seconds(previous)} সেকেন্ড।`;
    }
    const rival = friend && friend.level === where.level && friend.seed === where.seed && friend.old === where.old && friend.mode === played ? friend : null;
    const shortest = bestOf(where);
    let hasKeys = false;
    for (let index = 0; index < g.board.key.length; index++) if (g.board.key[index]) hasKeys = true;
    const def = where.level && !where.old ? levelDef(where.level) : null;
    setResult({
      kicker: `${fullLabel(where)} পার`,
      tenths, stars: earned, maxStars: info.maxStars,
      steps: g.steps, shortest: shortest.cells, swipes: g.swipes, deadEnds: g.deadEnds, keys: g.keys, rides: g.rides, hasKeys, hasRides: shortest.rides > 0,
      line: rival ? compareLine(tenths, rival.tenths, rival.name) : def?.finale && firstClear ? WORLDS[def.world].clear : humanLine(earned, g.backtracks === 0),
      near: nearLine(tenths, nextPar, played), best,
      shared: { level: where.level, seed: where.seed, tenths, stars: earned, clean: g.backtracks === 0, mode: played, slow: g.slow, old: where.old },
      trail: trailOf(g), walked: walkedOf(g),
    });
    show("over");
    boardBox.current?.setAttribute("data-danger", "");
    shopBell();
    for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.55 + star * 0.28);
    if (!live.current.slow) buzz([20, 40, 20]);
    if (earned === 3 || (previous !== null && tenths < previous) || (def?.finale && firstClear)) confetti();
  }

  function draw() {
    const target = context.current, built = layers.current;
    if (!target || !built) return;
    const g = game.current, now = performance.now(), dt = Math.min(0.1, (now - (seen.current.last || now)) / 1000);
    seen.current.last = now;
    const f = frame.current;
    f.time += dt; f.slow = live.current.slow;
    const standing = g.to < 0 && g.ghost < 0 && g.ride <= 0;
    const hint = f.hint;
    if (!standing) f.hint = -1;
    follow(view.current, built, g, dt, false);
    drawFrame(target, built, g, view.current, f);
    f.hint = hint;
    const tenths = tenthsOf(g.elapsed);
    if (tenths !== seen.current.tenths && clock.current) { seen.current.tenths = tenths; clock.current.textContent = seconds(tenths); }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the board to its box, pre-render its layers ----
  useEffect(() => {
    const box = boardBox.current, target = canvas.current;
    if (!box || !target) return;
    let width = 0;
    const size = () => {
      const side = Math.floor(box.clientWidth);
      if (side < 60 || (side === width && layers.current)) return;
      width = side;
      const g = game.current, cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(side / (g.board.size + 0.2))));
      layers.current = buildLayers(g.board, cell, Math.min(2, window.devicePixelRatio || 1), g.dark);
      context.current = fitCanvas(target, side, side);
      target.style.height = `${side}px`;
      view.current.side = side;
      follow(view.current, layers.current, g, 0, true);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    size();
    return () => observer.disconnect();
  }, [screen === "play" || screen === "over", round]);

  // ---- input ----
  function steerNow(dir: Dir) {
    const g = game.current;
    if (!Sess.canSteer(session.current)) return false;
    const moved = steer(g, dir);
    if (moved && g.events & EV.start) react(g, EV.start);
    if (moved) { g.events &= ~EV.start; frame.current.hint = -1; if (note) setNote(""); }
    else if (g.events & EV.bump) { g.events &= ~EV.bump; react(g, EV.bump); }
    return moved;
  }

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || sheet) return;
      if (screen === "play") {
        const dir = KEYMAP[key];
        if (dir) { event.preventDefault(); if (Sess.keyDown(s)) steerNow(dir); return; }
        if ((key === "p" || key === "P") && !event.repeat) { event.preventDefault(); player.requestPause(); }
      } else if (screen === "title" && (key === "Enter" || key === " ") && !event.repeat) {
        event.preventDefault(); start();
      } else if (screen === "over" && Sess.freshResultKey(s, event)) {
        const pick = choiceForKey(key);
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // ---- the finger: a swipe walks to the next turn, a long drag keeps steering, a tap walks a straight lane ----
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary) return;
    const verdict = Sess.pointerDown(session.current, event.pointerId, event.timeStamp);
    if (verdict !== "steer") return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    Object.assign(drag.current, { x: event.clientX, y: event.clientY, moved: false });
  }
  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!Sess.pointerMoves(session.current, event.pointerId, event.pointerType === "mouse", event.buttons)) return;
    const hand = drag.current, dx = event.clientX - hand.x, dy = event.clientY - hand.y;
    const cell = layers.current?.cell ?? 30;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < Math.min(24, Math.max(12, cell * 0.4))) return;
    hand.moved = true; hand.x = event.clientX; hand.y = event.clientY;
    steerNow(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? E : W) : (dy > 0 ? S : N));
  }
  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!Sess.pointerUp(session.current, event.pointerId) || drag.current.moved || !Sess.canSteer(session.current)) return;
    const built = layers.current, g = game.current;
    if (!built) return;
    const box = event.currentTarget.getBoundingClientRect(), wall = (built.px - g.board.size * built.cell) / 2;
    const col = Math.floor((event.clientX - box.left + view.current.camX - wall) / built.cell), row = Math.floor((event.clientY - box.top + view.current.camY - wall) / built.cell);
    if (col < 0 || row < 0 || col >= g.board.size || row >= g.board.size) return;
    const cell = row * g.board.size + col;
    if (cell === g.at || g.to >= 0 || g.ghost >= 0) return;
    if (walkTo(g, cell)) { if (g.events & EV.start) { g.events &= ~EV.start; react(g, EV.start); } frame.current.hint = -1; if (note) setNote(""); }
    else setNote("সোজা গলির কোনো ঘরে চাপো, নয়তো আঙুল টানো।");
  }
  const onPointerEnd = (event: ReactPointerEvent<HTMLCanvasElement>) => { Sess.pointerUp(session.current, event.pointerId); };

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => ({ ...current, mode: next })); }
  const friendRun = (where: Where) => friend && friend.level === where.level && friend.seed === where.seed && friend.old === where.old;
  function start() {
    const fromFriend = friendRun(run.where);
    const next = { where: run.where, mode: fromFriend ? friend!.mode : mode };
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(next);
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ where: run.where, mode }); }
  function openSheet() { Sess.openSheet(session.current); setSheet(true); }
  function closeSheet() { Sess.closeSheet(session.current); setSheet(false); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    closeSheet();
    begin({ where: { level, seed: 0, old: false }, mode });
  }
  function playDaily() { closeSheet(); begin({ where: { level: 0, seed: today || dhakaDate(), old: false }, mode }); }
  function showDaily() { setRun({ where: { level: 0, seed: today || dhakaDate(), old: false }, mode }); }

  const { where } = run;
  const again = () => begin(run);
  const choices: Choice[] = endChoices(where, open, levels.stars, ahead).map(choice => ({
    label: choice.label,
    run: choice.kind === "again" ? again : choice.kind === "list" ? openSheet : choice.kind === "daily" ? playDaily
      : () => begin({ where: { level: choice.level, seed: 0, old: false }, mode }),
  }));

  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const { board } = boardOf(where), def = where.level && !where.old ? levelDef(where.level) : null;
  const total = totalStars(levels.stars);
  const rival = friend && friendRun(where) && friend.mode === run.mode ? friend : null;
  const needs = [1, 2].filter(colour => board.key.includes(colour));
  const playing = screen === "play" || screen === "over";

  return (
    <div className="gd-wrap" ref={wrap}>
      <div className="gd" data-slow={slow || undefined} data-screen={screen} data-world={board.world}>
        {screen === "title" && <TitleScreen where={where} mode={mode} friend={friend} stars={total} today={today} onStart={start} onMode={setMode} onLevels={openSheet} onDaily={showDaily} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {playing && (
          <>
            <div className="gd-hud">
              <div className="gd-hud-left">
                <p className="gd-badge"><b>{where.level ? `লেভেল ${bn(where.level)}` : "আজকের ধাঁধা"}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
                {needs.length > 0 && (
                  <span className="gd-keys" aria-label={`চাবি: ${bn(needs.filter(colour => mask & colour).length)}/${bn(needs.length)}`}>
                    {needs.map(colour => <i key={colour} data-colour={colour} data-held={(mask & colour) !== 0} />)}
                  </span>
                )}
              </div>
              <p className="gd-boss" data-on={def?.finale || undefined} aria-hidden={!def?.finale}>{def?.finale ? def.name : ""}</p>
              <p className="gd-clock">
                <span className="gd-clock-time"><span className="gd-sr">সময় </span><b ref={clock}>০.০</b> সে.</span>
                <small>{rival ? `${rival.name || "বন্ধু"} ${seconds(rival.tenths)}` : `★★★ ${seconds(par.three)}`}</small>
              </p>
            </div>
            <div className="gd-board" ref={boardBox} data-danger="">
              <span className="gd-progress" ref={bar} aria-hidden="true" />
              <canvas
                ref={canvas} role="application"
                aria-label={`${where.level ? `লেভেল ${bn(where.level)}` : "আজকের গোলকধাঁধা"}, ${bn(board.size)}×${bn(board.size)} ঘর। ওপরের বাঁ কোণের বাসা থেকে নিচের ডান কোণের জিলাপির দোকানে যাও। আঙুল টানো, নিচের তীর চাপো, বা কিবোর্ডের তীর চাপো।`}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerEnd} onLostPointerCapture={onPointerEnd}
              />
            </div>
            {screen === "play" ? (
              <>
                <p className="gd-note" role="status" aria-live="polite">{note}</p>
                <div className="gd-pad">
                  {PAD.map(([dir, label, turn]) => (
                    <button key={dir} type="button" className="gd-arrow" aria-label={`${label} হাঁটো`}
                      onPointerDown={event => { event.preventDefault(); if (Sess.pointerDown(session.current, -1, event.timeStamp) !== "wake") { Sess.pointerUp(session.current, -1); steerNow(dir); } }}
                      onClick={event => { if (event.detail === 0) steerNow(dir); }}
                      onContextMenu={event => event.preventDefault()}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${turn}deg)` }}><path d="M5 15l7-7 7 7" /></svg>
                    </button>
                  ))}
                </div>
              </>
            ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={toCard} />}
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={where.level} mode={mode} today={today || dhakaDate()} onMode={setMode} onPick={pickLevel} onDaily={playDaily} onClose={closeSheet} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.shared} trail={result.trail} walked={result.walked} site={site} />}
    </div>
  );
}
