'use client';
// IP: what we avoided — no NCTB textbook pages, words or pictures, no TV characters, no app's look; the "machine" is plain CSS and every picture is our own code art.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, pause and
// the rest screen, and the child-paced step to the next word); this file feeds taps and keys in, draws, and plays the sounds.
// There are no timers: the game moves only when the child taps.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, fitCanvas, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob } from '../lib/card';
import { ALL_JOINTS, GRAND_FINALE, LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, printLevel, worldOf, emblemOf } from '../lib/levels';
import {
  createRound, currentStep, hint, isLast, jointOf, marksOf, nextStep, place, resultOf, tiles as tilesOf, unplace, wanted, whyLine, type Result, type Round,
} from '../lib/round';
import { drawWorld } from '../lib/scene';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { equation, shapeNote, conjunct } from '../lib/words';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { PrintSheet } from './print-sheet';
import { RoundCard } from './round-card';
import { Title } from './title';
import { Gear, WordLine, WordPicture } from './word-parts';

const SLUG = 'juktoborno';
const BOOK_KEY = 'ektukhani-juktoborno-book';

const readBook = (): string[] => { try { const saved = JSON.parse(localStorage.getItem(BOOK_KEY) ?? '[]'); return Array.isArray(saved) ? saved.filter((joint: string) => ALL_JOINTS.includes(joint)) : []; } catch { return []; } };
const writeBook = (book: string[]) => { try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); } catch { /* private mode */ } };

export function JuktobornoGame() {
  const [print, setPrint] = useState<number | null>(null);
  useEffect(() => { const value = new URLSearchParams(location.search).get('print'); if (value !== null) setPrint(printLevel(value)); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (print === null) return;
    document.documentElement.classList.add('jb-printing');
    return () => document.documentElement.classList.remove('jb-printing');
  }, [print]);
  return print !== null ? createPortal(<div className="jb-print-root tool-juktoborno"><PrintSheet level={print} /></div>, document.body) : <Play />;
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
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [book, setBook] = useState<string[]>([]);
  const [fresh, setFresh] = useState<string[]>([]);
  /** Counts misses, so the machine wobbles anew on every one. */
  const [missTick, setMissTick] = useState(0);
  const root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), backdrop = useRef<HTMLCanvasElement>(null);
  const tileNodes = useRef<(HTMLButtonElement | null)[]>([]);
  const keyPick = useRef(0);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);
  useEffect(() => () => { silenceScheduled(); }, []);
  useEffect(() => { setBook(readBook()); }, []);

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
    Object.assign(window, { __jb: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  // ---- the player: the game has no timers, so pause only closes the door; resume gives a fresh hand ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); },
    onResume: () => { S.resume(session.current); },
    onRestart: () => { silenceScheduled(); S.toTitle(session.current); setShowing(false); sync(); },
    onLevels: () => { openLevels(); },
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
      const open = node.querySelector('.jb-grown .kk-gate-open, .jb-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    setRound(createRound(id, newSeed(), roundRef.current.pace));
    setResult(null); setShowing(false); setFresh([]);
    sound.tap();
    sync();
  }

  /** A letter tile, by finger or key. */
  function pick(letter: string) {
    const s = session.current, before = roundRef.current;
    if (S.tapLetter(s) !== 'counts') return;
    const { round: after, outcome } = place(before, letter);
    if (outcome === 'ignore') return;
    const world = worldOf(before.level).id;
    setRound(after);
    if (outcome === 'fill') { sound.drop(); return; }
    setGhost(false);
    if (outcome === 'right') {
      sound.join(world);
      const joint = conjunct(currentStep(after).word.parts);
      if (!readBook().includes(joint)) { const grown = [...readBook(), joint]; writeBook(grown); setBook(grown); setFresh(before => before.includes(joint) ? before : [...before, joint]); }
      const last = isLast(after);
      // The last word finishes the round at this tap: stars saved, the limit checked. Only the end screen waits for পরেরটা.
      if (S.solved(s, last, last ? kids.atBreak() : false, performance.now())) {
        const done = resultOf(after);
        levels.record(done.level, done.stars);
        setResult(done);
      }
    } else {
      sound.miss();
      setMissTick(tick => tick + 1);
    }
  }

  function takeBack() {
    const s = session.current, before = roundRef.current;
    if (S.tapLetter(s) !== 'counts') return;
    const after = unplace(before);
    if (after === before) return;
    sound.back();
    setRound(after);
  }

  /** পরেরটা, or the page after the last word. */
  function advance(now: number) {
    const s = session.current, before = roundRef.current, last = isLast(before);
    if (S.tapNext(s, now, last) !== 'ok') return;
    if (last) {
      const done = resultOf(before), spec = levelOf(done.level);
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(spec.world); if (!live.current.slow) confetti({ count: done.level === GRAND_FINALE ? 110 : 70, y: 0.3 }); }
      }
    } else {
      setRound(nextStep(before));
      sound.page();
    }
    sync();
  }

  // ---- screens ----
  const toTitle = () => { silenceScheduled(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the factory, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(createRound(after, newSeed(), roundRef.current.pace));
    toTitle();
  };
  function openLevels() { const s = session.current; if (s.screen === 'levels') return; S.openLevels(s); sync(); }
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => {
    const s = session.current;
    // The round in progress comes back as it was; only another level starts a new round.
    if (s.back === 'play' && id === roundRef.current.level) { S.closeLevels(s); sync(); return; }
    S.closeLevels(s); s.screen = 'title';
    begin(id);
  };

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
        if (key === 'Backspace') { event.preventDefault(); if (!event.repeat) takeBack(); return; }
        if (s.waiting) {
          if (key === 'Enter' || key === ' ') { event.preventDefault(); if (S.freshNextKey(s, event.timeStamp, event.repeat)) advance(event.timeStamp); }
          return;
        }
        const at = '12345'.indexOf(key);
        const shown = tilesOf(roundRef.current);
        if (at >= 0) { event.preventDefault(); const letter = shown[at]; if (letter && !event.repeat) { keyPick.current = performance.now(); pick(letter); } return; }
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          const focused = tileNodes.current.findIndex(tile => tile && tile === document.activeElement);
          if (focused >= 0 && !event.repeat) { keyPick.current = performance.now(); pick(shown[focused]); }
        }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshEndKey(s, event.timeStamp, event.repeat)) begin(level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  // ---- the world's backdrop, drawn once per world and size ----
  const world = worldOf(screen === 'play' || screen === 'end' ? round.level : level).id;
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

  // The picture grows with the stage: 64 px on a short phone, up to 150 px on a tall one.
  const stageH = player.stage.height || 760;
  const picture = Math.round(Math.max(64, Math.min(150, stageH - 500)));

  const step = currentStep(round), spec = levelOf(round.level), juri = step.mode === 'juri';
  const help = hint(round), want = wanted(round), marks = marksOf(round);
  const joint = jointOf(round), shown = round.solved ? null : tilesOf(round);
  const note = round.solved ? shapeNote(step.word.parts) : whyLine(round);
  const ask = juri ? 'ছবির নামটা বলো। ফাঁকা ঘরের যুক্তবর্ণে কোন কোন বর্ণ?' : `${joint}-তে কোন কোন বর্ণ? যেটা আগে, সেটা আগে বসাও।`;
  const restUp = kids.resting && screen !== 'play';
  const last = isLast(round);

  const slot = (index: number) => {
    const letter = round.filled[index], tried = !letter && round.last && round.last.outcome !== 'right' && !round.filled.length ? round.last.tried[index] : undefined;
    const mark = tried ? marks[index] : undefined;
    return <button type="button" key={index} className={`jb-slot${letter ? ' is-full' : ''}${tried ? ` is-tried is-${mark}` : ''}`}
      aria-label={letter ? `${letter}, ফিরিয়ে নাও` : tried ? `${tried}, ${mark === 'right' ? 'ঠিক জায়গায় ছিল' : 'এখানে হয়নি'}` : `${bn(index + 1)} নম্বর ঘর, ফাঁকা`}
      onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary && event.button === 0) { event.preventDefault(); takeBack(); } }}
      onClick={event => { if (event.detail === 0) takeBack(); }}>
      {letter ?? tried ?? ''}{mark && <span className="jb-mark" aria-hidden="true">{mark === 'right' ? '✓' : '–'}</span>}
    </button>;
  };
  const slots = step.word.parts.map((_, index) => <span className="jb-part" key={index}>{index > 0 && <i aria-hidden="true">+</i>}{slot(index)}</span>);
  const block = <span className={`jb-block${round.solved ? ' is-done' : ''}${juri && !round.solved ? ' is-empty' : ''}`} aria-label={juri && !round.solved ? 'যুক্তবর্ণ, এখনো ফাঁকা' : joint}>
    {juri && !round.solved ? '?' : joint}
  </span>;

  return <div ref={root} className="jb" data-world={world} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} size={Math.min(130, picture)} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="jb-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="যুক্তবর্ণ ভাঙি-জুড়ি" text="ক্ষ = ক + ষ। ছবির শব্দে যুক্তবর্ণ ভাঙা-জোড়ার খেলা, ৭–১০ বছরের জন্য। ফ্রি।" />
          <a className="kit-secondary jb-print" href={`/juktoborno?print=${level}`}>প্রিন্টের পাতা: {levelOf(level).title}</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={session.current.back === 'play' ? round.level : level} book={book} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="jb-hud">
      <p className="jb-badge"><span className="jb-badge-sign" aria-hidden="true">{emblemOf(round.level).join(' ')}</span>
        <span><b>{spec.finale ? 'সব মিলিয়ে' : juri ? 'জুড়ি' : 'ভাঙি'}</b><small>লেভেল {bn(placeOf(round.level))}</small></span></p>
      <ol className="jb-strip" aria-label={`${bn(round.steps.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
        {round.steps.map((each, index) => {
          const got = index < round.index || (index === round.index && round.solved);
          return <li key={index} data-got={got || undefined} data-now={(index === round.index && screen === 'play') || undefined}>{got && <WordPicture pic={each.word.pic} size={20} />}</li>;
        })}
      </ol>
    </div>}

    {screen === 'play' && <>
      <div className="jb-panel" ref={panel}>
        <canvas ref={backdrop} className="jb-backdrop" aria-hidden="true" />
        <div className="jb-scene">
          <div key={round.index} className={`jb-pic${round.solved ? ' alive' : ''}`}><WordPicture pic={step.word.pic} size={picture} /></div>
        </div>
        <p className="jb-wordline"><WordLine word={step.word} gap={juri && !round.solved} fresh={juri && round.solved} /></p>
      </div>

      <div key={missTick} className={`jb-machine${round.solved ? ' is-done' : ''}${round.last && round.last.outcome !== 'right' ? ' is-missed' : ''}`} data-n={step.word.parts.length} data-mode={step.mode} role="group" aria-label={juri ? 'বর্ণ জোড়ার কারখানা' : 'যুক্তবর্ণ ভাঙার কারখানা'}>
        <Gear spin={round.solved} />
        {juri ? <>{slots}<i aria-hidden="true">=</i>{block}</> : <>{block}<i aria-hidden="true">=</i>{slots}</>}
      </div>

      <p className={`jb-say${note ? ' is-note' : ''}`} aria-live="polite">
        {round.solved ? <><b>{equation(step.word.parts)}</b>{note && <span> {note}</span>}</> : note || ask}
      </p>

      {round.solved
        ? <button type="button" className="jb-next" onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary && event.button === 0) { event.preventDefault(); advance(performance.now()); } }}
            onClick={event => { if (event.detail === 0 && performance.now() - keyPick.current > 400) advance(event.timeStamp); }}>
            <span>{last ? 'পাতাটা দেখো' : 'পরেরটা'}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">{last ? <path d="M5 12.5l4.5 4.5L19 7" /> : <path d="M5 12h14M13 6l6 6-6 6" />}</svg>
          </button>
        : <div className="jb-tiles" data-n={shown?.length} role="group" aria-label="বর্ণগুলো">
          {shown?.map((letter, at) => {
            const glow = help >= 2 && letter === want;
            return <button type="button" key={`${round.index}-${letter}`} ref={node => { tileNodes.current[at] = node; }} className={`jb-tile${glow ? ' is-glow' : ''}`} aria-label={`${bn(at + 1)}: ${letter}`}
              onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
                // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
                if (!event.isPrimary || event.button !== 0) return;
                event.preventDefault();
                pick(letter);
              }}
              // A screen reader's activation (a click with no pointer); a key press already picked through the window.
              onClick={event => { if (event.detail === 0 && performance.now() - keyPick.current > 400) pick(letter); }}>
              <span className="jb-key" aria-hidden="true">{bn(at + 1)}</span>
              {letter}
              {glow && <span className="jb-dash" aria-hidden="true" />}
              {ghost && round.index === 0 && letter === want && <Finger />}
            </button>;
          })}
        </div>}
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} fresh={fresh} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}-${result.level}.png`, make: () => cardBlob(result, location.host) }}>
      <RoundCard result={result} />
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}

/** A ghost finger tapping the right tile on the very first word, so the first move is seen, not read. */
function Finger() {
  return <svg className="jb-finger" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="jb-ripple" cx="20" cy="10" r="10" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#1d3a33" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
