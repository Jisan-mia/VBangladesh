"use client";
// IP: what we avoided — no magazine's or app's name, layout, mascot or pictures; every scene is our own drawing of a Bangladeshi
// bazaar, village, ghat or lane, composed in code, with our own sounds.
// The rules, the clock and what the phone keeps are pure (lib/puzzle.ts, lib/round.ts, lib/session.ts, lib/save.ts); this file
// feeds them taps in scene units and performance.now(), paints the pictures (components/layers.ts, paint.hot.ts) and plays the sounds.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, silenceScheduled, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cardBlob, drawCard } from "../lib/card";
import { ladderDeal, legacyDeal, type Deal } from "../lib/deal";
import { HINT_SECONDS, STAGE_COUNT, TEACH_SEED, WORLDS, WRONG_FOR } from "../lib/levels";
import { hintCircle, LAMP, VARIANTS } from "../lib/puzzle";
import { canHint, hintRound, isDone, moveLamp, newRound, slowest, starsOf, tapRound, timeOf, type Round } from "../lib/round";
import * as session from "../lib/session";
import { LADDER, OLD_LEVELS_KEY, OPEN_KEY, TOOL, bestSlug, openAfter, playable, readOpen, recommended } from "../lib/save";
import { SCENE_H, SCENE_W } from "../lib/shapes";
import { edgeDanger, starTimeUsed, starsOnTrack } from "../lib/tick.hot";
import {
  bn, caption, cardLine, clearLine, clockText, compareLine, hintLine, levelLabel, nearMiss, parseShared, placeOf, sharedHash, timeText, KIND_WORDS, type Shared,
} from "../lib/challenge";
import { AskCard, type Ask } from "./ask";
import { Finish, type Action, type FinishStats } from "./finish";
import { KindIcon } from "./kind-icon";
import { buildLayers, lampHole, type Layers } from "./layers";
import { LevelSheet } from "./level-sheet";
import { paintDark, paintPicture } from "./paint.hot";
import { sound } from "./sound";
import { StartCard } from "./start-card";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const NIGHT = "rgba(9,12,30,0.93)";
const FONT_SAMPLE = `ভুল কোথায়? ${Object.keys(VARIANTS).join(" ")} ${Object.values(VARIANTS).join(" ")}`;
const ARROWS: Readonly<Record<string, readonly [number, number]>> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

type Finished = FinishStats & { previousBest: number | null; firstClear: boolean; at: number };
type Mark = { id: number; side: 0 | 1; x: number; y: number; kind: "miss" | "echo" | "pop"; text?: string };

export function BhulGame() {
  const [deal, setDeal] = useState<Deal>(() => ladderDeal(1, TEACH_SEED));
  const [round, setRound] = useState<Round>(() => newRound(false));
  const [run, setRun] = useState<session.Session>(() => session.ready());
  const [seconds, setSeconds] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [note, setNote] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [cursor, setCursor] = useState<{ side: 0 | 1; x: number; y: number } | null>(null);
  const [teach, setTeach] = useState(-1);
  const [lit, setLit] = useState(false);
  const [shook, setShook] = useState(-1);
  const [picW, setPicW] = useState(0);
  const [fonts, setFonts] = useState(0);
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const { puzzle, level, legacy } = deal, stage = puzzle.stage, world = WORLDS[stage.world];
  const levels = useLevels(LADDER, STAGE_COUNT);
  const [best, submitBest] = useBest(bestSlug(level, legacy), false);

  const root = useRef<HTMLDivElement>(null);
  const pics = useRef<HTMLDivElement>(null);
  const scenes = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)] as const;
  const darks = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)] as const;
  const layers = useRef<[Layers | null, Layers | null]>([null, null]);
  const hole = useRef<HTMLCanvasElement | null>(null);
  const foundBoxes = useRef(new Float64Array(4 * 8));
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const press = useRef<{ id: number; side: 0 | 1; rect: DOMRect } | null>(null);
  const timers = useRef<number[]>([]);
  const markId = useRef(0);
  const [built, setBuilt] = useState(0);
  // The latest of everything, for listeners that outlive a render (blur, keys, pointer moves, the paint loop).
  const now = useRef({ deal, round, run, finish, sheet, ask, slow });
  now.current = { deal, round, run, finish, sheet, ask, slow };

  // Dev builds only: the live state, for play-test autopilots (ai_docs/statecharts/bhul-kothay/README.md).
  useEffect(() => { if (process.env.NODE_ENV !== "production") (window as unknown as { __bhul: typeof now }).__bhul = now; }, []);

  const elapsed = () => session.elapsed(now.current.run, performance.now());
  const later = (ms: number, then: () => void) => { timers.current.push(window.setTimeout(then, ms)); };
  function clearTimers() { timers.current.forEach(window.clearTimeout); timers.current = []; }
  function addMark(mark: Omit<Mark, "id">, ms: number) {
    const id = ++markId.current;
    setMarks(list => [...list.slice(-6), { ...mark, id }]);
    later(ms, () => setMarks(list => list.filter(item => item.id !== id)));
  }

  const rival = friend && friend.level === level && friend.legacy === legacy && (legacy || friend.seed === deal.seed) ? friend : null;
  const shared: Shared | null = finish ? { level, seed: deal.seed, seconds: finish.time, wrong: round.wrong, hints: round.steps, name, legacy } : null;
  const shareState = shared ? sharedHash(shared) : "";

  /** Puts a level on its start card. Everything about the last one goes: its marks, timers, notes, hints and result. */
  function load(next: Deal) {
    press.current = null;
    clearTimers();
    silenceScheduled();
    const r = newRound(next.puzzle.stage.dark), s = session.ready();
    now.current = { ...now.current, deal: next, round: r, run: s, finish: null, sheet: false, ask: null };
    setDeal(next); setRound(r); setRun(s); setSeconds(0); setFinish(null); setNote(""); setMarks([]); setCursor(null);
    setTeach(-1); setLit(false); setShook(-1); setSheet(false); setAsk(null);
  }
  /** A ladder level: level 1 opens on its teaching pair until it has stars, every other play is fresh pictures. */
  const pageDeal = (to: number) => ladderDeal(to, to === 1 && !levels.stars[1] ? TEACH_SEED : newSeed());
  const friendDeal = (got: Shared) => got.legacy ? legacyDeal(got.level) : ladderDeal(got.level, got.seed);

  function start() {
    const r = now.current.run;
    if (r.phase !== "ready" || now.current.sheet || now.current.ask) return;
    const next = session.begin(r, performance.now());
    now.current.run = next;
    setRun(next);
    sound.start(now.current.deal.puzzle.stage.world);
    const d = now.current.deal;
    if (d.level === 1 && d.seed === TEACH_SEED && !d.legacy) {
      // The very first play: if nothing is found in 6 seconds, a soft finger shows where the plainest one is. Free.
      later(6000, () => { if (!now.current.round.found.length && now.current.run.phase === "playing") setTeach(0); });
    }
  }
  function pauseFor(why: session.Why) {
    press.current = null;
    const r = now.current.run;
    if (r.phase !== "playing" && r.phase !== "paused") return;
    const next = session.pause(r, performance.now(), why);
    now.current.run = next;
    setRun(next);
    setSeconds(session.elapsed(next, performance.now()));
  }
  function resumeFrom(why: session.Why) {
    const next = session.resume(now.current.run, performance.now(), why);
    now.current.run = next;
    setRun(next);
  }
  function replay() {
    const { deal: d } = now.current;
    // A friend's pictures replay the same pair; a level is fresh pictures (never a memory test).
    load(rival || d.legacy ? d : pageDeal(d.level));
  }

  // The player's menu: pause stops the clock and covers the pictures; চালিয়ে যাও starts it again; নতুন করে শুরু deals again.
  const player = useGamePlayer({ onPause: () => pauseFor("away"), onResume: () => resumeFrom("away"), onRestart: replay });

  // Away without the player (or before its menu engages): blur and a hidden tab stop the clock and let go of the finger too.
  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
    };
  }, []);

  // The clock: a 250 ms tick while playing; the reducer holds the truth.
  useEffect(() => {
    if (run.phase !== "playing") return;
    const id = window.setInterval(() => setSeconds(session.elapsed(now.current.run, performance.now())), 250);
    return () => window.clearInterval(id);
  }, [run]);

  // Boot once this phone's stars are read: your own open levels (the old game's migrated once), then a friend's pictures from
  // the link, or the level to play next.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const { open: mine, migrated } = readOpen(read(OPEN_KEY), levels.stars, read(OLD_LEVELS_KEY));
    if (migrated) write(OPEN_KEY, String(mine));
    setOpen(mine);
    setSite(window.location.host);
    setBooted(true);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      setVisit(got.legacy ? 0 : got.level);
      load(friendDeal(got));
      return true;
    };
    if (!fromHash()) load(pageDeal(recommended(mine, levels.stars)));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(FONT_SAMPLE).then(() => { if (!cancelled) setFonts(1); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ---- the pictures: layers built once per level and size, painted per frame only while something moves ----
  const mounted = run.phase !== "ready";
  useEffect(() => {
    const box = pics.current?.querySelector(".bk-pic");
    if (!box) return;
    const measure = () => setPicW(Math.round(box.getBoundingClientRect().width));
    const watch = new ResizeObserver(measure);
    watch.observe(box);
    measure();
    return () => watch.disconnect();
  }, [mounted]);

  function paint() {
    const t = session.elapsed(now.current.run, performance.now()), speed = now.current.slow ? 0.5 : 1;
    for (const side of [0, 1] as const) {
      const layer = layers.current[side], canvas = scenes[side].current;
      if (!layer || !canvas) continue;
      const c = canvas.getContext("2d");
      if (c) paintPicture(c, layer.width, layer.height, layer.images, layer.data, layer.count, layer.scale, t, speed);
    }
  }
  function paintNight() {
    const r = now.current.round, p = now.current.deal.puzzle;
    if (!r.lamp) return;
    hole.current ??= lampHole();
    const boxes = foundBoxes.current;
    r.found.forEach((index, at) => {
      if (at >= 8) return;
      const region = p.diffs[index].region;
      boxes[at * 4] = region.x; boxes[at * 4 + 1] = region.y; boxes[at * 4 + 2] = region.w; boxes[at * 4 + 3] = region.h;
    });
    for (const side of [0, 1] as const) {
      const layer = layers.current[side], canvas = darks[side].current;
      if (!layer || !canvas) continue;
      if (canvas.width !== layer.width || canvas.height !== layer.height) { canvas.width = layer.width; canvas.height = layer.height; }
      const c = canvas.getContext("2d");
      if (c) paintDark(c, layer.width, layer.height, layer.scale, NIGHT, hole.current, r.lamp.x, r.lamp.y, LAMP, boxes, Math.min(8, r.found.length));
    }
  }

  useEffect(() => {
    if (!mounted || picW <= 0) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1), scale = (picW * ratio) / SCENE_W;
    for (const side of [0, 1] as const) {
      const layer = buildLayers(puzzle, side, scale), canvas = scenes[side].current;
      layers.current[side] = layer;
      if (canvas) { canvas.width = layer.width; canvas.height = layer.height; }
    }
    setBuilt(value => value + 1);
    paint();
    paintNight();
  }, [deal, picW, fonts, mounted]);

  useEffect(() => { paintNight(); }, [round.lamp, round.found.length, built]);
  const moving = Boolean(layers.current[0]?.moving) && built > 0;
  useGameLoop(() => {}, paint, moving && run.phase === "playing");

  // ---- choices: the sheet stops the clock; leaving a started level asks first ----
  function openSheet() {
    if (now.current.run.phase === "playing") pauseFor("sheet");
    else if (now.current.run.phase === "paused") pauseFor("sheet");
    setSheet(true);
  }
  function closeSheet() { setSheet(false); resumeFrom("sheet"); }
  function stay() { setAsk(null); setSheet(false); resumeFrom("sheet"); }
  const roundLabel = () => {
    const { deal: d, round: r } = now.current;
    return `${levelLabel(d.level, d.legacy)} · ${bn(r.found.length)}/${bn(d.puzzle.diffs.length)}, ${clockText(timeOf(r, elapsed()))}`;
  };
  /** Runs `then` now, or, when a started level would be thrown away, after a yes on the ask card. */
  function leave(then: () => void, after: string) {
    if (!session.started(now.current.run)) { then(); return; }
    pauseFor("sheet");
    setAsk({ now: roundLabel(), then: after, leave: then });
  }
  function pickLevel(to: number) {
    if (!playable(to, open, visit)) return;
    leave(() => load(friend && !friend.legacy && friend.level === to ? friendDeal(friend) : pageDeal(to)), `লেভেল ${bn(to)}, নতুন ছবি`);
  }

  // ---- taps ----
  function solved(r: Round) {
    const stamp = performance.now(), s = session.finish(now.current.run, stamp);
    now.current.run = s;
    setRun(s);
    const { deal: d } = now.current, st = d.puzzle.stage;
    const clock = session.elapsed(s, stamp), time = Math.max(1, Math.round(timeOf(r, clock)));
    setSeconds(clock);
    const stars = starsOf(st, time, r.wrong);
    const firstClear = !d.legacy && !levels.stars[d.level];
    if (!d.legacy) {
      levels.record(d.level, stars);
      const opened = openAfter(open, d.level);
      if (opened !== open) { setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best, beaten = submitBest(time) && previousBest !== null;
    const long = slowest(r);
    const done: Finished = {
      time, stars, found: r.found.length, wrong: r.wrong, hints: r.steps, bestStreak: r.bestStreak,
      slowestName: long.index >= 0 && r.found.length > 2 ? d.puzzle.diffs[long.index].name : "", slowestSeconds: long.seconds,
      previousBest, firstClear, at: stamp,
    };
    now.current.finish = done;
    setFinish(done);
    setCursor(null);
    setTeach(-1);
    const big = stars === 3 || beaten || (firstClear && Boolean(st.finale));
    sound.done(st.world, big);
    if (st.dark) { sound.lightsOn(); setLit(true); }
    if (big && !now.current.slow) later(450, () => { if (now.current.finish === done) confetti({ colors: [world.ink, "#f2a900", "#2f8f4e", "#2f6fb2", "#e8964a"] }); });
  }

  /** A tap at scene point (x, y) on one picture. */
  function tap(side: 0 | 1, x: number, y: number) {
    if (!session.canMove(now.current.run)) return;
    const { round: before, deal: d } = now.current, p = d.puzzle, clock = elapsed();
    const { round: after, outcome } = tapRound(before, p, x, y, clock);
    now.current.round = after;
    setRound(after);
    const other: 0 | 1 = side ? 0 : 1;
    if (outcome.kind === "lamp") { sound.lamp(); return; }
    if (outcome.kind === "again") { sound.again(); setNote(`${p.diffs[outcome.index].name} তো আগেই পেয়েছ।`); return; }
    if (outcome.kind === "miss") {
      sound.miss();
      addMark({ side, x, y, kind: "miss" }, 900);
      addMark({ side: other, x, y, kind: "echo" }, 600);
      if (!now.current.slow) { setShook(side); later(240, () => setShook(-1)); }
      setNote(after.wrong === WRONG_FOR.three + 1 ? `ওখানে দুই ছবি একই। ভুল চাপ ${bn(after.wrong)}টা হলো, ★★★ আর হবে না।` : "ওখানে দুই ছবি একই।");
      return;
    }
    const diff = p.diffs[outcome.index], { region } = diff;
    sound.ring(p.stage.world, after.streak - 1);
    setTeach(-1);
    addMark({ side, x: region.x + region.w / 2, y: region.y, kind: "pop", text: diff.name }, 1000);
    if (isDone(after, p)) { setNote(""); solved(after); return; }
    const left = p.diffs.length - after.found.length;
    setNote(`পেয়েছ: ${diff.name}, ${KIND_WORDS[diff.kind]}।${after.streak >= 3 ? ` টানা ${bn(after.streak)}টা।` : ""} ${left === 1 ? "আর ১টা।" : `আর ${bn(left)}টা।`}`);
  }

  function hint() {
    if (!session.canMove(now.current.run)) return;
    const { round: r, deal: d } = now.current;
    const got = hintRound(r, d.puzzle);
    if (!got) return;
    now.current.round = got.round;
    setRound(got.round);
    setTeach(-1);
    sound.hint();
    const diff = d.puzzle.diffs[got.index];
    setNote(hintLine(diff.kind, got.step, diff.name));
  }

  function spot(event: ReactPointerEvent, rect: DOMRect) {
    return [((event.clientX - rect.left) / rect.width) * SCENE_W, ((event.clientY - rect.top) / rect.height) * SCENE_H] as const;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>, side: 0 | 1) {
    if (!event.isPrimary || event.button > 0 || !session.canMove(now.current.run) || now.current.sheet || now.current.ask) return;
    const rect = event.currentTarget.getBoundingClientRect(), [x, y] = spot(event, rect);
    if (now.current.round.lamp) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a synthetic pointer: the drag still works inside the picture */ }
      press.current = { id: event.pointerId, side, rect };
    }
    setCursor(null);
    tap(side, x, y);
  }
  /** In the dark, a finger held down carries the lamp. */
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || held.id !== event.pointerId) return;
    if (!session.canMove(now.current.run)) { press.current = null; return; }
    const [x, y] = spot(event, held.rect), r = now.current.round;
    if (!r.lamp || Math.hypot(x - r.lamp.x, y - r.lamp.y) < 3) return;
    const next = moveLamp(r, x, y);
    now.current.round = next;
    setRound(next);
  }
  const letGo = (event: ReactPointerEvent) => { if (press.current?.id === event.pointerId) press.current = null; };

  // ---- what the result offers ----
  const nextOpen = !legacy && level < STAGE_COUNT && level + 1 <= openAfter(open, level);
  const home = () => pickLevel(recommended(open, levels.stars));
  const primary: Action = legacy ? { label: "তোমার লেভেলে ফেরো", run: home }
    : nextOpen ? { label: "পরের লেভেল", run: () => load(pageDeal(level + 1)) }
    : level === STAGE_COUNT ? { label: "সব লেভেল", run: openSheet }
    : { label: "তোমার লেভেলে ফেরো", run: home };
  const secondary: Action[] = [{ label: "আবার খেলো", run: replay }];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the result shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key, enter = key === "Enter" || key === " ", fresh = !event.repeat;
    if (ask) {
      if (key === "1" || key === "১") { event.preventDefault(); if (fresh) stay(); }
      else if (key === "2" || key === "২") { event.preventDefault(); if (fresh) ask.leave(); }
      return;
    }
    if (sheet) return;
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab: let it do its own job
    if ((key === "p" || key === "P") && fresh && run.phase === "playing") {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor("away");
      return;
    }
    if (run.phase === "ready") { if (enter && fresh) { event.preventDefault(); start(); } return; }
    if (run.phase === "paused") { if (enter) { event.preventDefault(); if (fresh && run.why === "away") resumeFrom("away"); } return; }
    if (run.phase === "over") {
      if (enter) { event.preventDefault(); if (session.resultKeyOk(now.current.run, performance.now(), { at: event.timeStamp, repeat: event.repeat })) primary.run(); }
      return;
    }
    const step = ARROWS[key];
    if (step) {
      event.preventDefault();
      setCursor(at => {
        const from = at ?? { side: 0 as const, x: SCENE_W / 2, y: SCENE_H / 2 };
        return { side: from.side, x: Math.min(SCENE_W - 4, Math.max(4, from.x + step[0] * 12)), y: Math.min(SCENE_H - 4, Math.max(4, from.y + step[1] * 12)) };
      });
      return;
    }
    if (key === "Tab" && cursor) { event.preventDefault(); setCursor({ ...cursor, side: cursor.side ? 0 : 1 }); return; }
    if (enter) { event.preventDefault(); if (fresh) { if (!cursor) setCursor({ side: 0, x: SCENE_W / 2, y: SCENE_H / 2 }); else tap(cursor.side, cursor.x, cursor.y); } return; }
    if ((key === "h" || key === "H") && fresh) { event.preventDefault(); hint(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- the card ----
  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ভুল কোথায়? লেভেল ১২৩ টা অমিলই পেয়েছি শেষ ছবি ${stage.finale} ${name}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, puzzle, stage.world, stage.finale, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `shareState` covers everything the card draws.
  }, [shareState, format, site]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const card = resultBox.current, stageBox = card?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (card && stageBox) stageBox.scrollTo({ top: card.getBoundingClientRect().top - stageBox.getBoundingClientRect().top + stageBox.scrollTop - 8, behavior });
    else card?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the page looks like ----
  const total = puzzle.diffs.length;
  const time = finish ? finish.time : timeOf(round, seconds);
  const onTrack = starsOnTrack(time, stage.three, stage.two);
  const playing = run.phase === "playing";
  const danger = playing && edgeDanger(time, stage.three, stage.two);
  const covered = run.phase === "paused";
  const target = onTrack === 3 ? stage.three : onTrack === 2 ? stage.two : 0;
  const finale = stage.finale;
  const nextWorld = finale && !legacy && stage.world + 1 < WORLDS.length ? WORLDS[stage.world + 1] : null;
  const finishTitle = finish ? (finale ? `${finale}: সব অমিল পেলে` : legacy ? `পুরোনো লেভেল ${bn(level)} শেষ` : `লেভেল ${bn(level)} শেষ`) : "";
  const finishLine = finish && shared ? (rival ? compareLine(finish.time, rival.seconds, rival.name)
    : finale && finish.firstClear ? `${world.of} পাঁচ ছবি শেষ।${nextWorld ? ` এবার ${nextWorld.name}: ${nextWorld.twist}।` : " ছয়টা জগতের সব ছবি শেষ।"}`
    : clearLine(level, legacy, deal.seed)) : "";
  const finishNote = finish ? [
    nearMiss(level, finish.time, finish.wrong, legacy) || (finish.previousBest !== null && finish.time < finish.previousBest ? `নতুন রেকর্ড। আগে লেগেছিল ${timeText(finish.previousBest)}।` : ""),
    best !== null ? `এই ফোনে সেরা ${clockText(best)}।` : "",
  ].filter(Boolean).join(" ") : "";

  const style = { "--world": world.ink, "--world-deep": world.deep, "--paper": world.paper, "--frame": world.frame } as CSSProperties;
  const hinted = round.hinted.filter(index => !round.found.includes(index) && !round.exact.includes(index));
  const exact = round.exact.filter(index => !round.found.includes(index));

  return (
    <div ref={root} className="bk" style={style} data-phase={run.phase} data-calm={slow || undefined} data-finale={finale ? "" : undefined} data-dark={stage.dark || undefined} onClick={dropFocus}>
      {run.phase === "ready" ? (
        <StartCard level={level} legacy={legacy} stage={stage} puzzle={puzzle} stars={legacy ? 0 : levels.stars[level] ?? 0}
          canPrev={!legacy && playable(level - 1, open, visit)} canNext={!legacy && playable(level + 1, open, visit)}
          friend={friend} friendHere={Boolean(rival)} onStart={start} onLevel={pickLevel} onSheet={openSheet} />
      ) : (
        <div className="bk-play">
          <header className="bk-hud">
            <button type="button" className="bk-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`${levelLabel(level, legacy)}, সব লেভেল দেখো`}>
              <KindIcon kind={stage.fresh} />
              <b>{legacy ? `পুরোনো ${bn(level)}` : finale ? "শেষ ছবি" : `লেভেল ${bn(level)}`}</b>
              <span>{finale || placeOf(level, legacy)}</span>
            </button>
            <div className="bk-clock" role="timer" aria-label={`সময় ${timeText(Math.floor(time))}, এখন ${bn(onTrack)} তারার পথে`}>
              <b>{clockText(time)}</b>
              <span className="bk-track" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < onTrack || undefined}>★</i>)}</span>
              <span className="bk-meter" aria-hidden="true"><i style={{ transform: `scaleX(${1 - starTimeUsed(time, stage.three, stage.two)})` }} /></span>
              <small>{target ? `${"★".repeat(onTrack)} ${clockText(target)} পর্যন্ত` : "★ শেষ করলেই"} · <span className="bk-wrong" data-over={round.wrong > WRONG_FOR.three || undefined}>ভুল {bn(round.wrong)}/{bn(WRONG_FOR.three)}</span></small>
              {rival && <small className="bk-rival">{rival.name || "বন্ধু"} {clockText(rival.seconds)}</small>}
            </div>
          </header>

          <div className="bk-progress" data-boss={finale ? "" : undefined} aria-label={`${bn(total)}টার মধ্যে ${bn(round.found.length)}টা অমিল পেয়েছ`} role="img">
            {finale && <span className="bk-boss-name">{finale}</span>}
            <span className="bk-dots">
              {puzzle.diffs.map((_, index) => {
                const got = round.found[index];
                return <i key={index} data-on={got !== undefined || undefined}>{got !== undefined && <KindIcon kind={puzzle.diffs[got].kind} />}</i>;
              })}
            </span>
            {finale && <span className="bk-boss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${1 - round.found.length / total})` }} /></span>}
          </div>

          <div className="bk-pics" ref={pics} data-danger={danger || undefined}>
            {([0, 1] as const).map(side => (
              <div key={side} className="bk-pic" data-shake={shook === side || undefined} data-lit={lit || undefined}
                role="application" aria-label={`ছবি ${bn(side + 1)}। যেখানে দুই ছবি আলাদা, সেখানে চাপো। কিবোর্ডে তীরচিহ্ন দিয়ে দাগ সরাও, এন্টারে চাপ।`}
                onPointerDown={event => onPointerDown(event, side)} onPointerMove={onPointerMove} onPointerUp={letGo} onPointerCancel={letGo} onLostPointerCapture={letGo}>
                <canvas ref={scenes[side]} className="bk-scene" aria-hidden="true" />
                {stage.dark && <canvas ref={darks[side]} className="bk-night" aria-hidden="true" />}
                <svg className="bk-marks" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} aria-hidden="true">
                  {round.found.map(index => {
                    const { region } = puzzle.diffs[index];
                    return <ellipse key={`${deal.seed}-${index}`} className="bk-ring" pathLength={1}
                      cx={region.x + region.w / 2} cy={region.y + region.h / 2} rx={region.w / 2 + 2} ry={region.h / 2 + 2} />;
                  })}
                  {hinted.map(index => { const circle = hintCircle(puzzle, index); return <circle key={`h${index}`} className="bk-hint" cx={circle.x} cy={circle.y} r={circle.r} />; })}
                  {exact.map(index => { const { region } = puzzle.diffs[index]; return <rect key={`x${index}`} className="bk-hint bk-hint-exact" x={region.x} y={region.y} width={region.w} height={region.h} rx={10} />; })}
                  {teach >= 0 && playing && (() => {
                    const index = puzzle.diffs.reduce((bestAt, diff, at) => diff.effort < puzzle.diffs[bestAt].effort ? at : bestAt, 0), { region } = puzzle.diffs[index];
                    return <circle className="bk-teach" cx={region.x + region.w / 2} cy={region.y + region.h / 2} r={16} />;
                  })()}
                  {marks.filter(mark => mark.side === side && mark.kind !== "pop").map(mark => mark.kind === "miss"
                    ? <path key={mark.id} className="bk-miss" d={`M${mark.x - 7} ${mark.y - 7}L${mark.x + 7} ${mark.y + 7}M${mark.x + 7} ${mark.y - 7}L${mark.x - 7} ${mark.y + 7}`} />
                    : <circle key={mark.id} className="bk-echo" cx={mark.x} cy={mark.y} r={10} />)}
                  {cursor?.side === side && <g className="bk-cursor"><circle cx={cursor.x} cy={cursor.y} r={9} /><path d={`M${cursor.x - 15} ${cursor.y}h10M${cursor.x + 5} ${cursor.y}h10M${cursor.x} ${cursor.y - 15}v10M${cursor.x} ${cursor.y + 5}v10`} /></g>}
                </svg>
                {marks.filter(mark => mark.side === side && mark.kind === "pop").map(mark => (
                  <span key={mark.id} className="bk-pop" style={{ left: `${(mark.x / SCENE_W) * 100}%`, top: `${(mark.y / SCENE_H) * 100}%` }}>{mark.text}</span>
                ))}
              </div>
            ))}
            {covered && (
              <div className="bk-cover">
                <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
                <p className="bk-cover-small">{clockText(time)} · {bn(round.found.length)}/{bn(total)} অমিল</p>
                {run.why === "away" && <button type="button" className="kit-primary" onClick={() => resumeFrom("away")}>চালিয়ে যাও</button>}
              </div>
            )}
          </div>

          <p className="bk-msg" role="status" aria-live="polite">
            {note || (teach >= 0 ? "আঙুলের দাগটা দেখো: এক ছবিতে আছে, আরেকটায় নেই।" : stage.dark && playing && !round.found.length ? "আলোর বাইরে চাপলে হারিকেন সরে, আঙুল টেনেও নেওয়া যায়।" : playing ? `আর ${bn(total - round.found.length)}টা বাকি।` : "")}
          </p>

          {finish && shared ? (
            <Finish stats={finish} slow={slow} title={finishTitle} line={finishLine} note={finishNote} primary={primary} secondary={secondary} onSeeCard={seeCard} />
          ) : (
            <div className="bk-tools">
              <button type="button" className="bk-tool" onClick={hint} disabled={!playing || !canHint(round, puzzle)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m15.5 15.5 5 5" /></svg>হিন্ট <small>+{bn(HINT_SECONDS)} সে.</small>
              </button>
              <button type="button" className="bk-tool" onClick={openSheet}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z" /></svg>সব লেভেল
              </button>
            </div>
          )}
        </div>
      )}

      {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={legacy ? 0 : level} next={recommended(open, levels.stars)} onPick={pickLevel} onClose={closeSheet} />}
      {ask && <AskCard ask={ask} onStay={stay} />}

      {finish && shared && (
        <section className="bk-result" id="result" ref={resultBox} aria-labelledby="bk-result-title">
          <h2 id="bk-result-title">লেভেল {bn(level)}: <em>{bn(total)}টা অমিলই</em> পেয়েছ, কার্ড তৈরি</h2>
          <p>{cardLine(shared)}</p>
          <div className="bk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
                aria-label={`ভুল কোথায়?-এর কার্ড: ${levelLabel(level, legacy)}, ${timeText(shared.seconds)}, ${bn(finish.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bk-share">
              <label className="bk-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`bhul-kothay-level-${level}.png`} makeImage={() => cardBlob(shared, puzzle, stage.world, stage.finale, format, site)} imageKey={`${shareState}|${format}`}
                caption={caption(shared)} state={shareState} hint="বন্ধু লিংক খুললে একই দুটো ছবি পাবে। সময় আর ভুল চাপের হিসাবটা তোমার ফোনের।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
