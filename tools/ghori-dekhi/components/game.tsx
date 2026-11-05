'use client';
// IP: what we avoided — no textbook or app clock face, no TV characters, no named child; the clock, the skies and every object are
// our own SVG, and the time words are everyday Bangladeshi speech.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, pause, ▶ and the
// rest screen, hands.ts and drag.ts turn the hands); this file feeds taps and keys in, draws, and plays the sounds.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { confetti, newSeed, shake, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { stepHand, type Hand } from '../lib/hands';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf } from '../lib/levels';
import { START_PACE, check, choose, createRound, currentItem, demoOf, glowOn, isLast, nextItem, resultOf, say, turn, type Result, type Round } from '../lib/round';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { readHint, sayLeft, sayTime, setHint, type Time } from '../lib/time';
import { AskCard, ReadCards } from './cards';
import { EndScreen } from './end-screen';
import { ClockFace, MiniClock } from './face';
import { LevelList } from './level-list';
import { PrintSheet } from './print-sheet';
import { RoundCard } from './round-card';
import { Title } from './title';

const SLUG = 'ghori-dekhi';
const BREATH_MS = 400;
type Say = { title?: string; text: string; hint?: boolean };
const NO_SAY: Say = { text: '' };

export function GhoriGame() {
  const [print, setPrint] = useState(false);
  useEffect(() => { setPrint(new URLSearchParams(location.search).has('print')); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (!print) return;
    document.documentElement.classList.add('gd-printing');
    return () => document.documentElement.classList.remove('gd-printing');
  }, [print]);
  return print ? createPortal(<div className="gd-print-root tool-ghori-dekhi"><PrintSheet /></div>, document.body) : <Play />;
}

function Play() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [hand, setHand] = useState<Hand>('hour');
  const [touched, setTouched] = useState(false);
  const [said, setSaid] = useState<Say>(NO_SAY);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [away, setAway] = useState(false);
  const root = useRef<HTMLDivElement>(null), clockBox = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const lastClick = useRef(0);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  // ---- timers: the small ones (confetti, the end tune), all cleared together ----
  const small = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = (run: () => void, ms: number) => { const id = setTimeout(() => { small.current.delete(id); run(); }, ms); small.current.add(id); };
  const clearAll = () => { for (const id of small.current) clearTimeout(id); small.current.clear(); };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);
  /** The hand a fresh item starts with: the long one if it must move, else the short one. Level ১ has only the short hand. */
  const handFor = (round: Round) => (levelOf(round.level).lockMinute ? 'hour' : demoOf(currentItem(round)).hand);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars), first = createRound(ready, newSeed());
    setLevel(ready); setRound(first); setHand(handFor(first));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __ghori: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  const openLevels = () => { clearAll(); S.openLevels(session.current); sound.tap(); sync(); };
  // ---- the player: pause freezes everything; the first tap back only wakes the game ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); setAway(true); },
    onResume: () => { S.resume(session.current); later(() => setAway(false), BREATH_MS); },
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); setAway(false); sync(); },
    onLevels: openLevels,
  });

  useEffect(() => {
    const onBlur = () => S.blur(session.current);
    const onFocus = () => S.focus(session.current);
    const onVisibility = () => { if (document.hidden) S.blur(session.current); else S.focus(session.current); };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.gd-grown .kk-gate-open, .gd-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    clearAll(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    const next = createRound(id, newSeed(), roundRef.current.pace ?? START_PACE);
    setRound(next); setHand(handFor(next)); setTouched(false); setSaid(NO_SAY); setResult(null); setShowing(false); setAway(false);
    sound.tap();
    sync();
  }

  /** Right: the bell, the pie, the words. The last item saves the stars and checks the limit in this very tap. */
  function solved(next: Round) {
    const s = session.current, last = isLast(next), item = currentItem(next), spec = levelOf(next.level);
    setRound(next);
    if (S.solve(s, last, last ? kids.atBreak() : false, performance.now())) {
      const done = resultOf(next);
      levels.record(done.level, done.stars);
      setResult(done);
    }
    sound.bell(spec.world);
    const left = sayLeft(item.time);
    setSaid({ title: sayTime(item.time, { part: true }), text: left ? `মানে ${left}।` : `${item.activity.name}।` });
  }

  function slip(text: string, target: Element | null) {
    sound.miss();
    shake(target);
    setSaid({ text, hint: true });
  }

  /** The hands settled (a drag, a tap or a key). */
  function turned(total: number, how: 'drag' | 'tap' | 'key') {
    const before = roundRef.current;
    setTouched(true);
    if (how !== 'drag') sound.tap();
    setRound(turn(before, total));
  }

  /** ✓ on a "set" item. */
  function ok() {
    if (S.touch(session.current) !== 'counts') return;
    setTouched(true);
    const before = roundRef.current, item = currentItem(before), next = check(before);
    if (next === before) return;
    if (next.solved) { solved(next); return; }
    setRound(next);
    slip(setHint(before.total, item.time), clockBox.current);
  }

  /** A card on a "read" item, by finger or key. */
  function pick(time: Time, node: Element | null) {
    if (S.touch(session.current) !== 'counts') return;
    setTouched(true);
    const before = roundRef.current, item = currentItem(before), next = choose(before, time);
    if (next === before) return;
    if (next.solved) { solved(next); return; }
    setRound(next);
    slip(readHint(time, item.time), node);
  }

  /** ▶ : the next scene, or after the last item the end screen. */
  function go(key?: { timeStamp: number; repeat: boolean }) {
    const s = session.current, step = S.advance(s, key);
    if (step === 'no') return;
    if (step === 'next') {
      const next = nextItem(roundRef.current);
      setRound(next); setHand(handFor(next)); setSaid(NO_SAY); setTouched(true);
      sound.page();
    } else {
      const done = resultOf(roundRef.current), world = levelOf(done.level).world;
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(world); if (!live.current.slow) later(() => confetti({ count: 70, y: 0.3 }), 300); }
      }
      sync();
    }
  }

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars), next = createRound(after, newSeed(), roundRef.current.pace);
    setLevel(after); setRound(next); setHand(handFor(next));
    toTitle();
  };
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
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(level); return; }
      if (s.screen !== 'play') return;
      const now = roundRef.current, item = currentItem(now);
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (s.solved) { go({ timeStamp: event.timeStamp, repeat: event.repeat }); return; }
        if (event.repeat) return;
        if (item.mode === 'set') ok();
        else { const at = cards.current.findIndex(card => card && card === document.activeElement); if (at >= 0) pick(now.choices[at], cards.current[at]); }
        return;
      }
      if (item.mode === 'read') {
        const at = '1234'.indexOf(key);
        if (at >= 0 && !event.repeat) { event.preventDefault(); const time = now.choices[at]; if (time) pick(time, cards.current[at]); }
        return;
      }
      const direction = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
      if (direction && !now.solved) {
        event.preventDefault();
        if (S.touch(s) !== 'counts') return;
        const spec = levelOf(now.level), which: Hand = spec.lockMinute ? 'hour' : hand;
        turned(stepHand(now.total, which, direction, spec.step), 'key');
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const item = currentItem(round), spec = levelOf(round.level);
  const glow = glowOn(round), set = item.mode === 'set';
  const demo = !touched && round.index === 0 && screen === 'play' && set ? demoOf(item) : null;
  const slipped = round.tries >= 1;
  const restUp = kids.resting && screen !== 'play';
  const itemKey = `${round.seed}-${round.index}`;

  return <div ref={root} className="gd" data-world={levelOf(screen === 'play' || screen === 'end' ? round.level : level).world} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="gd-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="ঘড়ি দেখি" text="ছোটদের ঘড়ি দেখা শেখার খেলা: সাড়ে, সোয়া, পৌনে। ফ্রি, বিজ্ঞাপন নেই।" />
          <a className="kit-secondary gd-print-link" href="/ghori-dekhi?print">কাঁটা আঁকার ঘড়ি প্রিন্ট করো</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="gd-hud">
      <p className="gd-badge"><MiniClock time={spec.example} size={30} />
        <span><b>{spec.finale ?? spec.title}</b><small>লেভেল {bn(placeOf(round.level))}</small></span></p>
      <ol className="gd-seats" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
        {round.items.map((_, index) => <li key={index} data-got={index < round.index || (index === round.index && round.solved) || undefined} data-now={(index === round.index && screen === 'play' && !round.solved) || undefined} />)}
      </ol>
    </div>}

    {screen === 'play' && <>
      <AskCard key={`ask-${itemKey}`} item={item} level={spec} solved={round.solved} showClock={spec.targetClock === 'always' || slipped || round.solved} />
      <div className="gd-clock-box" ref={clockBox}>
        {set
          ? <ClockFace total={round.total} itemKey={itemKey} live={!round.solved} lockMinute={spec.lockMinute} step={spec.step} chosen={spec.lockMinute ? 'hour' : hand} slow={slow}
            pie={spec.pie} ghost={glow ? item.time : null} wrongHand={round.wrongHand} ring={round.wrongHand ? item.time : null} solved={round.solved} demo={demo} away={away || player.paused}
            label={`ঘড়ি। বানাতে হবে ${sayTime(item.time)}`}
            gate={() => S.touch(session.current) === 'counts'} onTurn={(total, how) => turned(total, how)} onChoose={setHand}
            onClick={() => { const now = performance.now(); if (now - lastClick.current > 60) { lastClick.current = now; sound.click(); } }} onSeat={() => sound.seat()} />
          : <ClockFace total={item.time.h * 60 + item.time.m} itemKey={itemKey} live={false} lockMinute step={spec.step} chosen="hour" slow={slow} pie={spec.pie && round.solved} solved={round.solved}
            label={`ঘড়ি, ${item.activity.name}`} />}
      </div>

      {set ? <div className="gd-tools">
        {!spec.lockMinute && <>
          <button type="button" className="gd-chip-hand" aria-pressed={hand === 'hour'} aria-label="ছোট কাঁটা" disabled={round.solved} onClick={event => { event.currentTarget.blur(); sound.tap(); setHand('hour'); }}>
            <svg viewBox="0 0 48 40" aria-hidden="true"><rect x="6" y="14" width="30" height="12" rx="6" /></svg><span>ছোট</span>
          </button>
          <button type="button" className="gd-chip-hand gd-chip-long" aria-pressed={hand === 'minute'} aria-label="বড় কাঁটা" disabled={round.solved} onClick={event => { event.currentTarget.blur(); sound.tap(); setHand('minute'); }}>
            <svg viewBox="0 0 48 40" aria-hidden="true"><rect x="2" y="16" width="42" height="8" rx="4" /></svg><span>বড়</span>
          </button>
        </>}
        {round.solved
          ? <button type="button" className="gd-go gd-next" aria-label={isLast(round) ? 'শেষ দেখো' : 'পরেরটা'} onClick={event => { event.currentTarget.blur(); go(); }}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 9v30l24-15z" /></svg></button>
          : <button type="button" className="gd-go gd-ok" aria-label="হয়েছে" onClick={event => { event.currentTarget.blur(); ok(); }}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 25l9 9 19-21" /></svg></button>}
      </div> : <ReadCards key={`cards-${itemKey}`} round={round} level={spec} glow={glow} onPick={pick} setNode={(at, node) => { cards.current[at] = node; }}
        after={<button type="button" className="gd-go gd-next" aria-label={isLast(round) ? 'শেষ দেখো' : 'পরেরটা'} onClick={event => { event.currentTarget.blur(); go(); }}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 9v30l24-15z" /></svg></button>} />}

      <p className={`gd-say${said.hint ? ' hint' : ''}`} role="status" aria-live="polite">{said.title && <b>{said.title}</b>}{said.text || ' '}</p>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `ghori-dekhi-level-${placeOf(result.level)}.png`, make: async () => { const { cardBlob } = await import('../lib/draw-card'); return cardBlob(result, location.host); } }}>
      <RoundCard result={result} />
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
