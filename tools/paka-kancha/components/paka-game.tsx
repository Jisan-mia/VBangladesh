"use client";
// IP: what we avoided — no "Mastermind" name, pegs or peg board; no green-yellow-grey letter grid or emoji-square post text from the word-guessing craze; not শব্দ সাজাই's newsprint squares. Mangoes, pad, baskets and locks are drawn fresh.
// The rules, the ladder, the clock, the keys and what the phone keeps are pure (lib/rules.ts, lib/levels.ts, lib/play.ts,
// lib/flow.ts, lib/keys.ts, lib/save.ts, lib/link.ts); this file feeds them taps, keys and performance.now(), draws the
// game and plays the sounds. The shared player owns pause: its menu, blur and a hidden tab all hold play.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { MAX_NAME, confetti, newSeed, shake, totalStars, useBest, useLevels, useSlowMode } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { pinShare } from "../lib/count.hot";
import { cardBlob, drawCard } from "../lib/card";
import * as F from "../lib/flow";
import { decideKey, landedOn } from "../lib/keys";
import { LEVEL_COUNT, isFinale, levelOf, worldOf } from "../lib/levels";
import {
  badge, caption, clearLine, finishTitle, nearMiss, nextLine, parseShare, shareHash, versusLine, worldLine, type Shared,
} from "../lib/link";
import {
  aidOn, codeOf, danger, eraseRow, humanLine, limitsOf, lockRow, newGame, over as isGameOver, pinsOpen, refusalFor, refusalLine, ripeTotal, rowsFor, rulesOf, starsFor, starsOf, typeKey, won as isWon, type Game,
} from "../lib/play";
import {
  LENGTH, asciiDigits, bn, clash, codeFromSeed, dhakaDate, isCode, keyHints, samePuzzle, validGuesses, bnDigits, type Puzzle,
} from "../lib/rules";
import { BEST_KEY, DAY_KEY, LADDER, MODE_KEY, OLD_LEVELS_KEY, OPEN_KEY, openAfter, readMode, readOpen, startLevel, TOOL, type Mode } from "../lib/save";
import { BoardView } from "./board-view";
import { Finish, type Stat } from "./finish";
import { LevelSheet } from "./level-sheet";
import { Pad } from "./pad";
import { Legend, StartCard } from "./start-card";
import { cleared, dhop, heartbeat, knock, missed, pin, refused, rub, typed, unlock } from "./sound";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: nothing to keep */ } };
const clockNow = () => performance.now();
const levelPuzzle = (level: number): Puzzle => ({ kind: "level", level, seed: newSeed() });

type Finished = { stars: number; record: boolean; firstClear: boolean; previousBest: number | null; stats: Stat[] };

/** Today's saved game, if it is today's and its tries are ones this code could have had. */
function restoreDay(puzzle: Puzzle, today: string): string[] {
  if (puzzle.kind !== "day" || puzzle.date !== today) return [];
  try {
    const saved = JSON.parse(read(DAY_KEY) ?? "null") as { d?: string; g?: unknown } | null;
    const guesses = saved?.d === today && Array.isArray(saved.g) ? saved.g.filter((guess): guess is string => typeof guess === "string") : [];
    return validGuesses(codeOf(puzzle), guesses, rulesOf(puzzle)) ? guesses : [];
  } catch { return []; }
}

export function PakaGame() {
  const [slow] = useSlowMode();
  const levels = useLevels(LADDER, LEVEL_COUNT);
  const [today, setToday] = useState("");
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [game, setGameState] = useState<Game>(() => newGame({ kind: "level", level: 1, seed: 1 }));
  const [run, setRunState] = useState<F.Flow>(() => F.titleFlow());
  const [mode, setModeState] = useState<Mode>("level");
  const [nudge, setNudge] = useState("");
  const [finish, setFinish] = useState<Finished | null>(null);
  const [sheet, setSheet] = useState(false);
  const [making, setMaking] = useState(false);
  const [made, setMade] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const { puzzle } = game;
  const [best, submitBest] = useBest(TOOL, false);
  const root = useRef<HTMLDivElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const makeBox = useRef<HTMLElement>(null);
  const typing = useRef<HTMLLIElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const timers = useRef<number[]>([]);
  const inView = useInView(root);
  // The latest of everything, for listeners that outlive a render.
  const now = useRef({ game, run, open, mode });
  now.current.open = open;
  const setGame = (next: Game) => { now.current.game = next; setGameState(next); };
  const setRun = (next: F.Flow) => { now.current.run = next; setRunState(next); };
  const setMode = (next: Mode) => { now.current.mode = next; setModeState(next); write(MODE_KEY, next); };

  const code = useMemo(() => codeOf(puzzle), [puzzle]);
  const rules = useMemo(() => rulesOf(puzzle), [puzzle]);
  const rows = rowsFor(game);
  const { guesses, input } = game;
  const level = puzzle.kind === "level" ? puzzle.level : 0, legacy = puzzle.kind === "level" && Boolean(puzzle.legacy);
  const ladder = level > 0 && !legacy;
  const info = ladder ? levelOf(level) : null;
  const won = isWon(game), ended = isGameOver(game);
  const basket = rules.feedback === "basket";
  const isToday = Boolean(today) && puzzle.kind === "day" && puzzle.date === today;
  const hints = useMemo(() => keyHints(code, guesses, rules), [code, guesses, rules]);
  const triesLeft = rules.tries - rows.length;

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (seconds: number, act: () => void) => { timers.current.push(window.setTimeout(act, seconds * 1000)); };

  // ---- loading a puzzle onto the start card (or, for a day already finished on this phone, onto its result) ----
  function load(next: Puzzle) {
    clearTimers();
    const saved = restoreDay(next, today || dhakaDate());
    const fresh = newGame(next, saved);
    setGame(fresh);
    setNudge("");
    setFinish(null);
    setSheet(false);
    if (saved.length && isGameOver(fresh)) {
      setRun(F.toOver(now.current.run, clockNow()));
      setFinish(buildFinish(fresh, 0, false));
    } else setRun(F.toTitle(now.current.run));
  }
  const reach = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const goLevel = (to: number) => { if (reach(to)) { setMode("level"); load(levelPuzzle(to)); } };
  const home = () => { setMode("level"); load(levelPuzzle(startLevel(levels.stars, now.current.open))); };
  const goDay = () => { setMode("day"); load({ kind: "day", date: today || dhakaDate() }); };

  /** A click handler that ignores the click which brought the window back, and anything while play is held. */
  const guarded = <T extends unknown[]>(act: (...args: T) => void) => (...args: T) => { if (F.awake(now.current.run, clockNow()) && !F.held(now.current.run)) act(...args); };

  function startPlay() {
    if (now.current.run.screen !== "title" || F.held(now.current.run)) return;
    setRun(F.start(now.current.run, clockNow()));
    typed();
  }

  // ---- the player's menu, and being away ----
  const player = useGamePlayer({
    onPause: () => { clearTimers(); setRun(F.menu(now.current.run, true, clockNow())); },
    onResume: () => setRun(F.menu(now.current.run, false, clockNow())),
    onRestart: () => {
      const g = now.current.game, p = g.puzzle;
      if (p.kind === "day") { setRun(F.menu(now.current.run, false, clockNow())); load(p); return; }
      const keepSeed = p.kind !== "level" || Boolean(friend && samePuzzle(friend.puzzle, p));
      setRun(F.menu(now.current.run, false, clockNow()));
      load(keepSeed ? p : levelPuzzle(p.level));
    },
    onLevels: () => openSheet(),
  });
  useEffect(() => {
    const gone = () => { clearTimers(); setRun(F.away(now.current.run, true, clockNow())); };
    const back = () => setRun(F.away(now.current.run, false, clockNow()));
    const seen = () => { if (document.hidden) gone(); else back(); };
    if (document.hidden) gone();
    window.addEventListener("blur", gone);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", gone); window.removeEventListener("focus", back); document.removeEventListener("visibilitychange", seen); };
  }, []);
  useEffect(() => () => clearTimers(), []);

  // ---- boot: your own open level (set once from the old ladder), then a friend's link, else where you left off ----
  function openFriend(shared: Shared) {
    setFriend(shared);
    if (shared.puzzle.kind === "level" && !shared.puzzle.legacy) setVisit(shared.puzzle.level);
    setMode(shared.puzzle.kind === "day" ? "day" : "level");
    load(shared.puzzle);
  }
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const day = dhakaDate(), raw = read(OPEN_KEY), mine = readOpen(raw, read(OLD_LEVELS_KEY), read(BEST_KEY), levels.stars);
    if (raw === null) write(OPEN_KEY, String(mine));
    setOpen(mine);
    now.current.open = mine;
    setToday(day);
    setSite(window.location.host);
    setBooted(true);
    const remembered = readMode(read(MODE_KEY));
    setModeState(remembered);
    now.current.mode = remembered;
    const shared = parseShare(window.location.hash, day);
    const first: Puzzle = remembered === "day" ? { kind: "day", date: day } : levelPuzzle(startLevel(levels.stars, mine));
    if (shared) {
      setFriend(shared);
      if (shared.puzzle.kind === "level" && !shared.puzzle.legacy) setVisit(shared.puzzle.level);
    }
    const start = shared?.puzzle ?? first;
    const saved = restoreDay(start, day);
    const fresh = newGame(start, saved);
    setGame(fresh);
    if (saved.length && isGameOver(fresh)) {
      setRun(F.toOver(now.current.run, clockNow()));
      setFinish(buildFinish(fresh, 0, false));
    }
    // A link pasted into this tab: open it, but never throw away a game you're in the middle of.
    const onHash = () => {
      const next = parseShare(window.location.hash, dhakaDate()), { run: r, game: g } = now.current;
      if (next && !(r.screen === "play" && g.guesses.length)) openFriend(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // Today's game stays on this phone, so a reload neither loses it nor hands out a second go.
  useEffect(() => {
    if (!isToday) return;
    write(DAY_KEY, JSON.stringify({ d: today, g: guesses }));
  }, [isToday, today, guesses]);

  // ---- finishing ----
  function buildFinish(done: Game, seconds: number, fresh: boolean): Finished {
    const p = done.puzzle, doneRows = rowsFor(done), r = rulesOf(p), win = isWon(done);
    const stars = starsOf(p, doneRows), lad = p.kind === "level" && !p.legacy;
    let firstClear = false, record = false;
    const previousBest = best;
    if (fresh) {
      if (lad && win) {
        // Stars are recorded the moment the last try is in, never in a timer a quick tap could cancel.
        firstClear = !levels.stars[p.level];
        levels.record(p.level, stars);
        const opened = openAfter(now.current.open, p.level);
        if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
      } else if (!lad && win) record = submitBest(doneRows.length) && previousBest !== null;
    }
    const stats: Stat[] = [
      { label: "চেষ্টা", value: doneRows.length },
      { label: "সুযোগ", value: r.tries },
      { label: "পাকা আম", value: ripeTotal(doneRows) },
      ...(fresh ? [{ label: "সময়", value: Math.max(1, Math.round(seconds)), time: true }] : []),
    ];
    return { stars, record, firstClear, previousBest, stats };
  }

  function finishGame(next: Game) {
    const at = clockNow(), done = F.finish(now.current.run, at);
    setRun(done);
    const result = buildFinish(next, F.elapsed(done, at), true);
    setFinish(result);
    const p = next.puzzle, win = isWon(next), boss = p.kind === "level" && !p.legacy && isFinale(p.level);
    const settled = 0.62;
    if (!win) { later(settled, missed); return; }
    if (boss && result.firstClear) later(settled, () => { unlock(); confetti({ colors: ["#f5a011", "#e2522b", "#3d8a3c", "#ffd45e", "#f6c443"] }); });
    else if (p.kind === "level" && !p.legacy) later(settled + 0.32 * (result.stars + 1), () => { cleared(result.stars === 3); if (result.stars === 3) confetti({ colors: ["#f5a011", "#e2522b", "#3d8a3c", "#ffd45e", "#f6c443"] }); });
    else later(settled, () => { if (result.record) { cleared(true); confetti({ colors: ["#f5a011", "#e2522b", "#3d8a3c", "#ffd45e", "#f6c443"] }); } else cleared(false); });
  }

  // ---- the pad ----
  /** A gentle no: the line under the board says why, the row being typed shakes. */
  function refuse(line: string) {
    setNudge(line);
    refused();
    shake(typing.current);
  }
  function pressKey(digit: string) {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const g = now.current.game, why = refusalFor(g, digit);
    if (why === "over") return;
    if (why) { const line = refusalLine(why, rulesOf(g.puzzle).digits, rulesOf(g.puzzle).repeat); if (line) refuse(line); return; }
    typed();
    setNudge("");
    setGame(typeKey(g, digit));
  }
  function pressErase() {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const g = now.current.game;
    if (!g.input || isGameOver(g)) return;
    rub();
    setNudge("");
    setGame(eraseRow(g));
  }
  function pressCheck() {
    if (!F.takesPress(now.current.run, clockNow())) return;
    const g = now.current.game;
    if (isGameOver(g)) return;
    if (g.input.length < LENGTH) { refuse(`আরও ${bn(LENGTH - g.input.length)}টা অঙ্ক দাও।`); return; }
    const next = lockRow(g);
    if (next === g) return;
    knock();
    setNudge("");
    setGame(next);
    const before = rowsFor(g), after = rowsFor(next), r = rulesOf(g.puzzle);
    dhop(after[after.length - 1]);
    const boss = g.puzzle.kind === "level" && !g.puzzle.legacy && isFinale(g.puzzle.level);
    if (boss && pinsOpen(after) > pinsOpen(before)) pin(pinsOpen(after), 0.5);
    if (isGameOver(next)) finishGame(next);
    else if (r.tries - after.length === 1 && aidOn(g.puzzle, "edge")) heartbeat();
  }

  // ---- the sheet holds play while it's open ----
  function openSheet() { setSheet(true); setRun(F.sheet(now.current.run, true, clockNow())); }
  function closeSheet() { setSheet(false); setRun(F.sheet(now.current.run, false, clockNow())); }

  // ---- what the result offers ----
  const done = run.screen === "over" && finish !== null;
  const nextOpen = done && ladder && won && level < LEVEL_COUNT && level + 1 <= openAfter(open, level) ? level + 1 : 0;
  const again = () => load(ladder || legacy ? levelPuzzle(level) : { kind: "seed", seed: newSeed() });
  const primary = nextOpen ? { label: "পরের লেভেল", run: () => { setMode("level"); load(levelPuzzle(nextOpen)); } }
    : legacy ? { label: "নিজের লেভেলে ফেরো", run: home }
    : ladder ? { label: "আবার খেলো", run: again }
    : { label: "আরেকবার", run: again };
  const secondary = nextOpen ? [{ label: "আবার খেলো", run: again }]
    : legacy ? [{ label: "আবার খেলো", run: again }]
    : ladder ? (level > open ? [{ label: "নিজের লেভেলে ফেরো", run: home }] : [])
    : [{ label: "লেভেল খেলো", run: home }];

  // ---- keys: digits (Bangla or English), Backspace, Enter, P pauses (the player's menu) ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const action = decideKey(event, landedOn(event.target as Element | null), {
      screen: run.screen, held: sheet || run.menu || run.away, inView, over: ended, typed: input.length, length: LENGTH,
    });
    if (!action) return;
    event.preventDefault();
    if (action.type === "digit") pressKey(action.digit);
    else if (action.type === "erase") pressErase();
    else if (action.type === "check") pressCheck();
    else if (action.type === "pause") player.requestPause();
    else if (action.type === "start") guarded(startPlay)();
    else if (action.type === "level") { if (ladder) goLevel(level + action.by); }
    else if (action.type === "next") { if (F.takesResultKey(run, clockNow(), event.repeat)) primary.run(); }
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
  const rival = friend && friend.rows.length && samePuzzle(friend.puzzle, puzzle) ? friend : null;
  const shared: Shared | null = done ? { puzzle, rows, name } : null;
  const state = shared ? shareHash(shared) : "";
  const earned = finish?.stars ?? 0;
  const madeCode = asciiDigits(made);
  const invite: Shared = { puzzle: { kind: "code", code: isCode(madeCode) ? madeCode : "0123" }, rows: [], name };
  useEffect(() => {
    if (!shared && !friend?.rows.length && !making) return;
    let cancelled = false;
    loadCardFonts("পাকা-কাঁচা আজকের কোড ৪/৭ লেভেল ১২৩").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, today, format, site);
      if (friend?.rows.length && friendPreview.current) drawCard(friendPreview.current, friend, today, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws; run.screen brings the friend's canvas back with the start card.
  }, [state, format, site, friend, today, run.screen]);

  /** Scrolls the stage (not the page) to a box under the game; outside the player, the page. */
  function seeBox(box: HTMLElement | null) {
    const stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }
  function openMake() { setMaking(true); later(0.03, () => seeBox(makeBox.current)); }

  // ---- what the HUD shows ----
  const limits = limitsOf(puzzle);
  const playing = run.screen === "play" && !ended;
  const edge = aidOn(puzzle, "edge") ? danger(triesLeft, playing) : 0;
  const boss = info?.finale;
  const total = totalStars(levels.stars);
  const tag = badge(puzzle, today);
  const onTrack = limits && playing ? starsFor(puzzle, rows.length + 1) : 0;
  const open4 = pinsOpen(rows);
  const clashLine = input.length === LENGTH && rows.length && aidOn(puzzle, "clash") ? clash(input, guesses, rows, rules) : "";
  const lesson = info && !rows.length ? info.line : "";
  const status = nudge || clashLine || (input.length === LENGTH ? "এবার ‘দেখো’ চাপো।" : lesson || "৪টা অঙ্ক চাপো, তারপর ‘দেখো’।");
  const finishNote = done && finish ? [
    rival ? versusLine(rows, rival.rows, rival.name) : finish.record ? "নতুন রেকর্ড! এই ফোনে এত কম বারে আগে পারোনি।" : nearMiss(puzzle, rows),
    ladder && won ? worldLine(level, levels.stars) : "",
    !ladder && !legacy && won && !finish.record && finish.previousBest !== null ? (rows.length === finish.previousBest ? "সেরার সমান।" : `এই ফোনে সেরা ${bn(finish.previousBest)} বার।`) : "",
    nextOpen ? nextLine(nextOpen) : "",
  ].filter(Boolean).join(" ") : "";
  const announce = ended ? (won ? `${bn(rows.length)} বারে মিলেছে!` : `এবার হলো না। কোডটা ছিল ${bnDigits(code)}।`) : "";
  const modeNow = friend && samePuzzle(friend.puzzle, puzzle) && puzzle.kind !== "level" ? "other" : puzzle.kind === "day" ? "day" : ladder ? "level" : "other";
  const savedTries = run.screen === "title" && isToday ? guesses.length : 0;
  const world = ladder ? worldOf(level) - 1 : 0;

  return (
    <div ref={root} className="pk" data-world={world} data-screen={run.screen} data-calm={slow || undefined} data-danger={edge || undefined} onClick={dropFocus}>
      {run.screen === "title" ? (
        <StartCard puzzle={puzzle} today={today} info={info} mode={modeNow} stars={ladder ? levels.stars[level] ?? 0 : 0} open={open} visit={visit} total={total} of={LEVEL_COUNT * 3}
          saved={savedTries} friend={friend && samePuzzle(friend.puzzle, puzzle) ? friend : null} friendCanvas={friendPreview}
          onMode={pick => guarded(pick === "day" ? goDay : home)()} onLevel={guarded(goLevel)} onStart={guarded(startPlay)} onSheet={guarded(openSheet)} onMake={openMake} onHome={guarded(home)} />
      ) : (
        <div className="pk-play" style={{ "--tries": rules.tries } as CSSProperties}>
          <header className="pk-hud">
            <button type="button" className="pk-badge" onClick={guarded(openSheet)} disabled={!ladder} aria-haspopup="dialog" aria-label={`${tag.main}, ${tag.sub}${ladder ? "। সব লেভেল দেখো" : ""}`}>
              <b>{tag.main}</b><span>{tag.sub}</span>
            </button>
            <p className="pk-score" aria-label={`আর ${bn(triesLeft)} বার${limits ? `। এখন ${bn(onTrack)} তারার পথে` : ""}`}>
              <b>{ended ? (won ? `${bn(rows.length)} বারে` : "হলো না") : `আর ${bn(triesLeft)} বার`}</b>
              <span>
                <i className="pk-pips" aria-hidden="true">{Array.from({ length: rules.tries }, (_, index) => <i key={index} data-used={index < rows.length || undefined} data-now={index === rows.length && playing || undefined} />)}</i>
                {limits && <i className="pk-track" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < (ended ? earned : onTrack) || undefined}>★</i>)}</i>}
              </span>
            </p>
          </header>
          {boss && (
            <p className="pk-boss" aria-label={`${boss}: ${bn(open4)}টা পিন খোলা, ৪টার মধ্যে`}>
              <b>{boss}</b>
              <span className="pk-boss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${pinShare(open4, LENGTH)})` }} /></span>
              <span>খোলা পিন {bn(open4)}/৪</span>
            </p>
          )}

          <div className="pk-board" data-held={F.held(run) || undefined}>
            <BoardView guesses={guesses} rows={rows} input={input} tries={rules.tries} basket={basket} over={ended} won={won} typing={typing} />
          </div>
          <p className="pk-sr" aria-live="polite">{announce}</p>

          {done && finish ? (
            <Finish title={finishTitle(puzzle, rows, finish.firstClear)} won={won} code={code} stars={earned} ladder={ladder} slow={slow} stats={finish.stats}
              line={ladder ? clearLine(level, won) : legacy ? "বন্ধুর পুরোনো লেভেল।" : humanLine(rows, rules.tries)}
              note={finishNote} primary={{ ...primary, run: guarded(primary.run) }}
              secondary={secondary.map(action => ({ ...action, run: guarded(action.run) }))} onSeeCard={() => seeBox(resultBox.current)} />
          ) : (
            <>
              <p className="pk-status" role="status" aria-live="polite" data-clash={clashLine ? true : undefined} data-ready={input.length === LENGTH && !nudge && !clashLine ? true : undefined}>{status}</p>
              {!rows.length && <Legend basket={basket} />}
              <Pad digits={rules.digits} repeat={rules.repeat} input={input} hints={hints} shown={aidOn(puzzle, "hints")}
                onKey={guarded(pressKey)} onErase={guarded(pressErase)} onCheck={guarded(pressCheck)} />
            </>
          )}
        </div>
      )}

      {sheet && (
        <LevelSheet stars={levels.stars} open={open} visit={visit} current={ladder ? level : 0} recommended={startLevel(levels.stars, open)}
          onPick={pick => { setSheet(false); setRun(F.sheet(now.current.run, false, clockNow())); goLevel(pick); }} onClose={closeSheet} />
      )}

      {making && (
        <section className="pk-make" id="pk-make" ref={makeBox} aria-labelledby="pk-make-title">
          <h2 id="pk-make-title">বন্ধুর জন্য কোড বানাও</h2>
          <label className="pk-field">
            <span>৪ অঙ্কের কোড <small>চারটাই আলাদা অঙ্ক</small></span>
            <input inputMode="numeric" autoComplete="off" value={bnDigits(made)} placeholder="যেমন ৪৭১৯" aria-invalid={made.length === LENGTH && !isCode(madeCode)}
              onChange={event => setMade(asciiDigits(event.target.value).replace(/\D/g, "").slice(0, LENGTH))} />
          </label>
          <button type="button" className="kit-link" onClick={() => setMade(codeFromSeed(newSeed()))}>নিজে না ভেবে একটা দাও</button>
          {made.length === LENGTH && !isCode(madeCode) && <p className="kit-status" role="alert">একই অঙ্ক দুবার হয়ে গেছে। চারটা আলাদা অঙ্ক দাও।</p>}
          <label className="pk-field">
            <span>তোমার নাম <small>বন্ধু দেখবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} autoComplete="given-name" placeholder="যেমন রাফি" onChange={event => setName(event.target.value)} />
          </label>
          <p className="pk-note">কোডটা লিংকের মধ্যেই লেখা থাকে, তাই এটা গোপন না। বন্ধুকে বলো লিংকে উঁকি না দিতে!</p>
          <ShareBar tool={TOOL} fileName="paka-kancha-code.png" makeImage={() => cardBlob(invite, today, format, site)} imageKey={`${shareHash(invite)}|${format}`}
            caption={caption(invite, today)} state={shareHash(invite)} disabled={!isCode(madeCode)} hint={made.length < LENGTH ? "আগে চারটা আলাদা অঙ্ক দাও।" : ""} />
        </section>
      )}

      {shared && (
        <section className="pk-result" id="result" ref={resultBox} aria-labelledby="pk-result-title">
          <h2 id="pk-result-title">{isToday ? "আজকের" : "তোমার"} <em>ফল</em></h2>
          <p>ছবিতে শুধু আম থাকে, কোনো অঙ্ক না। বন্ধু দেখে বুঝবে তুমি কয়বারে পেরেছ, উত্তর না।</p>
          <div className="pk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`পাকা-কাঁচার কার্ড: ${tag.main}, ${won ? `${bn(rows.length)} বারে` : "এবার হয়নি"}${earned ? `, ${bn(earned)} তারা` : ""}। শুধু আম, কোনো অঙ্ক নেই।`} />
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pk-share">
              <label className="pk-field">
                <span>তোমার নাম <small>ছবিতে আর লিংকে যাবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} autoComplete="given-name" placeholder="যেমন রাফি" onChange={event => setName(event.target.value)} />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="paka-kancha.png" makeImage={() => cardBlob(shared, today, format, site)} imageKey={`${state}|${format}`} caption={caption(shared, today)} state={state}
                hint={puzzle.kind === "code" ? "বন্ধুর কোডের লিংকে কোডটা লেখা থাকে, ওটা গোপন না।" : "লিংকে শুধু আমগুলো যায়, কোনো অঙ্ক না।"} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
