"use client";
// IP: what we avoided — no name, round four-quadrant toy, its red-green-yellow-blue set or its tones; ours is brass bells of different sizes hung from a bamboo beam, numbered, with a painted band each (teal, marigold, magenta, indigo, olive), our own clapper-and-overtone notes, and our own fair, tunes and levels. The "echo the tune" game itself is old and free.
// The rules, the clock and what the phone keeps are pure (lib/run.ts, lib/deal.ts, lib/score.ts, lib/save.ts); the bells
// light and swing straight on their elements. This file feeds them taps, keys and performance.now().

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, shake, silenceScheduled, soundOn, totalStars, useBest, useLevels, useSlowMode, useSound, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { WORLD_ART } from "../lib/art";
import { cardBlob, drawCard, type CardData } from "../lib/card";
import { beatMs, finaleOf, makeDeal, makeEndless, onMs, roundCount, roundLen, worldOfDeal, type Deal } from "../lib/deal";
import { MAX_LEN } from "../lib/legacy";
import { LEVEL_COUNT, WORLDS, isFinale, levelAt } from "../lib/levels";
import { bn, caption, clearLine, compareLine, dayLabel, dhakaDate, endlessNear, feat, isDailySeed, missLine, nearLine, parseShared, sharedHash, type Shared } from "../lib/links";
import * as R from "../lib/run";
import { INTRO_KEY, OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import { nextStar, scoreOf, starsOf } from "../lib/score";
import { notesStarted } from "../lib/tick.hot";
import { Rack, BellArt } from "./bells";
import { Finish, type Choice, type FinishStats } from "./finish";
import { LevelSheet } from "./level-sheet";
import { sound } from "./sound";
import { StartCard, type Mode } from "./start-card";
import { Story } from "./story";

const TOOL = "ghontar-sur";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** A fresh endless tune that can't be mistaken for a daily one (those seeds are dates). */
function freshSeed() {
  let seed = newSeed();
  while (isDailySeed(seed)) seed = newSeed();
  return seed;
}

type Finished = { stars: number; previousBest: number | null; firstClear: boolean; beaten: boolean; score: number };
type Mark = { bell: number; grade: R.Grade | null };

export function BellGame() {
  const [mode, setMode] = useState<Mode>("ladder");
  const [deal, setDeal] = useState<Deal>(() => makeDeal(1, 1));
  const [run, setRun] = useState<R.Run>(R.ready);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [callIdx, setCallIdx] = useState(-1);
  const [fin, setFin] = useState<Finished | null>(null);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [story, setStory] = useState(false);
  const [giant, setGiant] = useState(true);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [today, setToday] = useState(0);
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const bells = useRef<(HTMLButtonElement | null)[]>([]);
  const lit = useRef<number[]>([]);
  const graded = useRef<number[]>([]);
  const sign = useRef(1);
  const raf = useRef(0);
  const played = useRef(0);
  const play = useRef(0);
  const recorded = useRef(-1);
  const overAt = useRef(0);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const inView = useInView(root);

  const levels = useLevels(TOOL, LEVEL_COUNT);
  const bestKey = deal.mode === "ladder" ? `${TOOL}-${deal.level}` : TOOL;
  const [best, submitBest] = useBest(bestKey);
  const [dayBest, submitDayBest] = useBest(`${TOOL}-day-${deal.seed}`);
  const timing = slow ? R.SLOW_TIMING : R.TIMING;
  const { spec } = deal;
  const level = deal.level;
  const world = worldOfDeal(deal);
  // The latest of everything, for the frame loop and listeners that outlive a render.
  const now = useRef({ deal, run, fin, slow, timing, open, sheet, story, mode });
  now.current = { ...now.current, deal, fin, slow, timing, open, sheet, story, mode };

  // ---- the bells: lit and swung straight on the elements, so a tap shows in the same frame ----
  function clearLights() {
    bells.current.forEach((element, index) => {
      window.clearTimeout(lit.current[index]); window.clearTimeout(graded.current[index]);
      if (element) { delete element.dataset.lit; delete element.dataset.grade; }
    });
  }
  function swing(element: HTMLElement) {
    const art = element.firstElementChild as SVGElement | null;
    if (!art || typeof art.animate !== "function") return;
    sign.current = -sign.current;
    const turn = sign.current;
    art.getAnimations?.().forEach(animation => animation.cancel());
    // A pendulum: it leaves rest at once (ease-out), then each leg eases in and out until it settles.
    art.animate([
      { transform: "rotate(0deg)", easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      { transform: `rotate(${turn * 11}deg)`, offset: 0.14, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
      { transform: `rotate(${-turn * 7}deg)`, offset: 0.42, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
      { transform: `rotate(${turn * 3.5}deg)`, offset: 0.7, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
      { transform: "rotate(0deg)" },
    ], { duration: 900 });
  }
  function flash(bell: number, ms: number) {
    const element = bells.current[bell];
    if (!element) return;
    element.dataset.lit = "";
    window.clearTimeout(lit.current[bell]);
    lit.current[bell] = window.setTimeout(() => { delete element.dataset.lit; }, ms);
    if (!now.current.slow) swing(element);
  }
  function showGrade(bell: number, grade: R.Grade) {
    const element = bells.current[bell];
    if (!element) return;
    element.dataset.grade = grade;
    window.clearTimeout(graded.current[bell]);
    graded.current[bell] = window.setTimeout(() => { delete element.dataset.grade; }, 700);
  }

  // ---- the frame loop: the phase clock, and the call's notes as they come due ----
  function pump(s: R.Run, at: number) {
    if (!R.ringing(s)) return;
    const { deal: d, timing: t } = now.current, encore = s.phase === "encore";
    const round = encore ? roundCount(d) - 1 : s.round, len = encore ? d.tune.notes.length : roundLen(d, s.round);
    const beat = beatMs(d, round, t.scale), el = R.elapsed(s, at);
    const due = notesStarted(d.beats, len, beat, el, played.current);
    while (played.current < due) {
      const index = played.current++;
      const bell = d.tune.notes[index].bell;
      sound.bell(bell);
      flash(bell, onMs(beat));
      setCallIdx(index);
    }
  }
  function frame() {
    raf.current = 0;
    const at = performance.now(), before = now.current.run;
    const after = R.tick(before, now.current.deal, at, now.current.timing);
    if (after !== before) commit(after, before);
    const s = now.current.run;
    pump(s, at);
    if (R.running(s) && s.dur && !raf.current) raf.current = requestAnimationFrame(frame);
  }
  function commit(next: R.Run, before: R.Run) {
    if (next === before) return;
    now.current.run = next;
    setRun(next);
    if (next.phase !== before.phase) entered(next);
    if (next.why !== null && before.why === null) { clearLights(); silenceScheduled(); }
    if (R.running(next) && next.dur) { if (!raf.current) raf.current = requestAnimationFrame(frame); }
    else if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    pump(next, performance.now());
  }
  function entered(s: R.Run) {
    const d = now.current.deal;
    if (s.phase === "lead") { clearLights(); setCallIdx(-1); setMarks([]); }
    if (s.phase === "call" || s.phase === "encore") { played.current = 0; setCallIdx(-1); }
    if (s.phase === "answer") { clearLights(); setCallIdx(-1); setMarks([]); }
    if (s.phase === "over") {
      overAt.current = performance.now();
      const done = now.current.fin;
      if (!done) return;
      const big = done.stars === 3 || done.beaten || (done.firstClear && d.finale);
      if (s.done === "won") sound.ident(worldOfDeal(d), big, 0.2);
      else sound.slip();
      if (big && s.done === "won" && !now.current.slow) confetti({ colors: ["#13917f", "#e3940a", "#c8326b", "#3f56c8", "#6f8f1d", "#f2a900"] });
    }
  }

  // ---- loading a level: everything about the last one goes (its timers, scheduled notes, marks and result) ----
  function load(next: Deal) {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    clearLights();
    silenceScheduled();
    play.current++;
    const s = R.ready();
    now.current = { ...now.current, deal: next, run: s, fin: null, sheet: false, story: false };
    played.current = 0;
    setDeal(next);
    setRun(s);
    setMarks([]);
    setCallIdx(-1);
    setFin(null);
    setSheet(false);
    setStory(false);
  }
  const canPick = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const rival = friend && friend.seed === deal.seed && friend.level === level ? friend : null;
  function pickLevel(to: number) { if (canPick(to)) { setMode("ladder"); load(makeDeal(to, newSeed())); } }
  function chooseMode(next: Mode) {
    setMode(next);
    if (next === "ladder") load(makeDeal(startLevel(levels.stars, now.current.open), newSeed()));
    else load(makeEndless(next === "daily" ? (today || dhakaDate()) : freshSeed()));
  }
  /** আবার: a new tune in free play; the same tune for the daily or a friend's link. */
  function replay() {
    const d = now.current.deal;
    if (d.mode === "ladder") load(makeDeal(d.level, rival ? d.seed : newSeed()));
    else load(makeEndless(isDailySeed(d.seed) || rival ? d.seed : freshSeed()));
  }

  // ---- moves ----
  function begin() {
    const s = now.current.run;
    if (s.phase !== "ready") return;
    sound.start();
    commit(R.begin(s, now.current.deal, performance.now(), now.current.timing), s);
  }
  function start() {
    if (now.current.run.phase !== "ready") return;
    if (read(INTRO_KEY) !== "1" && now.current.deal.mode === "ladder" && now.current.deal.level === 1) { now.current.story = true; setStory(true); return; }
    begin();
  }
  function storyDone() { write(INTRO_KEY, "1"); now.current.story = false; setStory(false); begin(); }
  function pauseFor(why: R.Why) {
    const s = now.current.run;
    commit(R.pause(s, performance.now(), why), s);
  }
  function resumeFrom(why: R.Why) {
    const s = now.current.run;
    commit(R.resume(s, now.current.deal, performance.now(), why, now.current.timing), s);
  }

  /** A tap on a bell: it rings and swings in this very event, then the reducer decides. */
  function ring(bell: number) {
    const s = now.current.run;
    if (s.phase === "encore" && R.running(s)) { commit(R.skipEncore(s, performance.now()), s); return; }
    if (!R.canTap(s)) return;
    const d = now.current.deal, t = now.current.timing, at = performance.now();
    const result = R.tap(s, d, bell, at, t);
    if (result.kind === "ignored") return;
    const next = result.run;
    if (result.kind === "miss" || result.kind === "lost") {
      sound.slip();
      const element = bells.current[bell];
      if (element) { element.dataset.lit = ""; window.clearTimeout(lit.current[bell]); lit.current[bell] = window.setTimeout(() => { delete element.dataset.lit; }, 300); if (!now.current.slow) shake(element); }
    } else {
      sound.bell(bell);
      flash(bell, 380);
      if (result.grade) showGrade(bell, result.grade);
      if (result.kind === "round") sound.round(next.rounds - 1);
    }
    setMarks(list => [...list, { bell, grade: result.grade }]);
    if (result.kind === "won" || result.kind === "lost") finalize(next);
    commit(next, s);
  }

  /** The level is decided: record the stars and the best once, right now (not behind the cheer or the encore). */
  function finalize(s: R.Run) {
    if (recorded.current === play.current) return;
    recorded.current = play.current;
    const d = now.current.deal, stars = starsOf(d, s), score = scoreOf(d, s);
    const firstClear = d.mode === "ladder" && stars > 0 && !levels.stars[d.level];
    if (d.mode === "ladder" && stars) {
      levels.record(d.level, stars);
      const opened = openAfter(now.current.open, d.level);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best;
    const counts = d.mode === "ladder" ? s.done === "won" : score > 0;
    const beaten = counts && submitBest(score) && previousBest !== null;
    if (d.mode === "endless" && isDailySeed(d.seed) && score > 0) submitDayBest(score);
    const done: Finished = { stars, previousBest, firstClear, beaten, score };
    now.current.fin = done;
    setFin(done);
  }

  // The player's menu: pause stops every clock; চালিয়ে যাও brings it back after a breath.
  const player = useGamePlayer({ onPause: () => pauseFor("away"), onResume: () => resumeFrom("away"), onRestart: replay, onLevels: () => openSheet() });

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
      clearLights();
      silenceScheduled();
    };
  }, []);

  // The big bell stays mounted for its 220 ms fade after the level starts, and is there again on every title.
  useEffect(() => {
    if (run.phase === "ready") { setGiant(true); return; }
    const timer = window.setTimeout(() => setGiant(false), 260);
    return () => window.clearTimeout(timer);
  }, [run.phase === "ready"]);

  // The site-wide sound switch: there is no loop to bring back, but an off switch cuts notes already scheduled (the kit does).
  useEffect(() => { if (!soundIsOn) silenceScheduled(); }, [soundIsOn]);

  // Boot once this phone's stars are read: your own open level (migrated once from the old rule), then a friend's tune
  // from the link, or where you left off.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const mine = readOpen(read(OPEN_KEY), levels.stars);
    if (read(OPEN_KEY) === null) write(OPEN_KEY, String(mine));
    now.current.open = mine;
    setOpen(mine);
    setSite(window.location.host);
    setToday(dhakaDate());
    setBooted(true);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      if (got.level) { setMode("ladder"); setVisit(got.level); load(makeDeal(got.level, got.seed)); }
      else { setMode(isDailySeed(got.seed) ? "daily" : "endless"); load(makeEndless(got.seed)); }
      return true;
    };
    if (!fromHash()) load(makeDeal(startLevel(levels.stars, mine), newSeed()));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- cards ----
  const over = run.phase === "over" && fin !== null;
  const stars = fin?.stars ?? 0;
  const score = scoreOf(deal, run);
  const shared: Shared | null = over ? { seed: deal.seed, level, score, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const card: CardData | null = shared ? { ...shared, stars, bells: spec.bells } : null;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ঘণ্টার সুর ১২৩টা সুর রাফি পয়েন্ট").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { ...friend, stars: 0, bells: friend.level ? levelAt(friend.level).bells : 4 }, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; run.phase brings the friend's canvas back with the start screen.
  }, [state, stars, format, site, friend, run.phase]);

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
  const endChoices: Choice[] = deal.mode === "ladder"
    ? stars ? nextOpen ? [{ label: "পরের লেভেল", run: () => pickLevel(level + 1) }, again, all] : [all, again] : [again, all]
    : [again, { label: "লেভেলে যাও", run: () => chooseMode("ladder") }];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the screen shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const cur = now.current;
    if (cur.sheet || cur.story || !inView) return;
    const key = event.key, enter = key === "Enter" || key === " ", fresh = !event.repeat, s = cur.run;
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab does its own job
    const digit = "১২৩৪৫".includes(key) ? "১২৩৪৫".indexOf(key) : /^[1-5]$/.test(key) ? Number(key) - 1 : -1;
    if ((key === "p" || key === "P") && fresh && R.running(s)) {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor("away");
      return;
    }
    if (s.why === "away") { if (enter) { event.preventDefault(); if (fresh) resumeFrom("away"); } return; }
    if (s.why) return;
    if (digit >= 0 && digit < cur.deal.spec.bells && s.phase === "answer") { event.preventDefault(); if (fresh) ring(digit); return; }
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
    else if (s.phase === "encore") ring(0);
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
  // A bell answers on pointer-down; a click without a pointer (Enter or Space on a focused bell) still counts.
  const onDown = (bell: number) => (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button === 0) { event.preventDefault(); event.currentTarget.blur(); ring(bell); } };
  const onClick = (bell: number) => (event: MouseEvent<HTMLButtonElement>) => { if (event.detail === 0) ring(bell); };

  // ---- what the screen shows ----
  const isReady = run.phase === "ready";
  const len = roundLen(deal, run.round);
  const covered = run.why !== null && R.started(run);
  const finale = finaleOf(deal);
  const worldInfo = WORLDS[world];
  const danger = run.hearts === 1 && R.started(run) && !covered;
  const missed = run.phase === "miss";

  function status() {
    if (covered) return "থেমে আছে।";
    switch (run.phase) {
      case "ready": return deal.mode === "ladder" ? worldInfo.rule : "ঘণ্টা যে ক্রমে বাজে, সেই ক্রমে বাজাও। প্রতিবার একটা করে সুর বাড়ে।";
      case "lead": return "শোনো…";
      case "call": return "শোনো আর দেখো";
      case "answer": return `${spec.reverse ? "উল্টো ক্রমে বাজাও" : spec.rhythm ? "তালে তালে বাজাও" : "এবার তুমি বাজাও"} · ${bn(run.at)}/${bn(len)}`;
      case "miss": return missLine(run.missAt, run.expected, spec.reverse);
      case "cheer": return run.done === "won" ? "পুরোটা হলো!" : "ঠিক! সুর আরও বাড়ছে";
      case "encore": return finale ? `বাজছে: ${finale}` : "";
      default: return "";
    }
  }

  const tuneRows = deal.tune.notes;
  const finishStats: FinishStats = {
    score, unit: deal.mode === "ladder" ? "পয়েন্ট" : "সুর", stars, notes: deal.mode === "ladder" ? len : run.rounds, mistakes: run.mistakes, hearts: run.hearts,
    graded: run.graded, onBeat: run.onBeat, bestStreak: run.bestStreak, heard: run.heard, showStars: deal.mode === "ladder" && stars > 0,
  };
  const won = run.done === "won";
  const next = fin ? nextStar(deal, run) : null;
  const dayLabelText = isDailySeed(deal.seed) ? `রোজের সুর · ${dayLabel(deal.seed)}` : "অন্তহীন সুর";
  const title = fin
    ? deal.mode === "ladder" ? (won ? `${finale ? `${finale} পার` : `লেভেল ${bn(level)} পার`}` : `লেভেল ${bn(level)}: আরেকবার?`)
      : run.rounds >= MAX_LEN ? "পুরো গানটা বাজালে" : `${bn(run.rounds)}টা সুর মনে ছিল`
    : "";
  const line = fin
    ? rival ? compareLine(score, rival.score, rival.name, rival.level)
      : deal.mode === "ladder" ? (fin.firstClear && deal.finale && world < WORLDS.length - 1 ? `${worldInfo.name}-এর শেষ সুর বাজানো হলো। এবার ${WORLDS[world + 1].name}।`
        : fin.beaten && fin.previousBest !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(fin.previousBest)}।`
        : won ? clearLine(level, run.mistakes) : `${bn(len)} নম্বর পর্যন্ত গিয়েছিলে। সুরটা কার্ডে দেখো।`)
      : `${fin.beaten ? "তোমার নতুন সেরা!" : best !== null ? `তোমার সেরা ${bn(best)}টা।` : ""}${isDailySeed(deal.seed) && dayBest !== null ? ` আজকের সেরা ${bn(dayBest)}টা।` : ""}`.trim()
    : "";
  const near = fin ? deal.mode === "ladder" ? nearLine(next, run.mistakes) : endlessNear(score, best) : "";
  const bestLine = fin && deal.mode === "ladder" && fin.previousBest !== null && fin.previousBest > score ? `এই লেভেলে তোমার সেরা ${bn(fin.previousBest)}।` : "";
  const total = totalStars(levels.stars);

  return (
    <div ref={root} className="gs" data-phase={run.phase} data-world={world} data-mode={deal.mode} data-calm={slow || undefined}
      data-danger={danger || undefined} data-finale={finale ? "" : undefined} data-reverse={spec.reverse || undefined} onClick={dropFocus}
      style={{ "--bells": spec.bells } as CSSProperties}>
      <div className="gs-play" hidden={over}>
        <header className="gs-hud">
          {deal.mode === "ladder" ? (
            <button type="button" className="gs-badge-btn" onClick={() => openSheet()} aria-haspopup="dialog" aria-label={`লেভেল ${bn(level)}, সব লেভেল দেখো`}>
              <b>{finale ? "শেষ সুর" : `লেভেল ${bn(level)}`}</b>
              <span>{finale ? `লেভেল ${bn(level)}` : worldInfo.name}</span>
            </button>
          ) : (
            <p className="gs-badge-btn gs-badge-still"><b>{dayLabelText.split(" · ")[0]}</b><span>{isDailySeed(deal.seed) ? dayLabel(deal.seed) : "প্রতিবার নতুন"}</span></p>
          )}
          {deal.mode === "ladder" ? (
            finale ? (
              <div className="gs-boss" aria-label={`${finale}: ভাগ ${bn(Math.min(run.round + 1, roundCount(deal)))}, মোট ${bn(roundCount(deal))}টা`}>
                <b>{finale}</b>
                <span>{Array.from({ length: roundCount(deal) }, (_, index) => <i key={index} data-state={index < run.rounds ? "hit" : index === run.round && !isReady ? "now" : ""} />)}</span>
              </div>
            ) : (
              <ol className="gs-pips" aria-label={`ভাগ ${bn(Math.min(run.round + 1, roundCount(deal)))}, মোট ${bn(roundCount(deal))}টা`}>
                {Array.from({ length: roundCount(deal) }, (_, index) => <li key={index} data-state={index < run.rounds ? "done" : index === run.round && !isReady ? "now" : ""}>{index < run.rounds ? "✓" : ""}</li>)}
              </ol>
            )
          ) : (
            <p className="gs-count" aria-label={`সুর ${bn(Math.min(run.round + 1, MAX_LEN))}টা`}><b>{bn(Math.min(run.round + 1, MAX_LEN))}</b><small>সুর</small></p>
          )}
          <div className="gs-right">
            {isReady ? (
              <p className="gs-score"><b>★ {bn(total)}</b><small>/{bn(LEVEL_COUNT * 3)}</small></p>
            ) : (
              <>
                <p className="gs-hearts" aria-label={`ভুল করার সুযোগ ${bn(run.hearts)}টা বাকি`}>{[0, 1, 2].map(index => <i key={index} aria-hidden="true" data-on={index < run.hearts || undefined}><svg viewBox="0 0 24 22"><path d="M12 21C5 15 1 11.500 1 7.200A5.600 5.600 0 0 1 12 5.300 5.600 5.600 0 0 1 23 7.200C23 11.500 19 15 12 21Z" /></svg></i>)}</p>
                {deal.mode === "ladder" && <p className="gs-score"><b>{bn(run.points)}</b></p>}
              </>
            )}
          </div>
        </header>

        <div className="gs-stagebox" data-world={world}>
          <div className="gs-rack" data-ready={isReady || undefined} data-lit-bell={callIdx >= 0 || undefined}>
            <span className="gs-flags" aria-hidden="true" />
            <Rack count={spec.bells} answer={missed ? run.expected : -1} wrong={missed ? run.picked : -1}
              setBell={(index, element) => { bells.current[index] = element; }} onDown={onDown} onClick={onClick} />
            {(isReady || giant) && !story && (
              <button type="button" className="gs-giant" data-gone={!isReady || undefined} tabIndex={isReady ? 0 : -1} aria-hidden={!isReady || undefined}
                onClick={event => { event.currentTarget.blur(); start(); }}>
                <span className="gs-giant-bell"><BellArt index={0} label="" /></span>
                <span className="gs-giant-sign">
                  <b>শুরু করো</b>
                  <small>{deal.mode === "ladder" ? `${bn(spec.phrases * spec.size)}টা সুর · ${bn(spec.bells)}টা ঘণ্টা` : "সুর বাড়তেই থাকে"}</small>
                </span>
              </button>
            )}
            {covered && player.stage.width === 0 && run.why === "away" && (
              <button type="button" className="gs-cover" onClick={event => { event.currentTarget.blur(); resumeFrom("away"); }}>
                <b>চালিয়ে যাও</b><small>থেমে আছে, সুরটা আবার শুনবে</small>
              </button>
            )}
          </div>
          {!isReady && <Ribbon deal={deal} run={run} marks={marks} callIdx={callIdx} />}
        </div>

        <p className="gs-status" role="status" aria-live="polite">{status()}</p>

        <div className="gs-below">
          {isReady ? (
            <StartCard mode={mode} level={level || 1} stars={levels.stars[level] ?? 0} canBack={level > 1} canNext={canPick(level + 1)}
              friend={rival} friendCanvas={friendPreview} onMode={chooseMode} onLevel={pickLevel} onSheet={() => openSheet()} />
          ) : (
            <p className="gs-hint" aria-hidden="true">{deal.mode === "ladder" && spec.rhythm ? "ফাঁকগুলোও গুনো: যে তালে বাজে, সে তালে।" : spec.reverse ? "শেষ ঘণ্টা আগে, প্রথম ঘণ্টা শেষে।" : " "}</p>
          )}
        </div>
      </div>

      {over && fin && (
        <Finish title={title} sub={deal.mode === "ladder" ? `${worldInfo.name} · ${bn(spec.phrases * spec.size)}টা সুর` : dayLabelText}
          tune={tuneRows} upTo={deal.mode === "ladder" ? len : Math.min(run.round + 1, MAX_LEN)} stats={finishStats} line={line} near={near} best={bestLine}
          slow={slow} finale={Boolean(finale)} won={won} choices={endChoices} onCard={seeCard} />
      )}

      {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={level} recommended={recommended} onPick={pickLevel} onClose={closeSheet} />}
      {story && <Story onDone={storyDone} />}

      {over && card && (
        <section className="gs-result" id="result" ref={resultBox} aria-labelledby="gs-result-title">
          <h2 id="gs-result-title">{deal.mode === "ladder" ? <><em>লেভেল {bn(level)}</em> {bn(score)} পয়েন্ট</> : <><em>{bn(score)}টা সুর</em> মনে রেখে বাজালে</>}</h2>
          <p>{rival ? compareLine(score, rival.score, rival.name, rival.level) : line}</p>
          <div className="gs-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="gs-card-summary" />
              <figcaption id="gs-card-summary" className="gs-sr">কার্ড: {deal.mode === "ladder" ? `লেভেল ${bn(level)}, ${bn(score)} পয়েন্ট, ${bn(stars)} তারা` : `${bn(score)}টা সুর মনে রেখে বাজালাম`}।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="gs-share">
              <label className="gs-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={deal.mode === "ladder" ? `ghontar-sur-${level}.png` : "ghontar-sur.png"} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${stars}|${format}`}
                caption={caption(shared!)} state={state}
                hint="বন্ধু লিংক খুললে একই সুর পাবে। স্কোরটা তোমার নিজের ফোনে খেলা, সেটা লেখা থাকবে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** The strip under the bells: one dot per note of the round. It fills as the call plays and as you answer, and never shows the tune before it is played. */
function Ribbon({ deal, run, marks, callIdx }: { deal: Deal; run: R.Run; marks: Mark[]; callIdx: number }) {
  const len = roundLen(deal, run.round), reverse = deal.spec.reverse;
  const listening = run.phase === "lead" || run.phase === "call" || run.phase === "encore";
  if (len > 14) return <div className="gs-progress" aria-hidden="true"><i style={{ transform: `scaleX(${listening ? Math.max(0, callIdx + 1) / len : run.phase === "cheer" ? 1 : run.at / len})` }} /></div>;
  const position = (tap: number) => reverse ? len - 1 - tap : tap;
  const dots: { bell: number; state: string; grade: R.Grade | null }[] = Array.from({ length: len }, () => ({ bell: -1, state: "", grade: null }));
  if (listening) {
    const notes = run.phase === "encore" ? deal.tune.notes.length : len;
    for (let index = 0; index <= callIdx && index < notes && index < len; index++) dots[index] = { bell: deal.tune.notes[index].bell, state: index === callIdx ? "ring" : "heard", grade: null };
  } else {
    marks.forEach((mark, tap) => { dots[position(tap)] = { bell: mark.bell, state: "ok", grade: mark.grade }; });
    if (run.phase === "miss") {
      const at = position(run.missAt);
      dots[at] = { bell: run.picked, state: "miss", grade: null };
    } else if (run.phase === "answer" && run.at < len) {
      const at = position(run.at);
      dots[at] = { ...dots[at], state: "next" };
    }
  }
  return (
    <ol className="gs-ribbon" data-reverse={reverse || undefined} aria-hidden="true">
      {dots.map((dot, index) => (
        <li key={index} data-state={dot.state || undefined} data-grade={dot.grade ?? undefined} style={dot.bell >= 0 ? { "--c": `var(--bell-${dot.bell})` } as CSSProperties : undefined}>
          {dot.bell >= 0 ? bn(dot.bell + 1) : ""}
        </li>
      ))}
    </ol>
  );
}
