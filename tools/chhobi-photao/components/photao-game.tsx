"use client";
// IP: what we avoided — no brand name for the nonogram genre, none of any app's frames, fonts, colours, mascots or puzzles;
// ours is a কাঁথা patch with a running stitch, our own 30 hand-drawn Bangladeshi pictures and our own sounds.
// The rules, the clock and the unlock are pure (lib/play.ts, lib/session.ts, lib/progress.ts); this file feeds them
// fingers, keys and performance.now(), and draws and plays what they say. The board itself is components/board.tsx.

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { bloomMs } from "../lib/anim.hot";
import { cardBlob, drawCard } from "../lib/draw-card";
import { isSolved, mistakes, puzzleOf, starsFor, LEVEL_COUNT, type Mark, type Mode } from "../lib/game";
import { infoOf, isFinale, toolsOf, worldIndex, worldInfo } from "../lib/levels";
import { bn, caption, cardLine, clearLine, clockText, compareLine, nearMiss, parseShared, pictureName, sharedHash, starNote, timeText, type Shared } from "../lib/link";
import { fitBoard, giveHint, linesDone, linesTotal, startPlay, stitch, takeBack, type Play, type Stitched } from "../lib/play";
import { afterClear, neighbourLevel, playable, readUnlock, recommended, INTRO_KEY, UNLOCK_KEY } from "../lib/progress";
import * as session from "../lib/session";
import * as sound from "../lib/sound";
import { Board, type BoardApi } from "./board";
import { EndScreen, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { HOLD_SKIP_MS, Story } from "./story";
import { TitleScreen } from "./title-screen";

const TOOL = "chhobi-photao";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Finished = EndStats & { level: number; hinted: boolean; previousBest: number | null; beaten: boolean; firstClear: boolean };

export function PhotaoGame() {
  const [play, setPlayState] = useState<Play>(() => startPlay(1));
  const [run, setRunState] = useState<session.Session>(session.title);
  const [mode, setMode] = useState<Mode>("fill");
  // The latest of each, for handlers that outlive a render (blur, keys, the player's callbacks, the board).
  const now = useRef({ play, run });
  const setPlay = (next: Play) => { now.current.play = next; setPlayState(next); };
  const setRun = (next: session.Session) => { now.current.run = next; setRunState(next); };

  const [round, setRound] = useState(0);
  const [hintCell, setHintCell] = useState(-1);
  const [refused, setRefused] = useState<{ index: number; key: number } | null>(null);
  const [hit, setHit] = useState(0);
  const [drop, setDrop] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [note, setNote] = useState("");
  const [clock, setClock] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [unlock, setUnlockState] = useState(1);
  const unlockRef = useRef(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panel, setPanelState] = useState(0);
  const panelRef = useRef(0);
  const [holding, setHolding] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [space, setSpace] = useState({ width: 340, height: 420 });
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const booted = useRef(false);
  const og = useRef(false);
  const introSeen = useRef(true);
  const combo = useRef(0);
  const refusedKey = useRef(0);
  const timers = useRef<number[]>([]);
  const holdTimer = useRef(0);
  const board = useRef<BoardApi | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const playBox = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const inView = useInView(root);
  const levels = useLevels(TOOL, LEVEL_COUNT);

  const level = play.level, info = infoOf(level), world = worldIndex(level), tools = toolsOf(level);
  const { size, rows, cols } = puzzleOf(level);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);
  const player = useGamePlayer({
    onPause: () => pauseFor("away"),
    onResume: () => resumeFrom("away"),
    onRestart: () => toTitle(now.current.play.level),
    onLevels: () => openSheet(),
  });

  // ---- timers: the refusal flash, the end screen's entrance; cleared on every new board and on unmount ----
  function clearTimers() { timers.current.forEach(id => window.clearTimeout(id)); timers.current = []; }
  function later(ms: number, then: () => void) { timers.current.push(window.setTimeout(then, ms)); }
  function stopHold() { window.clearTimeout(holdTimer.current); holdTimer.current = 0; setHolding(false); }
  function setUnlock(next: number) { unlockRef.current = next; setUnlockState(next); write(UNLOCK_KEY, String(next)); }

  /** A fresh board of `to`, with nothing left over from the last one. */
  function load(to: number) {
    clearTimers();
    stopHold();
    board.current?.release();
    combo.current = 0;
    setPlay(startPlay(to));
    setMode("fill");
    setHintCell(-1); setRefused(null); setNote("");
    setFinish(null); setShowEnd(false); setCardOpen(false); setSheetOpen(false);
    setClock(0);
    setRound(count => count + 1);
  }
  /** A level on its title screen. */
  function toTitle(to: number) { load(to); setRun(session.title()); }
  /** Straight into play (পরের লেভেল, আবার খেলো, a level from the sheet). */
  function playLevel(to: number) { load(to); setRun(session.again()); }

  function start() {
    const r = now.current.run;
    if (r.phase !== "title") return;
    const story = !introSeen.current && !friend && !og.current && now.current.play.level === 1;
    const next = session.begin(r, story);
    setRun(next);
    if (next.phase === "story") { panelRef.current = 0; setPanelState(0); }
  }
  function endStory() {
    if (now.current.run.phase !== "story") return;
    introSeen.current = true;
    write(INTRO_KEY, "1");
    stopHold();
    setRun(session.storyDone(now.current.run));
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
  function holdEnd() {
    const wasHolding = holdTimer.current !== 0;
    stopHold();
    if (wasHolding) nextPanel();
  }

  // ---- pause: the player's menu, blur, a hidden tab and the sheet stop the clock and let go of a drag ----
  function pauseFor(why: session.Why) {
    stopHold();
    board.current?.release();
    const r = now.current.run, next = session.pause(r, performance.now(), why);
    if (next !== r) setRun(next);
  }
  function resumeFrom(why: session.Why) {
    const r = now.current.run, next = session.resume(r, performance.now(), why);
    if (next !== r) setRun(next);
  }
  /** The first press on the board after coming back (without the player's menu) only resumes. */
  function wake() {
    const r = now.current.run;
    if (r.phase !== "paused" || r.why !== "away") return false;
    resumeFrom("away");
    return true;
  }
  const live = () => session.canPlay(now.current.run);

  useEffect(() => {
    const away = () => pauseFor("away");
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener("blur", away);
    window.addEventListener("pagehide", away);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", away);
      window.removeEventListener("pagehide", away);
      document.removeEventListener("visibilitychange", hide);
      clearTimers();
      window.clearTimeout(holdTimer.current);
    };
  }, []);

  // The HUD clock: four times a second while it runs.
  useEffect(() => {
    if (run.since === null) { setClock(session.seconds(run, performance.now())); return; }
    const timer = window.setInterval(() => setClock(session.seconds(now.current.run, performance.now())), 250);
    return () => window.clearInterval(timer);
  }, [run]);

  // The room the board may use: the middle row of the stage.
  useEffect(() => {
    const element = playBox.current;
    if (!element) return;
    const measure = () => setSpace({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // ---- boot, once this phone's stars are read: your own unlock (migrated once), then a friend's level or yours ----
  useEffect(() => {
    if (!levels.loaded || booted.current) return;
    booted.current = true;
    const { unlock: mine, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars, LEVEL_COUNT);
    if (migrated) write(UNLOCK_KEY, String(mine));
    unlockRef.current = mine;
    setUnlockState(mine);
    introSeen.current = read(INTRO_KEY) === "1";
    setSite(window.location.host);
    if (window.location.hash === "#og") { demo(); return; }
    // A friend's link is a visit: it opens its own level only, and never moves your own unlock.
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      setVisit(got.level);
      toTitle(got.level);
      return true;
    };
    if (!fromHash()) toTitle(recommended(mine, levels.stars));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  /** `#og`, the site's preview image only: level 26 bloomed in 2:10 by রাফি, the card open. Nothing is saved. */
  function demo() {
    og.current = true;
    const demoLevel = 26, { solution } = puzzleOf(demoLevel);
    const whole = startPlay(demoLevel);
    setPlay({ ...whole, cells: solution.map(filled => (filled ? 1 : 0) as Mark), stitches: 50, longest: 10 });
    setRound(count => count + 1);
    setRun({ ...session.title(), phase: "over" });
    setFinish({ level: demoLevel, seconds: 130, wrong: 0, stitches: 50, longest: 10, stars: 3, hinted: false, previousBest: null, beaten: false, firstClear: false });
    setShowEnd(true);
    setName("রাফি");
    setCardOpen(true);
  }

  // Play-tests only (never in production): the live round and session.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __photao?: unknown }).__photao = { play: () => now.current.play, session: () => now.current.run, solution: () => puzzleOf(now.current.play.level).solution };
  }, []);

  // ---- the round ----
  /** The one door every stitch goes through: the board's strokes and taps, and the keyboard. */
  function act(indices: readonly number[], to: Mark, record: boolean, soFar: number): Stitched | null {
    if (!live()) return null;
    const before = now.current.play, result = stitch(before, indices, to, record, soFar);
    if (!result.moved && result.refused < 0) return result;
    const at = performance.now(), armed = session.arm(now.current.run, at);
    if (armed !== now.current.run) setRun(armed);
    if (result.play !== before) setPlay(result.play);
    if (result.moved) {
      setHintCell(-1);
      if (to === 1) sound.stitch(soFar); else if (to === 2) sound.crossed(); else sfx.tap();
      if (to === 0) combo.current = 0;
      const gained = linesDone(result.play) - linesDone(before);
      if (gained > 0 && !isSolved(result.play)) { sound.lineDone(combo.current); combo.current += gained; }
      if (result.refused < 0) setNote("");
    }
    if (result.refused >= 0) {
      combo.current = 0;
      sound.snap();
      setRefused({ index: result.refused, key: ++refusedKey.current });
      later(600, () => setRefused(null));
      if (result.mistake) setHit(count => count + 1);
      setNote(to === 1 ? "এই ঘরটা ফাঁকা থাকবে। সুতো ছিঁড়ল।" : "এই ঘরে ছবি আছে। ✕ দেওয়া যাবে না।");
    }
    if (isSolved(result.play)) solved(result.play);
    return result;
  }

  function onLocked() { sfx.tap(); setNote("এটা নানির ফোঁড়। সরানো যায় না।"); }

  function undo() {
    if (!live()) return;
    const before = now.current.play, back = takeBack(before);
    if (back === before) return;
    combo.current = 0;
    sfx.drop();
    setPlay(back); setHintCell(-1); setNote("");
  }

  function hint() {
    if (!live() || !tools.hint) return;
    const helped = giveHint(now.current.play);
    if (!helped) return;
    const armed = session.arm(now.current.run, performance.now());
    if (armed !== now.current.run) setRun(armed);
    sound.glint();
    setPlay(helped.play);
    setHintCell(helped.index);
    setNote("দাগ দেওয়া ঘরটা হিন্ট থেকে এল। হিন্ট নিলে বড়জোর ২ তারা।");
    if (isSolved(helped.play)) solved(helped.play);
  }

  function solved(whole: Play) {
    if (now.current.run.phase !== "playing") return;
    const at = performance.now(), r = session.finish(now.current.run, at);
    setRun(r);
    const seconds = session.seconds(r, at), wrong = mistakes(whole), hinted = whole.hints > 0, stars = starsFor(wrong, hinted);
    const lv = whole.level, firstClear = !levels.stars[lv], previousBest = best;
    let beaten = false;
    // Saved at the moment of the win, not in a timer a quick tap could cancel.
    if (!og.current) {
      levels.record(lv, stars);
      const opened = afterClear(unlockRef.current, lv, LEVEL_COUNT);
      if (opened !== unlockRef.current) setUnlock(opened);
      beaten = submitBest(seconds) && previousBest !== null;
    }
    setFinish({ level: lv, seconds, wrong, stitches: whole.stitches, longest: whole.longest, stars, hinted, previousBest, beaten, firstClear });
    setNote("");
    sound.bloom(size, worldIndex(lv), isFinale(lv));
    if (stars === 3 || beaten || (isFinale(lv) && firstClear)) later(slow ? 0 : bloomMs(size) + 500, () => { if (!slow) confetti({ colors: ["#f2a900", "#b5452b", "#2f9e44", "#4a90b8", "#fbf4e4"] }); });
    later(slow ? 250 : bloomMs(size) + 350, () => setShowEnd(true));
  }

  // ---- the sheet, a choice moment: it pauses play ----
  function openSheet() { pauseFor("sheet"); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); resumeFrom("sheet"); }
  function pickLevel(to: number) {
    if (now.current.run.phase === "title") toTitle(to);
    else playLevel(to);
  }

  // ---- what the result offers ----
  const nextLevel = level < LEVEL_COUNT && playable(level + 1, unlockRef.current, levels.stars, visit) ? level + 1 : 0;
  const yours = recommended(unlockRef.current, levels.stars);
  const primary = nextLevel ? { label: "পরের লেভেল", run: () => playLevel(nextLevel) }
    : level > unlockRef.current ? { label: "তোমার লেভেলে ফেরো", run: () => toTitle(yours) }
    : { label: "সব লেভেল", run: openSheet };
  const secondary = { label: "আবার খেলো", run: () => playLevel(level) };

  // ---- keys: Z undoes, H hints, P the player's pause, Enter or Space start and go on; the cells do their own keys ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || event.defaultPrevented || element?.closest?.("input, textarea, select, [contenteditable], .cp-cardpanel")) return;
    if (sheetOpen) return;
    const r = now.current.run, key = event.key, enter = key === "Enter" || key === " ";
    // A button reached with Tab does its own Enter.
    if (enter && element?.closest?.("button, a, summary")) return;
    if (r.phase === "story") {
      if (!enter) return;
      event.preventDefault();
      if (event.repeat) holdStart(); else nextPanel();
      return;
    }
    if (r.phase === "title") {
      if (enter) { event.preventDefault(); if (!event.repeat) start(); }
      else if (key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        const to = neighbourLevel(level, key === "ArrowLeft" ? -1 : 1, unlockRef.current, levels.stars, visit, LEVEL_COUNT);
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
    if (enter) { return; }
    if (event.repeat) return;
    if (key === "z" || key === "Z") { event.preventDefault(); if (tools.undo) undo(); }
    else if (key === "h" || key === "H") { event.preventDefault(); hint(); }
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
    if (button instanceof HTMLButtonElement && !button.closest(".cp-cardpanel") && !button.closest(".cp-cells")) button.blur();
  }

  // ---- cards ----
  const shared: Shared | null = finish ? { level: finish.level, seconds: finish.seconds, mistakes: finish.wrong, hinted: finish.hinted, name } : null;
  const state = shared ? sharedHash(shared) : "";
  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`ছবি ফোটাও লেভেল ১২৩ শেষ ছবি ${pictureName(level)} ${name}`).then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; the phase brings the friend's canvas back with the title.
  }, [state, format, site, friend, cardOpen, run.phase]);

  // ---- what the HUD shows ----
  const wrong = mistakes(play), hinted = play.hints > 0, earned = starsFor(wrong, hinted);
  const done = linesDone(play), total = linesTotal(level);
  const playingNow = run.phase === "playing" || run.phase === "paused";
  const danger = run.phase === "playing" && !hinted && earned === 2 && wrong === 2;
  const rival = friend && friend.level === level ? friend : null;
  const allStars = totalStars(levels.stars);
  const prev = neighbourLevel(level, -1, unlock, levels.stars, visit, LEVEL_COUNT), next = neighbourLevel(level, 1, unlock, levels.stars, visit, LEVEL_COUNT);
  const lastStars = useRef(3);
  useEffect(() => {
    if (run.phase === "playing" && earned < lastStars.current) setDrop(key => key + 1);
    lastStars.current = playingNow ? earned : 3;
  }, [earned, run.phase]);
  const teaching = level === 1 && !levels.stars[1] && run.phase === "playing" && play.stitches === 0;
  const status = note || (playingNow ? (done < 2 ? info.teach : `${bn(done)}/${bn(total)}টা লাইন মিলেছে`) : "");
  const fit = fitBoard(space.width, space.height, size, Math.max(1, ...rows.map(clue => clue.length)), Math.max(1, ...cols.map(clue => clue.length)));

  const endTitle = finish ? `${pictureName(level)} ফুটল` : "";
  const endLine = finish ? (rival ? compareLine(finish.seconds, rival.seconds, rival.name) : clearLine(level)) : "";
  const endNote = finish ? [
    nearMiss(finish.wrong, finish.hinted) || (finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড। আগে লেগেছিল ${timeText(finish.previousBest)}।` : ""),
    finish.previousBest !== null && !rival ? `এই ফোনে সেরা ${timeText(Math.min(finish.previousBest, finish.seconds))}।` : "",
  ].filter(Boolean).join(" ") : "";

  return (
    <div ref={root} className="cp" data-world={world} data-calm={slow || undefined} data-phase={run.phase} onClick={dropFocus}>
      <header className="cp-hud" aria-hidden={run.phase === "title" || run.phase === "story" || undefined}>
        <button type="button" className="cp-badge-btn" onClick={openSheet} aria-haspopup="dialog" aria-label={`লেভেল ${bn(level)}, ${worldInfo(level).name}। সব লেভেল দেখো`}>
          <b>{bn(level)}</b><span>{info.finale ? "শেষ ছবি" : worldInfo(level).name}<small>{size}×{size}{info.given ? ` · নানির ফোঁড় ${bn(info.given)}` : ""}</small></span>
        </button>
        {info.finale && (
          <p className="cp-boss" aria-label={`শেষ ছবি ${pictureName(level)}: ${bn(done)}/${bn(total)}টা লাইন মিলেছে`}>
            <span>{pictureName(level)} <b>{bn(done)}/{bn(total)}</b></span>
            <i><em style={{ transform: `scaleX(${done / total})` }} /></i>
          </p>
        )}
        <div className="cp-clock" role="timer" aria-label={`সময় ${timeText(clock)}, এখন ${bn(earned)} তারার পথে`}>
          <b>{clockText(clock)}</b>
          <p className="cp-track" aria-hidden="true">
            {[0, 1, 2].map(s => <i key={s === earned ? `${s}-${drop}` : s} data-on={s < earned || undefined} data-fell={(s === earned && drop > 0) || undefined}>★</i>)}
          </p>
          <small className="cp-starnote">{starNote(wrong, hinted)}</small>
          {rival && <small className="cp-rival">{rival.name || "বন্ধু"} {clockText(rival.seconds)}</small>}
        </div>
      </header>

      <div ref={playBox} className="cp-play" data-danger={danger || undefined} data-finale={info.finale || undefined}>
        <div className="cp-progress" aria-hidden="true"><i style={{ transform: `scaleX(${done / total})` }} /></div>
        <div className="cp-boardbox">
          <Board key={round} play={play} fit={fit} mode={mode} tools={tools} slow={slow} solved={isSolved(play)} hintCell={hintCell} refused={refused}
            teaching={teaching} live={live} wake={wake} onStitch={act} onLocked={onLocked} api={board} />
        </div>
        {hit > 0 && !slow && <i key={hit} className="cp-hit" aria-hidden="true" />}
      </div>

      <div className="cp-bar" data-tools={tools.undo || undefined}>
        <p className="cp-status" role="status" aria-live="polite">{status}</p>
        {tools.undo && (
          <div className="cp-tools" data-n={tools.hint ? 2 : 1} data-modes={tools.cross || undefined}>
            {tools.cross && (
              <div className="cp-modes" role="group" aria-label="কী বসাবে">
                <button type="button" aria-pressed={mode === "fill"} onClick={() => { setMode("fill"); sfx.tap(); }}><span className="cp-swatch" aria-hidden="true" />ভরাট</button>
                <button type="button" aria-pressed={mode === "cross"} onClick={() => { setMode("cross"); sfx.tap(); }}><span className="cp-x" aria-hidden="true" />খালি দাগ</button>
              </div>
            )}
            <button type="button" className="cp-tool" onClick={undo} disabled={!play.history.length || !playingNow} aria-label="ফিরিয়ে আনো">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg><span className="cp-lbl">ফিরিয়ে আনো</span>
            </button>
            {tools.hint && <button type="button" className="cp-tool" onClick={hint} disabled={!playingNow}><span>হিন্ট</span></button>}
          </div>
        )}
      </div>

      {run.phase === "title" && (
        <TitleScreen level={level} stars={levels.stars[level] ?? 0} friend={friend} friendCanvas={friendPreview}
          slow={slow} allStars={allStars} total={LEVEL_COUNT * 3} prev={prev} next={next}
          onStart={start} onLevel={to => { if (to) toTitle(to); }} onSheet={openSheet} />
      )}

      {run.phase === "story" && <Story panel={panel} holding={holding} onDown={holdStart} onUp={holdEnd} onCancel={stopHold} />}

      {sheetOpen && <LevelSheet stars={levels.stars} unlock={unlock} visit={visit} current={level} recommended={yours} onPick={pickLevel} onClose={closeSheet} />}

      {showEnd && finish && (
        <EndScreen level={finish.level} stats={finish} slow={slow} finale={isFinale(finish.level)} title={endTitle} line={endLine} note={endNote} primary={primary} secondary={secondary} onCard={() => setCardOpen(true)} />
      )}

      {cardOpen && shared && finish && (
        <div className="cp-cardpanel" role="dialog" aria-modal="false" aria-labelledby="cp-card-title">
          <div className="cp-cardpanel-head">
            <h2 id="cp-card-title"><em>লেভেল {bn(finish.level)}</em> {pictureName(finish.level)}, কার্ড তৈরি</h2>
            <button type="button" className="kit-secondary" onClick={() => setCardOpen(false)}>ফিরে যাও</button>
          </div>
          <p>{rival ? compareLine(finish.seconds, rival.seconds, rival.name) : cardLine(shared)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cp-card-summary" />
            <figcaption id="cp-card-summary" className="cp-sr">কার্ড: লেভেল {bn(finish.level)}, {pictureName(finish.level)}, {timeText(finish.seconds)}, {bn(finish.stars)} তারা। {cardLine(shared)}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="cp-share">
            <label className="cp-name">
              <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`chhobi-photao-${finish.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`}
              caption={caption(shared)} state={state} hint="বন্ধু লিংক খুললে একই ছবির ধাঁধা পাবে। সময় আর ভুলের হিসাবটা তোমার ফোনের।" />
          </div>
        </div>
      )}
      <p className="cp-sr" aria-live="polite">{finish && showEnd ? `${endTitle}। ${bn(finish.stars)} তারা। ${endNote}` : ""}</p>
    </div>
  );
}
