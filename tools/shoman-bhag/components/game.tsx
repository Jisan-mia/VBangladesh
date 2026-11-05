'use client';
// IP: what we avoided — no Meena, Sisimpur or any TV/app characters or look-alikes, no NCTB fraction pictures; the guests, food and রুটি are our own code art.
// The game inside the shared player. The rules live in lib/ (round.ts plays a serving, session.ts decides screens, pause and
// the rest screen); this file feeds touches and keys in, draws, and plays the sounds. There is no voice and no timer:
// a finished serving waits for the child's ➜.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, newSeed, shake, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from '../lib/levels';
import { FOOD_ART } from '../lib/shapes';
import {
  EMPTY_TODAY, addToday, cut, decide, doneLine, glows, hintTarget, isDone, isLast, nextItem, paceOf, pick, question, release, resultOf, slipLine, tapBasket, tapPlate,
  createRound, type Result, type Round, type Step, type Today,
} from '../lib/round';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { Board, ghostFor, type Act } from './board';
import { LIFT, PIECE, place } from './drag.hot';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { Pic } from './pieces';
import { RoundCard } from './round-card';
import { Title } from './title';

const SLUG = 'shoman-bhag';
const NUDGE_MS = 7000;
/** A finger must move this far (px) before a press on a piece becomes a drag; less is a tap that keeps the piece in hand. */
const DRAG_PX = 10;
/** The preview-image script's fixed card (`#og`): shown once, nothing saved. */
const OG_TODAY: Today = { guests: 12, cuts: [2, 4], named: 0, table: { plates: 3, per: 2, food: 'pitha' } };

type Origin = { x: number; y: number };
const centerOf = (node: Element | null | undefined): Origin | null => {
  if (!node) return null;
  const box = node.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Which plate (or the basket) a piece just landed on, from what changed. */
function landing(before: Round, next: Round): 'basket' | number | null {
  const up = next.plates.findIndex((count, seat) => count > before.plates[seat]);
  if (up >= 0) return up;
  if (next.basket > before.basket) return 'basket';
  const piece = next.pieces.findIndex((has, seat) => has && !before.pieces[seat]);
  return piece >= 0 ? piece : null;
}

export function BhagGame() { return <Play />; }

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
  const [today, setToday] = useState<Today>(EMPTY_TODAY);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  // The finger: on the first serving of a level the child has never finished, and again after a quiet moment.
  const [fresh, setFresh] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [away, setAway] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const floater = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; left: number; top: number } | null>(null);
  const hover = useRef<Element | null>(null);
  const land = useRef<{ to: 'basket' | number; from: Origin; ms: number } | null>(null);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);
  useEffect(() => () => { silenceScheduled(); }, []);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    if (location.hash === '#og') { setToday(OG_TODAY); setShowing(true); return; }
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setRound(createRound(ready, newSeed()));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __sb: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  /** A piece in the hand goes back (a drag in the air, blur, the menu), and the lifted piece stops following the finger. */
  const letGo = () => {
    drag.current = null;
    if (floater.current) floater.current.hidden = true;
    hover.current?.removeAttribute('data-hover'); hover.current = null;
    root.current?.removeAttribute('data-dragging');
    const back = release(roundRef.current);
    if (back !== roundRef.current) setRound(back);
  };

  // ---- the player: pause freezes the nudge and returns the piece; resume gives the hand back ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); setNudge(false); letGo(); },
    onResume: () => { S.resume(session.current); },
    onRestart: () => { S.toTitle(session.current); silenceScheduled(); letGo(); setShowing(false); setNudge(false); sync(); },
    onLevels: () => { S.toTitle(session.current); S.openLevels(session.current); silenceScheduled(); letGo(); setNudge(false); sync(); },
  });

  // ---- away and back: the first tap back only wakes the game ----
  useEffect(() => {
    const out = () => { S.blur(session.current); setAway(true); setNudge(false); letGo(); };
    const back = () => { S.focus(session.current); setAway(false); };
    const onVisibility = () => { if (document.hidden) out(); else back(); };
    window.addEventListener('blur', out);
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', out); window.removeEventListener('focus', back); document.removeEventListener('visibilitychange', onVisibility); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.sb-grown .kk-gate-open, .sb-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- the quiet-moment nudge: the finger comes back after a wait; stops under pause, away and every tap ----
  useEffect(() => {
    setNudge(false);
    if (screen !== 'play' || isDone(round) || player.paused || away) return;
    const id = setTimeout(() => setNudge(true), NUDGE_MS);
    return () => clearTimeout(id);
  }, [screen, round, player.paused, away]);

  // ---- a piece flies from where it was lifted (or let go) to the plate, and the plate gives a little thud ----
  useLayoutEffect(() => {
    const info = land.current;
    land.current = null;
    const host = root.current;
    if (!info || !host || live.current.slow || calm()) return;
    const plate = info.to === 'basket' ? host.querySelector('[data-basket]') : host.querySelector(`[data-seat="${info.to}"] .sb-plate`);
    const piece = plate?.lastElementChild, at = centerOf(piece);
    if (!plate || !piece || !at) return;
    const dx = info.from.x - at.x, dy = info.from.y - at.y;
    piece.animate([
      { transform: `translate(${dx}px,${dy}px) scale(1.12)` },
      { transform: `translate(${dx * 0.4}px,${dy * 0.4 - 18}px) scale(1.2)`, offset: 0.55 },
      { transform: 'none' },
    ], { duration: info.ms, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    plate.animate([{ transform: 'none' }, { transform: 'scale(1.05, 0.95)' }, { transform: 'none' }], { duration: 200, delay: info.ms - 40, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  }, [round]);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    setRound(createRound(id, newSeed(), paceOf(roundRef.current)));
    setResult(null); setShowing(false); setFresh(!levels.stars[id]);
    sound.tap();
    sync();
  }

  /** One touch on the board: lifts, drops or gives a piece, cuts, or answers. `at` is where a dragged piece was let go. */
  function play(compute: (round: Round) => Step, element: HTMLElement, at: Origin | null): Step['event'] {
    const s = session.current, before = roundRef.current;
    if (S.tapBoard(s) !== 'counts') return 'ignore';
    const step = compute(before), next = step.round;
    if (step.event === 'ignore') { sound.tap(); return 'ignore'; }
    setNudge(false);
    const to = landing(before, next);
    if (to !== null) {
      const ruti = before.stage === 'give' ? root.current?.querySelector('.sb-ruti') : null;
      const from = at ?? centerOf(ruti ?? root.current?.querySelector('.is-up')) ?? null;
      if (from) land.current = { to, from, ms: at ? 150 : 260 };
    }
    const world = worldOf(before.level).id, flight = at ? 0.11 : 0.22;
    switch (step.event) {
      case 'pick': sound.pick(); break;
      case 'cancel': sound.back(); break;
      case 'drop': if (typeof to === 'number') sound.drop(next.plates[to] ?? 1, flight); else sound.back(); break;
      case 'over': sound.drop(typeof to === 'number' ? next.plates[to] : 1, flight); sound.over(); shake(element); break;
      case 'again': sound.miss(); shake(element); break;
      case 'right':
        if (isDone(next)) sound.fair(world);
        else if (before.stage === 'cut') sound.cut();
        else sound.drop(typeof to === 'number' ? next.plates[to] : 1, flight);
        break;
    }
    setRound(next);
    // The last piece of the last serving finishes the round at this very touch: stars saved, the limit checked.
    // Only the ➜ waits, so nothing a quick hand does next can lose them.
    if (isDone(next)) {
      const last = isLast(next);
      if (S.servedDone(s, last, last ? kids.atBreak() : false)) {
        const done = resultOf(next);
        levels.record(done.level, done.stars);
        setResult(done);
        setToday(before => addToday(before, done));
      }
    }
    return step.event;
  }

  function goNext() {
    const s = session.current, step = S.tapNext(s, performance.now());
    if (step === 'next') { const more = nextItem(roundRef.current); if (more) setRound(more); sound.next(); }
    else if (step === 'end') {
      const done = resultOf(roundRef.current);
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(worldOf(done.level).id); if (!live.current.slow && !calm()) confetti({ count: 70, y: 0.3 }); }
      }
      sync();
    }
  }

  // ---- the lifted piece follows the finger; letting go over a plate drops it there ----
  function startDrag(event: { clientX: number; clientY: number }) {
    const box = root.current?.getBoundingClientRect();
    if (box) drag.current = { x: event.clientX, y: event.clientY, moved: false, left: box.left, top: box.top };
  }
  useEffect(() => {
    const aim = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('[data-seat],[data-basket]') ?? null;
    const move = (event: PointerEvent) => {
      const d = drag.current;
      if (!d || !event.isPrimary) return;
      if (!d.moved && Math.hypot(event.clientX - d.x, event.clientY - d.y) > DRAG_PX) {
        d.moved = true;
        if (floater.current) floater.current.hidden = false;
        root.current?.setAttribute('data-dragging', '');
      }
      if (!d.moved) return;
      place(floater.current, event.clientX - d.left, event.clientY - d.top);
      const over = aim(event.clientX, event.clientY);
      if (over !== hover.current) { hover.current?.removeAttribute('data-hover'); over?.setAttribute('data-hover', ''); hover.current = over; }
    };
    const up = (event: PointerEvent) => {
      const d = drag.current;
      if (!d || !event.isPrimary) return;
      const dropped = d.moved, over = dropped ? aim(event.clientX, event.clientY) : null;
      drag.current = null;
      if (floater.current) floater.current.hidden = true;
      hover.current?.removeAttribute('data-hover'); hover.current = null;
      root.current?.removeAttribute('data-dragging');
      if (!dropped) return; // a tap: the piece stays in hand, and the next tap puts it down
      const at = { x: event.clientX, y: event.clientY - LIFT };
      const seat = over?.getAttribute('data-seat');
      if (seat !== null && seat !== undefined) play(r => tapPlate(r, Number(seat)), over as HTMLElement, at);
      else if (over?.hasAttribute('data-basket')) play(tapBasket, over as HTMLElement, at);
      else { const r = release(roundRef.current); if (r !== roundRef.current) { setRound(r); sound.back(); } }
    };
    const cancel = () => { if (drag.current) letGo(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- what each press means ----
  const onBasket: Act = (element, event, pointer) => {
    if (pointer) element.blur();
    if (play(tapBasket, element, null) === 'pick' && pointer) startDrag(event);
  };
  const onSeat = (seat: number): Act => (element, event, pointer) => {
    if (pointer) element.blur();
    if (play(r => tapPlate(r, seat), element, null) === 'pick' && pointer) startDrag(event);
  };
  const onKnife = (parts: number): Act => (element, _event, pointer) => { if (pointer) element.blur(); play(r => cut(r, parts), element, null); };
  const onChoice = (id: 'share' | 'small' | 'keep'): Act => (element, _event, pointer) => { if (pointer) element.blur(); play(r => decide(r, id), element, null); };
  const onPick = (value: number): Act => (element, _event, pointer) => { if (pointer) element.blur(); play(r => pick(r, value), element, null); };

  // ---- screens ----
  const toTitle = () => { S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the mat, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(createRound(after, newSeed(), paceOf(roundRef.current)));
    toTitle();
  };
  const openLevels = () => { S.openLevels(session.current); sound.tap(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = 'title'; begin(id); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show')) return;
      const s = session.current, key = event.key;
      if (kids.resting && s.screen !== 'play') return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === 'title' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (!event.repeat) begin(level); return; }
      if (s.screen === 'play') {
        const at = '1234'.indexOf(key);
        if (at >= 0) { event.preventDefault(); if (!event.repeat) root.current?.querySelectorAll<HTMLElement>('[data-k]')[at]?.click(); return; }
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          if (event.repeat) return;
          if (s.solved) { goNext(); return; }
          const focused = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>('[data-k],[data-basket]') : null;
          (focused ?? root.current?.querySelector<HTMLElement>('[data-basket]'))?.click();
        }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(round.level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const item = round.item, spec = levelOf(round.level), world = worldOf(round.level);
  const restUp = kids.resting && screen !== 'play';
  const done = isDone(round);
  const showGhost = screen === 'play' && !done && ((fresh && round.index === 0 && round.tries === 0) || glows(round) || nudge);
  const say = done ? doneLine(round) : round.miss ? slipLine(round) : question(round);

  return <div ref={root} className="sb" data-world={levelOf(screen === 'play' || screen === 'end' ? round.level : level).world} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="sb-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="সমান ভাগ" text="পিঠা-আম সমান ভাগ করে ভাগ আর ভগ্নাংশ শেখার খেলা, ৫–১০ বছরের জন্য। ফ্রি, বিজ্ঞাপন নেই।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {screen === 'play' && <>
      <div className="sb-hud">
        <p className="sb-badge"><span className="sb-badge-n" aria-hidden="true">{bn(placeOf(round.level))}</span>
          <span><b>{spec.finale ?? spec.title}</b><small>{world.name}</small></span></p>
        <ol className="sb-strip" aria-label={`${bn(round.length)}টার মধ্যে ${bn(round.foods.length)}টা হয়েছে`}>
          {Array.from({ length: round.length }, (_, index) => {
            const got = index < round.foods.length;
            return <li key={index} data-got={got || undefined} data-now={index === round.index || undefined}>{got && <Pic layers={FOOD_ART[round.foods[index]]} className="sb-strip-pic" />}</li>;
          })}
        </ol>
      </div>

      <div className="sb-play" key={`${round.level}-${round.index}`}>
        <Board round={round} ghost={ghostFor(hintTarget(round), showGhost)} onBasket={onBasket} onSeat={onSeat} onKnife={onKnife} onChoice={onChoice} onPick={onPick} />
      </div>

      <div className="sb-say" aria-live="polite">
        <p>{say}</p>
        {done && <button type="button" className="sb-next" aria-label={isLast(round) ? 'শেষ দেখো' : 'পরের মেহমান'} onClick={event => { event.currentTarget.blur(); goNext(); }}>
          {isLast(round)
            ? <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 20h32l-5 20H13z" /><path d="M16 20l8-12 8 12" /></svg>
            : <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h26M26 12l12 12-12 12" /></svg>}
        </button>}
      </div>
      <div ref={floater} className="sb-floater" style={{ width: PIECE, height: PIECE }} hidden aria-hidden="true">{item.kind === 'share' && <Pic layers={FOOD_ART[item.food]} />}</div>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: async () => (await import('../lib/card')).cardBlob(today, location.host) }}>
      <RoundCard today={today} />
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
