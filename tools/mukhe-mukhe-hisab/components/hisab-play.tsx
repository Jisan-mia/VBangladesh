"use client";
// IP: what we avoided — no TV quiz-show or brain-training app look, names, timers or sounds; no real shop, brand or banknote; prices are rough and made up. Our own slate, ledger, ফর্দ, cash box, levels and sounds.
// The rules, the clock and what the phone keeps are pure (lib/game.ts, lib/session.ts, lib/save.ts); per-frame work is
// lib/tick.hot.ts writing one bar's transform. This file feeds them taps, keys and performance.now(), and draws.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, shake, silenceScheduled, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confettiOf, paletteOf } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { answerRun, comboOf, digitCount, freshRun, levelOf, makeDeck, pointsFor, starsOf, sumAt, ROUND_SECONDS, type Deck, type Question, type Run } from "../lib/game";
import { finaleName, isFinale, LEVEL_COUNT, WORLD, worldOf } from "../lib/levels";
import { bn, caption, compareLine, CARD_SUMS, humanLine, nearLine, parseShared, sharedHash, type Shared } from "../lib/link";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import * as session from "../lib/session";
import { dangerAt, leftFraction, secondsLeft } from "../lib/tick.hot";
import { CashBox } from "./cash-box";
import { Finish, type Choice, type Miss } from "./finish";
import { LevelSheet } from "./level-sheet";
import { StartCard } from "./start-card";
import { sound } from "./sound";

const TOOL = "mukhe-mukhe-hisab";
const ROUND_MS = ROUND_SECONDS * 1000;
const PAD = ["১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** "৪৫" for typed ASCII digits. */
const bnDigits = (typed: string) => [...typed].map(d => bn(Number(d))).join("");
const answerText = (q: Question, value: number) => q.bazar ? `${bn(value)} টাকা` : bn(value);

/** One answer: right or wrong, the ms the sum was up (clock time only), and what was given. */
type Answer = { ok: boolean; ms: number; value: number; q: Question };
type Finished = { stars: number; previousBest: number | null; firstClear: boolean; beaten: boolean; marks: string };
type Lesson = { q: Question; value: number | null };

export function HisabPlay() {
  const [deal, setDeal] = useState({ level: 1, seed: 1 });
  const [run, setRun] = useState<session.Session>(() => session.ready(ROUND_MS));
  const [tally, setTally] = useState<Run>(freshRun);
  const [typed, setTyped] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [log, setLog] = useState<Answer[]>([]);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [danger, setDanger] = useState(0);
  const [breath, setBreath] = useState(false);
  const [pop, setPop] = useState({ key: 0, text: "" });
  const [cost, setCost] = useState({ key: 0, text: "" });
  const [starPop, setStarPop] = useState(0);
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const deck = useRef<Deck>(makeDeck(1, 1));
  const raf = useRef(0);
  const second = useRef(ROUND_SECONDS);
  const edge = useRef(0);
  const held = useRef(false);
  const play = useRef(0);
  const recorded = useRef(-1);
  const overAt = useRef(0);
  const inView = useInView(root);

  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${deal.level}`);
  const timing = slow ? session.SLOW_TIMING : session.TIMING;
  const { level, seed } = deal;
  const spec = levelOf(level), world = worldOf(level), finale = finaleName(level);
  // The latest of everything, for the frame loop and listeners that outlive a render.
  const now = useRef({ run, tally, log: [] as Answer[], typed, slow, timing, open, sheet, finish });
  now.current = { ...now.current, slow, timing, open, sheet, finish };

  // ---- the clock: one rAF loop while anything counts; per frame it writes one transform and, once a second, the digits ----
  function touch(s: session.Session, at: number) {
    const leftMs = session.leftMs(s, at);
    if (bar.current) bar.current.style.transform = `scaleX(${leftFraction(leftMs, ROUND_MS)})`;
    const sec = secondsLeft(leftMs);
    if (sec !== second.current) {
      if (session.roundRuns(s) && sec < second.current && sec >= 1 && sec <= 5) sound.tick(sec);
      second.current = sec;
      setLeft(sec);
    }
    const level = session.started(s) && s.why === null ? dangerAt(leftMs) : 0;
    if (level !== edge.current) { edge.current = level; setDanger(level); }
    const inBreath = s.why === null && (s.phase === "play" || s.phase === "lesson") && at < (s.phase === "play" ? s.since : s.pSince);
    if (inBreath !== held.current) { held.current = inBreath; setBreath(inBreath); }
  }

  function frame() {
    raf.current = 0;
    const at = performance.now(), before = now.current.run, after = session.tick(before, at);
    if (after !== before) commit(after, before);
    const s = now.current.run;
    touch(s, at);
    if (session.running(s) && !raf.current) raf.current = requestAnimationFrame(frame);
  }

  function commit(next: session.Session, before: session.Session) {
    if (next === before) return;
    now.current.run = next;
    setRun(next);
    if (next.phase !== before.phase) entered(next, before);
    if (session.running(next)) { if (!raf.current) raf.current = requestAnimationFrame(frame); }
    else if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    touch(next, performance.now());
  }

  function entered(s: session.Session, before: session.Session) {
    if (s.phase === "play" && before.phase === "lesson") { setLesson(null); setTyped(""); now.current.typed = ""; }
    if (s.phase === "over") {
      overAt.current = performance.now();
      finalize();
      sound.bell();
      const done = now.current.finish;
      if (!done) return;
      const big = done.stars === 3 || done.beaten || (done.firstClear && isFinale(deal.level));
      if (done.stars) sound.ident(worldOf(deal.level), big, 0.26 * (done.stars + 1) + 0.4);
      if (big && !now.current.slow) confetti({ colors: confettiOf(worldOf(deal.level)) });
    }
  }

  // ---- loading a level: everything about the last one goes (its frame loop, scheduled notes, answers and result) ----
  function load(nextLevel: number, nextSeed: number) {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    silenceScheduled();
    play.current++;
    deck.current = makeDeck(nextLevel, nextSeed);
    const s = session.ready(ROUND_MS), fresh = freshRun();
    now.current = { ...now.current, run: s, tally: fresh, log: [], typed: "", finish: null, sheet: false };
    second.current = ROUND_SECONDS; edge.current = 0; held.current = false;
    setDeal({ level: nextLevel, seed: nextSeed });
    setRun(s); setTally(fresh); setLog([]); setTyped(""); setLesson(null); setFinish(null);
    setLeft(ROUND_SECONDS); setDanger(0); setBreath(false); setSheet(false); setStarPop(0);
    setPop(current => ({ key: current.key, text: "" }));
    setCost(current => ({ key: current.key, text: "" }));
  }
  const canPick = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  function pickLevel(to: number) { if (canPick(to)) load(to, newSeed()); }
  function replay() { load(level, rival ? seed : newSeed()); }

  // ---- moves ----
  function start() {
    const s = now.current.run;
    if (s.phase !== "ready") return;
    sound.drawer();
    commit(session.begin(s, performance.now(), now.current.timing), s);
  }
  function pauseFor(why: session.Why) { const s = now.current.run; commit(session.pause(s, performance.now(), why), s); }
  function resumeFrom(why: session.Why) { const s = now.current.run; commit(session.resume(s, performance.now(), why, now.current.timing.breath), s); }

  /** An answer, taken on pointerdown or keydown: it lands in this frame. */
  function answer(value: number) {
    const s = now.current.run, at = performance.now();
    if (!session.canAnswer(s) || at < s.since) return;
    const before = now.current.tally, q = sumAt(deck.current, before.index), ok = value === q.answer;
    const entry: Answer = { ok, ms: session.answerMs(s, at), value, q };
    const after = answerRun(before, ok), all = [...now.current.log, entry];
    now.current.tally = after; now.current.log = all; now.current.typed = "";
    setTally(after); setLog(all); setTyped("");
    if (ok) {
      sound.ching(after.streak);
      if (after.streak > 1 && pointsFor(after.streak) > pointsFor(after.streak - 1)) sound.combo();
      const earned = starsOf(deal.level, after.right);
      if (earned > starsOf(deal.level, before.right)) { sound.star(earned); setStarPop(earned); }
      setPop(current => ({ key: current.key + 1, text: `+${bn(after.score - before.score)}` }));
      commit(session.right(s, at), s);
    } else {
      sound.wrong();
      if (!now.current.slow) shake(surface.current);
      const next = session.wrong(s, at, now.current.timing);
      setCost(current => ({ key: current.key + 1, text: `−${bn(Math.round((s.budget - next.budget) / 1000))} সে.` }));
      setLesson({ q, value });
      commit(next, s);
    }
  }
  function press(digit: number) {
    const s = now.current.run;
    if (!session.canAnswer(s) || performance.now() < s.since) return;
    const q = sumAt(deck.current, now.current.tally.index), next = (now.current.typed + String(digit)).slice(0, 3);
    if (next.length >= digitCount(q.answer)) { answer(Number(next)); return; }
    now.current.typed = next;
    setTyped(next);
  }
  function erase() {
    if (!session.canAnswer(now.current.run) || !now.current.typed) return;
    const next = now.current.typed.slice(0, -1);
    now.current.typed = next;
    setTyped(next);
  }
  function submitTyped() { if (now.current.typed) answer(Number(now.current.typed)); }

  /** The round is over: record the stars and the best once, right now. */
  function finalize() {
    if (recorded.current === play.current) return;
    recorded.current = play.current;
    const t = now.current.tally, all = now.current.log, stars = starsOf(deal.level, t.right);
    const firstClear = stars > 0 && !levels.stars[deal.level];
    if (stars) {
      levels.record(deal.level, stars);
      const opened = openAfter(now.current.open, deal.level);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best;
    const beaten = stars > 0 && submitBest(t.score) && previousBest !== null;
    const done: Finished = { stars, previousBest, firstClear, beaten, marks: all.slice(0, CARD_SUMS).map(a => a.ok ? "1" : "0").join("") };
    now.current.finish = done;
    setFinish(done);
  }

  // The player's menu: pause stops every clock and covers the sum; চালিয়ে যাও brings it back after a breath. Its সব লেভেল
  // resumes, then opens our sheet, which pauses again at once (the breath means no time ran in between).
  const player = useGamePlayer({ onPause: () => pauseFor("away"), onResume: () => resumeFrom("away"), onRestart: replay, onLevels: () => openSheet() });

  // Away without the player (or before its menu engages): blur and a hidden tab pause too. A second one changes nothing.
  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      if (raf.current) cancelAnimationFrame(raf.current);
      silenceScheduled();
    };
  }, []);

  // Boot once this phone's stars are read: your own open level (migrated once from the old rule), then a friend's sums
  // from the link, or where you left off.
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
      load(got.level, got.seed);
      return true;
    };
    if (!fromHash()) load(startLevel(levels.stars, mine), newSeed());
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- cards ----
  const over = run.phase === "over" && finish !== null;
  const shared: Shared | null = over && finish ? { seed, level, right: tally.right, score: tally.score, name, marks: finish.marks } : null;
  const state = shared ? sharedHash(shared) : "";
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("মুখে মুখে হিসাব ২৩টা হিসাব মিলিয়েছে টাকা").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
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
  function openSheet() { pauseFor("sheet"); now.current.sheet = true; setSheet(true); }
  function closeSheet() { now.current.sheet = false; setSheet(false); resumeFrom("sheet"); }

  const stars = finish?.stars ?? 0;
  const recommended = startLevel(levels.stars, open);
  const nextOpen = level < LEVEL_COUNT && canPick(level + 1);
  const again: Choice = { label: "আবার খেলো", run: replay };
  const all: Choice = { label: "সব লেভেল", run: openSheet };
  const endChoices: Choice[] = stars && nextOpen ? [{ label: "পরের লেভেল", run: () => pickLevel(level + 1) }, again, all] : [again, all];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the end screen shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (now.current.sheet || !inView) return;
    const key = event.key, enter = key === "Enter" || key === " ", fresh = !event.repeat, s = now.current.run;
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab does its own job
    const bangla = "০১২৩৪৫৬৭৮৯".indexOf(key), digit = bangla >= 0 ? bangla : /^[0-9]$/.test(key) ? Number(key) : -1;
    if ((key === "p" || key === "P") && fresh && session.started(s) && s.why === null) {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor("away");
      return;
    }
    if (s.why === "away") { if (enter) { event.preventDefault(); if (fresh) resumeFrom("away"); } return; }
    if (s.why) return;
    if (s.phase === "play" || s.phase === "lesson" || s.phase === "opening") {
      if (digit < 0 && !enter && key !== "Backspace") return;
      event.preventDefault();
      if (!fresh || s.phase !== "play") return;
      const q = sumAt(deck.current, now.current.tally.index);
      if (q.choices) { if (digit >= 1 && digit <= 4) answer(q.choices[digit - 1]); }
      else if (digit >= 0) press(digit);
      else if (key === "Backspace") erase();
      else submitTyped();
      return;
    }
    if (s.phase === "over") {
      const pick = digit >= 1 && digit <= endChoices.length ? digit - 1 : enter ? 0 : -1;
      if (pick >= 0 && fresh && event.timeStamp > overAt.current + 400) { event.preventDefault(); endChoices[pick].run(); }
      else if (enter) event.preventDefault();
      return;
    }
    if (key === "ArrowLeft" || key === "ArrowRight") { event.preventDefault(); pickLevel(level + (key === "ArrowLeft" ? -1 : 1)); return; }
    if (!enter) return;
    event.preventDefault();
    if (fresh) start();
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
  /** A pad key or an answer acts on pointerdown (so it lands within a frame); a keyboard click (detail 0) acts on click. */
  const onDown = (act: () => void) => (event: PointerEvent<HTMLButtonElement>) => { if (event.button === 0) { event.preventDefault(); act(); } };
  const onKey = (act: () => void) => (event: MouseEvent<HTMLButtonElement>) => { if (event.detail === 0) act(); };

  // ---- what the screen shows ----
  const covered = run.why !== null && session.started(run);
  const boxShown = run.phase === "ready" || run.phase === "opening" || covered || breath;
  const boxOpen = run.phase === "opening" || (breath && !covered);
  const live = (run.phase === "play" || run.phase === "lesson") && !covered && !breath;
  const q = lesson?.q ?? sumAt(deck.current, tally.index);
  const slots = digitCount(q.answer);
  const combo = comboOf(tally.streak);
  const earned = starsOf(level, tally.right);
  const track = Math.min(1, tally.right / spec.stars[2]);
  const misses: Miss[] = log.filter(a => !a.ok).slice(0, 3).map(a => ({ sum: a.q.bazar ? `${a.q.lines.join(", ")}:` : `${a.q.lines[0]} =`, answer: answerText(a.q, a.q.answer), typed: answerText(a.q, a.value), how: a.q.how }));
  const rights = log.filter(a => a.ok);
  const total = totalStars(levels.stars);
  const palette = paletteOf(world);
  const nextWorld = finale && finish?.firstClear && world < WORLD.length - 1 ? WORLD[world + 1].name : "";
  const finishTitle = finish ? (finale && stars ? `${finale} পার` : stars ? `লেভেল ${bn(level)} পার` : `লেভেল ${bn(level)}: আরেকবার?`) : "";
  const finishLine = finish ? (rival ? compareLine(tally, rival)
    : finale && finish.firstClear ? `${WORLD[world].finaleLine}${nextWorld ? ` এবার ${nextWorld}।` : " তিনটা খাতাই শেষ।"}`
    : finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(finish.previousBest)} পয়েন্ট।`
    : humanLine(level, tally.right, tally.wrong)) : "";

  return (
    <div ref={root} className="mh" data-phase={run.phase} data-world={world} data-calm={slow || undefined} data-danger={danger || undefined}
      data-finale={finale ? "" : undefined} onClick={dropFocus}
      style={{ "--surface": palette.surface, "--surface-edge": palette.surfaceEdge, "--rule": palette.rule, "--margin": palette.margin, "--chalk": palette.ink, "--chalk-muted": palette.muted, "--answer": palette.answer, "--good": palette.good, "--bad": palette.bad, "--frame": palette.frame, "--accent": palette.accent, "--accent-deep": palette.accentDeep } as CSSProperties}>
      <div className="mh-play" hidden={over}>
        <div className="mh-clockbar" aria-hidden="true"><i ref={bar} /></div>
        <header className="mh-hud">
          <button type="button" className="mh-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`লেভেল ${bn(level)}, সব লেভেল দেখো`}>
            <b>{finale ? "শেষ পাতা" : `লেভেল ${bn(level)}`}</b>
            <span>{finale ? `লেভেল ${bn(level)}` : WORLD[world].name}</span>
          </button>
          <div className="mh-track" data-boss={finale ? "" : undefined} aria-label={`${bn(tally.right)}টা ঠিক, ${bn(earned)} তারা`}>
            {finale && <b>{finale}</b>}
            <span className="mh-track-bar"><i style={{ transform: `scaleX(${finale ? 1 - track : track})` }} /></span>
            <span className="mh-pips" aria-hidden="true">
              {spec.stars.map((need, index) => (
                <em key={index} data-on={earned > index || undefined} data-pop={starPop === index + 1 || undefined} style={{ left: `${(100 * need) / spec.stars[2]}%` }}>★</em>
              ))}
            </span>
          </div>
          <div className="mh-corner">
            <p className="mh-clock" aria-label={`${bn(left)} সেকেন্ড বাকি`}><b>{bn(left)}</b><small>সে.</small></p>
            {run.phase !== "ready" && <p className="mh-score"><b>{bn(tally.score)}</b>{combo > 1 && <em>×{bn(combo)}</em>}</p>}
            {pop.text && !slow && <i className="mh-pop" key={`p${pop.key}`} aria-hidden="true">{pop.text}</i>}
            {cost.text && <i className="mh-cost" key={`c${cost.key}`} aria-hidden="true">{cost.text}</i>}
          </div>
        </header>

        <div className="mh-surface" ref={surface} data-lesson={lesson ? "" : undefined}>
          {live || run.phase === "lesson" ? (
            <div className="mh-sum" aria-live="polite" aria-atomic="true" data-bazar={q.bazar || undefined}>
              {q.lines.map((line, index) => <p key={index} className="mh-line">{line}{!q.bazar && <span className="mh-eq"> =</span>}</p>)}
              {q.ask && <p className="mh-ask">{q.ask}</p>}
              {q.choices ? (
                <p className="mh-slots" aria-hidden="true"><span data-state={lesson ? "right" : ""}>{lesson ? bn(q.answer) : "?"}</span></p>
              ) : (
                <p className="mh-slots" aria-label={lesson ? `ঠিক উত্তর ${bn(q.answer)}` : `${bn(slots)} অঙ্কের উত্তর${typed ? `, লেখা হয়েছে ${bnDigits(typed)}` : ""}`}>
                  {lesson
                    ? [...bn(q.answer)].map((d, index) => <span key={index} data-state="right">{d}</span>)
                    : Array.from({ length: slots }, (_, index) => <span key={index} data-state={typed[index] ? "typed" : index === typed.length ? "now" : ""}>{typed[index] ? bn(Number(typed[index])) : ""}</span>)}
                  {q.bazar && <small> টাকা</small>}
                </p>
              )}
              {lesson && (
                <p className="mh-how" role="status">
                  {lesson.value !== null && <s>{answerText(q, lesson.value)}</s>} <span>{q.how}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="mh-surface-name" aria-hidden="true">{WORLD[world].surface}</p>
          )}
          {boxShown && (
            <CashBox open={boxOpen} label={covered ? "চালিয়ে যাও" : "শুরু করো"}
              sub={covered ? "থেমে আছে, হিসাব ঢাকা" : rival ? "বন্ধুর হিসাবগুলো" : `৬০ সেকেন্ড · ★ ${bn(spec.stars[0])}টা ঠিকে`}
              onPress={() => { if (covered) resumeFrom(run.why === "sheet" ? "sheet" : "away"); else start(); }} />
          )}
        </div>

        <div className="mh-below" data-kind={spec.choices ? "choices" : "pad"}>
          {run.phase === "ready" ? (
            <StartCard level={level} spec={spec} stars={levels.stars[level] ?? 0} canBack={level > 1} canNext={canPick(level + 1)}
              friend={rival} friendCanvas={friendPreview} onLevel={pickLevel} onSheet={openSheet} />
          ) : q.choices ? (
            <div className="mh-choices" role="group" aria-label="উত্তর বেছে নাও">
              {q.choices.map((value, index) => (
                <button key={`${tally.index}-${index}`} type="button" className="mh-choice" disabled={!live}
                  data-mark={lesson ? (value === q.answer ? "right" : value === lesson.value ? "wrong" : undefined) : undefined}
                  aria-label={live ? `${bn(index + 1)}. ${bn(value)}` : undefined}
                  onPointerDown={onDown(() => answer(value))} onClick={onKey(() => answer(value))}>
                  <kbd aria-hidden="true">{bn(index + 1)}</kbd>{live || lesson ? bn(value) : ""}
                </button>
              ))}
            </div>
          ) : (
            <div className="mh-pad" role="group" aria-label="উত্তর লেখো">
              {PAD.map((d, index) => <button key={d} type="button" className="mh-key" disabled={!live} onPointerDown={onDown(() => press(index + 1))} onClick={onKey(() => press(index + 1))}>{d}</button>)}
              <button type="button" className="mh-key mh-word" disabled={!live || !typed} onPointerDown={onDown(erase)} onClick={onKey(erase)}>মুছো</button>
              <button type="button" className="mh-key" disabled={!live} onPointerDown={onDown(() => press(0))} onClick={onKey(() => press(0))}>০</button>
              <button type="button" className="mh-key mh-word mh-ok" disabled={!live || !typed} onPointerDown={onDown(submitTyped)} onClick={onKey(submitTyped)}>ঠিক আছে</button>
            </div>
          )}
        </div>
      </div>

      {over && finish && (
        <Finish title={finishTitle} slow={slow} finale={Boolean(finale)} choices={endChoices} onCard={seeCard} misses={misses}
          sub={`${WORLD[world].name} · ${finale || spec.label}`}
          stats={{
            right: tally.right, wrong: tally.wrong, score: tally.score, stars, bestStreak: tally.bestStreak,
            avgMs: rights.length ? Math.round(rights.reduce((sum, a) => sum + a.ms, 0) / rights.length) : 0,
            fastestMs: rights.length ? Math.min(...rights.map(a => a.ms)) : 0, lostMs: ROUND_MS - run.budget,
          }}
          line={finishLine} near={nearLine(level, tally.right)}
          best={finish.previousBest !== null && finish.previousBest > tally.score ? `এই লেভেলে তোমার সেরা ${bn(finish.previousBest)} পয়েন্ট।` : ""} />
      )}

      {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={level} recommended={recommended} onPick={pickLevel} onClose={closeSheet} />}

      {over && shared && (
        <section className="mh-result" id="result" ref={resultBox} aria-labelledby="mh-result-title">
          <h2 id="mh-result-title"><em>লেভেল {bn(level)}</em> {bn(tally.right)}টা হিসাব মিলেছে</h2>
          <p>{rival ? compareLine(tally, rival) : humanLine(level, tally.right, tally.wrong)}</p>
          <div className="mh-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="mh-card-summary" />
              <figcaption id="mh-card-summary" className="mh-sr">কার্ড: লেভেল {bn(level)}, {bn(tally.right)}টা মিলেছে, {bn(tally.score)} পয়েন্ট, {bn(stars)} তারা। প্রথম {bn(CARD_SUMS)}টা হিসাব, যেভাবে মিলেছে। {humanLine(level, tally.right, tally.wrong)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="mh-share">
              <label className="mh-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`mukhe-mukhe-hisab-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`}
                caption={caption(level, tally.right, tally.score)} state={state}
                hint="বন্ধু লিংক খুললে একই হিসাবগুলো একই ক্রমে পাবে। স্কোরটা তোমার ফোনে খেলা, লিংকে সেভাবেই লেখা থাকে।"
              />
            </div>
          </div>
        </section>
      )}
      <span className="mh-sr" aria-live="polite">{run.phase === "over" ? "" : covered ? "থেমে আছে। ঘড়িও থেমে আছে।" : ""}</span>
    </div>
  );
}
