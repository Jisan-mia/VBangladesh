'use client';
// IP: what we avoided — no NASA, ESA or textbook images and no planet app's look; every planet, the rocket and the football are our own drawings, and facts are re-said in our words from NASA's fact pages.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, the end
// timer, pause and the rest screen); this file feeds taps and keys in, draws, flies the rocket and plays the sounds.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import { loadCardFonts } from '../../../shared/card-canvas';
import { LEVEL_COUNT, WORLDS, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, onBoard, ORDER, placeOf, printAsked, waitsForButton } from '../lib/course';
import { PLANETS } from '../lib/planets';
import { START_PACE, advance, answer, createRound, glowOn, hintOf, isLast, itemOf, planetOf, resultOf, revealOf, rightKey, type Result, type Round } from '../lib/round';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { doneLine, introOf, promptOf } from '../lib/words';
import { PlanetArt } from './art';
import { Board, type Tap } from './board';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { PrintSheet } from './print-sheet';
import { Quiz } from './quiz';
import { Title } from './title';

const SLUG = 'sourojogot';
/** After the last tap on the orbit board, the rocket flies (up to 1 s) and the planet's fact shows before the end screen. */
const END_MS = 1500, END_SLOW_MS = 1700, BREATH_MS = 500;
type Say = { title?: string; text: string; tone: 'ask' | 'hint' | 'found' };

export function SolarGame() {
  const [print, setPrint] = useState(false);
  useEffect(() => { setPrint(printAsked(location.search)); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (!print) return;
    document.documentElement.classList.add('sj-printing');
    return () => document.documentElement.classList.remove('sj-printing');
  }, [print]);
  return print ? createPortal(<div className="sj-print-root tool-sourojogot"><PrintSheet /></div>, document.body) : <Play />;
}

const askOf = (round: Round): Say => ({ text: promptOf(round), tone: 'ask' });

function Play() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slowSetting] = useSlowMode();
  // The phone's own reduced-motion setting counts as ধীরে খেলো even when the saved choice says otherwise: nothing flies.
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)'), change = () => setReduce(query.matches);
    change();
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  const slow = slowSetting || reduce;
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [say, setSay] = useState<Say>(() => askOf(round));
  const [wobble, setWobble] = useState<{ key: string; n: number } | null>(null);
  const [rocketAt, setRocketAt] = useState(-1);
  const [flight, setFlight] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [serial, setSerial] = useState(0);
  const root = useRef<HTMLDivElement>(null), card = useRef<HTMLCanvasElement>(null);
  const keyPick = useRef(0);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  // ---- timers: the one end timer, plus the small ones; all cleared together ----
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPending = () => { if (pendingTimer.current) clearTimeout(pendingTimer.current); pendingTimer.current = null; };
  const clearAll = () => { stopPending(); };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    prepare(ready);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round and start a level; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __sj: { round: () => roundRef.current, session: () => session.current, right: () => rightKey(roundRef.current), start: (id: number) => { session.current.screen = 'title'; begin(id); } } });
  });

  /** A fresh round on the title or the board; the ghost finger shows only for a mode this phone has never played. */
  function prepare(id: number) {
    const fresh = createRound(id, newSeed(), START_PACE), mode = levelOf(id).mode;
    setRound(fresh); setSay(askOf(fresh)); setWobble(null); setRocketAt(-1); setFlight(0); setResult(null); setShowing(false);
    setGhost(!ORDER.some(other => levelOf(other).mode === mode && levels.stars[other]));
  }

  // ---- the player: pause freezes the end timer; resume gives it back after a breath ----
  const armPending = (ms: number) => {
    stopPending();
    pendingTimer.current = setTimeout(() => { pendingTimer.current = null; enterEnd(S.timerFires); }, ms);
  };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); stopPending(); },
    onResume: () => { S.resume(session.current); if (session.current.pending === 'end') armPending(BREATH_MS); },
    onRestart: () => { clearAll(); silenceScheduled(); S.toTitle(session.current); prepare(live.current.level); sync(); },
    onLevels: () => { clearAll(); silenceScheduled(); S.openLevels(session.current); sync(); },
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

  // ---- an open parent gate shuts on the next touch anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.sj-grown .kk-gate-open, .sj-grown .kk-gate');
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
    prepare(id);
    setSerial(s.serial);
    setGateKey(key => key + 1);
    sound.tap();
    sync();
  }

  /** The end screen comes (by the timer or the ▶ button): its stars sound, and a finale gets its tune. */
  function enterEnd(go: (s: S.Session, now: number) => unknown) {
    const s = session.current;
    go(s, performance.now());
    if (s.screen === 'end') {
      const done = resultOf(roundRef.current);
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(levelOf(done.level).world); if (!live.current.slow) confetti({ count: 70, y: 0.3 }); }
      }
    }
    sync();
  }

  /** An answer, by finger or key. */
  function pick(key: string) {
    const s = session.current, before = roundRef.current;
    if (S.tapAnswer(s) !== 'counts') return;
    const next = answer(before, key);
    if (next === before) return;
    setGhost(false);
    const spec = levelOf(before.level), item = itemOf(before), still = live.current.slow;
    setRound(next);
    if (next.last === 'again') {
      sound.tap();
      const shown = item.kind === 'place' ? PLANETS[next.slots[Number(key)]] : PLANETS.find(planet => planet.id === key);
      if (shown) setSay({ title: shown.name, text: shown.fact, tone: 'found' });
      return;
    }
    if (next.last === 'wrong') {
      sound.slip();
      setWobble(value => ({ key, n: (value?.n ?? 0) + 1 }));
      setSay({ text: hintOf(next, key), tone: 'hint' });
      return;
    }
    setWobble(null);
    if (onBoard(spec.mode)) {
      setRocketAt(item.planet); setFlight(count => count + 1);
      if (!still) sound.launch();
      sound.arrive(item.planet, still ? 0 : 0.38);
    } else sound.right(item.planet);
    setSay({ title: PLANETS[item.planet].name, text: revealOf(next), tone: 'found' });
    const last = isLast(next), button = waitsForButton(spec.mode);
    // The last answer finishes the round at this tap: stars saved, the limit checked. Only the end screen waits.
    if (S.solved(s, last, last ? kids.atBreak() : false, button)) {
      const done = resultOf(next);
      levels.record(done.level, done.stars);
      setResult(done);
      if (!button) armPending(still ? END_SLOW_MS : END_MS);
    }
    // The orbit board moves straight on; a reveal waits for the ▶ button.
    if (!button && !last) setRound(advance(next));
  }
  const tap: Tap = key => ({
    'data-key': key,
    // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
    onPointerDown: event => { if (!event.isPrimary || event.button !== 0) return; event.preventDefault(); pick(key); },
    // A screen reader's activation (a click with no pointer); a key press already picked through the window.
    onClick: event => { if (event.detail === 0 && performance.now() - keyPick.current > 400) pick(key); },
  });

  /** ▶: the next planet, or the end of the round. */
  function nextPlanet() {
    const s = session.current, current = roundRef.current;
    if (s.screen !== 'play' || s.paused || !current.solved) return;
    if (isLast(current)) { enterEnd(S.goEnd); return; }
    sound.next();
    const after = advance(current);
    setRound(after); setSay(askOf(after)); setWobble(null);
  }

  // ---- screens ----
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(live.current.level) || nextToPlay(levels.stars);
    clearAll(); S.toTitle(session.current);
    setLevel(after); prepare(after); sync();
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
      const enter = key === 'Enter' || key === ' ';
      if (s.screen === 'title' && enter) { event.preventDefault(); if (!event.repeat) begin(live.current.level); return; }
      if (s.screen === 'play') {
        const current = roundRef.current, at = '1234'.indexOf(key);
        if (at >= 0 && current.choices[at] && !current.solved) { event.preventDefault(); if (!event.repeat) { keyPick.current = performance.now(); pick(current.choices[at]); } return; }
        if (enter) {
          event.preventDefault();
          if (event.repeat) return;
          if (current.solved && waitsForButton(levelOf(current.level).mode)) { nextPlanet(); return; }
          const focused = (document.activeElement as HTMLElement | null)?.getAttribute?.('data-key');
          if (focused) { keyPick.current = performance.now(); pick(focused); }
        }
        return;
      }
      if (s.screen === 'end' && enter) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(live.current.level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  // ---- the parent card, drawn when the grown-up asks to see it ----
  useEffect(() => {
    if (!showing || !result || !card.current) return;
    let alive = true;
    loadCardFonts(`${doneLine(result.level)} সৌরজগতের সফর ${PLANETS.map(planet => planet.name).join(' ')}`).catch(() => undefined).then(() => {
      if (alive && card.current) drawCard(card.current, result, location.host);
    });
    return () => { alive = false; };
  }, [showing, result]);

  const spec = levelOf(screen === 'play' || screen === 'end' ? round.level : level), mode = spec.mode;
  const restUp = kids.resting && screen !== 'play';
  const glow = glowOn(round) && !round.solved;
  const doneUpTo = round.index + (round.solved ? 1 : 0);

  const sayBox = <div className={`sj-say ${say.tone}`} role="status" aria-live="polite">
    {say.title && <p className="sj-say-title">{say.title}</p>}
    <p>{say.text || '\u00a0'}</p>
  </div>;

  return <div ref={root} className="sj" data-world={spec.world} data-screen={screen} data-mode={mode} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="sj-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="সৌরজগতের সফর" text="ছোটদের জন্য গ্রহের নাম, ক্রম আর মাপ শেখার খেলা। ফ্রি, বিজ্ঞাপন নেই।" />
          <a className="kit-secondary sj-print-link" href="/sourojogot?print">গ্রহের কাট-আউট প্রিন্ট করো</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="sj-hud">
      <p className="sj-badge" title={WORLDS[spec.world].name}><b>{bn(placeOf(round.level))}</b><span>{spec.finale ?? spec.title}</span></p>
      <ol className="sj-strip" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(Math.min(doneUpTo, round.items.length))}টা হয়েছে`}>
        {round.items.map((other, index) => <li key={index} data-got={index < doneUpTo || undefined} data-now={(index === doneUpTo && screen === 'play') || undefined}
          style={index < doneUpTo ? { background: PLANETS[other.planet].color } : undefined} />)}
      </ol>
    </div>}

    {screen === 'play' && <>
      {onBoard(mode) ? <>
        <Board key={serial} round={round} slow={slow} paused={player.paused} glow={glow} ghost={ghost && round.index === 0 && !round.solved} rocketAt={rocketAt} flight={flight} wobble={wobble} tap={tap} />
        {mode === 'build' && !(round.solved && isLast(round)) && <div className="sj-tray" key={round.index}>
          <span className="sj-tray-art"><PlanetArt planet={planetOf(round)} box={100} r={36} ring={1.5} /></span>
          <span><b>{planetOf(round).name}</b><small>কোন পথে বসবে?</small></span>
        </div>}
      </> : <Quiz key={serial} round={round} slow={slow} ghost={ghost && round.index === 0 && !round.solved} wobble={wobble} tap={tap} onNext={nextPlanet}>{sayBox}</Quiz>}
      {onBoard(mode) && sayBox}
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `sourojogot-level-${result.level}.png`, make: () => cardBlob(result, location.host) }}>
      <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`সৌরজগতের সফরের কার্ড: ${doneLine(result.level)}।`} /></figure>
      <p>{doneLine(result.level)}।</p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
