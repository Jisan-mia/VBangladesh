"use client";
// IP: what we avoided — no racket or shuttle brand, no real player, club, tournament or broadcast look, and no sports-game HUD; ours is a made-up গলি, a rooftop and a market lane at night, monkey caps and twelve invented neighbours.
// The game inside the shared player. Rules live in lib/ (match.ts and step.hot.ts play the match on a precomputed drag
// flight, session.ts decides the clock, the held finger and the wind loop); this file feeds touches in, draws, plays sounds
// and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, newSeed, recordLevel, sfx, shake, silenceScheduled, soundOn, totalStars, useGameLoop, useSlowMode, useSound, type LevelStars } from "../../../shared/game-kit";
import { parseShared, type Shared } from "../lib/challenge";
import { drawCourt, moveView, seedDust, trackShuttle } from "../lib/draw.hot";
import { isFinale, levelDef, LEVEL_COUNT, MODE_INFO, starsOf, toNextStar, DROP, FLOAT, JUMP, SMASH, type Mode } from "../lib/levels";
import { bn, clearLine, compareLine, lossLine, nearLine, pointCall, pointsOf, score, shotCall, theirShotCall } from "../lib/lines";
import {
  createMatch, press as pressMatch, release, windNow, DOWN, E_DONE, E_HELD, E_HIT, E_LAND, E_NET, E_SERVE, E_SPECIAL, E_TURN, E_WHIFF,
  HIGH, PERFECT, R_MISS, R_WHIFF, R_YOU_NET, R_YOU_OUT, SOFT, type Match,
} from "../lib/match";
import { afterClear, loadProgress, playable, readBest, readMode, recommended, BEST_KEY, INTRO_KEY, LEVELS_KEY, MODE_KEY, UNLOCK_KEY } from "../lib/progress";
import { layoutFor, paintCourt, paintFog } from "../lib/scene";
import * as S from "../lib/session";
import { air, clap, crack, farPing, netFlap, ping, sigh, swish, tick as dropTick, tune, victory, warn, whoosh, windLoop } from "../lib/sfx";
import { advance } from "../lib/step.hot";
import { makeView } from "../lib/view";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/** Fixed digit strings, so the HUD never builds one in a frame. */
const DIGITS = Array.from({ length: 400 }, (_, n) => bn(n));
/** A pull this far (CSS px) decides the shot: down is a smash, towards the net a drop, anything else a lift. */
const PULL = 14;
/** ধীরে খেলো runs the match at this speed. */
const SLOW = 0.8;

type Run = { seed: number; level: number; mode: Mode };
type Lost = { misses: number; nets: number; outs: number; whiffs: number };

export function BadmintonGame() {
  const rootRef = useRef<HTMLDivElement>(null), courtBox = useRef<HTMLDivElement>(null), courtCanvas = useRef<HTMLCanvasElement>(null);
  const callRef = useRef<HTMLParagraphElement>(null), usRef = useRef<HTMLElement>(null), themRef = useRef<HTMLElement>(null);
  const rallyRef = useRef<HTMLElement>(null), bossRef = useRef<HTMLParagraphElement>(null), scoreRef = useRef<HTMLDivElement>(null), stripRef = useRef<HTMLDivElement>(null);

  const session = useRef<S.Session>(S.createSession(true));
  const match = useRef<Match>(createMatch(1, 1));
  const view = useRef(makeView());
  const hud = useRef({ us: -1, them: -1, rally: -1, meter: -1, edge: "", aiming: -2, gust: 0 });
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const lost = useRef<Lost>({ misses: 0, nets: 0, outs: 0, whiffs: 0 });
  const gale = useRef<ReturnType<typeof windLoop> | null>(null);
  const carry = useRef(0);

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n" });
  const [mode, setModeState] = useState<Mode>("n");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState(false);
  const [stars, setStars] = useState<LevelStars>({});
  const [unlock, setUnlock] = useState(1);
  const [result, setResult] = useState<EndStats | null>(null);
  const [last, setLast] = useState<Omit<Shared, "name"> | null>(null);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const live = useRef({ slow, run, screen, stars, unlock, friend });
  live.current = { slow, run, screen, stars, unlock, friend };
  const def = levelDef(run.level);

  // ---- the wind loop: session.ts decides, this does ----
  const loops: S.Loops = {
    start: () => { gale.current?.stop(); gale.current = windLoop(); },
    stop: () => { gale.current?.stop(); gale.current = null; },
  };
  const sync = () => S.syncLoops(session.current, loops);

  /** A finger still down when play stops is the tap it was: the shot is played, and nothing stays held. */
  function letGo() {
    const m = match.current;
    if (m.pressAt >= 0) { release(m, HIGH); handleEvents(); }
    gesture.current = null; S.lift(session.current); view.current.aiming = -1;
  }
  function away(change: () => void) { change(); letGo(); sync(); }
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
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now(), levelDef(live.current.run.level).wind !== 0);
    setScreen(next);
    sync();
  }

  /** A tap or key on the game means this window has focus (a press on a background window brings it forward). */
  function engaged() { if (!session.current.focused && !document.hidden) back(() => S.focus(session.current)); }

  /** A fresh match on the play screen: the পাড়া's tune, then the first serve. */
  function begin(next: Run) {
    silenceScheduled();
    engaged();
    match.current = createMatch(next.seed, next.level, next.mode, live.current.slow);
    lost.current = { misses: 0, nets: 0, outs: 0, whiffs: 0 };
    Object.assign(hud.current, { us: -1, them: -1, rally: -1, meter: -1, edge: "", aiming: -2, gust: 0 });
    Object.assign(view.current, { flash: 0, streak: 0, bulge: 0, sigh: 0, shake: 0, tcount: 0, aiming: -1 });
    gesture.current = null; carry.current = 0;
    live.current.run = next;
    setRun(next); setResult(null); setSheet(false); S.closeSheet(session.current);
    show("play");
    say(levelDef(next.level).teach);
    tune(levelDef(next.level).world);
    rootRef.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** The same level again: a friend's seed stays (so the comparison holds), anything else gets a fresh match. */
  function again(current: Run): Run {
    const f = live.current.friend;
    const rival = f && f.level === current.level && f.seed === current.seed && f.mode === current.mode;
    return { ...current, seed: rival ? current.seed : newSeed() };
  }

  // ---- first load: saved progress (migrated once), a friend's link, the remembered mode ----
  useEffect(() => {
    setSite(window.location.host);
    const s = session.current;
    s.sound = soundOn(); s.focused = document.hasFocus(); s.visible = !document.hidden;
    view.current.calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = loadProgress(read(LEVELS_KEY), read(UNLOCK_KEY));
    if (progress.write) { write(LEVELS_KEY, progress.write.levels); write(UNLOCK_KEY, progress.write.unlock); }
    setStars(progress.stars); setUnlock(progress.unlock);
    live.current.stars = progress.stars; live.current.unlock = progress.unlock;
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
        else if (!first) show("title");
      } else if (first) {
        const next = { seed: newSeed(), level: recommended(progress.unlock, progress.stars), mode: chosen };
        setRun(next); live.current.run = next;
      }
    };
    readLink(true);
    const onHash = () => readLink(false);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the match; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __badminton: { match: () => match.current, session: () => session.current, view: () => view.current } });
  }, []);

  // ---- the site-wide sound switch: off cuts queued notes; on starts a fresh wind (never the stub made while muted) ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { gale.current = null; silenceScheduled(); } sync(); }, [sound]);

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

  // ---- calls, sounds and juice from the match's events ----
  function say(text: string) {
    const call = callRef.current;
    if (!call || !text) return;
    call.textContent = text;
    call.classList.remove("gb-in"); void call.offsetWidth; call.classList.add("gb-in");
  }

  function handleEvents() {
    const m = match.current, v = view.current, short = m.def.rival.short;
    for (let e = 0; e < m.evN; e++) {
      const type = m.evType[e], a = m.evA[e], b = m.evB[e];
      if (type === E_SERVE) { if (a === 1) farPing(); else ping(); swish(); }
      else if (type === E_HIT && a === 0) {
        const kind = b & 15, gold = (b >> 4) === PERFECT;
        if (kind === SMASH) { crack(gold); v.streak = 1; if (gold && !v.calm) v.shake = 1; }
        else if (kind === DROP) dropTick();
        else ping(gold);
        swish(kind === SMASH);
        if (gold) { v.flash = 1; v.fx = m.fromX; v.fy = m.fromY; }
        say(shotCall(kind, gold));
      } else if (type === E_HIT) {
        farPing(b === SMASH || b === JUMP); swish(b === SMASH || b === JUMP);
        if (b === SMASH || b === JUMP || b === FLOAT) say(theirShotCall(b));
      } else if (type === E_WHIFF) { air(); say("ফাঁকা গেল। রিং ছোট হওয়া পর্যন্ত থামো।"); }
      else if (type === E_NET) { netFlap(); v.bulge = 1; }
      else if (type === E_LAND) {
        say(pointCall(a, b, short, m.kind));
        if (a === 0) clap();
        else {
          sigh(); v.sigh = 1; shake(scoreRef.current);
          const l = lost.current;
          if (b === R_YOU_NET) l.nets++; else if (b === R_YOU_OUT) l.outs++; else if (b === R_WHIFF) l.whiffs++; else if (b === R_MISS) l.misses++;
        }
      } else if (type === E_SPECIAL) say(a === JUMP ? `${m.def.move}! চেপে তুলে দাও।` : a === FLOAT ? `${m.def.move}! ছায়াটা দেখো।` : `${m.def.move}: প্রথমটা উঁচু।`);
      else if (type === E_HELD) { sfx.coin(); say("ঠেকিয়ে দিলে।"); }
      else if (type === E_TURN) say("বাতাস ঘুরল।");
      else if (type === E_DONE) { m.evN = 0; finish(); return; }
    }
    m.evN = 0;
  }

  // ---- one step: the session decides, the match moves, events become sounds ----
  function step() {
    const s = session.current, m = match.current;
    if (!S.step(s) || m.winner >= 0) return;
    carry.current += live.current.slow ? SLOW : 1;
    while (carry.current >= 1) {
      carry.current -= 1;
      advance(m);
      if (m.evN) handleEvents();
      if (m.winner >= 0) return;
    }
    // The match let go of a finger that held too long (the tap it was): the gesture is over.
    if (s.held && m.pressAt < 0) { s.held = false; gesture.current = null; view.current.aiming = -1; }
    trackShuttle(view.current, m);
    const w = windNow(m);
    gale.current?.set(Math.min(1, Math.abs(w) / 55));
    sync();
  }

  function finish() {
    const m = match.current, current = live.current.run, d = m.def, st = m.stats, info = MODE_INFO[current.mode];
    const f = live.current.friend, rival = f && f.level === current.level && f.seed === current.seed && f.mode === current.mode ? f : null;
    const base = { us: m.us, them: m.them, hits: st.hits, perfect: st.perfect, longest: st.longest, smashWins: st.smashWins, dropWins: st.dropWins, leftOut: st.leftOut, faults: st.faults, move: d.move, specials: st.specials, held: st.held, maxStars: info.maxStars };
    const best = readBest(read(BEST_KEY));
    if (st.longest > best) write(BEST_KEY, String(st.longest));
    const record = st.longest > best && best > 0 ? `এই ফোনে নতুন লম্বা র‍্যালি: ${bn(st.longest)} বার।` : best > 0 ? `এই ফোনে সবচেয়ে লম্বা র‍্যালি ${bn(Math.max(best, st.longest))} বার।` : "";
    if (m.winner === 0) {
      const earned = starsOf(m.them, current.level, current.mode);
      const next = recordLevel(live.current.stars, current.level, earned);
      live.current.stars = next; setStars(next); write(LEVELS_KEY, JSON.stringify(next));
      const opened = afterClear(live.current.unlock, current.level);
      if (opened !== live.current.unlock) { live.current.unlock = opened; setUnlock(opened); write(UNLOCK_KEY, String(opened)); }
      const gap = toNextStar(m.them, current.level, current.mode);
      const near = gap > 0 ? nearLine(gap, earned + 1) : earned === info.maxStars && info.maxStars < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।" : "";
      setResult({ ...base, won: true, kicker: `লেভেল ${bn(current.level)} পার · ${d.rival.name}`, title: "", stars: earned,
        line: rival ? compareLine({ them: m.them, rally: st.longest }, rival, rival.name) : clearLine(current.level), near, record });
      setLast({ level: current.level, seed: current.seed, them: m.them, rally: Math.max(1, st.longest), mode: current.mode, old: 0 });
      show("over");
      victory(d.world, earned);
      if (earned === 3 || isFinale(d)) confetti({ colors: ["#ffd23f", "#e07a2e", "#f3ede1", d.rival.shirt, "#c2571a"] });
    } else {
      setResult({ ...base, won: false, kicker: `লেভেল ${bn(current.level)} · ${d.rival.name}`, title: `${d.rival.short} জিতল ${score(d.points, m.us)}`, stars: 0,
        line: lossLine(d.points, m.us, lost.current, d.wind !== 0, d.fog),
        near: rival ? `${rival.name || "বন্ধু"} এই ম্যাচ ${score(pointsOf(rival), rival.them)} পয়েন্টে জিতেছিল।` : "", record });
      setLast(null);
      show("over");
      sfx.lose();
    }
  }

  /** Preview images only (`&og=1` on a link): the friend's result as a finished end screen with its card. Saves nothing. */
  function demo(found: Shared) {
    const d = levelDef(found.level), points = pointsOf(found);
    setResult({ won: true, kicker: `লেভেল ${bn(found.level)} পার · ${d.rival.name}`, title: "", us: points, them: found.them, stars: found.old ? 0 : starsOf(found.them, found.level, found.mode), maxStars: 3,
      hits: found.rally, perfect: found.rally, longest: found.rally, smashWins: 0, dropWins: 0, leftOut: 0, faults: 0, move: "", specials: 0, held: 0, line: clearLine(found.level), near: "", record: "" });
    setLast({ level: found.level, seed: found.seed, them: found.them, rally: found.rally, mode: found.mode, old: found.old });
    S.goTo(session.current, "over"); setScreen("over");
  }

  // ---- drawing ----
  function draw() {
    const v = view.current, m = match.current, s = session.current;
    if (!v.context) return;
    const now = performance.now() / 1000, dt = lastDraw.current ? Math.min(0.05, Math.max(0, now - lastDraw.current)) : 0;
    lastDraw.current = now;
    v.calm = live.current.slow || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const w = windNow(m);
    moveView(v, S.ticking(s) ? dt : 0, w);
    gustAhead(m, v);
    drawCourt(v, m, s.held, w);
    updateHud(m);
  }
  const lastDraw = useRef(0);

  /** A gust coming (within 0.8 s) or blowing: which way, and how strong. Shown as edge chevrons, with a whoosh as it starts. */
  function gustAhead(m: Match, v: ReturnType<typeof makeView>) {
    const a = m.air;
    let sign = 0, pow = 0;
    for (let i = 0; i < a.gusts; i++) {
      const start = a.gustAt[i], end = start + a.gustLen[i];
      if (m.clock > start - 0.8 && m.clock < end) { sign = a.gustPow[i] > 0 ? 1 : -1; pow = m.clock < start ? 0.4 : 1; break; }
    }
    if (sign && !hud.current.gust && S.ticking(session.current)) whoosh();
    hud.current.gust = sign;
    v.gust = sign; v.gustPow = pow;
  }

  /** The corner HUD, the strip and the edges, written straight to the DOM only when a value changes. */
  function updateHud(m: Match) {
    const h = hud.current, root = rootRef.current;
    if (h.us !== m.us && usRef.current) { h.us = m.us; usRef.current.textContent = DIGITS[m.us]; }
    if (h.them !== m.them && themRef.current) { h.them = m.them; themRef.current.textContent = DIGITS[m.them]; }
    if (h.rally !== m.rally && rallyRef.current) { h.rally = m.rally; rallyRef.current.textContent = DIGITS[Math.min(399, m.rally)]; }
    const full = m.def.special !== null && (m.meter >= 1 || m.triple > 0);
    const meter = Math.round(m.meter * 20);
    if (bossRef.current && (meter !== h.meter)) {
      if (full && h.meter < 20 && h.meter >= 0) warn();
      h.meter = meter;
      bossRef.current.style.setProperty("--fill", Math.min(1, meter * 0.05).toFixed(3));
      bossRef.current.dataset.full = full ? "1" : "";
    }
    const playing = session.current.screen === "play";
    const edge = !playing ? "" : full ? "special" : m.them === m.def.points - 1 ? "match" : "";
    if (edge !== h.edge && root) { h.edge = edge; root.dataset.edge = edge; }
    const aiming = view.current.aiming;
    if (aiming !== h.aiming && stripRef.current) { h.aiming = aiming; stripRef.current.dataset.aim = aiming < 0 ? "" : String(aiming); }
  }

  const looping = screen === "play" && !player.paused;
  useGameLoop(step, draw, looping);

  // ---- size the court to its box; pre-render the পাড়া's layers ----
  const courtShown = screen === "play" || screen === "over";
  useEffect(() => {
    if (!courtShown) return;
    const box = courtBox.current, target = courtCanvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      const v = view.current, ratio = Math.min(2, window.devicePixelRatio || 1);
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      v.context = fitCanvas(target, width, height);
      Object.assign(v, { width, height, ratio, layout: layoutFor(width, height), world: def.world });
      v.back = paintCourt(def.world, width, height, ratio, v.back);
      v.fog = def.fog ? paintFog(width, height, ratio, v.fog) : null;
      seedDust(v);
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    return () => observer.disconnect();
  }, [courtShown, run.level]);

  // ---- touches ----
  /** The finger touched: the swing is judged now. It holds the shuttle until the touch says tap or pull. */
  function touch() {
    const s = session.current, m = match.current;
    if (!S.canSwing(s)) return false;
    const r = pressMatch(m);
    if (r === 1) { S.press(s); view.current.aiming = HIGH; return true; }
    if (r === 2) handleEvents();
    return false;
  }
  function decide(kind: number) {
    const m = match.current;
    gesture.current = null; S.lift(session.current); view.current.aiming = -1;
    if (m.pressAt < 0) return;
    release(m, kind);
    handleEvents();
  }
  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || !event.isPrimary || session.current.screen !== "play") return;
    // A press that brings the window back only wakes the match: it is never a swing.
    if (!session.current.focused) { engaged(); return; }
    if (!touch()) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ }
  }
  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (dx * dx + dy * dy < PULL * PULL) return;
    decide(dy > Math.abs(dx) ? DOWN : dx > Math.abs(dy) * 0.7 ? SOFT : HIGH);
  }
  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (g && g.id === event.pointerId) decide(HIGH);
  }

  // ---- choices ----
  function setMode(next: Mode) { setModeState(next); write(MODE_KEY, next); setRun(current => ({ ...current, mode: next })); sfx.tap(); }
  function start() {
    sfx.tap();
    const f = live.current.friend, fromFriend = f && f.level === run.level && f.seed === run.seed;
    if (!read(INTRO_KEY) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode });
  }
  function storyDone() { write(INTRO_KEY, "1"); begin({ ...run, mode }); }
  function openSheet() { away(() => S.openSheet(session.current)); setSheet(true); }
  function closeSheet() { setSheet(false); back(() => S.closeSheet(session.current)); }
  function pickLevel(level: number) {
    const f = live.current.friend;
    if (!playable(level, live.current.unlock, live.current.stars, f?.level)) return;
    const rival = f && f.level === level && f.mode === mode ? f : null;
    S.closeSheet(session.current);
    begin({ seed: rival ? rival.seed : newSeed(), level, mode });
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
        const kind = key === " " || key === "Enter" || key === "ArrowUp" ? HIGH : key === "ArrowDown" || lower === "s" ? DOWN : key === "ArrowRight" || lower === "d" ? SOFT : -1;
        if (kind < 0) return;
        event.preventDefault();
        if (!event.repeat && touch()) decide(kind);
        return;
      }
      if (s.screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : lower === "r" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  const total = totalStars(stars), suggest = recommended(unlock, stars);
  const finale = isFinale(def);
  return (
    <div className="gb-wrap">
      <div className="gb" ref={rootRef} data-slow={slow || undefined} data-screen={screen} data-world={def.world} data-edge="">
        {screen === "title" && <TitleScreen level={run.level} mode={mode} friend={friend} stars={total} onStart={start} onMode={setMode} onLevels={openSheet} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {courtShown && (
          <>
            <div className="gb-hud">
              <p className="gb-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
              {finale ? (
                <p className="gb-boss" ref={bossRef} aria-hidden="true"><b>{def.rival.short}</b><span className="gb-meter"><i /></span><em>{def.move} আসছে</em></p>
              ) : (
                <p className="gb-rally" aria-hidden="true">র‍্যালি <b ref={rallyRef}>০</b></p>
              )}
              <div className="gb-score" ref={scoreRef} aria-hidden="true">
                <span className="gb-me"><i />তুমি <b ref={usRef}>০</b></span>
                <span className="gb-them"><b ref={themRef}>০</b> {def.rival.short}<i style={{ background: def.rival.shirt }} /></span>
              </div>
            </div>
            <div className="gb-board" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp} onContextMenu={event => event.preventDefault()}>
              <div className="gb-court" ref={courtBox}>
                <canvas ref={courtCanvas} role="img" aria-label={`শীতের রাতে ব্যাডমিন্টন: বাঁয়ে তুমি, ডানে ${def.rival.name}। ${bn(def.points)} পয়েন্টে খেলা।`} />
              </div>
              {screen === "play" ? (
                <>
                  <p className="gb-call" ref={callRef} role="status" aria-live="polite" />
                  <div className="gb-strip" ref={stripRef} data-aim="" aria-hidden="true">
                    <span data-shot="0"><Tap />চাপো: উঁচু</span>
                    {run.level >= 2 && <span data-shot="1" data-new={run.level === 2 || undefined}><Pull dir="down" />নিচে টানো: স্ম্যাশ</span>}
                    {run.level >= 3 && <span data-shot="2" data-new={run.level === 3 || undefined}><Pull dir="right" />জালের দিকে: ড্রপ</span>}
                  </div>
                </>
              ) : result && <EndScreen stats={result} slow={slow} choices={choices} onCard={result.won && last ? toCard : null} />}
            </div>
          </>
        )}
        {sheet && <LevelSheet stars={stars} unlock={unlock} friendLevel={friend?.level ?? 0} current={run.level} next={suggest} mode={mode} onMode={setMode} onPick={pickLevel} onClose={closeSheet} />}
      </div>
      {last && screen === "over" && <ResultCard key={`${last.level}-${last.seed}-${last.them}`} shared={last} site={site} />}
    </div>
  );
}

const Tap = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="9" opacity=".45" /></svg>;
const Pull = ({ dir }: { dir: "down" | "right" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={dir === "right" ? { transform: "rotate(-90deg)" } : undefined}>
    <circle cx="12" cy="5" r="3" /><path d="M12 9v11M7 15l5 5 5-5" />
  </svg>
);
