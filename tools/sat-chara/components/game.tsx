"use client";
// IP: what we avoided — no slingshot, birds, pigs, wooden towers or any genre leader's look or sounds; ours is a red rubber ball thrown by hand at seven flat clay pieces in a গলি, a school field and a courtyard, never at a person or an animal (মিঠু only catches).
// The game inside the shared player. The rules live in lib/ (step.hot.ts steps the round, session.ts decides input and the
// hum, physics.hot.ts is the world); this file feeds input, draws, plays sounds and swaps the screens.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, fitCanvas, recordLevel, sfx, silenceScheduled, soundOn, tone, totalStars, useGameLoop, useSlowMode, useSound, type LevelStars } from "../../../shared/game-kit";
import { CANCEL_PULL, nudge, pullAim, TAP_SLOP } from "../lib/aim";
import { parseShared } from "../lib/challenge";
import { drawFrame, tickView } from "../lib/draw.hot";
import { BALLS, createRound, finaleRound, flewHaat, launch, placeOf, starsOf, type Kind, type Round } from "../lib/game";
import { defOf, isLevel, LEVEL_COUNT, seedOf } from "../lib/levels";
import { oldSeedOf } from "../lib/old-levels";
import { canRebuild, downCount, simulate } from "../lib/physics.hot";
import {
  HAND_KEY, HAND_NAME, isHand, migrateStars, MIGRATED_KEY, OPEN_KEY, openAfter, playable, readHand, readOpen, recommended, STARS_KEY, type Hand,
} from "../lib/save";
import { paintSprites, SCENES } from "../lib/scene";
import * as S from "../lib/session";
import { advance, E_BACK, E_CLEAR, E_FAIL, E_SETTLE } from "../lib/step.hot";
import { makeView, puff, shakeBy } from "../lib/view";
import { bn, clearLine, compareLine, missLine, nearMissLine, recordLine, roundLabel, stackingLine, throwLine, type Claim } from "../lib/words";
import { H, STONES, W } from "../lib/world";
import { EndScreen, type Choice, type EndStats } from "./end-screen";
import { LevelSheet } from "./level-sheet";
import { ResultCard } from "./result-card";
import { bounce, catchSlap, clatter, fanfare, farDog, release, splat, stretch, thud, thwack, tuk, twang } from "./sound";
import { TitleScreen } from "./title-screen";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** The most extra scene shown above the lane on a tall phone. */
const MAX_EXTRA = 440;
const PITCH = [1, 1.12, 0.9];

type Hud = { down: number; ballsLeft: number; danger: boolean; stacking: boolean };
type Result = EndStats & { claim: Omit<Claim, "name"> };

export function SatCharaGame() {
  const lane = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const round = useRef<Round>(createRound("level", 1));
  const [view] = useState(makeView);
  const session = useRef<S.Session>(S.createSession(true));
  const hum = useRef<ReturnType<typeof stretch> | null>(null);
  const seen = useRef({ ballHits: 0, lands: 0, thuds: 0, bounces: 0, splats: 0, lineHits: 0, caught: 0, grazes: 0, down: 0, atLaunch: 0, caughtAtLaunch: 0, combo: 0, carry: 0 });
  const pull = useRef({ id: -1, sx: 0, sy: 0 });

  const [screen, setScreen] = useState<S.Screen>("title");
  const [kind, setKind] = useState<Kind>("level");
  const [level, setLevel] = useState(1);
  const [hand, setHandState] = useState<Hand>("n");
  const [stars, setStars] = useState<LevelStars>({});
  const [open, setOpen] = useState(1);
  const [friend, setFriend] = useState<Claim | null>(null);
  const [sheet, setSheet] = useState(false);
  const [hud, setHud] = useState<Hud>({ down: 0, ballsLeft: BALLS, danger: false, stacking: false });
  const [news, setNews] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [site, setSite] = useState("");
  const [slow] = useSlowMode();
  const [sound] = useSound();
  const live = useRef({ slow, screen, kind, level, hand, stars, open, friend });
  live.current = { slow, screen, kind, level, hand, stars, open, friend };
  view.calm = slow;
  const visit = friend && friend.kind === "level" ? friend.level : 0;

  // ---- the hum: session.ts decides, this does. A loop made while muted is a silent stub, so it is always made fresh. ----
  const loops: S.Loops = {
    start: () => { hum.current?.stop(); hum.current = stretch(); hum.current.set(view.aim.power); },
    stop: () => { hum.current?.stop(); hum.current = null; },
  };
  const sync = () => S.syncHum(session.current, loops);

  /** Lets go of a pull the game will never see the end of (blur, hide, the menu, the sheet). */
  function dropPull() {
    const id = pull.current.id;
    pull.current.id = -1;
    if (id >= 0) { try { lane.current?.releasePointerCapture(id); } catch { /* already gone */ } }
    if (view.mode === "pull") { view.mode = "sweep"; view.since = view.clock; }
  }

  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); dropPull(); sync(); },
    onResume: () => { S.resume(session.current, performance.now()); sync(); },
    onRestart: () => { S.resume(session.current, performance.now()); if (live.current.screen !== "title") begin(live.current.kind, live.current.level); else sync(); },
    onLevels: () => openList(),
  });

  /** Paints the cached art for the current round at the current size. */
  function repaint() {
    const r = round.current;
    if (!view.width) return;
    const k = view.scale * view.ratio;
    paintSprites(view.sprites, placeOf(r), r.world, r.kind === "old" ? oldSeedOf(r.level) : seedOf(r.level), k, view.extra);
  }

  function show(next: S.Screen) {
    S.goTo(session.current, next, performance.now());
    setScreen(next);
    sync();
  }

  /** A fresh round on the play screen, the ball in the hand. */
  function begin(nextKind: Kind, nextLevel: number) {
    silenceScheduled();
    dropPull();
    round.current = createRound(nextKind, nextLevel);
    Object.assign(seen.current, { ballHits: 0, lands: 0, thuds: 0, bounces: 0, splats: 0, lineHits: 0, caught: 0, grazes: 0, down: 0, atLaunch: 0, caughtAtLaunch: 0, combo: 0, carry: 0 });
    view.plife.fill(0); view.wob.fill(0); view.shout = 0; view.freeze = 0; view.follow = 0; view.mode = "sweep"; view.since = view.clock;
    setKind(nextKind); setLevel(nextLevel); setResult(null); setSheet(false); S.closeSheet(session.current, performance.now());
    setHud({ down: 0, ballsLeft: BALLS, danger: false, stacking: false });
    setNews(nextKind === "level" ? defOf(nextLevel).hint : "বন্ধুর সাজানো চাড়া। তিন বলে সাতটাই ফেলো।");
    repaint();
    show("play");
    // The place's four-note motif, scheduled so the pause cuts it.
    const pitch = PITCH[placeOf(round.current)];
    [523, 659, 587, 784].forEach((note, at) => tone(note * pitch, 0.12, 0.05, "triangle", 0.05 + at * 0.11));
    wrap.current?.closest(".gp-stage")?.scrollTo({ top: 0 });
  }

  /** Back to the title for a level (a pick in the list, পরের লেভেল's level card, a friend's link). */
  function toTitle(nextKind: Kind, nextLevel: number) {
    silenceScheduled();
    dropPull();
    round.current = createRound(nextKind, nextLevel);
    setKind(nextKind); setLevel(nextLevel); setResult(null); setSheet(false); S.closeSheet(session.current, performance.now());
    setHud({ down: 0, ballsLeft: BALLS, danger: false, stacking: false });
    repaint();
    show("title");
  }

  // ---- first load: stars (migrated once), your own open levels, the difficulty, a friend's link ----
  useEffect(() => {
    const migrated = read(MIGRATED_KEY) === "1";
    const loaded = migrateStars(read(STARS_KEY), migrated);
    if (loaded.changed) { write(STARS_KEY, JSON.stringify(loaded.stars)); write(MIGRATED_KEY, "1"); }
    const own = readOpen(read(OPEN_KEY), loaded.stars);
    if (own.migrated) write(OPEN_KEY, String(own.open));
    setStars(loaded.stars); setOpen(own.open);
    const savedHand = readHand(read(HAND_KEY));
    const link = parseShared(window.location.hash);
    setFriend(link);
    setHandState(link && link.kind === "level" ? link.hand : savedHand);
    setSite(window.location.host);
    session.current.sound = soundOn();
    if (link) toTitle(link.kind, link.level);
    else toTitle("level", recommended(loaded.stars, own.open));
    const onHash = () => {
      const next = parseShared(window.location.hash);
      if (!next) return;
      setFriend(next);
      if (next.kind === "level") setHandState(next.hand);
      toTitle(next.kind, next.level);
    };
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); loops.stop(); silenceScheduled(); };
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read and drive the game; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, {
      __satChara: {
        round: () => round.current, session: () => session.current, view: () => view,
        throwAt: (angle: number, power: number) => { if (S.ticking(session.current)) throwNow(angle, power); },
        /** Pieces down if this throw were made now, on a copy of the world (the autopilot's search). */
        trial: (angle: number, power: number) => { const copy = structuredClone(round.current.world); simulate(copy, angle, power); return downCount(copy); },
      },
    });
  }, []);

  // ---- the site-wide sound switch, from the menu or the desktop bar ----
  useEffect(() => { S.setSound(session.current, sound); if (!sound) { loops.stop(); silenceScheduled(); } sync(); }, [sound]);

  // ---- away and back: drop the pull and the key, stop the hum; the player opens its menu ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); dropPull(); sync(); };
    const onFocus = () => { S.focus(session.current); sync(); };
    const onVisibility = () => { if (document.hidden) { S.hide(session.current); dropPull(); } else S.show(session.current); sync(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- throwing ----
  function throwNow(angle: number, power: number) {
    const r = round.current;
    if (!launch(r, angle, power)) return;
    seen.current.atLaunch = downCount(r.world);
    seen.current.caughtAtLaunch = r.world.caught;
    seen.current.combo = 0;
    view.follow = 1; view.mode = "sweep";
    release();
    setNews("");
    setHud(h => ({ ...h, ballsLeft: BALLS - r.balls - 1, stacking: false }));
    sync();
  }

  /** A still tap (or Space/Enter): the first fixes the sweeping direction, the second throws at the swinging power. */
  function tap() {
    const r = round.current;
    if (r.phase !== "aim") return;
    if (view.mode === "power" || view.mode === "keys") { throwNow(view.aim.angle, view.aim.power); return; }
    view.mode = "power"; view.since = view.clock;
    sfx.tap();
  }

  // ---- one 60 Hz step: the round, its sounds and juice ----
  function step() {
    const s = session.current, r = round.current, w = r.world, sn = seen.current;
    if (!S.ticking(s)) return;
    if (view.freeze > 0 && r.phase === "flying") { view.freeze--; return; }
    // ধীরে খেলো runs the same fixed steps, fewer each second, so a throw ends exactly the same.
    sn.carry += live.current.slow ? 0.55 : 1;
    let events = 0;
    while (sn.carry >= 1) { sn.carry -= 1; events |= advance(r); if (events & E_SETTLE) { sn.carry = 0; break; } }
    if (w.ballHits > sn.ballHits) {
      if (!view.calm && sn.ballHits === 0) view.freeze = 3;
      thwack(); puff(view, w.hitX, w.hitY, 5);
    }
    if (w.lands > sn.lands) { clatter(w.lands); puff(view, w.landX, w.landY); }
    if (w.thuds > sn.thuds) { thud(); puff(view, w.landX, w.landY, 6); }
    if (w.bounces > sn.bounces) bounce();
    if (w.splats > sn.splats) { splat(); puff(view, w.bx, w.by + 6, 3); }
    if (w.lineHits > sn.lineHits) { twang(); view.lineWob = 1; }
    if (w.caught > sn.caught) { catchSlap(); setNews("মিঠু বলটা ধরে ফেলেছে।"); }
    if (w.grazes > sn.grazes && !view.calm && w.grazeI >= 0) {
      for (let i = 0; i < STONES; i++) if (Math.abs(w.x[i] - w.x[w.grazeI]) < 30) view.wob[i] = 0.07;
    }
    const down = downCount(w);
    if (down > sn.down) {
      for (let k = sn.down; k < down; k++) sfx.combo(sn.combo++);
      setHud(h => ({ ...h, down }));
    }
    if (events & E_BACK) { tuk(); setHud(h => ({ ...h, down, stacking: canRebuild(w) })); setNews(stackingLine(w.backNow)); }
    else if (down < sn.down) setHud(h => ({ ...h, down }));
    Object.assign(sn, { ballHits: w.ballHits, lands: w.lands, thuds: w.thuds, bounces: w.bounces, splats: w.splats, lineHits: w.lineHits, caught: w.caught, grazes: w.grazes, down });
    if (events & E_SETTLE) settled(events);
    sync();
  }

  function settled(events: number) {
    const r = round.current, w = r.world, sn = seen.current, knocked = sn.down - sn.atLaunch;
    shakeBy(view, knocked * 0.8);
    if (knocked === STONES) { view.shout = 0.9; view.shoutX = Math.min(420, Math.max(120, w.hx[0])); view.shoutY = w.hy[6] - 30; }
    if (events & (E_CLEAR | E_FAIL)) { finish(); return; }
    const caught = w.caught > sn.caughtAtLaunch;
    if (!knocked && !caught) farDog();
    const ballsLeft = BALLS - r.balls;
    setHud({ down: sn.down, ballsLeft, danger: ballsLeft === 1, stacking: canRebuild(w) });
    setNews(throwLine(knocked, STONES - sn.down, ballsLeft, caught));
    view.mode = "sweep"; view.since = view.clock;
  }

  function finish() {
    const r = round.current, w = r.world, cur = live.current, levelRun = r.kind === "level";
    const earned = r.cleared ? starsOf(r.balls) : 0;
    if (levelRun && r.cleared) {
      const next = recordLevel(cur.stars, r.level, earned);
      write(STARS_KEY, JSON.stringify(next)); write(MIGRATED_KEY, "1"); setStars(next);
      const opened = openAfter(cur.open, r.level);
      if (opened !== cur.open) { write(OPEN_KEY, String(opened)); setOpen(opened); }
    }
    const rival = cur.friend && cur.friend.kind === r.kind && cur.friend.level === r.level ? cur.friend : null;
    const near = !r.cleared ? missLine(STONES - downCount(w)) : levelRun && finaleRound(r) ? recordLine(r.balls, true, r.level) : nearMissLine(r.balls, r.first);
    setResult({
      kicker: r.cleared ? `${roundLabel(r.kind, r.level)} · পার` : "তিনটা বলই শেষ",
      line: r.cleared ? clearLine(r.kind, r.level) : finaleRound(r) ? recordLine(r.balls, false, r.level) : `${roundLabel(r.kind, r.level)}`,
      cleared: r.cleared, stars: earned, levelRun,
      balls: r.balls, first: r.first, flew: flewHaat(w), caught: w.caught, back: w.restacked, seconds: w.clock / 60,
      near, versus: rival && r.cleared ? compareLine(r.balls, rival.balls, rival.name) : "",
      claim: { kind: r.kind, level: r.level, balls: r.balls, hand: cur.hand },
    });
    setHud(h => ({ ...h, danger: false, stacking: false }));
    show("over");
    // Star chimes are scheduled tones, so the player's pause (silenceScheduled) cuts them.
    for (let star = 0; star < earned; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
    if (earned === 3) {
      confetti({ colors: ["#b4472a", "#e0a23a", "#d8473a", "#ffffff", "#5f8f3e", "#2f4a8a"] });
      if (finaleRound(r)) fanfare(PITCH[placeOf(r)]);
    } else if (!r.cleared) sfx.lose();
  }

  function draw() {
    const c = context.current, r = round.current;
    if (!c) return;
    tickView(view, r, 1 / 60, live.current.slow, live.current.hand, S.ticking(session.current));
    c.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
    c.clearRect(0, 0, view.width, view.height);
    drawFrame(c, view, r, SCENES[placeOf(r)].accent);
    if (session.current.hum) hum.current?.set(view.aim.power);
  }

  useGameLoop(step, draw, screen === "play" && !player.paused && !sheet);

  // ---- size the lane to its box: the scene fills the width, a tall phone shows more wall above ----
  useEffect(() => {
    const holder = lane.current, target = canvas.current;
    if (!holder || !target) return;
    const fit = () => {
      const width = holder.clientWidth, height = holder.clientHeight;
      if (width < 60 || height < 60) return;
      const scale = Math.min(width / W, height / H), extra = Math.min(MAX_EXTRA, Math.max(0, height / scale - H));
      const cssW = Math.round(W * scale), cssH = Math.round((H + extra) * scale);
      target.style.width = `${cssW}px`; target.style.height = `${cssH}px`;
      context.current = fitCanvas(target, cssW, cssH);
      Object.assign(view, { width: cssW, height: cssH, scale, extra, ratio: Math.min(2, window.devicePixelRatio || 1) });
      repaint();
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder);
    fit();
    return () => observer.disconnect();
  }, []);

  // ---- keys: the game's keys at window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]")) return;
      const s = session.current, key = event.key, r = round.current;
      if (s.paused || sheet) return;
      const press = key === " " || key === "Enter";
      if (screen === "play") {
        if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
        if (key.startsWith("Arrow")) {
          event.preventDefault();
          if (r.phase !== "aim" || !S.canPress(s, event.timeStamp)) return;
          if (view.mode !== "keys") { view.mode = "keys"; if (view.aim.power < 0.2) view.aim.power = 0.6; }
          nudge(view.aim, key);
          return;
        }
        if (press) { event.preventDefault(); if (S.keyDown(s, event) && r.phase === "aim") tap(); }
      } else if (screen === "title") {
        if (press && !event.repeat) { event.preventDefault(); start(); }
        else if (/^[1-3]$/.test(key) && live.current.kind === "level") { event.preventDefault(); setHand(["e", "n", "h"][Number(key) - 1] as Hand); }
      } else if (screen === "over") {
        if (S.freshResultKey(s, event)) {
          const pick = press || key === "1" ? 0 : key === "2" ? 1 : key === "3" ? 2 : key === "r" || key === "R" ? choices.findIndex(choice => choice.label === "আবার খেলো") : -1;
          if (pick >= 0 && choices[pick]) { event.preventDefault(); choices[pick].run(); }
        } else if (press) event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => { if (event.key === " " || event.key === "Enter") S.keyUp(session.current); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- the pull: press anywhere on the lane, drag back, let go. A still press is the two-tap path. ----
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || screen !== "play") return;
    event.preventDefault();
    if (!S.pullStart(session.current, event.timeStamp, round.current.phase === "aim")) return;
    pull.current = { id: event.pointerId, sx: event.clientX, sy: event.clientY };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ }
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const p = pull.current, s = session.current;
    if (event.pointerId !== p.id || s.hold !== "pull") return;
    const dx = event.clientX - p.sx, dy = event.clientY - p.sy;
    if (!s.dragging) {
      if (Math.hypot(dx, dy) <= TAP_SLOP) return;
      S.pullMoved(s);
      view.mode = "pull";
      if (view.aim.power < 0.15) view.aim.power = 0.15;
    }
    pullAim(view.aim, dx, dy, view.width, 0.55);
    sync();
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const p = pull.current;
    if (event.pointerId !== p.id) return;
    p.id = -1;
    const back = view.aim.back, length = view.aim.length;
    const outcome = S.pullEnd(session.current);
    if (outcome === "tap") tap();
    else if (outcome === "throw") {
      if (back || length < CANCEL_PULL) { view.mode = "sweep"; view.since = view.clock; setNews("টানা ফিরিয়ে নিলে। আবার টানো।"); }
      else throwNow(view.aim.angle, view.aim.power);
    }
    sync();
  }
  function onPointerCancel() { S.pullCancel(session.current); dropPull(); sync(); }

  // ---- choices ----
  function setHand(next: Hand) { if (!isHand(next)) return; setHandState(next); write(HAND_KEY, next); sfx.tap(); }
  function start() { sfx.tap(); begin(live.current.kind, live.current.level); }
  function pickLevel(next: number) {
    if (!isLevel(next) || !playable(next, live.current.open, visit)) return;
    setSheet(false);
    toTitle("level", next);
  }
  function openList() { S.openSheet(session.current); dropPull(); sync(); setSheet(true); }
  function closeList() { setSheet(false); S.closeSheet(session.current, performance.now()); sync(); }
  const again = () => begin(live.current.kind, live.current.level);
  const nextLevel = kind === "level" && result?.cleared && level < LEVEL_COUNT && playable(level + 1, open, visit) ? level + 1 : 0;
  const choices: Choice[] = [
    ...(nextLevel ? [{ label: "পরের লেভেল", run: () => toTitle("level", nextLevel) }] : []),
    { label: "আবার খেলো", run: again },
    ...(kind === "old" ? [{ label: `লেভেল ${bn(open)} খেলো`, run: () => toTitle("level", recommended(stars, open)) }] : [{ label: "সব লেভেল", run: openList }]),
  ];
  const toCard = () => {
    const card = document.getElementById("result"), stage = card?.closest(".gp-stage");
    if (card && stage) stage.scrollTo({ top: card.offsetTop - 8, behavior: slow ? "auto" : "smooth" });
  };

  const def = defOf(level), finale = kind === "level" ? def.finale : undefined, total = totalStars(stars);
  const ballsShown = Array.from({ length: BALLS }, (_, i) => i < hud.ballsLeft);
  const playing = screen === "play" || screen === "over";

  return (
    <div className="sc-wrap" ref={wrap}>
      <div className="sc" data-screen={screen} data-world={placeOf({ kind, level })} data-slow={slow || undefined}>
        <div className="sc-hud" aria-hidden={!playing}>
          <button type="button" className="sc-badge" onClick={event => { event.currentTarget.blur(); openList(); }} aria-label={`${roundLabel(kind, level)}। সব লেভেল দেখো`}>
            <b>{kind === "old" ? "বন্ধুর" : `লেভেল ${bn(level)}`}</b><span>{kind === "old" ? "পুরোনো সাজানো" : def.name}</span>
            {kind === "level" && hand !== "n" && <i>{HAND_NAME[hand]}</i>}
          </button>
          <p className="sc-boss" data-on={(Boolean(finale) || hud.stacking) || undefined}>
            {hud.stacking ? <b className="sc-tuni">টুনি সাজাচ্ছে</b> : finale ? <><b>{finale.who}</b><span>রেকর্ড {bn(finale.record)} বল</span></> : null}
          </p>
          <div className="sc-count">
            <p className="sc-balls" aria-label={`বল বাকি ${bn(hud.ballsLeft)}টা`}>{ballsShown.map((on, i) => <i key={i} data-on={on} aria-hidden="true" />)}</p>
            <p className="sc-down" aria-label={`পড়েছে ${bn(hud.down)}টা, মোট ৭টা`}><b key={hud.down} className={hud.down ? "gx-pop" : ""}>{bn(hud.down)}</b>/৭</p>
          </div>
        </div>
        <div className="sc-lane" ref={lane} data-danger={(screen === "play" && hud.danger) || undefined} data-stacking={(screen === "play" && hud.stacking) || undefined}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onLostPointerCapture={onPointerCancel}
          onContextMenu={event => event.preventDefault()}>
          <canvas ref={canvas} role="img" aria-label={`${roundLabel(kind, level)}। সাতটা চাড়া, পড়েছে ${bn(hud.down)}টা, বল বাকি ${bn(hud.ballsLeft)}টা।`} />
          <span className="sc-line" aria-hidden="true"><span style={{ width: `${(hud.down / STONES) * 100}%` }} /></span>
        </div>
        <p className="sc-news" role="status" aria-live="polite">{screen === "play" ? news : ""}</p>
        {screen === "title" && <TitleScreen kind={kind} level={level} hand={hand} stars={total} friend={friend && friend.kind === kind && friend.level === level ? friend : null} onStart={start} onHand={setHand} onLevels={openList} />}
        {screen === "over" && result && <EndScreen stats={result} slow={slow} choices={choices} onCard={toCard} />}
        {sheet && <LevelSheet stars={stars} open={open} visit={visit} current={level} next={recommended(stars, open)} onPick={pickLevel} onClose={closeList} />}
      </div>
      {screen === "over" && result?.cleared && <ResultCard claim={result.claim} site={site} />}
    </div>
  );
}
