'use client';
// IP: what we avoided — no textbook alphabet chart or primer pictures, no TV or app characters, no phonics-programme songs; every picture is our own SVG, the word list is our own (Boat, Rickshaw, Jackfruit for Bangladesh), and the b d p q cue is a plain stick-and-belly drawing.
// The game inside the shared player. The rules live in lib/ (play.ts plays a round, session.ts decides screens, pause and
// the rest screen); this file feeds taps and keys in, draws, and plays the sounds. There is no voice and no timer.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob } from '../lib/card';
import { entryOf, X_NOTE } from '../lib/letters';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from '../lib/levels';
import { START_PACE, answer, answerOf, askOf, createRound, currentItem, hintOn, isLast, nextItem, resultOf, slipLine, whyOf, type Result, type Round } from '../lib/play';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { EnglishWord, Face, Finger, Glyph, Awning, Pic, Sign, faceLabel } from './pieces';
import { PrintSheet } from './print-sheet';
import { RoundCard } from './round-card';
import { Title } from './title';

const SLUG = 'abc-bazar';
const NUDGE_MS = 7000;

export function AbcGame() {
  const [print, setPrint] = useState(false);
  useEffect(() => { setPrint(new URLSearchParams(location.search).has('print')); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (!print) return;
    document.documentElement.classList.add('ab-printing');
    return () => document.documentElement.classList.remove('ab-printing');
  }, [print]);
  return print ? createPortal(<div className="ab-print-root tool-abc-bazar"><PrintSheet /></div>, document.body) : <Play />;
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
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  // The finger: on the first item of a level the child has never finished, and again after a quiet moment on later items.
  const [fresh, setFresh] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [away, setAway] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const keyPick = useRef(0);
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
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setRound(createRound(ready, newSeed()));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __abc: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  // ---- the player: pause freezes the idle nudge; resume gives the hand back ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); setNudge(false); },
    onResume: () => { S.resume(session.current); },
    onRestart: () => { S.toTitle(session.current); silenceScheduled(); setShowing(false); setNudge(false); sync(); },
  });

  // ---- away and back: the first tap back only wakes the game ----
  useEffect(() => {
    const out = () => { S.blur(session.current); setAway(true); setNudge(false); };
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
      const open = node.querySelector('.ab-grown .kk-gate-open, .ab-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- the quiet-moment nudge: the finger comes back on a level not finished yet; stops under pause, away and every tap ----
  useEffect(() => {
    setNudge(false);
    if (screen !== 'play' || round.solved || !fresh || player.paused || away) return;
    const id = setTimeout(() => setNudge(true), NUDGE_MS);
    return () => clearTimeout(id);
  }, [screen, round.index, round.tries, round.solved, fresh, player.paused, away]);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    setRound(createRound(id, newSeed(), roundRef.current.pace ?? START_PACE));
    setResult(null); setShowing(false); setFresh(!levels.stars[id]);
    sound.tap();
    sync();
  }

  /** A tile, by finger or key. */
  function pick(value: string) {
    const s = session.current, before = roundRef.current;
    if (S.tapTile(s) !== 'counts') return;
    const next = answer(before, value);
    if (next === before) return;
    setNudge(false);
    setRound(next);
    if (next.solved) {
      sound.bell(worldOf(before.level).id);
      const last = isLast(next);
      // The last item finishes the round at this tap: stars saved, the limit checked. Only the ➜ waits.
      if (S.solvedItem(s, last, last ? kids.atBreak() : false)) {
        const done = resultOf(next);
        levels.record(done.level, done.stars);
        setResult(done);
      }
    } else sound.miss();
  }

  function goNext() {
    const s = session.current, step = S.tapNext(s, performance.now());
    if (step === 'next') { setRound(nextItem(roundRef.current)); sound.next(); }
    else if (step === 'end') {
      const done = resultOf(roundRef.current);
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(worldOf(done.level).id); if (!live.current.slow) confetti({ count: 70, y: 0.3 }); }
      }
      sync();
    }
  }

  // ---- screens ----
  const toTitle = () => { S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the stall, with the next level ready. Nothing starts by itself.
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
        if (at >= 0) { event.preventDefault(); const value = roundRef.current.choices[at]; if (value && !event.repeat) { keyPick.current = performance.now(); pick(value); } return; }
        if (key === 'Enter' || key === ' ') {
          event.preventDefault();
          if (event.repeat) return;
          if (s.solved) { goNext(); return; }
          const focused = tiles.current.findIndex(tile => tile && tile === document.activeElement);
          if (focused >= 0) { keyPick.current = performance.now(); pick(roundRef.current.choices[focused]); }
        }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const item = currentItem(round), spec = levelOf(round.level), world = worldOf(round.level), hint = hintOn(round);
  const entry = entryOf(item.letter), correct = answerOf(item);
  const restUp = kids.resting && screen !== 'play';
  const finger = fresh && !round.solved && ((round.index === 0 && round.tries === 0) || nudge);
  const say = round.solved ? '' : round.tries > 0 ? slipLine(item, round.wrong[round.wrong.length - 1]) : askOf(item);

  return <div ref={root} className="ab" data-world={levelOf(screen === 'play' || screen === 'end' ? round.level : level).world} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="ab-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="এবিসি বাজার" text="ছোটদের ইংরেজি বর্ণমালা শেখার খেলা: M দিয়ে Mango, R দিয়ে Rickshaw। ফ্রি, বিজ্ঞাপন নেই।" />
          <a className="kit-secondary ab-print-open" href="/abc-bazar?print">A–Z রং করার পাতা প্রিন্ট করো</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {screen === 'play' && <>
      <div className="ab-hud">
        <p className="ab-badge"><span className="ab-badge-n" aria-hidden="true">{bn(placeOf(round.level))}</span>
          <span><b>{spec.finale ?? spec.title}</b><small>{world.name}</small></span></p>
        <ol className="ab-strip" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
          {round.items.map((one, index) => {
            const got = index < round.index || (index === round.index && round.solved);
            return <li key={index} data-got={got || undefined} data-now={index === round.index || undefined}>{got && <Pic letter={one.letter} className="ab-pic ab-strip-pic" />}</li>;
          })}
        </ol>
      </div>

      <div className="ab-panel">
        <Awning />
        <div className={`ab-sign${round.solved ? ' solved' : ''}`} key={`${round.level}-${round.index}`}><Sign item={item} /></div>
        <svg className="ab-arrow" viewBox="0 0 40 28" aria-hidden="true"><path d="M20 3v18M9 13l11 11 11-11" /></svg>
      </div>

      <ul className={`ab-tiles ab-n${round.choices.length} k-${item.kind}`}>
        {round.choices.map((value, at) => {
          const right = value === correct, wrong = round.wrong.includes(value);
          const why = wrong ? whyOf(item, value) : null;
          return <li key={`${round.index}-${value}`}>
            <button ref={node => { tiles.current[at] = node; }} type="button" aria-label={`${bn(at + 1)}: ${faceLabel(item, value)}`} aria-disabled={wrong || round.solved || undefined}
              className={`ab-tile${hint && right ? ' hint' : ''}${round.solved && right ? ' right' : ''}${wrong ? ' wrong' : ''}${round.solved && !right ? ' off' : ''}`}
              onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
                // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
                if (!event.isPrimary || event.button !== 0) return;
                event.preventDefault();
                pick(value);
              }}
              // A screen reader's activation (a click with no pointer); a key press already picked through the window.
              onClick={event => { if (event.detail === 0 && performance.now() - keyPick.current > 400) pick(value); }}>
              <span className="ab-key" aria-hidden="true">{bn(at + 1)}</span>
              {item.kind === 'mirror' || item.kind === 'same' ? <Glyph letter={value} order={!!why || (round.tries > 0 && right)} /> : <Face item={item} value={value} />}
              {why && why.chip === 'letter' && <span className="ab-chip-why" lang="en" aria-hidden="true">{why.value}</span>}
              {why && why.chip === 'picture' && <Pic letter={why.value} className="ab-pic ab-why-pic" />}
              {finger && right && <span className="ab-ghost"><Finger /></span>}
            </button>
          </li>;
        })}
      </ul>

      <div className="ab-say" aria-live="polite">
        {round.solved ? <>
          <div className="ab-word-card" key={`w-${round.index}`}>
            <Pic letter={entry.letter} className="ab-pic ab-card-pic" />
            <p><EnglishWord entry={entry} /> <span className="ab-gloss">{entry.bn}</span></p>
            {entry.letter === 'X' && item.kind === 'picture' && <p className="ab-x">{X_NOTE}</p>}
          </div>
          <button type="button" className="ab-next" aria-label={isLast(round) ? 'শেষ দেখো' : 'পরেরটা'} onClick={event => { event.currentTarget.blur(); goNext(); }}>
            {isLast(round)
              ? <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 20h32l-5 20H13z" /><path d="M16 20l8-12 8 12" /></svg>
              : <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h26M26 12l12 12-12 12" /></svg>}
          </button>
        </> : <p>{say}</p>}
      </div>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `abc-bazar-${result.level}.png`, make: () => cardBlob(result, location.host) }}>
      <RoundCard result={result} />
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
