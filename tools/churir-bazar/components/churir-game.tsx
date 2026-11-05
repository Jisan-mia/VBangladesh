"use client";
// IP: what we avoided — no sweets, wrappers or candy shapes and no candy-shop palette; no word callouts popping over the board, no "sweet!"-style voice and no
// jingles borrowed from anyone; ours is round glass bangles on a tufted velvet stall tray (7×7, not 9×9), each colour with its own pattern, our own
// specials (four lifted together leave a gold-rimmed ঝিকমিক bangle that clears two cells each way; any five leave a রংধনু bangle), তালা-বাঁধা bangles that
// can't be swapped, dust on the velvet, a মেলা ladder with a named finale each, and a gift before it. Sounds are synthesized glass clinks.
// The game inside the shared player. Rules live in lib/ (rules.ts plays a move, session.ts decides input and the rattle,
// scene.ts + draw.hot.ts animate the tray); this file feeds input, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, fitCanvas, silenceScheduled, soundOn, totalStars, useBest, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { drawBangle, drawDust, GOLD, GLASS } from "../lib/art";
import { allMoves, DUST_GOAL, FREE_GOAL, LOCK, RAINBOW, SIZE, SPARKLE, neighbours } from "../lib/board";
import { drawCard } from "../lib/card";
import { parseShared, sameRun, fromGame, type Shared } from "../lib/challenge";
import { drawScene } from "../lib/draw.hot";
import { bestMove } from "../lib/hint";
import { DEFS, finaleName, isFinale, isLevel, isMode, LEVEL_COUNT, MODE_INFO, WORLDS, worldOf, type Mode } from "../lib/ladder";
import { createGame, danger, dropDue, move, movesLeft, newRun, progress, specOf, starsOf, type Game, type Run } from "../lib/rules";
import { OPEN_KEY, openAfter, readOpen, startLevel } from "../lib/save";
import { makeScene, resizeScene, SEG_POP, SEG_SHAKE, settle, skipToEnd, stageMove, stageWrong } from "../lib/scene";
import * as S from "../lib/session";
import { bestMoveLine, bn, clearLine, compareLine, endKicker, endWhy, finaleLine, goalLabel, hintLine, nearLine, runLabel } from "../lib/words";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { GiftSheet } from "./gift-sheet";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { sound } from "./sound";
import { Story } from "./story";
import { TitleScreen, titlePiece } from "./title-screen";

const SLUG = "churir-bazar";
const KEYS = { open: OPEN_KEY, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}` };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** How far a finger travels (in cells) before it is a swap: the swap happens then, not when it lifts. */
const DRAG_CELLS = 0.3;
const KEY_STEP: Record<string, number> = { ArrowUp: -SIZE, ArrowDown: SIZE, ArrowLeft: -1, ArrowRight: 1 };
const CONFETTI = [GLASS[0][0], GLASS[1][0], GLASS[2][0], GLASS[3][0], GLASS[4][0], GOLD];
/** Idle seconds before the hint shows, by mode (the hard mode has none). */
const HINT_AFTER: Record<Mode, number> = { e: 3000, n: 6000, h: -1 };

/** The goal pictures: a bangle, a ঝিকমিক one, a রংধনু, a tied one and a patch of dust, drawn once. */
function useChips() {
  const [chips, setChips] = useState<Record<number, string>>({});
  useEffect(() => {
    const sheet = document.createElement("canvas");
    sheet.width = sheet.height = 72;
    const c = sheet.getContext("2d");
    if (!c) return;
    const out: Record<number, string> = {};
    for (const [key, piece] of [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [SPARKLE, SPARKLE + 3], [RAINBOW, RAINBOW], [FREE_GOAL, LOCK + 2]] as const) {
      c.clearRect(0, 0, 72, 72);
      drawBangle(c, piece, 0, 0, 72);
      out[key] = sheet.toDataURL();
    }
    c.clearRect(0, 0, 72, 72);
    c.fillStyle = "#4a2230"; c.beginPath(); c.arc(36, 36, 34, 0, Math.PI * 2); c.fill();
    drawDust(c, 4, 4, 64, 2);
    out[DUST_GOAL] = sheet.toDataURL();
    setChips(out);
  }, []);
  return chips;
}

type Finished = { stats: EndStats; shared: Shared | null; line: string };
type Shown = { score: number; left: number[]; chain: number };

export function ChurirGame() {
  const wrap = useRef<HTMLDivElement>(null), bedBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const scene = useRef(makeScene());
  const session = useRef<S.Session>(S.createSession(true));
  const raf = useRef(0), hintTimer = useRef(0);
  const rattle = useRef<ReturnType<typeof sound.rattle> | null>(null);
  const press = useRef<{ id: number; cell: number; x: number; y: number } | null>(null);
  const finished = useRef<Game | null>(null);
  const clock = useRef({ total: 0, since: 0 });
  /** The animation of the last move is still on screen (the game itself has already moved on). */
  const animating = useRef(false);
  const hudSteps = useRef<Shown[]>([]);
  const lastShownK = useRef(0);
  const inputAt = useRef(0);
  const probe = useRef({ latencies: [] as number[] });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>(newRun(1));
  const [game, setGameState] = useState<Game>(() => createGame(newRun(1)));
  const gameRef = useRef(game);
  const [shown, setShown] = useState<Shown>({ score: 0, left: game.left, chain: 0 });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [open, setOpen] = useState(1);
  const [sheet, setSheet] = useState(false);
  const [giftFor, setGiftFor] = useState<Run | null>(null);
  const [booted, setBooted] = useState(false);
  const [done, setDone] = useState<Finished | null>(null);
  const [shaking, setShaking] = useState(false);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const [bestHere, submitBest] = useBest(`${SLUG}-v2-l${run.v === 2 ? run.level : 0}`);
  const chips = useChips();
  const live = useRef({ slow, screen, run, open, sheet, giftFor, mode, best: bestHere, friend: null as Shared | null });
  live.current = { slow, screen, run, open, sheet, giftFor, mode, best: bestHere, friend };
  scene.current.slow = slow;

  const setGame = (next: Game) => { gameRef.current = next; setGameState(next); };

  // ---- the tray: draw while something moves, then rest ----
  function frame() {
    raf.current = 0;
    const c = ctx.current;
    if (!c) return;
    const sc = scene.current, now = performance.now();
    const moving = drawScene(c, sc, now);
    const s = session.current;
    if (inputAt.current) { probe.current.latencies.push(Math.round(now - inputAt.current)); inputAt.current = 0; }
    // the counters follow the pops as they land
    if (animating.current && sc.popsShown !== lastShownK.current) {
      lastShownK.current = sc.popsShown;
      const at = hudSteps.current[sc.popsShown - 1];
      if (at) setShown(at);
    }
    // the rattle follows the shake
    if (sc.inShake !== s.shaking) {
      s.shaking = sc.inShake; setShaking(sc.inShake); sync();
    }
    if (sc.inShake && rattle.current) rattle.current.pitch(3600 + 2400 * Math.sin(now / 55));
    if (animating.current && now >= sc.end) settled();
    if ((moving || animating.current) && S.live(s)) raf.current = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf.current) raf.current = requestAnimationFrame(frame); };
  /** Draw right now, inside the event: the press is answered in the same task. */
  const redraw = () => {
    const c = ctx.current;
    if (!c) return;
    drawScene(c, scene.current, performance.now());
    if (inputAt.current) { probe.current.latencies.push(Math.round(performance.now() - inputAt.current)); inputAt.current = 0; }
  };
  const still = () => { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; } redraw(); };

  // ---- the rattle loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { rattle.current?.stop(); rattle.current = sound.rattle(); },
    stop: () => { rattle.current?.stop(); rattle.current = null; },
  };
  const sync = () => S.syncLoops(session.current, loops);

  // ---- the play clock: only while the tray is live ----
  const clockOn = () => { if (!clock.current.since) clock.current.since = performance.now(); };
  const clockOff = () => { if (clock.current.since) { clock.current.total += performance.now() - clock.current.since; clock.current.since = 0; } };
  const clockNow = () => clock.current.total + (clock.current.since ? performance.now() - clock.current.since : 0);
  const syncClock = () => { if (S.live(session.current) && !gameRef.current.over) clockOn(); else clockOff(); };

  // ---- the idle hint ----
  const clearHint = () => { window.clearTimeout(hintTimer.current); hintTimer.current = 0; const sc = scene.current; sc.hintOn = false; sc.hint0 = sc.hint1 = -1; };
  function showHint() {
    const g = gameRef.current, sc = scene.current;
    if (g.over || !S.live(session.current)) return;
    const pick = bestMove(g);
    if (!pick) return;
    sc.hint0 = pick[0]; sc.hint1 = pick[1]; sc.hintOn = true;
    kick();
  }
  function armHint(immediate = false) {
    window.clearTimeout(hintTimer.current); hintTimer.current = 0;
    const after = immediate ? 400 : HINT_AFTER[live.current.run.mode];
    if (after < 0 || gameRef.current.over || !S.live(session.current)) return;
    hintTimer.current = window.setTimeout(showHint, after);
  }

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    live.current.screen = next;
    setScreen(next);
    press.current = null;
    sync(); syncClock();
  }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); press.current = null; scene.current.selected = -1; clearHint(); sync(); syncClock(); still(); },
    onResume: () => { if (live.current.sheet || live.current.giftFor) return; S.resume(session.current, performance.now()); sync(); syncClock(); kick(); armHint(); },
    onRestart: () => { S.resume(session.current, performance.now()); setSheet(false); setGiftFor(null); if (live.current.screen === "play" || live.current.screen === "over") again(); else sync(); },
    onLevels: () => { if (live.current.screen !== "intro") openSheet(); },
  });

  /** A fresh run on the play screen. */
  function begin(next: Run) {
    S.startRun(session.current, silenceScheduled);
    clearHint();
    animating.current = false;
    const fresh = createGame(next);
    finished.current = null;
    clock.current = { total: 0, since: 0 };
    setRun(next); live.current.run = next;
    setGame(fresh);
    setShown({ score: 0, left: fresh.left, chain: 0 }); lastShownK.current = 0;
    setDone(null); setSheet(false); live.current.sheet = false; setGiftFor(null); live.current.giftFor = null; setShaking(false);
    if (session.current.paused && !player.paused) S.resume(session.current, performance.now());
    show("play");
    const sc = scene.current;
    if (sc.side) resizeScene(sc, sc.side, sc.ratio, next.v === 2 ? worldOf(next.level) : 0);
    settle(sc, fresh.cells, fresh.dust, performance.now());
    sc.selected = -1; sc.dropCell = dropDue(fresh);
    still(); kick();
    armHint(next.v === 2 && next.level === 1);
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: saved progress, a friend's link, the remembered mode ----
  useEffect(() => {
    if (!levels.loaded || booted) return;
    setBooted(true);
    setSite(window.location.host);
    session.current.sound = soundOn();
    const mine = readOpen(read(KEYS.open), levels.stars);
    if (read(KEYS.open) === null) write(KEYS.open, String(mine));
    setOpen(mine); live.current.open = mine;
    const savedMode = read(KEYS.mode), chosen: Mode = isMode(savedMode) ? savedMode : "n";
    setModeState(chosen); live.current.mode = chosen;
    const fromHash = () => {
      const link = parseShared(window.location.hash);
      if (!link) return false;
      setFriend(link);
      if (link.v === 2) setVisit(link.level);
      const first: Run = { v: link.v, level: link.level, mode: link.mode, gift: link.gift };
      setModeState(link.mode);
      setRun(first); live.current.run = first;
      setGame(createGame(first));
      if (live.current.screen !== "title") show("title");
      return true;
    };
    if (!fromHash()) {
      const first = newRun(startLevel(levels.stars, mine), chosen);
      setRun(first); live.current.run = first;
      setGame(createGame(first));
    }
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read and drive the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, {
      __churir: {
        game: () => gameRef.current, session: () => session.current, scene: () => scene.current, probe: () => probe.current,
        swap: (a: number, b: number) => swap(a, b, performance.now() + 1e6), play: (target: Run) => begin(target), hint: () => bestMove(gameRef.current),
        moves: () => allMoves(gameRef.current.cells), finishNow: () => skipAnimation(),
        unlock: (level: number) => { live.current.open = level; setOpen(level); }, choose: (level: number) => chooseLevel(level), start: () => start(),
      },
    });
  });

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, soundIsOn); if (!soundIsOn) silenceScheduled(); sync(); }, [soundIsOn]);

  // ---- away and back: a press in flight never lands; the player pauses ----
  useEffect(() => {
    const away = () => { press.current = null; scene.current.selected = -1; clearHint(); sync(); syncClock(); };
    const onBlur = () => { S.blur(session.current); away(); };
    const onFocus = () => { S.focus(session.current, performance.now()); sync(); syncClock(); kick(); armHint(); };
    const onVisibility = () => { if (document.hidden) { S.hide(session.current); away(); } else { S.show(session.current, performance.now()); sync(); syncClock(); kick(); armHint(); } };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility);
      loops.stop("rattle"); silenceScheduled(); window.clearTimeout(hintTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // ---- size the tray to its box ----
  useEffect(() => {
    const holder = bedBox.current, target = canvas.current;
    if (!holder || !target) return;
    const fit = () => {
      const side = Math.floor(Math.min(holder.clientWidth, holder.clientHeight));
      if (side < 80) return;
      target.style.width = `${side}px`; target.style.height = `${side}px`;
      ctx.current = fitCanvas(target, side, side);
      const r = live.current.run, sc = scene.current, g = gameRef.current;
      resizeScene(sc, side, Math.min(2, window.devicePixelRatio || 1), r.v === 2 ? worldOf(r.level) : 0);
      if (performance.now() > sc.end) { settle(sc, g.cells, g.dust, performance.now()); sc.dropCell = dropDue(g); }
      still(); kick();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    fit();
    return () => observer.disconnect();
  }, [screen === "play" || screen === "over"]);

  // ---- a swap ----
  /** Whatever the last move was still animating is over at once, so a new press is answered now. */
  function skipAnimation() {
    const sc = scene.current;
    if (!animating.current) return;
    skipToEnd(sc, performance.now());
    redraw();
    settled();
  }

  function swap(a: number, b: number, at: number) {
    const s = session.current, before = gameRef.current, sc = scene.current;
    if (!S.canMove(s, at) || before.over || !neighbours(a, b)) return;
    if (animating.current) skipAnimation();
    const board = gameRef.current;
    if (board.over) return;
    clearHint(); sc.selected = -1;
    const now = performance.now();
    const next = move(board, a, b);
    if (!next) {
      sound.wrong();
      stageWrong(sc, board.cells, board.dust, a, b, now);
      redraw(); kick();
      armHint();
      return;
    }
    const outcome = next.last!;
    stageMove(sc, board, outcome, a, b, now);
    setGame(next);
    sound.swap();
    // everything this move sounds like, laid on the audio clock against its pops
    let pop = 0;
    const cumulative: Shown[] = [];
    let score = board.score, left = board.left;
    for (let i = 0; i < sc.n; i++) {
      const seg = sc.from[i] / 1000;
      if (sc.kind[i] === SEG_POP) {
        const step = sc.segStep[i]!, many = step.cleared.length + step.made.length;
        sound.clink(pop, many, seg); if (many >= 4) sound.shatter(many, seg);
        if (step.blasts.length) sound.blast(seg);
        if (step.made.some(item => item.piece === RAINBOW)) sound.sweep(seg + 0.1); else if (step.made.length) sound.shimmer(seg + 0.1);
        if (step.freed) sound.free(seg + 0.03);
        if (step.wiped) sound.dust(seg);
        const specials = step.made.filter(item => item.piece !== RAINBOW).length;
        const gained = progress(board.spec.goals, { lifted: step.lifted, made: [specials, step.made.length - specials], freed: step.freed, wiped: step.wiped });
        score += step.points;
        left = left.map((count, index) => Math.max(0, count - gained[index]));
        cumulative.push({ score, left, chain: pop + 1 });
        pop++;
      } else if (sc.kind[i] === SEG_SHAKE) sound.jingle(seg);
    }
    if (outcome.lockedAt >= 0) sound.lock(sc.lockAt / 1000);
    hudSteps.current = cumulative; lastShownK.current = 0;
    animating.current = true;
    redraw(); kick();
    if (probe.current.latencies.length > 400) probe.current.latencies.length = 0;
  }

  /** The animation is over: the real numbers, the next hint, and the end if the level is over. */
  function settled() {
    if (!animating.current) return;
    animating.current = false;
    const g = gameRef.current, sc = scene.current;
    setShown({ score: g.score, left: g.left, chain: 0 }); lastShownK.current = 0;
    sc.dropCell = dropDue(g);
    if (sc.inShake) { sc.inShake = false; S.syncLoops(session.current, loops); }
    session.current.shaking = false; setShaking(false); sync();
    if (!g.over && movesLeft(g) <= 3) sound.warn();
    if (g.over) finish(g); else armHint();
  }

  // ---- the end of a run: record once, celebrate what's real ----
  function finish(g: Game) {
    if (finished.current === g) return;
    finished.current = g;
    clockOff(); clearHint();
    const r = g.run, stars = starsOf(g), world = r.v === 2 ? worldOf(r.level) : 0, now = performance.now();
    const rival = live.current.friend && sameRun(live.current.friend, r) ? live.current.friend : null;
    let line = "", best = "", big = false;
    if (g.won) {
      if (r.v === 2) {
        const first = !levels.stars[r.level];
        levels.record(r.level, stars);
        const opened = openAfter(live.current.open, r.level);
        if (opened !== live.current.open) { live.current.open = opened; setOpen(opened); write(KEYS.open, String(opened)); }
        const previous = live.current.best, record = submitBest(g.score) && previous !== null;
        best = record ? `নতুন সেরা! আগের সেরা ছিল ${bn(previous!)} পয়েন্ট।` : previous !== null ? `এই ফোনে এই লেভেলের সেরা ${bn(Math.max(previous, g.score))} পয়েন্ট।` : "";
        big = stars === 3 || (first && isFinale(r.level)) || record;
        line = first && isFinale(r.level) ? finaleLine(r.level) : clearLine(r.level);
      } else line = clearLine(r.level);
      sound.call(WORLDS[world].call, big, 0.3 + 0.28 * stars);
      sound.jingle(0.12);
      S.cheer(session.current, now, 1500 + 280 * stars);
    } else {
      line = `${bn(g.limit)} চাল শেষ।`;
      sound.lose(0.15);
      S.cheer(session.current, now, 800);
    }
    if (rival && g.won) line = compareLine(g.score, rival.score, rival.name);
    for (let star = 0; star < stars; star++) sound.star(star, 0.3 + star * 0.28);
    if (big && !live.current.slow) confetti({ colors: CONFETTI });
    const shared = fromGame(g, "");
    setDone({
      shared, line,
      stats: {
        kicker: endKicker(g), why: endWhy(g), won: g.won, stars, maxStars: MODE_INFO[r.mode].maxStars, showStars: g.won, piece: titlePiece(r),
        moves: g.moves.length, limit: g.limit, score: g.score, lifted: g.lifted, cascade: g.bestCascade, sparkles: g.sparkles, rainbows: g.rainbows, freed: g.freed, wiped: g.wiped,
        seconds: Math.round(clockNow() / 1000), bestMove: bestMoveLine(g), line, near: g.won ? nearLine(g) : "", best,
      },
    });
    show("over");
  }

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); live.current.mode = next; write(KEYS.mode, next); sfx.tap(); }
  const canPick = (level: number) => isLevel(level) && (level <= live.current.open || level === visit);
  const rivalFits = (target: Run) => friend !== null && sameRun(friend, target);
  /** A finale asks for its gift first; anything else starts at once. */
  function startOrGift(target: Run) {
    if (target.v === 2 && isFinale(target.level) && target.gift === 0 && !rivalFits(target)) {
      S.pause(session.current); press.current = null; clearHint();
      live.current.giftFor = target; setGiftFor(target); still();
      return;
    }
    begin(target);
  }
  function start() {
    sfx.tap();
    const target: Run = rivalFits(run) ? run : { ...run, mode, gift: 0 };
    if (!read(KEYS.intro) && !friend) { setRun(target); live.current.run = target; show("intro"); return; }
    startOrGift(target);
  }
  function storyDone() { write(KEYS.intro, "1"); startOrGift(live.current.run); }
  function pickGift(gift: number) {
    const target = live.current.giftFor;
    if (!target) return;
    sound.chosen();
    S.resume(session.current, performance.now());
    begin({ ...target, gift });
  }
  function skipGift() {
    const target = live.current.giftFor;
    if (!target) return;
    S.resume(session.current, performance.now());
    begin({ ...target, gift: 0 });
  }
  /** On the title, ‹ › and the list only choose; playing starts from the medallion. */
  function chooseLevel(level: number) {
    if (!canPick(level)) return;
    const target: Run = newRun(level, live.current.mode);
    const pickFriend: Run = friend && friend.v === 2 && friend.level === level ? { v: 2, level, mode: friend.mode, gift: friend.gift } : target;
    if (live.current.screen === "title") { setRun(pickFriend); live.current.run = pickFriend; setGame(createGame(pickFriend)); closeSheet(false); }
    else { closeSheet(false); startOrGift(pickFriend); }
  }
  function again() {
    const current = live.current.run;
    begin(current);
  }
  function openSheet() { S.pause(session.current); press.current = null; clearHint(); live.current.sheet = true; setSheet(true); sync(); syncClock(); still(); }
  function closeSheet(resume = true) {
    live.current.sheet = false; setSheet(false);
    if (!player.paused) S.resume(session.current, performance.now());
    if (resume) { sync(); syncClock(); kick(); armHint(); }
  }

  const r = run, cleared = done !== null && game.won;
  const nextLevel = cleared && r.v === 2 && r.level < LEVEL_COUNT && canPick(r.level + 1) ? r.level + 1 : 0;
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের লেভেল", run: () => chooseLevel(nextLevel) }] : []),
    { label: "আবার খেলো", run: again },
    { label: "সব লেভেল", run: openSheet },
  ];

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key, fresh = !event.repeat, sc = scene.current;
      if (s.paused || live.current.sheet || live.current.giftFor) return;
      const enter = key === "Enter" || key === " ";
      if (screen === "title") {
        if (enter && fresh) { event.preventDefault(); start(); }
        else if (key === "ArrowLeft" && fresh && run.v === 2 && canPick(run.level - 1)) { event.preventDefault(); chooseLevel(run.level - 1); }
        else if (key === "ArrowRight" && fresh && run.v === 2 && canPick(run.level + 1)) { event.preventDefault(); chooseLevel(run.level + 1); }
        return;
      }
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); if (fresh) player.requestPause(); return; }
        if (key in KEY_STEP) {
          event.preventDefault();
          if (!fresh || !S.canMove(s, event.timeStamp)) return;
          sc.keyboard = true;
          const target = sc.cursor + KEY_STEP[key];
          if (!neighbours(sc.cursor, target)) { redraw(); return; }
          inputAt.current = event.timeStamp;
          if (sc.selected === sc.cursor) { const from = sc.cursor; sc.cursor = target; swap(from, target, event.timeStamp); }
          else sc.cursor = target;
          redraw(); kick();
          return;
        }
        if (enter) {
          event.preventDefault();
          if (!fresh || !S.canMove(s, event.timeStamp) || gameRef.current.over) return;
          if (animating.current) skipAnimation();
          sc.keyboard = true; sc.selected = sc.selected === sc.cursor ? -1 : sc.cursor;
          if (sc.selected >= 0) sound.pick();
          redraw(); kick();
        }
        return;
      }
      if (screen === "over") {
        if (S.freshResultKey(s, event)) {
          const index = enter ? 0 : /^[1-3]$/.test(key) ? Number(key) - 1 : "১২৩".indexOf(key);
          if (index >= 0 && choices[index]) { event.preventDefault(); choices[index].run(); }
        } else if (enter || key in KEY_STEP) event.preventDefault();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // ---- pointer: drag a bangle onto its neighbour, or tap one and then the other ----
  function cellAt(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE), row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    return col >= 0 && col < SIZE && row >= 0 && row < SIZE ? row * SIZE + col : -1;
  }
  function onDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const sc = scene.current, cell = cellAt(event);
    if (!event.isPrimary || cell < 0 || screen !== "play" || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (!S.press(session.current, event.timeStamp)) return;
    inputAt.current = event.timeStamp;
    if (animating.current) skipAnimation();
    if (gameRef.current.over) { S.release(session.current); return; }
    sc.keyboard = false; clearHint();
    if (sc.selected >= 0 && sc.selected !== cell && neighbours(sc.selected, cell)) { const from = sc.selected; S.release(session.current); swap(from, cell, event.timeStamp); return; }
    if (sc.selected === cell) { sc.selected = -1; S.release(session.current); redraw(); return; }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    press.current = { id: event.pointerId, cell, x: event.clientX, y: event.clientY };
    sc.selected = cell; sc.cursor = cell;
    sound.pick();
    redraw(); kick();
  }
  function onMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id) return;
    // a mouse that moves with no button held is not a drag (the button was let go somewhere we never heard about)
    if (!S.dragCounts(session.current, event)) { if (event.pointerType === "mouse" && event.buttons === 0) { press.current = null; S.release(session.current); } return; }
    const dx = event.clientX - held.x, dy = event.clientY - held.y, reach = (event.currentTarget.getBoundingClientRect().width / SIZE) * DRAG_CELLS;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < reach) return;
    press.current = null; S.release(session.current);
    inputAt.current = event.timeStamp;
    swap(held.cell, held.cell + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? SIZE : -SIZE)), event.timeStamp);
  }
  const onUp = () => { press.current = null; S.release(session.current); };

  // ---- the friend's card on the title ----
  useEffect(() => {
    if (!friend || screen !== "title") return;
    let cancelled = false;
    loadCardFonts("চুড়ির বাজার রাফি ৩২৪০ পয়েন্ট লেভেল").then(() => { if (!cancelled && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site); }).catch(() => {});
    return () => { cancelled = true; };
  }, [friend, screen, site]);

  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior: slow ? "auto" : "smooth" });
    else card?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "start" });
  };

  // ---- what the screen shows ----
  const spec = game.spec, world = r.v === 2 ? worldOf(r.level) : 0;
  const finale = r.v === 2 ? finaleName(r.level) : "";
  const left = movesLeft(game), limit = game.limit;
  const edgeLevel = screen === "play" ? danger(game) : 0;
  const edge = edgeLevel === 2 ? "danger-hot" : edgeLevel === 1 ? "danger" : "";
  const total = totalStars(levels.stars);
  const recommended = startLevel(levels.stars, open);
  const goalsTotal = spec.goals.reduce((sum, goal) => sum + goal[1], 0), goalsLeft = shown.left.reduce((sum, count) => sum + count, 0);
  const status = shaking ? "বদলানোর মতো কিছু নেই। চুড়ি ঝাঁকানো হচ্ছে।" : shown.chain > 1 ? `পরপর ×${bn(shown.chain)}` : hintLine(game);
  const giftSpec = giftFor ? specOf(giftFor) : spec;

  return (
    <div className="cb-wrap" ref={wrap}>
      <div className="cb" data-screen={screen} data-world={world} data-slow={slow || undefined} data-finale={finale ? "" : undefined}>
        {screen === "title" && (
          <TitleScreen run={run} mode={mode} friend={friend} friendCanvas={friendCanvas} stars={total} levelStars={r.v === 2 ? levels.stars[r.level] ?? 0 : 0}
            canBack={r.v === 2 && r.level > 1 && canPick(r.level - 1)} canNext={r.v === 2 && canPick(r.level + 1)}
            onStart={start} onMode={setMode} onLevel={chooseLevel} onLevels={openSheet} />
        )}
        {screen === "intro" && <Story onDone={storyDone} />}
        {(screen === "play" || screen === "over") && (
          <div className="cb-play">
            <div className="cb-hud">
              <button type="button" className="cb-badge" onClick={event => { event.currentTarget.blur(); openSheet(); }} aria-haspopup="dialog" aria-label={`${runLabel(r)}, সব লেভেল দেখো`}>
                <b>{finale ? "শেষ ধাপ" : `লেভেল ${bn(r.level)}`}</b>
                <span>{r.v === 2 ? DEFS[r.level - 1].name : "পুরোনো লেভেল"}</span>
              </button>
              <ul className="cb-goals" aria-label="লক্ষ্য">
                {spec.goals.map((goal, index) => {
                  const rest = shown.left[index] ?? goal[1];
                  return (
                    <li key={index} data-done={rest === 0 || undefined} aria-label={goalLabel(goal, rest)}>
                      {chips[goal[0]] && <img src={chips[goal[0]]} alt="" />}
                      <b key={rest} className={!slow && rest !== goal[1] ? "cb-bump" : ""}>{rest === 0 ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : bn(rest)}</b>
                    </li>
                  );
                })}
              </ul>
              <p className="cb-count" data-low={edgeLevel > 0 ? "" : undefined} aria-label={`আর ${bn(left)} চাল, ${bn(shown.score)} পয়েন্ট`}>
                <b key={left} className={!slow && game.moves.length ? "cb-bump" : ""}>{bn(left)}</b><small>চাল বাকি</small>
                <small className="cb-score">{bn(shown.score)} পয়েন্ট</small>
              </p>
            </div>
            {finale && screen === "play" && (
              <div className="cb-boss" aria-label={`${finale}: আর ${bn(goalsLeft)} বাকি`}>
                <b>{finale}</b>
                <span className="cb-meter"><i style={{ width: `${Math.round((goalsLeft / Math.max(1, goalsTotal)) * 100)}%` }} /></span>
              </div>
            )}
            <div className="cb-bed" ref={bedBox}>
              <div className="cb-frame" data-edge={edge}>
                <canvas ref={canvas} className="cb-canvas" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}
                  role="img" aria-label={`চুড়ির ছক, ${bn(SIZE)}×${bn(SIZE)}। পাশাপাশি দুটো চুড়ি টেনে বা একটা ছুঁয়ে তারপর পাশেরটা ছুঁয়ে বদলাও। কিবোর্ডে তীর দিয়ে ঘর বাছো, এন্টার চেপে ধরো, আবার তীর চাপলে বদলাবে।`} />
              </div>
            </div>
            {screen === "play" && (
              <>
                <p className="cb-status" role="status" aria-live="polite" data-chain={shown.chain > 1 || undefined}>{status}</p>
                <div className="cb-tools">
                  <button type="button" className="cb-tool" onClick={event => { event.currentTarget.blur(); again(); }} disabled={!game.moves.length}>আবার শুরু</button>
                  {mode !== "h" && <button type="button" className="cb-tool" onClick={event => { event.currentTarget.blur(); if (animating.current) skipAnimation(); showHint(); }} disabled={game.over}>ইশারা</button>}
                </div>
              </>
            )}
            {screen === "over" && done && <EndScreen stats={done.stats} slow={slow} choices={choices} onCard={toCard} />}
          </div>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={r.v === 2 ? r.level : 0} recommended={recommended}
          onPick={level => { if (canPick(level)) chooseLevel(level); }} onClose={() => closeSheet(true)} />}
        {giftFor && <GiftSheet run={giftFor} spec={giftSpec} name={finaleName(giftFor.level)} onPick={pickGift} onSkip={skipGift} />}
      </div>
      {screen === "over" && done?.shared && <ResultCard result={done.shared} site={site} line={done.line} />}
    </div>
  );
}

