"use client";
// IP: what we avoided — no brand names, logos or real packaging on any item (plain shapes: a jute sack, a glass jar, a tin, a tied bag), no TV quiz-show look or music; our own shop, shopkeeper, levels and sounds. The "what's missing" party game itself is old and free.
// The rules, the clock and what the phone keeps are pure (lib/shelf.ts, lib/score.ts, lib/session.ts, lib/save.ts);
// the shelf is pre-rendered bitmaps moved by lib/draw.hot.ts. This file feeds them taps, keys and performance.now().

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, shake, silenceScheduled, soundOn, totalStars, useBest, useLevels, useSlowMode, useSound, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { drawBack, drawRing, drawSprite } from "../lib/art";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { drawFrame } from "../lib/draw.hot";
import { itemName, type ItemId } from "../lib/items";
import { LEVEL_COUNT, WORLDS, finaleName, isFinale, levelAt, worldOf } from "../lib/levels";
import { askLine, bn, caption, clearLine, compareLine, humanLine, nearLine, parseShared, revealLine, rightOf, sharedHash, type Shared } from "../lib/link";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import { fillAsk, fillLook, fillReveal, frameOf, makeScene, spriteOf, type Frame } from "../lib/scene";
import { bonusLeft, fastMs, isDecided, isRight, resultOf, rightFromScore, roundScore, starsOf, type Answer, type Result } from "../lib/score";
import * as session from "../lib/session";
import { ROUNDS, makeDeal, type Deal } from "../lib/shelf";
import { clamp01, leftFraction, lidAt, lookDanger, pastMiddle, secondsLeft } from "../lib/tick.hot";
import { ItemArt } from "./item-art";
import { LevelSheet } from "./level-sheet";
import { Memo, type Choice, type MemoRow } from "./memo";
import { StartInfo } from "./start-info";
import { sound } from "./sound";

const TOOL = "konta-nei";
/** How long the reveal's slide and drop take. */
const REVEAL_MS = 650;
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Finished = { result: Result; stars: number; previousBest: number | null; firstClear: boolean; beaten: boolean; bestStreak: number; missed: ItemId[] };
type Art = { frame: Frame; front: HTMLCanvasElement; back: HTMLCanvasElement; sprites: (HTMLCanvasElement | null)[]; good: HTMLCanvasElement; bad: HTMLCanvasElement };

/** Which picture the shelf shows: kind (0 the empty shop, 1 the look, 2 the question, 3 the reveal) × 8 + shelf. */
function sceneKey(s: session.Session, el: number) {
  switch (s.phase) {
    case "opening": return 8;
    case "look": return 8 + s.shelf;
    case "closing": return (pastMiddle(el, s.dur) ? 16 : 8) + s.shelf;
    case "ask": return 16 + s.shelf;
    case "reveal": case "over": return 24 + s.shelf;
    case "blink": return pastMiddle(el, s.dur) ? 8 + s.shelf + 1 : 24 + s.shelf;
    default: return 0;
  }
}

export function ShopGame() {
  const [deal, setDeal] = useState<Deal>(() => makeDeal(1, 1));
  const [run, setRun] = useState<session.Session>(session.ready);
  const [picks, setPicks] = useState<ItemId[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [streak, setStreak] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [left, setLeft] = useState(0);
  const [danger, setDanger] = useState(false);
  const [pop, setPop] = useState({ key: 0, text: "" });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [fonts, setFonts] = useState(false);
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const shopBox = useRef<HTMLDivElement>(null);
  const frameBox = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const art = useRef<Art | null>(null);
  const scene = useRef(makeScene());
  const shown = useRef({ key: -1, t: -1 });
  const hum = useRef<ReturnType<typeof sound.hum> | null>(null);
  const raf = useRef(0);
  const second = useRef(-1);
  const glow = useRef(false);
  const play = useRef(0);
  const recorded = useRef(-1);
  const overAt = useRef(0);
  const inView = useInView(root);

  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${deal.level}`);
  const timing = slow ? session.SLOW_TIMING : session.TIMING;
  const { spec, rounds, level } = deal;
  const world = worldOf(level);
  const fast = fastMs(spec);
  // The latest of everything, for the frame loop and listeners that outlive a render.
  const now = useRef({ deal, run, picks, answers, streak, finish, slow, timing, open, sheet });
  now.current = { ...now.current, deal, picks, answers, streak, finish, slow, timing, open, sheet };

  // ---- the shelf: pre-rendered once per size and level, then bitmaps moved per frame ----
  function paint(s: session.Session, at: number) {
    const a = art.current, target = canvas.current;
    if (!a || !target) return;
    const el = session.elapsed(s, at);
    const key = sceneKey(s, el), kind = key >> 3, shelf = key & 7, { deal: d, answers: done, picks: held, slow: still } = now.current;
    const round = d.rounds[Math.min(shelf, ROUNDS - 1)];
    const t = kind === 3 && s.phase === "reveal" && !still ? clamp01(el / REVEAL_MS) : 1;
    if (key === shown.current.key && t === shown.current.t) return;
    if (key !== shown.current.key) {
      const sc = scene.current;
      if (kind === 1) fillLook(sc, round, a.frame);
      else if (kind === 2) fillAsk(sc, round, a.frame);
      else if (kind === 3) fillReveal(sc, round, a.frame, done[shelf]?.picks ?? held);
      else { sc.n = 0; sc.rings = 0; }
    }
    shown.current.key = key; shown.current.t = t;
    const c = fitCanvas(target, a.frame.width, a.frame.height);
    drawFrame(c, kind === 2 ? a.back : a.front, a.frame.width, a.frame.height, a.sprites, a.frame.sw, a.frame.sh, a.good, a.bad, a.frame.rw, a.frame.rh, scene.current, t);
  }

  /** The per-frame touches outside the canvas: lids, the bar, the countdown and its ticks, the edge glow, the hum's pitch. */
  function touch(s: session.Session, at: number) {
    const el = session.elapsed(s, at), box = frameBox.current;
    const lid = s.phase === "closing" || s.phase === "blink" ? (now.current.slow ? (lidAt(el, s.dur) > 0.5 ? 1 : 0) : lidAt(el, s.dur)) : 0;
    box?.style.setProperty("--lid", String(lid));
    const fill = s.phase === "look" ? leftFraction(el, s.dur) : s.phase === "ask" ? bonusLeft(fastMs(now.current.deal.spec), el) / 50 : 0;
    if (bar.current) bar.current.style.transform = `scaleX(${fill})`;
    if (s.phase === "look") {
      const sec = secondsLeft(el, s.dur);
      if (sec !== second.current) {
        if (second.current > sec && sec >= 1 && sec <= 3 && session.running(s)) sound.tick(sec);
        second.current = sec;
        setLeft(sec);
      }
      edge(lookDanger(el, s.dur) && session.running(s));
      hum.current?.pitch(110 + (1 - leftFraction(el, s.dur)) * 110);
    } else edge(false);
  }
  function edge(on: boolean) {
    if (glow.current === on) return;
    glow.current = on;
    setDanger(on);
  }

  function frame() {
    raf.current = 0;
    const at = performance.now(), before = now.current.run;
    const last = before.shelf === ROUNDS - 1;
    const after = session.tick(before, at, now.current.deal.spec.view * 1000, now.current.timing, last);
    if (after !== before) commit(after, before);
    const s = now.current.run;
    paint(s, at);
    touch(s, at);
    if (session.running(s) && !raf.current) raf.current = requestAnimationFrame(frame);
  }

  /** The hum plays exactly while the shelf is on screen and its time counts, with sound on. */
  function syncHum(s: session.Session) {
    const want = session.looking(s) && soundOn();
    if (want && !hum.current) hum.current = sound.hum();
    else if (!want && hum.current) { hum.current.stop(); hum.current = null; }
  }

  function commit(next: session.Session, before: session.Session) {
    if (next === before) return;
    now.current.run = next;
    setRun(next);
    if (next.phase !== before.phase || next.shelf !== before.shelf) entered(next);
    syncHum(next);
    if (session.running(next)) { if (!raf.current) raf.current = requestAnimationFrame(frame); }
    else if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    const at = performance.now();
    paint(next, at);
    touch(next, at);
  }

  function entered(s: session.Session) {
    if (s.phase === "closing" || s.phase === "blink") sound.blink();
    if (s.phase === "look") { second.current = -1; setPicks([]); now.current.picks = []; }
    if (s.phase === "over") {
      overAt.current = performance.now();
      const done = now.current.finish;
      if (!done) return;
      const big = done.stars === 3 || done.beaten || (done.firstClear && isFinale(now.current.deal.level));
      if (done.stars) sound.ident(worldOf(now.current.deal.level), big, 0.26 * (done.stars + 1));
      if (big && !now.current.slow) confetti({ colors: ["#c8402e", "#f2b51c", "#3d6e70", "#f5efe0", "#2f9e5b"] });
    }
  }

  // ---- loading a level: everything about the last one goes (its loop, scheduled notes, picks and result) ----
  function load(next: Deal) {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    hum.current?.stop(); hum.current = null;
    silenceScheduled();
    play.current++;
    const s = session.ready();
    now.current = { ...now.current, deal: next, run: s, picks: [], answers: [], streak: 0, finish: null, sheet: false };
    shown.current.key = -1;
    setDeal(next);
    setRun(s);
    setPicks([]);
    setAnswers([]);
    setStreak(0);
    setFinish(null);
    setLeft(next.spec.view);
    glow.current = false;
    setDanger(false);
    setSheet(false);
    setPop(current => ({ key: current.key, text: "" }));
  }
  const canPick = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const rival = friend && friend.level === level && friend.seed === deal.seed && friend.v === deal.v ? friend : null;
  function pickLevel(to: number) { if (canPick(to)) load(makeDeal(to, newSeed())); }
  function replay() {
    const d = now.current.deal;
    load(rival ? makeDeal(d.level, d.seed, d.v) : makeDeal(d.level, newSeed()));
  }

  // ---- moves ----
  function start() {
    const s = now.current.run;
    if (s.phase !== "ready") return;
    sound.shutter();
    commit(session.begin(s, performance.now(), now.current.timing), s);
  }
  function doneLooking() {
    const s = now.current.run;
    commit(session.doneLooking(s, performance.now(), now.current.timing), s);
  }
  function nextShelf() {
    const s = now.current.run;
    commit(session.next(s, performance.now(), now.current.timing, s.shelf === ROUNDS - 1), s);
  }
  function pauseFor(why: session.Why) {
    const s = now.current.run;
    commit(session.pause(s, performance.now(), why), s);
  }
  function resumeFrom(why: session.Why) {
    const s = now.current.run;
    commit(session.resume(s, performance.now(), why, now.current.timing.breath), s);
  }

  function choose(id: ItemId, button?: Element | null) {
    const s = now.current.run;
    if (!session.canPick(s)) return;
    const { deal: d, picks: before, answers: done, streak: run0 } = now.current, round = d.rounds[s.shelf];
    if (before.includes(id)) return;
    const held = [...before, id];
    now.current.picks = held;
    setPicks(held);
    if (!isDecided(round, held)) { sound.half(); return; }
    const at = performance.now(), answer: Answer = { picks: held, ms: session.askMs(s, at) }, ok = isRight(round, answer);
    const all = [...done, answer];
    now.current.answers = all;
    setAnswers(all);
    const nextStreak = ok ? run0 + 1 : 0;
    now.current.streak = nextStreak;
    setStreak(nextStreak);
    if (ok) {
      sound.ding(nextStreak);
      setPop(current => ({ key: current.key + 1, text: `+${bn(roundScore(fastMs(d.spec), true, answer.ms))}` }));
    } else {
      sound.wrong();
      if (!now.current.slow) shake(button ?? null);
    }
    sound.back(now.current.slow ? 0.05 : REVEAL_MS * 0.6 / 1000);
    const last = s.shelf === ROUNDS - 1;
    if (last) finalize(all);
    commit(session.decided(s, at, ok ? now.current.timing.auto : 0), s);
  }

  /** The last shelf is decided: record the stars and the best once, right now (not behind the reveal's pause). */
  function finalize(all: Answer[]) {
    if (recorded.current === play.current) return;
    recorded.current = play.current;
    const d = now.current.deal, result = resultOf(d.spec, d.rounds, all), stars = starsOf(result.right, result.score);
    const firstClear = stars > 0 && !levels.stars[d.level];
    if (stars) {
      levels.record(d.level, stars);
      const opened = openAfter(now.current.open, d.level);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best;
    const beaten = stars > 0 && submitBest(result.score) && previousBest !== null;
    let bestStreak = 0, runOf = 0;
    const missed: ItemId[] = [];
    all.forEach((answer, index) => {
      const r = d.rounds[index];
      runOf = isRight(r, answer) ? runOf + 1 : 0;
      bestStreak = Math.max(bestStreak, runOf);
      for (const id of r.gone) if (!answer.picks.includes(id)) missed.push(id);
    });
    const done: Finished = { result, stars, previousBest, firstClear, beaten, bestStreak, missed };
    now.current.finish = done;
    setFinish(done);
  }

  // The player's menu: pause stops every clock and covers the shelf; চালিয়ে যাও brings it back after a breath.
  const player = useGamePlayer({ onPause: () => pauseFor("away"), onResume: () => resumeFrom("away"), onRestart: replay });

  // Away without the player (or before its menu engages): blur and a hidden tab pause too.
  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      if (raf.current) cancelAnimationFrame(raf.current);
      hum.current?.stop(); hum.current = null;
    };
  }, []);

  // The site-wide sound switch: off stops the hum (the kit already cut it); on brings it back mid-look.
  useEffect(() => {
    if (!soundIsOn) { hum.current?.stop(); hum.current = null; }
    else syncHum(now.current.run);
  }, [soundIsOn]);

  // Boot once this phone's stars are read: your own open level (migrated once from the old rule), then a friend's
  // shelves from the link, or where you left off.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const mine = readOpen(read(OPEN_KEY), levels.stars);
    if (read(OPEN_KEY) === null) write(OPEN_KEY, String(mine));
    now.current.open = mine;
    setOpen(mine);
    setSite(window.location.host);
    setBooted(true);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      setVisit(got.level);
      load(makeDeal(got.level, got.seed, got.v));
      return true;
    };
    if (!fromHash()) load(makeDeal(startLevel(levels.stars, mine), newSeed()));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // The shop box decides the canvas: as wide as it is, at most 1.3 times taller than wide, at most 1.4 times wider than tall.
  useEffect(() => {
    const box = shopBox.current;
    if (!box) return;
    const watch = new ResizeObserver(() => {
      const bw = box.clientWidth, bh = box.clientHeight;
      if (bw < 40 || bh < 40) return;
      const h = Math.floor(Math.min(bh, bw * 1.3)), w = Math.floor(Math.min(bw, h * 1.4));
      setSize(current => current.w === w && current.h === h ? current : { w, h });
    });
    watch.observe(box);
    loadCardFonts("চাল ডাল তেল লবণ গুঁড়া দুধ শুকনা মরিচ").catch(() => {}).finally(() => setFonts(true));
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    if (!size.w || !canvas.current) return;
    const { w, h } = size, ratio = Math.min(2, window.devicePixelRatio || 1), base = spec.count;
    const make = (cw: number, ch: number, draw: (c: CanvasRenderingContext2D) => void) => {
      const out = document.createElement("canvas");
      out.width = Math.ceil(cw * ratio); out.height = Math.ceil(ch * ratio);
      const c = out.getContext("2d")!;
      c.scale(ratio, ratio);
      draw(c);
      return out;
    };
    const f = frameOf(w, h, base), sprites: (HTMLCanvasElement | null)[] = new Array(20).fill(null);
    for (const r of rounds) for (const id of [...r.shelf, ...r.newcomers]) sprites[spriteOf(id)] ??= make(f.sw, f.sh, c => drawSprite(c, id, w, h, base, spec.plain));
    art.current = {
      frame: f, sprites,
      front: make(w, h, c => drawBack(c, w, h, base, world, "front")),
      back: make(w, h, c => drawBack(c, w, h, base, world, "back")),
      good: make(f.rw, f.rh, c => drawRing(c, f.rw / 2, f.ringTop, w, h, base, true)),
      bad: make(f.rw, f.rh, c => drawRing(c, f.rw / 2, f.ringTop, w, h, base, false)),
    };
    shown.current.key = -1;
    paint(now.current.run, performance.now());
  }, [size, fonts, deal]);

  // ---- cards ----
  const result = resultOf(spec, rounds, answers);
  const stars = finish?.stars ?? 0;
  const over = run.phase === "over" && finish !== null;
  const shared: Shared | null = over ? { seed: deal.seed, level, score: result.score, name, v: deal.v } : null;
  const state = shared ? sharedHash(shared) : "";
  const card: CardData | null = shared && finish ? { ...shared, right: result.right, missed: finish.missed } : null;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("কোনটা নেই? রাফি ৩টায় ৩টা ধরেছে হাটবার পার").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { ...friend, right: rightFromScore(friend.score) }, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; run.phase brings the friend's canvas back with the start screen.
  }, [state, format, site, friend, run.phase]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- choices: the sheet pauses play ----
  function openSheet() {
    pauseFor("sheet");
    now.current.sheet = true;
    setSheet(true);
  }
  function closeSheet() { now.current.sheet = false; setSheet(false); resumeFrom("sheet"); }

  const recommended = startLevel(levels.stars, open);
  const nextOpen = level < LEVEL_COUNT && canPick(level + 1);
  const again: Choice = { label: "আবার খেলো", run: replay };
  const all: Choice = { label: "সব লেভেল", run: openSheet };
  const endChoices: Choice[] = stars
    ? nextOpen ? [{ label: "পরের লেভেল", run: () => pickLevel(level + 1) }, again, all] : [all, again]
    : [again, all];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the memo shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (now.current.sheet || !inView) return;
    const key = event.key, enter = key === "Enter" || key === " ", fresh = !event.repeat, s = now.current.run;
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab does its own job
    const digit = "১২৩৪৫৬".includes(key) ? "১২৩৪৫৬".indexOf(key) : /^[1-6]$/.test(key) ? Number(key) - 1 : -1;
    if ((key === "p" || key === "P") && fresh && session.running(s)) {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor("away");
      return;
    }
    if (s.why === "away") { if (enter) { event.preventDefault(); if (fresh) resumeFrom("away"); } return; }
    if (s.why) return;
    if (s.phase === "ask" && digit >= 0) {
      const round = now.current.deal.rounds[s.shelf];
      if (digit < round.choices.length) { event.preventDefault(); if (fresh) choose(round.choices[digit], root.current?.querySelectorAll(".kn-choice")[digit]); }
      return;
    }
    if (s.phase === "over") {
      if ((enter || (digit >= 0 && digit < endChoices.length)) && fresh && event.timeStamp > overAt.current + 400) {
        event.preventDefault();
        endChoices[enter ? 0 : digit].run();
      } else if (enter) event.preventDefault();
      return;
    }
    if (!enter) return;
    event.preventDefault();
    if (!fresh) return;
    if (s.phase === "ready") start();
    else if (s.phase === "look") doneLooking();
    else if (s.phase === "reveal") nextShelf();
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

  // ---- what the screen shows ----
  const shelf = Math.min(run.shelf, ROUNDS - 1), round = rounds[shelf];
  const finale = deal.v === 2 ? finaleName(level) : "";
  const covered = run.why !== null && session.started(run);
  const down = run.phase === "ready" || covered;
  const asking = run.phase === "ask" || run.phase === "reveal";
  const decidedNow = run.phase === "reveal" || (run.phase === "over" && finish !== null);
  const shelfAnswer = answers[shelf];
  const lesson = deal.v === 2 ? levelAt(level).lesson : "";
  const rows = spec.choices > 4 ? 2 : 1;

  function status() {
    if (covered) return "থেমে আছে। ঘড়িও থেমে আছে।";
    switch (run.phase) {
      case "ready": return deal.v === 2 ? WORLDS[world].rule : "তাকটা দেখে রাখো, বলো কোনটা নেই।";
      case "opening": case "look": return `দেখে রাখো… ${spec.two ? "মামা দুটো সরাবে।" : "মামা একটা সরাবে।"}`;
      case "closing": return "চোখ বন্ধ…";
      case "ask": return askLine(deal.v === 2 ? WORLDS[world].ask : "কোনটা নেই?", spec.two, picks.length);
      case "reveal": return shelfAnswer ? revealLine(round, shelfAnswer.picks, streak) : "";
      case "blink": return "পরের তাক…";
      default: return "";
    }
  }

  const memoRows: MemoRow[] = rounds.map((r, index) => {
    const a = answers[index];
    return { gone: r.gone, right: Boolean(a) && isRight(r, a!), ms: a?.ms ?? 0, points: a ? roundScore(fast, isRight(r, a), a.ms) : 0 };
  });
  const memoTitle = finish ? (finale && stars ? `${finale} পার` : stars ? `লেভেল ${bn(level)} পার` : `লেভেল ${bn(level)}: আরেকবার?`) : "";
  const nextWorld = finale && finish?.firstClear && world < WORLDS.length - 1 ? WORLDS[world + 1].name : "";
  const memoLine = finish ? (rival ? compareLine(result.score, rival.score, rival.name)
    : finale && finish.firstClear ? `${WORLDS[world].name}-এর সব তাক শেষ।${nextWorld ? ` এবার ${nextWorld}।` : " তিন দোকানই শেষ।"}`
    : finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(finish.previousBest)}।`
    : stars ? clearLine(spec.count, result.right) : humanLine(result.right, result.score, finish.missed)) : "";
  const total = totalStars(levels.stars);

  return (
    <div ref={root} className="kn" data-phase={run.phase} data-world={world} data-rows={rows} data-calm={slow || undefined}
      data-danger={danger || undefined} data-finale={finale ? "" : undefined} onClick={dropFocus}
      style={{ "--rows": rows } as CSSProperties}>
      <div className="kn-play" hidden={over}>
        <header className="kn-hud">
          <button type="button" className="kn-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`লেভেল ${bn(level)}, সব লেভেল দেখো`}>
            <b>{finale ? "শেষ তাক" : `লেভেল ${bn(level)}`}</b>
            <span>{finale ? `লেভেল ${bn(level)}` : deal.v === 2 ? WORLDS[world].name : "বন্ধুর লেভেল"}</span>
          </button>
          {finale ? (
            <div className="kn-boss" aria-label={`${finale}: তাক ${bn(shelf + 1)}, মোট ৩টা`}>
              <b>{finale}</b>
              <span>{rounds.map((r, index) => { const a = answers[index]; return <i key={index} data-state={a ? (isRight(r, a) ? "hit" : "miss") : ""} />; })}</span>
            </div>
          ) : (
            <ol className="kn-pips" aria-label={`তাক ${bn(shelf + 1)}, মোট ${bn(ROUNDS)}টা`}>
              {rounds.map((r, index) => {
                const a = answers[index];
                return <li key={index} data-state={a ? (isRight(r, a) ? "right" : "wrong") : index === shelf && run.phase !== "ready" ? "now" : ""}>{a ? (isRight(r, a) ? "✓" : "✗") : ""}</li>;
              })}
            </ol>
          )}
          <p className="kn-score">
            {run.phase === "ready" ? <><b>★ {bn(total)}</b><small>/{bn(LEVEL_COUNT * 3)}</small></> : <><b>{bn(result.score)}</b><small>স্কোর</small></>}
            {streak >= 2 && run.phase === "reveal" && <em key={streak}>টানা {bn(streak)}</em>}
          </p>
        </header>

        <div className="kn-shop" ref={shopBox}>
          <div className="kn-frame" ref={frameBox} style={{ width: size.w || undefined, height: size.h || undefined }}>
            <canvas ref={canvas} role="img" aria-label={
              run.phase === "ready" ? "দোকানের ঝাঁপ বন্ধ।"
              : run.phase === "ask" ? `তাক, ${spec.two ? "দুটো" : "একটা"} জিনিস নেই: ${round.after.filter(Boolean).map(id => itemName(id!)).join(", ")}।`
              : `তাকে আছে: ${round.shelf.map(itemName).join(", ")}।`} />
            <div className="kn-bar" data-on={(run.phase === "look" || run.phase === "ask") || undefined} data-kind={run.phase === "ask" ? "bonus" : "look"} aria-hidden="true"><i ref={bar} /></div>
            {run.phase === "look" && !covered && <span className="kn-count" aria-hidden="true">{bn(left)}</span>}
            <div className="kn-lid kn-lid-top" aria-hidden="true" />
            <div className="kn-lid kn-lid-bottom" aria-hidden="true"><span>চোখ বন্ধ…</span></div>
            <button type="button" className="kn-shutter" data-down={down || undefined} tabIndex={down ? 0 : -1} aria-hidden={!down}
              onClick={event => { event.currentTarget.blur(); if (covered) resumeFrom(run.why === "sheet" ? "sheet" : "away"); else start(); }}>
              <span className="kn-shutter-sign">
                <b>{covered ? "চালিয়ে যাও" : "ঝাঁপ তোলো"}</b>
                <small>{covered ? "থেমে আছে, তাকটা ঢাকা" : rival ? "বন্ধুর তিনটা তাক" : `${bn(spec.count)}টা জিনিস · ${bn(spec.view)} সেকেন্ড দেখা`}</small>
              </span>
            </button>
            {pop.text && !slow && <em className="kn-pop" key={pop.key} aria-hidden="true">{pop.text}</em>}
          </div>
        </div>

        <p className="kn-status" role="status" aria-live="polite">{status()}</p>

        <div className="kn-below" data-n={spec.choices}>
          {run.phase === "ready" ? (
            <StartInfo level={level} spec={spec} lesson={lesson} old={deal.v === 1} stars={levels.stars[level] ?? 0}
              canBack={level > 1} canNext={canPick(level + 1)} friend={rival} friendCanvas={friendPreview}
              onLevel={pickLevel} onSheet={openSheet} />
          ) : asking && !covered ? (
            <>
              <div className="kn-choices" role="group" aria-label="কোনটা নেই? বেছে নাও">
                {round.choices.map((id, index) => {
                  const mine = picks.includes(id) || shelfAnswer?.picks.includes(id);
                  const mark = decidedNow ? round.gone.includes(id) ? "right" : mine ? "wrong" : "" : mine ? "right" : "";
                  return (
                    <button key={`${deal.seed}-${shelf}-${id}`} type="button" className="kn-choice" data-mark={mark || undefined}
                      disabled={run.phase !== "ask" || Boolean(mine)} aria-label={`${bn(index + 1)}. ${itemName(id)}`}
                      onClick={event => choose(id, event.currentTarget)}>
                      <kbd aria-hidden="true">{bn(index + 1)}</kbd>
                      <ItemArt id={id} />
                      <span>{itemName(id)}</span>
                    </button>
                  );
                })}
              </div>
              {run.phase === "reveal" && (
                <button type="button" className="kit-primary kn-next" onClick={nextShelf}>{shelf === ROUNDS - 1 ? "ফলাফল দেখো" : "পরের তাক"}<kbd aria-hidden="true">Enter</kbd></button>
              )}
            </>
          ) : (
            <>
              <div className="kn-choices kn-ghost" aria-hidden="true">{round.choices.map(id => <span key={id} />)}</div>
              {(run.phase === "look" || run.phase === "opening") && !covered && (
                <button type="button" className="kit-secondary kn-next" onClick={doneLooking} disabled={run.phase !== "look"}>মনে আছে<kbd aria-hidden="true">Enter</kbd></button>
              )}
            </>
          )}
        </div>
      </div>

      {over && finish && (
        <Memo rows={memoRows} slow={slow} finale={Boolean(finale)} title={memoTitle} choices={endChoices} onCard={seeCard}
          sub={`${deal.v === 2 ? WORLDS[world].name : "বন্ধুর লেভেল"} · ${bn(spec.count)}টা জিনিস`}
          stats={{ score: result.score, stars, right: result.right, avgMs: Math.round(result.ms / ROUNDS), fastestMs: result.fastest, bestStreak: finish.bestStreak }}
          line={memoLine} near={nearLine(result.right, result.score)}
          best={finish.previousBest !== null && finish.previousBest > result.score ? `এই লেভেলে তোমার সেরা ${bn(finish.previousBest)}।` : ""} />
      )}

      {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={level} recommended={recommended} onPick={pickLevel} onClose={closeSheet} />}

      {over && card && (
        <section className="kn-result" id="result" ref={resultBox} aria-labelledby="kn-result-title">
          <h2 id="kn-result-title"><em>লেভেল {bn(level)}</em> {rightOf(result.right)} ঠিক</h2>
          <p>{rival ? compareLine(result.score, rival.score, rival.name) : humanLine(result.right, result.score, card.missed)}</p>
          <div className="kn-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="kn-card-summary" />
              <figcaption id="kn-card-summary" className="kn-sr">কার্ড: লেভেল {bn(level)}, {rightOf(result.right)} ঠিক, স্কোর {bn(result.score)}, {bn(stars)} তারা। {humanLine(result.right, result.score, card.missed)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="kn-share">
              <label className="kn-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`konta-nei-${level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`}
                caption={caption(level, result.right, result.score)} state={state}
                hint="বন্ধু লিংক খুললে একই তিনটা তাক পাবে। স্কোরটা তোমার ফোনে খেলা, লিংকে সেভাবেই লেখা থাকে।"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
