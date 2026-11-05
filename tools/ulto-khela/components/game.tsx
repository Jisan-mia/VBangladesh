'use client';
// IP: what we avoided — the Day–Night Stroop and card-sort tasks are public research methods, but no test-kit cards, no Sisimpur/Meena or TV/app characters or look-alikes, and no "brain training" claims; every picture is our own code art.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, session.ts decides screens, the two
// timers, pause and the rest screen); this file feeds taps and keys in, draws, and plays the sounds. No voice anywhere.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from '../../../shared/kids-kit';
import { isLevel, isWorldEnd, levelOf, LEVEL_COUNT, nextInOrder, nextToPlay, placeOf, WORLDS } from '../lib/course';
import { cardBlob, cardFontSample, drawCard } from '../lib/draw-card';
import { cardWords, RULES, TARGETS, WORDS as PICTURE_WORD } from '../lib/pairs';
import {
  answer, answerOf, createRound, glows, isLast, nextItem, pairIndexOf, pass, paceSeconds, resultOf, START_PACE, type Pace, type Result, type Round,
} from '../lib/round';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { addToday, cardLines, EMPTY_TODAY, type Today } from '../lib/today';
import { bn, foundLine, hintOf, passLine, promptOf, shownLabel } from '../lib/words';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { OgCard } from './og-card';
import { Bell, Ghost, PICTURE_ART, RuleIcon, SortArt } from './pics';
import { Title } from './title';

const SLUG = 'ulto-khela';
/** The picture rests this long after a right tap before the next one comes (briefer in চটপট); a short breath after চালিয়ে যাও. */
const REST_MS = 700, REST_QUICK_MS = 300, BREATH_MS = 500;
type Say = { text: string; tone: 'ask' | 'hint' | 'found' };

/** `#og` (the preview-image script only) shows a fixed finished card in place of the game: no stars, no play time. */
export function UltoGame() {
  const [og, setOg] = useState(false);
  useEffect(() => { if (location.hash === '#og') setOg(true); }, []);
  return og ? <OgCard onClose={() => { history.replaceState(history.state, '', location.pathname); setOg(false); }} /> : <Play />;
}

function Play() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slowSetting] = useSlowMode();
  // The phone's own reduced-motion setting counts as ধীরে খেলো even when the saved choice says otherwise: nothing moves.
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
  const [quick, setQuick] = useState(false);
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [say, setSay] = useState<Say>(() => ({ text: promptOf(round), tone: 'ask' }));
  const [wobble, setWobble] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<Today>(EMPTY_TODAY);
  const [idle, setIdle] = useState(false);
  const [wake, setWake] = useState(0);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const root = useRef<HTMLDivElement>(null), card = useRef<HTMLCanvasElement>(null);
  const keyPick = useRef(0), pace = useRef<Pace>(START_PACE);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  // ---- the one timer after a picture, cleared together with everything else ----
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPending = () => { if (pendingTimer.current) clearTimeout(pendingTimer.current); pendingTimer.current = null; };
  useEffect(() => () => { stopPending(); silenceScheduled(); }, []);

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
    Object.assign(window, { __uk: { round: () => roundRef.current, session: () => session.current, right: () => answerOf(roundRef.current), start: (id: number) => { session.current.screen = 'title'; begin(id); } } });
  });

  /** A fresh round on the title or the board. */
  function prepare(id: number, keepPace: Pace = START_PACE) {
    const fresh = createRound(id, newSeed(), keepPace);
    setRound(fresh); setSay({ text: promptOf(fresh), tone: 'ask' }); setWobble(0); setResult(null); setShowing(false); setIdle(false);
  }

  // ---- the player: pause freezes both timers; resume gives them back after a breath ----
  const armPending = (ms: number) => {
    stopPending();
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      const fired = S.timerFires(session.current, performance.now());
      if (fired === 'end') enterEnd();
      else if (fired === 'next') goNext();
    }, ms);
  };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); stopPending(); silenceScheduled(); setWake(count => count + 1); },
    onResume: () => { S.resume(session.current); setWake(count => count + 1); if (session.current.pending !== 'none') armPending(BREATH_MS); },
    onRestart: () => { stopPending(); silenceScheduled(); S.toTitle(session.current); prepare(live.current.level); sync(); },
    onLevels: () => { stopPending(); silenceScheduled(); S.openLevels(session.current); sync(); },
  });

  // ---- away and back: nothing runs while away, and the first tap back only wakes the game ----
  useEffect(() => {
    const away = () => { S.blur(session.current); stopPending(); silenceScheduled(); setWake(count => count + 1); };
    const back = () => {
      S.focus(session.current); setWake(count => count + 1);
      if (session.current.pending !== 'none' && !session.current.paused) armPending(BREATH_MS);
    };
    const onVisibility = () => { if (document.hidden) away(); else back(); };
    window.addEventListener('blur', away);
    window.addEventListener('focus', back);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', away); window.removeEventListener('focus', back); document.removeEventListener('visibilitychange', onVisibility); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- an open parent gate shuts on the next touch anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.uk-grown .kk-gate-open, .uk-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- চটপট's clock: a waiting, non-demo picture passes after a few seconds, only while the game is live ----
  useEffect(() => {
    if (!S.quickMayRun(session.current, round.stage === 'pick' && !round.demo)) return;
    const timer = setTimeout(quickPass, paceSeconds(round.pace) * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.index, round.stage, round.demo, round.pace, screen, wake, quick]);

  // ---- the ghost finger comes back when the child has waited a while (never while away or paused) ----
  useEffect(() => {
    setIdle(false);
    if (!S.live(session.current) || round.stage !== 'pick') return;
    const timer = setTimeout(() => setIdle(true), 7000);
    return () => clearTimeout(timer);
  }, [round.index, round.stage, screen, wake]);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    stopPending(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    prepare(id, pace.current);
    setGateKey(key => key + 1);
    sound.tap();
    sync();
  }

  /** The picture is finished (right, or চটপট ran out): on the last one the round ends at this tap, stars saved. */
  function finished(next: Round) {
    const s = session.current, last = isLast(next);
    if (S.solved(s, last, last ? kids.atBreak() : false)) {
      const done = resultOf(next);
      levels.record(done.level, done.stars);
      setResult(done); setToday(before => addToday(before, done));
      pace.current = next.pace;
    }
    armPending(s.quick ? REST_QUICK_MS : REST_MS);
  }

  /** The next picture comes after its short rest; a bell rings first when the rule changes. */
  function goNext() {
    const next = nextItem(roundRef.current);
    if (!next) return;
    setRound(next); setSay({ text: promptOf(next), tone: 'ask' });
    if (next.rang) sound.bell(); else sound.next();
  }

  /** The end screen comes: its stars sound, and a finale gets its tune. */
  function enterEnd() {
    const s = session.current, done = resultOf(roundRef.current);
    if (!s.resting) {
      sound.stars(done.stars);
      if (isWorldEnd(done.level)) { sound.tune(levelOf(done.level).world); if (!live.current.slow) confetti({ count: 70, y: 0.3 }); }
    }
    sync();
  }

  function quickPass() {
    const before = roundRef.current;
    if (!S.quickMayRun(session.current, before.stage === 'pick' && !before.demo)) return;
    const next = pass(before);
    if (next === before) return;
    setRound(next); setSay({ text: passLine(before.rule), tone: 'hint' });
    finished(next);
  }

  /** An answer, by finger or key. */
  function pick(choice: number) {
    const s = session.current, before = roundRef.current;
    if (S.tapAnswer(s) !== 'counts') return;
    const { round: next, outcome } = answer(before, choice);
    if (outcome === 'ignore') return;
    setIdle(false);
    setRound(next);
    if (outcome === 'again') { sound.slip(); setWobble(count => count + 1); setSay({ text: hintOf(next), tone: 'hint' }); return; }
    sound.right(Math.max(0, pairIndexOf(before.item)));
    setSay({ text: foundLine(next), tone: 'found' });
    finished(next);
  }
  const tap = (choice: number) => ({
    'data-key': choice,
    // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
    onPointerDown: (event: React.PointerEvent) => { if (!event.isPrimary || event.button !== 0) return; event.preventDefault(); pick(choice); },
    // A screen reader's activation (a click with no pointer); a key press already picked through the window.
    onClick: (event: React.MouseEvent) => { if (event.detail === 0 && performance.now() - keyPick.current > 400) pick(choice); },
  });

  // ---- screens ----
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(live.current.level) || nextToPlay(levels.stars);
    stopPending(); S.toTitle(session.current);
    setLevel(after); prepare(after, pace.current); sync();
  };
  const openLevels = () => { S.openLevels(session.current); sound.tap(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = 'title'; begin(id); };
  const chooseQuick = (on: boolean) => { S.setQuick(session.current, on); setQuick(session.current.quick); sound.tap(); };

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
        const at = ['1', '2'].indexOf(key) >= 0 ? Number(key) - 1 : key === 'ArrowLeft' ? 0 : key === 'ArrowRight' ? 1 : -1;
        if (at >= 0) { event.preventDefault(); if (!event.repeat) { keyPick.current = performance.now(); pick(at); } return; }
        if (enter) {
          event.preventDefault();
          if (event.repeat) return;
          const focused = (document.activeElement as HTMLElement | null)?.getAttribute?.('data-key');
          if (focused) { keyPick.current = performance.now(); pick(Number(focused)); }
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
    if (!showing) return;
    let alive = true;
    loadCardFonts(cardFontSample).catch(() => undefined).then(() => { if (alive && card.current) drawCard(card.current, today, location.host); });
    return () => { alive = false; };
  }, [showing, today]);

  const spec = levelOf(screen === 'play' || screen === 'end' ? round.level : level), item = round.item, right = answerOf(round);
  const restUp = kids.resting && screen !== 'play';
  const picking = round.stage === 'pick';
  const doneUpTo = round.index + (round.stage === 'done' ? 1 : 0);
  const ghost = screen === 'play' && picking && (round.demo || idle || glows(round)) ? right : -1;
  const label = (choice: number) => item.kind === 'pair' ? PICTURE_WORD[item.choices[choice]] : cardWords(TARGETS[choice]);

  return <div ref={root} className="uk" data-world={spec.world} data-screen={screen} data-kind={spec.kind} data-rule={round.rule} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} quick={quick} onStart={() => begin(level)} onLevels={openLevels} onQuick={chooseQuick}>
      <div className="uk-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="উল্টো খেলা" text="সূর্য এলে চাঁদে চাপো, ঘণ্টা বাজলে নিয়ম বদলাও। ৪–৮ বছরের মনোযোগের খেলা, ফ্রি।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="uk-hud">
      <p className="uk-badge" title={WORLDS[spec.world].name}><b>{bn(placeOf(round.level))}</b><span>{spec.finale ?? spec.title}</span></p>
      {screen === 'play' && <ol className="uk-dots" aria-label={`${bn(spec.items)}টার মধ্যে ${bn(Math.min(doneUpTo, spec.items))}টা হয়েছে`}>
        {Array.from({ length: spec.items }, (_, index) => <li key={index} data-got={index < doneUpTo || undefined} data-now={(index === doneUpTo) || undefined} />)}
      </ol>}
    </div>}

    {screen === 'play' && <div className="uk-play">
      <div className="uk-show" key={`show-${round.index}`} role="img" aria-label={shownLabel(round)}>
        {item.kind === 'pair' ? PICTURE_ART[item.show]() : <SortArt card={item.card} />}
        {quick && !round.demo && picking && <span className="uk-pace" key={`pace-${round.index}-${wake}`} style={{ '--pace': `${paceSeconds(round.pace)}s` } as CSSProperties} aria-hidden="true" />}
      </div>
      <div className={`uk-sign uk-sign-${round.rule}`} key={`sign-${round.bells}`} data-nudge={wobble % 2 === 0 ? 'a' : 'b'} data-hit={round.last === 'wrong' || undefined}>
        <span className="uk-sign-icon"><RuleIcon rule={round.rule} /></span>
        <span className="uk-sign-name">{RULES[round.rule].name}</span>
        {round.rang && picking && <span className="uk-bell"><Bell /></span>}
      </div>
      <div className={`uk-say ${say.tone}`} role="status" aria-live="polite">{say.text}</div>
      <div className="uk-choices" data-kind={item.kind} data-done={!picking || undefined}>
        {[0, 1].map(choice => {
          const wrong = round.last === 'wrong' && round.wrongChoice === choice, lit = !picking && choice === right;
          return <button type="button" key={`${round.index}-${choice}`} className={`uk-choice${glows(round) && picking && choice === right ? ' is-glow' : ''}${lit ? ' is-right' : ''}${wrong ? ` is-wrong w${wobble % 2}` : ''}`}
            aria-label={label(choice)} {...tap(choice)}>
            <span className="uk-key" aria-hidden="true">{bn(choice + 1)}</span>
            <span className="uk-art">{item.kind === 'pair' ? PICTURE_ART[item.choices[choice]]() : <SortArt card={TARGETS[choice]} />}</span>
            <span className="uk-word">{label(choice)}</span>
            {ghost === choice && <Ghost />}
          </button>;
        })}
      </div>
    </div>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: () => cardBlob(today, location.host) }}>
      <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLines(today).join('। ')} /></figure>
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}

