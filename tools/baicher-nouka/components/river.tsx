"use client";
// IP: what we avoided — no famous racing or rhythm game's name, cars, tracks, notes, approach circles' look or music, and no real নৌকাবাইচ:
// no race name, team, boat name, sponsor, venue or region. Our own boats, rivers, crowds and rope flags are drawn from scratch, the drum
// is synthesized, and the rules and numbers are ours.
// The game inside the shared player. Rules live in lib/ (rowing.ts and step.hot.ts run the race, session.ts decides what counts and which
// loop plays); this file feeds taps in, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, newSeed, readLevels, sfx, shake, silenceScheduled, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { CALIB_BEATS, CALIB_END, createCalib, lagFrom, MAX_LAG, MIN_LAG, nextPulse } from "../lib/calib";
import { VMAX, clamp } from "../lib/course";
import { absorb, drawFrame, F_GUST, F_GUST_WARN, F_NARROW, F_SHOVED, F_SNAG, F_SURGE, F_SURGE_WARN, readHud } from "../lib/draw.hot";
import {
  isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, readTimes, SLUG, starsForRank, timeKey, WORLDS, type Mode,
} from "../lib/levels";
import { bn, clearLine, compareLine, humanLine, lossLine, nearMiss, openingLevel, ordinal, parseShareHash, secs, type Shared } from "../lib/link";
import {
  drawPad, W_BIG, W_EARLY, W_GO, W_GOOD, W_LATE, W_ONE, W_PERFECT, W_THREE, W_TAP, W_TWO, W_NONE, W_RHYTHM,
} from "../lib/pad.hot";
import { HIT, LEAD, OFF, SLOW_TIME, createRace, pending, steer, tapBeat, type Race } from "../lib/rowing";
import * as S from "../lib/session";
import { drum, fumble, gustWarn, haul, horn, knock, lastPlace, narrowWarn, placed, rhythm, rush, snag, starChime, surgeWarn, swish } from "../lib/sound";
import { stepRace } from "../lib/step.hot";
import { buildLayers, buildPad, makeFx, makeHud, makePadLook, resetFx, type Fx, type Layers, type PadArt } from "../lib/view";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard, type Last } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

/** A drum stroke is handed to the audio clock this far ahead, so it sounds right on the beat the ring shows. */
const LOOKAHEAD = 0.09;
/** How long the other boats keep rowing in after you finish. */
const SETTLE = 2.6;

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, times: `ektukhani-times-${SLUG}`, mode: `ektukhani-mode-${SLUG}`,
  intro: `ektukhani-intro-${SLUG}`, lag: "ektukhani-baicher-nouka-lag",
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: it just isn't remembered */ } };
const readLag = () => { const saved = Number(read(KEYS.lag)); return Number.isFinite(saved) ? clamp(saved, MIN_LAG, MAX_LAG) : 0; };

type Run = { seed: number; level: number; mode: Mode; old: boolean };
const COUNT_WORD = [W_NONE, W_THREE, W_TWO, W_ONE] as const;

/** A tap's own time, on the same clock as performance.now(), so judging never depends on when the frame ran. */
function stampOf(event: { timeStamp: number }) {
  const now = performance.now(), stamp = event.timeStamp;
  return stamp > 0 && Math.abs(now - stamp) < 1000 ? stamp : now;
}

export function RiverGame() {
  const wrapRef = useRef<HTMLDivElement>(null), rootRef = useRef<HTMLDivElement>(null);
  const riverBox = useRef<HTMLDivElement>(null), riverCanvas = useRef<HTMLCanvasElement>(null);
  const padBox = useRef<HTMLButtonElement>(null), padCanvas = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null), placeRef = useRef<HTMLSpanElement>(null), streakRef = useRef<HTMLParagraphElement>(null);
  const dotRefs = useRef<Array<HTMLElement | null>>([]);

  const session = useRef<S.Session>(S.createSession(true));
  const race = useRef<Race>(null as unknown as Race);
  if (!race.current) race.current = createRace(1, 1);
  const fx = useRef<Fx>(makeFx());
  const hud = useRef(makeHud());
  const look = useRef(makePadLook());
  const calib = useRef(createCalib());
  const loop = useRef<ReturnType<typeof rush> | null>(null);
  const view = useRef({
    layers: null as Layers | null, ctx: null as CanvasRenderingContext2D | null, pad: null as PadArt | null, padCtx: null as CanvasRenderingContext2D | null,
    stepAt: 0, keyAt: -1e9, drumNext: 0, cin: 0, calibNext: 0, settle: 0,
    padHitAt: -9, padKind: 0, padWord: W_NONE, shookAt: 0,
    shown: { tenths: -1, place: 0, streak: -1, edge: "x", along0: -1, along1: -1, along2: -1, along3: -1 },
    reduced: false,
  });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n", old: false });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Last | null>(null);
  const [settling, setSettling] = useState(false);
  const [lag, setLag] = useState(0);
  const [note, setNote] = useState("");
  const [calibTaps, setCalibTaps] = useState(0);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const levelsRef = useRef(levels);
  levelsRef.current = levels;
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, run, screen, lag, friend, mode });
  live.current = { slow, run, screen, lag, friend, mode };
  const def = levelDef(run.level, run.old);
  const world = run.old ? 0 : def.world;

  // ---- the river's rush: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { loop.current?.stop(); loop.current = rush(); },
    stop: () => { loop.current?.stop(); loop.current = null; },
  };
  const sync = () => {
    const s = session.current;
    S.syncLoops(s, loops);
    if (S.takeCalibLost(s)) cancelCalib();
  };

  /** Back from the menu: the drum strokes already handed to the audio clock were cut, so schedule from the beat that is still to come. */
  function rewindDrum() {
    const r = race.current, v = view.current;
    let index = 0;
    while (index < r.beats.length && r.beats[index] <= r.t) index++;
    v.drumNext = index;
    v.calibNext = CALIB_BEATS.findIndex(at => at > calib.current.t);
    if (v.calibNext < 0) v.calibNext = CALIB_BEATS.length;
  }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current); rewindDrum(); sync(); },
    onRestart: () => {
      S.resume(session.current);
      setSheet(false);
      const { screen: now, run: current } = live.current;
      if (now === "play" || now === "over") begin(again(current));
      else if (now === "calib") cancelCalib(true);
      else sync();
    },
    onLevels: () => openSheet(),
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  /** A fresh race on the play screen: the count-in (৩-২-১ on the rim), then the horn. */
  function begin(next: Run) {
    silenceScheduled();
    const scale = live.current.slow ? SLOW_TIME : 1;
    race.current = createRace(next.seed, next.level, next.mode, next.old, live.current.lag, scale);
    resetFx(fx.current, race.current.eventCount);
    const v = view.current;
    Object.assign(v, { drumNext: 0, cin: 0, settle: 0, padHitAt: -9, padKind: 0, padWord: W_NONE });
    Object.assign(v.shown, { tenths: -1, place: 0, streak: -1, edge: "x", along0: -1, along1: -1, along2: -1, along3: -1 });
    S.closeSheet(session.current);
    setRun(next); setResult(null); setSheet(false); setSettling(false); setNote("");
    show("play");
    S.setRacing(session.current, true);
    sync();
    wrapRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The same race again: a friend's seed stays (so the comparison holds), anything else gets a fresh river. */
  function again(current: Run): Run {
    const rival = friend && friend.level === current.level && friend.seed === current.seed && friend.old === current.old && (friend.old || friend.mode === current.mode);
    return { ...current, seed: rival ? current.seed : newSeed() };
  }
  const friendRun = (link: Shared, chosen: Mode): Run => ({ seed: link.seed, level: link.level, mode: link.old ? chosen : link.mode, old: link.old });

  /** Preview images only (`&og=1` on a link): the friend's result as a finished end screen with its card. Saves nothing on the phone. */
  function demo(found: Shared) {
    const d = levelDef(found.level, found.old), earned = starsForRank(found.rank, found.mode);
    setResult({
      placed: earned > 0, rank: found.rank, tenths: found.tenths, stars: earned, maxStars: MODE_INFO[found.mode].maxStars, beats: 0, hits: 0, perfect: 0, bestStreak: 0, patchHits: 0,
      boss: "", bossBeaten: false, near: "", record: "",
      kicker: found.old ? "বন্ধুর পুরোনো বাইচ" : `${WORLDS[d.world].name} · বাইচ ${bn(found.level)}: ${d.name}`,
      line: found.rank === 1 ? clearLine(found.level, found.old) : humanLine(found.rank),
    });
    setLast({ seed: found.seed, tenths: found.tenths, rank: found.rank, level: found.level, mode: found.mode, old: found.old });
    S.goTo(session.current, "over", performance.now());
    setScreen("over");
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    session.current.sound = soundOn();
    view.current.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLag(readLag());
    const saved = readLevels(read(KEYS.levels), LEVEL_COUNT), savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    setModeState(chosen);
    const link = parseShareHash(window.location.hash);
    setFriend(link);
    if (link) {
      if (!link.old) setModeState(link.mode);
      const first = friendRun(link, chosen);
      setRun(first);
      race.current = createRace(first.seed, first.level, first.mode, first.old);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(link);
    } else setRun({ seed: newSeed(), level: openingLevel(saved, openLevel(saved, savedAhead)), mode: chosen, old: false });
    // A friend's link opened on a page that is already here (only the hash changes). Mid-race it is only remembered: their river is owed to the next start.
    const onHash = () => {
      const found = parseShareHash(window.location.hash);
      if (!found) return;
      setFriend(found);
      if (!S.linkArrives(session.current)) return;
      silenceScheduled();
      const next = friendRun(found, live.current.mode);
      if (!found.old) setModeState(found.mode);
      setRun(next); setResult(null); setSheet(false); setNote("");
      race.current = createRace(next.seed, next.level, next.mode, next.old);
      show("title");
    };
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the race; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __baich: { race: () => race.current, session: () => session.current, hud: () => hud.current, fx: () => fx.current, calib: () => calib.current, run: () => live.current.run, loopOn: () => loop.current !== null, unlock: (count: number) => { for (let at = 1; at <= count; at++) levelsRef.current.record(at, 3); }, advance: (seconds: number) => { for (let at = 0; at < seconds * 60; at++) stepRef.current(1 / 60); drawRef.current(); }, drumNext: () => view.current.drumNext, layers: () => view.current.layers } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  // Off also cuts drum strokes and chimes already queued; on starts a fresh rush (never the silent stub made while muted).
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { loop.current = null; silenceScheduled(); } sync(); }, [sound]);
  useEffect(() => { fx.current.slow = slow || view.current.reduced; }, [slow]);

  // ---- away and back: the player pauses; the page's own session stops with it ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); sync(); };
    const onVisibility = () => { if (document.hidden) S.hide(session.current); else S.show(session.current); sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- one step: the race, the drum, the sounds ----
  function scheduleDrum(r: Race) {
    const v = view.current;
    while (v.drumNext < r.beats.length) {
      const index = v.drumNext, delay = (r.beats[index] - r.t) / r.scale;
      if (delay > LOOKAHEAD) break;
      // A stroke whose moment has passed is dropped, never fired late in a burst.
      if (delay >= -0.03) {
        drum(r.accents[index] ? "big" : index % 2 === 0 ? "strong" : "weak", Math.max(0, delay));
        // Two beats before the drum quickens, a quick double tap on the rim says it is coming.
        if (r.def.quicken && !r.old && index === r.def.quicken[0] - 2) { const at = Math.max(0, delay) + (r.def.gap / 2) / r.scale; drum("count", at); drum("count", at + 0.09); }
      }
      v.drumNext++;
    }
  }

  function step(dt: number) {
    const s = session.current, v = view.current, f = fx.current;
    if (s.screen === "over") {
      if (v.settle > 0 && !s.paused && !s.sheet && s.focused && s.visible) {
        stepRace(race.current, dt); f.clock += dt; v.settle -= dt;
        if (v.settle <= 0) setSettling(false);
      }
      return;
    }
    if (s.screen === "calib") { stepCalib(dt); return; }
    if (!S.ticking(s) || s.screen !== "play" || S.breathing(s, dt)) return;
    const r = race.current;
    r.scale = live.current.slow ? SLOW_TIME : 1; r.lag = live.current.lag;
    stepRace(r, dt);
    v.stepAt = performance.now();
    f.clock += dt;
    // The count-in: three taps on the rim, then the horn.
    const cin = r.old ? 4 : r.t < 0 ? 1 + Math.floor((r.t + LEAD) / 0.6) : 4;
    if (cin > v.cin) { v.cin = cin; if (cin <= 3) drum("count"); else horn(); }
    if (r.t >= 0) scheduleDrum(r);
    const flags = absorb(f, r);
    if (flags & F_SNAG) snag();
    if (flags & F_GUST_WARN) gustWarn();
    if (flags & F_GUST) sfx.whoosh();
    if (flags & F_NARROW) narrowWarn();
    if (flags & F_SURGE_WARN) surgeWarn();
    if (flags & F_SURGE) drum("big");
    if (flags & F_SHOVED) knock();
    loop.current?.set(Math.min(1, r.boats[0].speed / VMAX));
    sync();
    if (r.over) finish();
  }

  function finish() {
    const r = race.current, { run: current } = live.current, v = view.current;
    const { level, mode: played, old, seed } = current, d = levelDef(level, old);
    const rank = r.rank, earned = starsForRank(rank, played), won = earned > 0, info = MODE_INFO[played];
    // How far behind the boat one place ahead, for the near-miss line.
    const mine = r.boats[0].done;
    let behind = 0, nearest = -1;
    for (let index = 1; index < r.boats.length; index++) { const done = r.boats[index].done; if (done >= 0 && done < mine && done > nearest) nearest = done; }
    if (nearest >= 0) behind = Math.max(1, Math.round((mine - nearest) * 10));
    const times = readTimes(read(KEYS.times)), key = timeKey(level, played), previous = old ? null : times[key] ?? null;
    let record = "";
    if (!old) {
      if (won) {
        const nextList = nextAhead(levels.stars, ahead, level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        levels.record(level, earned);
      }
      if (won && (previous === null || r.tenths < previous)) { times[key] = r.tenths; write(KEYS.times, JSON.stringify(times)); }
      record = !won ? "" : previous === null ? `এই ফোনে বাইচ ${bn(level)}-এর প্রথম সময়।` : r.tenths < previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${secs(previous)} সেকেন্ড।` : `এই ফোনে সেরা: ${secs(previous)} সেকেন্ড`;
    }
    const rival = friend && friend.level === level && friend.seed === seed && friend.old === old && (old || friend.mode === played) ? friend : null;
    const beats = r.marks.reduce((sum, mark) => sum + (mark !== 0 ? 1 : 0), 0);
    const boss = d.boss, bossBeaten = r.boss >= 0 ? r.boats[r.boss].done < 0 || r.boats[r.boss].done > mine : false;
    const gap = nearMiss(rank, behind, r.tenths, previous);
    const near = gap || (won && earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : "");
    setResult({
      placed: won, rank, tenths: r.tenths, stars: earned, maxStars: info.maxStars, beats, hits: r.hits, perfect: r.perfect, bestStreak: r.bestStreak, patchHits: r.patchHits,
      boss, bossBeaten, near, record,
      kicker: old ? "বন্ধুর পুরোনো বাইচ" : `${WORLDS[d.world].name} · বাইচ ${bn(level)}: ${d.name}`,
      line: rival ? compareLine(r.tenths, rival.tenths, rival.name) : won ? (rank === 1 ? clearLine(level, old) : rank === 2 ? "প্রথম হতে একটুর জন্য বাদ।" : "মাঝনদীতে লড়াই জমেছিল।")
        : lossLine({ beats, hits: r.hits, offbeats: r.offbeats, patchHits: r.patchHits, boss }),
    });
    setLast({ seed, tenths: r.tenths, rank, level, mode: played, old });
    v.settle = SETTLE; setSettling(true);
    show("over");
    S.setRacing(session.current, false);
    sync();
    horn(0, true);
    if (won) {
      placed(world, rank);
      for (let star = 0; star < earned; star++) starChime(star, 1.0 + star * 0.28);
      if (rank === 1 || (previous !== null && r.tenths < previous) || level === LEVEL_COUNT) confetti({ colors: ["#2a62c4", "#f2c230", "#e04a2f", "#ffffff"] });
    } else {
      lastPlace();
      sfx.lose();
    }
  }

  // ---- তাল মেলাও ----
  function startCalib() {
    sfx.tap();
    silenceScheduled();
    calib.current = createCalib();
    race.current = createRace(1, 1, "n", false, 0, 1);
    resetFx(fx.current, race.current.eventCount);
    view.current.calibNext = 0; view.current.padHitAt = -9; view.current.padKind = 0;
    setCalibTaps(0); setNote("");
    show("calib");
  }
  function stepCalib(dt: number) {
    const s = session.current, c = calib.current, v = view.current;
    if (!S.ticking(s) || S.breathing(s, dt)) return;
    c.t += dt;
    fx.current.clock += dt;
    while (v.calibNext < CALIB_BEATS.length && CALIB_BEATS[v.calibNext] - c.t < LOOKAHEAD) {
      const delay = CALIB_BEATS[v.calibNext] - c.t;
      if (delay >= -0.03) drum("strong", Math.max(0, delay));
      v.calibNext++;
    }
    if (c.t > CALIB_END) endCalib();
  }
  function calibStroke(stamp: number) {
    const s = session.current, v = view.current;
    if (!S.canTap(s)) return;
    const c = calib.current;
    c.taps.push(c.t + clamp((stamp - v.stepAt) / 1000, 0, 0.05));
    v.padHitAt = performance.now(); v.padKind = 1; v.padWord = W_GOOD;
    setCalibTaps(c.taps.length);
    sfx.tap();
  }
  /** Back at the title after তাল মেলাও: a friend's link that arrived meanwhile shows now, with their race. */
  function settleOwed() {
    const link = live.current.friend;
    if (!S.takeOwed(session.current) || !link) return;
    const next = friendRun(link, live.current.mode);
    if (!link.old) setModeState(link.mode);
    setRun(next);
    race.current = createRace(next.seed, next.level, next.mode, next.old);
  }
  function endCalib() {
    const measured = lagFrom(calib.current.taps);
    if (measured === null) setNote("ঠিকমতো ধরা গেল না। আরেকবার চেষ্টা করো, রিং ঢোলে মিললেই চাপ দিয়ো।");
    else {
      setLag(measured);
      write(KEYS.lag, String(measured));
      setNote(measured > 0.03 ? "তাল মিলেছে। তোমার ফোন চাপ একটু দেরিতে ধরে, এখন থেকে সেটা মিলিয়ে নেব।" : measured < -0.03 ? "তাল মিলেছে। তুমি একটু আগেভাগে চাপো, সেটাও মিলিয়ে নেব।" : "তাল মিলেছে। তোমার ফোন ঠিক সময়েই চাপ ধরে।");
    }
    settleOwed();
    show("title");
  }
  /** Leaving the window before the eighth pulse voids the pulses (or বাদ দাও): back to the title, saying so. */
  function cancelCalib(silent = false) {
    silenceScheduled();
    setNote(silent ? "" : "তাল মেলানো মাঝপথে থেমে গিয়েছিল। আরেকবার চেষ্টা করো।");
    settleOwed();
    show("title");
  }

  // ---- drawing ----
  function draw() {
    const v = view.current, r = race.current, f = fx.current, s = session.current, h = hud.current, lk = look.current;
    const L = v.layers;
    if (L && v.ctx && s.screen !== "title" && s.screen !== "intro") drawFrame(v.ctx, L, r, f, s.screen !== "calib");

    readHud(r, h);
    const shown = v.shown, playing = s.screen === "play" || s.screen === "over";
    if (playing) {
      if (h.tenths !== shown.tenths && clockRef.current) { shown.tenths = h.tenths; clockRef.current.textContent = secs(h.tenths); }
      if (h.place !== shown.place && placeRef.current) { shown.place = h.place; placeRef.current.textContent = ordinal(h.place); placeRef.current.dataset.first = h.place === 1 ? "1" : ""; }
      if (h.streak !== shown.streak && streakRef.current) {
        shown.streak = h.streak;
        streakRef.current.textContent = h.streak >= 2 ? `ছন্দ ×${bn(h.streak)}` : "";
        streakRef.current.dataset.on = h.streak >= 4 ? "pop" : h.streak >= 2 ? "on" : "";
      }
      if (h.along[0] !== shown.along0 || h.along[1] !== shown.along1 || h.along[2] !== shown.along2 || h.along[3] !== shown.along3) {
        shown.along0 = h.along[0]; shown.along1 = h.along[1]; shown.along2 = h.along[2]; shown.along3 = h.along[3];
        for (let index = 0; index < 4; index++) { const dot = dotRefs.current[index]; if (dot) dot.style.transform = `translateX(${h.along[index] / 2}cqw)`; }
      }
    }
    const edge = s.screen === "play" ? h.edge : "";
    if (edge !== shown.edge && riverBox.current) { shown.edge = edge; riverBox.current.dataset.edge = edge; }

    const art = v.pad, pc = v.padCtx;
    if (art && pc) {
      const now = performance.now();
      lk.calm = f.slow;
      lk.delta = Infinity; lk.accent = false; lk.window = r.window;
      lk.bump = Math.max(0, 1 - (f.clock - f.beatAt) / 0.18);
      lk.hit = Math.max(0, 1 - (now - v.padHitAt) / 350); lk.hitKind = lk.hit > 0 ? v.padKind : 0;
      let word = W_NONE;
      if (s.screen === "calib") {
        lk.delta = nextPulse(calib.current, 0.25); lk.window = 0.25;
        word = lk.hit > 0 ? v.padWord : W_TAP;
      } else if (s.screen === "play") {
        if (r.t < 0 && !r.old) word = COUNT_WORD[h.count];
        else if (!r.over) {
          const index = pending(r);
          if (index >= 0) { lk.delta = (r.beats[index] - r.t) / r.scale; lk.accent = r.accents[index] === 1; }
          word = lk.hit > 0 ? v.padWord : r.t < 1.6 ? W_GO : r.hits === 0 ? W_TAP : r.streak >= 4 ? W_RHYTHM : W_NONE;
        }
      }
      lk.word = word;
      drawPad(pc, art, lk);
    }
  }

  const stepRef = useRef(step), drawRef = useRef(draw);
  stepRef.current = step; drawRef.current = draw;
  const running = (screen === "play" || screen === "calib" || (screen === "over" && settling)) && !player.paused && !sheet;
  useGameLoop(step, draw, running);

  // ---- size the river and the pad to their boxes; pre-render the world's sprites ----
  const boardShown = screen === "play" || screen === "calib" || screen === "over";
  const night = !run.old && def.dark;
  useEffect(() => {
    if (!boardShown) return;
    const box = riverBox.current, target = riverCanvas.current, pad = padBox.current, padTarget = padCanvas.current;
    if (!box || !target) return;
    const ratio = () => Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      view.current.ctx = fitCanvas(target, width, height);
      view.current.layers = buildLayers(width, height, ratio(), world, night);
      if (pad && padTarget) {
        const pw = Math.floor(pad.clientWidth), ph = Math.floor(pad.clientHeight);
        if (pw > 40 && ph > 40) {
          padTarget.style.width = `${pw}px`; padTarget.style.height = `${ph}px`;
          view.current.padCtx = fitCanvas(padTarget, pw, ph);
          view.current.pad = buildPad(pw, ph, ratio());
        }
      }
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    if (pad) observer.observe(pad);
    void document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, [boardShown, screen === "over", world, night]);

  // ---- taps ----
  function stroke(stamp: number) {
    const s = session.current, v = view.current;
    if (s.screen === "calib") { calibStroke(stamp); return; }
    if (s.screen !== "play" || !S.canTap(s)) return;
    const r = race.current, calm = live.current.slow || v.reduced;
    const rating = tapBeat(r, (stamp - v.stepAt) / 1000);
    const event = r.events[(r.eventCount - 1 + r.events.length) % r.events.length];
    if (rating > 0) {
      const big = event.type === HIT && event.n > 2;
      haul(rating === 2, big);
      if (r.streak >= 4) rhythm(Math.min(4, r.streak - 4));
      if (!calm) buzz(10);
      v.padKind = rating; v.padWord = rating === 2 ? (big ? W_BIG : W_PERFECT) : W_GOOD; v.padHitAt = performance.now();
    } else if (rating < 0) {
      fumble();
      const now = performance.now();
      v.padKind = 3; v.padWord = event.type === OFF && event.v < 0 ? W_EARLY : W_LATE; v.padHitAt = now;
      if (!calm && now - v.shookAt > 600) { v.shookAt = now; shake(padBox.current); }
    }
  }
  function turn(towards: -1 | 1) {
    const s = session.current;
    if (s.screen !== "play" || !S.canTap(s)) return;
    if (steer(race.current, towards)) swish(); else knock();
  }

  function onRiverDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button")) return;
    const box = event.currentTarget.getBoundingClientRect(), at = (event.clientX - box.left) / box.width;
    if (session.current.screen === "calib") stroke(stampOf(event));
    else if (at < 0.36) turn(-1);
    else if (at > 0.64) turn(1);
    else stroke(stampOf(event));
  }
  // The pads answer on touch-down for speed; a keyboard or assistive "click" (detail 0) still works.
  const press = (action: (stamp: number) => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button > 0) return; action(stampOf(event)); event.currentTarget.blur(); },
    onClick: (event: { detail: number }) => { if (event.detail === 0 && performance.now() - view.current.keyAt > 800) action(performance.now()); },
  });

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => current.old ? current : { ...current, mode: next }); sfx.tap(); }
  const friendFits = (current: Run) => Boolean(friend && friend.level === current.level && friend.seed === current.seed && friend.old === current.old);
  function start() {
    sfx.tap();
    const s = session.current;
    // A link that arrived mid-race owes the next start their river.
    const owed = S.takeOwed(s) && friend;
    const target: Run = owed ? friendRun(owed, mode) : friendFits(run) ? run : { ...run, mode, old: false };
    if (!read(KEYS.intro) && !friendFits(target)) { show("intro"); return; }
    begin(target);
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode, old: false }); }
  function openSheet() { S.openSheet(session.current); setSheet(true); sync(); }
  function closeSheet() { S.closeSheet(session.current); setSheet(false); rewindDrum(); sync(); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    const rival = friend && !friend.old && friend.level === level && friend.mode === mode ? friend : null;
    S.takeOwed(session.current);
    begin({ seed: rival ? rival.seed : newSeed(), level, mode, old: false });
  }

  const won = result?.placed ?? false;
  const nextLevel = run.old ? 0 : won && run.level < LEVEL_COUNT && run.level + 1 <= open ? run.level + 1 : 0;
  const owedRun = () => { const link = session.current.owed ? friend : null; return link ? friendRun(link, mode) : null; };
  const choices: Choice[] = [];
  if (run.old) {
    choices.push({ label: "আবার খেলো", run: () => begin(again(run)) }, { label: "নতুন বাইচ খেলো", run: () => begin({ seed: newSeed(), level: openingLevel(levels.stars, open), mode, old: false }) });
  } else {
    const first = owedRun();
    if (nextLevel) choices.push({ label: "পরের বাইচ", run: () => { S.takeOwed(session.current); begin(first ?? { seed: newSeed(), level: nextLevel, mode, old: false }); } });
    choices.push({ label: "আবার খেলো", run: () => { S.takeOwed(session.current); begin(first ?? again(run)); } });
    if (!won && mode !== "e") choices.push({ label: "সহজে খেলো", run: () => { setMode("e"); begin({ ...again(run), mode: "e" }); } });
  }
  choices.push({ label: "সব বাইচ", run: openSheet });
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
      if (s.paused || s.sheet) return;
      if (s.screen === "play" || s.screen === "calib") {
        if (lower === "p") { event.preventDefault(); player.requestPause(); return; }
        const left = key === "ArrowLeft" || lower === "a", right = key === "ArrowRight" || lower === "d";
        const drumKey = key === " " || key === "Enter" || key === "ArrowUp" || lower === "w";
        if (left || right || drumKey) {
          event.preventDefault();
          view.current.keyAt = performance.now();
          if (event.repeat) return;
          if (left) turn(-1); else if (right) turn(1); else stroke(stampOf(event));
        }
        return;
      }
      if (s.screen === "title" && (key === "Enter" || key === " ") && !event.repeat) { event.preventDefault(); start(); return; }
      if (s.screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : key === "4" ? 3 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  const total = totalStars(levels.stars);
  const finale = Boolean(def.boss) && !run.old;
  const calibShown = screen === "calib";

  return (
    <div className="bn-wrap" ref={wrapRef}>
      <div className="bn" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={world}>
        {screen === "title" && (
          <TitleScreen level={run.level} mode={run.old ? run.mode : mode} old={run.old} friend={friend} stars={total} lag={lag} note={note}
            onStart={start} onMode={setMode} onLevels={openSheet} onCalib={startCalib} />
        )}
        {screen === "intro" && <Story onDone={storyDone} />}
        {boardShown && (
          <>
            <div className="bn-hud" data-calib={calibShown || undefined}>
              <p className="bn-badge"><b>{calibShown ? "তাল মেলাও" : `বাইচ ${bn(run.level)}`}</b>{!calibShown && run.mode !== "n" && !run.old && <span>{MODE_INFO[run.mode].name}</span>}</p>
              <div className="bn-track" aria-hidden="true">
                {finale && <b>{def.boss}</b>}
                <span className="bn-line">
                  {[0, 1, 2, 3].map(index => <i key={index} data-kind={index === 0 ? "you" : finale && index === 1 ? "boss" : String(index)} ref={element => { dotRefs.current[index] = element; }} />)}
                </span>
              </div>
              <div className="bn-score">
                <p className="bn-clock" aria-hidden="true"><span ref={clockRef}>০.০</span> সে</p>
                <p className="bn-place" aria-hidden="true">এখন <span ref={placeRef}>১ম</span></p>
              </div>
            </div>
            <div className="bn-river" ref={riverBox} data-edge="" onPointerDown={onRiverDown} onContextMenu={event => event.preventDefault()}>
              <canvas ref={riverCanvas} role="img" aria-label={`ওপর থেকে দেখা নদীতে নৌকাবাইচ, ${WORLDS[world].name}। মাঝের লেনে তোমার নীল-হলুদ লম্বা নৌকা, পাশে লাল, সবুজ আর হলুদ তিনটা নৌকা, দুই পাড়ে লোকের ভিড়। ঢোলের রিং ঢোলে মিললে চাপতে হয়। নদীর বাঁ পাশে চাপলে এক লেন বাঁয়ে, ডান পাশে চাপলে ডানে। কিবোর্ডে বাঁ-ডান তীর, স্পেসে ঢোল।`} />
              <p className="bn-streak" ref={streakRef} aria-hidden="true" />
              <span className="bn-pill" data-pill="surge" aria-hidden="true">{possessive(def.boss || "সর্দার")} শেষ টান আসছে</span>
              <span className="bn-pill" data-pill="gust-left" aria-hidden="true">হাওয়া আসছে</span>
              <span className="bn-pill" data-pill="gust-right" aria-hidden="true">হাওয়া আসছে</span>
              <span className="bn-pill" data-pill="narrow" aria-hidden="true">খাল সরু হচ্ছে</span>
              <span className="bn-pill" data-pill="faster" aria-hidden="true">ঢোল দ্রুত হচ্ছে</span>
              <span className="bn-pill" data-pill="behind" aria-hidden="true">পেছনে নৌকা</span>
              {calibShown && (
                <div className="bn-calib" role="status">
                  <p><b>ঢোলের তালে চাপো</b> রিং ঢোলে মিললেই। ৮ বার বাজবে।</p>
                  <p className="bn-calib-pips" aria-label={`${bn(calibTaps)}বার চেপেছ`}>{CALIB_BEATS.map((_, index) => <i key={index} data-on={index < calibTaps} />)}</p>
                  <button type="button" className="bn-link" onPointerDown={event => event.stopPropagation()} onClick={event => { event.currentTarget.blur(); cancelCalib(true); }}>বাদ দাও</button>
                </div>
              )}
            </div>
            {screen === "over" && result ? (
              <EndScreen stats={result} slow={slow} choices={choices} onCard={result.placed ? toCard : null} />
            ) : (
              <div className="bn-pad" aria-label="নৌকা চালানোর বোতাম">
                <button type="button" className="bn-side" tabIndex={-1} aria-label="এক লেন বাঁয়ে" {...press(() => turn(-1))}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg><span>বাঁয়ে</span>
                </button>
                <button type="button" className="bn-drum" ref={padBox} tabIndex={-1} aria-label="ঢোলের তালে চাপো" {...press(stamp => stroke(stamp))}>
                  <canvas ref={padCanvas} aria-hidden="true" />
                </button>
                <button type="button" className="bn-side" tabIndex={-1} aria-label="এক লেন ডানে" {...press(() => turn(1))}>
                  <span>ডানে</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {last && screen === "over" && <ResultCard key={`${last.level}-${last.seed}-${last.tenths}`} last={last} site={site} />}
    </div>
  );
}
