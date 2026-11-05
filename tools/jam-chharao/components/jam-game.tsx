"use client";
// IP: what we avoided — no trademarked puzzle name or its card set, no red car escaping at a right-edge exit, no 6×6 board; ours
// is a 6×7 Dhaka street with a green CNG leaving through a gap in the top footpath, rickshaws, vans, buses and trucks, bricks and
// barricades from a dug-up road, a second (blue) CNG, our own solver-made jams, and no ambulance stuck in the jam.
// The rules, the clock and the unlock are pure (lib/game.ts, lib/session.ts, lib/progress.ts); this file feeds them touches,
// keys and performance.now(), and draws and plays the result.

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { solve, solved, isOut } from "../lib/board";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import {
  clearance, hintCap, movesLeft, onTrack, parOf, reachOf, slide, startGame, starsOf, twoStarMoves, undo, LEVEL_COUNT, type Game,
} from "../lib/game";
import { DIRECTION_WORD, explainHint, NAMES, directionOf, type HintInfo } from "../lib/hint";
import {
  bn, caption, compareLine, duration, feat, finaleLine, fromGame, humanLine, jamLabel, levelName, nearMissLine, parseShared, sharedHash, solvedLine, type Shared,
} from "../lib/link";
import { massOf } from "../lib/motion";
import { afterClear, neighbourLevel, playable, readUnlock, recommended, INTRO_KEY, OLD_PROGRESS_KEY, OLD_STARS_KEY, TOOL, UNLOCK_KEY } from "../lib/progress";
import * as session from "../lib/session";
import { infoOf, isFinale, worldIndex, worldOf } from "../lib/worlds";
import { EndScreen, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { sound } from "./sound";
import { HOLD_SKIP_MS, Story } from "./story";
import { Street } from "./street";
import { TitleScreen } from "./title-screen";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** Arrows and WASD: 0 up, 1 down, 2 left, 3 right. */
const KEYS: Record<string, number> = { ArrowUp: 0, w: 0, W: 0, ArrowDown: 1, s: 1, S: 1, ArrowLeft: 2, a: 2, A: 2, ArrowRight: 3, d: 3, D: 3 };

type Finished = EndStats & { level: number; legacy: boolean; previousBest: number | null; beaten: boolean; firstClear: boolean };
type Shown = { info: HintInfo; pos: number[] };

export function JamGame() {
  const [game, setGameState] = useState<Game>(() => startGame(1));
  const [run, setRunState] = useState<session.Session>(session.title);
  // The latest of both, for handlers that outlive a render (blur, keys, the player's callbacks).
  const now = useRef({ game, run });
  const setGame = (next: Game) => { now.current.game = next; setGameState(next); };
  const setRun = (next: session.Session) => { now.current.run = next; setRunState(next); };

  const [finish, setFinish] = useState<Finished | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [note, setNote] = useState("");
  const [arriveKey, setArriveKey] = useState(0);
  const [picked, setPickedState] = useState(-1);
  const pickedRef = useRef(-1);
  const setPicked = (next: number) => { pickedRef.current = next; setPickedState(next); };
  const [hint, setHint] = useState<Shown | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [unlock, setUnlockState] = useState(1);
  const unlockRef = useRef(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panel, setPanelState] = useState(0);
  const panelRef = useRef(0);
  const [holding, setHolding] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [drop, setDrop] = useState(0);
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const booted = useRef(false);
  const og = useRef(false);
  const introSeen = useRef(true);
  const timers = useRef<number[]>([]);
  const holdTimer = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const inView = useInView(root);
  const levels = useLevels(TOOL, LEVEL_COUNT);

  const { level, legacy } = game;
  const par = parOf(level, legacy);
  const info = legacy ? null : infoOf(level);
  const worldNo = legacy ? 0 : worldIndex(level);
  const [best, submitBest] = useBest(legacy ? `jam-chharao-old-${level}` : `${TOOL}-${level}`, false);
  const player = useGamePlayer({
    onPause: () => pauseFor("away"),
    onResume: () => resumeFrom("away"),
    onRestart: () => toTitle(now.current.game.level, now.current.game.legacy),
    onLevels: () => openSheet(),
  });

  // ---- timers: every celebration and the end screen's entrance; cleared on every new jam and on unmount ----
  function clearTimers() { timers.current.forEach(id => window.clearTimeout(id)); timers.current = []; }
  function later(ms: number, run: () => void) { timers.current.push(window.setTimeout(run, ms)); }
  function stopHold() { window.clearTimeout(holdTimer.current); holdTimer.current = 0; setHolding(false); }

  function setUnlock(next: number) { unlockRef.current = next; setUnlockState(next); write(UNLOCK_KEY, String(next)); }

  /** A fresh jam, with nothing left over from the last one. */
  function load(to: number, old = false) {
    clearTimers();
    stopHold();
    setGame(startGame(to, old));
    setFinish(null);
    setShowEnd(false);
    setNote("");
    setCardOpen(false);
    setSheetOpen(false);
    setPicked(-1);
    setHint(null);
  }
  /** A jam on its title screen. */
  function toTitle(to: number, old = false) { load(to, old); setRun(session.title()); }
  /** Straight into play (পরের জ্যাম, আরেকবার, a jam from the sheet): the vehicles drive in. */
  function playLevel(to: number, old = false) { load(to, old); setRun(session.again(performance.now())); arrive(); }
  function arrive() { setArriveKey(count => count + 1); if (!slow) sound.arrive(); }

  function start() {
    const r = now.current.run;
    if (r.phase !== "title") return;
    const story = !introSeen.current && !friend && !og.current && now.current.game.level === 1 && !now.current.game.legacy;
    const next = session.begin(r, performance.now(), story);
    setRun(next);
    if (next.phase === "story") { panelRef.current = 0; setPanelState(0); return; }
    arrive();
  }
  function endStory() {
    if (now.current.run.phase !== "story") return;
    introSeen.current = true;
    write(INTRO_KEY, "1");
    stopHold();
    setRun(session.storyDone(now.current.run, performance.now()));
    arrive();
  }
  function nextPanel() {
    if (now.current.run.phase !== "story") return;
    if (panelRef.current + 1 >= 3) { endStory(); return; }
    panelRef.current += 1;
    setPanelState(panelRef.current);
    sfx.tap();
  }
  function holdStart() {
    if (holdTimer.current || now.current.run.phase !== "story") return;
    setHolding(true);
    holdTimer.current = window.setTimeout(() => { holdTimer.current = 0; setHolding(false); endStory(); }, HOLD_SKIP_MS);
  }
  /** Let go: a short press shows the next panel; a hold that already skipped has nothing left to do. */
  function holdEnd() {
    const wasHolding = holdTimer.current !== 0;
    stopHold();
    if (wasHolding) nextPanel();
  }

  // ---- pause: the player's menu, blur, a hidden tab and the sheet stop the clock ----
  function pauseFor(why: session.Why) {
    stopHold();
    const r = now.current.run, next = session.pause(r, performance.now(), why);
    if (next !== r) setRun(next);
  }
  function resumeFrom(why: session.Why) {
    const r = now.current.run, next = session.resume(r, performance.now(), why);
    if (next !== r) setRun(next);
  }
  /** The first press after coming back (without the player's menu) only resumes. */
  function wake() {
    const r = now.current.run;
    if (r.phase !== "paused" || r.why !== "away") return false;
    resumeFrom("away");
    return true;
  }
  const live = () => session.canMove(now.current.run);

  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      window.clearTimeout(holdTimer.current);
    };
  }, []);

  // ---- boot, once this phone's stars are read: your own unlock (migrated once), then a friend's jam or yours ----
  useEffect(() => {
    if (!levels.loaded || booted.current) return;
    booted.current = true;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), read(OLD_STARS_KEY), read(OLD_PROGRESS_KEY));
    if (migrated) write(UNLOCK_KEY, String(mine));
    unlockRef.current = mine;
    setUnlockState(mine);
    introSeen.current = read(INTRO_KEY) === "1";
    setSite(window.location.host);
    if (window.location.hash === "#og") { demo(); return; }
    // A friend's link is a visit: it opens its own jam only, and never moves your own unlock.
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      setVisit(got.legacy ? 0 : got.level);
      toTitle(got.level, got.legacy);
      return true;
    };
    if (!fromHash()) toTitle(recommended(mine, levels.stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  /** `#og`, the site's preview image only: a bus-and-truck jam solved in the fewest moves by রাফি, the card open. Nothing is saved. */
  function demo() {
    og.current = true;
    const demoLevel = 12;
    let won = startGame(demoLevel);
    for (const move of solve(won.lay, won.pos) ?? []) won = slide(won, move.car, move.to) ?? won;
    setGame(won);
    setRun({ ...session.title(), phase: "over" });
    setFinish({ level: demoLevel, legacy: false, moves: won.moves.length, seconds: 48, helped: 0, undone: 0, stars: starsOf(won.moves.length, parOf(demoLevel)), previousBest: null, beaten: false, firstClear: false });
    setShowEnd(true);
    setName("রাফি");
    setCardOpen(true);
  }

  // Play-tests only (never in production): the live game, its session, and a shortest way from here.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __jam?: unknown }).__jam = {
      game: () => now.current.game, session: () => now.current.run, path: () => solve(now.current.game.lay, now.current.game.pos),
      go: (to: number, old = false) => playLevel(to, old), title: (to: number, old = false) => toTitle(to, old),
    };
  }, []);

  // ---- moves ----
  /** Plays a move the player made. False when it was refused (not playing, or the road isn't clear). */
  function commit(next: Game | null, car: number) {
    if (!next || !live()) return false;
    const before = now.current.game;
    const kind = before.lay.cars[car].kind;
    const out = isOut(next.lay, next.pos, car);
    if (car < next.lay.heroes) {
      if (out) { sound.horn(); sound.putt(slow ? 2 : 7, 0.18); } else sound.putt(2);
    } else sound.settle(massOf(kind), slow ? 0.05 : 0.12);
    if (onTrack(next.moves.length, par, next.helped, legacy).stars < onTrack(before.moves.length, par, before.helped, legacy).stars) setDrop(key => key + 1);
    setHint(null);
    setGame(next);
    setNote("");
    setPicked(out ? -1 : car);
    if (next.won) cleared(next);
    return true;
  }

  function cleared(won: Game) {
    const at = performance.now(), r = session.finish(now.current.run, at);
    setRun(r);
    const seconds = Math.max(1, Math.round(session.elapsed(r, at) / 1000));
    const stars = starsOf(won.moves.length, par, won.helped, won.legacy);
    const firstClear = !won.legacy && !levels.stars[won.level], previousBest = best;
    let beaten = false;
    // Saved at the moment of the win, not in a timer a quick tap could cancel. A friend's old jam is never saved to the ladder.
    if (!og.current && !won.legacy) {
      levels.record(won.level, stars);
      const opened = afterClear(unlockRef.current, won.level);
      if (opened !== unlockRef.current) setUnlock(opened);
      if (!won.helped) beaten = submitBest(won.moves.length) && previousBest !== null;
    }
    setFinish({ level: won.level, legacy: won.legacy, moves: won.moves.length, seconds, helped: won.helped, undone: won.undone, stars, previousBest, beaten, firstClear });
    const finale = !won.legacy && isFinale(won.level);
    if (finale) sound.motif(worldIndex(won.level));
    if (stars === 3 || beaten || (finale && firstClear)) {
      later(slow ? 0 : 900, () => { sfx.win(); if (!slow) confetti({ colors: ["#2fa84f", "#ffd23f", "#c8372d", "#2f7fd1", "#f0a020"] }); });
    } else later(slow ? 200 : 900, sfx.good);
    later(slow ? 250 : 1100, () => setShowEnd(true));
  }

  function onSlide(car: number, to: number) { return commit(slide(now.current.game, car, to), car); }
  function onPick(car: number) {
    if (!live()) return;
    setPicked(pickedRef.current === car ? -1 : car);
    sfx.tap();
  }
  function onBump(hard: boolean) {
    if (!live()) return;
    if (hard) sound.clank(); else sound.bump();
    setNote(hard ? "ওটা নড়ে না। অন্য দিক দিয়ে ঘোরো।" : "আগে ওই গাড়ি সরাও।");
  }
  function onWall() { if (live()) { sound.clank(); setNote("ইটের স্তূপ বা বেড়া নড়ে না। ওর পাশ দিয়ে পথ করো।"); } }
  function nudge(step: -1 | 1) {
    const g = now.current.game, car = pickedRef.current;
    if (car < 0 || !live() || g.won) return;
    if (!commit(slide(g, car, g.pos[car] + step), car)) { sound.bump(); setNote("ওদিকে রাস্তা বন্ধ। অন্য গাড়ি সরাও।"); }
  }
  function cycle(step: 1 | -1) {
    const g = now.current.game;
    let next = pickedRef.current;
    for (let k = 0; k < g.lay.cars.length; k++) {
      next = next < 0 ? (step > 0 ? 0 : g.lay.cars.length - 1) : (next + step + g.lay.cars.length) % g.lay.cars.length;
      if (!isOut(g.lay, g.pos, next)) break;
    }
    setPicked(next);
    sfx.tap();
  }
  function takeBack() {
    const g = now.current.game;
    if (!g.moves.length || g.won || !live()) return;
    const next = undo(g);
    if (!next) return;
    sfx.whoosh();
    setHint(null);
    setGame(next);
    setNote("");
  }
  /** হিন্ট: first press shows the move and why (and costs a star's worth); pressing again plays it. */
  function help() {
    const g = now.current.game;
    if (g.won || !live()) return;
    if (hint && hint.pos === g.pos) {
      const { car, to } = hint.info.move;
      commit(slide(g, car, to), car);
      return;
    }
    const shown = explainHint(g);
    if (!shown) return;
    sfx.pop();
    setGame({ ...g, helped: g.helped + 1 });
    setHint({ info: shown, pos: g.pos });
    setPicked(shown.move.car);
    setNote("");
  }

  // ---- the sheet, a choice moment: it pauses play ----
  function openSheet() { pauseFor("sheet"); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); resumeFrom("sheet"); }
  function pickLevel(to: number) {
    if (now.current.run.phase === "title") toTitle(to);
    else playLevel(to);
  }

  // ---- what the result offers ----
  const nextLevel = !legacy && level < LEVEL_COUNT && playable(level + 1, unlockRef.current, levels.stars, visit) ? level + 1 : 0;
  const yours = recommended(unlockRef.current, levels.stars);
  const primary = legacy ? { label: "নিজের জ্যামে ফেরো", run: () => toTitle(yours) }
    : nextLevel ? { label: "পরের জ্যাম", run: () => playLevel(nextLevel) }
    : level > unlockRef.current ? { label: "তোমার জ্যামে ফেরো", run: () => toTitle(yours) }
    : { label: "সব জ্যাম", run: openSheet };
  const secondary = { label: "আরেকবার", run: () => playLevel(level, legacy) };

  // ---- keys: Enter picks the next vehicle, arrows slide it, H a hint, Z undo, P the player's pause ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable], .jc-cardpanel")) return;
    if (sheetOpen) return;
    const r = now.current.run, key = event.key, enter = key === "Enter" || key === " ";
    if (enter && element?.closest?.("button, a, summary") && !element.closest(".jc-fit")) return; // a button reached with Tab does its own job
    if (r.phase === "story") {
      if (!enter && KEYS[key] === undefined) return;
      event.preventDefault();
      if (event.repeat) holdStart(); else nextPanel();
      return;
    }
    if (r.phase === "title") {
      if (enter) { event.preventDefault(); if (!event.repeat) start(); }
      else if (key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        const to = now.current.game.legacy ? 0 : neighbourLevel(level, key === "ArrowLeft" ? -1 : 1, unlockRef.current, levels.stars, visit);
        if (to) toTitle(to);
      }
      return;
    }
    if (r.phase === "paused") {
      if (enter && r.why === "away") { event.preventDefault(); if (!event.repeat) resumeFrom("away"); }
      return;
    }
    if (r.phase === "over") {
      if (enter) { event.preventDefault(); if (session.resultKey(r, event.timeStamp, event.repeat) && showEnd && !cardOpen) primary.run(); }
      return;
    }
    if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
    const g = now.current.game;
    if (enter) { event.preventDefault(); if (!event.repeat) cycle(1); return; }
    if (KEYS[key] !== undefined) {
      event.preventDefault();
      const car = pickedRef.current;
      if (car < 0) { cycle(1); return; }
      const finger = KEYS[key], vertical = finger < 2;
      if (vertical === g.lay.cars[car].down) nudge(finger === 0 || finger === 2 ? -1 : 1);
      else if (!event.repeat) cycle(finger === 0 || finger === 2 ? -1 : 1);
      return;
    }
    if (event.repeat) return;
    if (key === "z" || key === "Z" || key === "Backspace") { event.preventDefault(); takeBack(); return; }
    if (key === "h" || key === "H") { event.preventDefault(); help(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    const release = (event: KeyboardEvent) => { if ((event.key === " " || event.key === "Enter") && holdTimer.current) { window.clearTimeout(holdTimer.current); holdTimer.current = 0; setHolding(false); } };
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", release);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", release); };
  }, []);
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement && !button.closest(".jc-cardpanel")) button.blur();
  }

  // ---- cards ----
  const shared = finish ? fromGame(game, name) : null;
  const state = shared ? sharedHash(shared) : "";
  const card: CardData | null = finish ? { level, legacy, count: finish.moves, helped: finish.helped, name } : null;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("জ্যাম ছাড়াও রাফি ১২৩ চালে শেষ জ্যাম").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` and `name` cover everything the card draws; the phase brings the friend's canvas back with the title.
  }, [state, name, format, site, friend, cardOpen, run.phase]);

  // ---- what the HUD shows ----
  const count = game.moves.length, track = onTrack(count, par, game.helped, legacy);
  const lineAt = count + track.left;
  const playing = run.phase === "playing" || run.phase === "paused";
  const danger = run.phase === "playing" && par >= 5 && track.stars > 1 && Number.isFinite(lineAt) && track.left <= 1;
  const rival = friend && friend.level === level && friend.legacy === legacy ? friend : null;
  const clear = clearance(game);
  const finale = !legacy && isFinale(level);
  // What one hint would cost this jam, before → after.
  const hintAfter = Math.min(track.stars, hintCap(game.helped + 1, legacy));
  const showing = hint && hint.pos === game.pos ? hint.info : null;
  const car = picked >= 0 ? game.lay.cars[picked] : null;
  const [low, high] = car && !game.won && picked >= 0 && !isOut(game.lay, game.pos, picked) ? reachOf(game, picked) : [0, 0];
  const status = note || showing?.line || (info && (count === 0 || !car) ? info.teach : car ? `${NAMES[car.kind]} ধরেছ। টেনে সরাও, বা তীর চাপো।` : "");
  const allStars = totalStars(levels.stars);
  const prev = legacy ? 0 : neighbourLevel(level, -1, unlock, levels.stars, visit), next = legacy ? 0 : neighbourLevel(level, 1, unlock, levels.stars, visit);
  const arrows = car && !car.down ? (["বাঁয়ে", "ডানে"] as const) : (["ওপরে", "নিচে"] as const);
  const turn = car && !car.down ? [-90, 90] : [0, 180];

  const endTitle = finish ? (finish.legacy ? `বন্ধুর জ্যাম ছাড়ল, ${bn(finish.moves)} চালে` : isFinale(level) && finish.firstClear ? `${infoOf(level).name} পার` : `জ্যাম ছাড়ল, ${bn(finish.moves)} চালে`) : "";
  const endLine = finish ? (rival ? compareLine(finish.moves, rival.count, rival.name) : !finish.legacy && isFinale(level) && finish.firstClear ? finaleLine(level) : solvedLine(level, finish.legacy, finish.moves, finish.helped)) : "";
  const endNote = finish ? [
    nearMissLine(finish.moves, par, finish.helped, finish.legacy) || (finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড। আগে লেগেছিল ${bn(finish.previousBest)} চাল।` : ""),
    best !== null && !rival && !finish.helped && !finish.legacy ? `এই ফোনে সেরা ${bn(Math.min(best, finish.moves))} চাল।` : "",
  ].filter(Boolean).join(" ") : "";
  const hintMove = showing ? { car: showing.move.car, to: showing.move.to } : null;
  const hintWord = showing ? `${DIRECTION_WORD[directionOf(game.lay.cars[showing.move.car].down, showing.move.from, showing.move.to)]}` : "";

  return (
    <div ref={root} className="jc" data-world={worldNo} data-calm={slow || undefined} data-phase={run.phase} data-danger={danger || undefined} onClick={dropFocus}>
      <div className="jc-top" aria-hidden="true"><i style={{ transform: `scaleX(${clear.fraction})` }} /></div>
      <header className="jc-hud" aria-hidden={run.phase === "title" || run.phase === "story" || undefined}>
        <button type="button" className="jc-badge" onClick={openSheet} aria-haspopup="dialog"
          aria-label={legacy ? `${jamLabel(level, true)}, বন্ধুর জ্যাম। সব জ্যাম দেখো` : `জ্যাম ${bn(level)}, ${levelName(level)}। সব জ্যাম দেখো`}>
          <b>{legacy ? "পু" : bn(level)}</b>
          <span>{legacy ? "পুরোনো জ্যাম" : finale ? "শেষ জ্যাম" : info!.name}<small>{legacy ? `জ্যাম ${bn(level)}` : worldOf(level).name}</small></span>
        </button>
        {finale && (
          <p className="jc-boss" aria-label={`শেষ জ্যাম ${info!.name}: ${clear.heroes > 1 ? `${bn(clear.out)}/${bn(clear.heroes)}টা CNG বেরিয়েছে` : `বাধা ${bn(clear.blockers)}টা`}`}>
            <span><span className="jc-boss-name">{info!.name}</span><b>{clear.heroes > 1 ? `CNG ${bn(clear.out)}/${bn(clear.heroes)}` : `বাধা ${bn(clear.blockers)}`}</b></span>
            <i><em style={{ transform: `scaleX(${clear.fraction})` }} /></i>
          </p>
        )}
        <div className="jc-moves" role="status" aria-label={`${bn(count)} চাল, এখন ${bn(track.stars)} তারার পথে`}>
          <p><span>চাল</span><b>{bn(count)}</b></p>
          <p className="jc-track" aria-hidden="true">
            {[0, 1, 2].map(s => <i key={s === track.stars ? `${s}-${drop}` : s} data-on={s < track.stars || undefined} data-fell={(s === track.stars && drop > 0) || undefined}>★</i>)}
            <small>{track.stars === 3 ? `≤ ${bn(par)}` : track.stars === 2 && Number.isFinite(track.left) ? `≤ ${bn(twoStarMoves(par))}` : ""}</small>
          </p>
          {rival && <small className="jc-rival">{rival.name || "বন্ধু"} {bn(rival.count)}</small>}
        </div>
      </header>

      <div className="jc-stagebox">
        <Street game={game} world={worldNo} calm={slow} arriveKey={arriveKey} picked={picked} hint={hintMove} away={run.phase === "paused"} playing={run.phase === "playing"}
          live={live} wake={wake} onSlide={onSlide} onPick={onPick} onLift={kind => { if (live()) sound.lift(kind); }} onBump={onBump} onWall={onWall} />
      </div>

      {showEnd && finish ? (
        <EndScreen stats={finish} slow={slow} title={endTitle} line={endLine} note={endNote} primary={primary} secondary={secondary} onCard={() => setCardOpen(true)} />
      ) : (
        <>
          <p className="jc-status" role="status" aria-live="polite">{playing || run.phase === "over" ? status : ""}</p>
          <div className="jc-controls">
            {([-1, 1] as const).map((step, index) => (
              <button key={step} type="button" className="jc-arrow" onClick={() => nudge(step)}
                disabled={!car || !playing || game.won || (step < 0 ? game.pos[picked] <= low : game.pos[picked] >= high)}
                aria-label={car ? `${NAMES[car.kind]} ${arrows[index]} সরাও` : `${arrows[index]} সরাও (আগে একটা গাড়ি চাপো)`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${turn[index]}deg)` }}><path d="M5 15l7-7 7 7" /></svg>
              </button>
            ))}
            <button type="button" className="jc-tool" onClick={takeBack} disabled={!playing || !count || game.won}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে নাও
            </button>
            <button type="button" className="jc-tool jc-hint" onClick={help} disabled={!playing || game.won}
              aria-label={showing ? `হিন্ট দেখানো হয়েছে। আবার চাপলে ${NAMES[game.lay.cars[showing.move.car].kind]} ${hintWord} সরে যাবে` : `একটা চালের হিন্ট। ${hintAfter < track.stars ? `তারা ${bn(track.stars)} থেকে ${bn(hintAfter)}-এ নামবে` : "তারা আর কমবে না"}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>
              {showing ? <>চালিয়ে দাও</> : <>হিন্ট <small>{hintAfter < track.stars ? `★${bn(track.stars)}→${bn(hintAfter)}` : `★${bn(track.stars)}`}</small></>}
            </button>
          </div>
        </>
      )}

      {run.phase === "title" && (
        <TitleScreen level={level} legacy={legacy} stars={legacy ? 0 : levels.stars[level] ?? 0} friend={friend} friendCanvas={friendPreview}
          allStars={allStars} total={LEVEL_COUNT * 3} prev={prev} next={next}
          onStart={start} onLevel={to => { if (to) toTitle(to); }} onSheet={openSheet} />
      )}

      {run.phase === "story" && <Story panel={panel} holding={holding} onDown={holdStart} onUp={holdEnd} onCancel={stopHold} />}

      {sheetOpen && (
        <LevelSheet stars={levels.stars} unlock={unlock} visit={visit} current={legacy ? 0 : level} recommended={yours}
          onPick={pickLevel} onClose={closeSheet} />
      )}

      {cardOpen && card && finish && (
        <div className="jc-cardpanel" role="dialog" aria-modal="false" aria-labelledby="jc-card-title">
          <div className="jc-cardpanel-head">
            <h2 id="jc-card-title"><em>{jamLabel(level, legacy)}</em> {bn(finish.moves)} চালে, কার্ড তৈরি</h2>
            <button type="button" className="kit-secondary" onClick={() => setCardOpen(false)}>ফিরে যাও</button>
          </div>
          <p>{rival ? compareLine(finish.moves, rival.count, rival.name) : humanLine(finish.moves, par, finish.helped)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="jc-card-summary" />
            <figcaption id="jc-card-summary" className="jc-sr">কার্ড: {jamLabel(level, legacy)}, {bn(finish.moves)} চালে, সেরা {bn(par)}, {bn(finish.stars)} তারা, সময় {duration(finish.seconds)}। {humanLine(finish.moves, par, finish.helped)}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="jc-share">
            <label className="jc-name">
              <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar
              tool="jam-chharao" fileName={`jam-chharao-${level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${name}|${format}|${finish.moves}`}
              caption={caption(card)} state={state || undefined}
              hint={state ? "বন্ধু লিংক খুললে এই জ্যামটাই পাবে। চালগুলো মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" : "চাল অনেক বেশি হয়ে গেছে, লিংকে ধরছে না। কম চালে ছাড়িয়ে আবার শেয়ার করো।"}
            />
          </div>
        </div>
      )}
      <p className="jc-sr" aria-live="polite">{finish && showEnd ? `জ্যাম ছাড়ল। ${bn(finish.moves)} চাল, ${bn(finish.stars)} তারা। ${endNote}` : ""}</p>
    </div>
  );
}

void feat;
void solved;
