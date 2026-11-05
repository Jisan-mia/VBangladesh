'use client';
// IP: what we avoided — no NCTB textbook letters, stroke charts or pictures, no TV or app characters; the strokes are our own, the letters come from the open Noto font, the pictures are অ-তে অজগর's own drawings.
// The game inside the shared player. The rules live in lib/ (trace.ts follows the finger, session.ts decides screens,
// the finger, pause, rest and keys); components/paint.hot.ts paints the ink and the moving dot each frame; this file
// feeds touches and keys in, draws the board and plays the sounds.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useGamePlayer } from '../../../shared/game-player-client';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob, cardFontSample, drawCard } from '../lib/draw-card';
import { boardSize, pictureSize } from '../lib/layout';
import { LEVEL_COUNT, bn, isFinale, isLevel, levelOf, nextInOrder, nextToPlay, pictureOf, placeOf, printLevel, worldOf } from '../lib/levels';
import { resultOf, type Result } from '../lib/result';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { pathOf, strokesOf, type Pt } from '../lib/strokes';
import { againLetter, down, letterOf, move, newRound, nextLetter, strokeOf, up, type Event, type Round } from '../lib/trace';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { Arrow, GuideLetter, StartDot, StrokeLine } from './marks';
import { type Paint, paintFrame, setStroke, setTarget, startDemo, stopDemo } from './paint.hot';
import { PicCanvas } from './pic-canvas';
import { PrintSheet } from './print-sheet';
import { Title } from './title';

const SLUG = 'borno-likhi';
const OG_LETTERS = ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ'];
const HAND = 'M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z';
const REVEAL_MS = 380, LOOP_GAP = 2600, IDLE_MS = 1800, PEN_STEP = 2.5;

export function LikhiGame() {
  const [print, setPrint] = useState<number | null>(null);
  useEffect(() => { const value = new URLSearchParams(location.search).get('print'); if (value !== null) setPrint(printLevel(value)); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (!print) return;
    document.documentElement.classList.add('bl-printing');
    return () => document.documentElement.classList.remove('bl-printing');
  }, [print]);
  return print ? createPortal(<div className="bl-print-root tool-borno-likhi"><PrintSheet level={print} /></div>, document.body) : <Play />;
}

function Play() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const [reduce, setReduce] = useState(false);
  const still = slow || reduce;
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => newRound(1));
  const roundRef = useRef(round);
  const [game, setGame] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<string[]>([]);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [hand, setHand] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<SVGSVGElement>(null);
  const inkEl = useRef<SVGPathElement>(null), trailEl = useRef<SVGPathElement>(null), nibEl = useRef<SVGCircleElement>(null);
  const dotEl = useRef<SVGCircleElement>(null), ringEl = useRef<SVGCircleElement>(null), handEl = useRef<SVGSVGElement>(null), fingerEl = useRef<SVGCircleElement>(null);
  const paint = useRef<Paint>({ ink: null, trail: null, nib: null, dot: null, ring: null, hand: null, samples: null, last: 0, shown: 0, target: 0, still: false, tap: false, demo: false, demoAt: 0, demoTravel: 0, demoGap: 0, demoShowing: false });
  const frame = useRef({ raf: 0, at: 0 });
  const box = useRef<DOMRect | null>(null), lastPt = useRef<Pt | null>(null), pen = useRef<Pt | null>(null), ticked = useRef(0);
  const resultRef = useRef<Result | null>(null);
  const live = useRef({ still, level });
  live.current = { still, level };

  // ---- timers: the picture reveal, the idle replay, the pen's fade, the small ones; all cleared together ----
  const small = useRef(new Set<ReturnType<typeof setTimeout>>());
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null), idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null), penTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const later = (run: () => void, ms: number) => { const id = setTimeout(() => { small.current.delete(id); run(); }, ms); small.current.add(id); return id; };
  const cancel = (id: ReturnType<typeof setTimeout> | null) => { if (id) { clearTimeout(id); small.current.delete(id); } };
  const clearAll = () => {
    for (const id of small.current) clearTimeout(id);
    small.current.clear();
    revealTimer.current = idleTimer.current = penTimer.current = null;
    cancelAnimationFrame(frame.current.raf); frame.current.raf = 0;
  };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // ---- the frame loop: runs only while something is moving, never under the pause menu ----
  const tick = (now: number) => {
    const f = frame.current, dt = Math.min(48, now - f.at);
    f.at = now;
    f.raf = paintFrame(paint.current, dt) && !session.current.paused ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { const f = frame.current; if (f.raf) return; f.at = performance.now(); f.raf = requestAnimationFrame(tick); };

  // ---- first load: this phone's progress picks the set that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setHand(Object.keys(levels.stars).length === 0);
    setRound(newRound(ready));
  }, [levels.loaded, levels.stars]);

  // #og opens a fixed card for the site's preview image and saves nothing.
  useEffect(() => { if (location.hash === '#og') { setToday(OG_LETTERS); setShowing(true); } }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __bl: { round: () => roundRef.current, session: () => session.current, paint: () => paint.current } });
  }, []);

  // ---- the player: pause releases the finger and stops the frames; resume gives them back ----
  const releaseFinger = () => {
    lastPt.current = null; pen.current = null; box.current = null;
    fingerEl.current?.setAttribute('visibility', 'hidden');
    cancel(penTimer.current); penTimer.current = null;
  };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); releaseFinger(); cancelAnimationFrame(frame.current.raf); frame.current.raf = 0; },
    onResume: () => { S.resume(session.current); kick(); },
    onRestart: () => { clearAll(); silenceScheduled(); releaseFinger(); S.toTitle(session.current); setRevealed(false); setShowing(false); sync(); },
    onLevels: () => { openLevels(); },
  });

  // ---- away and back: the finger is released, and the first tap back only wakes the game ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); releaseFinger(); };
    const onFocus = () => S.focus(session.current);
    const onVisibility = () => { if (document.hidden) onBlur(); else onFocus(); };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const away = (event: PointerEvent) => {
      const open = node.querySelector('.bl-grown .kk-gate-open, .bl-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', away, true);
    return () => node.removeEventListener('pointerdown', away, true);
  }, []);

  // ---- the painter follows the current stroke ----
  const spec = levelOf(round.level), world = spec.world;
  const playing = screen === 'play' && round.index < round.letters.length;
  const letter = round.index < round.letters.length ? letterOf(round) : spec.letters[spec.letters.length - 1];
  const strokes = strokesOf(letter), current = strokeOf(round);
  useLayoutEffect(() => {
    const p = paint.current;
    p.ink = inkEl.current; p.trail = trailEl.current; p.nib = nibEl.current; p.dot = dotEl.current; p.ring = ringEl.current; p.hand = handEl.current;
    p.still = still;
    const stroke = playing && !roundRef.current.letterDone ? strokeOf(roundRef.current) : undefined;
    setStroke(p, stroke ? stroke.samples : null, stroke ? roundRef.current.reach : 0);
    paintFrame(p, 0);
  }, [playing, round.index, round.stroke, round.letterDone, game, still]);

  const demoNow = (gap: number) => {
    const p = paint.current;
    if (!p.samples || session.current.pointer !== null || session.current.paused) return;
    startDemo(p, gap);
    if (still) later(() => { stopDemo(p); paintFrame(p, 0); }, 2500);
    kick();
  };
  // A new stroke shows its order once, by a moving dot, and (outside a finale) loops until a finger touches it.
  useEffect(() => {
    if (!playing || round.letterDone) return;
    const id = later(() => demoNow(isFinale(live.current.level) ? 0 : LOOP_GAP), round.stroke === 0 && round.index === 0 ? 450 : 550);
    return () => cancel(id);
  }, [playing, round.index, round.stroke, round.letterDone, game]);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    clearAll(); silenceScheduled(); releaseFinger();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a set is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    setRound(newRound(id, roundRef.current.pace));
    setRevealed(false); setResult(null); resultRef.current = null; setToday([]); setShowing(false); ticked.current = 0;
    setGame(count => count + 1);
    sound.tap();
    sync();
  }

  function handle([next, event]: [Round, Event]) {
    const before = roundRef.current;
    roundRef.current = next;
    const p = paint.current;
    if (event !== 'stroke' && event !== 'letter') { setTarget(p, next.reach); kick(); }
    if (!event) {
      if (next.reach - ticked.current >= 6) { ticked.current = next.reach; sound.ink(next.reach); }
      return;
    }
    ticked.current = 0; pen.current = null;
    if (event === 'stroke') sound.stroke(levelOf(next.level).world);
    if (event === 'letter') {
      const s = session.current, last = next.index + 1 >= next.letters.length;
      sound.stroke(levelOf(next.level).world);
      sound.picture(levelOf(next.level).world);
      fingerEl.current?.setAttribute('visibility', 'hidden');
      // The last letter is the win: the stars are saved and the limit checked in this very touch, whatever comes next.
      if (S.letterDone(s, last, last ? kids.atBreak() : false, performance.now())) {
        const done = resultOf(next);
        levels.record(done.level, done.stars);
        resultRef.current = done; setResult(done);
      }
      setToday(list => [...list, letterOf(next)]);
      cancel(revealTimer.current);
      revealTimer.current = later(() => setRevealed(true), still ? 0 : REVEAL_MS);
    }
    if (event === 'help') demoNow(0);
    if (before !== next) setRound(next);
  }

  const toBox = (x: number, y: number): Pt => {
    const rect = box.current ?? board.current?.getBoundingClientRect();
    return rect ? [(x - rect.left) / rect.width * 100, (y - rect.top) / rect.height * 100] : [0, 0];
  };
  const showFinger = (point: Pt) => {
    fingerEl.current?.setAttribute('cx', point[0].toFixed(1));
    fingerEl.current?.setAttribute('cy', point[1].toFixed(1));
    fingerEl.current?.setAttribute('visibility', 'visible');
  };

  function onDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const s = session.current;
    if (S.touchDown(s, event.pointerId) !== 'counts') return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a synthetic or already-lifted pointer */ }
    box.current = event.currentTarget.getBoundingClientRect();
    cancel(idleTimer.current); idleTimer.current = null;
    stopDemo(paint.current); paintFrame(paint.current, 0);
    setHand(false);
    sound.touch();
    const point = toBox(event.clientX, event.clientY);
    lastPt.current = point;
    showFinger(point);
    handle(down(roundRef.current, point));
  }
  function onMove(event: ReactPointerEvent<SVGSVGElement>) {
    const s = session.current;
    if (!S.touchMove(s, event.pointerId, event.buttons)) { if (s.pointer === null && lastPt.current) releaseFinger(); return; }
    const native = event.nativeEvent, coalesced = native.getCoalescedEvents ? native.getCoalescedEvents() : [], points = coalesced.length ? coalesced : [native];
    for (const part of points) {
      const point = toBox(part.clientX, part.clientY);
      showFinger(point);
      handle(move(roundRef.current, lastPt.current ?? point, point));
      lastPt.current = point;
      if (s.pointer === null) break;
    }
  }
  function onUp(event: ReactPointerEvent<SVGSVGElement>) {
    const s = session.current;
    if (!S.touchUp(s, event.pointerId)) return;
    releaseFinger();
    handle(up(roundRef.current));
    // Lifted mid-stroke and idle: the moving dot shows the way again, a little later.
    if (s.letter === 'tracing' && !isFinale(live.current.level)) { cancel(idleTimer.current); idleTimer.current = later(() => demoNow(LOOP_GAP), IDLE_MS); }
  }

  /** The keyboard's pen: arrow keys move it, and it has to follow the path like a finger. Enter never writes. */
  function penKey(dx: number, dy: number) {
    const s = session.current, now = roundRef.current, stroke = strokeOf(now);
    if (!stroke || s.pointer !== null || now.letterDone) return;
    stopDemo(paint.current);
    if (stroke.dot) { handle(down(now, stroke.samples[0])); return; }
    const from: Pt = pen.current ?? stroke.samples[Math.min(stroke.samples.length - 1, now.reach)];
    const to: Pt = [Math.min(100, Math.max(0, from[0] + dx * PEN_STEP)), Math.min(100, Math.max(0, from[1] + dy * PEN_STEP))];
    pen.current = to;
    showFinger(to);
    handle(move(now, from, to));
    cancel(penTimer.current);
    penTimer.current = later(() => { pen.current = null; fingerEl.current?.setAttribute('visibility', 'hidden'); }, 900);
  }

  function goNext() {
    const s = session.current, step = S.goNext(s, performance.now());
    if (step === 'ignored') return;
    sound.tap();
    cancel(revealTimer.current); revealTimer.current = null;
    setRevealed(false);
    const now = roundRef.current;
    setRound(nextLetter(now));
    if (step === 'end') {
      const done = resultRef.current ?? resultOf(now);
      if (!s.resting) {
        sound.stars(done.stars);
        if (isFinale(done.level)) { sound.tune(levelOf(done.level).world); if (!live.current.still) confetti({ count: 70, y: 0.3 }); }
      }
      sync();
    }
  }
  function again() {
    if (!S.writeAgain(session.current)) return;
    sound.tap();
    cancel(revealTimer.current); revealTimer.current = null;
    setRevealed(false); ticked.current = 0;
    setRound(againLetter(roundRef.current));
    setGame(count => count + 1);
  }
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishSet = () => {
    // শেষ: back to the cover, with the next set ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(newRound(after, roundRef.current.pace));
    toTitle();
  };
  function openLevels() {
    const s = session.current;
    if (s.screen === 'levels') return;
    cancel(idleTimer.current); idleTimer.current = null;
    releaseFinger();
    S.openLevels(s); sound.tap(); sync();
  }
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = 'title'; begin(id); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show')) return;
      const s = session.current;
      if (kids.resting && s.screen !== 'play') return;
      const action = S.route(s, event.key, event.repeat, event.timeStamp);
      if (!action) return;
      event.preventDefault();
      if (action === 'pause') player.requestPause();
      else if (action === 'start') begin(level);
      else if (action === 'again') begin(round.level);
      else if (action === 'demo') demoNow(0);
      else if (action === 'next') goNext();
      else penKey(action === 'left' ? -1 : action === 'right' ? 1 : 0, action === 'up' ? -1 : action === 'down' ? 1 : 0);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  // The picture a finished letter turns into is as big as the board allows (CSS and canvas share one formula).
  const bs = boardSize(player.stage.width, player.stage.height), ps = pictureSize(bs);
  const picture = pictureOf(letter), lastLetter = round.index + 1 >= round.letters.length;
  const restUp = kids.resting && screen !== 'play';
  const cardLetters = [...new Set(today)];
  const card = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!showing) return;
    let on = true;
    loadCardFonts(cardFontSample(cardLetters)).then(() => { if (on && card.current) drawCard(card.current, cardLetters, location.host); });
    return () => { on = false; };
  }, [showing, today]);
  const curve = current && !current.dot ? pathOf(current.line) : '';

  return <div ref={root} className="bl" data-world={screen === 'title' || screen === 'levels' ? worldOf(level).id : world} data-screen={screen} data-slow={still || undefined}
    style={{ '--bs': `${bs}px`, '--ps': `${ps}px` } as CSSProperties}>
    {screen === 'title' && <Title level={level} still={still} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="bl-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="বর্ণ লিখি" text="অ আ ক খ আর ০–৯ আঙুলে লেখার খেলা: কোন দাগ আগে, মাত্রা কখন। ৪–৭ বছর, ফ্রি।" />
          <a className="kit-secondary bl-print-link" href={`/borno-likhi?print=${level}`}>খাতার পাতা: {levelOf(level).title}</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {screen === 'play' && <>
      <div className="bl-hud">
        <p className="bl-badge"><span className="bl-badge-no" aria-label={`সেট ${bn(placeOf(round.level))}`}>{bn(placeOf(round.level))}</span>{spec.finale && <b>{spec.finale}</b>}</p>
        <ol className="bl-chips" aria-label={`${bn(round.letters.length)}টার মধ্যে ${bn(Math.min(round.index + 1, round.letters.length))} নম্বর`}>
          {round.letters.map((char, index) => <li key={char + index} className={index < round.index || (index === round.index && round.letterDone) ? 'is-done' : index === round.index ? 'is-now' : ''}>{char}</li>)}
        </ol>
      </div>

      <div className="bl-sheet" data-done={round.letterDone || undefined}>
        <svg ref={board} className="bl-board" viewBox="0 0 100 100" data-hand={hand || undefined} role="img"
          aria-label={round.letterDone ? `${letter} লেখা হয়ে গেছে` : `${letter} লেখার ঘর: ${bn(strokes.length)}টা দাগের ${bn(round.stroke + 1)} নম্বর। আঙুলে টানো, কিবোর্ডে তীর-চাবি।`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}>
          <g key={`${game}-${round.index}`} className="bl-letter">
            <GuideLetter char={letter} />
            {strokes.map((stroke, index) => <StrokeLine key={index} stroke={stroke} className={index < round.stroke || round.letterDone ? 'bl-done-line' : index === round.stroke ? 'bl-now' : 'bl-later'} />)}
            {current && !round.letterDone && <>
              <Arrow stroke={current} />
              <StartDot stroke={current} n={round.stroke + 1} className="bl-start bl-glow" />
            </>}
          </g>
          <path ref={trailEl} className="bl-trail" d={curve} pathLength={1} />
          <path ref={inkEl} className="bl-ink" d={curve} pathLength={1} />
          <circle ref={nibEl} className="bl-nib" r={2.7} />
          <circle ref={ringEl} className="bl-pen-ring" r={4.4} />
          <circle ref={dotEl} className="bl-pen" r={2.8} />
          <svg ref={handEl} className="bl-hand" width={17.3} height={21.6} viewBox="0 0 48 60" aria-hidden="true"><path d={HAND} /></svg>
          <circle ref={fingerEl} className="bl-finger" r={4.2} visibility="hidden" />
        </svg>
        {round.letterDone && <div className="bl-reveal" data-on={revealed || undefined} role="status">
          <span className="bl-reveal-letter">{letter}</span>
          <PicCanvas pic={picture.pic} size={ps} className="bl-reveal-pic" />
          <p className="bl-reveal-word">{picture.label}</p>
        </div>}
      </div>

      <div className="bl-bar">
        {round.letterDone ? <>
          <button type="button" className="bl-again" aria-label="আবার লিখি" onClick={event => { event.currentTarget.blur(); again(); }}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
            <span>আবার লিখি</span>
          </button>
          <button type="button" className="bl-next" aria-label={lastLetter ? 'শেষ' : 'পরেরটা'} onClick={event => { event.currentTarget.blur(); goNext(); }}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 24h30M26 11l13 13-13 13" /></svg>
            <span>{lastLetter ? 'শেষ' : 'পরেরটা'}</span>
          </button>
        </> : <>
          <button type="button" className="bl-show" aria-label="দেখাও: কোন দিকে টানবে" onClick={event => { event.currentTarget.blur(); sound.tap(); demoNow(0); }}>
            <svg viewBox="0 0 48 48" aria-hidden="true"><path className="bl-show-line" d="M7 36C14 12 28 12 34 30" /><circle cx="35" cy="34" r="5" /></svg>
            <span>দেখাও</span>
          </button>
          <p className="bl-name" aria-hidden="true">{letter}</p>
          <div className="bl-teaser" aria-hidden="true"><PicCanvas pic={picture.pic} size={72} /></div>
        </>}
      </div>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={still} onAgain={() => begin(round.level)} onDone={finishSet} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: () => cardBlob(cardLetters, location.host) }}>
      <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`আজ আঙুলে লেখা: ${cardLetters.join(' ')}`} /></figure>
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
