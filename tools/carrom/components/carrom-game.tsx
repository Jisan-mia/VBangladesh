"use client";
// IP: what we avoided — no "Carrom Pool"-style name, menus, coin shop, glossy 3D pieces or neon board; the boards (walnut and
// honey teak, a stall-blue frame, tournament maple with gold), the alpona rosette and the flat discs are drawn fresh.
// The rules, the session and what the phone keeps are pure (lib/game.ts, lib/session.ts, lib/save.ts); the physics and the
// drawing run allocation-free (lib/*.hot.ts). This file feeds them touches, keys and time, and plays the sounds.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, fitCanvas, newSeed, sfx, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { accentOf, LOOKS, paintBoard, paintDisc, type DiscKind } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { plansAll, plansHere, type Plan } from "../lib/aim";
import { drawFrame, POP_TIME } from "../lib/draw.hot";
import {
  angleTo, duoPoints, fire, levelStars, needsQueen, newBoard, newDuo, newLevel, onBoard, placeStriker, settle, soloPoints, strikesLeft, whites,
  MIN_POWER, STRIKES, type Game, type Hand, type Mode, type Side,
} from "../lib/game";
import { SNAP } from "../lib/guide";
import { isFinale, LEVEL_COUNT, LEVELS, OLD_BOARDS } from "../lib/levels";
import {
  bn, caption, compareLine, compareStrikes, duoLine, humanLine, levelLabel, levelLine, noteText, oldBoardStars, parseShared, piecesLine, playerName,
  pointsNear, sharedHash, strikesNear, SIDE_NAME, SIDE_OF, type Shared,
} from "../lib/link";
import { HAND_KEY, OLD_ASSIST_KEY, OLD_BEST_KEY, OLD_BIG_KEY, OPEN_KEY, migrateBest, openAfter, playable, readHand, readOpen, recommended } from "../lib/save";
import * as S from "../lib/session";
import { advance, meter, turnBetween } from "../lib/tick.hot";
import { AIM_MAX, BASE_MAX, BASE_MIN, BIG_STRIKER_R, COUNT, PER_SIDE, QUEEN, STRIKER, TOTAL } from "../lib/table";
import { makeView } from "../lib/view";
import * as sound from "./sound";
import { StartCard } from "./start-card";
import { LevelSheet } from "./level-sheet";
import { Finish, type FinishStat } from "./finish";

const TOOL = "carrom";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/** A finger must move this far (px) before a touch becomes a pull or a slide; less is a tap that aims. */
const TAP_SLOP = 8;
/** The first stretch of a pull only sets power; after it, turning the finger turns the line at this share of the rate. */
const DEAD = 22;
const TURN_GAIN = 0.35;
/** A press on মারো shorter than this is a tap (the ring's power); longer swings the meter. */
const TAP_MS = 180;
/** A breath after resuming before the discs roll on. */
const BREATH = 0.3;
const KINDS: DiscKind[] = ["white", "black", "queen", "striker"];
const SPRITE_PAD = 1.25;
const deg = Math.PI / 180;

type Hint = "pulling" | "cancel" | "blocked" | null;
const HINTS: Record<Exclude<Hint, null>, string> = {
  pulling: "ছাড়লেই টোকা। আঙুল ফিরিয়ে আনলে বাতিল।",
  cancel: "টোকা বাতিল। আরেকটু বেশি টেনে ছাড়ো।",
  blocked: "এখানে গুটি আছে, স্ট্রাইকারটা একটু সরাও",
};

type Result = {
  shared: Shared;
  stars: number;
  cleared: boolean;
  record: boolean;
  before: number | null;
  firstClear: boolean;
  stats: FinishStat[];
  left: number;
  at: number;
};

export function CarromGame() {
  const [, setFrame] = useState(0);
  const sync = () => setFrame(count => count + 1);
  const [view] = useState(makeView);
  const [session] = useState(S.createSession);
  const game = useRef<Game>(newLevel(1, "n"));
  const [hint, setHintState] = useState<Hint>(null);
  const hintRef = useRef<Hint>(null);
  const setHint = (next: Hint) => { if (hintRef.current !== next) { hintRef.current = next; setHintState(next); } };
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [visit, setVisit] = useState(0);
  const [open, setOpen] = useState(1);
  const [hand, setHandState] = useState<Hand>("n");
  const [oldBoard, setOldBoard] = useState(0);
  const [slow] = useSlowMode();
  const [name, setName] = useState("");
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [boardSize, setBoardSize] = useState(0);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const g0 = game.current;
  const [bestStrikes, submitStrikes] = useBest(`${TOOL}-c${g0.level || 1}`, false);
  const [bestPoints, submitPoints] = useBest(oldBoard ? `${TOOL}-${oldBoard}` : TOOL);

  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const boardBox = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const lines = useRef<Plan[]>([]);
  const hum = useRef(sound.makeHum());
  const booted = useRef(false);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const openRef = useRef(1);
  openRef.current = open;
  const resumeAt = useRef(0);
  const gesture = useRef({ id: -1, startX: 0, startY: 0, mode: 0, onStriker: false, u0: 0 });
  const press = useRef({ at: 0, button: false });
  /** The first strike of a board with a locked aim keeps it until you tap elsewhere. */
  const locked = useRef(false);
  const inView = useInView(root);
  view.calm = slow;

  function later(run: () => void, ms: number) { timers.current.push(window.setTimeout(run, ms)); }
  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  const card: Shared | null = result
    ? result.shared.mode === "duo"
      ? { ...result.shared, name: names[result.shared.winner], other: names[1 - result.shared.winner] }
      : { ...result.shared, name }
    : null;
  const state = card ? sharedHash(card) : "";

  // ---- aiming helpers ----

  /** The pot lines from where the striker sits now: the snap's targets and সহজ's suggestion. Recomputed when the striker moves or the board settles. */
  function refreshLines() {
    const g = game.current;
    lines.current = g.phase === "aim" ? plansHere(g) : [];
    view.blocked = g.phase === "aim" && !strikerFreeNow();
    applyAim(view.aim);
  }
  function strikerFreeNow() {
    const g = game.current, w = g.world;
    for (let j = 0; j < STRIKER; j++) {
      if (!w.on[j]) continue;
      const dx = w.x[j] - w.x[STRIKER], dy = w.y[j] - w.y[STRIKER], rr = w.r[j] + w.r[STRIKER];
      if (dx * dx + dy * dy < rr * rr) return false;
    }
    return true;
  }
  /** Sets the aim from a raw angle: snapped to a pot line when it's within the difficulty's window. */
  function applyAim(raw: number) {
    const angle = Math.max(-AIM_MAX, Math.min(AIM_MAX, raw)), window = SNAP[game.current.hand] * deg;
    let best: Plan | null = null, gap = window;
    for (const line of lines.current) { const d = Math.abs(line.angle - angle); if (d < gap) { gap = d; best = line; } }
    if (best && view.aim !== best.angle && Math.abs(view.aim - best.angle) > 1e-9 && view.pulling) sfx.tick();
    view.aim = best ? best.angle : angle;
    if (best) { view.lo = best.least; view.hi = best.ceiling < 1 ? best.ceiling : 0; if (!view.pulling && !view.charging) view.restPower = best.power; }
    else { view.lo = 0; view.hi = 0; }
  }
  /** সহজ aims each new strike at the easiest pot from where the striker sits; a board's first strike may come aimed. */
  function startAim() {
    const g = game.current, spec = g.spec;
    // The opening break goes in hard: a tap on মারো breaks the pack at near full power.
    if (g.strikes === 0 && spec?.aim) { view.aim = angleTo(g, spec.aim[0], spec.aim[1]); if (spec.pattern) view.restPower = 0.95; refreshLines(); return; }
    if (g.hand === "e" && lines.current.length) { view.aim = lines.current[0].angle; view.restPower = lines.current[0].power; }
    applyAim(view.aim);
  }

  // ---- boards ----

  function letGo() {
    view.pulling = view.charging = false;
    view.power = 0;
    view.turnDir = 0;
    gesture.current.id = -1;
    hum.current.stop();
  }

  /** Puts a fresh game on the start card. */
  function load(next: Game, oldNumber = 0) {
    clearTimers();
    letGo();
    game.current = next;
    S.reset(session);
    setOldBoard(oldNumber);
    setResult(null);
    setHint(null);
    view.flip = false;
    view.aim = 0;
    view.restPower = 0.5;
    view.fallAt.fill(-10);
    view.popAt.fill(-10);
    view.seen = 0;
    view.simCarry = 0;
    view.hand = next.hand;
    locked.current = Boolean(next.spec?.lockAim);
    repaint();
    refreshLines();
    startAim();
    sync();
  }
  const freshOf = (mode: Mode, level: number, h: Hand) => mode === "level" ? newLevel(level, h) : mode === "board" ? newBoard(newSeed(), h) : newDuo(newSeed(), h);
  function goToLevel(level: number) {
    if (!playable(level, openRef.current, visit)) return;
    load(newLevel(level, hand));
  }
  function setMode(mode: Mode) {
    if (session.phase !== "title" && session.phase !== "over") return;
    sfx.tap();
    const g = game.current;
    load(freshOf(mode, g.mode === "level" ? g.level : recommended(levels.stars, openRef.current), hand));
  }
  function setHand(next: Hand) {
    if (session.phase !== "title") return;
    setHandState(next);
    write(HAND_KEY, next);
    sfx.tap();
    const g = game.current;
    load(g.mode === "level" ? newLevel(g.level, next) : g.mode === "board" ? newBoard(g.seed, next) : newDuo(g.seed, next), oldBoard);
  }

  function start() {
    if (!S.start(session)) return;
    sound.setDown();
    refreshLines();
    sync();
  }
  /** আবার খেলো: the same board, straight into play. */
  function again() {
    const g = game.current;
    const next = g.mode === "level" ? newLevel(g.level, g.hand) : g.mode === "board" ? newBoard(oldBoard || friendHere(g) ? g.seed : newSeed(), g.hand) : newDuo(newSeed(), g.hand);
    load(next, oldBoard);
    S.start(session);
    sync();
  }
  const friendHere = (g: Game) => Boolean(friend && friend.mode === "solo" && friend.seed === g.seed && g.mode === "board");
  /** পরের বোর্ড: the next board's start card, so its one new thing is read before play. */
  function nextBoard() {
    const g = game.current;
    if (g.mode !== "level" || g.level >= LEVEL_COUNT || !playable(g.level + 1, openRef.current, visit)) return;
    load(newLevel(g.level + 1, g.hand));
  }

  // ---- pause, away, the sheet ----

  function pauseAway() { if (S.pause(session, "away")) { letGo(); sync(); } else letGo(); }
  function resumeAway() { if (S.resume(session, "away")) { resumeAt.current = view.clock + BREATH; sync(); } }
  const player = useGamePlayer({ onPause: pauseAway, onResume: resumeAway, onRestart: () => load(freshOf(game.current.mode, game.current.level || 1, hand), oldBoard) });

  function openSheet() { S.openSheet(session); letGo(); sync(); }
  function closeSheet() { S.closeSheet(session); resumeAt.current = view.clock + BREATH; sync(); }

  useEffect(() => {
    const blur = () => { S.away(session, "blur"); letGo(); sync(); };
    const focus = () => { S.back(session, "focus"); sync(); };
    const visibility = () => { if (document.hidden) { S.away(session, "hide"); letGo(); } else S.back(session, "show"); sync(); };
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimers();
      hum.current.stop();
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  // The stage scrolled off: whatever was held is let go and play pauses (the hum can't drone off screen).
  useEffect(() => {
    if (inView) { S.back(session, "scroll"); sync(); return; }
    S.away(session, "scroll");
    letGo();
    sync();
  }, [inView]);

  // ---- the strike ----

  function strike(power: number) {
    const g = game.current;
    letGo();
    if (!S.live(session) || g.phase !== "aim") return;
    if (power < MIN_POWER) { setHint("cancel"); sync(); return; }
    const fired = fire(g, view.aim, power);
    if (fired === "blocked") { setHint("blocked"); sound.foul(); view.shakeAt = view.clock; sync(); return; }
    if (fired !== "ok") return;
    sound.click();
    view.restPower = power;
    view.seen = 0;
    view.pots = 0;
    view.simCarry = 0;
    locked.current = false;
    setHint(null);
    sync();
  }

  function afterShot() {
    const g = game.current, before = g.turn, queenBefore = g.queen;
    const note = settle(g);
    if (note === "cover" || (g.mode === "level" && g.queen === "covered" && queenBefore !== "covered")) sound.covered();
    if (note === "foul") { sound.foul(); view.shakeAt = view.clock; if (!slowRef.current) buzz([20, 30, 20]); }
    if (note === "black") view.shakeAt = view.clock;
    if (g.phase === "over") { finish(); return; }
    if (g.mode === "duo" && g.turn !== before) { sfx.pick(); view.flip = g.turn === 1; view.aim = 0; }
    refreshLines();
    startAim();
    sync();
  }

  function finish() {
    const g = game.current, now = performance.now();
    if (!S.finish(session, now)) return;
    letGo();
    const run = session.run;
    let shared: Shared, stars = 0, record = false, before: number | null = null, firstClear = false, stats: FinishStat[] = [];
    if (g.mode === "level") {
      stars = levelStars(g);
      firstClear = g.cleared && !levels.stars[g.level];
      if (stars) {
        levels.record(g.level, stars);
        const opened = openAfter(openRef.current, g.level);
        if (opened !== openRef.current) { setOpen(opened); write(OPEN_KEY, String(opened)); }
        before = bestStrikes;
        record = submitStrikes(g.strikes) && before !== null;
      }
      shared = { mode: "level", level: g.level, seed: g.seed, strikes: g.strikes, name: "", hand: g.hand };
      stats = [{ label: "চাল", value: g.strikes }, { label: "গুটি", value: whites(g).inside }, { label: "এক টোকায়", value: g.stats.most }, { label: "ফাউল", value: g.stats.fouls }];
    } else if (g.mode === "board") {
      const points = soloPoints(g.world);
      before = bestPoints;
      record = submitPoints(points) && before !== null;
      stars = oldBoard ? oldBoardStars(points, oldBoard) : 0;
      shared = { mode: "solo", seed: g.seed, points, queen: !g.world.on[QUEEN], name: "", ...(oldBoard ? { level: oldBoard } : {}) };
      stats = [{ label: "পয়েন্ট", value: points }, { label: "গুটি", value: g.stats.pieces }, { label: "এক টোকায়", value: g.stats.most }, { label: "ফাউল", value: g.stats.fouls }];
    } else {
      const winner = (g.winner === -1 ? 0 : g.winner) as Side;
      shared = { mode: "duo", seed: g.seed, points: duoPoints(g), queen: g.queen === "covered" && g.queenBy === winner, winner, name: "", other: "" };
      stats = [{ label: "পয়েন্ট", value: duoPoints(g) }, { label: "চাল", value: g.strikes }, { label: "ফাউল", value: g.stats.fouls }];
    }
    const left = g.mode === "level" ? Math.max(0, whites(g).need - whites(g).inside) + (needsQueen(g) && g.queen !== "covered" ? 1 : 0) : 0;
    setResult({ shared, stars, cleared: g.mode === "level" ? g.cleared : true, record, before, firstClear, stats, left, at: now });
    // The stars chime in one by one; the fanfare follows them, confetti for three stars, a new best or a world's finale.
    const after = (stars + 1) * 260, big = stars === 3 || record || (firstClear && isFinale(g.level)) || g.mode === "duo";
    if (g.mode === "level" && !g.cleared) sfx.lose();
    else later(() => {
      if (!S.cheerMayPlay(session, run)) return;
      if (big) { sfx.levelUp(); if (!slowRef.current) confetti(); } else sfx.good();
    }, after);
    sync();
  }

  // ---- the loop ----

  function tick(dt: number) {
    view.clock += dt;
    const g = game.current;
    if (!S.live(session)) { hum.current.update(false, 0); return; }
    if (g.phase === "aim") {
      if (view.turnDir) applyAim(view.aim + view.turnDir * (slowRef.current ? 3 : 6) * deg * dt);
      if (view.charging) view.power = meter(view, slowRef.current);
      hum.current.update(S.humWanted(session, true, view.power), view.power);
      return;
    }
    hum.current.update(false, 0);
    if (g.phase !== "moving" || view.clock < resumeAt.current) return;
    const w = g.world;
    advance(view, w, dt, slowRef.current);
    // At most one clack and one cushion thump per ~50 ms, however many discs touch.
    if (w.clack > 60 && view.clock - view.lastClack > 0.045) { sound.clack(Math.min(1, w.clack / 2000)); view.lastClack = view.clock; }
    if (w.bump > 150 && view.clock - view.lastBump > 0.06) { sound.cushion(Math.min(1, w.bump / 2500)); view.lastBump = view.clock; }
    if (w.clack > 2600 && !slowRef.current) view.shakeAt = view.clock - 0.14;
    w.clack = w.bump = 0;
    while (view.seen < w.sunkCount) {
      const i = w.sunk[view.seen++], p = w.pocket[i];
      view.fallAt[i] = view.clock;
      view.popAt[p] = view.clock;
      view.popKind[p] = i === STRIKER ? 2 : i === QUEEN ? (g.mode === "board" ? 1 : 3) : i >= PER_SIDE && g.mode === "level" ? 4 : 0;
      if (i === STRIKER) continue;
      sound.toop(view.pots++);
      if (i === QUEEN) sound.queen();
      if (!slowRef.current) buzz(10);
    }
    if (!w.moving) afterShot();
  }
  function draw() {
    const g = game.current;
    view.aiming = session.phase === "playing" && g.phase === "aim";
    view.demo = view.aiming && g.strikes === 0 && g.level === 1 && g.mode === "level" && !view.pulling && !view.charging;
    drawFrame(view, g);
  }
  const celebrating = Boolean(result) && performance.now() - (result?.at ?? 0) < POP_TIME * 1000 + 200;
  useGameLoop(tick, draw, session.phase === "playing" || celebrating);

  // ---- layout: the board is the biggest square the field allows, repainted crisp at DPR 2 ----

  function repaint() {
    const size = view.size, world = game.current.spec?.world ?? 0;
    if (!size) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = view.scale * ratio;
    const background = view.background ??= document.createElement("canvas");
    background.width = Math.round(TOTAL * k); background.height = Math.round(TOTAL * k);
    const b = background.getContext("2d")!;
    b.setTransform(k, 0, 0, k, 0, 0);
    paintBoard(b, LOOKS[world]);
    view.painted = world;
    const side = Math.ceil(BIG_STRIKER_R * SPRITE_PAD * 2 * k), unit = BIG_STRIKER_R * SPRITE_PAD * 2;
    KINDS.forEach((kind, index) => {
      const sprite = view.sprites[index] ??= document.createElement("canvas");
      sprite.width = sprite.height = side;
      const c = sprite.getContext("2d")!;
      c.setTransform(side / unit, 0, 0, side / unit, 0, 0);
      c.clearRect(0, 0, unit, unit);
      paintDisc(c, kind, unit / 2, unit / 2, BIG_STRIKER_R);
    });
    draw();
  }
  useEffect(() => {
    const box = field.current, element = canvas.current;
    if (!box || !element) return;
    let laid = 0;
    const fit = () => {
      const size = Math.floor(Math.min(box.clientWidth, box.clientHeight || box.clientWidth, 640));
      if (!size || size === laid) return;
      laid = size;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      view.size = size;
      view.scale = size / TOTAL;
      view.context = fitCanvas(element, size, size);
      setBoardSize(size);
      repaint();
    };
    fit();
    loadCardFonts("কুইন! ফাউল! কালো! +১ +৩").then(() => draw()).catch(() => {});
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // ---- boot: your own open boards (migrated once), the difficulty (migrated once), then a friend's link or your board ----
  useEffect(() => {
    if (!levels.loaded || booted.current) return;
    booted.current = true;
    let stars = levels.stars;
    const moved = migrateBest(stars, read(OLD_BEST_KEY));
    if (moved) { levels.record(1, moved); stars = { 1: moved }; }
    const mine = readOpen(read(OPEN_KEY), stars);
    if (mine.migrated) write(OPEN_KEY, String(mine.open));
    setOpen(mine.open);
    openRef.current = mine.open;
    const chosen = readHand(read(HAND_KEY), read(OLD_ASSIST_KEY), read(OLD_BIG_KEY));
    if (chosen.migrated) write(HAND_KEY, chosen.hand);
    setHandState(chosen.hand);
    setSite(window.location.host);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      if (got.mode === "level") { setVisit(got.level); load(newLevel(got.level, chosen.hand)); }
      else if (got.mode === "solo") load(newBoard(got.seed, chosen.hand), got.level ?? 0);
      else load(newDuo(newSeed(), chosen.hand));
      return true;
    };
    if (!fromHash()) load(newLevel(recommended(stars, mine.open), chosen.hand));
    const onHash = () => { fromHash(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow]);
  // Dev only: lets the Orca autopilot read the board and the pots (ai_docs/statecharts/carrom/README.md, "Live checks").
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __carrom: unknown }).__carrom = {
      game, session, view, scale: () => view.scale,
      plans: () => plansHere(game.current),
      best: () => plansAll(game.current, 16)[0] ?? null,
      /** Put the striker and the line where a plan says, the way a player would with the strip and the pull. */
      aimAt: (plan: Plan) => { moveStriker(plan.u); applyAim(plan.angle); view.restPower = plan.power; sync(); },
    };
  }, []);

  // ---- cards ----
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ক্যারম বোর্ড ১০ চালে ৭ পয়েন্ট সাফ জিতল").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws; the phase brings the friend's canvas back with the start card.
  }, [state, format, site, friend, session.phase]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest(".gp-stage");
    const behavior = slow ? "auto" as const : "smooth" as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: "start" });
  }

  // ---- input: pull back anywhere on the board; slide the striker itself sideways; a still tap aims at that spot ----
  const capture = (event: ReactPointerEvent<HTMLElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ } };
  /** Screen px → board mm, through the turned board for the top player. */
  function toBoard(clientX: number, clientY: number) {
    const box = canvas.current!.getBoundingClientRect();
    let x = (clientX - box.left) / view.scale - 52, y = (clientY - box.top) / view.scale - 52;
    if (view.flip) { x = 740 - x; y = 740 - y; }
    return { x, y };
  }

  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    const g = game.current;
    if (event.button > 0 || gesture.current.id !== -1 || session.hold !== "none") return;
    if (!S.live(session) || g.phase !== "aim") return;
    const at = toBoard(event.clientX, event.clientY), w = g.world;
    const near = Math.hypot(at.x - w.x[STRIKER], at.y - w.y[STRIKER]) * view.scale < Math.max(28, w.r[STRIKER] * view.scale + 16);
    Object.assign(gesture.current, { id: event.pointerId, startX: event.clientX, startY: event.clientY, mode: 0, onStriker: near, u0: g.u });
    view.aimFrom = view.aim;
    view.refSet = false;
    capture(event);
    // A touch answers at once (and wakes the audio for the pull's hum).
    sfx.tick();
  }
  function onBoardMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gst = gesture.current;
    if (event.pointerId !== gst.id) return;
    const px = gst.startX - event.clientX, py = gst.startY - event.clientY, length = Math.hypot(px, py);
    if (gst.mode === 0) {
      if (length < TAP_SLOP) return;
      gst.mode = gst.onStriker && Math.abs(px) > Math.abs(py) * 1.2 ? 2 : 1;
      if (gst.mode === 1) { if (!S.hold(session, "pull")) { gst.id = -1; return; } view.pulling = true; setHint("pulling"); }
    }
    if (gst.mode === 2) {
      const next = gst.u0 - px / (view.scale * (BASE_MAX - BASE_MIN));
      moveStriker(next);
      return;
    }
    // The pull: its length is the power; once past the first stretch, turning it turns the line, slowly.
    view.power = Math.min(1, length / Math.max(90, view.size * 0.36));
    if (locked.current) return;
    if (!view.refSet && length >= DEAD) { view.refX = px; view.refY = py; view.refSet = true; }
    if (view.refSet) applyAim(view.aimFrom + TURN_GAIN * turnBetween(view.refX, view.refY, px, py));
  }
  function onBoardUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gst = gesture.current;
    if (event.pointerId !== gst.id) return;
    gst.id = -1;
    if (gst.mode === 1) { const power = view.power; if (S.release(session, "pull")) strike(power); else letGo(); return; }
    if (gst.mode === 0) {
      const g = game.current, at = toBoard(event.clientX, event.clientY);
      const ahead = (at.y - g.world.y[STRIKER]) * (g.mode === "duo" && g.turn === 1 ? -1 : 1);
      if (ahead < -8) { locked.current = false; applyAim(angleTo(g, at.x, at.y)); sfx.tick(); }
    }
    sync();
  }
  function onBoardCancel() { gesture.current.id = -1; S.cancel(session); letGo(); setHint(null); }

  function moveStriker(next: number) {
    const g = game.current;
    if (g.phase !== "aim" || !S.live(session)) return;
    view.blocked = !placeStriker(g, next);
    if (Math.abs(g.u - view.tickU) > 0.04) { sfx.tick(); view.tickU = g.u; }
    if (hintRef.current === "blocked" && !view.blocked) setHint(null);
    refreshLines();
    if (g.hand === "e" && lines.current.length) { view.aim = lines.current[0].angle; view.restPower = lines.current[0].power; }
    sync();
  }

  // মারো: a tap strikes at the ring's power; a hold swings the meter and the release strikes.
  function onShootDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button > 0 || game.current.phase !== "aim" || !S.hold(session, "button")) return;
    capture(event);
    sfx.tap();
    press.current = { at: performance.now(), button: true };
    view.chargeAt = view.clock + TAP_MS / 1000;
    later(() => { if (session.hold === "button") { view.charging = true; sync(); } }, TAP_MS);
    sync();
  }
  function onShootUp() {
    const held = performance.now() - press.current.at, power = view.charging ? view.power : view.restPower;
    if (S.release(session, "button")) strike(held < TAP_MS ? view.restPower : power);
  }
  function onShootCancel() { S.cancel(session); letGo(); sync(); }

  function onTurnDown(event: ReactPointerEvent<HTMLButtonElement>, dir: number) {
    if (event.button > 0 || !S.live(session) || game.current.phase !== "aim") return;
    capture(event);
    sfx.tick();
    locked.current = false;
    applyAim(view.aim + dir * 0.25 * deg);
    view.turnDir = dir;
  }
  const onTurnUp = () => { view.turnDir = 0; };

  // ---- keys: ← → aim, Shift+← → or A/D the striker, hold Space or Enter for power; Enter and R on the result ----
  const keyHandler = useRef<(event: KeyboardEvent, down: boolean) => void>(() => {});
  keyHandler.current = (event, down) => {
    const target = event.target as HTMLElement | null, key = event.key;
    // A held key always lets go on its own keyup, wherever focus went and whether the board shows.
    if (!down && session.hold === "key" && key === session.holdKey) { const power = view.power; if (S.release(session, "key", key)) strike(power); else letGo(); return; }
    if (!down && (key === "ArrowLeft" || key === "ArrowRight")) { view.turnDir = 0; return; }
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]") || session.sheet) return;
    if (!down) return;
    const enter = key === "Enter" || key === " ";
    if (enter && target?.closest?.("button, a, summary") && !target.closest(".cr-start-go, .cr-shoot")) return;
    const fresh = !event.repeat;
    if (key === "p" || key === "P") { event.preventDefault(); if (fresh && session.phase === "playing") player.requestPause(); return; }
    if (session.phase === "title") {
      if (enter && fresh) { event.preventDefault(); start(); return; }
      const pick = ["1", "2", "3", "১", "২", "৩"].indexOf(key);
      if (pick >= 0 && fresh) setHand((["e", "n", "h"] as const)[pick % 3]);
      return;
    }
    if (session.phase === "over") {
      if ((enter || key === "r" || key === "R") && result) {
        event.preventDefault();
        if (!S.again(session, performance.now(), { at: event.timeStamp, repeat: event.repeat })) return;
        if (enter) primary.run(); else again();
      }
      return;
    }
    if (!S.live(session) || game.current.phase !== "aim") { if (enter) event.preventDefault(); return; }
    const g = game.current;
    if (key === "ArrowLeft" || key === "ArrowRight" || key === "a" || key === "d" || key === "A" || key === "D") {
      event.preventDefault();
      const dir = key === "ArrowLeft" || key === "a" || key === "A" ? -1 : 1;
      if (event.shiftKey || key.toLowerCase() === "a" || key.toLowerCase() === "d") { moveStriker(g.u + dir * 0.02); return; }
      locked.current = false;
      if (fresh) applyAim(view.aim + dir * 0.25 * deg);
      view.turnDir = dir;
      return;
    }
    if (enter) {
      event.preventDefault();
      if (fresh && S.hold(session, "key", key)) { view.charging = true; view.chargeAt = view.clock; sync(); }
    }
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keyHandler.current(event, true);
    const up = (event: KeyboardEvent) => keyHandler.current(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest("button");
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- what the screen shows ----
  const g = game.current, spec = g.spec, w = g.world;
  const phase = session.phase;
  const world = spec?.world ?? 0;
  const count = whites(g);
  const left = strikesLeft(g);
  const danger = phase === "playing" && g.mode !== "duo" && left === 1 && g.phase === "aim";
  const nextOpen = g.mode === "level" && g.level < LEVEL_COUNT && playable(g.level + 1, open, visit) ? g.level + 1 : 0;
  const prevOpen = g.mode === "level" && g.level > 1 && playable(g.level - 1, open, visit) ? g.level - 1 : 0;
  const soloFriend = friend && friend.mode === "solo" && g.mode === "board" && friend.seed === g.seed ? friend : null;
  const levelFriend = friend && friend.mode === "level" && g.mode === "level" && friend.level === g.level ? friend : null;
  const friendShown = Boolean(soloFriend || levelFriend || (friend?.mode === "duo" && g.mode === "duo"));
  const progress = g.mode === "level" ? count.inside / Math.max(1, count.need) : g.mode === "board" ? g.strikes / STRIKES : 0;

  const line = phase === "title" ? (spec ? spec.hint : "")
    : phase === "paused" ? "থেমে আছে। তৈরি হলে চালিয়ে যাও।"
    : phase === "over" ? (g.mode === "level" ? (g.cleared ? "বোর্ড সাফ!" : "চাল শেষ।") : g.mode === "board" ? "দশ চাল শেষ!" : "বোর্ড শেষ!")
    : hint ? HINTS[hint] : g.phase === "moving" ? "গুটি গড়াচ্ছে…"
    : g.note === "start" && spec ? spec.hint
    : needsQueen(g) && g.queen === "board" && count.inside >= count.need && g.note !== "queen-back" ? "সাদা হয়ে গেছে। এবার কুইন, তারপর একটা সাদা দিয়ে কভার।"
    : noteText(g.note, { mode: g.mode, gained: g.gained, turn: g.turn, queenBy: g.queenBy, left: Math.max(0, count.need - count.inside) });
  const tone = hint === "blocked" || g.note === "foul" || g.note === "black" || g.note === "last-back" || g.note === "queen-back" ? "bad"
    : g.note === "pocket" || g.note === "queen" || g.note === "cover" || g.note === "again" || g.note === "clear" ? "good" : "plain";
  const aiming = phase === "playing" && g.phase === "aim";

  // The end slip's words and buttons.
  let finishTitle = "", finishLine = "", finishNote = "";
  if (result) {
    const r = result.shared;
    if (r.mode === "level" && spec) {
      finishTitle = result.cleared ? `${spec.boss ? spec.name : "বোর্ড"} সাফ, ${bn(r.strikes)} চালে` : result.left === 1 ? "আর একটা বাকি ছিল" : `আর ${bn(result.left)}টা বাকি ছিল`;
      finishLine = levelFriend ? compareStrikes(r.strikes, levelFriend.strikes, levelFriend.name) : levelLine(spec, result.cleared, result.stars, result.left);
      finishNote = [result.cleared ? strikesNear(spec, r.strikes) : "", result.before !== null && result.cleared ? (result.record ? `নতুন রেকর্ড, আগে লেগেছিল ${bn(result.before)} চাল।` : `এই ফোনে সেরা ${bn(Math.min(result.before, r.strikes))} চাল।`) : ""].filter(Boolean).join(" ");
    } else if (r.mode === "solo") {
      finishTitle = `${bn(r.points)} পয়েন্ট`;
      finishLine = soloFriend ? compareLine(r.points, soloFriend.points, soloFriend.name) : humanLine(r.points);
      finishNote = [piecesLine(r.points, r.queen), pointsNear(r.points, oldBoard, result.before), result.record ? "এই ফোনে নতুন রেকর্ড!" : result.before !== null ? `এই ফোনে সেরা ${bn(Math.max(result.before, r.points))}।` : ""].filter(Boolean).join(" · ");
    } else if (r.mode === "duo") {
      finishTitle = `${SIDE_NAME[r.winner]} জিতল!`;
      finishLine = duoLine(r.points);
    }
  }
  const primary = g.mode === "level" && result?.cleared && nextOpen
    ? { label: "পরের বোর্ড", run: nextBoard }
    : { label: g.mode === "duo" ? "নতুন বোর্ড" : "আবার খেলো", run: again };
  const secondary = [
    ...(primary.run === nextBoard ? [{ label: "আবার খেলো", key: "R", run: again }] : []),
    { label: "সব বোর্ড", run: openSheet },
  ];
  const guardOk = () => S.again(session, performance.now());

  const badge = g.mode === "level" ? <><b>বোর্ড {bn(g.level)}</b><span>{spec?.name}</span></> : g.mode === "board" ? <><b>দশ চাল</b><span>{oldBoard ? OLD_BOARDS[oldBoard - 1].name : soloFriend ? "বন্ধুর বোর্ড" : "এলোমেলো বোর্ড"}</span></> : <><b>দুজনে</b><span>{SIDE_OF[g.turn]} পালা</span></>;
  const pips = g.budget ? Array.from({ length: Math.min(g.budget, 24) }, (_, k) => k < g.budget - g.strikes) : [];

  return (
    <div ref={root} className="cr" data-world={world} data-phase={phase} data-calm={slow || undefined} data-finale={spec?.boss ? "" : undefined}
      data-danger={danger || undefined} style={{ ["--cr-accent" as string]: accentOf(world) }} onClick={dropFocus}>
      <div className="cr-play">
        <header className="cr-hud">
          <button type="button" className="cr-badge" onClick={openSheet} aria-haspopup="dialog">
            <i aria-hidden="true" />{badge}
          </button>
          {g.mode === "duo" ? (
            <div className="cr-sides">
              {([0, 1] as const).map(side => (
                <p key={side} className="cr-side" data-on={g.turn === side && phase !== "over"}>
                  <i data-side={side} aria-hidden="true" /><b>{bn(PER_SIDE - onBoard(w, side))}</b><span>/{bn(PER_SIDE)}</span>
                </p>
              ))}
              {g.queen !== "board" && <p className="cr-queen" data-pending={g.queen === "pending"}>{g.queen === "pending" ? "কুইন: কভার করো" : `কুইন ${g.queenBy === -1 ? "" : SIDE_OF[g.queenBy]}`}</p>}
            </div>
          ) : (
            <div className="cr-count">
              <p className="cr-pips" aria-label={`চাল বাকি ${bn(Math.max(0, g.budget - g.strikes))}টা, মোট ${bn(g.budget)}`}>
                {pips.map((on, k) => <i key={k} data-on={on || undefined} />)}
                <span>চাল {bn(Math.max(0, g.budget - g.strikes))}</span>
              </p>
              <p className="cr-score">
                {g.mode === "level"
                  ? <><i data-side="0" aria-hidden="true" /><b>{bn(count.inside)}</b><span>/{bn(count.need)}</span>{needsQueen(g) && <em data-on={g.queen === "covered" || undefined} data-pending={g.queen === "pending" || undefined} aria-label={g.queen === "covered" ? "কুইন কভার" : "কুইন বাকি"}>কুইন</em>}</>
                  : <><b>{bn(soloPoints(w))}</b><span>পয়েন্ট</span></>}
              </p>
            </div>
          )}
        </header>

        <div className="cr-tray" aria-hidden="true">
          {g.mode === "level" ? (
            <>
              {Array.from({ length: count.need }, (_, k) => <i key={k} data-kind="white" data-in={k < count.inside || undefined} />)}
              {needsQueen(g) && <i data-kind="queen" data-in={g.queen === "covered" || undefined} data-pending={g.queen === "pending" || undefined} />}
              {g.stats.blacks > 0 && <span className="cr-tray-cost">কালো −{bn(g.stats.blacks)} চাল</span>}
            </>
          ) : g.mode === "board" ? (
            <>{Array.from({ length: Math.min(19, g.stats.pieces) }, (_, k) => <i key={k} data-kind="white" data-in />)}<span className="cr-tray-cost">{bn(g.stats.pieces)}টা গুটি</span></>
          ) : null}
        </div>

        <div className="cr-field" ref={field}>
          <div className="cr-board" ref={boardBox} style={{ width: boardSize || undefined, height: boardSize || undefined }}
            onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp} onPointerCancel={onBoardCancel} onContextMenu={event => event.preventDefault()}>
            <canvas ref={canvas} role="img" aria-label={g.mode === "level" ? `ক্যারম ${levelLabel(g.level)}। ${bn(count.inside)}টা সাদা ঢুকেছে, দরকার ${bn(count.need)}টা। চাল বাকি ${bn(Math.max(0, g.budget - g.strikes))}।` : g.mode === "board" ? `দশ চালের বোর্ড। চাল ${bn(g.strikes)}/${bn(STRIKES)}, ${bn(soloPoints(w))} পয়েন্ট।` : `দুজনের ক্যারম বোর্ড। ${SIDE_OF[g.turn]} পালা।`} />
            {g.mode !== "duo" && (
              <div className="cr-progress" aria-hidden="true">
                <i style={{ transform: `scaleX(${Math.min(1, progress)})` }} />
                {spec?.boss && phase === "playing" && <span>{spec.boss.who} · {bn(spec.par)} চাল</span>}
              </div>
            )}
            {phase === "paused" && session.why === "away" && (
              <div className="cr-overlay">
                <div className="cr-note">
                  <p>থেমে আছে।</p>
                  <button type="button" className="kit-primary" onClick={resumeAway}>চালিয়ে যাও</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="cr-hint" data-tone={tone} aria-live="polite">{line}</p>

        <div className="cr-controls" data-off={!aiming || undefined}>
          <input className="cr-slide" type="range" aria-label="স্ট্রাইকার সরাও" min={0} max={1000} step={1} value={Math.round(g.u * 1000)} disabled={!aiming}
            onChange={event => moveStriker(Number(event.target.value) / 1000)} />
          <div className="cr-buttons">
            <button type="button" className="cr-turn" aria-label="নিশানা বাঁয়ে" disabled={!aiming}
              onPointerDown={event => onTurnDown(event, -1)} onPointerUp={onTurnUp} onPointerCancel={onTurnUp} onLostPointerCapture={onTurnUp}
              onClick={event => { if (event.detail === 0) applyAim(view.aim - 0.5 * deg); }} onContextMenu={event => event.preventDefault()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
            </button>
            <button type="button" className="cr-shoot" data-on={view.charging || session.hold === "button"} disabled={!aiming}
              onPointerDown={onShootDown} onPointerUp={onShootUp} onPointerCancel={onShootCancel}
              onClick={event => { if (event.detail === 0 && session.hold === "none") strike(view.restPower); }} onContextMenu={event => event.preventDefault()}>
              <b>মারো</b><span>{view.charging ? "ছাড়লেই টোকা" : "চাপো, নয়তো চেপে ধরো"}</span>
            </button>
            <button type="button" className="cr-turn" aria-label="নিশানা ডানে" disabled={!aiming}
              onPointerDown={event => onTurnDown(event, 1)} onPointerUp={onTurnUp} onPointerCancel={onTurnUp} onLostPointerCapture={onTurnUp}
              onClick={event => { if (event.detail === 0) applyAim(view.aim + 0.5 * deg); }} onContextMenu={event => event.preventDefault()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {phase === "title" && (
          <StartCard mode={g.mode} level={g.level || 1} hand={hand} stars={levels.stars[g.level] ?? 0} prev={prevOpen} next={nextOpen}
            friend={friend} friendHere={friendShown} friendCanvas={friendPreview}
            onStart={start} onMode={setMode} onHand={setHand} onLevel={goToLevel} onSheet={openSheet} />
        )}

        {phase === "over" && result && (
          <Finish title={finishTitle} stars={result.shared.mode === "duo" ? null : result.stars} stats={result.stats} line={finishLine} note={finishNote} slow={slow}
            primary={{ label: primary.label, run: () => { if (guardOk()) primary.run(); } }}
            secondary={secondary.map(action => ({ ...action, run: () => { if (guardOk()) action.run(); } }))} onSeeCard={result.shared.mode !== "level" || result.cleared ? seeCard : undefined} />
        )}
      {session.sheet && (
          <LevelSheet stars={levels.stars} open={open} visit={visit} current={g.mode === "level" ? g.level : 0} recommended={recommended(levels.stars, open)}
            onPick={level => { S.closeSheet(session); load(newLevel(level, hand)); }} onClose={closeSheet} />
        )}
      </div>


      {card && result && (card.mode !== "level" || result.cleared) && (
        <section className="cr-result" id="result" ref={resultBox} aria-labelledby="cr-result-title">
          <h2 id="cr-result-title">{card.mode === "level" ? <><em>{levelLabel(card.level)}</em>, {bn(card.strikes)} চালে সাফ</> : card.mode === "solo" ? <><em>{bn(card.points)} পয়েন্ট</em>, কার্ড তৈরি</> : <><em>{SIDE_NAME[card.winner]} জিতল</em>, কার্ড তৈরি</>}</h2>
          <div className="cr-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cr-card-summary" />
              <figcaption id="cr-card-summary" className="cr-sr">{card.mode === "level" ? `ক্যারমের কার্ড: ${levelLabel(card.level)}, ${bn(card.strikes)} চালে সাফ।` : card.mode === "solo" ? `ক্যারমের কার্ড: ${bn(STRIKES)} চালে ${bn(card.points)} পয়েন্ট, ${piecesLine(card.points, card.queen)}।` : `ক্যারমের কার্ড: ${playerName(card.winner, card.name)} জিতল, ${bn(card.points)} পয়েন্টে।`}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cr-share">
              {card.mode === "duo" ? (
                <div className="cr-names">
                  {([0, 1] as const).map(side => (
                    <label className="cr-name" key={side}>
                      <span>{SIDE_OF[side]} নাম <small>না দিলেও চলবে</small></span>
                      <input value={names[side]} maxLength={MAX_NAME} onChange={event => setNames(side === 0 ? [event.target.value, names[1]] : [names[0], event.target.value])} placeholder={side === 0 ? "যেমন: রাফি" : "যেমন: মিতু"} />
                    </label>
                  ))}
                </div>
              ) : (
                <label className="cr-name">
                  <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
                </label>
              )}
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="carrom.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
                hint={card.mode === "duo" ? "লিংক খুললে কার্ডটা দেখবে, তারপর ওরাও দুজনে খেলতে পারবে।" : "বন্ধু লিংক খুললে একই বোর্ড পাবে। ফলটা তোমার নিজের ফোনের।"} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
