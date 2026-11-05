'use client';
// IP: what we avoided — no NCTB textbook words, pictures or page layout and no TV characters; the word lists and every drawing are our own.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, timers,
// pause and the rest screen); this file feeds taps and keys in, draws, hops the signs and plays the sounds.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, fitCanvas, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { HOP_MS, MISS_MS, hopFrames, missFrames } from '../lib/hop';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, printLevel, signsOf } from '../lib/levels';
import { START_PACE, answer, createRound, currentItem, hintOn, isLast, nextWord, resultOf, type Result, type Round } from '../lib/round';
import { cardBlob } from '../lib/draw-card';
import { drawWorld } from '../lib/scene';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { KAR_NAME, SIDE, dotted, spellWith, type Kar } from '../lib/words';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { PrintSheet } from './print-sheet';
import { RoundCard } from './round-card';
import { Title } from './title';
import { WordPicture, WordSlot } from './word-parts';

const SLUG = 'kar-chinho';
const NEXT_MS = 1100, NEXT_SLOW_MS = 1600, BREATH_MS = 500, TRIED_MS = 1300;

export function KarGame() {
  const [print, setPrint] = useState<number | null>(null);
  useEffect(() => { const value = new URLSearchParams(location.search).get('print'); if (value !== null) setPrint(printLevel(value)); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (!print) return;
    document.documentElement.classList.add('kc-printing');
    return () => document.documentElement.classList.remove('kc-printing');
  }, [print]);
  return print ? createPortal(<div className="kc-print-root tool-kar-chinho"><PrintSheet level={print} /></div>, document.body) : <Play />;
}

function Play() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreenState] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [landed, setLanded] = useState(false);
  const [tried, setTried] = useState<Kar | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const root = useRef<HTMLDivElement>(null), wordLine = useRef<HTMLParagraphElement>(null), backdrop = useRef<HTMLCanvasElement>(null), panel = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const keyPick = useRef(0);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  // ---- timers: the one pending timer (next word / end screen), plus the small ones; all cleared together ----
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const small = useRef(new Set<ReturnType<typeof setTimeout>>());
  const flights = useRef<Animation[]>([]);
  const later = (run: () => void, ms: number) => { const id = setTimeout(() => { small.current.delete(id); run(); }, ms); small.current.add(id); };
  const stopPending = () => { if (pendingTimer.current) clearTimeout(pendingTimer.current); pendingTimer.current = null; };
  const clearAll = () => {
    stopPending();
    for (const id of small.current) clearTimeout(id);
    small.current.clear();
    for (const flight of flights.current) flight.cancel();
    flights.current = [];
  };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setScreen = (next: S.Screen) => setScreenState(next);
  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setGhost(Object.keys(levels.stars).length === 0);
    setRound(createRound(ready, newSeed()));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __kar: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  // ---- the player: pause freezes the pending timer; resume gives it back after a breath ----
  const armPending = (ms: number) => {
    stopPending();
    pendingTimer.current = setTimeout(() => { pendingTimer.current = null; fire(); }, ms);
  };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); stopPending(); },
    onResume: () => { S.resume(session.current); if (session.current.pending !== 'none') armPending(BREATH_MS); },
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setTried(null); setShowing(false); sync(); },
  });

  // ---- away and back: the first tap back only wakes the game ----
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
      const open = node.querySelector('.kc-grown .kk-gate-open, .kc-grown .kk-gate');
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
    setRound(createRound(id, newSeed(), roundRef.current.pace ?? START_PACE));
    setLanded(false); setTried(null); setResult(null); setShowing(false);
    sound.tap();
    sync();
  }

  function fire() {
    const s = session.current, was = s.pending;
    S.timerFires(s, performance.now());
    if (was === 'next') {
      setRound(nextWord(roundRef.current)); setLanded(false); setTried(null);
      sound.page();
    } else if (was === 'end') {
      const done = resultOf(roundRef.current), world = levelOf(done.level).world;
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(world); if (!live.current.slow) confetti({ count: 70, y: 0.3 }); }
      }
    }
    sync();
  }

  /** A tile, by finger or key. */
  function pick(kar: Kar, tile: HTMLElement | null) {
    const s = session.current, before = roundRef.current;
    if (S.tapTile(s) !== 'counts') return;
    const next = answer(before, kar);
    if (next === before) return;
    setGhost(false);
    for (const flight of flights.current) flight.cancel();
    flights.current = [];
    const world = levelOf(before.level).world, still = live.current.slow;
    setRound(next);
    if (next.solved) {
      setTried(null);
      hop(tile, kar, false, still);
      if (still) setLanded(true);
      sound.seat(world);
      const last = isLast(next);
      // The last word finishes the round at this tap: stars saved, the limit checked. Only the end screen waits.
      if (S.solved(s, last, last ? kids.atBreak() : false)) {
        const done = resultOf(next);
        levels.record(done.level, done.stars);
        setResult(done);
      }
      armPending(still ? NEXT_SLOW_MS : NEXT_MS);
    } else {
      // The word reads wrong once the sign reaches the seat, and clears a moment after it hops home.
      hop(tile, kar, true, still);
      sound.miss();
      later(() => setTried(kar), still ? 0 : 300);
      later(() => setTried(current => current === kar ? null : current), still ? TRIED_MS + 400 : TRIED_MS);
    }
  }

  /** The sign hops from its tile to its seat (and back, for a wrong one). Slow mode skips the hop. */
  function hop(tile: HTMLElement | null, kar: Kar, miss: boolean, still: boolean) {
    const sign = tile?.querySelector<HTMLElement>('.kc-sign'), line = wordLine.current;
    if (!sign || !line) return;
    if (still) return;
    const seats = line.querySelectorAll<HTMLElement>('.kc-slot');
    if (!seats.length) { if (!miss) setLanded(true); return; }
    const side = SIDE[kar], from = sign.getBoundingClientRect();
    const a = seats[side === 'left' ? 0 : seats.length - 1].getBoundingClientRect(), b = seats[0].getBoundingClientRect();
    const tx = side === 'both' ? (a.left + a.right + b.left + b.right) / 4 : (a.left + a.right) / 2, ty = (a.top + a.bottom) / 2;
    const scale = Math.max(0.8, Math.min(2.2, a.height / Math.max(1, from.height) * 1.6));
    const dx = tx - (from.left + from.width / 2), dy = ty - (from.top + from.height / 2);
    const flight = sign.animate(miss ? missFrames(dx, dy, scale) : hopFrames(dx, dy, scale), { duration: miss ? MISS_MS : HOP_MS, fill: 'none' });
    flights.current.push(flight);
    tile?.setAttribute('data-flying', '');
    const home = () => tile?.removeAttribute('data-flying');
    flight.oncancel = home;
    flight.onfinish = () => { home(); if (!miss) setLanded(true); };
  }

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the slate, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(createRound(after, newSeed(), roundRef.current.pace));
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
        if (at >= 0) { event.preventDefault(); const kar = roundRef.current.choices[at]; if (kar && !event.repeat) { keyPick.current = performance.now(); pick(kar, tiles.current[at]); } return; }
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          const focused = tiles.current.findIndex(tile => tile && tile === document.activeElement);
          if (focused >= 0 && !event.repeat) { keyPick.current = performance.now(); pick(roundRef.current.choices[focused], tiles.current[focused]); }
        }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  // ---- the world's backdrop, drawn once per world and size ----
  const world = levelOf(level).world;
  useEffect(() => {
    const box = panel.current, canvas = backdrop.current;
    if (!box || !canvas) return;
    const paint = () => {
      const w = box.clientWidth, h = box.clientHeight;
      if (w < 40 || h < 40) return;
      drawWorld(fitCanvas(canvas, w, h), world, w, h);
    };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(box);
    return () => observer.disconnect();
  }, [world, screen === 'play']);

  // The picture grows with the stage: 120 px on a short phone, up to 180 px on a tall one.
  const stageH = player.stage.height || 760;
  const picture = Math.round(Math.max(112, Math.min(180, (stageH - 500) * 0.62)));

  const item = currentItem(round), spec = levelOf(round.level), hint = hintOn(round);
  const filled = round.solved && landed;
  const say = filled ? `${KAR_NAME[item.kar]} বসল: ${item.word}` : round.solved ? '\u00a0' : tried ? `এটা পড়লে হয় ${spellWith(item, tried)}। আরেকবার ভাবো।` : 'ছবির নামটা বলো, ঠিক চিহ্নটায় চাপো।';
  const restUp = kids.resting && screen !== 'play';

  return <div ref={root} className="kc" data-world={levelOf(screen === 'play' || screen === 'end' ? round.level : level).world} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} size={Math.min(150, picture)} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="kc-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="কার-চিহ্ন বসাও" text="ছবি দেখে ঠিক কার-চিহ্ন বসানোর খেলা, ৫–৭ বছরের জন্য।" />
          <a className="kit-secondary kc-print" href={`/kar-chinho?print=${level}`}>প্রিন্টের পাতা: {levelOf(level).title}</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="kc-hud">
      <p className="kc-badge"><span className="kc-badge-sign" aria-hidden="true">{signsOf(round.level).length > 4 ? 'সব' : signsOf(round.level).map(dotted).join(' ')}</span>
        <span><b>{spec.finale ?? spec.title}</b><small>লেভেল {bn(placeOf(round.level))}</small></span></p>
      <ol className="kc-strip" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
        {round.items.map((word, index) => {
          const got = index < round.index || (index === round.index && filled);
          return <li key={index} data-got={got || undefined} data-now={(index === round.index && screen === 'play') || undefined}>{got && <WordPicture pic={word.pic} size={22} />}</li>;
        })}
      </ol>
    </div>}

    {screen === 'play' && <>
      <div className="kc-panel" ref={panel}>
        <canvas ref={backdrop} className="kc-backdrop" aria-hidden="true" />
        <div className="kc-scene">
          <div key={round.index} className={`kc-pic${filled ? ' alive' : ''}`}><WordPicture pic={item.pic} size={picture} /></div>
        </div>
        <p className="kc-wordline" ref={wordLine}><WordSlot item={item} filled={filled} tried={tried} /></p>
      </div>
      <p className="kc-say" aria-live="polite">{say}</p>
      <div className={`kc-tiles kc-n${round.choices.length}`}>
        {round.choices.map((kar, at) => <button key={`${round.index}-${kar}`} ref={node => { tiles.current[at] = node; }} type="button" aria-label={`${bn(at + 1)}: ${KAR_NAME[kar]}`}
          className={`kc-tile${hint && kar === item.kar ? ' hint' : ''}${round.solved && kar === item.kar && filled ? ' right' : ''}${tried === kar ? ' tried' : ''}`}
          onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
            // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
            if (!event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            pick(kar, event.currentTarget);
          }}
          // A screen reader's activation (a click with no pointer); a key press already picked through the window.
          onClick={event => { if (event.detail === 0 && performance.now() - keyPick.current > 400) pick(kar, event.currentTarget); }}>
          <span className="kc-key" aria-hidden="true">{bn(at + 1)}</span>
          <span className="kc-sign">{dotted(kar)}</span>
          {ghost && round.index === 0 && kar === item.kar && <Finger />}
        </button>)}
      </div>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `kar-chinho-${result.level}.png`, make: () => cardBlob(result, location.host) }}>
      <RoundCard result={result} />
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}

/** A ghost finger tapping the right tile on the very first word, so a child who can't read yet sees the move. */
function Finger() {
  return <svg className="kc-finger" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="kc-ripple" cx="20" cy="10" r="10" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#3b2a17" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
