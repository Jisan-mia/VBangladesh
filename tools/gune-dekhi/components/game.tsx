'use client';
// IP: what we avoided — no Sisimpur, Meena or any TV/app counting characters or look-alikes, no "Numberblocks"-style number creatures, no NCTB pictures; fish, mangoes, dice and ponds are our own code art.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, timers,
// the glimpse, pause and the rest screen, tap.ts tells a tap from a scroll); this file feeds taps and keys in, draws and plays the sounds.
import { useEffect, useReducer, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { confetti, newSeed, shake, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob } from '../lib/draw-card';
import { lined } from '../lib/items';
import { LEVELS, LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from '../lib/levels';
import { addToday, answer, answerOf, createRound, glows, isLast, nextItem, noToday, resultOf, tapFish, type Result, type Round, type Today } from '../lib/round';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { pressEnd, pressStart, type Press } from '../lib/tap';
import { Defs, DotRow, Eye, Finger, Fish, Pattern, WorldIcon } from './pictures';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { Title } from './title';
import { TodayCard } from './today-card';

const SLUG = 'gune-dekhi';
const NEXT_MS = 1100, NEXT_SLOW_MS = 1600, BREATH_MS = 500, GLIMPSE_MS = 1500, IDLE_MS = 7000;

const QUESTION = { count: 'প্রতিটা মাছে একবার চাপ দাও।', guni: 'কয়টা মাছ?', nojor: 'কয়টা দেখলে?', two: 'দুই দল মিলিয়ে কয়টা?', beshi: 'কোন পুকুরে মাছ বেশি?', koto: 'কয়টা মাছ বেশি?', merge: 'দুই পুকুর এক করলে কয়টা?' };
const HINT = { guni: 'শেষ মাছটার গায়ে যে নম্বর, সেটাই মোট।', nojor: 'আরেকবার দেখে নাও।', beshi: 'মাছগুলো জোড়ায় জোড়ায় সাজালাম। কোন দিকে বেশি?', koto: 'যে মাছের জোড়া নেই, সেগুলো গোনো।', merge: 'দুই পুকুর এক করে দিলাম, গুনে দেখো।' };

export function GuneGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [, sync] = useReducer((count: number) => count + 1, 0);
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<Today>(noToday);
  const [showing, setShowing] = useState(false);
  const [idle, setIdle] = useState(false);
  const [say, setSay] = useState('');
  const [gateKey, setGateKey] = useState(0);
  const [glimpseKey, setGlimpseKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const press = useRef<Press | null>(null);
  const live = useRef({ slow, level });
  live.current = { slow, level };
  const s = session.current;

  // ---- timers: the one pending timer (next pond / end screen), plus the small ones; all cleared together ----
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPending = () => { if (pendingTimer.current) clearTimeout(pendingTimer.current); pendingTimer.current = null; };
  const clearAll = () => stopPending();
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setLevel(nextToPlay(levels.stars));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __gd: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  // ---- the player: pause freezes the pending timer and the glimpse; resume gives them back after a breath ----
  const armPending = (ms: number) => {
    stopPending();
    pendingTimer.current = setTimeout(() => { pendingTimer.current = null; fire(); }, ms);
  };
  const player = useGamePlayer({
    onPause: () => { S.pause(s); stopPending(); sync(); },
    onResume: () => { S.resume(s); if (S.timerMayRun(s)) armPending(BREATH_MS); sync(); },
    onRestart: () => { clearAll(); S.toTitle(s); silenceScheduled(); setShowing(false); sync(); },
    onLevels: () => openLevels(),
  });

  // ---- away and back: the first tap back only wakes the game; nothing runs while the window isn't in front ----
  useEffect(() => {
    const away = () => { S.blur(s); stopPending(); sync(); };
    const back = () => { S.focus(s); if (S.timerMayRun(s) && !pendingTimer.current) armPending(BREATH_MS); sync(); };
    const onVisibility = () => { if (document.hidden) away(); else back(); };
    window.addEventListener('blur', away);
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', away); window.removeEventListener('focus', back); document.removeEventListener('visibilitychange', onVisibility); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ---- the glimpse of এক নজরে: 1.5 s, and only while someone is looking at the play screen ----
  const watch = S.watching(s), looking = s.looking, screen = s.screen;
  useEffect(() => {
    if (!S.glimpseMayRun(session.current)) return;
    const timer = setTimeout(() => { if (S.glimpseEnds(session.current)) { sound.hide(); sync(); } }, GLIMPSE_MS);
    return () => clearTimeout(timer);
  }, [looking, screen, watch, glimpseKey, round.index, round.level]);

  // ---- the ghost finger comes back when the child has waited a while ----
  useEffect(() => {
    setIdle(false);
    if (screen !== 'play' || !watch) return;
    const timer = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(timer);
  }, [round, screen, watch]);

  // ---- rounds ----
  function begin(id: number) {
    clearAll(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    const next = createRound(id, newSeed(), roundRef.current.eased, roundRef.current.rightRun);
    setRound(next);
    if (next.item.kind === 'nojor') S.showPattern(s);
    setResult(null); setShowing(false); setSay('');
    sound.tap();
    sync();
  }

  function fire() {
    if (!S.timerMayRun(s)) return;
    const was = s.pending;
    S.timerFires(s, performance.now());
    if (was === 'next') {
      const next = nextItem(roundRef.current);
      if (next) { setRound(next); setSay(''); if (next.item.kind === 'nojor') S.showPattern(s); sound.page(); }
    } else if (was === 'end') {
      const done = resultOf(roundRef.current);
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(worldOf(done.level).id); if (!live.current.slow) confetti({ count: 70, y: 0.3 }); }
      }
    }
    sync();
  }

  /** A finger on a fish. */
  function onFish(fish: number, element: HTMLElement) {
    const tap = S.tapOn(s);
    if (tap !== 'counts') return;
    const next = tapFish(roundRef.current, fish);
    if (!next) { sound.tap(); shake(element); return; }
    sound.count(next.counted.length);
    if (next.stage === 'pick') sound.counted();
    setRound(next);
  }

  /** A number tile or a pond. */
  function onAnswer(value: number, element: HTMLElement) {
    if (S.tapOn(s) !== 'counts') return;
    const before = roundRef.current;
    const { round: next, outcome } = answer(before, value);
    if (outcome === 'ignore') return;
    const spec = levelOf(before.level);
    if (outcome === 'again') {
      sound.miss(); shake(element);
      setSay(HINT[before.stage === 'koto' ? 'koto' : spec.kind === 'guni' ? 'guni' : spec.kind]);
      if (spec.kind === 'nojor') { S.showPattern(s); setGlimpseKey(key => key + 1); }
      setRound(next);
      sync();
      return;
    }
    sound.right(worldOf(before.level).id);
    setRound(next);
    setSay('');
    if (next.stage !== 'done') { sync(); return; }
    if (spec.kind === 'merge') sound.merge();
    const last = isLast(next);
    // The last pond finishes the round at this tap: stars saved, today counted, the limit checked. Only the end screen waits.
    if (S.solved(s, last, last ? kids.atBreak() : false)) {
      const done = resultOf(next);
      levels.record(done.level, done.stars);
      setResult(done);
      setToday(before => addToday(before, done));
    }
    armPending(live.current.slow ? NEXT_SLOW_MS : NEXT_MS);
    sync();
  }

  /** Looking again at the covered pattern. */
  function lookAgain() {
    if (S.tapOn(s) !== 'counts' || s.looking || roundRef.current.stage === 'done') return;
    sound.show(); S.showPattern(s); setGlimpseKey(key => key + 1); sync();
  }

  /** Acts on a finger that went down and came up on the same thing, close by (never on a scroll). Keyboard clicks work too. */
  const tapProps = (act: (element: HTMLElement) => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => { press.current = pressStart(event.nativeEvent, event.currentTarget); },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => { const tapped = pressEnd(press.current, event.nativeEvent, event.currentTarget); press.current = null; if (tapped) act(event.currentTarget); },
    onPointerCancel: () => { press.current = null; },
    onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) act(event.currentTarget); },
  });

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(s); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    setLevel(nextInOrder(roundRef.current.level) || nextToPlay(levels.stars));
    toTitle();
  };
  function openLevels() { stopPending(); S.openLevels(s); sound.tap(); sync(); }
  const closeLevels = () => { S.closeLevels(s); if (S.timerMayRun(s)) armPending(BREATH_MS); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(s); s.screen = 'title'; begin(id); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show')) return;
      const key = event.key;
      if (kids.resting && s.screen !== 'play') return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === 'title' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (!event.repeat) begin(live.current.level); return; }
      if (s.screen === 'play') {
        const at = '123'.indexOf(key);
        if (at >= 0 && !event.repeat) { const tile = tiles.current[at]; if (tile) { event.preventDefault(); tile.click(); } }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(roundRef.current.level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  // ---- what is on screen ----
  const shown = screen === 'play' || screen === 'end' ? levelOf(round.level) : levelOf(level);
  const item = round.item, stage = round.stage;
  const kind = item.kind;
  const worldHere = shown.world;
  const everPlayedHere = LEVELS.some(each => each.world === worldHere && levels.stars[each.id]);
  const firstTime = !everPlayedHere && round.index === 0 && round.tries === 0;
  const nextFish = item.kind === 'guni' && stage === 'count' ? Array.from({ length: item.n }, (_, index) => index).find(index => !round.counted.includes(index)) : undefined;
  const ghostFish = nextFish !== undefined && (firstTime || idle) ? nextFish : null;
  const asking = stage === 'pick' || stage === 'koto';
  const ghostAnswer = asking && (glows(round) || (firstTime && round.tries === 0) || (idle && round.tries > 0)) ? answerOf(round) : null;
  const question = stage === 'count' ? QUESTION.count
    : stage === 'koto' || (stage === 'done' && item.kind === 'beshi' && item.koto) ? QUESTION.koto
      : kind === 'nojor' ? (item.kind === 'nojor' && item.parts.length > 1 ? QUESTION.two : QUESTION.nojor) : QUESTION[kind];
  const pattern = item.kind === 'nojor' && (s.looking || stage === 'done');
  const restUp = kids.resting && screen !== 'play';
  const tileBox = (values: number[], pictures = false, wait = false) => <div className={`gd-tiles${wait ? ' is-wait' : ''}`}>
    {values.map((value, at) => {
      if (wait) return <span key={value} className="gd-tile is-empty" aria-hidden="true" />;
      const glow = glows(round) && value === answerOf(round), right = stage === 'done' && value === answerOf(round);
      return <button key={`${round.index}-${value}`} ref={node => { tiles.current[at] = node; }} type="button" className={`gd-tile${glow ? ' is-glow' : ''}${right ? ' is-right' : ''}`}
        aria-label={`${bn(at + 1)}: ${bn(value)}`} {...tapProps(element => onAnswer(value, element))}>
        <span className="gd-key" aria-hidden="true">{bn(at + 1)}</span>
        {pictures ? <DotRow n={value} /> : <b>{bn(value)}</b>}
        {ghostAnswer === value && <Finger />}
      </button>;
    })}
  </div>;

  function pond(side: 0 | 1) {
    if (item.kind !== 'beshi') return null;
    const count = item.counts[side], other = item.counts[1 - side], more = count > other;
    const line = round.tries > 0 || stage === 'koto' || (stage === 'done' && Boolean(item.koto));
    const spots = line ? lined(count) : item.spots[side];
    const scale = item.bigFewer ? (more ? 0.72 : 1.1) : 0.9;
    const glow = stage === 'pick' && glows(round) && more;
    return <button type="button" className={`gd-pond gd-small${glow ? ' is-glow' : ''}${stage !== 'pick' && more ? ' is-right' : ''}`} aria-label={`${side ? 'ডানের' : 'বাঁয়ের'} পুকুর`}
      style={{ '--fish': line ? '30%' : `${(count <= 6 ? 40 : 28) * scale}%` } as CSSProperties} {...tapProps(element => { if (stage === 'pick') onAnswer(side, element); })}>
      {spots.map((spot, index) => <span key={index} className={`gd-spot${line && index >= other ? ' is-extra' : ''}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}><span className="gd-swim" style={{ animationDelay: `${index * 70}ms` }}><Fish tint={spot.tint} flip={spot.flip} /></span></span>)}
      {ghostAnswer === side && <Finger />}
    </button>;
  }

  return <div ref={root} className="gd" data-world={worldHere} data-screen={screen} data-slow={slow || undefined}>
    <Defs />
    {screen === 'title' && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="gd-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য"><ShareToolLink title="গুনে দেখি" text="মাছ গুনে গুনে সংখ্যা শেখার খেলা, ৩–৬ বছরের জন্য। ফ্রি, অ্যাকাউন্ট লাগে না।" /></ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={s.back === 'play' ? round.level : level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="gd-hud">
      <p className="gd-badge"><WorldIcon world={worldHere} /><span><b>লেভেল {bn(placeOf(round.level))}</b><small>{shown.finale ?? shown.label}</small></span></p>
      <ol className="gd-dots" aria-label={`${bn(5)}টার ${bn(round.index + 1)} নম্বর`}>
        {Array.from({ length: 5 }, (_, index) => <li key={index} className={index < round.index || screen === 'end' || (index === round.index && stage === 'done') ? 'done' : index === round.index ? 'now' : ''} />)}
      </ol>
    </div>}

    {screen === 'play' && <>
      <p className="gd-q" aria-live="polite">{question}</p>
      {item.kind === 'guni' && <div className={`gd-field gd-pond gd-count${stage === 'done' ? ' is-cheer' : ''}`} key={`${round.seed}-${round.index}`} style={{ '--cols': item.grid[0], '--rows': item.grid[1] } as CSSProperties}>
        {item.spots.map((spot, index) => {
          const order = round.counted.indexOf(index), last = order === item.n - 1;
          return <button type="button" key={index} className={`gd-fish${order >= 0 ? ' is-on' : ''}`} style={{ left: `${spot.x}%`, top: `${spot.y}%`, '--i': order } as CSSProperties}
            aria-label={order >= 0 ? `মাছ, ${bn(order + 1)}` : 'মাছ, এখনো গোনা হয়নি'} {...tapProps(element => onFish(index, element))}>
            <span className="gd-swim" style={{ animationDelay: `${index * 90}ms` }}><Fish tint={spot.tint} flip={spot.flip} /></span>
            {order >= 0 && <i className="gd-ring" aria-hidden="true" />}
            {order >= 0 && <b className={`gd-badge-n${last && stage === 'pick' ? ' is-last' : ''}`} aria-hidden="true">{bn(order + 1)}</b>}
            {ghostFish === index && <Finger />}
          </button>;
        })}
      </div>}
      {item.kind === 'nojor' && <div className="gd-field gd-glimpse" key={`${round.seed}-${round.index}`}>
        {pattern
          ? <div className="gd-look">{item.parts.map((part, index) => <span key={index} className="gd-group">{index > 0 && <i className="gd-plus" aria-hidden="true">+</i>}<Pattern n={part} look={item.look} /></span>)}</div>
          : <button type="button" className="gd-look gd-cover" aria-label="আবার দেখাও" {...tapProps(lookAgain)}><span className="gd-cover-q" aria-hidden="true">?</span><Eye /></button>}
      </div>}
      {(item.kind === 'beshi' || item.kind === 'merge') && <div className={`gd-field gd-ponds${item.kind === 'merge' && (round.tries > 0 || stage === 'done') ? ' is-joined' : ''}`} key={`${round.seed}-${round.index}`}>
        {item.kind === 'beshi' ? <>{pond(0)}{pond(1)}</> : <>
          {([0, 1] as const).map(side => <div key={side} className={`gd-pond gd-small${stage === 'done' ? ' is-right' : ''}`} style={{ '--fish': '34%' } as CSSProperties}>
            {item.spots[side].map((spot, index) => <span key={index} className="gd-spot" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}><span className="gd-swim" style={{ animationDelay: `${index * 70}ms` }}><Fish tint={spot.tint} flip={spot.flip} /></span></span>)}
          </div>)}
          <span className="gd-sum" aria-hidden="true">{stage === 'done' ? bn(item.n) : '+'}</span>
        </>}
      </div>}
      {item.kind === 'guni' && tileBox(item.choices, false, stage === 'count')}
      {item.kind === 'nojor' && tileBox(item.choices, item.pictures)}
      {item.kind === 'merge' && tileBox(item.choices)}
      {item.kind === 'beshi' && (item.koto && (stage === 'koto' || stage === 'done') ? tileBox(item.koto) : <div className="gd-tiles gd-no-tiles" aria-hidden="true" />)}
      <p className="gd-msg" aria-live="polite">{say}</p>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: () => cardBlob(today, location.host) }}>
      <TodayCard today={today} />
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(s); sync(); }} />}
  </div>;
}
