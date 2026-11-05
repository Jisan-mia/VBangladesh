'use client';
// IP: what we avoided — no real phone maker's dial pad, body or ringtone, no TV or app characters; the toy phone, its pad and the ring are our own drawings and tones.
// The game inside the shared player. The rules live in lib/ (play.ts is a round, session.ts decides screens, the beat of the round, pause and
// the rest screen); this file feeds taps and keys in, runs the timed beats only while nobody is away, draws and plays the sounds.
// The number lives in page memory, and in this phone's storage only when a parent ticks keep behind the gate (lib/saved.ts). It never goes anywhere else.
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useGamePlayer } from '../../../shared/game-player-client';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from '../../../shared/kids-kit';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from '../lib/levels';
import {
  beats, bn, DEMO, dial, eyesLeft, expected, glows, hiddenCount, LOOK_LEAD, look, lookLength, missLine, newRound, nextPiece, opensWithLook, resultOf, sayLine,
  slots, somethingHidden, target, cardLine, whose, type Mode, type Result, type Round, type Who,
} from '../lib/play';
import { cardBlob, cardFontSample, drawCard } from '../lib/draw-card';
import { forget, loadSaved, save, type Numbers } from '../lib/saved';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { NumberForm } from './parent-form';
import { Backdrop, Cue, Eye, Face, Ghost, Handset, MiniLevel } from './pictures';
import { Title } from './title';

const SLUG = 'ammur-number';
const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const WOBBLE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }];
const IDLE_MS = 6500;

export function PhoneGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [tick, setTick] = useState(0);
  const bump = () => setTick(count => count + 1);
  // The numbers: page memory, filled from this phone's saved copy (if a parent kept one) and never written anywhere else.
  const [numbers, setNumbers] = useState<Numbers>({});
  const [stored, setStored] = useState<Numbers>({});
  const [who, setWho] = useState<Who>('ammu');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => newRound(1, DEMO));
  const roundRef = useRef(round);
  const [result, setResult] = useState<Result | null>(null);
  const [lit, setLit] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [byKey, setByKey] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const pads = useRef<Map<number, HTMLButtonElement>>(new Map());
  const taught = useRef(false);
  const whole = useRef(false);
  const live = useRef({ slow, level, stars: levels.stars, who });
  live.current = { slow, level, stars: levels.stars, who };

  // ---- the wobbles in flight, cancelled on a pause, a restart and unmount ----
  const flights = useRef<Animation[]>([]);
  const clearFlights = () => { for (const flight of flights.current) flight.cancel(); flights.current = []; };
  useEffect(() => () => { clearFlights(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const s = session.current;

  // ---- first load: the saved numbers (if a parent kept them), the level this phone is ready for, and `#og` for the preview image ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setLevel(nextToPlay(levels.stars));
    if (location.hash === '#og') { setNumbers({ ammu: DEMO }); setShowing(true); return; }
    const saved = loadSaved();
    setStored(saved); setNumbers(saved);
    if (!saved.ammu && saved.abbu) setWho('abbu');
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __am: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  // ---- the player ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); clearFlights(); bump(); },
    onResume: () => { S.resume(session.current); bump(); },
    onRestart: () => { clearFlights(); S.toTitle(session.current); silenceScheduled(); setShowing(false); setLit(null); bump(); },
    onLevels: () => { S.openLevels(session.current); bump(); },
  });

  // ---- away and back: the beats stop and start again from their first digit; the first tap back only wakes the game ----
  useEffect(() => {
    const away = () => { S.blur(session.current); clearFlights(); bump(); };
    const back = () => { S.focus(session.current); bump(); };
    const visibility = () => { if (document.hidden) away(); else back(); };
    window.addEventListener('blur', away);
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', away); window.removeEventListener('focus', back); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.am-grown .kk-gate-open, .am-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- the beats that run on a timer: the look, the rest between pieces, the ring. Only while nobody is away. ----
  // Leaving clears the timers (this cleanup); coming back runs this again, and a look plays again from its first digit.
  useEffect(() => {
    if (s.screen !== 'play' || S.held(s)) return;
    const r = roundRef.current, timers: ReturnType<typeof setTimeout>[] = [];
    const later = (action: () => void, ms: number) => timers.push(setTimeout(action, ms));
    if (s.phase === 'look') {
      const length = target(r), times = beats(length, live.current.slow);
      times.forEach((at, index) => later(() => { setLit(index); sound.lit(Number(r.number[index])); }, LOOK_LEAD + at));
      later(() => { setLit(null); if (S.lookDone(s)) bump(); }, lookLength(length, live.current.slow));
    } else if (s.phase === 'rest') {
      later(() => {
        const next = nextPiece(roundRef.current);
        if (S.restDone(s, opensWithLook(next))) { setRound(next); setMsg(''); bump(); }
      }, live.current.slow ? 1500 : 1000);
    } else if (s.phase === 'ring') {
      later(() => {
        if (!S.ringDone(s, performance.now())) return;
        const done = resultOf(roundRef.current), end = isWorldEnd(done.level);
        sound.stars(done.stars);
        if (end) sound.tune(worldOf(done.level).id);
        if (!live.current.slow && (whole.current || end)) confetti({ count: whole.current ? 110 : 60, y: 0.3 });
        bump();
      }, 1600);
    }
    return () => { timers.forEach(clearTimeout); setLit(null); };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps -- every change of beat or of who is away goes through bump(); a lit box must not restart the look

  // ---- the ghost finger comes back after a quiet wait ----
  useEffect(() => {
    setIdle(false);
    if (s.screen !== 'play' || s.phase !== 'dial' || S.held(s)) return;
    const timer = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(timer);
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showing) return;
    let alive = true;
    loadCardFonts(cardFontSample).then(() => { if (alive && card.current) drawCard(card.current, who, location.host); });
    return () => { alive = false; };
  }, [showing, who]);

  // ---- rounds ----
  const number = numbers[who] ?? DEMO;
  const demo = !numbers[who];
  function begin(id: number) {
    if (!isLevel(id)) return;
    clearFlights(); silenceScheduled();
    setLevel(id);
    const before = roundRef.current;
    const next = newRound(id, number, before.eased, before.rightRun);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak(), opensWithLook(next))) { bump(); return; }
    setRound(next); setResult(null); setShowing(false); setMsg(''); setByKey(false); setLit(null);
    sound.tap();
    bump();
  }

  /** A digit, by finger or key. */
  function tap(digit: number, element: HTMLElement | null, viaKey: boolean) {
    const before = roundRef.current;
    const answer = S.tapKey(s);
    if (answer === 'ignored') { if (s.screen === 'play' && s.phase === 'look') sound.no(); return; }
    if (answer === 'woke') { bump(); return; }
    const { round: next, event } = dial(before, digit);
    if (event === 'ignore') return;
    setByKey(viaKey); setIdle(false); taught.current = true;
    if (event === 'miss') {
      sound.miss(); setMsg(missLine(next));
      if (!live.current.slow && element) flights.current.push(element.animate(WOBBLE, { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }));
    } else {
      sound.key(digit); setMsg('');
      if (event === 'piece') sound.piece();
    }
    setRound(next);
    if (event === 'right' || event === 'piece' || event === 'end') {
      // The last digit finishes the round at this tap: stars saved and the limit checked now. Only the ring and the end screen wait.
      if (S.dialled(s, event, event === 'end' ? kids.atBreak() : false)) {
        const done = resultOf(next), stars = live.current.stars;
        const wasComplete = Array.from({ length: LEVEL_COUNT }, (_, at) => at + 1).every(id => stars[id]);
        const nowComplete = Array.from({ length: LEVEL_COUNT }, (_, at) => at + 1).every(id => id === done.level || stars[id]);
        whole.current = nowComplete && !wasComplete;
        levels.record(done.level, done.stars);
        setResult(done);
        sound.ring();
      }
    }
    bump();
  }

  /** The eye key. */
  function lookAgain(viaKey: boolean) {
    const before = roundRef.current, asked = look(before);
    if (!asked.allowed) { if (s.screen === 'play' && s.phase === 'dial' && !S.held(s)) sound.no(); return; }
    const answer = S.askLook(s);
    if (answer === 'woke') { bump(); return; }
    if (answer !== 'counts') return;
    setByKey(viaKey); setMsg('');
    setRound(asked.round);
    sound.eye();
    bump();
  }

  // ---- screens ----
  const toTitle = () => { clearFlights(); S.toTitle(s); setLit(null); bump(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    setLevel(nextInOrder(level) || nextToPlay(live.current.stars));
    toTitle();
  };
  const openLevels = () => { S.openLevels(s); sound.tap(); bump(); };
  const closeLevels = () => { S.closeLevels(s); bump(); };
  const pickLevel = (id: number) => { S.closeLevels(s); s.screen = 'title'; begin(id); };
  const pickWho = (person: Who) => { if (numbers[person] || person !== who) { sound.tap(); setWho(person); } };

  function setNumber(person: Who, value: string, keep: boolean) {
    setNumbers(before => ({ ...before, [person]: value }));
    if (keep) save(person, value); else forget(person);
    setStored(loadSaved());
    setWho(person); setGateKey(count => count + 1);
  }
  function clearNumbers() { forget(); setStored({}); setNumbers({}); setWho('ammu'); setGateKey(count => count + 1); }

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const where = event.target as HTMLElement | null;
      if (where?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show')) return;
      const key = event.key;
      if (kids.resting && s.screen !== 'play') return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === 'title' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (!event.repeat) begin(level); return; }
      if (s.screen === 'play') {
        if (/^[0-9]$/.test(key)) { event.preventDefault(); if (!event.repeat) tap(Number(key), pads.current.get(Number(key)) ?? null, true); return; }
        if (key === ' ' || key === 'Enter') { event.preventDefault(); if (!event.repeat) lookAgain(true); }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(roundRef.current.level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const spec = levelOf(s.screen === 'title' || s.screen === 'levels' ? level : round.level);
  const inRound = s.screen === 'play' || s.screen === 'end';
  const world = worldOf(inRound ? round.level : level);
  const restUp = S.restShows(s);
  const looking = s.screen === 'play' && s.phase === 'look';
  const dialling = s.screen === 'play' && s.phase === 'dial';
  const mode: Mode = s.phase;
  const left = eyesLeft(round), hidden = somethingHidden(round);
  const firstTime = !taught.current && Object.keys(levels.stars).length === 0;
  const ghostAt = !dialling || S.held(s) ? null : (firstTime || glows(round)) ? 'digit' : idle ? (hidden && left !== 0 && round.tries === 0 ? 'eye' : 'digit') : null;
  const want = round.stage === 'play' ? expected(round) : -1;
  const boxes = slots(round, looking);
  const press = (action: (element: HTMLElement) => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) { event.preventDefault(); action(event.currentTarget); } },
    onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
  });
  const keyButton = (digit: number) => <button type="button" key={digit} ref={node => { if (node) pads.current.set(digit, node); else pads.current.delete(digit); }}
    className={`am-key${glows(round) && digit === want && dialling ? ' is-glow' : ''}`} aria-label={bn(digit)}
    {...press(element => { tap(digit, element, false); element.blur(); })}>{bn(digit)}{ghostAt === 'digit' && digit === want && <Ghost />}</button>;
  const box = (index: number) => {
    const kind = boxes[index];
    return <span key={index} className={`am-box is-${kind}${lit === index ? ' is-lit' : ''}`} data-pop={index === round.typed - 1 && round.stage === 'play' ? '' : undefined}>
      {kind === 'hidden' ? '' : kind === 'later' ? '·' : bn(round.number[index])}
    </span>;
  };

  return <div ref={root} className="am" data-world={world.id} data-screen={s.screen} data-mode={s.screen === 'play' ? mode : undefined} data-held={S.held(s) || undefined}
    data-slow={slow || undefined} data-instant={byKey || undefined}>
    {s.screen === 'title' && <Title level={level} who={who} both={Boolean(numbers.ammu && numbers.abbu)} demo={demo} onStart={() => begin(level)} onLevels={openLevels} onWho={pickWho}>
      <div className="am-grown">
        <ParentGate key={gateKey} label={demo ? 'নম্বর দাও' : 'বড়দের জন্য'}>
          <NumberForm onSet={setNumber} onClear={clearNumbers} has={Boolean(numbers.ammu || numbers.abbu)} kept={Boolean(stored.ammu || stored.abbu)} />
          <ShareToolLink title="আম্মুর নম্বর" text="ছোটদের আম্মু-আব্বুর ফোন নম্বর মুখস্থ করার খেলা, ৪–৮ বছরের জন্য। নম্বর ফোনের বাইরে যায় না। ফ্রি, বিজ্ঞাপন নেই।" />
        </ParentGate>
      </div>
    </Title>}

    {s.screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {inRound && <>
      <Backdrop world={world.id} />
      <div className="am-hud">
        <p className="am-badge"><MiniLevel hide={spec.hide} pieces={spec.pieces} eyes={spec.eyes} className="am-badge-mini" />
          <span><b>{spec.finale ?? spec.title}</b><small>{spec.finale ? 'ফাইনাল' : `লেভেল ${bn(placeOf(round.level))}`}</small></span></p>
        <div className="am-meters">
          <ol className="am-pieces" aria-label={`${bn(spec.pieces.length)}টা টুকরো`}>
            {spec.pieces.map((count, index) => <li key={count} data-done={index < round.piece || (index === round.piece && round.stage !== 'play') || s.screen === 'end' || undefined} data-now={(index === round.piece && s.screen === 'play') || undefined} />)}
          </ol>
          {spec.eyes !== null && <p className="am-eyes" aria-label={`${bn(left ?? 0)}টা চোখ বাকি`}>
            {Array.from({ length: spec.eyes }, (_, index) => <Eye key={index} shut={index >= (left ?? 0)} className="am-eyes-eye" />)}
          </p>}
        </div>
      </div>
    </>}

    {s.screen === 'play' && <div className="am-phone">
      <div className="am-lcd" role="img" aria-label={`${whose(who)} নম্বর: ${bn(target(round))}টার ${bn(round.typed)}টা চাপা হয়েছে`}>
        <span className="am-lcd-head"><Cue mode={mode} /><Face who={who} className="am-lcd-face" /><span>{demo ? 'নমুনা নম্বর' : `${whose(who)} নম্বর`}</span></span>
        <span className="am-boxes">{[0, 1, 2, 3, 4].map(box)}<i>-</i>{[5, 6, 7].map(box)}<i>-</i>{[8, 9, 10].map(box)}</span>
      </div>
      <p className="am-say" aria-live="polite" data-kind={msg ? 'try' : undefined}>{msg || sayLine(round, who, mode)}</p>
      <div className="am-pad" data-wait={!dialling || undefined}>
        {KEYS.map(keyButton)}
        <button type="button" className="am-key am-eye" data-empty={left === 0 || undefined} aria-label={left === 0 ? 'আর দেখা যাবে না' : 'আবার দেখাও'}
          {...press(element => { lookAgain(false); element.blur(); })}>
          <Eye shut={left === 0} />{ghostAt === 'eye' && <Ghost />}
        </button>
        {keyButton(0)}
        <span className={`am-call${mode === 'ring' ? ' is-ringing' : ''}`} aria-hidden="true"><Handset /></span>
      </div>
    </div>}

    {s.screen === 'end' && result && <EndScreen result={result} round={round} who={who} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: () => cardBlob(who, location.host) }}>
      <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLine(who)} /></figure>
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(s); bump(); }} />}
  </div>;
}
