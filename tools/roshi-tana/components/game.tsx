"use client";
// IP: what we avoided — no rhythm-game brand's note highways, judgement words, fonts or HUD, and no real school, team or uniform; ours is a top-down school field with a jute rope, a red ribbon, a ঢোল with a closing ring, and made-up sports-day teams in plain shirts.
// The game inside the shared player. Rules live in lib/ (match.ts and step.hot.ts play the match, session.ts decides the clock,
// input and the crowd loop); this file feeds taps in, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { buzz, confetti, fitCanvas, newSeed, readLevels, sfx, shake, silenceScheduled, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import {
  buildLayers, createLook, createScene, duoField, padField, soloField,
  HIT_BAD, HIT_GOOD, HIT_NONE, HIT_PERFECT, RING_BIG, RING_HEAVE, RING_NONE, RING_PLAIN, RING_QUIET, RING_REST, type DrumLook, type Field, type Layers,
} from "../lib/art";
import { clearDust, drawDrum, drawField, puff } from "../lib/draw.hot";
import { bestKey, isLevel, isMode, LEVEL_COUNT, levelDef, MODE_INFO, nextAhead, openLevel, readAhead, readBests, SLUG, starsOf, THEM, toNextStar, US, WORLDS, type Mode } from "../lib/levels";
import { bn, clearLine, compareLine, duoTeam, lossLine, parseShared, type Shared } from "../lib/link";
import {
  beatFloor, beatPhase, beatTime, breath, countIn, createMatch, hitsOf, kindOf, resume as resumeMatch, tap,
  BIG, COUNT, COUNT_IN, HEAVE, KIND, MAX_BEATS, QUIET, REST, WARN, type Grade, type Match, type Side,
} from "../lib/match";
import * as S from "../lib/session";
import { crowd, drum, grunt, creak, scuff, heaveCall, heaveThud, held as heldSound, starChime, victory, whistle } from "../lib/sound";
import { advance } from "../lib/step.hot";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard, type Last } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

/** ms between the start tap and the first count-in beat. */
const LEAD = 450;
/** A drum stroke is handed to the audio clock this far ahead, so it sounds right on the beat the ring shows. */
const LOOKAHEAD = 90;

const KEYS = { levels: `ektukhani-levels-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, bests: `ektukhani-beats-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

// Fixed words for the drum, so a frame never builds a string.
const WORD: Record<Grade, string> = { perfect: "ঠিক তালে", good: "চলবে", off: "তাল কাটল", extra: "একবার চাপো", rest: "ফাঁকা ছিল", early: "", none: "" };
const HIT: Record<Grade, number> = { perfect: HIT_PERFECT, good: HIT_GOOD, off: HIT_BAD, extra: HIT_BAD, rest: HIT_BAD, early: HIT_NONE, none: HIT_NONE };
const COUNT_WORD = ["", "১", "২", "৩"];
const COMBO = Array.from({ length: MAX_BEATS + 2 }, (_, n) => n >= 3 ? `টানা ${bn(n)}` : "");
const BEATS = Array.from({ length: MAX_BEATS + 8 }, (_, n) => bn(n));
const RING_HINT = ["", "জোরে", "চেপো না", "মনে মনে গোনো", "ঠেকাও", ""];

type Run = { seed: number; level: number; mode: Mode; old: boolean; duo: boolean };
type Screen = S.Screen;

/** A tap's own time, on the same clock as performance.now(), so judging never depends on when the frame ran. */
function stampOf(event: { timeStamp: number }) {
  const now = performance.now(), stamp = event.timeStamp;
  return stamp > 0 && Math.abs(now - stamp) < 1000 ? stamp : now;
}

/** How the ring should look for beat k. */
function ringOf(kind: number) {
  const base = kind & KIND;
  if (base === COUNT) return RING_PLAIN;
  if (base === REST) return RING_REST;
  if (kind & HEAVE) return RING_HEAVE;
  if (kind & QUIET) return RING_QUIET;
  return base === BIG ? RING_BIG : RING_PLAIN;
}

export function RoshiGame() {
  const rootRef = useRef<HTMLDivElement>(null), wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null), fieldBox = useRef<HTMLDivElement>(null), fieldCanvas = useRef<HTMLCanvasElement>(null);
  const padBox = useRef<HTMLButtonElement>(null), padCanvas = useRef<HTMLCanvasElement>(null);
  const duoBox = useRef<HTMLDivElement>(null), duoCanvas = useRef<HTMLCanvasElement>(null);
  const beatsRef = useRef<HTMLSpanElement>(null), comboRef = useRef<HTMLParagraphElement>(null), bossRef = useRef<HTMLParagraphElement>(null);

  const session = useRef<S.Session>(S.createSession(true));
  const clock = useRef<S.Clock>(S.createClock(0, LEAD));
  const match = useRef<Match>(createMatch(1, 1));
  const scene = useRef(createScene());
  const looks = useRef<[DrumLook, DrumLook]>([createLook(), createLook()]);
  const view = useRef({
    layers: null as Layers | null, fieldCtx: null as CanvasRenderingContext2D | null,
    pad: null as Field | null, padCtx: null as CanvasRenderingContext2D | null,
    duo: null as Layers | null, duoCtx: null as CanvasRenderingContext2D | null,
    drumNext: 0, lastDraw: 0, keyAt: -1e9, shookAt: 0, reduced: false,
    beats: -1, combo: -1, edge: "", danger: -1, breath: -1, heaving: false, held: 0, heaves: 0, ready: [false, false] as [boolean, boolean],
  });
  const hum = useRef<ReturnType<typeof crowd> | null>(null);

  const [screen, setScreen] = useState<Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n", old: false, duo: false });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Last | null>(null);
  const [duoReady, setDuoReady] = useState<[boolean, boolean]>([false, false]);
  const [duoWin, setDuoWin] = useState<0 | 1 | -1 | null>(null);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, run, screen });
  live.current = { slow, run, screen };
  const def = levelDef(run.level, run.old);

  // ---- the crowd loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { hum.current?.stop(); hum.current = crowd(); },
    stop: () => { hum.current?.stop(); hum.current = null; },
  };
  const sync = () => S.syncLoops(session.current, loops);

  /** Back from away (focus, show, চালিয়ে যাও): re-base the clock where it stopped and run a fresh ৩-২-১. */
  function wakeUp() {
    const m = match.current, c = clock.current;
    if (!S.wake(session.current, c, performance.now())) return;
    if (m.winner !== null || c.now < 0) return;
    resumeMatch(m, c.now);
    const floor = beatFloor(m, c.now);
    view.current.drumNext = beatTime(m, floor) < c.now ? floor + 1 : floor;
  }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current); wakeUp(); sync(); },
    onRestart: () => {
      S.resume(session.current);
      const { screen: now, run: current } = live.current;
      if (now === "play" || now === "over" || now === "ready") begin(current.duo ? { ...current, seed: newSeed() } : again(current));
      else sync();
    },
  });

  function show(next: Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  /** A fresh match on the play screen: the whistle, then ৩-২-১ on the rim, then pulls. Two players start at the ready screen. */
  function begin(next: Run) {
    silenceScheduled(); clearDust();
    match.current = createMatch(next.seed, next.duo ? 0 : next.level, next.mode, next.old, live.current.slow);
    clock.current = S.createClock(performance.now(), LEAD);
    Object.assign(view.current, { drumNext: 0, beats: -1, combo: -1, edge: "", danger: -1, breath: -1, heaving: false, held: 0, heaves: 0, ready: [false, false] });
    Object.assign(scene.current, createScene());
    setRun(next); setResult(null); setSheet(false); S.closeSheet(session.current); setDuoWin(null); setDuoReady([false, false]);
    if (next.duo && live.current.screen !== "over" && live.current.screen !== "play") { show("ready"); return; }
    show("play");
    whistle();
    wrapRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The same level again: a friend's seed stays (so the comparison holds), anything else gets a fresh team. */
  function again(current: Run): Run {
    const rival = friend && friend.level === current.level && friend.seed === current.seed && friend.mode === current.mode && friend.old === current.old;
    return { ...current, duo: false, seed: rival ? current.seed : newSeed() };
  }

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    session.current.sound = soundOn();
    view.current.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saved = readLevels(read(KEYS.levels), LEVEL_COUNT), savedAhead = readAhead(read(KEYS.ahead));
    setAhead(savedAhead);
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    const readLink = (first: boolean) => {
      const link = parseShared(window.location.hash);
      // An invalid link clears the banner: the friend is gone, the game stays where it was.
      setFriend(link);
      if (link) {
        setModeState(link.old ? chosen : link.mode);
        const next = { seed: link.seed, level: link.level, mode: link.mode, old: link.old, duo: false };
        setRun(next);
        match.current = createMatch(next.seed, next.level, next.mode, next.old);
        if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(link);
        else if (!first) show("title");
      } else if (first) {
        setModeState(chosen);
        setRun({ seed: newSeed(), level: openLevel(saved, savedAhead), mode: chosen, old: false, duo: false });
      }
    };
    readLink(true);
    const onHash = () => readLink(false);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the match; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __roshi: { match: () => match.current, session: () => session.current, clock: () => clock.current, beatTime, kindOf } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  // Off also cuts drum strokes and chimes already queued; on starts a fresh crowd (never the silent stub made while muted).
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { hum.current = null; silenceScheduled(); } sync(); }, [sound]);

  // ---- away and back ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); wakeUp(); sync(); };
    const onVisibility = () => { if (document.hidden) S.hide(session.current); else { S.show(session.current); wakeUp(); } sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- one step: the clock, the rules, the drum, the crowd ----
  function stroke(m: Match, k: number, delay: number) {
    const kind = kindOf(m, k), base = kind & KIND;
    if (base === COUNT) drum("count", delay);
    else if (base !== REST && !(kind & QUIET)) drum(base === BIG ? "big" : (k - COUNT_IN) % 2 === 0 ? "strong" : "weak", delay);
    if (kind & WARN && !(kindOf(m, k - 1) & WARN)) heaveCall(delay);
    // Two beats before a tempo change, a quick double tap on the rim says it's coming.
    for (let i = 1; i < m.segs; i++) if (m.segAt[i] === k + 2) { drum("count", delay); drum("count", delay + m.segP[i - 1] / 2000); }
  }

  function step() {
    const s = session.current, m = match.current, v = view.current;
    if (!S.ticking(s) || m.winner !== null) return;
    const t = S.tick(clock.current, performance.now());
    advance(m, t);
    while (beatTime(m, v.drumNext) - t < LOOKAHEAD) {
      const at = beatTime(m, v.drumNext);
      // A stroke whose moment has passed is dropped, never fired late in a burst.
      if (at >= t - 30) stroke(m, v.drumNext, Math.max(0, (at - t) / 1000));
      v.drumNext++;
    }
    if (m.heaves > v.heaves) { v.heaves = m.heaves; if (m.heave > 0.9) { heaveThud(); if (!live.current.slow) shake(boardRef.current); } }
    if (m.held > v.held) { v.held = m.held; heldSound(); }
    const sc = scene.current;
    sc.excite = Math.min(1, Math.abs(m.x) * 0.8 + Math.min(m.sides[0].combo, 10) / 20 + m.heave * 0.4);
    hum.current?.set(sc.excite);
    sync();
    if (m.winner !== null) finish();
  }

  function finish() {
    const m = match.current, current = live.current.run, p = m.sides[0];
    if (current.duo) {
      setDuoWin(m.winner ?? -1);
      show("over");
      whistle(0, true);
      if (m.winner === 0 || m.winner === 1) {
        victory(0);
        confetti({ colors: [duoTeam(m.winner).shirt, "#ffffff", "#d62828", "#f4a261"], y: m.winner === 0 ? 0.7 : 0.3 });
        setLast({ kind: "duo", win: { winner: m.winner, beats: m.beats } });
      } else sfx.good();
      return;
    }
    const { level, mode: played, old, seed } = current, info = MODE_INFO[played], team = levelDef(level, old);
    const rival = friend && friend.level === level && friend.seed === seed && friend.mode === played && friend.old === old ? friend : null;
    const base = { perfect: p.perfect, good: p.good, slips: p.slips, missed: p.missed, wrongRests: p.wrongRests, best: p.best, heaves: m.heaves, held: m.held, beats: m.beats, maxStars: info.maxStars };
    if (m.winner === 0) {
      const earned = starsOf(m.beats, level, played, old);
      const bests = readBests(read(KEYS.bests)), key = bestKey(level, played), previous = old ? null : bests[key] ?? null;
      let record = "";
      if (!old) {
        const nextList = nextAhead(levels.stars, ahead, level);
        write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
        levels.record(level, earned);
        if (previous === null || m.beats < previous) { bests[key] = m.beats; write(KEYS.bests, JSON.stringify(bests)); }
        record = previous === null ? `এই ফোনে লেভেল ${bn(level)}-এর প্রথম জয়।` : m.beats < previous ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(previous)} টান।` : `এই ফোনে সেরা: ${bn(previous)} টান`;
      }
      const gap = toNextStar(m.beats, level, played, old);
      const near = gap > 0 ? `আর ${bn(gap)} টান কম লাগলে ${bn(earned + 1)} তারা।`
        : earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : "";
      setResult({ ...base, won: true, kicker: `লেভেল ${bn(level)} পার · ${team.team}`, title: "", stars: earned, line: rival ? compareLine(m.beats, rival.beats, rival.name) : clearLine(level, old), near, record });
      setLast({ kind: "solo", shared: { level, seed, beats: m.beats, hits: hitsOf(p), mode: played, old } });
      show("over");
      whistle(0, true);
      victory(team.world);
      for (let star = 0; star < earned; star++) starChime(star, 1.0 + star * 0.28);
      if (earned === 3 || team.surge || (previous !== null && m.beats < previous)) confetti({ colors: [US.shirt, team.shirt, "#d62828", "#ffffff"] });
    } else {
      setResult({
        ...base, won: false, kicker: `লেভেল ${bn(level)} · ${old ? "বন্ধুর পুরোনো লেভেল" : WORLDS[team.world].name}`, title: m.winner === -1 ? "সমান সমান" : `${team.team} জিতল`, stars: 0,
        line: lossLine({ slips: p.slips, hits: hitsOf(p), missed: p.missed, wrongRests: p.wrongRests, heaves: m.heaves, held: m.held, timeout: m.beats >= MAX_BEATS }),
        near: rival ? `${rival.name || "বন্ধু"} এই দলকে ${bn(rival.beats)} টানে হারিয়েছিল।` : "", record: "",
      });
      show("over");
      whistle(0, true);
      sfx.lose();
      if (!live.current.slow) shake(boardRef.current);
    }
  }

  /** Preview images only (`&og=1` on a link): the friend's result as a finished end screen. Saves nothing on the phone. */
  function demo(found: Shared) {
    const team = levelDef(found.level, found.old), stars = starsOf(found.beats, found.level, found.mode, found.old);
    setResult({ won: true, kicker: `লেভেল ${bn(found.level)} পার · ${team.team}`, title: "", beats: found.beats, stars, maxStars: MODE_INFO[found.mode].maxStars,
      perfect: found.hits, good: 0, slips: 0, missed: 0, wrongRests: 0, best: found.hits, heaves: 0, held: 0, line: clearLine(found.level, found.old), near: "", record: "" });
    setLast({ kind: "solo", shared: { level: found.level, seed: found.seed, beats: found.beats, hits: found.hits, mode: found.mode, old: found.old } });
    match.current.x = 1; scene.current.x = 1;
    S.goTo(session.current, "over"); setScreen("over");
  }

  // ---- drawing ----
  function fillLook(look: DrumLook, side: Side, t: number) {
    const m = match.current, p = m.sides[side], screenNow = session.current.screen;
    look.calm = live.current.slow || view.current.reduced;
    look.hit = 0; look.hitKind = HIT_NONE; look.sub = ""; look.word = "";
    if (screenNow === "ready") {
      const ready = view.current.ready[side];
      look.phase = beatPhase(m, performance.now() % 60000); look.ring = RING_PLAIN; look.stick = 0;
      look.word = ready ? "তৈরি ✓" : "চাপো"; look.sub = ready ? "অন্যজনের অপেক্ষা" : "তৈরি হলে";
      return;
    }
    if (screenNow !== "play") { look.phase = 0.99; look.ring = RING_NONE; return; }
    const floor = beatFloor(m, t), next = beatTime(m, floor) <= t ? floor + 1 : floor;
    look.phase = t < 0 ? 0.99 : beatPhase(m, t);
    look.stick = floor & 1;
    look.ring = ringOf(kindOf(m, next));
    const since = t - p.gradeAt, word = WORD[p.grade];
    if (since >= 0 && since < 260 && word) { look.hit = 1 - since / 260; look.hitKind = HIT[p.grade]; }
    const count = countIn(m, t);
    if (count) { look.word = COUNT_WORD[Math.min(3, count)]; look.sub = "গুনে নাও"; return; }
    if (since >= 0 && since < 450 && word) look.word = word;
    else look.word = look.phase > 0.5 ? "হেঁই" : "য়ো";
    const hint = RING_HINT[look.ring];
    look.sub = hint || (m.level === 1 && hitsOf(p) === 0 && side === 0 ? "রিং মিশলেই চাপো" : COMBO[Math.min(MAX_BEATS + 1, p.combo)]);
  }

  function draw() {
    const v = view.current, m = match.current, sc = scene.current, s = session.current, now = performance.now();
    const dt = v.lastDraw ? Math.min(0.05, (now - v.lastDraw) / 1000) : 0;
    v.lastDraw = now;
    const going = S.ticking(s), t = clock.current.now;
    const you = m.sides[0];
    sc.x = m.x; sc.v = m.v; sc.lean0 = you.lean; sc.lean1 = m.sides[1].lean; sc.heave = m.heave; sc.hold = m.hold;
    sc.calm = live.current.slow || v.reduced;
    if (going) sc.time += dt;
    const target = Math.min(1, 0.3 + Math.abs(m.v) * 0.9 + Math.min(you.combo, 8) / 14 + m.heave * 0.5);
    sc.tension += (target - sc.tension) * Math.min(1, dt * 9);
    sc.twang = Math.max(0, sc.twang - dt * 2.8);
    if (!going && s.screen !== "over") sc.excite *= 0.95;

    if (live.current.run.duo) {
      const c = v.duoCtx, L = v.duo;
      if (!c || !L) return;
      drawField(c, L, sc, going ? dt : 0);
      const f = L.field, r = Math.min(f.w * 0.16, f.h * 0.09);
      fillLook(looks.current[0], 0, t); fillLook(looks.current[1], 1, t);
      drawDrum(c, f.w * 0.77, f.h * 0.78, r, looks.current[0], f, 0);
      drawDrum(c, f.w * 0.23, f.h * 0.22, r, looks.current[1], f, Math.PI);
      return;
    }
    const c = v.fieldCtx, L = v.layers;
    if (c && L) drawField(c, L, sc, going ? dt : 0);
    const pc = v.padCtx, pf = v.pad;
    if (pc && pf) {
      pc.clearRect(0, 0, pf.w, pf.h);
      fillLook(looks.current[0], 0, t);
      drawDrum(pc, pf.w / 2, pf.h * 0.56, pf.h * 0.34, looks.current[0], pf, 0);
    }
    hud(m, t);
  }

  /** The corner HUD and the edges, written straight to the DOM only when a value changes. */
  function hud(m: Match, t: number) {
    const v = view.current, root = rootRef.current;
    if (v.beats !== m.beats && beatsRef.current) { v.beats = m.beats; beatsRef.current.textContent = BEATS[Math.min(BEATS.length - 1, m.beats)]; }
    const combo = m.sides[0].combo;
    if (combo !== v.combo && comboRef.current) {
      v.combo = combo;
      comboRef.current.textContent = COMBO[Math.min(MAX_BEATS + 1, combo)];
      comboRef.current.dataset.on = combo >= 3 ? (combo % 5 === 0 ? "pop" : "on") : "";
    }
    const playing = session.current.screen === "play" && t >= 0;
    const next = beatFloor(m, t) + 1, now = playing ? kindOf(m, next - 1) : 0, coming = playing ? kindOf(m, next) : 0;
    const fill = m.def.surge && playing ? Math.round(breath(m, t) * 100) : -1, heaving = (now & HEAVE) !== 0;
    const warn = !heaving && ((now & WARN) !== 0 || (coming & (WARN | HEAVE)) !== 0);
    if (bossRef.current && (fill !== v.breath || heaving !== v.heaving)) {
      v.breath = fill; v.heaving = heaving;
      bossRef.current.style.setProperty("--fill", `${Math.max(0, fill) / 100}`);
      bossRef.current.dataset.heave = heaving ? "1" : "";
    }
    let edge = "";
    let tempo = 0;
    for (let i = 1; i < m.segs; i++) if (m.segAt[i] > next - 1 && m.segAt[i] <= next + 2) tempo = m.segP[i] < m.segP[i - 1] ? 1 : -1;
    if (!playing || countIn(m, t)) edge = "";
    else if (heaving) edge = "heaving";
    else if (warn) edge = "heave";
    else if (m.x < -0.5) edge = "danger";
    else if (tempo) edge = tempo > 0 ? "faster" : "slower";
    else if (m.x > 0.6) edge = "near";
    if (edge !== v.edge && root) { v.edge = edge; root.dataset.edge = edge; }
    const danger = edge === "danger" ? Math.round(Math.min(1, (-m.x - 0.5) / 0.45) * 10) / 10 : 0;
    if (danger !== v.danger && root) { v.danger = danger; root.style.setProperty("--danger", String(danger)); }
  }

  const looping = (screen === "play" || screen === "ready") && !player.paused;
  useGameLoop(step, draw, looping);

  // ---- size the field and the pad to their boxes; pre-render the world's layers ----
  const fieldShown = !run.duo && (screen === "play" || screen === "over");
  useEffect(() => {
    if (!fieldShown) return;
    const box = fieldBox.current, target = fieldCanvas.current, pad = padBox.current, padTarget = padCanvas.current;
    if (!box || !target) return;
    const ratio = () => Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      view.current.fieldCtx = fitCanvas(target, width, height);
      view.current.layers = buildLayers(soloField(width, height), ratio(), def.world, US.shirt, def.shirt, def.surge !== null);
      if (pad && padTarget) {
        const pw = Math.floor(pad.clientWidth), ph = Math.floor(pad.clientHeight);
        if (pw > 40 && ph > 40) {
          padTarget.style.width = `${pw}px`; padTarget.style.height = `${ph}px`;
          view.current.padCtx = fitCanvas(padTarget, pw, ph);
          view.current.pad = padField(pw, ph);
        }
      }
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    if (pad) observer.observe(pad);
    void document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, [fieldShown, screen === "over", run.level, run.old]);

  useEffect(() => {
    if (!run.duo) return;
    const box = duoBox.current, target = duoCanvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      view.current.duoCtx = fitCanvas(target, width, height);
      view.current.duo = buildLayers(duoField(width, height), Math.min(2, window.devicePixelRatio || 1), 0, US.shirt, THEM.shirt, false);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    void document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, [run.duo]);

  // ---- taps ----
  function pullAt(side: Side, stamp: number) {
    const s = session.current, m = match.current;
    if (!S.canTap(s)) return;
    const grade = tap(m, side, S.tapTime(clock.current, stamp)), p = m.sides[side], calm = live.current.slow || view.current.reduced;
    const f = run.duo ? view.current.duo?.field : view.current.layers?.field;
    if (grade === "perfect" || grade === "good") {
      grunt();
      if (grade === "perfect") { creak(); scene.current.twang = 1; if (!calm) buzz(10); }
      if (p.combo >= 5 && p.combo % 5 === 0) sfx.combo(p.combo / 5 - 1);
      if (f && !calm) puff(f.cx, f.cy + m.x * f.gap + (side === 0 ? 1 : -1) * (f.gap + 16 * f.size + 4 * f.spacing), side === 0 ? 1 : -1, f.size, grade === "perfect" ? 4 : 2);
      if (m.held > view.current.held) { view.current.held = m.held; heldSound(); }
    } else if (grade === "off" || grade === "extra" || grade === "rest") {
      scuff();
      const now = performance.now();
      if (!run.duo && !calm && now - view.current.shookAt > 600) { view.current.shookAt = now; shake(padBox.current); }
    }
  }

  function duoInput(side: Side, stamp: number) {
    const s = session.current, v = view.current;
    if (s.paused || !s.focused) return;
    if (s.screen === "ready") {
      if (v.ready[side]) return;
      v.ready[side] = true;
      setDuoReady([v.ready[0], v.ready[1]]);
      sfx.tap();
      if (v.ready[0] && v.ready[1]) { show("play"); clock.current = S.createClock(performance.now(), LEAD); whistle(); }
      return;
    }
    pullAt(side, stamp);
  }

  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || session.current.screen !== "play") return;
    pullAt(0, stampOf(event));
  }
  const zoneDown = (side: Side) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    duoInput(side, stampOf(event));
  };

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => current.old ? current : { ...current, mode: next }); sfx.tap(); }
  function start() {
    sfx.tap();
    const fromFriend = friend && friend.level === run.level && friend.seed === run.seed;
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode, old: false, duo: false });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode, old: false, duo: false }); }
  function openSheet() { S.openSheet(session.current); setSheet(true); sync(); }
  function closeSheet() { S.closeSheet(session.current); setSheet(false); wakeUp(); sync(); }
  function pickLevel(level: number) {
    if (!isLevel(level) || level > open) return;
    const rival = friend && !friend.old && friend.level === level && friend.mode === mode ? friend : null;
    S.closeSheet(session.current);
    begin({ seed: rival ? rival.seed : newSeed(), level, mode, old: false, duo: false });
  }
  function openDuo() { sfx.tap(); begin({ ...run, seed: newSeed(), duo: true }); }
  function closeDuo() { setRun(current => ({ ...current, duo: false, seed: newSeed() })); show("title"); }

  const won = result?.won ?? false;
  const nextLevel = run.old ? open : run.level < LEVEL_COUNT && run.level + 1 <= openLevel(levels.stars, ahead) ? run.level + 1 : 0;
  const choices: Choice[] = [
    ...(won && nextLevel ? [{ label: run.old ? `লেভেল ${bn(nextLevel)} খেলো` : "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode, old: false, duo: false }) }] : []),
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
      if (s.paused || s.sheet) return;
      if (lower === "p" && (s.screen === "play" || s.screen === "ready")) { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ") && !event.repeat) { event.preventDefault(); start(); return; }
      if (run.duo && (s.screen === "play" || s.screen === "ready")) {
        const side: Side | null = lower === "a" ? 1 : lower === "l" || key === "Enter" || key === " " ? 0 : null;
        if (side === null) return;
        event.preventDefault();
        if (!event.repeat) duoInput(side, stampOf(event));
        return;
      }
      if (s.screen === "play" && (key === " " || key === "Enter" || key === "ArrowUp" || key === "ArrowDown")) {
        event.preventDefault();
        view.current.keyAt = performance.now();
        if (!event.repeat) pullAt(0, stampOf(event));
        return;
      }
      if (s.screen === "over" && !run.duo && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  const total = totalStars(levels.stars);
  const duoOver = run.duo && screen === "over" && duoWin !== null;
  const zoneText = (side: Side) => !duoOver ? null : duoWin === -1 ? "সমান সমান" : duoWin === side ? "জিতলে!" : "এবার হলো না";

  return (
    <div className="rt-wrap" ref={wrapRef}>
      <div className="rt" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={def.world} data-edge="">
        {screen === "title" && (
          <TitleScreen level={run.level} mode={run.old ? run.mode : mode} old={run.old} friend={friend} stars={total}
            onStart={start} onMode={setMode} onLevels={openSheet} onDuo={openDuo} />
        )}
        {screen === "intro" && <Story onDone={storyDone} />}
        {fieldShown && (
          <>
            <div className="rt-hud">
              <p className="rt-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
              <p className="rt-boss" ref={bossRef} data-on={def.surge && screen === "play" ? "1" : undefined} aria-hidden="true">
                <b>{def.team}</b><span className="rt-meter"><i /></span><em>হেঁইয়ো!</em>
              </p>
              <div className="rt-score">
                <p className="rt-beats" aria-hidden="true"><span ref={beatsRef}>০</span> টান</p>
                <p className="rt-combo" ref={comboRef} aria-hidden="true" />
              </div>
            </div>
            <div className="rt-board" ref={boardRef} onPointerDown={onBoardDown} onContextMenu={event => event.preventDefault()}>
              <div className="rt-field" ref={fieldBox}>
                <canvas ref={fieldCanvas} role="img" aria-label={`স্কুলমাঠে রশি টানাটানি: নিচে আমাদের হলুদ দল, ওপরে ${def.team}।`} />
                <span className="rt-pill rt-pill-heave" aria-hidden="true">হেঁইয়ো আসছে</span>
                <span className="rt-pill rt-pill-faster" aria-hidden="true">তাল বাড়ছে</span>
                <span className="rt-pill rt-pill-slower" aria-hidden="true">তাল কমছে</span>
              </div>
              {screen === "play" ? (
                <button type="button" className="rt-pad" ref={padBox} aria-label="ঢোল: প্রতি তালে একবার চাপো"
                  onClick={event => { if (event.nativeEvent.detail === 0 && performance.now() - view.current.keyAt > 800) pullAt(0, performance.now()); }}>
                  <canvas ref={padCanvas} aria-hidden="true" />
                </button>
              ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={result.won ? toCard : null} />}
            </div>
          </>
        )}
        {run.duo && (screen === "ready" || screen === "play" || screen === "over") && (
          <div className="rt-duo" ref={duoBox} onContextMenu={event => event.preventDefault()}>
            <canvas ref={duoCanvas} aria-hidden="true" />
            <div className="rt-zone rt-top" onPointerDown={zoneDown(1)} role="group" aria-label={`ওপরের অর্ধেক: ${THEM.name}`}>
              <p className="rt-zone-name">{THEM.name}{duoReady[1] && screen === "ready" ? " · তৈরি" : ""}</p>
              {zoneText(1) && <p className="rt-zone-result">{zoneText(1)}</p>}
            </div>
            <div className="rt-zone rt-bottom" onPointerDown={zoneDown(0)} role="group" aria-label={`নিচের অর্ধেক: ${US.name}`}>
              <p className="rt-zone-name">{US.name}{duoReady[0] && screen === "ready" ? " · তৈরি" : ""}</p>
              {zoneText(0) && <p className="rt-zone-result">{zoneText(0)}</p>}
            </div>
            <div className="rt-mid">
              {screen === "ready" && <button type="button" className="rt-close" aria-label="দুজনের খেলা বন্ধ করো" onClick={closeDuo}>✕</button>}
              {duoOver && (
                <div className="rt-mid-actions">
                  <button type="button" className="kit-primary" onClick={event => { event.currentTarget.blur(); begin({ ...run, seed: newSeed() }); }}>আরেকবার</button>
                  <button type="button" className="kit-secondary" onClick={event => { event.currentTarget.blur(); const had = duoWin !== -1; closeDuo(); if (had) requestAnimationFrame(toCard); }}>{duoWin !== -1 ? "কার্ড দেখো" : "বের হও"}</button>
                </div>
              )}
            </div>
          </div>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {last && (screen === "over" || (last.kind === "duo" && screen === "title")) && <ResultCard key={last.kind === "solo" ? `${last.shared.level}-${last.shared.seed}-${last.shared.beats}` : `duo-${last.win.beats}`} last={last} site={site} />}
    </div>
  );
}
