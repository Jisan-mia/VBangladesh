"use client";
// IP: what we avoided — no rhythm-game brand's note highways, judgement words, fonts or HUD, and no real school, team or uniform; ours is a top-down school field with a jute rope, a red ribbon, a ঢোল with a closing ring, and ten made-up sports-day teams in plain shirts.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode, buzz, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawBackground, drawDrum, drawScene, duoField, makeField, soloField, type DrumLook, type Field, type Pose } from "../lib/art";
import { cardBlob, drawCard, duoCard, soloCard, type Card } from "../lib/draw-card";
import {
  bannerNote, beatsText, bn, caption, clearLine, compareLine, duoCaption, duoTeam, duoTitle, feat, levelLabel, lossLine, nearMissLine, parseShared, sharedHash,
  type DuoWin, type Shared,
} from "../lib/link";
import { beatPhase, countIn, hitsOf, makeMatch, resume as resumeMatch, starsOf, tap, update, MAX_BEATS, type Grade, type Match, type Side } from "../lib/rope";
import { cheer, creak, crowd, drum, grunt, scuff } from "../lib/sound";
import { teamOf, LEVEL_COUNT, THEM, US } from "../lib/teams";

const TOOL = "roshi-tana";
const MAX_WIDTH = 480;
/** Solo field height as a share of its width, and the drum pad's height. */
const FIELD_RATIO = 0.8, PAD_H = 148;
/** ms between the start tap and the first count-in beat. */
const LEAD = 450;

type Mode = "solo" | "duo";
type Phase = "ready" | "play" | "over";
type SoloResult = { won: boolean; beats: number; hits: number; perfect: number; stars: number; improved: boolean; newBest: boolean; slips: number; missed: number; timeout: boolean };
type Last = { kind: "solo"; shared: Omit<Shared, "name"> } | { kind: "duo"; win: Omit<DuoWin, "name"> } | null;

const WORD: Record<Grade, string> = { perfect: "ঠিক তালে", good: "চলবে", off: "তাল কাটল", extra: "একবার চাপো", early: "", none: "" };
const HIT_COLOR: Record<Grade, string> = { perfect: "#f2b705", good: "#a7d98a", off: "#d9534f", extra: "#d9534f", early: "#ffffff", none: "#ffffff" };
const COUNT = ["", "১", "২", "৩"];
const COMBO = Array.from({ length: MAX_BEATS + 1 }, (_, n) => n >= 3 ? `টানা ${bn(n)}` : "");

const look = (): DrumLook => ({ phase: 0, hit: 0, hitColor: "#fff", word: "", sub: "", accent: "#c2410c", calm: false });

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    match: makeMatch(1, 1) as Match, phase: "ready" as Phase, mode: "solo" as Mode,
    seed: 1, origin: 0, pausedAt: 0, paused: false, ended: false, drumNext: 0, counting: false, left: MAX_BEATS, recentSlips: 0, shookAt: 0, keyAt: -1e9,
    field: null as Field | null, fieldCtx: null as CanvasRenderingContext2D | null, fieldBg: null as HTMLCanvasElement | null,
    pad: null as Field | null, padCtx: null as CanvasRenderingContext2D | null,
    duo: null as Field | null, duoCtx: null as CanvasRenderingContext2D | null, duoBg: null as HTMLCanvasElement | null,
    pose: { x: 0, lean0: 0, lean1: 0 } as Pose, looks: [look(), look()] as [DrumLook, DrumLook],
    hum: null as ReturnType<typeof crowd> | null, calm: false, reduced: false, ready: [false, false],
  };
}

/** A tap's own time, on the same clock as performance.now(), so judging never depends on when the frame ran. */
function stampOf(event: { timeStamp: number }) {
  const now = performance.now(), stamp = event.timeStamp;
  return stamp > 0 && Math.abs(now - stamp) < 1000 ? stamp : now;
}

function paintBackground(target: HTMLCanvasElement | null, field: Field) {
  const ratio = Math.min(2, window.devicePixelRatio || 1), canvas = target ?? document.createElement("canvas");
  canvas.width = Math.round(field.w * ratio); canvas.height = Math.round(field.h * ratio);
  const c = canvas.getContext("2d");
  if (c) { c.setTransform(ratio, 0, 0, ratio, 0, 0); drawBackground(c, field); }
  return canvas;
}

export function RoshiGame() {
  const [mode, setModeState] = useState<Mode>("solo");
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [counting, setCounting] = useState(false);
  const [combo, setCombo] = useState(0);
  const [coach, setCoach] = useState(false);
  const [left, setLeft] = useState(MAX_BEATS);
  const [result, setResult] = useState<SoloResult | null>(null);
  const [duoWin, setDuoWin] = useState<{ winner: Side | -1; beats: number } | null>(null);
  const [ready, setReady] = useState<[boolean, boolean]>([false, false]);
  const [last, setLast] = useState<Last>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`, false);
  const [live] = useState(makeLive);

  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const chosen = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const fieldCanvas = useRef<HTMLCanvasElement>(null);
  const padCanvas = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<HTMLButtonElement>(null);
  const duoLayer = useRef<HTMLDivElement>(null);
  const duoCanvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const team = teamOf(level);
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const duo = mode === "duo";
  const card: Card | null = last?.kind === "solo" ? soloCard({ ...last.shared, name }) : last?.kind === "duo" ? duoCard({ ...last.win, name }) : null;
  const shared: Shared | null = last?.kind === "solo" ? { ...last.shared, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const cardKey = shared ? state : last?.kind === "duo" ? `duo-${last.win.winner}-${last.win.beats}-${name}` : "";

  function setPhase(next: Phase) { live.phase = next; setPhaseState(next); }
  function stopHum() { live.hum?.stop(); live.hum = null; }

  /** A fresh, idle match for the ready screen (the ribbon in the middle, the drum pulsing at this level's tempo). */
  function toReady(nextMode: Mode, nextLevel: number) {
    stopHum();
    live.match = makeMatch(nextMode === "duo" ? 0 : nextLevel, 1, slowRef.current);
    Object.assign(live, { paused: false, ended: false, ready: [false, false] });
    setPaused(false); setReady([false, false]); setCounting(false); setCombo(0); setCoach(false); setLeft(MAX_BEATS);
    setPhase("ready");
  }

  /** The count-in starts now; the first pull beat comes three beats later. Restarting takes one frame. */
  function start(nextLevel = level, matchSeed = rival && nextLevel === rival.level ? rival.seed : newSeed()) {
    chosen.current = true;
    const solo = live.mode === "solo";
    if (solo) { setLevel(nextLevel); setSeed(matchSeed); }
    live.match = makeMatch(solo ? nextLevel : 0, matchSeed, slowRef.current);
    Object.assign(live, { seed: matchSeed, origin: performance.now() + LEAD, drumNext: 0, ended: false, paused: false, counting: true, left: MAX_BEATS, recentSlips: 0 });
    setPaused(false); setCounting(true); setCombo(0); setCoach(false); setLeft(MAX_BEATS); setResult(null); setDuoWin(null);
    setPhase("play");
    sfx.tap();
    stopHum();
    live.hum = crowd();
  }

  function pause() {
    if (live.phase !== "play" || live.paused) return;
    live.pausedAt = performance.now() - live.origin;
    live.paused = true; setPaused(true);
    stopHum();
  }

  function resume() {
    if (!live.paused) return;
    const t = live.pausedAt;
    live.origin = performance.now() - t;
    resumeMatch(live.match, t);
    live.drumNext = Math.ceil(t / live.match.period);
    live.paused = false; live.counting = true;
    setPaused(false); setCounting(true); setCombo(0);
    live.hum = crowd();
  }

  /** One player's tap: judge it against the beat clock, then answer within the same frame (sound, flash, combo). */
  function pullAt(side: Side, stamp: number) {
    if (live.phase !== "play" || live.paused) return;
    const grade = tap(live.match, side, stamp - live.origin), p = live.match.sides[side];
    if (grade === "perfect" || grade === "good") {
      grunt();
      if (grade === "perfect") { creak(); if (!slowRef.current) buzz(10); }
      if (p.combo >= 5 && p.combo % 5 === 0) sfx.combo(p.combo / 5 - 1);
      if (side === 0 || live.mode === "solo") live.recentSlips = 0;
    } else if (grade === "off" || grade === "extra") {
      scuff();
      live.recentSlips++;
      if (live.mode === "solo" && performance.now() - live.shookAt > 600) { live.shookAt = performance.now(); shake(padRef.current); }
    }
    if (live.mode === "solo") { setCombo(p.combo); setCoach(live.recentSlips >= 3); }
  }

  function finish() {
    live.ended = true;
    stopHum();
    const m = live.match;
    if (live.mode === "duo") {
      setDuoWin({ winner: m.winner ?? -1, beats: m.beats });
      if (m.winner === 0 || m.winner === 1) {
        cheer(); sfx.win();
        confetti({ colors: [duoTeam(m.winner).shirt, "#ffffff", "#d62828", "#f4a261"], y: m.winner === 0 ? 0.7 : 0.3 });
        setLast({ kind: "duo", win: { winner: m.winner, beats: m.beats } });
      } else sfx.good();
      setPhase("over");
      return;
    }
    const p = m.sides[0], lvl = m.level;
    if (m.winner === 0) {
      const stars = starsOf(lvl, m.beats), before = levels.stars[lvl] ?? 0;
      levels.record(lvl, stars);
      const newBest = best !== null && m.beats < best;
      submitBest(m.beats);
      setResult({ won: true, beats: m.beats, hits: hitsOf(p), perfect: p.perfect, stars, improved: before > 0 && stars > before, newBest, slips: p.slips, missed: p.missed, timeout: m.beats >= MAX_BEATS });
      setLast({ kind: "solo", shared: { level: lvl, seed: live.seed, beats: m.beats, hits: hitsOf(p) } });
      cheer();
      if (lvl === LEVEL_COUNT) { sfx.levelUp(); confetti({ colors: [US.shirt, team.shirt, "#d62828", "#ffffff"] }); }
      else if (stars === 3 || newBest) { sfx.win(); confetti({ colors: [US.shirt, "#d62828", "#ffffff", "#2a9d8f"] }); }
      else sfx.good();
    } else {
      setResult({ won: false, beats: m.beats, hits: hitsOf(p), perfect: p.perfect, stars: 0, improved: false, newBest: false, slips: p.slips, missed: p.missed, timeout: m.beats >= MAX_BEATS });
      sfx.lose();
      shake(board.current);
    }
    setPhase("over");
  }

  /** Preview images only (`&og=1` on a link): the friend's result as a finished card. Saves nothing on the phone. */
  function demo(found: Shared) {
    setResult({ won: true, beats: found.beats, hits: found.hits, perfect: found.hits, stars: starsOf(found.level, found.beats), improved: false, newBest: false, slips: 0, missed: 0, timeout: false });
    setLast({ kind: "solo", shared: { level: found.level, seed: found.seed, beats: found.beats, hits: found.hits } });
    setName(found.name);
    live.match.x = 1;
    setPhase("over");
  }

  function step() {
    if (live.phase !== "play" || live.paused) return;
    const m = live.match, t = performance.now() - live.origin;
    update(m, t);
    // Each drum stroke is scheduled a moment ahead so it sounds right on the beat the ring shows.
    while (live.drumNext * m.period - t < 90) {
      const k = live.drumNext;
      drum(k < m.playFrom ? "count" : (k - m.playFrom) % 2 === 0 ? "strong" : "weak", Math.max(0, (k * m.period - t) / 1000));
      live.drumNext++;
    }
    if (live.counting && countIn(m, t) === 0) { live.counting = false; setCounting(false); }
    const remaining = MAX_BEATS - m.beats;
    if (remaining <= 10 && remaining !== live.left) { live.left = remaining; setLeft(remaining); }
    live.hum?.set(Math.abs(m.x));
    if (m.winner !== null && !live.ended) finish();
  }

  /** Fills a drum's look for one side this frame (no allocation: the strings are fixed). */
  function fillLook(target: DrumLook, side: Side, t: number, phaseNow: number) {
    const m = live.match, p = m.sides[side], playing = live.phase === "play";
    target.phase = phaseNow; target.calm = live.calm;
    const since = t - p.gradeAt;
    target.hit = playing && since >= 0 && since < 260 && WORD[p.grade] ? 1 - since / 260 : 0;
    target.hitColor = HIT_COLOR[p.grade];
    target.sub = "";
    if (live.phase === "ready") {
      target.word = live.mode === "solo" ? "শুরু করো" : live.ready[side] ? "তৈরি ✓" : "চাপো";
      target.sub = live.mode === "solo" ? "" : live.ready[side] ? "অন্যজনের অপেক্ষা" : "তৈরি হলে";
    } else if (!playing) target.word = "";
    else {
      const count = countIn(m, t);
      if (count) { target.word = COUNT[Math.min(3, count)]; target.sub = "গুনে নাও"; }
      else if (since >= 0 && since < 450 && WORD[p.grade]) { target.word = WORD[p.grade]; target.sub = COMBO[Math.min(MAX_BEATS, p.combo)]; }
      else { target.word = phaseNow > 0.5 ? "হেঁই" : "য়ো"; target.sub = COMBO[Math.min(MAX_BEATS, p.combo)]; }
    }
  }

  function draw() {
    const m = live.match, playing = live.phase === "play";
    const t = live.paused ? live.pausedAt : performance.now() - live.origin;
    const phaseNow = playing ? beatPhase(t, m.period) : live.phase === "ready" ? beatPhase(performance.now(), m.period) : 0.99;
    live.pose.x = m.x; live.pose.lean0 = m.sides[0].lean; live.pose.lean1 = m.sides[1].lean;
    if (live.mode === "duo") {
      const c = live.duoCtx, f = live.duo, bg = live.duoBg;
      if (!c || !f || !bg) return;
      c.drawImage(bg, 0, 0, f.w, f.h);
      drawScene(c, f, live.pose, US.shirt, THEM.shirt);
      const r = Math.min(f.w * 0.16, f.h * 0.09);
      fillLook(live.looks[0], 0, t, phaseNow);
      fillLook(live.looks[1], 1, t, phaseNow);
      drawDrum(c, f.w * 0.77, f.h * 0.78, r, live.looks[0], f);
      drawDrum(c, f.w * 0.23, f.h * 0.22, r, live.looks[1], f, Math.PI);
      return;
    }
    const c = live.fieldCtx, f = live.field, bg = live.fieldBg;
    if (c && f && bg) {
      c.drawImage(bg, 0, 0, f.w, f.h);
      drawScene(c, f, live.pose, US.shirt, teamOf(m.level || 1).shirt);
    }
    const pc = live.padCtx, pf = live.pad;
    if (pc && pf) {
      pc.clearRect(0, 0, pf.w, pf.h);
      fillLook(live.looks[0], 0, t, phaseNow);
      drawDrum(pc, pf.w / 2, pf.h / 2, pf.h * 0.36, live.looks[0], pf);
    }
  }

  const looping = !paused && phase !== "over" && (duo || boardInView);
  useGameLoop(step, draw, looping);

  // The solo field and drum pad: sized to the container, redrawn on resize.
  useEffect(() => {
    const box = board.current, field = fieldCanvas.current, pad = padCanvas.current;
    if (!box || !field || !pad) return;
    live.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const height = Math.round(width * FIELD_RATIO);
      field.style.width = `${width}px`; field.style.height = `${height}px`;
      pad.style.width = `${width}px`; pad.style.height = `${PAD_H}px`;
      live.field = soloField(width, height);
      live.fieldCtx = fitCanvas(field, width, height);
      live.fieldBg = paintBackground(live.fieldBg, live.field);
      live.pad = makeField(width, PAD_H, 0, 0, PAD_H / 190);
      live.padCtx = fitCanvas(pad, width, PAD_H);
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // The two-player layer fills the phone; it is sized to the window and the page behind it stops scrolling.
  useEffect(() => {
    if (!duo) return;
    const layer = duoLayer.current, canvas = duoCanvas.current;
    if (!layer || !canvas) return;
    const root = document.documentElement, overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const layout = () => {
      const width = layer.clientWidth, height = layer.clientHeight;
      if (!width || !height) return;
      live.duo = duoField(width, height);
      live.duoCtx = fitCanvas(canvas, width, height);
      live.duoBg = paintBackground(live.duoBg, live.duo);
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(layer);
    return () => { observer.disconnect(); root.style.overflow = overflow; };
  }, [duo]);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      chosen.current = true;
      live.mode = "solo"; setModeState("solo");
      setFriend(found); setLevel(found.level); setSeed(found.seed);
      toReady("solo", found.level);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(found);
    };
    const hide = () => { if (document.hidden) pause(); };
    setSite(window.location.host);
    toReady("solo", 1);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopHum();
    };
  }, []);

  // Open at the furthest level this phone has reached, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    setLevel(levels.unlocked);
    toReady("solo", levels.unlocked);
  }, [levels.loaded]);

  // Scrolling the solo field away mid-match pauses it: the beat clock is real time and would run on unseen.
  useEffect(() => { if (!boardInView && !duo) pause(); }, [boardInView]);
  useEffect(() => { draw(); }, [slow, phase, ready]);

  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    loadCardFonts(`রশি টানাটানি লেভেল ১২৩ রাফি ${card.kicker} ${card.line}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `cardKey` encodes everything the card draws.
  }, [cardKey, format, site]);

  function openDuo() {
    if (live.mode === "duo") return;
    live.mode = "duo"; setModeState("duo");
    setDuoWin(null);
    toReady("duo", level);
    sfx.tap();
  }
  function closeDuo() {
    live.mode = "solo"; setModeState("solo");
    toReady("solo", level);
  }
  function duoInput(side: Side, stamp: number) {
    if (live.paused) return;
    if (live.phase === "ready") {
      if (live.ready[side]) return;
      live.ready[side] = true;
      setReady([live.ready[0], live.ready[1]]);
      sfx.tap();
      if (live.ready[0] && live.ready[1]) start(0, newSeed());
      return;
    }
    pullAt(side, stamp);
  }

  function soloAction(stamp: number) {
    if (live.paused) { resume(); return; }
    if (live.phase === "ready") start(level);
    else if (live.phase === "play") pullAt(0, stamp);
  }

  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("[data-no-tap]") || live.paused) return;
    if (live.phase === "over") return;
    soloAction(stampOf(event));
  }
  function onPadClick(event: SyntheticEvent<HTMLButtonElement, MouseEvent>) {
    // Only a click with no pointer behind it (a screen reader, or a key the page didn't already handle).
    if (event.nativeEvent.detail !== 0 || performance.now() - live.keyAt < 800) return;
    soloAction(performance.now());
  }
  const zoneDown = (side: Side) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    duoInput(side, stampOf(event));
  };

  // ---- keys: Space/Enter (or ↑↓) pull alone; with two players, A pulls for the top and L (or Enter) for the bottom ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key;
    if (live.mode === "duo") {
      if (key === "Escape") { event.preventDefault(); if (live.phase === "play" && !live.paused) pause(); else closeDuo(); return; }
      const lower = key.toLowerCase(), side: Side | null = lower === "a" ? 1 : lower === "l" || key === "Enter" || key === " " ? 0 : null;
      if (side === null || target?.closest?.("button")) return;
      event.preventDefault();
      if (!event.repeat) duoInput(side, stampOf(event));
      return;
    }
    if (!boardInView || ![" ", "Enter", "ArrowUp", "ArrowDown"].includes(key)) return;
    if (target?.closest?.("button, a, summary") && !target.closest(".rt-pad")) return;
    event.preventDefault();
    if (event.repeat) return;
    live.keyAt = performance.now();
    if (live.phase === "over") {
      if (result?.won && level < LEVEL_COUNT) start(level + 1);
      else start(level);
      return;
    }
    soloAction(stampOf(event));
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  const total = totalStars(levels.stars);
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const newcomer = !levels.stars[1] && level === 1 && !friend;
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });

  function statusLine() {
    if (phase === "ready") return newcomer ? "ঢোলে চাপো, খেলা শুরু। তারপর রিং ঢোলের কিনারায় মিশলেই চাপো।" : `আমরা বনাম ${team.name}। ঢোলে চাপলেই শুরু।`;
    if (counting) return "গুনে নাও ৩, ২, ১। তারপর প্রতি ঢোলে একবার চাপো।";
    if (coach) return "এলোপাতাড়ি চাপলে রশি ফসকায়। এক ঢোলে একবার।";
    if (left <= 10) return `আর ${bn(left)} ঢোল। তারপর ফিতা যেদিকে, জয় সেদিকে।`;
    return "রিং ঢোলের কিনারায় মিশলেই চাপো।";
  }

  const duoOver = duo && phase === "over" && duoWin;
  function zoneText(side: Side) {
    if (!duoOver) return null;
    if (duoWin.winner === -1) return "সমান সমান";
    return duoWin.winner === side ? "জিতলে!" : "এবার হলো না";
  }

  return (
    <div className="rt" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="rt-friend" aria-labelledby="rt-friend-title">
          <h2 id="rt-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend.name)}</p>
        </section>
      )}

      <div className="rt-modes" role="group" aria-label="কীভাবে খেলবে">
        <button type="button" aria-pressed={!duo} onClick={() => { if (duo) closeDuo(); }}>একা</button>
        <button type="button" aria-pressed={duo} onClick={openDuo}>দুজনে এক ফোনে</button>
      </div>

      <div className="rt-hud">
        <p className="rt-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        {phase === "play" && combo >= 3 ? <p className="rt-chip" key={Math.floor(combo / 5)}><span className="gx-pop">টানা {bn(combo)}</span></p> : null}
      </div>

      <div className="rt-board" ref={board} onPointerDown={onBoardDown} onContextMenu={event => event.preventDefault()}>
        <div className="rt-field">
          <canvas ref={fieldCanvas} role="img" aria-label={`স্কুলমাঠে রশি টানাটানি: নিচে আমাদের হলুদ দল, ওপরে ${team.name}। লাল ফিতা ${live.match.x > 0.05 ? "আমাদের দিকে" : live.match.x < -0.05 ? "ওদের দিকে" : "মাঝখানে"}।`} />
          {paused && !duo && (
            <div className="rt-overlay" data-no-tap>
              <p>খেলা থেমে আছে।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          )}
        </div>
        {phase !== "over" || duo ? (
          <>
            <p className="rt-status" role="status" aria-live="polite">{statusLine()}</p>
            <button type="button" className="rt-pad" ref={padRef} onClick={onPadClick} aria-label={phase === "play" ? "ঢোল: প্রতি তালে একবার চাপো" : "খেলা শুরু করো"}>
              <canvas ref={padCanvas} aria-hidden="true" />
            </button>
          </>
        ) : result?.won ? (
          <div className="rt-end" role="status" data-no-tap>
            <StarReveal count={result.stars} />
            <p className="rt-end-line">{clearLine(level)}</p>
            <p className="rt-end-note">
              {beatsText(result.beats)} জয়, {bn(result.hits)}টা টান তালে।{" "}
              {rival ? compareLine(result.beats, rival.beats, rival.name)
                : result.newBest ? `এই লেভেলে নতুন রেকর্ড।`
                : result.improved ? `এই লেভেলে এবার ${bn(result.stars)} তারা।` : nearMissLine(level, result.beats)}
            </p>
            <div className="rt-actions">
              {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => start(level + 1)}>পরের লেভেল</button>}
              <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => start(level)}>আবার খেলো</button>
            </div>
            {best !== null && <p className="rt-best">এই লেভেলে এই ফোনের সেরা: {beatsText(best)}</p>}
            {shared && <button type="button" className="kit-link rt-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
          </div>
        ) : result ? (
          <div className="rt-end rt-lost" role="status" data-no-tap>
            <p className="rt-lost-title">{team.name} জিতল</p>
            <p className="rt-lost-line">{lossLine(result)}</p>
            {rival && <p className="rt-end-note">{rival.name || "বন্ধু"} এই দলকে {beatsText(rival.beats)} হারিয়েছিল।</p>}
            <button type="button" className="kit-primary rt-again" onClick={() => start(level)}>আরেকবার</button>
          </div>
        ) : null}
      </div>

      <div className="rt-prefs">
        <button type="button" className="rt-pill" aria-pressed={slow} disabled={phase === "play"} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={on => { if (!on) live.hum = null; else if (live.phase === "play" && !live.paused) live.hum ??= crowd(); }} />
      </div>

      <details className="rt-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} onPick={pick => { chosen.current = true; setLevel(pick); toReady("solo", pick); toTop(); }} />
      </details>

      {duo && (
        <div className="rt-duo" ref={duoLayer} onContextMenu={event => event.preventDefault()}>
          <canvas ref={duoCanvas} aria-hidden="true" />
          <div className="rt-zone rt-top" onPointerDown={zoneDown(1)} role="group" aria-label={`ওপরের অর্ধেক: ${THEM.name}`}>
            <p className="rt-zone-name">{THEM.name}</p>
            {zoneText(1) && <p className="rt-zone-result">{zoneText(1)}</p>}
          </div>
          <div className="rt-zone rt-bottom" onPointerDown={zoneDown(0)} role="group" aria-label={`নিচের অর্ধেক: ${US.name}`}>
            <p className="rt-zone-name">{US.name}</p>
            {zoneText(0) && <p className="rt-zone-result">{zoneText(0)}</p>}
          </div>
          <div className="rt-mid">
            {phase === "play" && !paused && <button type="button" className="rt-close" aria-label="খেলা থামাও" onClick={pause}>✕</button>}
            {phase === "ready" && <button type="button" className="rt-close" aria-label="দুজনের খেলা বন্ধ করো" onClick={closeDuo}>✕</button>}
            {phase === "play" && !paused && left <= 10 && <span className="rt-left">আর {bn(left)} ঢোল</span>}
            {(paused || duoOver) && (
              <div className="rt-mid-actions">
                {paused ? <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
                  : <button type="button" className="kit-primary" onClick={() => start(0, newSeed())}>আরেকবার</button>}
                <button type="button" className="kit-secondary" onClick={() => { const had = !!duoWin && duoWin.winner !== -1; closeDuo(); if (had) setTimeout(seeCard, 50); }}>{duoOver && duoWin.winner !== -1 ? "কার্ড দেখো" : "বের হও"}</button>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="rt-result" id="result" ref={resultBox} aria-labelledby="rt-result-title">
        <h2 id="rt-result-title">
          {shared ? <>{teamOf(shared.level).obj} <em>{beatsText(shared.beats)}</em> হারালে</>
            : last?.kind === "duo" ? <>{duoTitle({ winner: last.win.winner, name: "" })}, <em>{beatsText(last.win.beats)}</em></>
            : "জিতলে তোমার কার্ড"}
        </h2>
        <p>{card ? card.line : "কোনো দলকে হারালে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই দল আর একই ঢোল পাবে।"}</p>
        {card && (
          <div className="rt-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`রশি টানাটানির কার্ড: ${card.kicker}। ${card.big}।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="rt-share">
              <label className="rt-name">
                <span>{shared ? "তোমার নাম" : "জয়ী দলের নাম"} <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              {shared ? (
                <ShareBar tool={TOOL} fileName={`roshi-tana-level-${shared.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                  hint="বন্ধু লিংক খুললে একই দল আর একই ঢোল পাবে। হিসাবটা তোমার ফোনের।" />
              ) : last?.kind === "duo" ? (
                <ShareBar tool={TOOL} fileName="roshi-tana-duo.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${cardKey}|${format}`} caption={duoCaption({ ...last.win, name })}
                  hint="দুজনের খেলার লিংকে শুধু খেলার পাতাটা যায়।" />
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
