"use client";
// IP: what we avoided — no brand's toy look (no black-and-white plastic squares in a wooden or plastic frame, no logo or box
// art); ours is an enamelled tin plate with a printed dotted rim, corner rivets, pressed-tin ঘুঁটি with raised Bangla digits,
// our own seeded levels and our own drawn pictures.
// The rules, the clock and the unlock are pure (lib/game.ts, lib/session.ts, lib/progress.ts); this file feeds them taps,
// keys and performance.now(), and draws and plays the result.

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { pictureSheet, STORY } from "../lib/art";
import { opposite, rowsDone, shuffled, solve, type Dir } from "../lib/board";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { hint, hintCap, homeCount, onTrack, play, startGame, starsOf, threeStar, twoStar, undo, LEVEL_COUNT, type Game } from "../lib/game";
import { infoOf, isFinale, worldIndex, worldOf, LEVELS, type Picture } from "../lib/levels";
import {
  bn, caption, compareLine, duration, finaleLine, fromGame, humanLine, levelName, nearMissLine, parseShared, sharedHash, sizeLabel, solvedLine, type Shared,
} from "../lib/link";
import { afterClear, neighbourLevel, playable, readUnlock, recommended, INTRO_KEY, UNLOCK_KEY } from "../lib/progress";
import * as session from "../lib/session";
import { EndScreen, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { Plate, slideMs } from "./plate";
import { sound } from "./sound";
import { HOLD_SKIP_MS, Story } from "./story";
import { TitleScreen } from "./title-screen";

const TOOL = "ponero-ghor";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** Arrows and WASD: the finger's way (0 up, 1 down, 2 left, 3 right). The gap steps the other way. */
const KEYS: Record<string, number> = { ArrowUp: 0, w: 0, W: 0, ArrowDown: 1, s: 1, S: 1, ArrowLeft: 2, a: 2, A: 2, ArrowRight: 3, d: 3, D: 3 };

type Finished = EndStats & { level: number; previousBest: number | null; beaten: boolean; firstClear: boolean };
type Sheet = { canvas: HTMLCanvasElement; url: string };

export function PlateGame() {
  const [game, setGameState] = useState<Game>(() => startGame(1));
  const [run, setRunState] = useState<session.Session>(session.title);
  // The latest of both, for handlers that outlive a render (blur, keys, the player's callbacks).
  const now = useRef({ game, run });
  const setGame = (next: Game) => { now.current.game = next; setGameState(next); };
  const setRun = (next: session.Session) => { now.current.run = next; setRunState(next); };

  const [finish, setFinish] = useState<Finished | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [note, setNote] = useState("");
  const [flight, setFlight] = useState(0);
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
  const [sheets, setSheets] = useState<Partial<Record<Picture, Sheet>>>({});
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
  const urls = useRef<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const inView = useInView(root);
  const levels = useLevels(TOOL, LEVEL_COUNT);

  const level = game.level, info = infoOf(level), world = worldOf(level), worldNo = worldIndex(level);
  const [best, submitBest] = useBest(`${TOOL}-${level}`, false);
  const player = useGamePlayer({
    onPause: () => pauseFor("away"),
    onResume: () => resumeFrom("away"),
    onRestart: () => toTitle(now.current.game.level),
  });

  // ---- timers: every celebration and the end screen's entrance; cleared on every new plate and on unmount ----
  function clearTimers() { timers.current.forEach(id => window.clearTimeout(id)); timers.current = []; }
  function later(ms: number, run: () => void) { timers.current.push(window.setTimeout(run, ms)); }
  function stopHold() { window.clearTimeout(holdTimer.current); holdTimer.current = 0; setHolding(false); }

  function setUnlock(next: number) { unlockRef.current = next; setUnlockState(next); write(UNLOCK_KEY, String(next)); }

  /** A fresh plate of `to`, with nothing left over from the last one. */
  function load(to: number) {
    clearTimers();
    stopHold();
    setGame(startGame(to));
    setFinish(null);
    setShowEnd(false);
    setNote("");
    setCardOpen(false);
    setPeek(false);
    setSheetOpen(false);
  }
  /** A level on its title screen. */
  function toTitle(to: number) { load(to); setRun(session.title()); }
  /** Straight into play (পরের লেভেল, আবার খেলো, a level from the sheet): the ঘুঁটি fly to the start. */
  function playLevel(to: number) { load(to); setRun(session.again(performance.now(), slow)); fly(); }
  function fly() { setFlight(count => count + 1); if (!slow) sound.rattle(); }

  function start() {
    const r = now.current.run;
    if (r.phase !== "title") return;
    const story = !introSeen.current && !friend && !og.current && now.current.game.level === 1;
    const next = session.begin(r, performance.now(), story, slow);
    setRun(next);
    if (next.phase === "story") { panelRef.current = 0; setPanelState(0); return; }
    fly();
  }
  function endStory() {
    if (now.current.run.phase !== "story") return;
    introSeen.current = true;
    write(INTRO_KEY, "1");
    stopHold();
    setRun(session.storyDone(now.current.run, performance.now(), slow));
    fly();
  }
  function nextPanel() {
    if (now.current.run.phase !== "story") return;
    if (panelRef.current + 1 >= STORY.length) { endStory(); return; }
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
  const live = () => session.canMove(now.current.run, performance.now());

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
      urls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // ---- boot, once this phone's stars are read: your own unlock (migrated once), then a friend's plate or yours ----
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

  /** `#og`, the site's preview image only: level 14 solved at par by রাফি, the card open. Nothing is saved. */
  function demo() {
    og.current = true;
    const demoLevel = 14, [seed, steps] = LEVELS[demoLevel - 1];
    const { path } = shuffled(4, seed, steps);
    let solved = startGame(demoLevel);
    for (let i = path.length - 1; i >= 0; i--) solved = play(solved, [opposite(path[i])]) ?? solved;
    setGame(solved);
    setRun({ ...session.title(), phase: "over" });
    setFinish({ level: demoLevel, moves: solved.moves.length, seconds: 52, helped: 0, undone: 0, stars: starsOf(solved.moves.length, demoLevel), previousBest: null, beaten: false, firstClear: false });
    setShowEnd(true);
    setName("রাফি");
    setCardOpen(true);
  }

  // Play-tests only (never in production): the live game, its session, and the layered solver's path from here.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __ponero?: unknown }).__ponero = { game: () => now.current.game, session: () => now.current.run, path: () => solve(now.current.game.board) };
  }, []);

  // ---- the picture for picture levels: drawn once per world into a canvas, then a blob URL for the ঘুঁটি ----
  const wanted = info.look === "digits" ? null : world.picture;
  const picture = wanted ? sheets[wanted] ?? null : null;
  useEffect(() => {
    if (!wanted || sheets[wanted]) return;
    const canvas = pictureSheet(wanted, 1024);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setSheets(current => current[wanted] ? current : { ...current, [wanted]: { canvas, url } });
    }, "image/webp", 0.92);
  }, [wanted]);

  // ---- moves ----
  /** Plays a move the player made. False when it was refused (not playing, or off the plate). */
  function commit(next: Game | null, ms: number, slid: number, help = false) {
    if (!next || !live()) return false;
    const before = now.current.game;
    sound.clink(slid, (ms / 1000) * 0.8);
    const rows = rowsDone(next.board);
    if (!next.won && rows > rowsDone(before.board)) sound.chord(rows);
    if (onTrack(next.moves.length, next.level, next.helped).stars < onTrack(before.moves.length, before.level, before.helped).stars) setDrop(key => key + 1);
    setGame(next);
    if (!help) setNote("");
    if (next.won) solved(next);
    return true;
  }

  function solved(won: Game) {
    const at = performance.now(), r = session.finish(now.current.run, at);
    setRun(r);
    const seconds = Math.max(1, Math.round(session.elapsed(r, at) / 1000));
    const stars = starsOf(won.moves.length, won.level, won.helped);
    const firstClear = !levels.stars[won.level], previousBest = best;
    let beaten = false;
    // Saved at the moment of the win, not in a timer a quick tap could cancel.
    if (!og.current) {
      levels.record(won.level, stars);
      const opened = afterClear(unlockRef.current, won.level, LEVEL_COUNT);
      if (opened !== unlockRef.current) setUnlock(opened);
      if (!won.helped) beaten = submitBest(won.moves.length) && previousBest !== null;
    }
    setFinish({ level: won.level, moves: won.moves.length, seconds, helped: won.helped, undone: won.undone, stars, previousBest, beaten, firstClear });
    const finale = isFinale(won.level);
    if (finale) sound.motif(worldIndex(won.level));
    else sound.chord(won.board.size, 0.12);
    if (stars === 3 || beaten || (finale && firstClear)) {
      later(slow ? 0 : 380, () => { sfx.win(); if (!slow) confetti({ colors: ["#c23b22", "#f2c230", "#1d3f8f", "#f5f7f6", "#2a9d8f"] }); });
    } else later(300, sfx.good);
    later(slow ? 250 : 800, () => setShowEnd(true));
  }

  function onLine(_cell: number, steps: Dir[], ms: number) { return commit(play(now.current.game, steps), ms, steps.length); }
  function onSwipe(gapDir: Dir) {
    if (!live()) return;
    if (!commit(play(now.current.game, [gapDir]), slideMs(1, slow), 1)) sound.tonk();
  }
  function onBlocked(cell: number) {
    if (!live()) return;
    sound.tonk();
    setNote("শুধু ফাঁকা ঘরের সারি বা কলামের ঘুঁটি সরে।");
    const face = root.current?.querySelector<HTMLElement>(`[data-cell="${cell}"] .pg-face`);
    if (!slow && face) face.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6%)" }, { transform: "translateX(6%)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
  }
  function takeBack() {
    const g = now.current.game;
    if (!g.moves.length) return;
    if (commit(undo(g), slideMs(1, slow), 1)) setNote("");
  }
  function help() {
    const g = now.current.game;
    if (g.won || !live()) return;
    const dir = hint(g);
    if (dir === null) return;
    sfx.pop();
    if (commit(play(g, [dir], true), slideMs(1, slow), 1, true)) setNote(`একটা ঘুঁটি সরিয়ে দিলাম। এই প্লেটে এখন বড়জোর ${bn(hintCap(g.helped + 1))} তারা।`);
  }
  function slideKey(finger: number) {
    if (!live()) return;
    commit(play(now.current.game, [(finger ^ 1) as Dir]), slideMs(1, slow), 1);
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

  // ---- keys: arrows or WASD slide, Z or Backspace undo, H hint, P the player's pause, Enter or Space start and go on ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable], .pg-cardpanel")) return;
    if (sheetOpen) return;
    const r = now.current.run, key = event.key, enter = key === "Enter" || key === " ";
    if (enter && element?.closest?.("button, a, summary") && !element.closest(".pg-well")) return; // a button reached with Tab does its own job
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
    if (KEYS[key] !== undefined) { event.preventDefault(); slideKey(KEYS[key]); return; }
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
    if (button instanceof HTMLButtonElement && !button.closest(".pg-cardpanel")) button.blur();
  }

  // ---- cards ----
  const shared = finish ? fromGame(game, name) : null;
  const state = shared ? sharedHash(shared) : "";
  const card: CardData | null = finish ? { level, count: finish.moves, helped: finish.helped, name } : null;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("১৫ ঘরের ধাঁধা রাফি ১২৩ চালে মেলালাম").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` and `name` cover everything the card draws; the phase brings the friend's canvas back with the title.
  }, [state, name, format, site, friend, cardOpen, run.phase]);

  // ---- what the HUD shows ----
  const count = game.moves.length, track = onTrack(count, level, game.helped);
  const lineAt = count + track.left, size = game.board.size, total = size * size - 1, home = homeCount(game.board);
  const playing = run.phase === "playing" || run.phase === "paused";
  const danger = run.phase === "playing" && track.stars > 1 && lineAt >= 8 && track.left <= Math.max(2, Math.round(lineAt * 0.08));
  const rival = friend && friend.level === level ? friend : null;
  const rows = rowsDone(game.board);
  // What one hint would cost this plate, before → after: it pushes one ঘুঁটি and lowers the cap.
  const hintAfter = onTrack(count + 1, level, game.helped + 1).stars;
  const status = note || (rows && !game.won ? `${bn(rows)}টা সারি জায়গামতো। ${info.teach}` : info.teach);
  const allStars = totalStars(levels.stars);
  const prev = neighbourLevel(level, -1, unlock, levels.stars, visit, LEVEL_COUNT), next = neighbourLevel(level, 1, unlock, levels.stars, visit, LEVEL_COUNT);

  const endTitle = finish ? (isFinale(level) && finish.firstClear ? `${info.name} জোড়া লেগেছে` : `মিলেছে, ${bn(finish.moves)} চালে`) : "";
  const endLine = finish ? (rival ? compareLine(finish.moves, rival.count, rival.name) : isFinale(level) && finish.firstClear ? finaleLine(level) : solvedLine(level, finish.moves, finish.helped)) : "";
  const endNote = finish ? [
    nearMissLine(finish.moves, level, finish.helped) || (finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড। আগে লেগেছিল ${bn(finish.previousBest)} চাল।` : ""),
    best !== null && !rival && !finish.helped ? `এই ফোনে সেরা ${bn(Math.min(best, finish.moves))} চাল।` : "",
  ].filter(Boolean).join(" ") : "";

  return (
    <div ref={root} className="pg" data-world={worldNo} data-calm={slow || undefined} data-phase={run.phase} onClick={dropFocus}>
      <header className="pg-hud" aria-hidden={run.phase === "title" || run.phase === "story" || undefined}>
        <button type="button" className="pg-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`লেভেল ${bn(level)}, ${levelName(level)}। সব লেভেল দেখো`}>
          <b>{bn(level)}</b><span>{info.finale ? "শেষ প্লেট" : info.name}<small>{world.name} · {sizeLabel(level)}</small></span>
        </button>
        {info.finale && (
          <p className="pg-boss" aria-label={`শেষ প্লেট ${info.name}: ${bn(home)}/${bn(total)} ঘুঁটি জায়গামতো`}>
            <span>{info.name} <b>{bn(home)}/{bn(total)}</b></span>
            <i><em style={{ transform: `scaleX(${home / total})` }} /></i>
          </p>
        )}
        <div className="pg-moves" role="status" aria-label={`${bn(count)} চাল, এখন ${bn(track.stars)} তারার পথে`}>
          <p><span>চাল</span><b>{bn(count)}</b></p>
          <p className="pg-track" aria-hidden="true">
            {[0, 1, 2].map(s => <i key={s === track.stars ? `${s}-${drop}` : s} data-on={s < track.stars || undefined} data-fell={(s === track.stars && drop > 0) || undefined}>★</i>)}
            <small>{track.stars === 3 ? `≤ ${bn(threeStar(level))}` : track.stars === 2 && Number.isFinite(track.left) ? `≤ ${bn(twoStar(level))}` : ""}</small>
          </p>
          {rival && <small className="pg-rival">{rival.name || "বন্ধু"} {bn(rival.count)}</small>}
        </div>
      </header>

      <div className="pg-stagebox">
        <div className="pg-plate" data-danger={danger || undefined} data-finale={info.finale || undefined}>
          <div className="pg-progress" aria-hidden="true"><i style={{ transform: `scaleX(${home / total})` }} /></div>
          <Plate board={game.board} level={level} look={info.look} picture={picture?.url ?? null} calm={slow} won={game.won} flight={flight}
            live={live} wake={wake} onLine={onLine} onSwipe={onSwipe} onBlocked={onBlocked} onLift={sound.scrape} away={run.phase === "paused"} />
          {peek && picture && (
            <button type="button" className="pg-peek" onClick={() => setPeek(false)} aria-label="ছবিটা বন্ধ করো">
              <img src={picture.url} alt={`পুরো ছবি: ${world.thing}`} />
            </button>
          )}
        </div>
      </div>

      {showEnd && finish ? (
        <EndScreen stats={finish} slow={slow} title={endTitle} line={endLine} note={endNote} primary={primary} secondary={secondary} onCard={() => setCardOpen(true)} />
      ) : (
        <>
          <p className="pg-status" role="status" aria-live="polite">{playing || run.phase === "over" ? status : ""}</p>
          <div className="pg-controls">
            {picture ? (
              <button type="button" className="pg-goal" onClick={() => setPeek(!peek)} aria-pressed={peek} aria-label="পুরো ছবিটা দেখো">
                <img src={picture.url} alt="" />
              </button>
            ) : <span className="pg-goal-none" aria-hidden="true" />}
            <button type="button" className="pg-tool" onClick={takeBack} disabled={!playing || !count || game.won}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে নাও
            </button>
            <button type="button" className="pg-tool pg-hint" onClick={help} disabled={!playing || game.won}
              aria-label={`একটা চাল দেখাও। ${hintAfter < track.stars ? `এই প্লেটে তারা ${bn(track.stars)} থেকে ${bn(hintAfter)}-এ নামবে` : "তারা আর কমবে না"}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>
              একটা চাল <small>{hintAfter < track.stars ? `★${bn(track.stars)}→${bn(hintAfter)}` : `★${bn(track.stars)}`}</small>
            </button>
          </div>
        </>
      )}

      {run.phase === "title" && (
        <TitleScreen level={level} stars={levels.stars[level] ?? 0} sheet={picture?.canvas ?? null} friend={friend} friendCanvas={friendPreview}
          slow={slow} allStars={allStars} total={LEVEL_COUNT * 3} prev={prev} next={next}
          onStart={start} onLevel={to => { if (to) toTitle(to); }} onSheet={openSheet} />
      )}

      {run.phase === "story" && <Story panel={panel} holding={holding} onDown={holdStart} onUp={holdEnd} onCancel={stopHold} />}

      {sheetOpen && (
        <LevelSheet stars={levels.stars} unlock={unlock} visit={visit} current={level} recommended={yours}
          onPick={pickLevel} onClose={closeSheet} />
      )}

      {cardOpen && card && finish && (
        <div className="pg-cardpanel" role="dialog" aria-modal="false" aria-labelledby="pg-card-title">
          <div className="pg-cardpanel-head">
            <h2 id="pg-card-title"><em>লেভেল {bn(level)}</em> {bn(finish.moves)} চালে, কার্ড তৈরি</h2>
            <button type="button" className="kit-secondary" onClick={() => setCardOpen(false)}>ফিরে যাও</button>
          </div>
          <p>{rival ? compareLine(finish.moves, rival.count, rival.name) : humanLine(finish.moves, level, finish.helped)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pg-card-summary" />
            <figcaption id="pg-card-summary" className="pg-sr">কার্ড: লেভেল {bn(level)}, {sizeLabel(level)}, {bn(finish.moves)} চালে, {bn(finish.stars)} তারা, সময় {duration(finish.seconds)}। {humanLine(finish.moves, level, finish.helped)}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="pg-share">
            <label className="pg-name">
              <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar
              tool={TOOL} fileName={`ponero-ghor-${level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${name}|${format}|${finish.moves}`}
              caption={caption(card)} state={state || undefined}
              hint={state ? "বন্ধু লিংক খুললে এই এলোমেলো প্লেটটাই পাবে। চালগুলো মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" : "চাল অনেক বেশি হয়ে গেছে, লিংকে ধরছে না। কম চালে মিলিয়ে আবার শেয়ার করো।"}
            />
          </div>
        </div>
      )}
      <p className="pg-sr" aria-live="polite">{finish && showEnd ? `মিলেছে। ${bn(finish.moves)} চাল, ${bn(finish.stars)} তারা। ${endNote}` : ""}</p>
    </div>
  );
}
