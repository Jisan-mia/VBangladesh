"use client";
// IP: what we avoided — no real club, national team, league, kit, player, trophy or stadium, and no football-game brand's look or HUD; ours is a made-up পাড়ার দল in plain orange on a school field with a bamboo goal and a fishing-net mesh, against twelve invented local teams in plain single colours.
// Thin React over the pure match: lib/session.ts decides when anything may move, lib/step.hot.ts runs the clock, lib/draw.hot.ts draws.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, recordLevel, sfx, soundOn, totalStars, useGameLoop, useSlowMode, MAX_NAME, type LevelStars } from "../../../shared/game-kit";
import { StarReveal } from "../../../shared/game-ui";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { parseShared, sharedHash, type Shared } from "../lib/challenge";
import { crowdLevel, crowdWanted, keepCrowd, type Loop } from "../lib/crowd";
import { drawFrame, moveView, trackBall } from "../lib/draw.hot";
import { aiming, createGame, dive, keeping, moveAim, pressKick, shoot, Ev, Stage, type Game } from "../lib/game";
import { drawStartArt, drawStoryPanel, STORY } from "../lib/intro";
import { cupRound, levelOf, worldOf, LEVEL_COUNT, PER_WORLD, US, WORLDS } from "../lib/levels";
import { bannerNote, bn, caption, clearLine, compareLine, feat, humanLine, kickLine, levelLabel, lossLine, nearMissLine, score } from "../lib/lines";
import { afterClear, loadProgress, playable, recommended, INTRO_KEY, LEVELS_KEY, UNLOCK_KEY } from "../lib/progress";
import { linkScore, starsOf, suddenDeath, Outcome, type Zone } from "../lib/rules";
import { again as sessionAgain, back, cheerMayPlay, createSession, finish as sessionFinish, lostFocus, moving, pause as sessionPause, pick as sessionPick, press, reset as sessionReset, resume as sessionResume, start as sessionStart, storyDone, GUARD_MS, type Phase } from "../lib/session";
import { bambooKnock, clockTick, crowd, crowdLoop, cupFanfare, cupMotif, gloveSave, kickThump, netSwish, whistle } from "../lib/sfx";
import { stepGame } from "../lib/step.hot";
import { aimFrom, powerFrom, swipeShot, toScreenX, toScreenY, GTOP, GW, GX, GY, H, W } from "../lib/swipe";
import { paintDanger, paletteFor, drawField, seatCrowd } from "../lib/scene";
import { makeView } from "../lib/view";
import { Art, CountUp, Dots, Picker } from "./screens";

const TOOL = "penalty";
const TAP_SLOP = 10;
const HOLD_SKIP = 600;
const PANEL_MS = 3400;
/** A breath after resuming before the run-up moves again (ms). */
const BREATH = 450;

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Hud = { goals: number; conceded: number; ours: number[]; theirs: number[]; stage: Stage; side: 0 | 1; sudden: boolean; danger: boolean; dive: number };
type Result = { level: number; seed: number; us: number; them: number; stars: number; won: boolean; improved: boolean; sudden: boolean; goals: number; shots: number; stops: number; faced: number; frame: number; hardest: number; seconds: number };

function hudOf(g: Game): Hud {
  const ours: number[] = [], theirs: number[] = [];
  for (let i = 0; i < g.count; i++) (g.sides[i] ? theirs : ours).push(g.outcomes[i] === Outcome.Goal ? 1 : 0);
  return { goals: g.tally.goals, conceded: g.tally.conceded, ours, theirs, stage: g.stage, side: g.side, sudden: suddenDeath(g.data, g.tally), danger: g.danger, dive: g.dive };
}

export function PenaltyGame() {
  const [session] = useState(createSession);
  const [view] = useState(makeView);
  const [phase, setPhase] = useState<Phase>("title");
  const [picking, setPicking] = useState(false);
  const [world, setWorld] = useState(0);
  const [cardOpen, setCardOpen] = useState(false);
  const [panel, setPanel] = useState(0);
  const [firstGame] = useState(() => createGame(1, 1));
  const game = useRef<Game>(firstGame);
  const [hud, setHud] = useState<Hud>(() => hudOf(firstGame));
  const [call, setCall] = useState({ id: 0, text: "", good: false });
  const [aimMode, setAimMode] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [ready, setReady] = useState(true);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow] = useSlowMode();
  const [stars, setStars] = useState<LevelStars>({});
  const [unlock, setUnlock] = useState(1);
  const unlockRef = useRef(1);
  const starsRef = useRef<LevelStars>({});
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const chosen = useRef(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const timers = useRef<number[]>([]);
  const story = useRef({ seen: true, clock: 0, holdAt: -1 });
  const hum = useRef<Loop | null>(null);
  const breath = useRef(0);
  const friendRef = useRef<Shared | null>(null);
  const inView = useInView(root, 0.35);
  const player = useGamePlayer({ onPause: pause, onResume: resume, onRestart: () => reset() });

  const calm = () => slowRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sync = () => {
    setPhase(session.phase);
    setPicking(session.picking);
    view.look = session.phase === "playing" ? 1 : session.phase === "paused" ? 2 : session.phase === "over" ? 3 : 0;
  };
  const later = (run: () => void, ms: number) => { timers.current.push(window.setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopCrowd = () => { hum.current?.stop(); hum.current = null; };
  /** Make, keep or drop the crowd loop for what's on screen now (also run from every step). */
  const syncCrowd = () => {
    hum.current = keepCrowd(hum.current, crowdWanted(session, soundOn()) && game.current.stage !== Stage.Over, crowdLoop);
    hum.current?.swell(crowdLevel(game.current));
  };
  const releaseFinger = () => { view.pointer = -1; view.count = 0; session.finger = false; if (view.aim === 1) { view.aim = 0; setAimMode(0); } };
  const friendFits = (forLevel: number) => friendRef.current?.level === forLevel;
  const hint = () => levelRef.current === 1 && !starsRef.current[1] && game.current.count === 0 && !friendRef.current;
  const draw = () => drawFrame(view, game.current, hint());

  /** Paints the ground for this match and size: the field, the net, the crowd's seats and the danger rim. */
  function paint() {
    if (!view.width) return;
    const palette = paletteFor(levelRef.current), ratio = view.ratio, k = view.scale * ratio;
    view.palette = palette;
    const background = view.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round((H + view.top + view.bottom) * k);
    const b = background.getContext("2d");
    if (b) { b.setTransform(k, 0, 0, k, 0, view.top * k); drawField(b, palette, view.top, view.bottom); }
    view.crowd = seatCrowd(palette, view.top, view.cx, view.cy, view.cr, view.cs, view.cp);
    paintDanger(view.danger ??= document.createElement("canvas"), view.width, view.height, ratio, "#ff7a2e");
  }

  /** A fresh match on `nextLevel` (no phase change). Celebration timers from the last one are cleared here. */
  function deal(nextSeed: number, nextLevel: number) {
    clearTimers();
    stopCrowd();
    releaseFinger();
    const repaint = nextLevel !== levelRef.current || !view.background;
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    game.current = createGame(nextLevel, nextSeed, slowRef.current);
    game.current.calm = calm();
    if (repaint) paint();
    view.cheer = 0; view.ripple = 0; view.wobble = 0; view.flash = 0; view.shake = 0; view.bcount = 0;
    setHud(hudOf(game.current));
    setCall({ id: 0, text: "", good: false });
    setResult(null); setCardOpen(false); setReady(true);
    draw();
  }
  /** নতুন করে শুরু, a match picked, a friend's link: back to the title with a fresh match. */
  function reset(nextLevel = levelRef.current, nextSeed = friendFits(nextLevel) ? friendRef.current!.seed : newSeed()) {
    sessionReset(session);
    deal(nextSeed, nextLevel);
    sync();
  }

  function start() {
    const firstStory = !story.current.seen && levelRef.current === 1 && !friendRef.current;
    if (!sessionStart(session, firstStory)) return;
    if (firstStory) { story.current.clock = 0; story.current.holdAt = -1; setPanel(0); }
    else kickOff();
    sync();
  }
  /** The first whistle of a match: the cup's four notes. */
  function kickOff() {
    whistle();
    cupMotif(worldOf(levelRef.current));
    breath.current = performance.now() + 250;
    syncCrowd();
  }
  function endStory() {
    if (!storyDone(session)) return;
    story.current.seen = true;
    write(INTRO_KEY, "1");
    kickOff();
    sync();
  }
  function nextPanel() {
    if (session.phase !== "story") return;
    story.current.clock = 0;
    setPanel(current => { if (current + 1 >= STORY.length) { endStory(); return current; } sfx.tap(); return current + 1; });
  }
  function pause() {
    stopCrowd();
    releaseFinger();
    story.current.holdAt = -1;
    if (sessionPause(session)) sync();
  }
  function resume() {
    if (!sessionResume(session)) return;
    breath.current = performance.now() + BREATH;
    syncCrowd();
    sync();
  }
  /** আবার খেলো or পরের ম্যাচ from the end screen: straight into play. */
  function again(nextLevel = levelRef.current, key?: { at: number; repeat: boolean }) {
    if (!result || !playable(nextLevel, unlockRef.current, starsRef.current, friendRef.current?.level)) return;
    if (!sessionAgain(session, performance.now(), key)) return;
    deal(friendFits(nextLevel) ? friendRef.current!.seed : newSeed(), nextLevel);
    kickOff();
    sync();
  }
  const nextAfter = (done: Result | null) => done && done.won && done.level < LEVEL_COUNT && playable(done.level + 1, unlockRef.current, starsRef.current, friendRef.current?.level) ? done.level + 1 : 0;

  function choose(nextLevel: number) {
    chosen.current = true;
    sfx.tap();
    reset(nextLevel);
  }
  function openPicker(open: boolean) {
    if (!sessionPick(session, open)) return;
    if (open) setWorld(worldOf(levelRef.current));
    sfx.tap();
    sync();
  }

  /** The match is decided (once: the session refuses a second finish). */
  function finish() {
    const g = game.current, at = levelRef.current, now = performance.now();
    if (!sessionFinish(session, now)) return;
    stopCrowd();
    releaseFinger();
    const [us, them] = linkScore(at, g.tally), earned = starsOf(at, us, them), before = starsRef.current[at] ?? 0;
    const won = earned > 0, finale = Boolean(levelOf(at).finale);
    setResult({ level: at, seed: g.seed, us, them, stars: earned, won, improved: before > 0 && earned > before, sudden: suddenDeath(g.data, g.tally) && g.data.format === "shootout",
      goals: g.tally.goals, shots: g.tally.usTaken, stops: g.stops, faced: g.tally.themTaken, frame: g.frame, hardest: Math.round(g.hardest * 100), seconds: Math.round(g.played) });
    if (won) {
      const next = recordLevel(starsRef.current, at, earned);
      starsRef.current = next; setStars(next); write(LEVELS_KEY, JSON.stringify(next));
      const opened = afterClear(unlockRef.current, at);
      if (opened !== unlockRef.current) { unlockRef.current = opened; setUnlock(opened); write(UNLOCK_KEY, String(opened)); }
    }
    whistle(true);
    const run = session.run;
    if (!won) sfx.lose();
    else if (finale) later(() => { if (cheerMayPlay(session, run)) { cupFanfare(); confetti({ colors: ["#e8682a", "#1f6f43", "#ffd23f", "#ffffff", "#3a86c8"] }); } }, 650);
    else if (earned === 3) later(() => { if (cheerMayPlay(session, run)) { sfx.win(); confetti({ colors: ["#e8682a", "#1f6f43", "#ffd23f", "#ffffff"] }); } }, 650);
    else later(() => { if (cheerMayPlay(session, run)) sfx.good(); }, 650);
    setReady(false);
    later(() => setReady(true), GUARD_MS);
    sync();
  }

  /** The sounds, juice and HUD for what one step did. */
  function react(g: Game) {
    const ev = g.events;
    g.events = 0;
    if (!ev) return;
    if (ev & Ev.Kick) {
      kickThump();
      view.flash = 1; view.shake = 0.12; view.shakeSize = g.side === 0 ? 0.6 : 0.35;
    }
    if (ev & Ev.Land) {
      const ours = g.side === 0, scored = (ev & Ev.Goal) !== 0, good = ours ? scored : !scored;
      if (scored) { netSwish(); view.ripple = 1; view.rippleX = g.toX; view.rippleY = g.toY; }
      if (ev & Ev.Save) gloveSave();
      if (ev & Ev.Frame) { bambooKnock(); view.wobble = 1; view.wobbleSide = g.result.outcome === Outcome.Bar ? 0 : g.result.bx < 0 ? -1 : 1; }
      if (good) { crowd(true); view.cheer = 1; }
      else { if (g.result.close || !ours) crowd(false); view.cheer = -1; if (ours) { view.shake = 0.25; view.shakeSize = 0.5; } }
      setCall(current => ({ id: current.id + 1, text: kickLine(g.side, g.result, g.dive < 0 ? null : (g.dive as Zone), g.scuffed, g.early, Boolean(g.data.shooter.watch)), good }));
      setHud(hudOf(g));
    }
    if (ev & (Ev.TheirTurn | Ev.YourTurn)) { whistle(); setHud(hudOf(g)); setCall(current => ({ id: current.id + 1, text: "", good: false })); view.aim = 0; setAimMode(0); }
    if (ev & Ev.Tick) clockTick(g.shotLeft < 1);
    if (ev & Ev.Over) { setHud(hudOf(g)); finish(); }
  }

  function tick(dt: number) {
    moveView(view, dt);
    const now = performance.now();
    if (session.phase === "story") {
      story.current.clock += dt * 1000;
      if (story.current.holdAt >= 0 && now - story.current.holdAt >= HOLD_SKIP) { story.current.holdAt = -1; endStory(); }
      else if (story.current.clock >= PANEL_MS) nextPanel();
      return;
    }
    const g = game.current;
    const run = moving(session) && now >= breath.current;
    if (run) { stepGame(g, dt); trackBall(view, g); react(g); }
    // The crowd: only while the match runs on screen with sound on; a fresh loop whenever sound comes back.
    syncCrowd();
  }

  const looping = phase === "playing" || phase === "story" || (inView && !slow && (phase === "title" || phase === "over"));
  useGameLoop(tick, draw, looping);

  // The field fills the space between the HUD and the buttons; extra height becomes sky, stands and grass.
  useEffect(() => {
    const box = field.current, element = canvas.current;
    if (!box || !element) return;
    let laid = "";
    const fit = () => {
      const width = box.clientWidth, height = box.clientHeight;
      if (!width || !height || laid === `${width}×${height}`) return;
      laid = `${width}×${height}`;
      const scale = Math.min(width / W, height / H), units = height / scale, extra = Math.max(0, units - H);
      view.scale = scale; view.top = Math.min(210, extra * 0.62); view.bottom = Math.min(130, extra - view.top);
      view.width = Math.round(W * scale); view.height = Math.round((H + view.top + view.bottom) * scale);
      view.ratio = Math.min(2, window.devicePixelRatio || 1);
      element.style.width = `${view.width}px`;
      element.style.height = `${view.height}px`;
      view.context = fitCanvas(element, view.width, view.height);
      paint();
      draw();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    story.current.seen = read(INTRO_KEY) === "1";
    // Saved progress: the old ladder is moved to the new one once, then this game's own unlock is read.
    const progress = loadProgress(read(LEVELS_KEY), read(UNLOCK_KEY));
    if (progress.write) { write(LEVELS_KEY, progress.write.levels); write(UNLOCK_KEY, progress.write.unlock); }
    starsRef.current = progress.stars; setStars(progress.stars);
    unlockRef.current = progress.unlock; setUnlock(progress.unlock);
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return;
      friendRef.current = shared;
      setFriend(shared);
      chosen.current = true;
      sessionReset(session);
      deal(shared.seed, shared.level);
      sync();
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(shared);
    };
    setSite(window.location.host);
    if (!parseShared(window.location.hash)) deal(newSeed(), recommended(progress.unlock, progress.stars));
    readFriend();
    // The player pauses on blur and hide (its menu); these let go of the finger, spend the next tap, and stop the crowd.
    const blur = () => { lostFocus(session); releaseFinger(); stopCrowd(); story.current.holdAt = -1; };
    const focus = () => back(session, "focus");
    const visibility = () => { if (document.hidden) { lostFocus(session, true); releaseFinger(); stopCrowd(); pause(); } else back(session, "show"); };
    // The sound switch (the player's menu or bar): off drops the crowd at once, on brings a fresh one back at once.
    const settings = () => { if (!soundOn()) stopCrowd(); else syncCrowd(); };
    window.addEventListener("ektukhani-settings", settings);
    window.addEventListener("hashchange", readFriend);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimers();
      stopCrowd();
      window.removeEventListener("hashchange", readFriend);
      window.removeEventListener("ektukhani-settings", settings);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => { session.inView = inView; if (!inView) pause(); }, [inView]);
  useEffect(() => { game.current.slow = slow; game.current.calm = calm(); view.calm = calm(); draw(); }, [slow]);
  // Dev only: lets the Orca autopilot read the match (ai_docs/statecharts/penalty/README.md, "Live checks").
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __penalty?: unknown }).__penalty = { game: () => game.current, session, view };
  }, []);

  /** Preview images only (`&og=1` on a link): the friend's won match on its card, without playing. Saves nothing. */
  function demo(shared: Shared) {
    session.phase = "over"; session.overAt = performance.now();
    setResult({ level: shared.level, seed: shared.seed, us: shared.us, them: shared.them, stars: starsOf(shared.level, shared.us, shared.them), won: true, improved: false, sudden: false,
      goals: shared.us, shots: shared.us + shared.them, stops: 3, faced: 3, frame: 0, hardest: 92, seconds: 41 });
    setCardOpen(true);
    sync();
  }

  function doDive(zone: Zone) {
    if (dive(game.current, zone)) { sfx.tap(); setHud(hudOf(game.current)); }
  }

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], .pk-cardpanel")) return;
    if (!session.inView || session.phase === "paused") return;
    const key = event.key, enter = key === "Enter" || key === " ", g = game.current;
    if (session.picking) {
      const digit = Number(key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= PER_WORLD) {
        const number = world * PER_WORLD + digit;
        if (playable(number, unlockRef.current, starsRef.current, friendRef.current?.level)) { event.preventDefault(); choose(number); }
      } else if (key === "ArrowLeft" || key === "ArrowRight") { event.preventDefault(); setWorld(current => (current + (key === "ArrowLeft" ? 3 : 1)) % 4); }
      return;
    }
    if (session.phase === "story") {
      if (!enter && !key.startsWith("Arrow")) return;
      event.preventDefault();
      if (event.repeat) { if (story.current.holdAt < 0) story.current.holdAt = performance.now(); return; }
      nextPanel();
      return;
    }
    if (key === "p" || key === "P") { if (session.phase === "playing") { event.preventDefault(); player.requestPause(); } return; }
    if (session.phase === "title") { if (enter && !event.repeat) { event.preventDefault(); start(); } return; }
    if (session.phase === "over") {
      if (!enter) return;
      // Enter and Space belong to the game, never to the last focused button, and only from a fresh press.
      event.preventDefault();
      if (result && !cardOpen) again(nextAfter(result) || result.level, { at: event.timeStamp, repeat: event.repeat });
      return;
    }
    if (!press(session, false)) return;
    const arrow = key.startsWith("Arrow");
    if (keeping(g)) {
      const zone = key === "ArrowLeft" || key === "a" || key === "A" ? 0 : key === "ArrowRight" || key === "d" || key === "D" ? 2 : key === "ArrowDown" || key === "ArrowUp" || key === " " || key === "s" || key === "S" ? 1 : -1;
      if (zone < 0) return;
      event.preventDefault();
      if (!event.repeat) doDive(zone as Zone);
      return;
    }
    if (aiming(g) && arrow) {
      event.preventDefault();
      view.aim = 3; setAimMode(3);
      moveAim(g, g.aimX + (key === "ArrowLeft" ? -6 : key === "ArrowRight" ? 6 : 0), g.aimY + (key === "ArrowUp" ? -5 : key === "ArrowDown" ? 5 : 0));
      return;
    }
    if (enter) {
      event.preventDefault();
      if (!event.repeat && aiming(g) && pressKick(g)) { if (g.meter) { sfx.tap(); view.aim = 2; setAimMode(2); } }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    const release = (event: KeyboardEvent) => { if (event.key === " " || event.key === "Enter") story.current.holdAt = -1; };
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", release);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", release); };
  }, []);

  useEffect(() => {
    if (!cardOpen || !result?.won) return;
    let cancelled = false;
    const shared = shareOf(result);
    loadCardFonts(`পেনাল্টি কিক ম্যাচ ১২৩ রাফি ${levelOf(result.level).team.name} ${cupRound(result.level)} ${levelLabel(result.level)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [cardOpen, result, format, site, name]);

  // ---- pointer: swipe from anywhere to kick; a still tap on the goal aims there (then a tap kicks); keeping: a tap picks a third ----
  function boardPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = canvas.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / view.scale, y: (event.clientY - rect.top) / view.scale - view.top };
  }
  function addPoint(x: number, y: number, time: number) {
    if (view.count === view.xs.length) { view.xs.copyWithin(0, 1); view.ys.copyWithin(0, 1); view.ts.copyWithin(0, 1); view.count--; }
    view.xs[view.count] = x; view.ys[view.count] = y; view.ts[view.count] = time; view.count++;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    if (session.phase === "story") { story.current.holdAt = performance.now(); return; }
    if ((event.target as Element).closest("button, a, input, .pk-overlay")) return;
    // The tap that brings the window back is spent here: it never kicks or dives.
    if (!press(session)) return;
    const g = game.current, { x, y } = boardPoint(event);
    if (keeping(g)) { doDive(x < GX - GW / 3 ? 0 : x > GX + GW / 3 ? 2 : 1); return; }
    if (!aiming(g)) return;
    view.pointer = event.pointerId; view.downX = x; view.downY = y; view.moved = false; view.count = 0; view.squash = 1;
    session.finger = true;
    addPoint(x, y, event.timeStamp);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== view.pointer || !session.finger) return;
    const g = game.current, { x, y } = boardPoint(event);
    addPoint(x, y, event.timeStamp);
    if (!view.moved && Math.hypot(x - view.downX, y - view.downY) * view.scale > TAP_SLOP) view.moved = true;
    if (!view.moved || !aiming(g)) return;
    if (view.aim !== 1) { view.aim = 1; setAimMode(1); }
    const target = aimFrom(x - view.downX, y - view.downY);
    if (target) moveAim(g, toScreenX(target.x), toScreenY(target.y));
    // Live power from the last stretch of the path, so the bar shows what a release now would do.
    let from = view.count - 1;
    while (from > 0 && event.timeStamp - view.ts[from - 1] <= 120) from--;
    const span = Math.max(16, event.timeStamp - view.ts[from]);
    view.swipePower = powerFrom(Math.hypot(x - view.xs[from], y - view.ys[from]) / span);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (session.phase === "story") { const held = story.current.holdAt >= 0; story.current.holdAt = -1; if (held) nextPanel(); return; }
    if (event.pointerId !== view.pointer) return;
    view.pointer = -1;
    const fingerWasDown = session.finger;
    session.finger = false;
    const g = game.current;
    if (!fingerWasDown || !aiming(g)) return;
    const { x, y } = boardPoint(event);
    if (!view.moved) {
      if (!g.meter && y < GY + 14 && y > GTOP - 36) moveAim(g, x, y);
      if (pressKick(g) && g.meter) { sfx.tap(); view.aim = 2; setAimMode(2); }
      return;
    }
    addPoint(x, y, event.timeStamp);
    const shot = swipeShot(view.xs, view.ys, view.ts, view.count);
    view.count = 0;
    if (!shot) { view.aim = 0; setAimMode(0); setCall(current => ({ id: current.id + 1, text: "গোলের দিকে, মানে ওপরের দিকে টেনে ছাড়ো।", good: false })); return; }
    shoot(g, shot);
  }
  function tapButton() {
    const g = game.current;
    if (!press(session, false) || !aiming(g)) return;
    if (pressKick(g) && g.meter) { sfx.tap(); view.aim = 2; setAimMode(2); }
  }
  /** A game button: act, then give the focus back so Enter and Space reach the game. */
  const act = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  const sideButton = (zone: Zone) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary && press(session, false)) doDive(zone); },
    onClick: (event: { detail: number; currentTarget: HTMLButtonElement }) => { if (event.detail === 0 && press(session, false)) doDive(zone); event.currentTarget.blur(); },
  });

  function shareOf(done: Result): Shared {
    return { level: done.level, seed: done.seed, us: done.us, them: done.them, name };
  }

  const data = levelOf(level), team = data.team, drill = data.format !== "shootout";
  const allStars = totalStars(stars), suggest = recommended(unlock, stars);
  const over = phase === "over" && result;
  const nextLevel = nextAfter(result);
  const shared = result?.won ? shareOf(result) : null;
  const state = shared ? sharedHash(shared) : "";
  const rival = friend && friend.level === level ? friend : null;
  const keepingNow = hud.side === 1 && (hud.stage === Stage.Ready || hud.stage === Stage.Run);
  const aimingNow = hud.side === 0 && hud.stage === Stage.Aim;
  const first = hud.ours.length + hud.theirs.length === 0;

  function say() {
    if (call.text) return call.text;
    if (keepingNow) {
      if (first || level === 2) return "শুটার যেদিকে ঝোঁকে, মারার আগে সেদিকে চাপো।";
      if (data.shooter.watch) return "ও তোমাকে দেখছে। ঝোঁক দেখার আগে নড়ো না।";
      if (data.shooter.honest < 1) return "কাঁধ ধোঁকা দিতে পারে। শেষে পায়ের পাতা দেখো।";
      return hud.dive < 0 ? "মারার আগে একদিকে চাপো: বাঁয়ে, মাঝে বা ডানে।" : "ঠিক আছে। মারার আগ পর্যন্ত বদলাতে পারো।";
    }
    if (aimingNow) {
      if (aimMode === 1) return "ছেড়ে দিলেই শট। শেষে জোরে টানলে জোরে যাবে।";
      if (aimMode === 2) return "জোর ওঠানামা করছে, আবার চাপো। লাল দাগে বল ওপরে ওঠে।";
      if (aimMode === 3) return "তীর দিয়ে জায়গা ঠিক করো। Enter চাপলে জোরের দাগ।";
      if (first) return data.teach;
      if (data.wind) return "পতাকা দেখো, বাতাস বুঝে মারো।";
      if (data.clock) return "ঘড়ি চলছে। ৫ সেকেন্ডের মধ্যে মারো।";
      if (data.keeper.tall) return "লম্বা কিপার। একদম কোণে, জোরে মারো।";
      if (data.keeper.tell) return "কিপার যেদিকে হেলে, তার উল্টো কোণে মারো।";
      return "টেনে ছাড়ো, নয়তো গোলের যেখানে মারবে সেখানে চাপো।";
    }
    return "…";
  }

  const usLabel = drill ? (data.format === "shots" ? "গোল" : "ঠেকানো") : US.name;
  const scoreText = data.format === "shots" ? `${bn(hud.goals)}/${bn(data.kicks)}` : data.format === "saves" ? `${bn(hud.theirs.filter(mark => !mark).length)}/${bn(data.kicks)}` : score(hud.goals, hud.conceded);

  return (
    <div className="pk" ref={root} data-slow={slow || undefined} data-phase={phase} data-palette={paletteFor(level).name}>
      <div className="pk-hud" aria-hidden={phase === "title" || undefined}>
        <p className="pk-badge"><b>{bn(level)}</b><span>{data.finale ? "ফাইনাল · " : ""}{data.name}</span></p>
        <div className="pk-score" role="group" aria-label={drill ? `${usLabel} ${scoreText}` : `স্কোর: আমরা ${bn(hud.goals)}, ${team.name} ${bn(hud.conceded)}`}>
          {data.format !== "saves" && <Dots marks={hud.ours} slots={data.kicks} />}
          <strong>{scoreText}</strong>
          {data.format !== "shots" && <Dots marks={hud.theirs.map(mark => drill ? 1 - mark : mark)} slots={data.kicks} />}
          {hud.sudden && phase === "playing" && <em className="pk-sudden">সাডেন ডেথ</em>}
        </div>
      </div>

      <div className="pk-field" ref={field} data-danger={(hud.danger && phase === "playing") || undefined} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={releaseFinger}>
        <canvas ref={canvas} role="img" aria-label={`${WORLDS[worldOf(level)].place}, গোলপোস্ট। ${keepingNow ? "ওদের শট, তুমি কিপার।" : "তোমার শট।"} ${drill ? `${usLabel} ${scoreText}` : `স্কোর ${score(hud.goals, hud.conceded)}`}।`} />
        {over && (
          <div className="pk-slip" role="group" aria-labelledby="pk-over-title">
            <h2 id="pk-over-title">{result.won ? (data.finale ? `${WORLDS[worldOf(result.level)].name} আমাদের!` : "জিতে গেলে!") : `${team.name} জিতল`}</h2>
            {result.won && <StarReveal count={result.stars} />}
            <p className="pk-big">{data.format === "shootout" ? <><CountUp value={result.us} />–<CountUp value={result.them} /></> : <><CountUp value={result.us} />/{bn(data.kicks)}</>}</p>
            <dl className="pk-stats">
              {data.format !== "saves" && <div><dt>তোমার গোল</dt><dd><CountUp value={result.goals} />/{bn(result.shots)}</dd></div>}
              {data.format !== "shots" && <div><dt>ঠেকানো</dt><dd><CountUp value={result.stops} />/{bn(result.faced)}</dd></div>}
              {data.format !== "saves" && <div><dt>সবচেয়ে জোরে</dt><dd><CountUp value={result.hardest} suffix="%" /></dd></div>}
              {result.frame > 0 && <div><dt>বাঁশে লেগেছে</dt><dd><CountUp value={result.frame} /></dd></div>}
            </dl>
            <p className="pk-line">{result.won ? clearLine(result.level) : lossLine(result.level, result.us, result.them, result.sudden, result.frame)}</p>
            {result.won && (rival ? <p className="pk-versus">{compareLine(result.level, result, rival)}</p>
              : result.improved ? <p className="pk-miss">এই ম্যাচে নতুন রেকর্ড, {bn(result.stars)} তারা!</p>
              : nearMissLine(result.level, result.us, result.them) && <p className="pk-miss">{nearMissLine(result.level, result.us, result.them)}</p>)}
            {!result.won && rival && <p className="pk-versus">{rival.name || "বন্ধু"} এই ম্যাচ জিতেছিল। একই কিপার, একই শট।</p>}
            <div className="pk-slip-links">
              {result.won && <button type="button" className="kit-link" onClick={act(() => { sfx.tap(); setCardOpen(true); })}>কার্ড বানাও, বন্ধুকে পাঠাও</button>}
              <button type="button" className="kit-link" onClick={act(() => openPicker(true))}>সব ম্যাচ</button>
            </div>
          </div>
        )}
      </div>

      <p className="pk-call" data-good={call.text ? call.good : undefined} key={call.id} aria-live="polite">{phase === "playing" || phase === "paused" ? say() : " "}</p>

      <div className="pk-controls">
        {over ? (
          nextLevel ? <>
            <button type="button" className="kit-secondary pk-again" onClick={act(() => again(result.level))} disabled={!ready}>আবার খেলো</button>
            <button type="button" className="kit-primary pk-again" onClick={act(() => again(nextLevel))} disabled={!ready}>পরের ম্যাচ</button>
          </> : <button type="button" className="kit-primary pk-again pk-wide" onClick={act(() => again(result.level))} disabled={!ready}>আবার খেলো</button>
        ) : keepingNow ? (
          <div className="pk-sides" role="group" aria-label="কোন দিকে ঝাঁপ দেবে">
            {([[0, "বাঁয়ে"], [1, "মাঝে"], [2, "ডানে"]] as const).map(([zone, label]) => (
              <button key={zone} type="button" aria-pressed={hud.dive === zone} {...sideButton(zone)}>
                {zone === 0 && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>}{label}{zone === 2 && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="pk-tap" data-armed={aimMode === 2 || undefined} disabled={!aimingNow || phase !== "playing"} onClick={act(tapButton)}>{aimMode === 2 ? "মারো" : "জোর ঠিক করো"}</button>
        )}
      </div>

      {phase === "title" && !picking && (
        <div className="pk-title pk-overlay">
          {friend && (
            <section className="pk-friend" aria-labelledby="pk-friend-title">
              <h2 id="pk-friend-title">{feat(friend)}।</h2>
              <p>{bannerNote(friend.name)}</p>
            </section>
          )}
          <button type="button" className="pk-start" onClick={act(start)} disabled={!inView}>
            <Art className="pk-start-art" draw={drawStartArt} label="চকের দাগে বল, পেছনে বাঁশের গোলপোস্ট" />
            <span>খেলো</span>
          </button>
          <button type="button" className="pk-chip" onClick={act(() => openPicker(true))}>{data.finale ? "ফাইনাল · " : ""}{levelLabel(level)}</button>
          <p className="pk-teach"><b>{cupRound(level)} · {team.name}।</b> {data.teach}</p>
          {slow && <p className="pk-note">ধীরে খেলো চালু: সব একটু ধীরে চলে, তারার নিয়ম একই।</p>}
          <button type="button" className="kit-link pk-all" onClick={act(() => openPicker(true))}>সব ম্যাচ · ★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</button>
        </div>
      )}

      {phase === "story" && (
        <div className="pk-story pk-overlay" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { story.current.holdAt = -1; }} aria-live="polite">
          <Art className="pk-panel" draw={(element, width, height) => drawStoryPanel(element, width, height, panel)} label={STORY[panel]} />
          <p key={panel} className="pk-caption">{STORY[panel]}</p>
          <p className="pk-steps" aria-hidden="true">{STORY.map((line, index) => <i key={line} data-on={index <= panel || undefined} />)}</p>
          <p className="pk-skip">চেপে ধরো: বাদ দাও</p>
        </div>
      )}

      {picking && (
        <div className="pk-overlay pk-picker-wrap">
          <Picker world={world} setWorld={setWorld} level={level} unlock={unlock} stars={stars} friendLevel={friend?.level ?? 0} suggest={suggest} total={allStars} onPick={choose} onClose={() => openPicker(false)} />
        </div>
      )}

      {cardOpen && shared && result && (
        <div className="pk-cardpanel pk-overlay" role="dialog" aria-modal="false" aria-labelledby="pk-result-title">
          <div className="pk-cardpanel-head">
            <h2 id="pk-result-title">{drill ? <><em>{bn(result.us)}/{bn(data.kicks)}</em>, {possessive(team.name)} বিপক্ষে</> : <><em>{score(result.us, result.them)}</em> গোলে {team.name}কে হারালে</>}</h2>
            <button type="button" className="kit-secondary" onClick={() => setCardOpen(false)}>ফিরে যাও</button>
          </div>
          <p className="pk-cardpanel-line">{rival ? compareLine(result.level, result, rival) : humanLine(shared)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`পেনাল্টি কিকের কার্ড: ${cupRound(result.level)}, ${feat(shared)}, ${bn(result.stars)} তারা।`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="pk-share">
            <label className="pk-name">
              <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`penalty-match-${result.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
              hint="বন্ধু লিংক খুললে একই কিপার আর একই শট পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
          </div>
        </div>
      )}

      <p className="pk-sr" aria-live="polite">{over && result ? `খেলা শেষ। ${result.won ? `জিতলে, ${bn(result.stars)} তারা।` : "হেরে গেলে।"}` : ""}</p>
    </div>
  );
}
