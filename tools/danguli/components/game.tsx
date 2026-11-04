"use client";
// IP: what we avoided — no names, logos, characters, sounds or look from any sports brand or other tipcat app; never "গুলি" on
// its own and no gun imagery; every figure is drawn fresh from plain shapes.
// The game inside the shared player. Rules live in lib/ (round.ts and step.hot.ts play the round on a precomputed flight,
// session.ts decides the clock, the play key, the breath and the wind loop); this file feeds taps in, draws, plays sounds and
// swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, newSeed, recordLevel, shake, silenceScheduled, soundOn, totalStars, useGameLoop, useSlowMode, useSound, type LevelStars } from "../../../shared/game-kit";
import { parseShared, seedFor, type Shared } from "../lib/challenge";
import { drawField, moveView, seedRain, spawnDust, strikeJuice } from "../lib/draw.hot";
import { HITS, isFinale, levelDef, LEVEL_COUNT, MODE_INFO, nextMark, starsOf, type Mode } from "../lib/levels";
import { aimCall, bn, CALL, clearLine, hitLabel, lossLine, nearLine, restCall, versusLine } from "../lib/lines";
import { afterClear, loadProgress, playable, readMode, recommended, BESTS_KEY, INTRO_KEY, LEVELS_KEY, MODE_KEY, UNLOCK_KEY, type Bests } from "../lib/progress";
import {
  createRound, press as pressRound,
  AIM, DONE, E_CATCH, E_DONE, E_FALL, E_FLICK, E_GUST, E_LAND, E_NEXT, E_PASS, E_PEG, E_REST, E_RUN, E_STRIKE, E_WHIFF, GOLD, K_CAUGHT, K_FALL, K_POND, K_WHIFF, POP, WEAK, Z_SAND,
  type Round,
} from "../lib/round";
import { layoutFor, paintFar, paintSky, PALETTES, SAND_DARK, WATER_LIGHT, WET_LIGHT } from "../lib/scene";
import * as S from "../lib/session";
import { air, cheer, drop, flick, groan, knock, land, lose, pass, peg, tune, victory, whoosh, windLoop } from "../lib/sfx";
import { advance } from "../lib/step.hot";
import { makeView } from "../lib/view";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/** ধীরে খেলো runs the round at this speed (and shrinks the band by the same, in round.ts). */
const SLOW = 0.8;
const tokenOf = (r: Round, h: number) => r.kinds[h] === K_CAUGHT ? "c" : r.kinds[h] === K_FALL || r.kinds[h] === K_WHIFF ? "m" : String(r.dists[h]);

type Run = { seed: number; level: number; mode: Mode };
type Lost = { caught: number; fall: number; whiff: number; pond: number; sand: number; weak: number };
type Hud = { hits: string[]; total: number; hit: number };

export function DanguliGame() {
  const rootRef = useRef<HTMLDivElement>(null), fieldBox = useRef<HTMLDivElement>(null), fieldCanvas = useRef<HTMLCanvasElement>(null);
  const callRef = useRef<HTMLParagraphElement>(null), padRef = useRef<HTMLDivElement>(null), totalRef = useRef<HTMLDivElement>(null);

  const session = useRef<S.Session>(S.createSession(true));
  const round = useRef<Round>(createRound(1, 1));
  const view = useRef(makeView());
  const edge = useRef({ edge: "", phase: -1 });
  const lost = useRef<Lost>({ caught: 0, fall: 0, whiff: 0, pond: 0, sand: 0, weak: 0 });
  const gale = useRef<ReturnType<typeof windLoop> | null>(null);
  const carry = useRef(0), lastDraw = useRef(0);

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n" });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [stars, setStars] = useState<LevelStars>({});
  const [unlock, setUnlock] = useState(1);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Omit<Shared, "name"> | null>(null);
  const [hud, setHud] = useState<Hud>({ hits: ["", "", ""], total: 0, hit: 0 });
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const bests = useRef<Bests>({});
  const live = useRef({ slow, run, screen, stars, unlock, friend });
  live.current = { slow, run, screen, stars, unlock, friend };
  const def = levelDef(run.level);

  // ---- the wind loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { gale.current?.stop(); gale.current = windLoop(); },
    stop: () => { gale.current?.stop(); gale.current = null; },
  };
  const sync = () => S.syncLoops(session.current, loops);
  function away(change: () => void) { change(); sync(); }
  function back(change: () => void) { change(); S.wake(session.current); sync(); }

  const player = useGamePlayer({
    onPause: () => away(() => S.pause(session.current)),
    onResume: () => back(() => S.resume(session.current)),
    onRestart: () => {
      S.resume(session.current);
      const { screen: now, run: current } = live.current;
      if (now === "play" || now === "over") begin(again(current));
      else sync();
    },
    // সব লেভেল in the menu: the menu resumes, then the list opens (a choice screen: the round stops behind it).
    onLevels: () => openSheet(),
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now(), levelDef(live.current.run.level).wind > 0);
    setScreen(next);
    sync();
  }

  /** A tap or key on the game means this window has focus (a press on a background window brings it forward). */
  function engaged() { if (!session.current.focused && !document.hidden) back(() => S.focus(session.current)); }

  function say(text: string) {
    const call = callRef.current;
    if (!call || !text) return;
    call.textContent = text;
    call.classList.remove("dg-in"); void call.offsetWidth; call.classList.add("dg-in");
  }

  function aimLine(r: Round) {
    return aimCall(r.hit, r.def.target + 1 - r.total, r.def.target, r.winds[r.hit], r.gustAt[r.hit] >= 0 ? 1 : 0);
  }

  /** A fresh round on the play screen: the মাঠ's tune, then the first flick waits for you. */
  function begin(next: Run) {
    silenceScheduled();
    engaged();
    round.current = createRound(next.seed, next.level, next.mode, live.current.slow);
    lost.current = { caught: 0, fall: 0, whiff: 0, pond: 0, sand: 0, weak: 0 };
    const v = view.current;
    Object.assign(v, { flash: 0, shake: 0, swing: -1, mood: 0, moodTime: 0, camX: -1.6, zoom: 1, late: false });
    v.dl.fill(0);
    edge.current = { edge: "", phase: -1 };
    carry.current = 0;
    live.current.run = next;
    setRun(next); setResult(null); setSheet(false); S.closeSheet(session.current);
    setHud({ hits: ["", "", ""], total: 0, hit: 0 });
    show("play");
    say(`${levelDef(next.level).teach}`);
    tune(levelDef(next.level).world);
    rootRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The same level again: a friend's seed stays (so the comparison holds), anything else gets a fresh field. */
  function again(current: Run): Run {
    return { ...current, seed: seedFor(live.current.friend, current.level, current.mode, newSeed()) };
  }

  // ---- first load: saved progress (migrated once), a friend's link, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    const s = session.current;
    s.sound = soundOn(); s.focused = document.hasFocus(); s.visible = !document.hidden;
    view.current.calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = loadProgress(read);
    if (progress.write) { write(LEVELS_KEY, progress.write.levels); write(UNLOCK_KEY, progress.write.unlock); write(BESTS_KEY, progress.write.bests); }
    setStars(progress.stars); setUnlock(progress.unlock); bests.current = progress.bests;
    live.current.stars = progress.stars; live.current.unlock = progress.unlock;
    const chosen = readMode(read(MODE_KEY));
    setModeState(chosen);
    const readLink = (first: boolean) => {
      const link = parseShared(window.location.hash);
      // An invalid link clears the banner: the friend is gone, the game stays where it was.
      setFriend(link); live.current.friend = link;
      if (link) {
        const next = { seed: link.seed, level: link.level, mode: link.mode };
        setRun(next); live.current.run = next; setModeState(link.mode);
        if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(link);
        else if (!first) { silenceScheduled(); show("title"); }
      } else if (first) {
        const next = { seed: newSeed(), level: recommended(progress.unlock, progress.stars), mode: chosen };
        setRun(next); live.current.run = next;
      }
    };
    readLink(true);
    const onHash = () => readLink(false);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __danguli: { round: () => round.current, session: () => session.current, view: () => view.current } });
  }, []);

  // ---- the site-wide sound switch: off cuts queued notes; on starts a fresh wind (never the stub made while muted) ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { gale.current = null; silenceScheduled(); } sync(); }, [sound]);
  // ধীরে খেলো mid-round: the band follows at once, so the same real milliseconds hold for the rest of the round.
  useEffect(() => {
    const r = round.current;
    r.slow = slow;
    r.band = r.def.band * MODE_INFO[r.mode].band * (slow ? SLOW : 1);
  }, [slow]);

  // ---- away and back ----
  useEffect(() => {
    const onBlur = () => away(() => S.blur(session.current));
    const onFocus = () => back(() => S.focus(session.current));
    const onVisibility = () => { if (document.hidden) away(() => S.hide(session.current)); else back(() => S.show(session.current)); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- sounds, juice, calls and the HUD from the round's events ----
  function handleEvents() {
    const r = round.current, v = view.current, short = r.def.rival.short;
    let call = "", hudChanged = false;
    for (let e = 0; e < r.evN; e++) {
      const type = r.evType[e], a = r.evA[e], b = r.evB[e];
      if (type === E_FLICK) { flick(); v.mood = 1; call = CALL.flick; }
      else if (type === E_STRIKE) {
        knock(a, Math.min(1, r.speed / 28.5));
        strikeJuice(v, r);
        call = a === GOLD ? CALL.gold : a === WEAK ? CALL.weak : b ? CALL.loft : CALL.drive;
        if (a === WEAK) lost.current.weak++;
      } else if (type === E_WHIFF) { air(); v.swing = 0; call = a === 0 ? CALL.early : CALL.reach; }
      else if (type === E_FALL) { drop(); }
      else if (type === E_LAND) { land(a); spawnDust(v, b, a === 3 ? WATER_LIGHT : a === 1 ? SAND_DARK : a === 2 ? WET_LIGHT : PALETTES[r.def.world].dust); }
      else if (type === E_CATCH) { groan(); v.mood = 3; v.moodTime = 1.8; shake(totalRef.current); }
      else if (type === E_PEG) peg(a);
      else if (type === E_GUST) { whoosh(); call = CALL.gust; }
      else if (type === E_REST) {
        const catcher = r.catcher >= 0 ? (r.catcher === r.cap ? short : r.catcher === r.longArm ? short : "ফিল্ডার") : "";
        call = restCall(a, b, r.zones[r.hit], short, catcher);
        const l = lost.current;
        if (a === K_CAUGHT) l.caught++; else if (a === K_FALL) l.fall++; else if (a === K_WHIFF) l.whiff++; else if (a === K_POND) l.pond++; else if (r.zones[r.hit] === Z_SAND) l.sand++;
        if (a === K_FALL || a === K_WHIFF) { v.mood = 3; v.moodTime = 1.4; }
        else if (b >= 25) { v.mood = 2; v.moodTime = 1.6; if (b >= 32) cheer(); }
        hudChanged = true;
      } else if (type === E_PASS) { pass(); call = `${call} ${CALL.pass}`; }
      else if (type === E_RUN) call = `${call} ${short} দৌড়াচ্ছে সেখানে।`;
      else if (type === E_NEXT) { v.swing = -1; call = aimLine(r); hudChanged = true; }
      else if (type === E_DONE) { r.evN = 0; finish(); return; }
    }
    r.evN = 0;
    if (call) say(call);
    if (hudChanged) setHud({ hits: [0, 1, 2].map(h => r.kinds[h] < 0 ? "" : tokenOf(r, h)), total: r.total, hit: r.hit });
  }

  // ---- one step: the session decides, the round moves, events become sounds ----
  function step() {
    const s = session.current, r = round.current;
    if (!S.step(s) || r.phase === DONE) return;
    carry.current += live.current.slow ? SLOW : 1;
    while (carry.current >= 1) {
      carry.current -= 1;
      advance(r);
      if (r.evN) handleEvents();
      if (round.current !== r || r.phase === DONE) return;
    }
    gale.current?.set(Math.min(1, Math.abs(r.winds[r.hit]) / 7));
    sync();
  }

  function finish() {
    const r = round.current, current = live.current.run, d = r.def, info = MODE_INFO[current.mode];
    const f = live.current.friend, rival = f && f.level === current.level && f.seed === current.seed && f.mode === current.mode ? f : null;
    const hits = [0, 1, 2].map(h => tokenOf(r, h));
    let gold = 0, longest = 0, lofts = 0, drives = 0, swings = 0, caught = 0, pond = 0;
    for (let h = 0; h < HITS; h++) {
      if (r.grades[h] >= 0) { swings++; if (r.grades[h] === GOLD) gold++; if (r.lofts[h]) lofts++; else drives++; }
      longest = Math.max(longest, r.dists[h]);
      if (r.kinds[h] === K_CAUGHT) caught++;
      if (r.kinds[h] === K_POND) pond++;
    }
    const best = bests.current[current.level] ?? -1;
    if (r.total > best) { bests.current = { ...bests.current, [current.level]: r.total }; write(BESTS_KEY, JSON.stringify(bests.current)); }
    const record = best >= 0 && r.total > best ? `এই ফোনে এই লেভেলের নতুন সেরা: ${bn(r.total)} ডাং।` : best >= 0 ? `এই ফোনে এই লেভেলের সেরা ${bn(Math.max(best, r.total))} ডাং।` : "";
    const base = { total: r.total, target: d.target, short: d.rival.short, hits, maxStars: info.maxStars, gold, swings: Math.max(swings, 1), longest, lofts, drives, caught, pond, move: d.move, faced: r.faced, beat: r.beat, record };
    const earned = starsOf(r.total, current.level, current.mode);
    if (earned > 0) {
      const next = recordLevel(live.current.stars, current.level, earned);
      live.current.stars = next; setStars(next); write(LEVELS_KEY, JSON.stringify(next));
      const opened = afterClear(live.current.unlock, current.level);
      if (opened !== live.current.unlock) { live.current.unlock = opened; setUnlock(opened); write(UNLOCK_KEY, String(opened)); }
      const mark = nextMark(r.total, current.level, current.mode);
      const near = mark ? nearLine(mark - r.total, earned + 1) : earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : "";
      setResult({ ...base, won: true, kicker: `লেভেল ${bn(current.level)} পার · ${d.rival.name}`, title: "", stars: earned,
        line: rival ? versusLine(r.total, rival.total, rival.name) : clearLine(current.level), near });
      setLast({ level: current.level, seed: current.seed, total: r.total, hits, mode: current.mode, old: 0 });
      show("over");
      victory(d.world, earned);
      if (earned === 3 || isFinale(d)) confetti({ colors: ["#ffd166", "#b4372a", "#f4ead0", d.rival.shirt, PALETTES[d.world].grass] });
    } else {
      setResult({ ...base, won: false, kicker: `লেভেল ${bn(current.level)} · ${d.rival.name}`, title: `${d.rival.short} জিতল, ${bn(d.target)} বনাম ${bn(r.total)}`, stars: 0,
        line: lossLine(d.target + 1 - r.total, lost.current),
        near: rival ? `${rival.name || "বন্ধু"} এই মাঠে ${bn(rival.total)} ডাং মেরেছিল।` : "" });
      setLast(null);
      show("over");
      lose();
    }
  }

  /** Preview images only (`&og=1` on a link): the friend's result as a finished end screen with its card. Saves nothing. */
  function demo(found: Shared) {
    const d = levelDef(found.level);
    const value = (hit: string) => /\d/.test(hit) ? Number(hit) : 0;
    setResult({ won: true, kicker: `লেভেল ${bn(found.level)} পার · ${d.rival.name}`, title: "", total: found.total, target: d.target, short: d.rival.short, hits: found.hits,
      stars: found.old ? 0 : starsOf(found.total, found.level, found.mode), maxStars: 3, gold: 0, swings: 3, longest: Math.max(...found.hits.map(value)),
      lofts: 0, drives: 0, caught: found.hits.filter(hit => hit === "c").length, pond: 0, move: "", faced: 0, beat: 0, line: clearLine(found.level), near: "", record: "" });
    setLast({ level: found.level, seed: found.seed, total: found.total, hits: found.hits, mode: found.mode, old: found.old });
    S.goTo(session.current, "over"); setScreen("over");
  }

  // ---- drawing ----
  function draw() {
    const v = view.current, r = round.current, s = session.current;
    if (!v.context) return;
    const now = performance.now() / 1000, dt = lastDraw.current ? Math.min(0.05, Math.max(0, now - lastDraw.current)) : 0;
    lastDraw.current = now;
    v.calm = live.current.slow || matchMedia("(prefers-reduced-motion: reduce)").matches;
    moveView(v, r, S.ticking(s) ? dt * (live.current.slow ? SLOW : 1) : 0);
    drawField(v, r);
    updateEdges(r);
  }

  /** The edges and the pad, written straight to the DOM only when a value changes. */
  function updateEdges(r: Round) {
    const e = edge.current, root = rootRef.current, playing = session.current.screen === "play";
    const need = r.def.target + 1 - r.total;
    const next = !playing ? "" : view.current.late ? "late" : r.hit === HITS - 1 && need > 0 && (r.phase === AIM || r.phase === POP) ? "danger" : "";
    if (next !== e.edge && root) { e.edge = next; root.dataset.edge = next; }
    if (r.phase !== e.phase && padRef.current) { e.phase = r.phase; padRef.current.dataset.phase = String(r.phase); }
  }

  const looping = screen === "play" && !player.paused;
  useGameLoop(step, draw, looping);

  // ---- size the field to its box; pre-render the মাঠ's layers ----
  const fieldShown = screen === "play" || screen === "over";
  useEffect(() => {
    if (!fieldShown) return;
    const box = fieldBox.current, target = fieldCanvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      const v = view.current, ratio = Math.min(2, window.devicePixelRatio || 1), layout = layoutFor(width, height);
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      v.context = fitCanvas(target, width, height);
      Object.assign(v, { width, height, ratio, ground: layout.ground, unit: layout.unit, world: def.world });
      v.sky = paintSky(def.world, width, layout.ground, ratio, v.sky);
      const far = paintFar(def.world, width, layout.ground, ratio, v.far);
      v.far = far.canvas; v.farWidth = far.width;
      seedRain(v);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    void document.fonts?.ready.then(size);
    return () => observer.disconnect();
  }, [fieldShown, run.level]);

  // ---- taps ----
  /** One tap on the round (a finger, the mouse, or a fresh key press). The sound and the swing answer in this same event. */
  function tap() {
    if (!S.canTap(session.current)) return;
    if (pressRound(round.current)) handleEvents();
  }
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || !event.isPrimary || session.current.screen !== "play") return;
    // A press that brings the window back only wakes the round: it is never a flick or a strike.
    if (!session.current.focused) { engaged(); return; }
    event.preventDefault();
    tap();
  }

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(MODE_KEY, next); setRun(current => ({ ...current, mode: next })); }
  function start() {
    const f = live.current.friend, fromFriend = f && f.level === run.level && f.seed === run.seed;
    if (!read(INTRO_KEY) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode });
  }
  function storyDone() { write(INTRO_KEY, "1"); begin({ ...run, mode }); }
  function openSheet() { away(() => S.openSheet(session.current)); setSheet(true); }
  function closeSheet() { setSheet(false); back(() => S.closeSheet(session.current)); }
  /** A level from the list. The friend's own level keeps the friend's field, so "একই মাঠ" stays true. */
  function pickLevel(level: number) {
    const f = live.current.friend;
    if (!playable(level, live.current.unlock, live.current.stars, f?.level)) return;
    S.closeSheet(session.current);
    begin({ seed: seedFor(f, level, mode, newSeed()), level, mode });
  }

  const won = result?.won ?? false;
  const nextLevel = run.level < LEVEL_COUNT && playable(run.level + 1, unlock, stars, friend?.level) ? run.level + 1 : 0;
  const choices: Choice[] = [
    ...(won && nextLevel ? [{ label: "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode }) }] : []),
    { label: "আবার খেলো", run: () => begin(again(run)) },
    { label: "সব লেভেল", run: openSheet },
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key, lower = key.toLowerCase();
      const playKey = key === " " || key === "Enter" || key === "ArrowUp";
      if (s.paused || s.sheet) return;
      if (lower === "p" && s.screen === "play") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ") && !event.repeat) { event.preventDefault(); start(); return; }
      if (s.screen === "play") {
        if (!playKey) return;
        event.preventDefault();
        if (S.keyDown(s, event.repeat)) tap();
        return;
      }
      if (s.screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => { if (event.key === " " || event.key === "Enter" || event.key === "ArrowUp") S.keyUp(session.current); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  const total = totalStars(stars), suggest = recommended(unlock, stars);
  const need = def.target + 1 - hud.total;
  return (
    <div className="dg-wrap">
      <div className="dg" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={def.world} data-edge="">
        {screen === "title" && <TitleScreen level={run.level} mode={mode} friend={friend} stars={total} onStart={start} onMode={setMode} onLevels={openSheet} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {fieldShown && (
          <>
            <div className="dg-hud">
              <p className="dg-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}{isFinale(def) && <em>{def.move}</em>}</p>
              <ol className="dg-hits" aria-label="তিন মার">
                {hud.hits.map((token, index) => (
                  <li key={index} data-now={screen === "play" && index === hud.hit && !token} data-done={Boolean(token)}>
                    <span>{["১ম", "২য়", "৩য়"][index]}</span><b>{token ? hitLabel(token) : "—"}</b>
                  </li>
                ))}
              </ol>
              <div className="dg-total" ref={totalRef} data-passed={need <= 0 || undefined} aria-label={`মোট ${bn(hud.total)} ডাং, ${def.rival.short} ${bn(def.target)}`}>
                <b>{bn(hud.total)}</b><span>/ {bn(def.target)}</span>
              </div>
            </div>
            <div className="dg-board" onPointerDown={onDown} onContextMenu={event => event.preventDefault()}>
              <div className="dg-field" ref={fieldBox}>
                <canvas ref={fieldCanvas} role="img" aria-label={`ডাংগুলির মাঠ: ${def.rival.name} মেরেছে ${bn(def.target)} ডাং। তিন মারে এর বেশি মারো।`} />
              </div>
              {screen === "play" ? (
                <>
                  <p className="dg-call" ref={callRef} role="status" aria-live="polite" />
                  <div className="dg-pad" ref={padRef} data-phase="0" aria-hidden="true">
                    <span className="dg-pad-aim"><Tap />চাপো: কাঠি তোলো</span>
                    <span className="dg-pad-pop"><i className="dg-pad-band"><em>উঁচু</em><em>নিচু</em></i>নামার সময় হলুদে চাপো</span>
                    <span className="dg-pad-fly">দেখো, কদ্দূর যায়…</span>
                    <span className="dg-pad-rest"><Tap />চাপো: পরের মার</span>
                  </div>
                </>
              ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={result.won && last ? toCard : null} />}
            </div>
          </>
        )}
        {sheet && <LevelSheet stars={stars} unlock={unlock} friendLevel={friend?.level ?? 0} current={run.level} next={suggest} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {last && screen === "over" && <ResultCard key={`${last.level}-${last.seed}-${last.total}`} shared={last} site={site} />}
    </div>
  );
}

const Tap = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="9" opacity=".45" /></svg>;
