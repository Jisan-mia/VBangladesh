'use client';
// IP: what we avoided — no NCTB textbook words, pictures or page layout and no TV characters; the word lists and every drawing are our own.
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from '../../../shared/kids-kit';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, newSeed, sfx, shake, useLevels, useSlowMode } from '../../../shared/game-kit';
import { LevelGrid, SoundToggle, StarReveal } from '../../../shared/game-ui';
import { cardBlob, cardLine, drawCard, type CardRound } from '../lib/draw-card';
import {
  HINT_AFTER, KAR_NAME, LEVEL_COUNT, answer, bn, dotted, isDone, levelLabel, levelOf, newRound, nextWord, printLevel, spellWith, starsOf,
  type Kar, type Round,
} from '../lib/words';
import { PrintSheet } from './print-sheet';
import { WordPicture, WordSlot } from './word-parts';

const SLUG = 'kar-chinho';

export function KarGame() {
  const [print, setPrint] = useState<number | null>(null);
  useEffect(() => { const value = new URLSearchParams(location.search).get('print'); if (value !== null) setPrint(printLevel(value)); }, []);
  return print ? <PrintSheet level={print} /> : <Play />;
}

function Play() {
  const { stars, record, loaded } = useLevels(SLUG, LEVEL_COUNT);
  const { resting, atBreak, extend } = useKidsSession();
  const [slow, setSlow] = useSlowMode();
  // A fixed first round so the server page already shows the game; replaced once this phone's progress is read.
  const [round, setRound] = useState<Round>(() => newRound(1, 1));
  const [phase, setPhase] = useState<'play' | 'end' | 'pick'>('play');
  const [tried, setTried] = useState<Kar | null>(null);
  const [earned, setEarned] = useState(0);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (run: () => void, ms: number) => { timers.current.push(setTimeout(run, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const start = useCallback((level: number) => {
    clearTimers();
    setRound(current => newRound(level, newSeed(), current.pace));
    setTried(null); setPhase('play');
  }, []);

  const started = useRef(false);
  useEffect(() => {
    if (!loaded || started.current) return;
    started.current = true;
    const fresh = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1).find(level => !stars[level]) ?? 1;
    setGhost(Object.keys(stars).length === 0);
    setRound(newRound(fresh, newSeed()));
  }, [loaded, stars]);

  const item = round.items[round.index];
  const level = round.level;

  const finish = (done: Round) => {
    const got = starsOf(done.firstTry);
    record(done.level, got);
    setEarned(got); setPhase('end');
    sfx.win();
    if (done.level === LEVEL_COUNT) confetti();
    atBreak();
  };

  const tap = (kar: Kar, event: MouseEvent<HTMLButtonElement>) => {
    const pointer = event.nativeEvent as PointerEvent;
    // Only the first finger counts (a palm or second finger on another tile is ignored); keyboard and mouse clicks always do.
    if ((pointer.pointerType === 'touch' && !pointer.isPrimary) || round.solved || phase !== 'play') return;
    setGhost(false);
    const next = answer(round, kar);
    setRound(next);
    if (next.solved) {
      sfx.good(); speak(item.word); setTried(null);
      later(() => { if (isDone(next)) finish(next); else setRound(nextWord(next)); }, 1100);
    } else {
      sfx.drop(); shake(event.currentTarget); setTried(kar);
      later(() => setTried(current => current === kar ? null : current), 1500);
    }
  };

  const spec = levelOf(level);
  const cardRound: CardRound = useMemo(() => ({ level, items: round.items }), [level, round.items]);
  const hint = round.tries >= HINT_AFTER;

  return <div className={`kc${slow ? ' kc-still' : ''}`}>
    <div className="kc-top">
      <button type="button" className="kc-level" onClick={() => { sfx.tap(); clearTimers(); setPhase('pick'); }} aria-label={`${levelLabel(level)}। লেভেল বদলাও`}>
        <b>{spec.title}</b><span>লেভেল {bn(level)}</span>
      </button>
      <ol className="kc-dots" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
        {round.items.map((_, index) => <li key={index} className={index < round.index || (index === round.index && round.solved) ? 'got' : index === round.index ? 'now' : ''} />)}
      </ol>
      <button type="button" className="kc-pill" aria-pressed={slow} onClick={() => { sfx.tap(); setSlow(!slow); }}>ধীরে</button>
      <SoundToggle compact />
    </div>

    {phase === 'play' && <div className="kc-stage">
      <div className="kc-scene">
        <div key={round.index} className={`kc-pic${round.solved ? ' alive' : ''}`}><WordPicture pic={item.pic} size={132} /></div>
        <SpeakButton text={item.word} label="শব্দটা শোনো" />
      </div>
      <p className="kc-wordline"><WordSlot item={item} filled={round.solved} tried={tried} /></p>
      <p className="kc-say" aria-live="polite">{round.solved ? `${KAR_NAME[item.kar]} বসল: ${item.word}` : tried ? `এটা পড়লে হয় ${spellWith(item, tried)}। আরেকবার ভাবো।` : 'ছবির নামটা বলো, ঠিক চিহ্নটায় চাপো।'}</p>
      <div className={`kc-tiles kc-n${round.choices.length}`}>
        {round.choices.map(kar => <button key={`${round.index}${kar}`} type="button" aria-label={KAR_NAME[kar]}
          className={`kc-tile${hint && kar === item.kar ? ' hint' : ''}${round.solved && kar === item.kar ? ' right' : ''}`}
          onClick={event => tap(kar, event)}>
          <span className="kc-sign">{dotted(kar)}</span>
          {ghost && kar === item.kar && <Finger />}
        </button>)}
      </div>
    </div>}

    {phase === 'end' && <div className="kc-stage kc-end">
      <StarReveal count={earned} />
      <p className="kc-end-line">{bn(round.items.length)}টা শব্দের {bn(round.firstTry)}টা প্রথমবারেই।</p>
      <p className="kc-end-news">{spec.kar ? `এখন তুমি ${spec.title} বসাতে পারো।` : 'এখন তুমি দশটা কার-চিহ্নই চেনো।'}</p>
      <p className="kc-end-off">{spec.kar ? <>এবার ঘরে একটা জিনিস খোঁজো, যার নামে <span className="kc-nowrap">{spec.title}</span> আছে।</> : 'এবার আম্মু বা আব্বুকে একটা শব্দ পড়ে শোনাও।'}</p>
      <div className="kc-actions">
        <button type="button" className="kit-primary" onClick={() => { sfx.tap(); start(level); }}>আবার খেলো</button>
        <button type="button" className="kit-primary kc-done" onClick={() => { sfx.tap(); setPhase('pick'); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    {phase === 'pick' && <div className="kc-stage kc-pick">
      <p className="kc-end-line">কোন কার-চিহ্ন খেলবে?</p>
      <LevelGrid count={LEVEL_COUNT} stars={stars} unlocked={LEVEL_COUNT} current={level} onPick={start} />
      <p className="kc-pick-names">{Array.from({ length: LEVEL_COUNT }, (_, index) => `${bn(index + 1)} ${levelOf(index + 1).title}`).join(' · ')}</p>
    </div>}

    <div className="kc-grown">
      <a className="kc-print" href={`/kar-chinho?print=${level}`}>প্রিন্টের পাতা: {spec.title}</a>
      <ParentGate label="বড়দের জন্য"><ShareToolLink title="কার-চিহ্ন বসাও" text="ছবি দেখে ঠিক কার-চিহ্ন বসানোর খেলা, ৫–৭ বছরের জন্য।" /></ParentGate>
    </div>

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `kar-chinho-${level}.png`, make: () => cardBlob(cardRound, location.host) }}>
      <div className="kit-card"><Card round={cardRound} /></div>
      <p>{cardLine(cardRound)}। {spec.title}।</p>
    </ShowParent>
    {resting && <RestScreen onExtend={extend} />}
  </div>;
}

/** The round's card, drawn once the fonts are in. */
function Card({ round }: { round: CardRound }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(`${cardLine(round)} ${round.items.map(item => item.word).join(' ')}`).then(() => { if (live && ref.current) drawCard(ref.current, round, location.host); });
    return () => { live = false; };
  }, [round]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={cardLine(round)} role="img" />;
}

/** A ghost finger tapping the right tile on the very first word, so a child who can't read yet sees the move. */
function Finger() {
  return <svg className="kc-finger" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="kc-ripple" cx="20" cy="10" r="10" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#3b2a17" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
