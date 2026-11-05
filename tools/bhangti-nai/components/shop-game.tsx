'use client';
// IP: what we avoided — no real taka note or coin art (no portraits, monuments, state emblems or note colours copied), no real shop, brand or product names, no cash-register game's look; plain coloured chits with Bangla numerals, made-up prices, our own shop and neighbours.
// The rules, the clock and what the phone keeps are pure (lib/play.ts, lib/session.ts, lib/save.ts); the patience bar and the
// customer's face are written straight to the DOM by the frame loop. This file feeds them taps, keys and performance.now().

import { Fragment, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { cleanName, confetti, MAX_NAME, newSeed, shake, silenceScheduled, totalStars, useBest, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { FormatToggle, ShareBar, useInView } from '../../../shared/share-kit';
import { cardBlob, drawCard, type CardData } from '../lib/draw-card';
import { CUSTOMERS } from '../lib/legacy';
import { LEVEL_COUNT, RUSH_MS, WORLDS, finaleName, isFinale, levelAt, worldOf } from '../lib/levels';
import { caption, compareLine, dayTag, outOf, parseShared, sharedHash, type Shared } from '../lib/link';
import { bn, changeOf, CHITS, EXAMPLE, EXAMPLE_TRAY, fewest, PEOPLE, trayTotal, type Chit, type Customer } from '../lib/money';
import {
  LATE_LINE, RIGHT_LINES, bestLine, chitsText, current, give, humanLine, isOver, makeDeal, nearLine, saying, startRun, starsOf, statsOf, takeBack, tap, timeUp, undo, working, wrongLine,
  type Deal, type Run,
} from '../lib/play';
import { newTwistAt } from '../lib/queue';
import { OPEN_KEY, RELAXED_KEY, openAfter, readOpen, startLevel } from '../lib/save';
import * as session from '../lib/session';
import { edgeAt, moodAt, patienceLeft, secondsLeft } from '../lib/tick.hot';
import { Bell, Chit as ChitArt, Person, Shelf } from './art';
import { Ledger, type Choice, type LedgerRow } from './ledger';
import { LevelSheet } from './level-sheet';
import { sound } from './sound';
import { StartInfo } from './start-info';

const TOOL = 'bhangti-nai';
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
/** The cash box in the order it sits: coins on top, notes below (keys 1–7 follow CHITS). */
const BOX: Chit[] = [1, 2, 5, 10, 20, 50, 100];
const MOODS = ['calm', 'hurry', 'cross'] as const;
const TWIST_TAG = { round: 'নতুন: খুচরা বাড়িয়ে দেয়, ফেরত গোল', two: 'নতুন: দুটো নোট একসঙ্গে', out: 'নতুন: একটা চিরকুট শেষ', kg: 'নতুন: কেজি দর, আগে দাম' } as const;

type Reaction = { kind: 'right' | 'wrong' | 'late' | 'nudge'; text: string; points?: number; bonus?: number; customer?: Customer; tray?: Chit[]; tries?: number };
type Finished = { stars: number; score: number; stats: ReturnType<typeof statsOf>; previousBest: number | null; firstClear: boolean; beaten: boolean; timed: boolean };

/** Each customer's patience in ms; 0 with no clock (সময় নিয়ে). */
const limitsOf = (deal: Deal, timed: boolean) => deal.seconds.map(seconds => timed ? Math.round(seconds * 1000) : 0);

export function ShopGame() {
  const [deal, setDeal] = useState<Deal>(() => makeDeal(1, 1));
  const [sess, setSess] = useState<session.Session>(session.ready);
  const [game, setGame] = useState<Run>(() => startRun(makeDeal(1, 1)));
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [streak, setStreak] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [finish, setFinish] = useState<Finished | null>(null);
  const [open, setOpen] = useState(1);
  const [visit, setVisit] = useState(0);
  const [booted, setBooted] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [timed, setTimedState] = useState(true);
  const [edge, setEdge] = useState(0);
  const [count, setCount] = useState(0);
  const [pop, setPop] = useState({ key: 0, text: '' });
  const [ringing, setRinging] = useState(false);
  const [slow] = useSlowMode();
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const trayBox = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLSpanElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const second = useRef(-1);
  const drag = useRef<{ id: number; chit: Chit; x: number; y: number; moved: boolean } | null>(null);
  const play = useRef(0);
  const recorded = useRef(-1);
  const overAt = useRef(0);
  const inView = useInView(root);
  const inViewNow = useRef(false);
  inViewNow.current = inView;

  const levels = useLevels(TOOL, LEVEL_COUNT);
  const { level, v } = deal;
  const bestKey = v === 2 ? `${TOOL}-lv-${level}` : level ? `${TOOL}-day-${level}` : TOOL;
  const [best, submitBest] = useBest(bestKey);
  const timing = slow ? session.SLOW_TIMING : session.TIMING;
  const spec = v === 2 ? levelAt(level) : null;
  const world = v === 2 ? worldOf(level) : 0;
  // The latest of everything, for the frame loop and listeners that outlive a render.
  const now = useRef({ deal, sess, game, finish, slow, timing, timed, open, sheet, limits: limitsOf(deal, true), hold: null as 'puzzled' | null });
  now.current = { ...now.current, deal, finish, slow, timing, timed, open, sheet };

  const setRunning = (next: Run) => { now.current.game = next; setGame(next); };

  // ---- the frame loop: the clock moves the phase; the bar and the face are written to the DOM ----
  /** The per-frame touches outside React: the patience bar, the face, the edge glow and the last three ticks. */
  function touch(s: session.Session, at: number) {
    const box = scene.current;
    if (!box) return;
    const active = s.phase === 'serve' && s.dur > 0;
    if (s.phase === 'serve') {
      const el = session.elapsed(s, at), left = patienceLeft(el, s.dur), mood = moodAt(left) === 2 ? 'cross' : now.current.hold ?? MOODS[moodAt(left)];
      if (box.dataset.mood !== mood) box.dataset.mood = mood;
      if (bar.current) { bar.current.style.transform = `scaleX(${active ? left : 0})`; bar.current.dataset.low = String(left <= 0.3); }
      if (active && session.running(s)) {
        const sec = secondsLeft(el, s.dur);
        if (sec !== second.current) {
          if (second.current > sec && sec >= 1 && sec <= 3) sound.tick(sec);
          second.current = sec;
          setCount(sec <= 3 ? sec : 0);
        }
        changeEdge(edgeAt(left));
        return;
      }
    }
    changeEdge(0);
  }
  function changeEdge(level: number) { setEdge(current => current === level ? current : level); }

  function frame() {
    raf.current = 0;
    const at = performance.now(), before = now.current.sess;
    // The counter is off screen (and nothing paused it yet): stop here, however play came to run.
    if (session.running(before) && !inViewNow.current) { pauseFor('away'); return; }
    const after = session.tick(before, at, now.current.limits, now.current.timing);
    if (after !== before) commit(after, before);
    const s = now.current.sess;
    touch(s, at);
    if (session.running(s) && !raf.current) raf.current = requestAnimationFrame(frame);
  }

  function commit(next: session.Session, before: session.Session) {
    if (next === before) return;
    now.current.sess = next;
    setSess(next);
    if (next.phase !== before.phase || next.index !== before.index) entered(next, before);
    if (session.running(next)) { if (!raf.current) raf.current = requestAnimationFrame(frame); }
    else if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    touch(now.current.sess, performance.now());
  }

  function entered(next: session.Session, before: session.Session) {
    if (next.phase === 'serve') {
      now.current.hold = null;
      second.current = -1;
      setCount(0);
      setReaction(null);
      if (scene.current) scene.current.dataset.mood = 'calm';
      if (next.index > 0) sound.arrive();
    } else if (next.phase === 'late' && before.phase === 'serve') walkOff(before);
    else if (next.phase === 'over') {
      overAt.current = performance.now();
      const done = now.current.finish;
      if (!done) return;
      const big = done.stars === 3 || done.beaten || (done.firstClear && isFinale(now.current.deal.level));
      if (done.stars) sound.ident(worldOf(now.current.deal.level), big, 0.26 * (done.stars + 1));
      if (big && !now.current.slow) confetti({ colors: ['#f6c945', '#a32a1f', '#0f6e66', '#fffaf0', '#2f9e5b'] });
    }
  }

  // ---- loading a day: everything about the last one goes (scheduled notes, the tray, the result) ----
  function load(next: Deal) {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; }
    silenceScheduled();
    play.current++;
    const s = session.ready(), fresh = startRun(next);
    now.current = { ...now.current, deal: next, sess: s, game: fresh, finish: null, sheet: false, limits: limitsOf(next, now.current.timed), hold: null };
    setDeal(next);
    setSess(s);
    setGame(fresh);
    setReaction(null);
    setStreak(0);
    setFinish(null);
    setEdge(0);
    setCount(0);
    setRinging(false);
    setSheet(false);
    setPop(current => ({ key: current.key, text: '' }));
    if (scene.current) scene.current.dataset.mood = 'calm';
  }
  const canPick = (to: number) => to >= 1 && to <= LEVEL_COUNT && (to <= now.current.open || to === visit);
  const rival = friend && friend.level === level && friend.seed === deal.seed && friend.v === v ? friend : null;
  function pickLevel(to: number) { if (canPick(to)) load(makeDeal(to, newSeed())); }
  function replay() {
    const d = now.current.deal;
    load(rival ? makeDeal(d.level, d.seed, d.v) : makeDeal(d.level, newSeed(), d.v));
  }
  function setTimed(on: boolean) {
    now.current.timed = on;
    now.current.limits = limitsOf(now.current.deal, on);
    setTimedState(on);
    write(RELAXED_KEY, on ? '0' : '1');
  }

  // ---- moves ----
  function start() {
    const s = now.current.sess;
    if (s.phase !== 'ready' || !inView) return;
    sound.bell();
    setRinging(true);
    commit(session.begin(s, performance.now(), now.current.timing), s);
  }
  function pauseFor(why: session.Why) {
    const s = now.current.sess;
    commit(session.pause(s, performance.now(), why), s);
  }
  /** Resuming needs the counter on screen: from the menu with the stage scrolled away, the cover stays down until you tap it back in view. */
  function resumeFrom(why: session.Why) {
    const s = now.current.sess;
    if (!onScreen()) return;
    commit(session.resume(s, performance.now(), why, now.current.timing.breath), s);
  }
  function onScreen() {
    const box = root.current?.getBoundingClientRect();
    return Boolean(box && box.bottom > 0 && box.top < window.innerHeight);
  }

  function pick(chit: Chit) {
    const s = now.current.sess;
    if (!session.canAct(s)) return;
    const before = now.current.game, next = tap(before, chit);
    if (next === before) {
      if (before.tray.length >= 12) setReaction({ kind: 'nudge', text: 'এত চিরকুট লাগবে না! কিছু ফিরিয়ে নাও।' });
      return;
    }
    now.current.hold = null;
    setRunning(next);
    if (reaction?.kind === 'nudge' || reaction?.kind === 'wrong') setReaction(null);
    sound.chit(chit);
  }
  function putBack(chit: Chit) {
    if (!session.canAct(now.current.sess)) return;
    setRunning(takeBack(now.current.game, chit));
    sound.chit(chit, true);
  }
  function takeLast() {
    const before = now.current.game;
    if (!session.canAct(now.current.sess) || !before.tray.length) return;
    setRunning(undo(before));
    sound.chit(before.tray[before.tray.length - 1], true);
  }

  function hand() {
    const s = now.current.sess;
    if (!session.canAct(s)) return;
    const before = now.current.game, customer = current(before)!;
    if (!before.tray.length) { sound.chit(10, true); setReaction({ kind: 'nudge', text: 'আগে নিচের চিরকুট চেপে ভাংতি সাজাও।' }); return; }
    const at = performance.now(), waited = session.waitedMs(s, at), left = s.dur > 0 ? 1 - waited / s.dur : null;
    const handed = give(before, left, waited);
    if (handed.diff !== 0) {
      setRunning(handed.run);
      const rush = now.current.deal.rush;
      now.current.hold = 'puzzled';
      if (scene.current) scene.current.dataset.mood = 'puzzled';
      setReaction({ kind: 'wrong', text: wrongLine(handed.diff, handed.run.tries) + (rush && s.dur > 0 ? ' ধৈর্য কমল।' : ''), customer, tries: handed.run.tries });
      setWrongs(count => count + 1);
      setStreak(0);
      sound.wrong();
      if (!now.current.slow) shake(trayBox.current);
      if (rush) commit(session.hurt(s, RUSH_MS), s);
      return;
    }
    // Right on the first try, again and again: each one in a row rings a step higher.
    const nextStreak = before.tries === 0 ? streak + 1 : 0;
    setStreak(nextStreak);
    sound.till(nextStreak);
    now.current.hold = null;
    if (scene.current) scene.current.dataset.mood = 'happy';
    setRunning(handed.run);
    setReaction({ kind: 'right', text: handed.bonus >= 40 ? 'বাহ, ঝটপট!' : RIGHT_LINES[before.log.length % 3], points: handed.points, bonus: handed.bonus, customer, tray: before.tray });
    setPop(current => ({ key: current.key + 1, text: `+${bn(handed.points)}` }));
    if (isOver(handed.run)) finalize(handed.run);
    commit(session.served(s, at, now.current.timing), s);
  }

  /** The clock ran out: the customer huffs off, no points. Called by the phase change, never by a timeout. */
  function walkOff(before: session.Session) {
    const game0 = now.current.game, customer = current(game0);
    if (!customer) return;
    const ms = before.dur, next = timeUp(game0, ms);
    setRunning(next);
    setStreak(0);
    now.current.hold = null;
    if (scene.current) scene.current.dataset.mood = 'huff';
    sound.walkoff();
    setReaction({ kind: 'late', text: LATE_LINE, customer, tray: game0.tray });
    if (isOver(next)) finalize(next);
  }

  /** The last customer is decided: record the stars and the best once, right now (not behind the beat that follows). */
  function finalize(final: Run) {
    if (recorded.current === play.current) return;
    recorded.current = play.current;
    const d = now.current.deal, stats = statsOf(final.log), stars = starsOf(final.clean, now.current.timed);
    const firstClear = d.v === 2 && stars > 0 && !levels.stars[d.level];
    if (d.v === 2 && stars) {
      levels.record(d.level, stars);
      const opened = openAfter(now.current.open, d.level);
      if (opened !== now.current.open) { now.current.open = opened; setOpen(opened); write(OPEN_KEY, String(opened)); }
    }
    const previousBest = best, beaten = submitBest(final.score) && previousBest !== null;
    const done: Finished = { stars, score: final.score, stats, previousBest, firstClear, beaten, timed: now.current.timed };
    now.current.finish = done;
    setFinish(done);
  }

  // The player's menu: pause stops every clock and covers the customer; চালিয়ে যাও brings it back after a breath.
  const player = useGamePlayer({ onPause: () => pauseFor('away'), onResume: () => resumeFrom('away'), onRestart: replay, onLevels: () => openSheet() });

  // Away without the player (or before its menu engages): blur and a hidden tab pause too.
  useEffect(() => {
    const away = () => { pauseFor('away'); drag.current = null; ghost.current?.setAttribute('hidden', ''); };
    const hide = () => { if (document.hidden) away(); };
    window.addEventListener('blur', away);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('blur', away);
      document.removeEventListener('visibilitychange', hide);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Scrolling the counter away mid-game pauses it, so no clock runs off-screen.
  useEffect(() => { if (!inView) pauseFor('away'); }, [inView]);

  // Boot once this phone's stars are read: your own open day (migrated once from the old rule), then a friend's queue from
  // the link, or where you left off.
  useEffect(() => {
    if (!levels.loaded || booted) return;
    const mine = readOpen(read(OPEN_KEY), levels.stars);
    if (read(OPEN_KEY) === null) write(OPEN_KEY, String(mine));
    now.current.open = mine;
    setOpen(mine);
    setSite(window.location.host);
    const calm = read(RELAXED_KEY) === '1';
    if (calm) { now.current.timed = false; setTimedState(false); }
    setBooted(true);
    const fromHash = () => {
      const got = parseShared(window.location.hash);
      if (!got) return false;
      setFriend(got);
      setVisit(got.v === 2 ? got.level : 0);
      load(makeDeal(got.level, got.seed, got.v));
      return true;
    };
    if (!fromHash()) load(makeDeal(startLevel(levels.stars, mine), newSeed()));
    const onHash = () => { fromHash(); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [levels.loaded]);

  // ---- cards ----
  const over = sess.phase === 'over' && finish !== null;
  const stats = finish?.stats ?? statsOf(game.log);
  const shared: Shared | null = over && finish ? { seed: deal.seed, score: game.score, right: stats.right, name: cleanName(name), v, level, clean: level ? game.clean : undefined, calm: level && !finish.timed ? true : undefined } : null;
  const state = shared ? sharedHash(shared) : '';
  const card: CardData | null = shared ? { score: shared.score, right: shared.right, name: shared.name, level, v, clean: shared.clean, calm: shared.calm } : null;
  useEffect(() => {
    let cancelled = false;
    loadCardFonts('ভাংতি নাই! ১০ জনের ৯ জনকে ১২৪০ ঈদের আগের দিন').then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { score: friend.score, right: friend.right, name: friend.name, level: friend.level, v: friend.v, clean: friend.clean, calm: friend.calm }, 'feed', site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the card draws; sess.phase brings the friend's canvas back with the start screen.
  }, [state, format, site, friend, sess.phase]);

  /** Scrolls the stage (not the page) down to the card; outside the player, the page. */
  function seeCard() {
    const box = resultBox.current, stage = box?.closest('.gp-stage');
    const behavior = slow ? 'auto' as const : 'smooth' as const;
    if (box && stage) stage.scrollTo({ top: box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop - 8, behavior });
    else box?.scrollIntoView({ behavior, block: 'start' });
  }

  // ---- choices: the sheet pauses play ----
  function openSheet() {
    pauseFor('sheet');
    now.current.sheet = true;
    setSheet(true);
  }
  function closeSheet() { now.current.sheet = false; setSheet(false); resumeFrom('sheet'); }

  const recommended = startLevel(levels.stars, open);
  const nextOpen = v === 2 && level < LEVEL_COUNT && canPick(level + 1);
  const again: Choice = { label: 'আবার খেলো', run: replay };
  const all: Choice = { label: 'সব দিন', run: openSheet };
  const stars = finish?.stars ?? 0;
  const endChoices: Choice[] = stars
    ? nextOpen ? [{ label: 'পরের দিন', run: () => pickLevel(level + 1) }, again, all] : [all, again]
    : [again, all];

  // ---- keys: Enter and Space belong to the game; result keys need a fresh press after the ledger shows ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || element?.closest?.('input, textarea, select, [contenteditable]')) return;
    if (now.current.sheet || !inView) return;
    const key = event.key, enter = key === 'Enter' || key === ' ', fresh = !event.repeat, s = now.current.sess;
    if (enter && element?.closest?.('button, a, summary')) return; // a button reached with Tab does its own job
    if ((key === 'p' || key === 'P') && fresh && session.running(s)) {
      event.preventDefault();
      if (player.stage.width > 0) player.requestPause(); else pauseFor('away');
      return;
    }
    if (s.why === 'away') { if (enter) { event.preventDefault(); if (fresh) resumeFrom('away'); } return; }
    if (s.why) return;
    const slot = '১২৩৪৫৬৭'.includes(key) && key.length === 1 ? '১২৩৪৫৬৭'.indexOf(key) : /^[1-7]$/.test(key) ? Number(key) - 1 : -1;
    if (slot >= 0) { if (s.phase === 'serve') { event.preventDefault(); if (fresh) pick(CHITS[slot]); } else if (s.phase === 'over' && slot < endChoices.length) { event.preventDefault(); if (fresh && event.timeStamp > overAt.current + 400) endChoices[slot].run(); } return; }
    if (key === 'Backspace') { if (s.phase === 'serve') { event.preventDefault(); takeLast(); } return; }
    if (!enter) return;
    event.preventDefault();
    if (!fresh) return;
    if (s.phase === 'ready') start();
    else if (s.phase === 'serve') hand();
    else if (s.phase === 'over' && event.timeStamp > overAt.current + 400) endChoices[0].run();
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener('keydown', listen);
    return () => window.removeEventListener('keydown', listen);
  }, []);
  /** A finger or mouse click leaves no focused button behind, so the next Enter can't press it again. */
  function dropFocus(event: MouseEvent<HTMLDivElement>) {
    if (event.detail === 0) return;
    const button = (event.target as Element).closest('button');
    if (button instanceof HTMLButtonElement) button.blur();
  }

  // ---- the chits: a tap puts one down at once (pointerdown); dragging it back onto the box changes your mind ----
  function chitDown(event: ReactPointerEvent<HTMLButtonElement>, chit: Chit) {
    if (event.button !== 0 || !event.isPrimary || !session.canAct(now.current.sess)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser does not track: the drag still works without capture */ }
    const before = now.current.game.tray.length;
    pick(chit);
    drag.current = now.current.game.tray.length > before ? { id: event.pointerId, chit, x: event.clientX, y: event.clientY, moved: false } : null;
  }
  function chitMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current, g = ghost.current;
    if (!d || d.id !== event.pointerId || !g) return;
    if (!d.moved && Math.hypot(event.clientX - d.x, event.clientY - d.y) < 14) return;
    d.moved = true;
    g.removeAttribute('hidden');
    g.style.transform = `translate(${event.clientX - 28}px, ${event.clientY - 22}px)`;
    g.dataset.back = String(event.clientY >= (boxRef.current?.getBoundingClientRect().top ?? Infinity));
  }
  function chitUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    ghost.current?.setAttribute('hidden', '');
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* not captured */ }
    // Let go over the box again: it goes back where it came from.
    if (d.moved && event.clientY >= (boxRef.current?.getBoundingClientRect().top ?? Infinity)) putBack(d.chit);
  }
  const chitClick = (event: MouseEvent<HTMLButtonElement>, chit: Chit) => { if (event.detail === 0) pick(chit); };

  // ---- what the screen shows ----
  const ready = sess.phase === 'ready';
  const covered = sess.why !== null && session.started(sess);
  const down = ready || covered;
  const serving = sess.phase === 'serve' && !covered;
  const shown: Customer = ready ? EXAMPLE : deal.customers[Math.min(sess.index, CUSTOMERS - 1)];
  const tray = reaction?.tray ?? game.tray;
  const given = trayTotal(game.tray);
  const groups = BOX.slice().reverse().map(value => [value, tray.filter(chit => chit === value).length] as const).filter(([, count]) => count > 0);
  const locked = !serving;
  const finale = v === 2 ? finaleName(level) : '';
  const newTwist = v === 2 ? newTwistAt(level) : null;
  const answer = reaction?.kind === 'late' && reaction.customer ? fewest(changeOf(reaction.customer), reaction.customer.out) : null;
  const showWork = reaction?.kind === 'wrong' && (reaction.tries ?? 0) >= 2 ? working(reaction.customer!) : reaction?.kind === 'late' ? working(reaction.customer!) : null;
  const rows: LedgerRow[] = game.log.map((entry, index) => ({ who: deal.customers[index].who, change: changeOf(deal.customers[index]), ...entry }));
  const memoTitle = finish ? (finale && stars ? `${finale} পার` : stars ? `দিন ${bn(level)} পার` : v === 2 ? `দিন ${bn(level)}: আরেকবার?` : 'দোকান বন্ধ!') : '';
  const nextWorld = finale && finish?.firstClear && world < WORLDS.length - 1 ? WORLDS[world + 1].name : '';
  const memoLine = finish ? (rival ? compareLine(game.score, rival.score, rival.name)
    : finale && finish.firstClear ? `${WORLDS[world].name}-এর সব দিন শেষ।${nextWorld ? ` এবার ${nextWorld}।` : ' তিন দোকানই শেষ।'}`
    : finish.beaten && finish.previousBest !== null ? `নতুন রেকর্ড! আগের সেরা ছিল ${bn(finish.previousBest)}।`
    : humanLine(stats.right, game.score)) : '';
  const bestText = finish && finish.previousBest !== null && finish.previousBest > game.score ? bestLine(game.score, finish.previousBest, v === 2 ? 'এই দিনে' : 'এই ফোনে') : '';
  const total = totalStars(levels.stars);
  const sub = v === 2 ? `${WORLDS[world].name} · দিন ${bn(level)}` : 'বন্ধুর দোকান';
  const style = { '--wall': WORLDS[world].wall, '--sign': WORLDS[world].sign, '--sign-ink': WORLDS[world].ink } as CSSProperties;

  return (
    <div ref={root} className="bt" data-phase={sess.phase} data-world={world} data-edge={edge || undefined} data-calm={slow || undefined} data-finale={finale ? '' : undefined} data-timed={timed} onClick={dropFocus} style={style}>
      <div className="bt-play" hidden={over}>
        <header className="bt-hud">
          <button type="button" className="bt-badge" onClick={openSheet} aria-haspopup="dialog" aria-label={`দিন ${bn(level)}, সব দিন দেখো`}>
            <b>{finale ? 'শেষ দিন' : v === 2 ? `দিন ${bn(level)}` : 'বন্ধুর দিন'}</b>
            <span>{v === 2 ? WORLDS[world].name : 'পুরোনো লিংক'}</span>
          </button>
          {finale ? (
            <div className="bt-boss" aria-label={`${finale}: ${bn(Math.max(0, CUSTOMERS - game.log.length))} জন বাকি`}>
              <b>{finale}</b>
              <span>{Array.from({ length: CUSTOMERS }, (_, index) => <i key={index} data-state={game.log[index] ? (game.log[index].ok ? 'hit' : 'miss') : ''} />)}</span>
            </div>
          ) : (
            <ol className="bt-dots" aria-label={`${bn(game.log.length)} জন গেছে, ${bn(stats.right)} জন ঠিক ভাংতি পেয়েছে`}>
              {Array.from({ length: CUSTOMERS }, (_, index) => {
                const entry = game.log[index];
                return <li key={index} data-mark={entry ? (entry.ok ? 'ok' : 'miss') : index === sess.index && !ready ? 'now' : 'todo'} />;
              })}
            </ol>
          )}
          <p className="bt-score">
            {ready ? <><b>★ {bn(total)}</b><small>/{bn(LEVEL_COUNT * 3)}</small></> : <><b>{bn(game.score)}</b><small>পয়েন্ট</small></>}
            {streak >= 2 && sess.phase === 'right' && <em key={streak}>টানা {bn(streak)}</em>}
          </p>
        </header>

        <div className="bt-scene" ref={scene} data-mood="calm">
          <Shelf world={world} />
          <span className="bt-timer" data-off={!(serving && timed && sess.dur > 0)} aria-hidden="true"><i ref={bar} /></span>
          {!ready && !covered && newTwist && newTwist.index === sess.index && <p className="bt-new">{TWIST_TAG[newTwist.twist]}</p>}
          {!ready && shown.out !== 0 && <p className="bt-sold">{bn(shown.out)} টাকার ভাংতি নাই!</p>}
          {serving && count > 0 && <span className="bt-count" aria-hidden="true">{bn(count)}</span>}
          <div className="bt-guest" key={ready ? 'guest-ex' : `guest-${sess.index}`}>
            <Person who={shown.who} />
            <div className="bt-talk">
              <p className="bt-bubble" aria-live="polite">
                <span className="bt-sr">{PEOPLE[shown.who]} বলছে: </span>
                {saying(shown).map((line, row) => <span key={row} className="bt-line">{line.map((part, at) => typeof part === 'number' ? <b key={at}>{bn(part)}</b> : part)}</span>)}
              </p>
              {reaction && reaction.kind !== 'nudge' && !covered && (
                <p className="bt-reply" data-kind={reaction.kind} key={`${wrongs}-${reaction.kind}`} role="status">
                  {reaction.text}
                  {reaction.kind === 'right' && <span className="bt-points">+{bn(reaction.points!)}{reaction.bonus ? <small> ঝটপট +{bn(reaction.bonus)} সহ</small> : null}</span>}
                </p>
              )}
            </div>
          </div>
          <div className="bt-paid" aria-label={`খদ্দের দিয়েছে ${bn(shown.notes.reduce((a, b) => a + b, 0))} টাকা`}>
            {shown.notes.map((note, index) => <ChitArt key={index} value={note} small />)}
          </div>
          {pop.text && !slow && !covered && <em className="bt-pop" key={`pop-${pop.key}`} aria-hidden="true">{pop.text}</em>}
          <button type="button" className="bt-cover" data-down={down || undefined} data-kind={ready ? 'bell' : 'paused'} tabIndex={down ? 0 : -1} aria-hidden={!down}
            onClick={event => { event.currentTarget.blur(); if (covered) resumeFrom(sess.why === 'sheet' ? 'sheet' : 'away'); else start(); }}>
            {ready ? <Bell ringing={ringing} /> : null}
            <span className="bt-cover-sign">
              <b>{covered ? 'চালিয়ে যাও' : 'ঘণ্টা বাজাও'}</b>
              <small>{covered ? 'থেমে আছে, খদ্দের ঢাকা' : rival ? 'বন্ধুর দশজন খদ্দের' : 'প্রথম খদ্দের অপেক্ষায়'}</small>
            </span>
          </button>
        </div>

        <div className="bt-below">
          {ready ? (
            <StartInfo level={level} v={v} spec={spec} stars={levels.stars[level] ?? 0} timed={timed} canBack={v === 2 && canPick(level - 1)} canNext={v === 2 && canPick(level + 1)}
              friend={rival} friendCanvas={friendPreview} onLevel={pickLevel} onTimed={setTimed} onSheet={openSheet} />
          ) : (
            <>
              <div className="bt-counter" ref={trayBox} data-kind={reaction?.kind ?? ''}>
                <div className="bt-given" role="group" aria-label="খদ্দেরকে যা ফেরত দিচ্ছ, চাপলে একটা ফেরত আসবে">
                  {answer ? (
                    <p className="bt-answer">ঠিক ভাংতি ছিল <b>{bn(changeOf(reaction!.customer!))}</b> টাকা
                      <span className="bt-sr">: {chitsText(answer)}</span>
                      <span className="bt-answer-chits" aria-hidden="true">{answer.map((chit, index) => <ChitArt key={index} value={chit} small />)}</span>
                    </p>
                  ) : groups.length ? groups.map(([value, n]) => (
                    <button type="button" key={value} className="bt-taken" onClick={() => putBack(value)} disabled={locked} aria-label={`${bn(value)} টাকার একটা ফিরিয়ে নাও${n > 1 ? `, আছে ${bn(n)}টা` : ''}`}>
                      <ChitArt value={value} small />{n > 1 && <i>×{bn(n)}</i>}
                    </button>
                  )) : <span className="bt-empty">{reaction?.kind === 'nudge' ? reaction.text : 'নিচ থেকে চিরকুট চাপো'}</span>}
                </div>
                {showWork && <p className="bt-work">{showWork.join(' · ')}</p>}
                <button type="button" className="kit-primary bt-give" onClick={hand} disabled={locked && !reaction} aria-disabled={locked} data-ready={game.tray.length > 0 && serving}>
                  দাও<small aria-live="polite">{game.tray.length > 0 ? `${bn(given)} টাকা` : 'Enter'}</small>
                </button>
              </div>
              <div className="bt-box" ref={boxRef} data-off={locked} role="group" aria-label="ক্যাশবাক্স: চিরকুট চাপলে খদ্দেরের দিকে যাবে">
                {BOX.map(value => {
                  const gone = shown.out === value && !ready;
                  return (
                    <Fragment key={value}>
                      <button type="button" className="bt-slot" data-value={value} data-gone={gone} disabled={locked || gone}
                        onPointerDown={event => chitDown(event, value)} onPointerMove={chitMove} onPointerUp={chitUp} onPointerCancel={chitUp} onClick={event => chitClick(event, value)}
                        aria-label={gone ? `${bn(value)} টাকার চিরকুট শেষ` : `${bn(value)} টাকা দাও`}>
                        <ChitArt value={value} />{gone && <em aria-hidden="true">শেষ</em>}
                        <kbd aria-hidden="true">{bn(CHITS.indexOf(value) + 1)}</kbd>
                      </button>
                      {value === 5 && (
                        <button type="button" className="bt-slot bt-undo" onClick={takeLast} disabled={locked || !game.tray.length} aria-label="শেষ চিরকুটটা ফিরিয়ে নাও">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফেরাও
                        </button>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <span className="bt-ghost" ref={ghost} hidden aria-hidden="true" data-back="false"><ChitArt value={drag.current?.chit ?? 10} small /></span>
      </div>

      {over && finish && (
        <Ledger rows={rows} slow={slow} finale={Boolean(finale)} title={memoTitle} choices={endChoices} onCard={seeCard} sub={`${sub} · ${finish.timed ? 'ঝটপট' : 'সময় নিয়ে'}`}
          stats={{ score: game.score, stars, clean: game.clean, right: stats.right, avgMs: stats.avgMs, fastestMs: stats.fastestMs, bestStreak: stats.bestStreak }}
          line={memoLine} near={nearLine(game.clean, finish.timed)} best={bestText} />
      )}

      {sheet && <LevelSheet stars={levels.stars} open={open} visit={visit} current={level} recommended={recommended} onPick={pickLevel} onClose={closeSheet} />}

      {over && card && shared && (
        <section className="bt-result" id="result" ref={resultBox} aria-labelledby="bt-result-title">
          <h2 id="bt-result-title"><em>{outOf(shared.right)}</em> ঠিক ভাংতি দিয়েছ</h2>
          <p>{rival ? compareLine(game.score, rival.score, rival.name) : humanLine(shared.right, game.score)}</p>
          <div className="bt-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bt-card-summary" />
              <figcaption id="bt-card-summary" className="bt-sr">ভাংতি নাই! কার্ড: {card.name && `${card.name}, `}{dayTag(level)}{outOf(card.right)} ঠিক ভাংতি, {bn(card.score)} পয়েন্ট। {humanLine(card.right, card.score)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bt-share">
              <label className="bt-name">
                <span>তোমার নাম <small>কার্ডে আর লিংকে যাবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`bhangti-nai${level ? `-${level}` : ''}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`}
                caption={caption(shared)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই দশজন খদ্দেরই পাবে, একই দাম, একই নোট। স্কোরটা তোমার ফোনে খেলা, লিংকে সেভাবেই লেখা থাকে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
