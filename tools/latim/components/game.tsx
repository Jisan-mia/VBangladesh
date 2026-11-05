"use client";
// IP: what we avoided — no names, logos, characters, sounds or look from any spinning-top toy brand, battle-top cartoon or arena
// game; no launchers or battle rings; the wooden লাটিম, palm, hens and brooms are drawn fresh from plain shapes.
// The game inside the shared player. Rules live in lib/ (top.ts and step.hot.ts spin the top, session.ts decides the clock, the
// play key, the breath and the loops); this file feeds touches in, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, newSeed, recordLevel, shake, silenceScheduled, soundOn, totalStars, useGameLoop, useSlowMode, useSound, type LevelStars } from "../../../shared/game-kit";
import { BADGE_IDS, BADGES, badgesOf, readBadges, type Badge } from "../lib/badges";
import { parseShared, seedFor, type Shared } from "../lib/challenge";
import { drawFrame, moveView, POP_BAD, POP_GOOD, POP_OK, pop, spawnDust } from "../lib/draw.hot";
import { makeThings, topSprite } from "../lib/figures";
import { isFinale, levelDef, LEVEL_COUNT, MODE_INFO, starsOf, type Mode } from "../lib/levels";
import { bn, bumpCall, CALL, clearLine, fallLine, lossTip, nextLine, secs, stageLabel, streakCall, verdict, versusLine, type Tally } from "../lib/lines";
import { afterClear, loadProgress, playable, readMode, recommended, BADGE_KEY, BESTS_KEY, INTRO_KEY, LEVELS_KEY, MODE_KEY, UNLOCK_KEY, type Bests } from "../lib/progress";
import * as S from "../lib/session";
import { bad, clack, fair, good as goodSound, humLoop, knock, liftOpen, liftUp, lose, rattle, tune, victory, windLoop, windTick, zip } from "../lib/sfx";
import { advance } from "../lib/step.hot";
import {
  beginWind, canLift, createTop, endWind, E_BUMP, E_DONE, E_FALL, E_LAND, E_LIFTABLE, E_NUDGE, E_PALM, E_THROW, E_WIND, gust, lean, lift, liftSafe, nudge, releaseInput, scoreOf, setSlow, swipeThrow, throwTop,
  DT, NUDGE_GOOD, NUDGE_OK, P_DONE, P_FALL, P_READY, P_SPIN, SLOW, type Top,
} from "../lib/top";
import { makeView } from "../lib/view";
import { layoutFor, paintStage } from "../lib/world";
import { Star } from "./icons";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

type Run = { seed: number; level: number; mode: Mode };
type Sample = { x: number; y: number; t: number };
type Pull = { id: number; samples: Sample[]; ticks: number };

export function LatimGame() {
  const rootRef = useRef<HTMLDivElement>(null), fieldBox = useRef<HTMLDivElement>(null), fieldCanvas = useRef<HTMLCanvasElement>(null);
  const callRef = useRef<HTMLParagraphElement>(null), padRef = useRef<HTMLDivElement>(null), timeRef = useRef<HTMLElement>(null), trackRef = useRef<HTMLDivElement>(null);

  const session = useRef<S.Session>(S.createSession(true));
  const top = useRef<Top>(createTop(1, 1));
  const view = useRef(makeView());
  const pull = useRef<Pull | null>(null);
  const hum = useRef<ReturnType<typeof humLoop> | null>(null);
  const breeze = useRef<ReturnType<typeof windLoop> | null>(null);
  const edge = useRef({ edge: "", phase: -1, score: -1, tick: 0 });
  const lastDraw = useRef(0);
  const pendingCall = useRef("");

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n" });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [stars, setStars] = useState<LevelStars>({});
  const [unlock, setUnlock] = useState(1);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Omit<Shared, "name"> | null>(null);
  const [versus, setVersus] = useState("");
  const [owned, setOwned] = useState<Badge[]>([]);
  const [lifting, setLifting] = useState(0);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const bests = useRef<Bests>({});
  const live = useRef({ slow, run, screen, stars, unlock, friend, owned });
  live.current = { slow, run, screen, stars, unlock, friend, owned };
  const def = levelDef(run.level);

  // ---- the loops: session.ts decides, this does ----
  const loops: S.Loops = {
    startHum: () => { hum.current?.stop(); hum.current = humLoop(); const t = top.current; hum.current.set(t.omega, t.wobble, t.sway); },
    stopHum: () => { hum.current?.stop(); hum.current = null; },
    startWind: () => { breeze.current?.stop(); breeze.current = windLoop(); },
    stopWind: () => { breeze.current?.stop(); breeze.current = null; },
  };
  const sync = () => S.syncLoops(session.current, loops);
  /** A hand lets go when the round stops stepping (blur, hide, the menu, the list): the wind-up is dropped, the pull forgotten. */
  function releaseHand() {
    if (S.ticking(session.current)) return;
    releaseInput(top.current);
    pull.current = null; view.current.drag = 0;
  }
  function away(change: () => void) { change(); releaseHand(); sync(); }
  function back(change: () => void) { change(); S.wake(session.current); sync(); }

  const player = useGamePlayer({
    onPause: () => away(() => S.pause(session.current)),
    onResume: () => back(() => S.resume(session.current)),
    onRestart: () => {
      S.resume(session.current);
      const { screen: now, run: current } = live.current;
      if (now === "play" || now === "over") begin(again(current));
      else sync();
    },
    // সব লেভেল in the menu: the menu resumes, then the list opens (a choice screen: the round stops behind it).
    onLevels: () => openSheet(),
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now(), levelDef(live.current.run.level).wind > 0);
    setScreen(next);
    sync();
  }

  /** A touch or key on the game means this window has focus (a press on a background window brings it forward). */
  function engaged() { if (!session.current.focused && !document.hidden) back(() => S.focus(session.current)); }

  function say(text: string) {
    const call = callRef.current;
    if (!text) return;
    // The call line mounts with the play screen: a line said while the screen is still changing waits for it.
    if (!call) { pendingCall.current = text; return; }
    call.textContent = text;
    call.classList.remove("lt-in"); void call.offsetWidth; call.classList.add("lt-in");
  }

  /** A fresh spin on the play screen: the place's tune, then the hand waits for you. */
  function begin(next: Run) {
    silenceScheduled();
    engaged();
    top.current = createTop(next.seed, next.level, next.mode, live.current.slow);
    const v = view.current;
    Object.assign(v, { landT: 9, endT: 0, drag: 0, flash: 0, shake: 0, danger: 0, fallDir: 1, fallTilt: 0, spinLeft: 0, turn: 0 });
    v.dl.fill(0); v.popAge.fill(1); v.lp.fill(-1);
    edge.current = { edge: "", phase: -1, score: -1, tick: 0 };
    pull.current = null;
    live.current.run = next;
    setRun(next); setResult(null); setSheet(false); setLifting(0); S.closeSheet(session.current);
    show("play");
    say(levelDef(next.level).teach);
    tune(levelDef(next.level).world);
    rootRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The same level again: a friend's seed stays (so the comparison holds), anything else gets a fresh floor. */
  function again(current: Run): Run {
    return { ...current, seed: seedFor(live.current.friend, current.level, current.mode, newSeed()) };
  }

  // ---- first load: saved progress (migrated once), a friend's link, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    const s = session.current;
    s.sound = soundOn(); s.focused = document.hasFocus(); s.visible = !document.hidden;
    view.current.calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = loadProgress(read);
    if (progress.write) { write(LEVELS_KEY, progress.write.levels); write(UNLOCK_KEY, progress.write.unlock); write(BESTS_KEY, progress.write.bests); }
    setStars(progress.stars); setUnlock(progress.unlock); bests.current = progress.bests;
    live.current.stars = progress.stars; live.current.unlock = progress.unlock;
    const badges = readBadges(read(BADGE_KEY));
    setOwned(badges); live.current.owned = badges;
    const chosen = readMode(read(MODE_KEY));
    setModeState(chosen);
    const readLink = (first: boolean) => {
      const link = parseShared(window.location.hash);
      // An invalid link clears the banner: the friend is gone, the game stays where it was.
      setFriend(link); live.current.friend = link;
      if (link) {
        const next = { seed: link.seed, level: link.level, mode: link.mode };
        setRun(next); live.current.run = next; setModeState(link.mode);
        if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(link);
        else if (!first) { silenceScheduled(); show("title"); }
      } else if (first) {
        const next = { seed: newSeed(), level: recommended(progress.unlock, progress.stars), mode: chosen };
        setRun(next); live.current.run = next;
      }
    };
    readLink(true);
    const onHash = () => readLink(false);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); loops.stopHum(); loops.stopWind(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the top; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __latim: { top: () => top.current, session: () => session.current, view: () => view.current } });
  }, []);

  // ---- the site-wide sound switch: off cuts queued notes; on starts fresh loops (never the stub made while muted) ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { hum.current = null; breeze.current = null; silenceScheduled(); } sync(); }, [sound]);
  // ধীরে খেলো mid-spin: the windows follow at once, so the same real milliseconds hold for the rest of the spin.
  useEffect(() => { setSlow(top.current, slow); }, [slow]);

  // ---- away and back ----
  useEffect(() => {
    const onBlur = () => away(() => S.blur(session.current));
    const onFocus = () => back(() => S.focus(session.current));
    const onVisibility = () => { if (document.hidden) away(() => S.hide(session.current)); else back(() => S.show(session.current)); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- sounds, juice, calls and the buttons from the top's events ----
  function handleEvents() {
    const t = top.current, v = view.current, s = session.current;
    let call = "";
    for (let e = 0; e < t.evN; e++) {
      const type = t.evType[e], a = t.evA[e], b = t.evB[e];
      if (type === E_WIND) windTick(a, b);
      else if (type === E_THROW) {
        zip(a); v.landT = 0; v.drag = 0;
        S.setSpinning(s, true);
        call = `${verdict(t.power, t.straight)} ${CALL.watch}`;
        sync();
      } else if (type === E_LAND) { clack(); spawnDust(v, v.cx, v.cy, 6); }
      else if (type === E_NUDGE) {
        v.flash = 1;
        if (a === NUDGE_GOOD) { goodSound(b); v.flashSide = 1; pop(v, streakCall(b), POP_GOOD); call = streakCall(b); }
        else if (a === NUDGE_OK) { fair(); v.flashSide = -1; pop(v, CALL.ok.slice(0, -1), POP_OK); call = CALL.ok; }
        else { bad(); v.flash = 0; pop(v, "আগে-পরে", POP_BAD); call = CALL.miss; if (!v.calm) shake(fieldBox.current); }
      } else if (type === E_BUMP) {
        knock(a, b === 1);
        if (!v.calm) v.shake = b === 1 ? 0.06 : 0.15;
        if (b === 1) pop(v, "সামলেছ", POP_GOOD);
        call = bumpCall(a, b === 1);
      } else if (type === E_LIFTABLE) { liftOpen(); call = CALL.liftOpen; }
      else if (type === E_FALL) {
        S.setSpinning(s, false);
        v.endT = 0; v.fallDir = lean(t) >= 0 ? 1 : -1; v.fallTilt = t.wobble * lean(t) * 0.55; v.spinLeft = Math.max(0, t.omega); v.turn = t.turn;
        rattle(); spawnDust(v, v.cx + v.fallDir * v.size * 0.4, v.cy, 8);
        if (!v.calm) shake(fieldBox.current);
        call = fallLine(t.fall, false);
        setLifting(0);
        sync();
      } else if (type === E_PALM) {
        S.setSpinning(s, false);
        v.endT = 0; v.spinLeft = Math.max(0.15, t.omega); v.turn = t.turn;
        liftUp();
        call = fallLine(0, true);
        setLifting(0);
        sync();
      } else if (type === E_DONE) { t.evN = 0; finish(); return; }
    }
    t.evN = 0;
    if (call) say(call);
  }

  // ---- one step: the session decides, the top moves, events become sounds ----
  function step() {
    const s = session.current, t = top.current;
    if (!S.step(s) || t.phase === P_DONE) return;
    advance(t, live.current.slow ? DT * SLOW : DT);
    if (t.evN) handleEvents();
    if (top.current !== t) return;
    if (t.phase === P_SPIN) {
      const e = edge.current;
      if (++e.tick % 3 === 0) {
        hum.current?.set(t.omega, t.wobble, t.sway);
        breeze.current?.set(Math.min(1, gust(t, t.t)));
      }
      const ready = canLift(t) ? (liftSafe(t) ? 1 : 2) : 0;
      if (ready !== lifting) setLifting(ready);
    }
    sync();
  }

  function finish() {
    const t = top.current, current = live.current.run, d = levelDef(current.level), info = MODE_INFO[current.mode];
    const f = live.current.friend, rival = f && f.level === current.level && f.seed === current.seed && f.mode === current.mode ? f : null;
    const score = scoreOf(t), palm = t.bonus > 0;
    const best = bests.current[current.level] ?? -1;
    if (score > best) { bests.current = { ...bests.current, [current.level]: score }; write(BESTS_KEY, JSON.stringify(bests.current)); }
    const record = best >= 0 && score > best ? `এই ফোনে এই লেভেলের নতুন সেরা: ${secs(score)} সেকেন্ড।` : best >= 0 ? `এই ফোনে এই লেভেলের সেরা ${secs(Math.max(best, score))} সেকেন্ড।` : "";
    const earned = badgesOf(score - t.bonus, palm, t.bestCombo, t.nudges);
    const before = live.current.owned, fresh = earned.filter(id => !before.includes(id));
    const keep = BADGE_IDS.filter(id => before.includes(id) || earned.includes(id));
    if (fresh.length) { write(BADGE_KEY, JSON.stringify(keep)); setOwned(keep); live.current.owned = keep; }
    const tally: Tally = { nudges: t.nudges, good: t.goodN, miss: t.missN, faced: t.faced, braced: t.braced, fall: t.fall, power: t.power, straight: t.straight };
    const won = starsOf(score, current.level, current.mode);
    const base = {
      score, palm, stars: won, maxStars: info.maxStars, power: t.power, straight: t.straight, good: t.goodN, nudges: t.nudges, bestCombo: t.bestCombo,
      faced: t.faced, braced: t.braced, move: d.move, waveFaced: t.waveFaced, waveBraced: t.waveBraced, fall: fallLine(t.fall, palm), record,
      fresh: fresh.length ? `নতুন পদক: ${fresh.map(id => BADGES[id]).join(", ")}` : "",
    };
    const spun: Omit<Shared, "name"> = { seed: current.seed, level: current.level, score, palm, badges: earned, mode: current.mode, old: 0 };
    setLast(spun);
    setVersus(rival ? versusLine(score, rival.score, rival.name) : "");
    if (won > 0) {
      const next = recordLevel(live.current.stars, current.level, won);
      live.current.stars = next; setStars(next); write(LEVELS_KEY, JSON.stringify(next));
      const opened = afterClear(live.current.unlock, current.level);
      if (opened !== live.current.unlock) { live.current.unlock = opened; setUnlock(opened); write(UNLOCK_KEY, String(opened)); }
      const near = nextLine(score, current.level, current.mode) || (won === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : "");
      setResult({ ...base, won: true, kicker: `লেভেল ${bn(current.level)} পার · ${d.name}`, title: "", line: rival ? versusLine(score, rival.score, rival.name) : clearLine(current.level), near });
      show("over");
      victory(d.world, won);
      if (won === 3 || isFinale(d)) confetti({ colors: ["#ffd166", "#b5441b", "#f4ead0", "#2f8a4c", "#2a6fb0"] });
    } else {
      setResult({ ...base, won: false, kicker: `লেভেল ${bn(current.level)} · ${d.name}`, title: `${bn(d.stars[0])} সেকেন্ড ঘুরলে পার`, line: lossTip(tally), near: nextLine(score, current.level, current.mode) });
      show("over");
      lose();
    }
  }

  /** Preview images only (`&og=1` on a link): the friend's spin as a finished end screen with its card. Saves nothing. */
  function demo(found: Shared) {
    const d = levelDef(found.level), earned = found.old ? 0 : starsOf(found.score, found.level, found.mode);
    setResult({
      won: earned > 0, kicker: `লেভেল ${bn(found.level)} পার · ${d.name}`, title: "", score: found.score, palm: found.palm, stars: earned, maxStars: 3,
      power: 0.92, straight: 0.88, good: 7, nudges: 9, bestCombo: 4, faced: 6, braced: 4, move: d.move, waveFaced: d.move ? 4 : 0, waveBraced: 3,
      fall: fallLine(1, found.palm), line: clearLine(found.level), near: "", record: "", fresh: "",
    });
    setLast({ seed: found.seed, level: found.level, score: found.score, palm: found.palm, badges: found.badges, mode: found.mode, old: found.old });
    top.current = createTop(found.seed, found.level, found.mode);
    top.current.phase = P_DONE; top.current.bonus = found.palm ? 50 : 0; view.current.endT = 1.1; view.current.spinLeft = 0.2;
    S.goTo(session.current, "over"); setScreen("over");
  }

  // ---- drawing ----
  function draw() {
    const v = view.current, t = top.current, s = session.current;
    if (!v.context) return;
    const now = performance.now() / 1000, dt = lastDraw.current ? Math.min(0.05, Math.max(0, now - lastDraw.current)) : 0;
    lastDraw.current = now;
    v.calm = live.current.slow || matchMedia("(prefers-reduced-motion: reduce)").matches;
    moveView(v, t, S.ticking(s) ? dt * (live.current.slow ? SLOW : 1) : 0);
    drawFrame(v, t, t.held);
    updateHud(t);
  }

  /** The seconds, the star track, the edges and the pad: written straight to the DOM only when a value changes. */
  function updateHud(t: Top) {
    const e = edge.current, root = rootRef.current, playing = session.current.screen === "play";
    const score = scoreOf(t);
    if (score !== e.score) {
      e.score = score;
      if (timeRef.current) timeRef.current.textContent = secs(score);
      const track = trackRef.current;
      if (track) {
        const marks = levelDef(live.current.run.level).stars;
        const fill = track.firstElementChild?.firstElementChild as HTMLElement | null;
        if (fill) fill.style.transform = `scaleX(${Math.min(1, score / 10 / (marks[2] * 1.08))})`;
        for (let i = 0; i < 3; i++) (track.children[i + 1] as HTMLElement | undefined)?.setAttribute("data-on", String(score >= marks[i] * 10));
      }
    }
    const next = !playing || t.phase !== P_SPIN ? "" : t.wobble >= 0.8 ? "danger" : t.wobble >= 0.55 ? "warn" : liftSafe(t) ? "lift" : "";
    if (next !== e.edge && root) { e.edge = next; root.dataset.edge = next; }
    if (t.phase !== e.phase && padRef.current) { e.phase = t.phase; padRef.current.dataset.phase = String(t.phase === P_DONE ? P_FALL : t.phase); }
  }

  useEffect(() => { if (screen === "play" && pendingCall.current) { const text = pendingCall.current; pendingCall.current = ""; say(text); } }, [screen]);

  const looping = screen === "play" && !player.paused;
  useGameLoop(step, draw, looping);

  // ---- size the stage to its box; pre-render the place's backdrop and the sprites ----
  const fieldShown = screen === "play" || screen === "over";
  useEffect(() => {
    if (!fieldShown) return;
    const box = fieldBox.current, target = fieldCanvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      const v = view.current, ratio = Math.min(2, window.devicePixelRatio || 1), layout = layoutFor(width, height);
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      v.context = fitCanvas(target, width, height);
      Object.assign(v, { width, height, ratio, horizon: layout.horizon, cx: layout.cx, cy: layout.cy, size: layout.size, world: def.world, level: run.level });
      v.bg = paintStage(def.world, run.level, width, height, layout.horizon, layout.cx, layout.cy, ratio, v.bg);
      v.sprite = topSprite(layout.size, ratio);
      v.things = makeThings(layout.size * 0.2, ratio);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    void document.fonts?.ready.then(size);
    return () => observer.disconnect();
  }, [fieldShown, run.level]);

  // ---- touches ----
  function tapNudge() {
    if (!S.canTap(session.current)) return;
    if (nudge(top.current) >= 0) handleEvents();
  }
  function tryLift() {
    if (!S.canTap(session.current)) return;
    if (lift(top.current) >= 0) handleEvents();
  }
  /** Let go of the wind-up: throws if it was wound long enough. */
  function letGo() {
    const result = endWind(top.current);
    if (result === 1) handleEvents();
    else if (result === 0) say(CALL.short);
  }

  function measure(samples: Sample[], height: number) {
    const first = samples[0], last = samples[samples.length - 1];
    const dx = (last.x - first.x) / height, dy = (last.y - first.y) / height, seconds = (last.t - first.t) / 1000;
    const from = samples.find(sample => last.t - sample.t <= 120) ?? first;
    const tail = from === last ? null : { dy: (last.y - from.y) / height, seconds: (last.t - from.t) / 1000 };
    // How far the path strays from the straight line between its ends, as a share of its length.
    const length = Math.hypot(dx, dy) || 1;
    let wiggle = 0;
    for (const sample of samples) wiggle = Math.max(wiggle, Math.abs((sample.x - first.x) / height * dy - (sample.y - first.y) / height * dx) / length);
    return { dx, dy, seconds, tail, wiggle: wiggle / length };
  }

  /** A finger on the stage: in the hand it starts a pull; while it spins every touch is a nudge. */
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || !event.isPrimary || session.current.screen !== "play") return;
    // A press that brings the window back only wakes the round: it is never a throw or a nudge.
    if (!session.current.focused) { engaged(); return; }
    event.preventDefault();
    if (!S.canTap(session.current)) return;
    const t = top.current;
    if (t.phase === P_SPIN) { tapNudge(); return; }
    if (t.phase !== P_READY || t.winding) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ }
    pull.current = { id: event.pointerId, samples: [{ x: event.clientX, y: event.clientY, t: event.timeStamp }], ticks: 0 };
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = pull.current;
    if (!current || current.id !== event.pointerId) return;
    current.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
    if (current.samples.length > 40) current.samples.splice(1, 1);
    const height = fieldBox.current?.clientHeight || 1, { dy } = measure(current.samples, height);
    view.current.drag = Math.max(0, Math.min(1, dy / 0.5));
    // A tick for every bit of string that pays out.
    const ticks = Math.floor(Math.max(0, dy) / 0.05);
    if (ticks > current.ticks) { current.ticks = ticks; windTick(ticks, Math.min(1, dy / 0.5)); }
  }
  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = pull.current;
    if (!current || current.id !== event.pointerId) return;
    pull.current = null;
    current.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
    const { dx, dy, seconds, tail, wiggle } = measure(current.samples, fieldBox.current?.clientHeight || 1);
    const thrown = S.canTap(session.current) ? swipeThrow(dx, dy, seconds, tail, wiggle) : null;
    if (thrown && throwTop(top.current, thrown.power, thrown.straight)) handleEvents();
    else { view.current.drag = 0; if (S.canTap(session.current)) say(dy < -0.05 ? CALL.up : CALL.pull); }
  }
  function onCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (pull.current && pull.current.id === event.pointerId) { pull.current = null; view.current.drag = 0; }
  }

  /** The big pad under the stage: hold to wind in the hand, tap to nudge while it spins. */
  function onMainDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button > 0 || !event.isPrimary || session.current.screen !== "play") return;
    event.stopPropagation(); event.preventDefault();
    if (!session.current.focused) { engaged(); return; }
    if (!S.canTap(session.current)) return;
    const t = top.current;
    if (t.phase === P_READY) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ }
      beginWind(t);
    } else if (t.phase === P_SPIN) tapNudge();
  }
  function onMainUp(event: ReactPointerEvent<HTMLButtonElement>) { event.stopPropagation(); event.currentTarget.blur(); letGo(); }
  /** The player's pause sends this to a finger still holding: the wind-up is dropped, nothing is thrown. */
  function onMainCancel(event: ReactPointerEvent<HTMLButtonElement>) { event.stopPropagation(); releaseInput(top.current); }
  function onLiftDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button > 0 || !event.isPrimary) return;
    event.stopPropagation(); event.preventDefault();
    if (!session.current.focused) { engaged(); return; }
    tryLift();
  }

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(MODE_KEY, next); setRun(current => ({ ...current, mode: next })); }
  function start() {
    const f = live.current.friend, fromFriend = f && f.level === run.level && f.seed === run.seed;
    if (!read(INTRO_KEY) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode });
  }
  function storyDone() { write(INTRO_KEY, "1"); begin({ ...run, mode }); }
  function openSheet() { away(() => S.openSheet(session.current)); setSheet(true); }
  function closeSheet() { setSheet(false); back(() => S.closeSheet(session.current)); }
  /** A level from the list. The friend's own level keeps the friend's floor, so "একই উঠান" stays true. */
  function pickLevel(level: number) {
    const f = live.current.friend;
    if (!playable(level, live.current.unlock, live.current.stars, f?.level)) return;
    S.closeSheet(session.current);
    begin({ seed: seedFor(f, level, mode, newSeed()), level, mode });
  }

  const won = result?.won ?? false;
  const nextLevel = run.level < LEVEL_COUNT && playable(run.level + 1, unlock, stars, friend?.level) ? run.level + 1 : 0;
  const choices: Choice[] = [
    ...(won && nextLevel ? [{ label: "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode }) }] : []),
    { label: "আবার খেলো", run: () => begin(again(run)) },
    { label: "সব লেভেল", run: openSheet },
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key, lower = key.toLowerCase();
      if (s.paused || s.sheet) return;
      if (lower === "p" && s.screen === "play") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ") && !event.repeat) { event.preventDefault(); start(); return; }
      if (s.screen === "play") {
        if (key === " " || key === "Enter") {
          event.preventDefault();
          if (S.keyDown(s, event.repeat)) {
            const t = top.current;
            if (t.phase === P_READY) beginWind(t); else if (t.phase === P_SPIN) tapNudge();
          }
        } else if (key === "ArrowUp" || lower === "h") {
          event.preventDefault();
          if (!event.repeat) tryLift();
        }
        return;
      }
      if (s.screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      S.keyUp(session.current);
      if (session.current.screen === "play" && S.ticking(session.current)) letGo();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  const total = totalStars(stars), suggest = recommended(unlock, stars);
  const marks = def.stars, full = marks[2] * 1.08;
  return (
    <div className="lt-wrap">
      <div className="lt" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={def.world} data-edge="">
        {screen === "title" && <TitleScreen level={run.level} mode={mode} friend={friend} stars={total} onStart={start} onMode={setMode} onLevels={openSheet} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {fieldShown && (
          <>
            <div className="lt-hud">
              <p className="lt-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}{isFinale(def) && <em>{def.move}</em>}</p>
              <div className="lt-track" ref={trackRef} aria-hidden="true">
                <i><span /></i>
                {marks.map((mark, index) => <b key={index} style={{ left: `${Math.min(100, mark / full * 100)}%` }} data-on="false"><Star /></b>)}
              </div>
              <p className="lt-time" aria-label="কত সেকেন্ড ঘুরছে"><b ref={timeRef}>০.০</b><span>সেকেন্ড</span></p>
            </div>
            <div className="lt-board" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={event => event.preventDefault()}>
              <div className="lt-field" ref={fieldBox}>
                <canvas ref={fieldCanvas} role="img" aria-label={`${stageLabel(run.level)}: ঘুরন্ত লাটিম। টলতে দেখলে বিন্দু সবুজ মাথায় এলে টোকা দাও।`} />
                <i className="lt-edge-warn" aria-hidden="true" /><i className="lt-edge-danger" aria-hidden="true" /><i className="lt-edge-lift" aria-hidden="true" />
              </div>
              {screen === "play" ? (
                <>
                  <p className="lt-call" ref={callRef} role="status" aria-live="polite" />
                  <div className="lt-controls" ref={padRef} data-phase="0">
                    <button type="button" className="lt-main" onPointerDown={onMainDown} onPointerUp={onMainUp} onPointerCancel={onMainCancel} onLostPointerCapture={onMainCancel} onContextMenu={event => event.preventDefault()}>
                      <span className="lt-main-ready"><Coil />চেপে ধরো, ছেড়ে দাও</span>
                      <span className="lt-main-spin"><Tap />টোকা দাও</span>
                      <span className="lt-main-fall">…</span>
                    </button>
                    {lifting > 0 && (
                      <button type="button" className="lt-lift" data-safe={lifting === 1} onPointerDown={onLiftDown} onClick={event => { if (event.detail === 0) tryLift(); }}>
                        হাতে তোলো <small>{lifting === 1 ? "+৫ সেকেন্ড, নিরাপদ" : "বেশি টলছে, পড়বে"}</small>
                      </button>
                    )}
                  </div>
                </>
              ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={last ? toCard : null} />}
            </div>
          </>
        )}
        {sheet && <LevelSheet stars={stars} unlock={unlock} friendLevel={friend?.level ?? 0} current={run.level} next={suggest} mode={mode} owned={owned} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {last && screen === "over" && <ResultCard key={`${last.level}-${last.seed}-${last.score}`} shared={last} site={site} versus={versus} />}
    </div>
  );
}

const Tap = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="9" opacity=".45" /></svg>;
const Coil = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17c0-3 14-3 14-6M5 12c0-3 14-3 14-6M7 20h10" /></svg>;
