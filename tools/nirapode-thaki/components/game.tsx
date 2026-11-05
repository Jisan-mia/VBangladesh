'use client';
// IP: what we avoided — no road-safety campaign mascots, textbook or TV characters (no Meena, no Sisimpur look-alikes), no news photos; every drawing is our own flat SVG, and the rules are paraphrased from WHO and SwimSafe/CIPRB guidance.
// The game inside the shared player. The rules live in lib/ (play.ts plays a round, session.ts decides screens, pause and the
// rest screen); this file feeds taps and keys in, draws, wobbles the pictures and plays the sounds. Nothing here is on a timer.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { LEVEL_COUNT, isLevel, isWorldEnd, levelFromHash, levelOf, nextInOrder, nextToPlay, placeOf, setsOf, worldOf } from '../lib/levels';
import { START_PACE, answer, cardLine, createRound, currentItem, hintOn, isLast, nextQuestion, resultOf, type Result, type Round } from '../lib/play';
import { cardBlob, type CardData } from '../lib/draw-card';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { Finger, Icon, SceneView } from './pictures';
import { RoundCard } from './round-card';
import { Title } from './title';

const SLUG = 'nirapode-thaki';
const WOBBLE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }];

const cardOf = (result: Result): CardData => ({
  label: `নিরাপদে থাকি · ${levelOf(result.level).title}`, title: cardLine(result, bn), stars: result.stars,
  rows: result.items.map(item => ({ icon: item.question.right.icon, text: item.question.rule })),
});

export function SafeGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreenState] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  // A question answered from the keyboard skips its motion: keys are repeated and want no ceremony.
  const [byKey, setByKey] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<Map<string, HTMLButtonElement>>(new Map());
  const keyPick = useRef(0);
  const whole = useRef(false);
  const live = useRef({ slow, level, stars: levels.stars });
  live.current = { slow, level, stars: levels.stars };

  // ---- the wobbles in flight, cancelled on a new question, a pause, a restart and unmount ----
  const flights = useRef<Animation[]>([]);
  const clearAll = () => { for (const flight of flights.current) flight.cancel(); flights.current = []; };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreenState(session.current.screen);

  // ---- first load: an old #s=scene link, else the level this phone is ready for. Nothing is written back to the address. ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = levelFromHash(location.hash) ?? nextToPlay(levels.stars);
    setLevel(ready);
    setGhost(Object.keys(levels.stars).length === 0);
    setRound(createRound(ready, newSeed()));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __nt: { round: () => roundRef.current, session: () => session.current } });
  }, []);

  // ---- the player ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); clearAll(); },
    onResume: () => S.resume(session.current),
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); sync(); },
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
      const open = node.querySelector('.nt-grown .kk-gate-open, .nt-grown .kk-gate');
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
    setResult(null); setShowing(false); setByKey(false);
    sound.tap();
    sync();
  }

  /** A picture, by finger or key. */
  function pick(choiceId: string, tile: HTMLElement | null, viaKey: boolean) {
    const s = session.current, before = roundRef.current;
    if (S.tapTile(s) !== 'counts') return;
    const next = answer(before, choiceId);
    if (next === before) return;
    setGhost(false); setByKey(viaKey);
    clearAll();
    setRound(next);
    if (next.solved) {
      sound.safe(worldOf(before.level).id);
      const last = isLast(next);
      // The last question finishes the round at this tap: stars saved, the limit checked. Only the end screen waits.
      if (S.solved(s, last, last ? kids.atBreak() : false, performance.now())) {
        const done = resultOf(next);
        const stars = live.current.stars;
        const wasComplete = Array.from({ length: LEVEL_COUNT }, (_, at) => at + 1).every(id => stars[id]);
        const nowComplete = Array.from({ length: LEVEL_COUNT }, (_, at) => at + 1).every(id => id === done.level || stars[id]);
        whole.current = nowComplete && !wasComplete;
        levels.record(done.level, done.stars);
        setResult(done);
      }
    } else {
      sound.think();
      if (!live.current.slow && !viaKey && tile) flights.current.push(tile.animate(WOBBLE, { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }));
    }
  }

  /** ➜ */
  function onward(viaKey: boolean) {
    const s = session.current, now = roundRef.current, last = isLast(now);
    const went = S.advance(s, last, performance.now());
    if (went === 'ignored') return;
    clearAll(); setByKey(viaKey);
    if (went === 'next') { setRound(nextQuestion(now)); sound.page(); }
    else if (result && !s.resting) {
      sound.stars(result.stars);
      if (isWorldEnd(result.level)) sound.tune(worldOf(result.level).id);
      if (!live.current.slow && (whole.current || isWorldEnd(result.level))) confetti({ count: whole.current ? 110 : 60, y: 0.3 });
    }
    sync();
  }

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(live.current.stars);
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
        const at = '1234'.indexOf(key), now = roundRef.current;
        if (at >= 0) { event.preventDefault(); const choice = now.choices[at]; if (choice && !event.repeat) { keyPick.current = performance.now(); pick(choice.id, tiles.current.get(choice.id) ?? null, true); } return; }
        if (key === 'Enter' || key === ' ') { event.preventDefault(); if (S.freshNext(s, event.timeStamp, event.repeat)) onward(true); }
        return;
      }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(level); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const item = currentItem(round), spec = levelOf(round.level), world = worldOf(screen === 'play' || screen === 'end' ? round.level : level);
  const hint = hintOn(round), ring = round.solved ? 'why' : round.tried.length ? 'hint' : 'none';
  const last = isLast(round);
  const say = round.solved ? item.question.why : round.tried.length ? `আরেকবার ভাবো। ${item.question.hint}` : item.question.ask;
  const restUp = kids.resting && screen !== 'play';

  return <div ref={root} className="nt" data-world={world.id} data-screen={screen} data-slow={slow || undefined} data-instant={byKey || undefined}>
    {screen === 'title' && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="nt-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="নিরাপদে থাকি" text="রাস্তা পার, পুকুরঘাট, চুলা, ঘুড়ির তার, মেলা আর বজ্রপাতে কী করতে হয়, ছোটদের খেলা।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === 'play' || screen === 'end') && <div className="nt-hud">
      <p className="nt-badge"><span className="nt-badge-icons" aria-hidden="true">{spec.icons.map(id => <Icon key={id} id={id} className="nt-badge-icon" />)}</span>
        <span><b>{spec.title}</b><small>{spec.finale ? 'ফাইনাল' : `লেভেল ${bn(placeOf(round.level))}`}</small></span></p>
      <ol className="nt-strip" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
        {round.items.map((entry, index) => {
          const got = index < round.index || (index === round.index && round.solved) || screen === 'end';
          return <li key={index} data-got={got || undefined} data-now={(index === round.index && screen === 'play') || undefined}>{got && <Icon id={entry.question.right.icon} className="nt-strip-icon" />}</li>;
        })}
      </ol>
    </div>}

    {screen === 'play' && <>
      <SceneView item={item} ring={ring} answer={round.solved ? item.question.right.icon : null} index={round.index} />
      <p className="nt-say" aria-live="polite" data-kind={round.solved ? 'why' : round.tried.length ? 'try' : 'ask'}>{say}</p>
      <div className="nt-lower" key={round.index}>
        {round.solved
          ? <button type="button" className="nt-next" aria-label={last ? 'দেখো কী শিখলে' : 'পরেরটা'} data-last={last || undefined}
              onClick={event => { event.currentTarget.blur(); onward(false); }}>
              <svg viewBox="0 0 48 48" aria-hidden="true">{last ? <path d="M24 6l5.4 11 12.1 1.7-8.8 8.5 2.1 12L24 33.4 13.2 39.2l2.1-12-8.8-8.5L18.6 17z" /> : <path d="M8 24h32M28 11l13 13-13 13" />}</svg>
            </button>
          : <div className={`nt-tiles nt-n${round.choices.length}`}>
              {round.choices.map((choice, at) => {
                const right = choice.id === item.question.right.id;
                return <button key={`${round.index}-${choice.id}`} ref={node => { if (node) tiles.current.set(choice.id, node); else tiles.current.delete(choice.id); }} type="button"
                  aria-label={`${bn(at + 1)}: ${choice.bn}`} style={{ '--i': at } as CSSProperties}
                  className={`nt-tile${hint && right ? ' hint' : ''}${round.tried.includes(choice.id) ? ' tried' : ''}`}
                  onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
                    // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
                    if (!event.isPrimary || event.button !== 0) return;
                    event.preventDefault();
                    pick(choice.id, event.currentTarget, false);
                  }}
                  // A screen reader's activation (a click with no pointer); a key press already picked through the window.
                  onClick={event => { if (event.detail === 0 && performance.now() - keyPick.current > 400) pick(choice.id, event.currentTarget, false); }}>
                  <span className="nt-key" aria-hidden="true">{bn(at + 1)}</span>
                  <Icon id={choice.icon} />
                  {ghost && round.index === 0 && right && <Finger />}
                </button>;
              })}
            </div>}
      </div>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `nirapode-thaki-${result.level}.png`, make: () => cardBlob(cardOf(result), location.host) }}>
      <div className="kit-card"><RoundCard data={cardOf(result)} /></div>
      {setsOf(result.level).map(set => <p className="nt-parent-line" key={set.id}><b>বড়দের জন্য, {set.bn}:</b> {set.parent.fact} {set.parent.action} <small>সূত্র: {set.parent.source}</small></p>)}
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
