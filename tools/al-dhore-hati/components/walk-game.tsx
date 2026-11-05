"use client";
// IP: what we avoided — no endless-runner or line-tracing app's look, characters, coins or HUD; ours is a made-up Bangladeshi paddy field drawn fresh, a man in a লুঙ্গি and গামছা walking a clay আল with a tiffin, with goats, egrets, a bamboo bridge and four times of day.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps them, session.ts decides input, pauses and the wind loop);
// this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { useGamePlayer } from "../../../shared/game-player-client";
import { fitCanvas, newSeed, readLevels, sfx, silenceScheduled, soundOn, totalStars, useBest, useGameLoop, useLevels, useSlowMode, useSound, confetti, tone } from "../../../shared/game-kit";
import { drawFrame } from "../lib/draw.hot";
import { centreAt, safeOffset, windAt, PX_PER_M, W } from "../lib/field";
import {
  defOfLevel, isLevel, isMode, LEVEL_COUNT, livesOf, MODE_INFO, nextAhead, openLevel, readList, showsIntro, specOfRun, starsOf, WORLDS, type Mode, type Run,
} from "../lib/levels";
import {
  bn, clearLine, compareLine, fellLine, humanLine, nearMissLine, parseCard, playLabel, retrySeed, rivalFits as fits, slipLine, SLUG, streakLine, type Card,
} from "../lib/link";
import {
  createGame, dragBy, E_BACK, E_BIRDS, E_BLEAT, E_DONE, E_FELL, E_GUST, E_GUST_WARN, E_NEAR, E_SLIP, E_STEP, E_STREAK, E_WOBBLE, metres, SLOW_PACE, start, type Game,
} from "../lib/rules";
import { boardHeight, makeLook, paintLook, sizeLook } from "../lib/scene";
import * as S from "../lib/session";
import { birds, bleat, creak, footstep, gust, motif, squelch, stepUp, windLoop } from "../lib/sound";
import { stepGame } from "../lib/step.hot";
import { Arrow } from "./icons";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { IntroCard } from "./intro-card";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, ahead: `ektukhani-ahead-${SLUG}`, mode: `ektukhani-mode-${SLUG}`,
  intro: `ektukhani-intro-${SLUG}`, seen: `ektukhani-seen-${SLUG}`,
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Result = EndStats & { card: Omit<Card, "name"> | null };
type Chip = { text: string; key: number };

export function WalkGame() {
  const wrap = useRef<HTMLDivElement>(null), stageBox = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const meter = useRef<HTMLElement>(null), line = useRef<HTMLSpanElement>(null), boss = useRef<HTMLSpanElement>(null), windChip = useRef<HTMLParagraphElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef<Game>(createGame({ seed: 1, kind: "level", level: 1, mode: "n" }));
  const look = useRef(makeLook());
  const session = useRef<S.Session>(S.createSession(true));
  const wind = useRef<ReturnType<typeof windLoop> | null>(null);
  const seen = useRef({ edge: "", strain: -1, metres: -1, boss: -1, wind: 0, last: false });
  const chipKey = useRef(0);

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, kind: "level", level: 1, mode: "n" });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Card | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ahead, setAhead] = useState<number[]>([]);
  const [seenIntro, setSeenIntro] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [slips, setSlips] = useState(0);
  const [chip, setChip] = useState<Chip | null>(null);
  const [news, setNews] = useState("");
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const [best, submitBest] = useBest(SLUG);
  const open = openLevel(levels.stars, ahead);
  const live = useRef({ slow, screen, run, levels, ahead, seenIntro, best, friend, mode });
  live.current = { slow, screen, run, levels, ahead, seenIntro, best, friend, mode };
  const spec = specOfRun(run), def = defOfLevel(run.level);

  // ---- the wind loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { wind.current?.stop(); wind.current = windLoop(); },
    stop: () => { wind.current?.stop(); wind.current = null; },
  };
  const sync = () => S.syncLoops(session.current, game.current, loops);
  /** Held sides and fingers → the feet. A drag that has ended lets go of the chase. */
  const applyHold = () => {
    const hold = S.holdOf(session.current), g = game.current;
    g.dir = hold.dir;
    if (!hold.dragging) g.dragging = false;
  };

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); applyHold(); sync(); },
    onResume: () => { S.resume(session.current, performance.now()); sync(); },
    onRestart: () => { S.resume(session.current, performance.now()); if (live.current.screen === "title" || live.current.screen === "intro") sync(); else again(); },
    onLevels: () => { S.openSheet(session.current); applyHold(); setSheet(true); sync(); },
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    applyHold();
    setScreen(next);
    sync();
  }

  function markSeen(level: number) {
    const list = live.current.seenIntro;
    if (list.includes(level)) return;
    const next = [...list, level].sort((a, b) => a - b);
    setSeenIntro(next); write(KEYS.seen, JSON.stringify(next));
  }

  /** A fresh field: straight into the walk, or onto the ready card when its one new thing hasn't been shown yet. */
  function begin(next: Run, how: "play" | "ready") {
    silenceScheduled();
    const previous = live.current.run, sameLevel = previous.level === next.level && previous.kind === next.kind && live.current.screen !== "title";
    const g = createGame(next);
    game.current = g;
    const l = look.current, current = g.spec;
    if (stageBox.current && (l.scene !== current.scene || l.darkRadius !== current.dark)) paintLook(l, current.scene, current.dark);
    Object.assign(seen.current, { edge: "", strain: -1, metres: -1, boss: -1, wind: 0, last: false });
    stageBox.current?.setAttribute("data-edge", "");
    stageBox.current?.removeAttribute("data-last");
    setRun(next); setResult(null); setSlips(0); setChip(null); setNews("");
    if (sheetRef.current) closeSheet(false);
    if (how === "ready") { show("ready"); draw(); return; }
    start(g);
    if (next.kind === "level") markSeen(next.level);
    show("play");
    if (next.kind === "level" && !sameLevel) motif(WORLDS[defOfLevel(next.level).world].motif);
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }
  const sheetRef = useRef(false);
  sheetRef.current = sheet;
  const stepRef = useRef(step);
  stepRef.current = step;

  // ---- first load: a friend's link, saved progress, the remembered mode ----
  useEffect(() => {
    if (!levels.loaded) return;
    const link = parseCard(window.location.hash);
    setFriend(link);
    setSite(window.location.host);
    session.current.sound = soundOn();
    const savedAhead = readList(read(KEYS.ahead));
    setAhead(savedAhead);
    setSeenIntro(readList(read(KEYS.seen)));
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    const stars = readLevels(read(KEYS.levels), LEVEL_COUNT);
    setModeState(link && link.kind !== "old" ? link.mode : chosen);
    const first: Run = link ? { seed: link.seed, kind: link.kind, level: link.level, mode: link.mode } : { seed: newSeed(), kind: "level", level: openLevel(stars, savedAhead), mode: chosen };
    setRun(first);
    game.current = createGame(first);
    if (link && new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(link, first);
  }, [levels.loaded]);
  useEffect(() => () => { wind.current?.stop(); silenceScheduled(); }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __al: { game: () => game.current, session: () => session.current, look: () => look.current, centreAt, safeOffset, step: (dt: number) => stepRef.current(dt) } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) silenceScheduled(); sync(); }, [sound]);

  // ---- away and back: nothing held counts any more; the player pauses ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); applyHold(); sync(); };
    const onFocus = () => { S.focus(session.current, performance.now()); };
    const onVisibility = () => { if (document.hidden) { S.hide(session.current); applyHold(); } else S.show(session.current, performance.now()); sync(); };
    const onHash = () => {
      const link = parseCard(window.location.hash);
      if (!link) return;
      setFriend(link);
      setModeState(link.kind === "old" ? "n" : link.mode);
      setRun({ seed: link.seed, kind: link.kind, level: link.level, mode: link.mode });
      game.current = createGame({ seed: link.seed, kind: link.kind, level: link.level, mode: link.mode });
      show("title");
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); window.removeEventListener("hashchange", onHash); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- one step: rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, g = game.current;
    if (!S.ticking(s)) return;
    stepGame(g, dt, live.current.slow ? SLOW_PACE : 1);
    const events = g.events;
    g.events = 0;
    wind.current?.set(Math.min(1, Math.abs(windAt(g.field, g.d)) / 30));
    if (events) onEvents(events, g);
    sync();
  }

  function onEvents(events: number, g: Game) {
    const calm = look.current.calm;
    if (events & E_STEP) footstep(g.foot as 0 | 1);
    if (events & E_BLEAT) bleat();
    if (events & E_BIRDS) birds();
    if (events & E_WOBBLE) creak();
    if (events & E_NEAR) sfx.tick();
    if (events & E_BACK) stepUp();
    if (events & E_GUST_WARN) sfx.tick();
    if (events & E_GUST) gust();
    if (events & E_STREAK) { sfx.combo(g.streak - 1); setChip({ text: streakLine(g.streakM), key: ++chipKey.current }); }
    if (events & E_SLIP) {
      squelch();
      setSlips(g.slips); setNews(slipLine(g.slipReason));
      if (!calm) stageBox.current?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 220, easing: "ease-out" });
    }
    if (events & E_DONE) finish(true);
    else if (events & E_FELL) finish(false);
  }

  const rivalFits = (target: Run) => fits(live.current.friend, target);

  function finish(cleared: boolean) {
    const g = game.current, current = live.current.run, total = g.spec.metres, modeNow = current.kind === "old" ? "n" : current.mode;
    const dry = cleared && g.slips === 0 ? total : Math.max(1, Math.min(total, metres(g.bestDry)));
    const before = live.current.best;
    const newBest = submitBest(dry) && before !== null && dry > before;
    const left = Math.max(1, Math.ceil(total - g.d / PX_PER_M));
    const earned = starsOf(g.slips, cleared, modeNow), had = live.current.levels.stars[current.level] ?? 0;
    let record = false, bestLine = "", near = "";
    if (cleared && current.kind === "level") {
      const nextList = nextAhead(live.current.levels.stars, live.current.ahead, current.level);
      write(KEYS.ahead, JSON.stringify(nextList)); setAhead(nextList);
      live.current.levels.record(current.level, earned);
      record = had > 0 && earned > had;
    }
    if (cleared) near = nearMissLine(g.slips, modeNow);
    if (newBest) bestLine = `নতুন রেকর্ড: টানা ${bn(dry)} মিটার শুকনো পায়ে!`;
    else if (record) bestLine = `এই লেভেলে নতুন রেকর্ড, ${bn(earned)} তারা!`;
    const card = { seed: current.seed, level: current.level, slips: g.slips, dry, kind: current.kind, mode: current.mode };
    const f = live.current.friend, rival = f && rivalFits(current) ? f : null;
    const lives = livesOf(current);
    setResult({
      kicker: cleared ? (current.kind === "level" ? `লেভেল ${bn(current.level)} পার · ${defOfLevel(current.level).name}` : `${playLabel(current)} পার`) : `${lives === 3 ? "তিনবার" : `${bn(lives)} বার`} কাদায় পা পড়েছে`,
      why: cleared ? (current.kind === "level" ? clearLine(current.level) : "পুরোনো নিয়মে খেত পার। তারা জমে না।") : fellLine(left, g.slipReason),
      cleared, metres: total, walked: cleared ? total : Math.max(0, total - left), stars: earned, maxStars: MODE_INFO[modeNow].maxStars, levelRun: cleared,
      slips: g.slips, lives, dry, nears: g.nears, passed: g.passed, seconds: g.clock, gusts: g.gustsRidden,
      line: cleared ? humanLine({ level: current.level, slips: g.slips }) : (newBest ? `তবু নতুন রেকর্ড: টানা ${bn(dry)} মিটার শুকনো পায়ে।` : "পা যেখানে পিছলেছে, সেখানে আর একটু সাবধান।"),
      near, best: cleared ? bestLine : "",
      versus: rival ? (cleared ? compareLine(card, rival, rival.name) : `${rival.name || "বন্ধু"} এই খেত ${rival.slips === 0 ? "একবারও না পিছলে" : `${bn(rival.slips)} বার পিছলে`} পার হয়েছিল।`) : "",
      card: cleared ? card : null,
    });
    show("over");
    // The stars are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
    const colors = ["#ffd23f", "#3d6b21", "#f4eedc", "#c8323c", "#79b04a"];
    if (!cleared) sfx.lose();
    else if (current.level === LEVEL_COUNT && current.kind === "level") { sfx.levelUp(); confetti({ colors }); }
    else if (earned === 3 || newBest) { sfx.win(); confetti({ colors }); }
    else sfx.good();
  }

  /** Preview images only (`&og=1` on a link): the friend's field shown as cleared, so the card draws without playing. Saves nothing. */
  function demo(found: Card, target: Run) {
    const g = createGame(target);
    g.d = g.field.length; g.phase = 3;
    game.current = g;
    S.goTo(session.current, "over", 0);
    setScreen("over");
    setResult({
      kicker: "", why: "", cleared: true, metres: g.spec.metres, walked: g.spec.metres, stars: starsOf(found.slips, true, found.kind === "old" ? "n" : found.mode), maxStars: 3, levelRun: true,
      slips: found.slips, lives: 3, dry: found.dry, nears: 0, passed: 0, seconds: 0, gusts: 0, line: "", near: "", best: "", versus: "",
      card: { seed: found.seed, level: found.level, slips: found.slips, dry: found.dry, kind: found.kind, mode: found.mode },
    });
  }

  // ---- drawing ----
  function draw() {
    const c = context.current, g = game.current, l = look.current, view = seen.current;
    if (!c || !l.layers) return;
    c.save();
    c.scale(l.scale, l.scale);
    drawFrame(c, l, g);
    c.restore();
    // The HUD's live parts, written straight to the DOM and only when they change.
    const total = g.spec.metres, walked = Math.min(total, metres(g.d));
    if (walked !== view.metres) {
      view.metres = walked;
      if (meter.current) meter.current.textContent = bn(walked);
      if (line.current) line.current.style.transform = `scaleX(${Math.min(1, g.d / g.field.length)})`;
    }
    const left = Math.round(100 * Math.max(0, 1 - g.d / g.field.length));
    if (left !== view.boss && boss.current) { view.boss = left; const fill = boss.current.firstElementChild as HTMLElement | null; if (fill) fill.style.transform = `scaleX(${left / 100})`; }
    const holder = stageBox.current;
    if (!holder) return;
    const playing = g.phase === 1;
    const edge = !playing ? "" : g.gustWarn !== 0 || g.gustNow !== 0 ? ((g.gustWarn || g.gustNow) > 0 ? "gust-left" : "gust-right") : Math.abs(g.edge) > 0.65 ? (g.edge > 0 ? "right" : "left") : "";
    if (edge !== view.edge) { view.edge = edge; holder.setAttribute("data-edge", edge); }
    const strain = Math.round(Math.min(1, Math.max(0, (Math.abs(g.edge) - 0.65) / 0.35)) * 10) / 10;
    if (strain !== view.strain) { view.strain = strain; holder.style.setProperty("--strain", String(strain)); }
    const last = g.slips >= g.lives - 1 && g.lives > 1 && g.phase !== 3;
    if (last !== view.last) { view.last = last; if (last) holder.setAttribute("data-last", ""); else holder.removeAttribute("data-last"); }
    const push = playing ? windAt(g.field, g.d) : 0, shownWind = Math.abs(push) > 3 ? Math.sign(push) : 0;
    if (shownWind !== view.wind && windChip.current) { view.wind = shownWind; windChip.current.dataset.dir = String(shownWind); }
  }

  look.current.calm = slow || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the board to the stage ----
  const staged = screen === "ready" || screen === "play" || screen === "over";
  useEffect(() => {
    const holder = stageBox.current, target = canvas.current;
    if (!holder || !target) return;
    const fit = () => {
      const width = holder.clientWidth, height = holder.clientHeight;
      if (width < 60 || height < 60) return;
      const over = live.current.screen === "over", bh = boardHeight(width, height, over ? 250 : 440);
      const scale = Math.min(width / W, height / bh), cssW = Math.round(W * scale), cssH = Math.round(bh * scale);
      target.style.width = `${cssW}px`; target.style.height = `${cssH}px`;
      context.current = fitCanvas(target, cssW, cssH);
      const l = look.current;
      sizeLook(l, bh, scale, Math.min(2, window.devicePixelRatio || 1));
      paintLook(l, game.current.spec.scene, game.current.spec.dark);
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    fit();
    return () => observer.disconnect();
  }, [staged, screen === "over"]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || s.sheet) return;
      if (S.keyDown(s, key)) { event.preventDefault(); applyHold(); return; }
      const go = key === "Enter" || key === " ";
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); }
        else if (go) event.preventDefault();
      } else if (screen === "title" && go && !event.repeat) {
        event.preventDefault(); startFromTitle();
      } else if (screen === "ready" && go) {
        event.preventDefault();
        if (S.freshKey(s, "ready", event)) goFromReady();
      } else if (screen === "over") {
        if (go || /^[123rR]$/.test(key)) event.preventDefault();
        if (!S.freshKey(s, "over", event)) return;
        const pick = go || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : key === "r" || key === "R" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) choices[pick].run();
      }
    };
    const up = (event: KeyboardEvent) => { S.keyUp(session.current, event.key); applyHold(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- touch: hold the left or right half of the field to step that way, or press and drag to steer ----
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (screen !== "play") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!S.press(session.current, event.pointerId, event.clientX < rect.left + rect.width / 2 ? -1 : 1, event.clientX, event.timeStamp)) return;
    applyHold();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (screen !== "play") return;
    const dx = S.move(session.current, event.pointerId, event.clientX);
    if (dx === null) return;
    const width = event.currentTarget.getBoundingClientRect().width || W;
    dragBy(game.current, dx * (W / Math.min(width, canvas.current?.clientWidth || width)));
    applyHold();
  }
  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!S.release(session.current, event.pointerId)) return;
    applyHold();
  }

  // ---- choices ----
  function setMode(next: Mode) {
    setModeState(next); write(KEYS.mode, next);
    setRun(current => current.kind === "old" ? current : { ...current, mode: next });
    sfx.tap();
  }
  function closeSheet(resumeMenu: boolean) {
    S.closeSheet(session.current, performance.now());
    setSheet(false);
    if (resumeMenu && live.current.screen === "play") player.requestPause();
  }
  function startFromTitle() {
    sfx.tap();
    const r = live.current.run, f = live.current.friend, m = live.current.mode;
    const target = r.kind === "old" || rivalFits(r) ? r : { ...r, mode: m };
    if (!read(KEYS.intro) && !f) { show("intro"); return; }
    begin(target, "play");
  }
  function storyDone() {
    write(KEYS.intro, "1");
    begin({ ...live.current.run, mode: live.current.mode }, "play");
  }
  function goFromReady() {
    start(game.current);
    if (live.current.run.kind === "level") markSeen(live.current.run.level);
    show("play");
    const r = live.current.run;
    if (r.kind === "level" && r.level % 5 === 1) motif(WORLDS[defOfLevel(r.level).world].motif);
  }
  function pickLevel(level: number) {
    if (!isLevel(level)) return;
    const o = openLevel(live.current.levels.stars, live.current.ahead);
    if (level > o) return;
    const f = live.current.friend, m = live.current.mode;
    const seed = f && f.kind === "level" && f.level === level && f.mode === m ? f.seed : newSeed();
    begin({ seed, kind: "level", level, mode: m }, showsIntro(level, live.current.seenIntro) ? "ready" : "play");
  }
  function again(mode?: Mode) {
    const current = live.current.run, next = mode ? { ...current, mode } : current;
    if (mode) { setModeState(mode); write(KEYS.mode, mode); }
    begin({ ...next, seed: mode ? newSeed() : retrySeed(live.current.friend, next, newSeed()) }, "play");
  }
  const cleared = result !== null && result.cleared;
  const nextLevel = run.kind === "level" && cleared && run.level < LEVEL_COUNT && run.level + 1 <= openAfter(run.level) ? run.level + 1 : 0;
  function openAfter(level: number) {
    // The level just cleared may have opened the next; the saved list changes a render later.
    return Math.max(open, level + 1 <= LEVEL_COUNT && live.current.levels.stars[level] ? level + 1 : open);
  }
  const choices: Choice[] = !result ? [] : result.cleared
    ? [
      ...(nextLevel ? [{ label: "পরের লেভেল", run: () => pickLevel(nextLevel) }] : []),
      { label: "আবার খেলো", run: () => again() },
      ...(run.kind === "old" ? [{ label: `লেভেল ${bn(open)} খেলো`, run: () => pickLevel(open) }] : []),
      { label: "সব লেভেল", run: () => { S.openSheet(session.current); setSheet(true); } },
    ].slice(0, 3)
    : [
      { label: "আবার খেলো", run: () => again() },
      ...(run.kind === "level" && run.mode !== "e" ? [{ label: "সহজে খেলো", run: () => again("e") }] : []),
      { label: "সব লেভেল", run: () => { S.openSheet(session.current); setSheet(true); } },
    ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const total = totalStars(levels.stars), lives = livesOf(run);
  const badge = run.kind === "level" ? `লেভেল ${bn(run.level)}` : "পুরোনো খেত";

  return (
    <div className="al-wrap" ref={wrap}>
      <div className="al" data-slow={slow || undefined} data-screen={screen} data-scene={spec.scene}>
        {screen === "title" && <TitleScreen run={run} mode={mode} friend={friend} stars={total} best={best} onStart={startFromTitle} onMode={setMode} onLevels={() => { S.openSheet(session.current); setSheet(true); }} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {staged && (
          <>
            <div className="al-hud">
              <p className="al-badge"><b>{badge}</b>{run.kind === "level" && <span>{def.name}</span>}{run.mode !== "n" && run.kind !== "old" && <i>{MODE_INFO[run.mode].name}</i>}</p>
              <p className="al-boss" data-on={(run.kind === "level" && def.finale !== "") || undefined} aria-hidden={def.finale === "" || run.kind === "old"}>
                <b>{run.kind === "level" ? def.finale : ""}</b><span ref={boss} className="al-meter"><i /></span>
              </p>
              <div className="al-gauge">
                <p aria-label={`${bn(spec.metres)} মিটারের মধ্যে`}><b ref={meter}>০</b>/{bn(spec.metres)} মি.</p>
                <ol className="al-feet" aria-label={`আর ${bn(Math.max(0, lives - slips))} বার পিছলাতে পারো`}>
                  {Array.from({ length: lives }, (_, index) => <li key={index} data-gone={index >= lives - slips || undefined} />)}
                </ol>
              </div>
            </div>
            <div className="al-stage" ref={stageBox} data-edge="" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp} onContextMenu={event => event.preventDefault()}>
              <canvas ref={canvas} className="al-canvas" role="img"
                aria-label={`ধানখেতের মাঝে সরু আল। ${defOfLevel(run.level).name}, ${bn(spec.metres)} মিটার।${spec.puddles ? " আলে পানি জমেছে।" : ""}${spec.goats ? " আলে ছাগল চরছে।" : ""}${spec.bridges ? " বাঁশের সাঁকো আছে।" : ""}${spec.wind || spec.gusts ? " বাতাস বইছে।" : ""}${spec.rain ? " বৃষ্টি পড়ছে।" : ""}`} />
              <span className="al-line" aria-hidden="true"><span ref={line} /></span>
              <p className="al-wind" ref={windChip} aria-hidden="true"><Arrow /><span>বাতাস</span></p>
              {chip && screen === "play" && <span className="al-chip" key={chip.key} aria-hidden="true">{chip.text}</span>}
              <span className="al-gust" data-side="left" aria-hidden="true">হাওয়া <Arrow /></span>
              <span className="al-gust" data-side="right" aria-hidden="true"><Arrow /> হাওয়া</span>
              <p className="al-sr" aria-live="polite">{news}</p>
              {screen === "ready" && <IntroCard level={run.level} onGo={goFromReady} />}
            </div>
            {screen === "over" && result && <EndScreen stats={result} slow={slow} choices={choices} onCard={toCard} canCard={result.card !== null} />}
          </>
        )}
        {sheet && <LevelSheet stars={levels.stars} open={open} current={run.level} mode={mode} onMode={setMode} onPick={pick => { pickLevel(pick); }} onClose={() => closeSheet(true)} />}
      </div>
      {screen === "over" && result?.card && <ResultCard result={result.card} site={site} />}
    </div>
  );
}
