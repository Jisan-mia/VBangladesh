'use client';
// IP: what we avoided — no shadow-matching app's look or picture set, no textbook or flash-card art, no TV characters; every toy is our own flat SVG, and each shadow is that same drawing turned into the world's dark.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, pause, the hold
// between walls and the rest screen, drag.ts turns a press into a drag or a tap, body.ts + body.hot.ts are the toy's springs);
// this file feeds fingers and keys in, draws, and plays the sounds. There is no voice. The one clock is the hold after a finished
// wall, and it runs only while play is live.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { FLIP, FLY, FOLLOW, HOME, LAND, REST, ROT, SCALE, X, Y, jump, makeBody, setMode, type Body } from '../lib/body';
import * as G from '../lib/drag';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelOf, matchesOf, nextInOrder, nextToPlay, placeOf, worldOf } from '../lib/levels';
import { OG_DEMO, isOgHash } from '../lib/lines';
import { boardDone, createRound, hintSlot, isDone, nextBoard, place, resultOf, toyPlaced, type Result, type Round } from '../lib/round';
import * as S from '../lib/session';
import { shapeOf } from '../lib/shapes';
import { sound } from '../lib/sound';
import { stepBody } from './body.hot';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { Finger, Lamp, Shade, Toy, worldStyle } from './pieces';
import { RoundCard, cardOf } from './round-card';
import { Title } from './title';

const SLUG = 'chhaya-melao';
const HOLD_MS = 1500;
const HOLD_SLOW_MS = 2200;
const NUDGE_MS = 7000;
const LIFT = 28;

type Geo = { homeX: number; homeY: number; centers: number[]; size: number; scale: number; startX: number; startY: number };

export const ChhayaGame = () => <Play />;

function Play() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [fresh, setFresh] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [away, setAway] = useState(false);
  const [picked, setPicked] = useState(-1);
  const [aim, setAim] = useState(-1);
  const [wobble, setWobble] = useState({ slot: -1, n: 0 });
  const [touched, setTouched] = useState(false);
  const root = useRef<HTMLDivElement>(null), finger = useRef<HTMLSpanElement>(null);
  const toyEls = useRef<(HTMLButtonElement | null)[]>([]), cellEls = useRef<(HTMLLIElement | null)[]>([]), slotEls = useRef<(HTMLButtonElement | null)[]>([]);
  const bodies = useRef<Body[]>([]), moving = useRef<boolean[]>([]), geos = useRef<(Geo | null)[]>([]), landed = useRef<number[]>([]), flights = useRef<number[]>([]);
  const holder = useRef<G.Gesture | null>(null);
  const nearNow = useRef(-1), raf = useRef(0), lastFrame = useRef(0), lastKey = useRef(0);
  const live = useRef({ slow, level, picked, aim });
  live.current = { slow, level, picked, aim };

  // ---- the small timers (confetti), all cleared together ----
  const small = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = (run: () => void, ms: number) => { const id = setTimeout(() => { small.current.delete(id); run(); }, ms); small.current.add(id); };
  const clearAll = () => { for (const id of small.current) clearTimeout(id); small.current.clear(); };
  useEffect(() => () => { clearAll(); silenceScheduled(); cancelAnimationFrame(raf.current); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setRound(createRound(ready, newSeed()));
  }, [levels.loaded, levels.stars]);

  // `#og`: the site's preview image only. A fixed result, the parent card open; nothing saved, no daily-limit check.
  useEffect(() => {
    if (!isOgHash(location.hash)) return;
    session.current.screen = 'end'; session.current.endAt = performance.now();
    setResult({ level: OG_DEMO.level, stars: OG_DEMO.stars, ids: OG_DEMO.ids, count: OG_DEMO.ids.length, scored: OG_DEMO.ids.length, firstTry: OG_DEMO.ids.length, slips: 0 });
    setShowing(true);
    sync();
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __cs: { round: () => roundRef.current, session: () => session.current, bodies: () => bodies.current } });
  }, []);

  // ---- the toys' bodies: a fresh set for every wall ----
  useLayoutEffect(() => {
    cancelAnimationFrame(raf.current); raf.current = 0;
    bodies.current = []; moving.current = []; geos.current = []; landed.current = []; flights.current = [];
    nearNow.current = -1;
  }, [round.seed, round.index]);
  const bodyOf = (index: number) => (bodies.current[index] ??= makeBody());

  const paint = (index: number) => {
    const el = toyEls.current[index], body = bodies.current[index];
    if (!el || !body) return;
    const p = body.pos;
    el.style.transform = `translate3d(${p[X].toFixed(1)}px,${p[Y].toFixed(1)}px,0) rotate(${p[ROT].toFixed(2)}deg) scale(${(p[SCALE] * p[FLIP]).toFixed(3)},${p[SCALE].toFixed(3)})`;
  };
  const setState = (index: number, state: string) => {
    const el = toyEls.current[index], cell = cellEls.current[index];
    if (el) el.dataset.state = state;
    if (cell) cell.style.zIndex = state === 'held' || state === 'flying' ? '6' : state === 'placed' ? '3' : state === 'home' || state === 'picked' ? '4' : '';
  };

  /** Measure the shelf cell and every shadow now (never per frame), in page pixels. */
  const measure = (index: number, startX = 0, startY = 0): Geo | null => {
    const cell = cellEls.current[index];
    if (!cell) return null;
    const home = cell.getBoundingClientRect();
    const centers: number[] = [];
    let size = 0;
    for (let slot = 0; slot < roundRef.current.board.shadows.length; slot++) {
      const rect = slotEls.current[slot]?.getBoundingClientRect();
      centers.push(rect ? rect.left + rect.width / 2 : 0, rect ? rect.top + rect.height / 2 : 0);
      size = rect?.width ?? size;
    }
    return { homeX: home.left + home.width / 2, homeY: home.top + home.height / 2, centers, size, scale: size / (home.width * 0.8), startX, startY };
  };

  const frameRef = useRef<(now: number) => void>(() => undefined);
  const loop = useCallback((now: number) => frameRef.current(now), []);
  const kick = () => { if (!raf.current) { lastFrame.current = performance.now(); raf.current = requestAnimationFrame(loop); } };
  frameRef.current = (now: number) => {
    const dt = Math.min(0.05, (now - lastFrame.current) / 1000);
    lastFrame.current = now;
    let any = false;
    for (let index = 0; index < moving.current.length; index++) {
      if (!moving.current[index]) continue;
      const body = bodies.current[index];
      if (!body) continue;
      const alive = stepBody(body, dt, live.current.slow);
      paint(index);
      if (body.arrived) { body.arrived = 0; arrive(index); }
      if (!alive && body.mode !== FOLLOW) { moving.current[index] = false; if (body.mode === HOME) setState(index, ''); } else any = true;
    }
    raf.current = any ? requestAnimationFrame(loop) : 0;
  };

  // ---- what a toy does ----
  const goHome = (index: number, instant = false) => {
    const body = bodyOf(index);
    if (instant) { jump(body, 0, 0, 0, 1, 1); setMode(body, REST, live.current.slow); moving.current[index] = false; paint(index); setState(index, ''); return; }
    setMode(body, HOME, live.current.slow);
    body.goal[X] = 0; body.goal[Y] = 0; body.goal[ROT] = 0; body.goal[SCALE] = 1; body.goal[FLIP] = 1;
    moving.current[index] = true; setState(index, 'home'); kick();
  };
  const landOn = (index: number, slot: number) => {
    const body = bodyOf(index), geo = geos.current[index] ?? measure(index);
    if (!geo) return;
    const turn = roundRef.current.board.shadows[slot].turn;
    setMode(body, LAND, live.current.slow);
    body.goal[X] = geo.centers[slot * 2] - geo.homeX; body.goal[Y] = geo.centers[slot * 2 + 1] - geo.homeY;
    body.goal[ROT] = turn.deg; body.goal[SCALE] = geo.scale; body.goal[FLIP] = turn.flip ? -1 : 1;
    landed.current[index] = slot;
    moving.current[index] = true; setState(index, 'placed'); kick();
  };
  const flyTo = (index: number, slot: number) => {
    const body = bodyOf(index), geo = measure(index);
    if (!geo) return;
    geos.current[index] = geo;
    setMode(body, FLY, live.current.slow);
    body.goal[X] = geo.centers[slot * 2] - geo.homeX; body.goal[Y] = geo.centers[slot * 2 + 1] - geo.homeY;
    body.goal[ROT] = 0; body.goal[SCALE] = geo.scale * 0.9; body.goal[FLIP] = 1;
    flights.current[index] = slot;
    moving.current[index] = true; setState(index, 'flying'); sound.lift(); kick();
  };
  /** A tapped toy reached its shadow: now the match is decided. */
  const arrive = (index: number) => {
    const slot = flights.current[index];
    flights.current[index] = -1;
    if (slot === undefined || slot < 0) return;
    attempt(index, slot);
  };

  /** Put the toy on the shadow: a match lands it, a slip sends it home with a soft boing. Called at a drop or a tapped toy's arrival. */
  function attempt(index: number, slot: number) {
    const s = session.current, before = roundRef.current, id = before.board.toys[index];
    if (!S.live(s)) { goHome(index, true); return; }
    const { round: next, outcome } = place(before, id, slot);
    if (outcome === 'match') {
      setRound(next);
      setPicked(-1); setAim(-1); clearNear();
      sound.land(worldOf(before.level).id);
      landOn(index, slot);
      const last = isDone(next);
      // The last shadow finishes the round at this very match: stars saved and the limit checked now, not in a timer.
      if (S.matched(s, boardDone(next), last, last ? kids.atBreak() : false, live.current.slow ? HOLD_SLOW_MS : HOLD_MS)) {
        const done = resultOf(next);
        levels.record(done.level, done.stars);
        setResult(done);
      }
      return;
    }
    if (outcome === 'miss') setRound(next);
    if (outcome !== 'ignored') { sound.miss(); setWobble(w => ({ slot, n: w.n + 1 })); }
    setPicked(-1); setAim(-1); clearNear();
    goHome(index);
  }

  function clearNear() {
    if (nearNow.current >= 0) delete slotEls.current[nearNow.current]?.dataset.near;
    nearNow.current = -1;
  }
  /** Drop everything in a hand or in flight: a toy goes home at once (pause, blur, a list, a restart). */
  function abortAll() {
    G.drop(holder);
    clearNear();
    for (let index = 0; index < toyEls.current.length; index++) {
      const body = bodies.current[index];
      if (body && (body.mode === FOLLOW || body.mode === FLY || body.mode === HOME)) { flights.current[index] = -1; goHome(index, true); }
    }
    setPicked(-1); setAim(-1);
  }

  // ---- the player: pause freezes the hold and sends a toy in the hand home ----
  const openLevels = () => { clearAll(); abortAll(); S.openLevels(session.current); sound.tap(); sync(); };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); abortAll(); setNudge(false); },
    onResume: () => { S.resume(session.current); },
    onRestart: () => { clearAll(); abortAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); setNudge(false); sync(); },
    onLevels: openLevels,
  });

  // ---- away and back: the hold stops, a toy in the hand goes home, and the first tap back only wakes the game ----
  useEffect(() => {
    const out = () => { S.blur(session.current); abortAll(); setAway(true); setNudge(false); };
    const back = () => { S.focus(session.current); setAway(false); };
    const onVisibility = () => { if (document.hidden) out(); else back(); };
    window.addEventListener('blur', out);
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', out); window.removeEventListener('focus', back); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.cs-grown .kk-gate-open, .cs-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- the hold between walls: the one clock, 10 ticks a second, counted only while play is live ----
  const advance = (step: S.Step) => {
    if (step === 'next') {
      setRound(nextBoard(roundRef.current)); setPicked(-1); setAim(-1); setWobble({ slot: -1, n: 0 });
      sound.lamp();
    } else if (step === 'end') {
      const done = resultOf(roundRef.current);
      // Under the rest screen the round ends quietly.
      if (!session.current.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(worldOf(done.level).id); if (!live.current.slow) later(() => confetti({ count: 70, y: 0.3 }), 300); }
      }
      sync();
    }
  };
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now(), dt = Math.min(250, now - last);
      last = now;
      const step = S.tick(session.current, dt, now);
      if (step !== 'none') advance(step);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ---- the quiet-moment nudge: the ghost finger comes back on a level not finished yet; stops under pause, away and every touch ----
  useEffect(() => {
    setNudge(false);
    if (screen !== 'play' || boardDone(round) || !fresh || player.paused || away) return;
    const id = setTimeout(() => setNudge(true), NUDGE_MS);
    return () => clearTimeout(id);
  }, [screen, round.index, round.matches, round.misses, fresh, player.paused, away]);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    clearAll(); abortAll(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    setRound(createRound(id, newSeed()));
    setResult(null); setShowing(false); setFresh(!levels.stars[id]); setTouched(false); setWobble({ slot: -1, n: 0 });
    sound.lamp();
    sync();
  }
  const toTitle = () => { clearAll(); abortAll(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(createRound(after, newSeed()));
    toTitle();
  };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = 'title'; begin(id); };

  // ---- a finger on a toy: a drag, or a tap (a lone shadow takes it at once; with several, tap the shadow next) ----
  const openSlots = (r: Round) => r.placed.map(done => !done);
  /** A toy chosen by a tap or a key: with one open shadow it flies there; with several it waits for a shadow. */
  const chooseToy = (index: number) => {
    const now = roundRef.current;
    if (boardDone(now) || toyPlaced(now, now.board.toys[index]) || flights.current.some(slot => slot >= 0)) return;
    setTouched(true); setNudge(false);
    const open = openSlots(now), count = open.filter(Boolean).length;
    if (live.current.picked >= 0 && live.current.picked !== index) liftOff(live.current.picked);
    if (count === 1) { setPicked(-1); flyTo(index, open.indexOf(true)); return; }
    if (live.current.picked === index) { liftOff(index); setPicked(-1); setAim(-1); return; }
    const body = bodyOf(index);
    setMode(body, REST, live.current.slow);
    body.goal[Y] = -12; body.goal[SCALE] = 1.08; moving.current[index] = true; setState(index, 'picked'); sound.lift(); kick();
    setPicked(index); setAim(open.indexOf(true));
  };
  const liftOff = (index: number) => { goHome(index); };
  /** A shadow chosen by a tap or a key while a toy is picked. */
  const chooseSlot = (slot: number) => {
    const now = roundRef.current, index = live.current.picked;
    if (index < 0 || now.placed[slot]) return;
    setPicked(-1); setAim(-1);
    flyTo(index, slot);
  };

  const toyDown = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    const s = session.current, now = roundRef.current;
    if (!event.isPrimary || event.button !== 0 || boardDone(now) || toyPlaced(now, now.board.toys[index])) return;
    if (S.touch(s) !== 'counts' || flights.current.some(slot => slot >= 0)) return;
    if (!G.down(holder, event.nativeEvent, index)) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* the pointer is gone */ }
    const geo = measure(index, event.clientX, event.clientY);
    geos.current[index] = geo;
    if (live.current.picked >= 0) { liftOff(live.current.picked); setPicked(-1); setAim(-1); }
    const body = bodyOf(index);
    setMode(body, FOLLOW, live.current.slow);
    body.goal[X] = 0; body.goal[Y] = -8; body.goal[SCALE] = 1.08; body.goal[ROT] = 0; body.goal[FLIP] = 1;
    moving.current[index] = true; setState(index, 'held'); sound.lift(); kick();
    setTouched(true); setNudge(false);
  };
  const toyMove = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    const moved = G.move(holder, event.nativeEvent);
    const geo = geos.current[index], body = bodies.current[index];
    if (moved === 'lost') { goHome(index); clearNear(); return; }
    if (moved === 'none' || !geo || !body) return;
    const dx = event.clientX - geo.startX, dy = event.clientY - geo.startY;
    body.goal[X] = dx; body.goal[Y] = dy - LIFT;
    // The magnet: the nearest open shadow glows when the toy is on it, and the toy grows toward the shadow's size as it comes.
    const open = openSlots(roundRef.current), centerX = geo.homeX + dx, centerY = geo.homeY + dy;
    const near = G.nearest(centerX, centerY, geo.centers, open, geo.size);
    let closest = 1e9;
    for (let slot = 0; slot < open.length; slot++) if (open[slot]) closest = Math.min(closest, Math.hypot(centerX - geo.centers[slot * 2], centerY - geo.centers[slot * 2 + 1]));
    const t = Math.max(0, Math.min(1, 1 - closest / (geo.size * 1.8)));
    body.goal[SCALE] = 1.1 + (geo.scale - 1.1) * t * 0.9;
    if (near !== nearNow.current) { clearNear(); if (near >= 0) { const el = slotEls.current[near]; if (el) el.dataset.near = '1'; nearNow.current = near; } }
  };
  const toyUp = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    const gesture = G.up(holder, event.pointerId);
    if (!gesture) return;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    const geo = geos.current[index];
    if (!gesture.moved || !geo) { goHome(index); clearNear(); chooseToy(index); return; }
    const centerX = geo.homeX + event.clientX - geo.startX, centerY = geo.homeY + event.clientY - geo.startY;
    const slot = G.nearest(centerX, centerY, geo.centers, openSlots(roundRef.current), geo.size);
    clearNear();
    if (slot >= 0) { flights.current[index] = -1; attempt(index, slot); } else goHome(index);
  };
  const toyLost = (index: number) => { if (G.drop(holder)) { clearNear(); goHome(index); } };

  const slotDown = (event: ReactPointerEvent<HTMLButtonElement>, slot: number) => {
    if (!event.isPrimary || event.button !== 0 || S.touch(session.current) !== 'counts') return;
    event.preventDefault();
    chooseSlot(slot);
  };

  // ---- a resize or a turned phone: placed toys follow their shadows, anything in the hand goes home ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let width = node.clientWidth, height = node.clientHeight;
    const watch = new ResizeObserver(() => {
      if (node.clientWidth === width && node.clientHeight === height) return;
      width = node.clientWidth; height = node.clientHeight;
      abortAll();
      requestAnimationFrame(() => {
        const now = roundRef.current;
        for (let index = 0; index < now.board.toys.length; index++) {
          const slot = landed.current[index];
          if (slot === undefined || !now.placed[slot]) continue;
          const geo = measure(index), body = bodyOf(index);
          if (!geo) continue;
          const turn = now.board.shadows[slot].turn;
          jump(body, geo.centers[slot * 2] - geo.homeX, geo.centers[slot * 2 + 1] - geo.homeY, turn.deg, geo.scale, turn.flip ? -1 : 1);
          paint(index);
        }
      });
    });
    watch.observe(node);
    return () => watch.disconnect();
  }, []);

  // ---- the ghost finger: from the toy that fits to its shadow ----
  const spec = levelOf(round.level), world = worldOf(round.level);
  const hint = hintSlot(round);
  const aimSlot = hint >= 0 ? hint : round.placed.findIndex(done => !done);
  const showFinger = screen === 'play' && fresh && !boardDone(round) && ((round.index === 0 && round.matches === 0 && !touched) || nudge) && aimSlot >= 0;
  const fingerToy = aimSlot >= 0 ? round.board.toys.indexOf(round.board.shadows[aimSlot].id) : -1;
  useLayoutEffect(() => {
    const node = finger.current, box = root.current;
    if (!showFinger || !node || !box) return;
    const place = () => {
      const geo = measure(fingerToy), rect = box.getBoundingClientRect();
      if (!geo) return;
      node.style.setProperty('--fx', `${(geo.homeX - rect.left).toFixed(0)}px`); node.style.setProperty('--fy', `${(geo.homeY - rect.top).toFixed(0)}px`);
      node.style.setProperty('--gx', `${(geo.centers[aimSlot * 2] - geo.homeX).toFixed(0)}px`); node.style.setProperty('--gy', `${(geo.centers[aimSlot * 2 + 1] - geo.homeY).toFixed(0)}px`);
    };
    place();
    const again = requestAnimationFrame(place);
    return () => cancelAnimationFrame(again);
  }, [showFinger, fingerToy, aimSlot, round.index, round.seed, screen, player.stage.width, player.stage.height]);

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show')) return;
      const s = session.current, key = event.key;
      if (kids.resting && s.screen !== 'play') return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === 'title' && (key === 'Enter' || key === ' ') && !target?.closest?.('.cs-chip, .cs-grown')) { event.preventDefault(); if (!event.repeat) begin(live.current.level); return; }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(live.current.level); return; }
      if (s.screen !== 'play' || event.repeat) return;
      const now = roundRef.current, active = document.activeElement as HTMLElement | null;
      const at = '1234'.indexOf(key);
      if (at >= 0 && at < now.board.toys.length) {
        event.preventDefault();
        if (S.touch(s) === 'counts') { lastKey.current = performance.now(); chooseToy(at); }
        return;
      }
      if ((key === 'ArrowLeft' || key === 'ArrowRight') && live.current.picked >= 0) {
        event.preventDefault();
        setAim(G.aimNext(openSlots(now), live.current.aim, key === 'ArrowRight' ? 1 : -1));
        return;
      }
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (S.touch(s) !== 'counts') return;
        lastKey.current = performance.now();
        const toyAt = toyEls.current.findIndex(el => el && el === active), slotAt = slotEls.current.findIndex(el => el && el === active);
        if (toyAt >= 0) chooseToy(toyAt);
        else if (slotAt >= 0 && live.current.picked >= 0) chooseSlot(slotAt);
        else if (live.current.picked >= 0 && live.current.aim >= 0) chooseSlot(live.current.aim);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const total = matchesOf(round.level);
  const restUp = kids.resting && screen !== 'play';
  const worldNow = screen === 'play' || screen === 'end' ? world : worldOf(level);
  const mark = (index: number): CSSProperties => ({ '--i': index } as CSSProperties);

  return <div ref={root} className="cs" style={worldStyle(worldNow.id)} data-world={worldNow.id} data-screen={screen} data-slow={slow || undefined} data-picked={picked >= 0 || undefined}>
    {screen === 'title' && <Title level={level} fresh={levels.loaded && Object.keys(levels.stars).length === 0} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="cs-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="ছায়া মেলাও" text="দেয়ালে ছায়া পড়ে, ছোটজন টেনে এনে ঠিক জিনিসটা বসায়। ৩–৬ বছরের প্রথম খেলা, পড়তে হয় না।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {screen === 'play' && <>
      <div className="cs-hud">
        <p className="cs-badge"><span className="cs-badge-n" aria-hidden="true">{bn(placeOf(round.level))}</span>
          <span><b>{spec.finale ?? spec.title}</b><small>{world.name}</small></span></p>
        <ol className="cs-seats" aria-label={`${bn(total)}টার মধ্যে ${bn(round.matches)}টা হয়েছে`}>
          {Array.from({ length: total }, (_, index) => <li key={index} data-got={index < round.matches || undefined} data-now={index === round.matches || undefined} />)}
        </ol>
      </div>

      <div className="cs-wall" data-n={spec.shadows}>
        <div className="cs-light" key={`${round.seed}-${round.index}`} aria-hidden="true" />
        <span className="cs-beam" aria-hidden="true" />
        <Lamp lit />
        <ul className="cs-slots" aria-label="দেয়ালের ছায়া">
          {round.board.shadows.map((shadow, slot) => {
            const shape = shapeOf(shadow.id)!, got = round.placed[slot];
            return <li key={`${round.seed}-${round.index}-${slot}`} className="cs-in" style={mark(slot)}>
              <button type="button" ref={node => { slotEls.current[slot] = node; }} className="cs-slot" data-gone={got || undefined} data-hint={hint === slot || undefined} data-aim={(picked >= 0 && aim === slot) || undefined}
                aria-label={`ছায়া ${bn(slot + 1)}${got ? `: ${shape.bn}` : ''}`} aria-disabled={got || undefined}
                onPointerDown={event => slotDown(event, slot)}
                onClick={event => { if (event.detail === 0 && performance.now() - lastKey.current > 400 && S.touch(session.current) === 'counts') chooseSlot(slot); }}>
                <span key={wobble.slot === slot ? wobble.n : 0} className={`cs-shade${wobble.slot === slot && wobble.n ? ' shake' : ''}`}
                  style={{ transform: `rotate(${shadow.turn.deg}deg) scaleX(${shadow.turn.flip ? -1 : 1})` }}><Shade shape={shape} world={world.id} /></span>
                {got && <span className="cs-ring" aria-hidden="true" />}
                {got && <span className="cs-tag">{shape.bn}</span>}
              </button>
            </li>;
          })}
        </ul>
      </div>

      <ul className={`cs-shelf n${round.board.toys.length}`} aria-label="তাকের ছবি">
        {round.board.toys.map((id, index) => {
          const shape = shapeOf(id)!, got = toyPlaced(round, id), glow = hint >= 0 && round.board.shadows[hint].id === id;
          return <li key={`${round.seed}-${round.index}-${id}`} ref={node => { cellEls.current[index] = node; }} className="cs-in" data-empty={got || undefined} style={mark(round.board.shadows.length + index)}>
            <button type="button" ref={node => { toyEls.current[index] = node; }} className="cs-toy" data-hint={glow || undefined} data-picked={picked === index || undefined}
              aria-label={`${bn(index + 1)}: ${shape.bn}`} aria-disabled={got || undefined}
              onPointerDown={event => toyDown(event, index)} onPointerMove={event => toyMove(event, index)} onPointerUp={event => toyUp(event, index)}
              onPointerCancel={() => toyLost(index)} onLostPointerCapture={() => toyLost(index)} onContextMenu={event => event.preventDefault()}
              onClick={event => { if (event.detail === 0 && performance.now() - lastKey.current > 400 && S.touch(session.current) === 'counts') chooseToy(index); }}>
              <span className="cs-toy-shade" aria-hidden="true" />
              <Toy shape={shape} />
              <span className="cs-key" aria-hidden="true">{bn(index + 1)}</span>
            </button>
          </li>;
        })}
      </ul>
      {showFinger && <span ref={finger} className="cs-ghost" aria-hidden="true"><Finger /></span>}
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(result.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `chhaya-melao-lebhel-${placeOf(result.level)}.png`, make: async () => {
      const [{ renderCard }, { drawCard, loadPictures }] = await Promise.all([import('../../../shared/card-canvas'), import('../lib/draw-card')]);
      const data = cardOf(result), pictures = await loadPictures(data.ids);
      return renderCard(canvas => drawCard(canvas, data, pictures, location.host));
    } }}>
      <RoundCard result={result} />
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
