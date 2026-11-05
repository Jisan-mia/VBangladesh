"use client";
// IP: what we avoided — no name, grid colours, square rubber buttons or beeps of the 1990s handheld lights-out toy or any app; ours is a Bangladeshi wooden switchboard with round brass switches and pear-shaped bulbs, kostape and fairy-light lines, our own levels and our own sounds.
// The rules, the solver, the ladder, the clock and what the phone keeps are pure (lib/board.ts, lib/levels.ts, lib/play.ts,
// lib/flow.ts, lib/save.ts); this file feeds them taps, keys and performance.now(), draws the board and plays the sounds.
// The shared player owns pause: its menu, blur and a hidden tab all hold play, and the hum is silent while you're away.

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, loop, totalStars, useBest, useLevels, useSlowMode, useSound, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cellsOf, isLine, isTaped, litCount, switchCount } from "../lib/board";
import { humLevel } from "../lib/count.hot";
import * as F from "../lib/flow";
import { LEVEL_COUNT, isFinale, levelOf, worldOf } from "../lib/levels";
import {
  badge, bn, caption, cardLine, clearLine, compareLine, finishTitle, hintLine, houseLine, nearMiss, parseShared, sharedHash, statusLine, type Shared,
} from "../lib/link";
import { footprint, isSolved, newGame, press, puzzleOf, starLimits, starsFor, teach, undo, withHint, type Game, type Hint, type Puzzle } from "../lib/play";
import { bestSlug, LADDER, OLD_LEVELS_KEY, OPEN_KEY, openAfter, readOpen, startLevel, TOOL } from "../lib/save";
import { cardBlob, drawCard } from "../lib/draw-card";
import { BoardView, gridSpot } from "./board-view";
import { Finish, type Stat } from "./finish";
import { LevelSheet } from "./level-sheet";
import { StartCard } from "./start-card";
import { fanChord, hintSound, mains, takeBackSound, thup, tok, zip } from "./sound";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: nothing to keep */ } };
const clockNow = () => performance.now();
const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

type Finished = { stars: number; record: boolean; firstClear: boolean; at: number; stats: Stat[]; previousBest: number | null };

export function SwitchboardGame() {
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const levels = useLevels(LADDER, LEVEL_COUNT);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [game, setGameState] = useState<Game>(() => newGame(puzzleOf(1)!));
  const [run, setRunState] = useState<F.Flow>(() => F.titleFlow());
  const [cursor, setCursor] = useState(-1);
  const [hint, setHint] = useState<Hint | null>(null);
  const [note, setNote] = useState("");
  const [wiggle, setWiggle] = useState({ id: -1, key: 0 });
  const [finish, setFinish] = useState<Finished | null>(null);
  const [sheet, setSheet] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const puzzle = game.puzzle, { board, par, level, legacy } = puzzle;
  const [best, submitBest] = useBest(bestSlug(level, legacy), false);

  const root = useRef<HTMLDivElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const hum = useRef<ReturnType<typeof loop> | null>(null);
  const inView = useInView(root);
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ game, run, open });
  now.current.open = open;
  const setGame = (next: Game) => { now.current.game = next; setGameState(next); };
  const setRun = (next: F.Flow) => { now.current.run = next; setRunState(next); };

  const cells = cellsOf(board), lit = litCount(game.lit), moves = game.moves.length;
  const solved = isSolved(game);
  const info = legacy ? null : levelOf(level);

  // ---- loading a board onto the start card ----
  function load(next: Puzzle | null) {
    if (!next) return;
    setGame(newGame(next));
    setRun(F.toTitle(now.current.run));
    setCursor(-1);
    setHint(null);
    setNote("");
    setFinish(null);
    setSheet(false);
  }
  const reach = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const goLevel = (to: number) => { if (reach(to)) load(puzzleOf(to)); };
  const home = () => load(puzzleOf(startLevel(levels.stars, now.current.open)));

  /** A click handler that ignores the click which brought the window back, and anything while play is held. */
  const guarded = <T extends unknown[]>(act: (...args: T) => void) => (...args: T) => { if (F.awake(now.current.run, clockNow()) && !F.held(now.current.run)) act(...args); };

  function startPlay() {
    if (now.current.run.screen !== "title" || F.held(now.current.run)) return;
    setRun(F.start(now.current.run, clockNow()));
    mains();
  }

  // ---- the player's menu, and being away ----
  const player = useGamePlayer({
    onPause: () => setRun(F.menu(now.current.run, true, clockNow())),
    onResume: () => setRun(F.menu(now.current.run, false, clockNow())),
    onRestart: () => { setRun(F.menu(now.current.run, false, clockNow())); load(now.current.game.puzzle); },
  });
  useEffect(() => {
    const gone = () => setRun(F.away(now.current.run, true, clockNow()));
    const back = () => setRun(F.away(now.current.run, false, clockNow()));
    const seen = () => { if (document.hidden) gone(); else back(); };
    if (document.hidden) gone();
    window.addEventListener("blur", gone);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", gone); window.removeEventListener("focus", back); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- boot: your own open level (set once from the old ladder), then a friend's board or where you left off ----
  function openFriend(shared: Shared) {
    setFriend(shared);
    if (!shared.legacy) setVisit(shared.level);
    load(puzzleOf(shared.level, shared.legacy));
  }
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const raw = read(OPEN_KEY), mine = readOpen(raw, read(OLD_LEVELS_KEY), levels.stars);
    if (raw === null) write(OPEN_KEY, String(mine));
    setOpen(mine);
    now.current.open = mine;
    setSite(window.location.host);
    setBooted(true);
    const shared = parseShared(window.location.hash);
    if (shared) openFriend(shared);
    else load(puzzleOf(startLevel(levels.stars, mine)));
    // A link pasted into this tab: open it, but never throw away a board you're in the middle of.
    const onHash = () => {
      const next = parseShared(window.location.hash), { run: r, game: g } = now.current;
      if (next && !(r.screen === "play" && g.moves.length)) openFriend(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // ---- the hum: only on a live board you can see, unpaused, with sound on; a fresh loop each time it comes back ----
  const humWanted = F.wantsHum(soundIsOn, run, moves, solved);
  useEffect(() => {
    if (!humWanted) { hum.current?.stop(); hum.current = null; return; }
    // Never kept across a stop: a loop made while muted is a silent stub, so a fresh one starts every time it's wanted again.
    if (!hum.current) hum.current = loop("hum", 100);
    hum.current.set(humLevel(lit, cells));
  }, [humWanted, lit, cells]);
  useEffect(() => () => { hum.current?.stop(); hum.current = null; }, []);

  // ---- presses ----
  function finishBoard(next: Game) {
    const at = clockNow(), done = F.finish(now.current.run, at);
    setRun(done);
    const seconds = Math.max(1, Math.round(F.elapsed(done, at)));
    const p = next.puzzle, count = next.moves.length, stars = starsFor(count, p.par, next.hinted);
    let firstClear = false;
    if (!p.legacy) {
      // Stars are recorded the moment the last bulb lights, never in a timer a quick tap could cancel.
      firstClear = !levels.stars[p.level];
      levels.record(p.level, stars);
      const opened = openAfter(now.current.open, p.level);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best, record = submitBest(count) && previousBest !== null;
    setFinish({
      stars, record, firstClear, at, previousBest,
      stats: [
        { label: "চাল", value: count },
        { label: "সেরা", value: p.par },
        { label: "সময়", value: seconds, time: true },
        { label: "ফিরিয়ে আনা", value: next.undos },
      ],
    });
    setCursor(-1);
    fanChord();
    if ((stars === 3 || record || (firstClear && isFinale(p.level))) && !slow) confetti({ colors: ["#ffd54a", "#f2a900", "#c99a3e", "#ffe9a0", "#9a4b12"] });
  }

  function pressSwitch(id: number) {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const g = now.current.game;
    if (isTaped(g.puzzle.board, id)) {
      thup();
      setWiggle(current => ({ id, key: current.key + 1 }));
      setNote("কসটেপ মারা সুইচ চাপা যায় না। পাশের সুইচ দিয়ে ওর বাতিতে পৌঁছাও।");
      return;
    }
    const next = press(g, id);
    if (!next) return;
    const { on, off } = footprint(g.puzzle.board, g.lit, id);
    if (isLine(g.puzzle.board, id)) zip(); else tok(litCount(on) - litCount(off));
    setGame(next);
    setHint(null);
    setNote("");
    if (isSolved(next)) finishBoard(next);
  }

  function takeBack() {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const g = now.current.game;
    if (!g.moves.length) return;
    takeBackSound();
    setGame(undo(g));
    setHint(null);
    setNote("");
  }

  function askHint() {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const g = now.current.game, taught = teach(g);
    if (!taught) return;
    hintSound();
    setGame(withHint(g));
    setHint(taught);
    setNote("");
  }

  function restartBoard() {
    if (!F.takesPress(now.current.run, clockNow()) || !now.current.game.moves.length) return;
    takeBackSound();
    setGame(newGame(now.current.game.puzzle));
    setRun(F.restartBoard(now.current.run, clockNow()));
    setHint(null);
    setNote("");
  }

  // ---- the sheet holds play while it's open ----
  function openSheet() { setSheet(true); setRun(F.sheet(now.current.run, true, clockNow())); }
  function closeSheet() { setSheet(false); setRun(F.sheet(now.current.run, false, clockNow())); }

  // ---- what the result offers ----
  const over = run.screen === "over" && finish !== null;
  const nextLevel = over && !legacy && level < LEVEL_COUNT && level + 1 <= openAfter(open, level) ? level + 1 : 0;
  const primary = nextLevel ? { label: "পরের লেভেল", run: () => load(puzzleOf(nextLevel)) }
    : legacy ? { label: "নিজের লেভেলে ফেরো", run: home }
    : { label: "আবার খেলো", run: () => load(puzzle) };
  const secondary = nextLevel || legacy ? [{ label: "আবার খেলো", run: () => load(puzzle) }]
    : level > open ? [{ label: "নিজের লেভেলে ফেরো", run: home }] : [];

  // ---- keys: arrows walk a cursor, Enter or Space presses, Z or Backspace takes back, H hints, P pauses (the player's menu) ----
  // Enter and Space belong to the game: on the start card they start, on the result they go on (only on a fresh press after it
  // appears), and never re-press the last button clicked (clicked buttons drop focus, see dropFocus).
  function step(from: number, dr: number, dc: number) {
    const total = switchCount(board);
    if (from < 0) return 0;
    const at = gridSpot(board, from), want = { row: at.row + dr, col: at.col + dc };
    for (let id = 0; id < total; id++) { const spot = gridSpot(board, id); if (spot.row === want.row && spot.col === want.col) return id; }
    return from;
  }
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !inView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (sheet || run.menu) return;
    const key = event.key, enter = key === "Enter" || key === " ";
    if (enter && element?.closest?.("button, a, summary")) return; // a button reached with Tab does its own job
    if ((key === "p" || key === "P") && run.screen === "play") { event.preventDefault(); if (!event.repeat) player.requestPause(); return; }
    if (run.screen === "title") {
      if (enter) { event.preventDefault(); if (!event.repeat) guarded(startPlay)(); return; }
      if (!legacy && (key === "ArrowLeft" || key === "ArrowRight")) { event.preventDefault(); goLevel(level + (key === "ArrowLeft" ? -1 : 1)); }
      return;
    }
    if (run.screen === "over") {
      if (enter) { event.preventDefault(); if (F.takesResultKey(run, clockNow(), event.repeat)) primary.run(); }
      return;
    }
    if (!F.running(run)) return;
    const arrow = ARROWS[key];
    if (arrow) { event.preventDefault(); setCursor(current => current < 0 ? Math.floor(cells / 2) : step(current, ...arrow)); return; }
    if (event.repeat) return;
    if (key === "z" || key === "Z" || key === "Backspace") { event.preventDefault(); takeBack(); return; }
    if (key === "h" || key === "H") { event.preventDefault(); askHint(); return; }
    if (enter) { event.preventDefault(); if (cursor >= 0) pressSwitch(cursor); else setCursor(Math.floor(cells / 2)); }
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

  // ---- cards ----
  const rival = friend && friend.level === level && friend.legacy === legacy ? friend : null;
  const shared: Shared | null = over ? { level, legacy, moves: game.moves, hinted: game.hinted, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const earned = finish?.stars ?? 0;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("সুইচবোর্ড লেভেল ১২৩ রাফি").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, earned, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, starsFor(friend.moves.length, puzzleOf(friend.level, friend.legacy)?.par ?? 1, friend.hinted), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws; run.screen brings the friend's canvas back with the start card.
  }, [state, format, site, friend, run.screen]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const card = resultBox.current, stage = card?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (card && stage) stage.scrollTo({ top: card.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else card?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- what the HUD shows ----
  const { two } = starLimits(par);
  const onTrack = starsFor(moves, par, game.hinted);
  const edge = run.screen === "play" && !solved ? (moves > two ? 2 : moves > par ? 1 : 0) : 0;
  const tag = badge(level, legacy);
  const finale = info?.finale;
  const world = legacy ? 0 : worldOf(level) - 1;
  const total = totalStars(levels.stars);
  const status = hint ? hintLine(hint) : note || statusLine(lit, cells, moves, level, legacy);
  const finishNote = over ? [
    rival ? compareLine(moves, rival.moves.length, rival.name) : finish.record ? "এই বোর্ডে তোমার নতুন রেকর্ড!" : nearMiss(moves, par, game.hinted),
    !legacy ? houseLine(level, levels.stars) : "",
    !finish.record && finish.previousBest !== null && finish.previousBest < moves ? `এই ফোনে সেরা ${bn(finish.previousBest)} চাল।` : "",
  ].filter(Boolean).join(" ") : "";

  return (
    <div ref={root} className="sb" data-world={world} data-screen={run.screen} data-calm={slow || undefined} data-danger={edge || undefined} onClick={dropFocus}>
      {run.screen === "title" ? (
        <StartCard puzzle={puzzle} info={info} stars={legacy ? 0 : levels.stars[level] ?? 0} open={open} visit={visit} total={total} of={LEVEL_COUNT * 3}
          friend={friend && rival ? friend : null} friendCanvas={friendPreview}
          onLevel={guarded(goLevel)} onStart={guarded(startPlay)} onSheet={guarded(openSheet)} onHome={guarded(home)} />
      ) : (
        <div className="sb-play">
          <header className="sb-hud">
            <button type="button" className="sb-badge" onClick={guarded(openSheet)} disabled={legacy} aria-haspopup="dialog" aria-label={`${tag.main}, ${tag.sub}। সব লেভেল দেখো`}>
              <b>{tag.main}</b><span>{tag.sub}</span>
            </button>
            <p className="sb-score" aria-label={`চাল ${bn(moves)}, সেরা ${bn(par)}। এখন ${bn(onTrack)} তারার পথে`}>
              <b>চাল {bn(moves)}</b>
              <span>সেরা {bn(par)} <i className="sb-track" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < onTrack || undefined}>★</i>)}</i></span>
            </p>
            <span className="sb-bar" aria-hidden="true"><i style={{ transform: `scaleX(${lit / cells})` }} /></span>
          </header>
          {finale && (
            <p className="sb-boss" aria-label={`${finale}: নেভা ${bn(cells - lit)}টা`}>
              <b>{finale}</b><span className="sb-boss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${(cells - lit) / cells})` }} /></span><span>নেভা {bn(cells - lit)}টা</span>
            </p>
          )}

          <div className="sb-board-wrap" ref={boardBox} data-held={F.held(run) || undefined}>
            <BoardView board={board} lit={game.lit} moves={game.moves} cursor={F.running(run) ? cursor : -1} hint={hint} guide={F.running(run) && !moves ? puzzle.guide : undefined} wiggle={wiggle} won={over} onPress={pressSwitch} />
          </div>

          {over ? (
            <Finish title={finishTitle(level, legacy, moves, finish.firstClear)} stars={earned} slow={slow} stats={finish.stats}
              line={clearLine(level, legacy)} note={finishNote} primary={{ ...primary, run: guarded(primary.run) }}
              secondary={secondary.map(action => ({ ...action, run: guarded(action.run) }))} onSeeCard={seeCard} />
          ) : (
            <>
              <p className="sb-status" role="status" aria-live="polite" data-hint={hint ? true : undefined}>{status}</p>
              <div className="sb-tools">
                <button type="button" className="sb-tool" onClick={guarded(takeBack)} disabled={!moves}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো<kbd aria-hidden="true">Z</kbd>
                </button>
                <button type="button" className="sb-tool" onClick={guarded(askHint)} aria-label={`হিন্ট${game.hinted ? "" : ", নিলে বড়জোর ২ তারা"}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" /></svg>হিন্ট<kbd aria-hidden="true">H</kbd>
                </button>
                <button type="button" className="sb-tool" onClick={guarded(restartBoard)} disabled={!moves}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6" /><path d="M4 3.5v5.1h5.1" /></svg>শুরু থেকে
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {sheet && (
        <LevelSheet stars={levels.stars} open={open} visit={visit} current={legacy ? 0 : level} recommended={startLevel(levels.stars, open)}
          onPick={pick => { setSheet(false); setRun(F.sheet(now.current.run, false, clockNow())); goLevel(pick); }} onClose={closeSheet} />
      )}

      {shared && (
        <section className="sb-result" id="result" ref={resultBox} aria-labelledby="sb-result-title">
          <h2 id="sb-result-title"><em>{bn(moves)} চালে</em> সব বাতি জ্বলল</h2>
          <p>{rival ? compareLine(moves, rival.moves.length, rival.name) : cardLine(moves, par, game.hinted)}</p>
          <div className="sb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`সুইচবোর্ডের কার্ড: ${tag.main}, ${bn(moves)} চালে সব বাতি জ্বলল, ${bn(earned)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sb-share">
              <label className="sb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="switchboard.png" makeImage={() => cardBlob(shared, earned, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই বোর্ড পাবে। তোমার চালগুলো মিলিয়ে দেখা হয়, তাই সংখ্যাটা সত্যি।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
