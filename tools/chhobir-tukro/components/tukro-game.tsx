"use client";
// IP: what we avoided — no jigsaw brand's name, box art, piece cut or app layout; every painting is our own Bangladeshi
// village scene composed in code, with our own sounds.
// The rules, the clock and the unlock are pure (lib/play.ts, lib/session.ts, lib/progress.ts); this file feeds them
// fingers, keys and performance.now(), and draws and plays what they say. The table itself is components/table.tsx.

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { paintCanvas } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { parFor, planOf, starsFor, LEVEL_COUNT } from "../lib/game";
import { infoOf, isFinale, worldIndex, worldInfo } from "../lib/levels";
import { bn, caption, cardLine, clearLine, clockText, compareLine, nearMiss, paintingName, parseShared, sharedHash, sizeText, timeText, type Shared } from "../lib/link";
import { dropPiece, left as leftOf, resize, startPlay, turnOne, upright, type Dropped, type Play } from "../lib/play";
import { afterClear, neighbourLevel, playable, readUnlock, recommended, INTRO_KEY, UNLOCK_KEY } from "../lib/progress";
import * as session from "../lib/session";
import { SNAP_MS } from "../lib/table.hot";
import * as sound from "../lib/sound";
import { EndScreen, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { HOLD_SKIP_MS, Story } from "./story";
import { Table, type TableApi } from "./table";
import { TitleScreen } from "./title-screen";

const TOOL = "chhobir-tukro";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Finished = EndStats & { level: number; previousBest: number | null; beaten: boolean; firstClear: boolean };

export function TukroGame() {
  const [play, setPlayState] = useState<Play>(() => startPlay(1, 12));
  const [run, setRunState] = useState<session.Session>(session.title);
  const [selected, setSelectedState] = useState(-1);
  // The latest of each, for handlers that outlive a render (blur, keys, the player's callbacks, the table).
  const now = useRef({ play, run, selected });
  const setPlay = (next: Play) => { now.current.play = next; setPlayState(next); };
  const setRun = (next: session.Session) => { now.current.run = next; setRunState(next); };
  const setSelected = (next: number) => { now.current.selected = next; setSelectedState(next); };

  const slotsRef = useRef(12);
  const [round, setRound] = useState(0);
  const [fly, setFly] = useState(false);
  const [sweep, setSweep] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [note, setNote] = useState("");
  const [clock, setClock] = useState(0);
  const [drop, setDrop] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [unlock, setUnlockState] = useState(1);
  const unlockRef = useRef(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [panel, setPanelState] = useState(0);
  const panelRef = useRef(0);
  const [holding, setHolding] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
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
  const table = useRef<TableApi | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const thumb = useRef<HTMLCanvasElement>(null);
  const peekCanvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(root);
  const levels = useLevels(TOOL, LEVEL_COUNT);

  const level = play.puzzle.level, info = infoOf(level), world = worldIndex(level), { n, rotate } = planOf(level);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);
  const player = useGamePlayer({
    onPause: () => pauseFor("away"),
    onResume: () => resumeFrom("away"),
    onRestart: () => toTitle(now.current.play.puzzle.level),
  });

  // ---- timers: the celebration and the end screen's entrance; cleared on every new table and on unmount ----
  function clearTimers() { timers.current.forEach(id => window.clearTimeout(id)); timers.current = []; }
  function later(ms: number, then: () => void) { timers.current.push(window.setTimeout(then, ms)); }
  function stopHold() { window.clearTimeout(holdTimer.current); holdTimer.current = 0; setHolding(false); }
  function setUnlock(next: number) { unlockRef.current = next; setUnlockState(next); write(UNLOCK_KEY, String(next)); }

  /** A fresh table of `to`, with nothing left over from the last one. */
  function load(to: number, flyNow: boolean) {
    clearTimers();
    stopHold();
    table.current?.cancel();
    setPlay(startPlay(to, slotsRef.current));
    setSelected(-1);
    setFinish(null);
    setShowEnd(false);
    setNote("");
    setClock(0);
    setCardOpen(false);
    setPeek(false);
    setSheetOpen(false);
    setFly(flyNow);
    setRound(count => count + 1);
  }
  /** A level on its title screen. */
  function toTitle(to: number) { load(to, false); setRun(session.title()); }
  /** Straight into play (পরের লেভেল, আবার খেলো, a level from the sheet): the picture breaks into the tray. */
  function playLevel(to: number) { load(to, true); setRun(session.again(performance.now(), slow)); breakUp(); }
  function breakUp() { if (!slow) sound.scatter(now.current.play.table.slots.filter(id => id >= 0).length); }

  function start() {
    const r = now.current.run;
    if (r.phase !== "title") return;
    const story = !introSeen.current && !friend && !og.current && now.current.play.puzzle.level === 1;
    const next = session.begin(r, performance.now(), story, slow);
    setRun(next);
    if (next.phase === "story") { panelRef.current = 0; setPanelState(0); return; }
    setFly(true); setRound(count => count + 1);
    breakUp();
  }
  function endStory() {
    if (now.current.run.phase !== "story") return;
    introSeen.current = true;
    write(INTRO_KEY, "1");
    stopHold();
    setRun(session.storyDone(now.current.run, performance.now(), slow));
    setFly(true); setRound(count => count + 1);
    breakUp();
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

  // ---- pause: the player's menu, blur, a hidden tab and the sheet stop the clock and drop the piece in the hand ----
  function pauseFor(why: session.Why) {
    stopHold();
    table.current?.cancel();
    setPeek(false);
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
  const live = () => session.canPlay(now.current.run, performance.now());

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

  // The HUD clock: four times a second while playing.
  useEffect(() => {
    if (run.phase !== "playing") { setClock(session.seconds(run, performance.now())); return; }
    const timer = window.setInterval(() => setClock(session.seconds(now.current.run, performance.now())), 250);
    return () => window.clearInterval(timer);
  }, [run]);

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

  /** `#og`, the site's preview image only: level 12 whole in 58 s by রাফি, the card open. Nothing is saved. */
  function demo() {
    og.current = true;
    const demoLevel = 12;
    let whole = startPlay(demoLevel, slotsRef.current);
    whole = { ...whole, table: { ...whole.table, placed: whole.table.placed.map(() => true), slots: whole.table.slots.map(() => -1), queue: [], turns: whole.table.turns.map(() => 0) }, best: 9, wrong: 2, turned: 14 };
    setPlay(whole);
    setRound(count => count + 1);
    setRun({ ...session.title(), phase: "over" });
    setFinish({ level: demoLevel, seconds: 58, wrong: 2, best: 9, turned: 14, stars: starsFor(demoLevel, 58), rotate: true, previousBest: null, beaten: false, firstClear: false });
    setShowEnd(true);
    setName("রাফি");
    setCardOpen(true);
  }

  // Play-tests only (never in production): the live round and session.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __tukro?: unknown }).__tukro = { play: () => now.current.play, session: () => now.current.run, table: () => table.current };
  }, []);

  // ---- the round ----
  /** The table asks what a drop at board point (x, y) means. With no piece (a board tap with nothing picked), it's a hint. */
  function onDrop(id: number, x: number, y: number, size: number): Dropped | null {
    if (!live()) return null;
    if (id < 0) { setNote("আগে নিচ থেকে একটা টুকরো বেছে নাও।"); sound.tap(); return null; }
    const before = now.current.play, result = dropPiece(before, id, x, y, size);
    if (result.landed === "none") return null;
    setPlay(result.play);
    setSelected(-1);
    if (result.landed === "snap") {
      sound.snap(result.play.streak, (slow ? 60 : SNAP_MS) / 1000);
      if (result.frame && !result.done) { sound.frame(); setNote("ফ্রেম পুরো! এবার ভেতরটা।"); }
      else {
        const remaining = leftOf(result.play);
        setNote(result.play.streak >= 3 ? `পরপর ${bn(result.play.streak)}টা! ${remaining === 1 ? "আর ১টা!" : `আর ${bn(remaining)}টা।`}` : "");
      }
      if (result.done) solved(result.play);
      return result;
    }
    if (result.landed === "away") { setNote(""); return result; }
    sound.slide();
    setSelected(id);
    setNote(result.landed === "turn" ? "জায়গা ঠিক, টুকরোটা শুধু ঘোরানো। টুকরোয় চাপো, ঘুরবে।"
      : result.landed === "fits" ? "খাঁজ মিলেছে, ছবি মেলেনি। পাশের রং আবার দেখো।"
      : n >= 6 ? "এই ঘরের খাঁজ অন্য রকম। বোর্ডের দাগের সাথে মিলিয়ে দেখো।" : "এটা ওই ঘরের টুকরো না। ছবির সাথে মিলিয়ে দেখো।");
    return result;
  }

  function onTap(id: number) {
    if (!live()) return;
    const p = now.current.play, picked = now.current.selected;
    if (picked !== id) {
      setSelected(id); sound.lift();
      setNote(rotate ? (upright(p, id) ? "এটা সোজাই আছে। এবার ছবির ঘরে চাপো, বা টেনে নাও।" : "আবার চাপলে ঘুরবে। সোজা হলে ঘরে চাপো।") : "এবার ছবির যে ঘরে বসবে, সেখানে চাপো।");
    } else if (rotate) turnPiece(id);
    else { setSelected(-1); sound.tap(); setNote(""); }
  }

  function turnPiece(id: number) {
    if (!live() || id < 0) return;
    const next = turnOne(now.current.play, id);
    if (next === now.current.play) return;
    setPlay(next);
    sound.turn();
    setNote(upright(next, id) ? "সোজা হয়েছে। এবার বসাও।" : "আরেকবার, আরও ঘুরবে।");
  }
  /** R, ঘোরাও, or a second finger: turns the piece in the hand, else the picked one. */
  function turnCurrent() {
    const held = table.current?.held() ?? -1;
    turnPiece(held >= 0 ? held : now.current.selected);
  }

  function solved(whole: Play) {
    const at = performance.now(), r = session.finish(now.current.run, at);
    setRun(r);
    const seconds = session.seconds(r, at), stars = starsFor(whole.puzzle.level, seconds);
    const lv = whole.puzzle.level, firstClear = !levels.stars[lv], previousBest = best;
    let beaten = false;
    // Saved at the moment of the win, not in a timer a quick tap could cancel.
    if (!og.current) {
      levels.record(lv, stars);
      const opened = afterClear(unlockRef.current, lv, LEVEL_COUNT);
      if (opened !== unlockRef.current) setUnlock(opened);
      beaten = submitBest(seconds) && previousBest !== null;
    }
    setFinish({ level: lv, seconds, wrong: whole.wrong, best: whole.best, turned: whole.turned, stars, rotate: whole.puzzle.rotate, previousBest, beaten, firstClear });
    setNote("");
    setSweep(count => count + 1);
    sound.whole(worldIndex(lv), isFinale(lv));
    if (stars === 3 || beaten || (isFinale(lv) && firstClear)) later(slow ? 0 : 700, () => { if (!slow) confetti({ colors: ["#f2b52c", "#e8875e", "#5f9440", "#8fb8d8", "#fbf4e4"] }); });
    later(slow ? 250 : 900, () => setShowEnd(true));
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

  // ---- keys: R turns, P the player's pause, Enter or Space start and go on; the board and tray keys live in the table ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable], .ct-cardpanel")) return;
    if (sheetOpen) return;
    const r = now.current.run, key = event.key, enter = key === "Enter" || key === " ";
    // A button reached with Tab, the board and the tray do their own Enter.
    if (enter && element?.closest?.("button, a, summary, [role=application]")) return;
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
    if (enter) { event.preventDefault(); return; }
    if (event.repeat) return;
    if (key === "r" || key === "R") { event.preventDefault(); turnCurrent(); }
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
    if (button instanceof HTMLButtonElement && !button.closest(".ct-cardpanel")) button.blur();
  }

  // ---- the box picture (bottom left): drawn once per level; held down, it shows over the board ----
  useEffect(() => {
    const small = thumb.current;
    if (!small) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1), side = 52;
    small.width = small.height = Math.round(side * ratio);
    small.getContext("2d")?.drawImage(paintCanvas(level, side * ratio), 0, 0);
  }, [level]);
  useEffect(() => {
    const big = peekCanvas.current;
    if (!peek || !big) return;
    const side = big.clientWidth, ratio = Math.min(2, window.devicePixelRatio || 1);
    big.width = big.height = Math.round(side * ratio);
    big.getContext("2d")?.drawImage(paintCanvas(level, side * ratio), 0, 0);
  }, [peek, level]);

  // ---- cards ----
  const shared: Shared | null = finish ? { level: finish.level, seconds: finish.seconds, name } : null;
  const state = shared ? sharedHash(shared) : "";
  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`ছবির টুকরো লেভেল ১২৩ টুকরো জোড়া লাগালাম শেষ ছবি ${name}`).then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; the phase brings the friend's canvas back with the title.
  }, [state, format, site, friend, cardOpen, run.phase]);

  // ---- what the HUD shows ----
  const total = play.table.placed.length, placed = total - leftOf(play);
  const stars = starsFor(level, Math.max(1, clock)), soon = starsFor(level, clock + 5);
  const playingNow = run.phase === "playing" || run.phase === "paused";
  const danger = run.phase === "playing" && stars > 1 && soon < stars;
  const nextStarAt = stars === 3 ? parFor(level) : stars === 2 ? parFor(level) * 2 : 0;
  const rival = friend && friend.level === level ? friend : null;
  const allStars = totalStars(levels.stars);
  const prev = neighbourLevel(level, -1, unlock, levels.stars, visit, LEVEL_COUNT), next = neighbourLevel(level, 1, unlock, levels.stars, visit, LEVEL_COUNT);
  const lastStars = useRef(3);
  useEffect(() => {
    if (run.phase === "playing" && stars < lastStars.current) setDrop(key => key + 1);
    lastStars.current = run.phase === "playing" || run.phase === "paused" ? stars : 3;
  }, [stars, run.phase]);
  const status = note || (playingNow ? info.teach : "");

  const endTitle = finish ? (isFinale(level) && finish.firstClear ? `${info.name}, পুরো` : `পুরো ছবি, ${timeText(finish.seconds)}ে`) : "";
  const endLine = finish ? (rival ? compareLine(finish.seconds, rival.seconds, rival.name) : clearLine(level, finish.firstClear)) : "";
  const endNote = finish ? [
    nearMiss(level, finish.seconds) || (finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড। আগে লেগেছিল ${timeText(finish.previousBest)}।` : ""),
    finish.previousBest !== null && !rival ? `এই ফোনে সেরা ${timeText(Math.min(finish.previousBest, finish.seconds))}।` : "",
  ].filter(Boolean).join(" ") : "";

  return (
    <div ref={root} className="ct" data-world={world} data-calm={slow || undefined} data-phase={run.phase} onClick={dropFocus}>
      <header className="ct-hud" aria-hidden={run.phase === "title" || run.phase === "story" || undefined}>
        <button type="button" className="ct-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`লেভেল ${bn(level)}, ${info.name}। সব লেভেল দেখো`}>
          <b>{bn(level)}</b><span>{info.finale ? "শেষ ছবি" : info.name}<small>{worldInfo(level).name} · {sizeText(level)}{rotate ? " · ঘোরানো" : ""}</small></span>
        </button>
        {info.finale && (
          <p className="ct-boss" aria-label={`শেষ ছবি ${info.name}: ${bn(placed)}/${bn(total)} টুকরো বসেছে`}>
            <span>{info.name} <b>{bn(placed)}/{bn(total)}</b></span>
            <i><em style={{ transform: `scaleX(${placed / total})` }} /></i>
          </p>
        )}
        <div className="ct-clock" role="timer" aria-label={`সময় ${timeText(clock)}, এখন ${bn(stars)} তারার পথে`}>
          <b data-danger={danger || undefined}>{clockText(clock)}</b>
          <p className="ct-track" aria-hidden="true">
            {[0, 1, 2].map(s => <i key={s === stars ? `${s}-${drop}` : s} data-on={s < stars || undefined} data-fell={(s === stars && drop > 0) || undefined}>★</i>)}
            {nextStarAt > 0 && <small>≤ {clockText(nextStarAt)}</small>}
          </p>
          {rival && <small className="ct-rival">{rival.name || "বন্ধু"} {clockText(rival.seconds)}</small>}
        </div>
      </header>

      <div className="ct-play" data-danger={danger || undefined} data-finale={info.finale || undefined}>
        <div className="ct-progress" aria-hidden="true"><i style={{ transform: `scaleX(${placed / total})` }} /></div>
        <Table level={level} table={play.table} rotate={rotate} ghost={info.ghost} world={world} selected={selected} calm={slow}
          round={round} fly={fly} sweep={sweep} api={table} live={live} wake={wake}
          onDrop={onDrop} onTap={onTap} onTurn={turnPiece} onLift={sound.lift} onSlots={count => { slotsRef.current = count; setPlay(resize(now.current.play, count)); }} />
        {peek && <canvas ref={peekCanvas} className="ct-peek" role="img" aria-label={`পুরো ছবি: ${paintingName(level)}`} />}
      </div>

      {showEnd && finish ? (
        <EndScreen stats={finish} slow={slow} title={endTitle} line={endLine} note={endNote} primary={primary} secondary={secondary} onCard={() => setCardOpen(true)} />
      ) : (
        <div className="ct-bar">
          <button type="button" className="ct-lid" aria-pressed={peek} aria-label="বাক্সের ছবি: চেপে ধরলে পুরো ছবি দেখাবে"
            onPointerDown={event => { if (event.isPrimary) setPeek(true); }} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)} onPointerCancel={() => setPeek(false)}
            onClick={event => { if (event.detail === 0) setPeek(!peek); }}>
            <canvas ref={thumb} aria-hidden="true" />
          </button>
          <p className="ct-status" role="status" aria-live="polite">{status}</p>
          {rotate && (
            <button type="button" className="ct-tool" onClick={turnCurrent} disabled={!playingNow || selected < 0}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></svg>ঘোরাও
            </button>
          )}
        </div>
      )}

      {run.phase === "title" && (
        <TitleScreen level={level} stars={levels.stars[level] ?? 0} friend={friend} friendCanvas={friendPreview}
          slow={slow} allStars={allStars} total={LEVEL_COUNT * 3} prev={prev} next={next}
          onStart={start} onLevel={to => { if (to) toTitle(to); }} onSheet={openSheet} />
      )}

      {run.phase === "story" && <Story panel={panel} holding={holding} onDown={holdStart} onUp={holdEnd} onCancel={stopHold} />}

      {sheetOpen && <LevelSheet stars={levels.stars} unlock={unlock} visit={visit} current={level} recommended={yours} onPick={pickLevel} onClose={closeSheet} />}

      {cardOpen && shared && finish && (
        <div className="ct-cardpanel" role="dialog" aria-modal="false" aria-labelledby="ct-card-title">
          <div className="ct-cardpanel-head">
            <h2 id="ct-card-title"><em>লেভেল {bn(finish.level)}</em> {bn(total)} টুকরো, কার্ড তৈরি</h2>
            <button type="button" className="kit-secondary" onClick={() => setCardOpen(false)}>ফিরে যাও</button>
          </div>
          <p>{rival ? compareLine(finish.seconds, rival.seconds, rival.name) : cardLine(shared)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ct-card-summary" />
            <figcaption id="ct-card-summary" className="ct-sr">কার্ড: লেভেল {bn(finish.level)}, {paintingName(finish.level)}, {timeText(finish.seconds)}, {bn(finish.stars)} তারা। {cardLine(shared)}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ct-share">
            <label className="ct-name">
              <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`chhobir-tukro-${finish.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`}
              caption={caption(shared)} state={state} hint="বন্ধু লিংক খুললে একই ছবি, একই টুকরো পাবে। সময়টা তোমার ফোনের হিসাব।" />
          </div>
        </div>
      )}
      <p className="ct-sr" aria-live="polite">{finish && showEnd ? `${endTitle}। ${bn(finish.stars)} তারা। ${endNote}` : ""}</p>
    </div>
  );
}
