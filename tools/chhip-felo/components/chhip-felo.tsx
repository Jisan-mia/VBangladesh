"use client";
// IP: what we avoided — no fishing game's name, mascot, lure shop, reel UI or fish art; our own bamboo rod, শোলার ফাতনা,
// Bangladeshi fish drawn in code, and sounds made in code. No hooks shown in a fish's mouth, no gore.
// The game inside the shared player. Rules live in lib/ (step.hot.ts steps the trip, session.ts decides input and the hum);
// this file feeds input, draws, plays sounds and swaps the screens. It keeps no timers: celebrations are scheduled tones.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, newSeed, sfx, silenceScheduled, soundOn, totalStars, useGameLoop, useLevels, useSlowMode, useSound } from "../../../shared/game-kit";
import { bossWord, buildLayers, fishSprite, makeFx, tagSprite, WORD, xOf, yOf, type Fx, type Layers } from "../lib/art";
import { parseShared, SLUG, type Shared } from "../lib/challenge";
import { drawFrame, pop, resetFx, ripple } from "../lib/draw.hot";
import { afterClear, bossOf, isMode, LEVEL_COUNT, levelDef, MODE_INFO, playable, readStars, readUnlock, recommended, starsOf, WORLDS, type Mode } from "../lib/levels";
import { bn, bossAway, compareLine, HUSH_LINE, humanLine, MISS_LINES, nearLine, PHASE_LINES, SHORT_LINE, weightText, worldName } from "../lib/lines";
import * as S from "../lib/session";
import * as sound from "../lib/sfx";
import { addCatch, albumCount, FISH, parseAlbum, parseTrophies, traitWords, type Album, type Trophies } from "../lib/species";
import { stepTrip } from "../lib/step.hot";
import { baitsLeft, basketGrams, biggestOf, createTrip, E, MISS, P, TRICK, type Trip } from "../lib/trip";
import { AlbumSheet } from "./album-sheet";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { Story } from "./story";
import { TitleScreen } from "./title-screen";

const KEYS = {
  levels: `ektukhani-levels-${SLUG}`, unlock: `ektukhani-unlock-${SLUG}`, album: `ektukhani-album-${SLUG}`, trophies: `ektukhani-trophies-${SLUG}`,
  mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}`, best: (level: number) => `ektukhani-best-${SLUG}-l${level}`,
};
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: this visit only */ } };
/** ধীরে খেলো feeds the trip this much of each step: the same water, slower. */
const SLOW_SPEED = 0.65;

type Run = { seed: number; level: number; mode: Mode };
type Hud = { baits: number; spare: number; catches: number; grams: number; notches: number };
type Note = { text: string; miss: boolean } | null;
type Result = { stats: EndStats; shared: Omit<Shared, "name"> };

export function ChhipFeloGame() {
  const pond = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null);
  const layers = useRef<Layers | null>(null);
  const fx = useRef<Fx>(makeFx());
  const trip = useRef<Trip>(createTrip(1, 1));
  const session = useRef<S.Session>(S.createSession(true));
  const hum = useRef<ReturnType<typeof sound.hum> | null>(null);
  const seen = useRef({ edge: "", flash: 0, lastDraw: 0 });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [run, setRun] = useState<Run>({ seed: 1, level: 1, mode: "n" });
  const [hud, setHud] = useState<Hud>({ baits: 2, spare: 2, catches: 0, grams: 0, notches: 0 });
  const [ready, setReady] = useState(true);
  const [note, setNote] = useState<Note>(null);
  const [, setTick] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [sheet, setSheet] = useState<"levels" | "album" | null>(null);
  const [unlock, setUnlock] = useState(1);
  const [album, setAlbum] = useState<Album>({});
  const [trophies, setTrophies] = useState<Trophies>({});
  const [site, setSite] = useState("");
  const [mode, setModeState] = useState<Mode>("n");
  const [slow] = useSlowMode();
  const [soundIsOn] = useSound();
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const live = useRef({ slow, screen, run, unlock, friend });
  live.current = { slow, screen, run, unlock, friend };
  const def = levelDef(run.level), world = def.world, boss = bossOf(def);
  const bump = () => setTick(count => count + 1);

  // ---- the reel hum: session.ts decides, this does. A fresh loop every start, never a stub left from while muted. ----
  const humLoop: S.Hum = {
    start: () => { hum.current?.stop(); hum.current = sound.hum(); },
    stop: () => { hum.current?.stop(); hum.current = null; },
  };
  const sync = () => S.syncHum(session.current, trip.current, humLoop);

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current); sync(); },
    onRestart: () => { S.resume(session.current); if (live.current.screen === "play" || live.current.screen === "over") begin(live.current.run); else sync(); },
  });

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  const hudOf = (t: Trip): Hud => ({ baits: baitsLeft(t), spare: t.spare, catches: t.catches, grams: basketGrams(t), notches: t.bossLeft });

  /** A fresh level on the play screen, waiting for the first cast. */
  function begin(next: Run) {
    silenceScheduled();
    const fresh = createTrip(next.seed, next.level, next.mode);
    fresh.calm = live.current.slow;
    trip.current = fresh;
    resetFx(fx.current);
    seen.current.flash = 0;
    const nextBoss = bossOf(levelDef(next.level));
    if (layers.current && nextBoss) bossWord(layers.current, nextBoss.name);
    setRun(next); setHud(hudOf(fresh)); setReady(true); setNote(null); setResult(null); setSheet(null);
    show("play");
    sound.motif(levelDef(next.level).world);
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  // ---- first load: a friend's link, saved progress (migrated once), the album, the remembered mode ----
  useEffect(() => {
    const link = parseShared(window.location.hash);
    setFriend(link);
    setSite(window.location.host);
    session.current.sound = soundOn();
    const stars = readStars(read(KEYS.levels));
    const saved = readUnlock(read(KEYS.unlock), stars);
    if (saved.migrated) write(KEYS.unlock, String(saved.unlock));
    setUnlock(saved.unlock);
    setAlbum(parseAlbum(read(KEYS.album)));
    setTrophies(parseTrophies(read(KEYS.trophies)));
    const savedMode = read(KEYS.mode) ?? "n", chosen = isMode(savedMode) ? savedMode : "n";
    const playMode = link && !link.old ? link.mode : chosen;
    setModeState(playMode);
    const first = link ? { seed: link.seed, level: link.level, mode: playMode } : { seed: newSeed(), level: recommended(saved.unlock, stars), mode: chosen };
    setRun(first);
    trip.current = createTrip(first.seed, first.level, first.mode);
    setHud(hudOf(trip.current));
    return () => { humLoop.stop(); silenceScheduled(); };
  }, []);

  // A friend's link opened on a page that is already here (only the hash changes): back to the title with their water.
  useEffect(() => {
    const onHash = () => {
      const link = parseShared(window.location.hash);
      if (!link) return;
      silenceScheduled();
      setFriend(link);
      const next = { seed: link.seed, level: link.level, mode: link.old ? live.current.run.mode : link.mode };
      if (!link.old) setModeState(link.mode);
      setRun(next);
      trip.current = createTrip(next.seed, next.level, next.mode);
      setHud(hudOf(trip.current)); setResult(null); setSheet(null);
      show("title");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __chhip: { trip: () => trip.current, session: () => session.current, fx: () => fx.current, layers: () => layers.current } });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, soundIsOn); if (!soundIsOn) silenceScheduled(); sync(); }, [soundIsOn]);
  useEffect(() => { fx.current.slow = slow; trip.current.calm = slow; }, [slow]);

  // ---- away and back: release the hand, stop the hum; the player opens its menu ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); sync(); };
    const onVisibility = () => { if (document.hidden) S.hide(session.current); else S.show(session.current); sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- the pond scrolled off a desktop page: hands off and nothing moves until it's back ----
  useEffect(() => {
    const box = pond.current;
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => { S.setInView(session.current, entry.isIntersecting); sync(); }, { threshold: 0.2 });
    observer.observe(box);
    return () => { observer.disconnect(); S.setInView(session.current, true); };
  }, [screen === "play" || screen === "over"]);

  // ---- a choice screen: nothing moves behind it ----
  useEffect(() => { if (sheet) S.openSheet(session.current); else S.closeSheet(session.current); sync(); }, [sheet]);

  // ---- one step: input, rules, sound, juice ----
  function step(dt: number) {
    const s = session.current, t = trip.current;
    if (!S.ticking(s) || S.breathing(s, dt)) return;
    stepTrip(t, S.held(s), S.takePress(s), live.current.slow ? dt * SLOW_SPEED : dt);
    for (let i = 0; i < t.evCount; i++) onEvent(t, t.ev[i], t.evArg[i]);
    sync();
    if (hum.current && t.phase === P.REEL) sound.steerHum(hum.current, t.tension);
  }

  function onEvent(t: Trip, kind: number, arg: number) {
    const f = fx.current, L = layers.current, slowNow = live.current.slow;
    const atX = L ? xOf(L, t.side, t.landed) : 0, atY = L ? yOf(L, t.landed) : 0;
    switch (kind) {
      case E.CHARGE: sfx.tap(); setNote(null); break;
      case E.SHORT: setNote({ text: SHORT_LINE, miss: false }); break;
      case E.CAST: sound.swish(t.power); f.whip = 0.25; setReady(false); setNote(null); break;
      case E.LAND: sound.plop(); if (L) ripple(f, atX, atY, 1); break;
      case E.BOSS: sound.boss(); if (L) { pop(f, WORD.BOSS, atX, atY - 30); ripple(f, atX, atY, 2.2); } break;
      case E.NIBBLE: sound.nibble(); if (L) ripple(f, atX, atY, 0.35); break;
      case E.DIP: sound.dip(); if (L) { ripple(f, atX, atY, 1.5); ripple(f, atX, atY, 0.8); } break;
      case E.HUSH: sfx.tap(); setNote({ text: HUSH_LINE, miss: false }); return;
      case E.HOOK:
        sound.strike();
        if (L) { fishSprite(L, t.fish); pop(f, WORD.HOOK, atX, atY - 24); ripple(f, atX, atY, 1.2); }
        setNote(null);
        break;
      case E.TELL: sound.tell(); return;
      case E.SURGE: sound.thrash(); if (L) pop(f, WORD.SURGE, f.fishX, f.fishY - 22); return;
      case E.RUSH: sound.thrash(); if (L) pop(f, WORD.RUSH, f.fishX, f.fishY - 22); return;
      case E.JUMP: sound.leap(); f.leap = 0.6; f.leapX = f.fishX; f.leapY = f.fishY; if (L) pop(f, WORD.JUMP, f.fishX, f.fishY - 40); return;
      case E.RIDDEN: sfx.tick(); return;
      case E.NOTCH: sound.notch(); if (!slowNow) f.shake = 0.18; if (L) pop(f, WORD.NOTCH, f.fishX, f.fishY - 30); setHud(hudOf(t)); return;
      case E.CAUGHT: caught(t); break;
      case E.MISS:
        if (arg === MISS.SNAP || arg === MISS.LEAP || arg === MISS.TEAR) { sound.snap(); if (!slowNow) f.shake = 0.28; if (L) pop(f, WORD.SNAP, f.fishX || atX, (f.fishY || atY) - 24); }
        else if (arg === MISS.SNAG) { sfx.drop(); if (L) ripple(f, atX, atY, 0.6); }
        else { sound.slip(); if (L) pop(f, WORD.AWAY, atX, atY - 24); }
        seen.current.flash = 0.6;
        setNote({ text: t.isBoss ? `${MISS_LINES[arg]} ${bossAway(t.level)}` : MISS_LINES[arg], miss: true });
        setHud(hudOf(t));
        break;
      case E.NEXT: setNote(null); setHud(hudOf(t)); break;
      case E.WIN: case E.FAIL: finish(); return;
      default: return;
    }
    bump();
  }

  function caught(t: Trip) {
    const f = fx.current, L = layers.current, fish = FISH[t.fish];
    sound.caught(fish.rarity === 2 || t.isBoss);
    let tagNote = "";
    if (t.isBoss && t.boss) {
      const kept = parseTrophies(read(KEYS.trophies)), isNew = !kept[t.boss.id];
      kept[t.boss.id] = Math.max(kept[t.boss.id] ?? 0, t.grams);
      write(KEYS.trophies, JSON.stringify(kept)); setTrophies(kept);
      tagNote = isNew ? "প্রথমবার উঠল!" : "আবার উঠল!";
      confetti({ colors: ["#d6352b", "#ffd166", "#3fae5a", "#ffffff", "#4f8f78"] });
    } else {
      const added = addCatch(parseAlbum(read(KEYS.album)), t.fish, t.grams);
      write(KEYS.album, JSON.stringify(added.album)); setAlbum(added.album);
      tagNote = added.isNew ? "অ্যালবামে নতুন" : added.isRecord ? "এই মাছের নতুন রেকর্ড" : "";
    }
    if (L) {
      L.tag = tagSprite(L, t.isBoss && t.boss ? t.boss.name : fish.name, weightText(t.grams), tagNote);
      fishSprite(L, t.fish);
      pop(f, WORD.CAUGHT, f.fishX, f.fishY - 36);
      ripple(f, f.fishX, f.fishY, 1.8);
    }
    if (t.catches >= 2) sfx.combo(t.catches - 2);
    setHud(hudOf(t));
  }

  function finish() {
    const t = trip.current, { level, mode: played, seed } = live.current.run, d = levelDef(level), info = MODE_INFO[played];
    const won = t.won, earned = starsOf(won, t.lost, played), grams = basketGrams(t), big = biggestOf(t);
    const before = Number(read(KEYS.best(level))), hadBest = read(KEYS.best(level)) !== null && Number.isFinite(before);
    let best = "";
    if (won) {
      levels.record(level, earned);
      const nextUnlock = afterClear(live.current.unlock, level);
      if (nextUnlock !== live.current.unlock) { write(KEYS.unlock, String(nextUnlock)); setUnlock(nextUnlock); }
    }
    if (t.catches) {
      if (!hadBest || grams > before) write(KEYS.best(level), String(grams));
      best = !hadBest ? `এই ফোনে লেভেল ${bn(level)}-এর প্রথম ঝুড়ি।` : grams > before ? `নতুন রেকর্ড! আগে ছিল ${weightText(before)}।` : `এই ফোনে সেরা: ${weightText(before)}`;
    }
    const shared: Omit<Shared, "name"> = { seed, level, grams, catches: t.catches, big: big.fish, mode: played, lost: t.lost, won, boss: t.bossLanded, old: false };
    const rival = friend && !friend.old && friend.level === level && friend.seed === seed && friend.mode === played ? friend : null;
    setResult({
      stats: {
        level, title: d.title, world: worldName(level), won, boss: t.bossLanded && boss ? boss.name : "",
        catches: t.catches, need: d.need, grams, stars: earned, maxStars: info.maxStars,
        big: big.fish >= 0 ? (t.bossLanded && boss ? boss.name : FISH[big.fish].name) : "", casts: t.casts, lost: t.lost,
        fastest: Number.isFinite(t.fastest) ? t.fastest : 0, surges: t.surges, jumps: t.jumps, rushes: t.rushes,
        line: rival ? compareLine(grams, rival.grams, rival.name) : humanLine({ ...shared }), near: nearLine(level, won, t.catches, t.lost, played), best,
      },
      shared,
    });
    show("over");
    // Scheduled tones, so the player's pause and the next begin() (silenceScheduled) cut them.
    sound.finale(won, earned, won && (earned === 3 || t.bossLanded || (hadBest && grams > before)));
    if (won && earned === 3 && !t.bossLanded) confetti();
  }

  function draw() {
    const target = canvas.current, built = layers.current;
    if (!target || !built) return;
    const now = performance.now(), view = seen.current, t = trip.current;
    const moving = S.ticking(session.current) && screen === "play";
    const dt = moving && view.lastDraw ? Math.min(0.1, (now - view.lastDraw) / 1000) : 0;
    view.lastDraw = now;
    drawFrame(target.getContext("2d")!, built, t, fx.current, dt);
    // Danger and tells light the pond's edge, never its middle.
    if (view.flash > 0) view.flash -= dt;
    let edge = "";
    if (screen === "play") {
      if (view.flash > 0) edge = "lost";
      else if (t.phase === P.REEL) {
        const telling = t.warned && t.trick !== TRICK.NONE ? t.trick : TRICK.NONE;
        if (t.tension >= t.red - 0.03) edge = "snap";
        else if (t.t < t.rushEnd || telling === TRICK.RUSH) edge = "rush";
        else if (telling === TRICK.SURGE || t.t < t.surgeEnd) edge = fx.current.fishX < built.ww / 2 ? "surge-left" : "surge-right";
        else if (telling === TRICK.JUMP) edge = "jump";
        else if (t.slack > t.slipAfter * 0.3) edge = "slack";
      }
      if (!edge && baitsLeft(t) === 0 && t.phase !== P.OVER) edge = "last";
    }
    if (edge !== view.edge) { view.edge = edge; pond.current?.setAttribute("data-edge", edge); }
  }

  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the pond to its box, pre-render the water's layers ----
  useEffect(() => {
    const box = pond.current, target = canvas.current;
    if (!box || !target) return;
    const size = () => {
      const width = Math.floor(box.clientWidth), height = Math.floor(box.clientHeight);
      if (width < 60 || height < 60) return;
      target.style.width = `${width}px`; target.style.height = `${height}px`;
      fitCanvas(target, width, height);
      const built = buildLayers(width, height, Math.min(2, window.devicePixelRatio || 1), world, def.dark);
      if (boss) bossWord(built, boss.name);
      // Keep what the moment needs: the hooked fish's sprite and the caught fish's tag.
      const now = trip.current;
      if (now.phase === P.REEL || now.phase === P.CATCH) fishSprite(built, now.fish);
      built.tag = layers.current?.tag ?? null;
      layers.current = built;
      seen.current.lastDraw = 0;
      draw();
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    void document.fonts?.ready.then(size);
    return () => observer.disconnect();
  }, [screen === "play" || screen === "over", world, def.dark, boss]);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key;
      if (s.paused || sheet) return;
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
        if (S.isGameKey(key)) { event.preventDefault(); if (!event.repeat) S.keyDown(s); }
      } else if (screen === "title" && S.isGameKey(key) && !event.repeat && !target.closest?.("button:not(.cf-title-start), a")) {
        event.preventDefault(); start();
      } else if (screen === "over" && S.freshResultKey(s, event)) {
        const pick = key === "Enter" || key === " " || key === "1" ? 0 : key === "2" || key === "r" || key === "R" ? 1 : key === "3" ? 2 : -1;
        if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
      }
    };
    const up = (event: KeyboardEvent) => { if (S.isGameKey(event.key)) S.keyUp(session.current); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- the pond: a finger down aims or reels, lifting casts or gives line, a tap strikes ----
  function pondDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button")) return;
    event.preventDefault();
    if (!S.pointerDown(session.current, event.pointerId)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already gone */ }
  }
  const pondUp = (event: ReactPointerEvent<HTMLDivElement>) => S.pointerUp(session.current, event.pointerId);

  // ---- choices ----
  const isOpen = (level: number) => playable(level, unlock, levels.stars, friend?.level ?? 0);
  function setMode(next: Mode) { setModeState(next); write(KEYS.mode, next); setRun(current => ({ ...current, mode: next })); sfx.tap(); }
  const friendFits = (level: number, seed: number, played: Mode) => Boolean(friend && friend.level === level && friend.seed === seed && (friend.old || friend.mode === played));
  function start() {
    sfx.tap();
    const fromFriend = friendFits(run.level, run.seed, run.mode);
    if (!read(KEYS.intro) && !fromFriend) { show("intro"); return; }
    begin(fromFriend ? run : { ...run, mode });
  }
  function storyDone() { write(KEYS.intro, "1"); begin({ ...run, mode }); }
  function pickLevel(level: number) {
    if (!isOpen(level)) return;
    const rival = friend && friend.level === level && (friend.old || friend.mode === mode) ? friend : null;
    begin({ seed: rival ? rival.seed : newSeed(), level, mode });
  }
  const again = () => begin({ ...run, seed: friendFits(run.level, run.seed, run.mode) ? run.seed : newSeed() });
  const nextLevel = run.level < LEVEL_COUNT && isOpen(run.level + 1) ? run.level + 1 : 0;
  const won = Boolean(result?.stats.won);
  const choices: Choice[] = won && nextLevel
    ? [{ label: "পরের লেভেল", run: () => begin({ seed: newSeed(), level: nextLevel, mode }) }, { label: "আবার খেলো", run: again }, { label: "সব লেভেল", run: () => setSheet("levels") }]
    : [{ label: "আবার খেলো", run: again }, ...(mode !== "e" && !won ? [{ label: "সহজে খেলো", run: () => { setMode("e"); begin({ ...run, seed: newSeed(), mode: "e" }); } }] : []), { label: "সব লেভেল", run: () => setSheet("levels") }];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  // ---- words under the pond ----
  const t = trip.current;
  function statusLine() {
    if (note) return note.text;
    if (t.phase === P.AIM) return t.charging ? PHASE_LINES.charging : PHASE_LINES.aim;
    if (t.phase === P.FLY) return "ছিপ পড়ছে…";
    if (t.phase === P.WAIT) return t.t >= t.biteAt ? PHASE_LINES.under : PHASE_LINES.wait;
    if (t.phase === P.REEL) return `${t.isBoss && boss ? boss.name : FISH[t.fish].name} · ${traitWords(t.traits)}। ${PHASE_LINES.reel}`;
    if (t.phase === P.CATCH) return `${t.isBoss && boss ? boss.name : FISH[t.fish].name} ধরা পড়ল, ${weightText(t.grams)}। চাপলে পরের বার।`;
    return "";
  }

  const total = totalStars(levels.stars);
  const next = recommended(unlock, levels.stars);
  return (
    <div className="cf-wrap" ref={wrap}>
      <div className="cf" data-slow={slow || undefined} data-screen={screen} data-world={world}>
        {screen === "title" && <TitleScreen level={run.level} mode={mode} friend={friend} stars={total} fish={albumCount(album)} slow={slow} onStart={start} onMode={setMode} onLevels={() => setSheet("levels")} onAlbum={() => setSheet("album")} />}
        {screen === "intro" && <Story onDone={storyDone} />}
        {(screen === "play" || screen === "over") && (
          <>
            <div className="cf-hud">
              <div className="cf-hud-left">
                <p className="cf-badge"><b>লেভেল {bn(run.level)}</b>{run.mode !== "n" && <span>{MODE_INFO[run.mode].name}</span>}</p>
                <p className="cf-baits" aria-label={`আরও ${bn(hud.baits)}টা টোপ`}>
                  {Array.from({ length: hud.spare }, (_, at) => <i key={at} data-on={at < hud.baits} />)}
                </p>
              </div>
              {boss ? (
                <p className="cf-boss" aria-label={`${boss.name}: ${bn(hud.notches)} দাগ দম বাকি`}>
                  <b>{boss.name}</b>
                  <span>{Array.from({ length: boss.notches }, (_, at) => <i key={at} data-on={at < hud.notches} />)}</span>
                </p>
              ) : (
                <ol className="cf-roster" aria-label={`${bn(def.need)}টার মধ্যে ${bn(hud.catches)}টা মাছ`}>
                  {Array.from({ length: def.need }, (_, at) => <li key={at} data-done={at < hud.catches} />)}
                </ol>
              )}
              <div className="cf-hud-right">
                <p className="cf-weight"><b key={hud.catches} className={hud.catches ? "gx-pop" : ""}>{weightText(hud.grams)}</b></p>
                <p className="cf-count">{bn(hud.catches)}/{bn(def.need)} মাছ</p>
              </div>
            </div>
            <div className="cf-pond" ref={pond} data-edge="" onPointerDown={pondDown} onPointerUp={pondUp} onPointerCancel={pondUp} onLostPointerCapture={pondUp} onContextMenu={event => event.preventDefault()}>
              <canvas ref={canvas} className="cf-canvas" role="img" aria-label={`${WORLDS[world].name}, ছিপ আর ফাতনা। ${statusLine()}`} />
              <span className="cf-arrow" data-side="left" aria-hidden="true" />
              <span className="cf-arrow" data-side="right" aria-hidden="true" />
              <span className="cf-arrow" data-side="bottom" aria-hidden="true" />
              <span className="cf-arrow" data-side="top" aria-hidden="true" />
              {screen === "play" && ready && (
                <>
                  <p className="cf-intro"><b>{WORLDS[world].name} · {def.title}</b><span>{def.teach}</span></p>
                  <p className="cf-hint"><span className="cf-finger" aria-hidden="true" />চেপে ধরো, বৃত্ত বুদবুদে এলে ছাড়ো<small>কম্পিউটারে স্পেস চেপে ধরো</small></p>
                </>
              )}
              {screen === "over" && result && <EndScreen stats={result.stats} slow={slow} choices={choices} onCard={toCard} />}
            </div>
            <p className={`cf-status${note?.miss && screen === "play" ? " cf-miss" : ""}`} role="status" aria-live="polite">{screen === "play" ? statusLine() : ""}</p>
          </>
        )}
        {sheet === "levels" && <LevelSheet stars={levels.stars} isOpen={isOpen} next={next} current={run.level} mode={mode} onMode={setMode} onPick={pickLevel} onClose={() => setSheet(null)} />}
        {sheet === "album" && <AlbumSheet album={album} trophies={trophies} onClose={() => setSheet(null)} />}
      </div>
      {screen === "over" && result && <ResultCard result={result.shared} site={site} />}
    </div>
  );
}
