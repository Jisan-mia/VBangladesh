'use client';
// IP: what we avoided — no geography app's or atlas's look, no airline or passport-office branding, no tourism-board photos; every picture, flag and the map are our own flat SVG, and flags that can't be drawn exactly (dragons, script, seals) are left out.
// The game inside the shared player. The rules live in lib/ (trip.ts plays a trip, session.ts decides screens, pause and the
// rest screen); this file feeds taps and keys in, draws, and plays the sounds. The plane's flight is the only thing that runs
// by itself, and a pause, a blur or a list over the trip holds it in the air.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { COUNTRIES, countryOf } from '../lib/countries';
import { cardBlob, type CardData } from '../lib/draw-card';
import { LEVEL_COUNT, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, stampedIds, stopIds, worldOf } from '../lib/levels';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { cardTitle, inside, questionOf, rightLine, whyLine } from '../lib/text';
import { advance, answer, cardsHere, countryAt, createTrip, fly, hintOn, isLast, land, nextCard, questionNow, resultOf, type Result, type Trip } from '../lib/trip';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { PassportPage } from './passport';
import { Badge, Finger, Flag, LevelIcon, NextArrow, Pic } from './pictures';
import { Postcard, Where } from './postcard';
import { RoundCard } from './round-card';
import { Title } from './title';
import { PINS, WorldMap } from './world-map';

const SLUG = 'prithibi-ghuri';
const WOBBLE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }];
const OG_DEMO = { level: 3, stars: 3 };

const cardOf = (result: Result): CardData => ({
  label: `পৃথিবী ঘুরি · ${levelOf(result.level).title}`, title: cardTitle(result.ids.length, bn), trip: result.ids.map(id => countryOf(id)!.name).join(' · '), stars: result.stars, ids: result.ids,
});

/** What a picture button shows for each kind of question. */
function Face({ ask, id }: { ask: string; id: string }) {
  if (ask === 'flag') return <Flag id={id} className="pg-choice-flag" />;
  if (ask === 'hello') return <><Badge id={id} flagClass="pg-choice-flag pg-choice-flag-sm" picClass="pg-choice-badge" /><span className="pg-choice-name">{countryOf(id)!.name}</span></>;
  return <Pic k={`${id}:${ask}`} />;
}

export function PrithibiGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreenState] = useState<S.Screen>('title');
  const [frozen, setFrozen] = useState(false);
  const [level, setLevel] = useState(1);
  const [trip, setTripState] = useState<Trip>(() => createTrip(1, 1));
  const tripRef = useRef(trip);
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [overTrip, setOverTrip] = useState(false);
  // A step taken from the keyboard skips its motion: keys are repeated and want no ceremony.
  const [byKey, setByKey] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<Map<string, HTMLButtonElement>>(new Map());
  const keyAt = useRef(0);
  const whole = useRef(false);
  const live = useRef({ slow, level, stars: levels.stars });
  live.current = { slow, level, stars: levels.stars };

  const flights = useRef<Animation[]>([]);
  const clearAll = () => { for (const flight of flights.current) flight.cancel(); flights.current = []; };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setTrip = (next: Trip) => { tripRef.current = next; setTripState(next); };
  const sync = () => { setScreenState(session.current.screen); setFrozen(S.frozen(session.current)); setOverTrip(session.current.listOverTrip); };

  // ---- first load: the trip this phone is ready for; nothing is written to the address ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setGhost(Object.keys(levels.stars).length === 0);
    setTrip(createTrip(ready, newSeed()));
    // `#og`: the site's preview image only. A fixed result, the parent card open; nothing saved, no daily-limit check.
    if (location.hash === '#og') {
      const ids = stopIds(OG_DEMO.level);
      setLevel(OG_DEMO.level);
      setResult({ level: OG_DEMO.level, stars: OG_DEMO.stars, count: ids.length, firstTry: ids.length, misses: 0, ids, clean: true });
      session.current.screen = 'end';
      setShowing(true);
      sync();
    }
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the trip; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __pg: { trip: () => tripRef.current, session: () => session.current, right: () => { const t = tripRef.current, q = questionNow(t); return q ? stopIds(t.level)[q.stop] : null; } } });
  }, []);

  // ---- the player ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sync(); },
    onResume: () => { S.resume(session.current); sync(); },
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); sync(); },
    onLevels: () => { S.openChoice(session.current, 'levels', true); sync(); },
  });

  // ---- away and back: the plane holds, and the first tap back only wakes the game ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sync(); };
    const onFocus = () => { S.focus(session.current); sync(); };
    const onVisibility = () => { if (document.hidden) S.blur(session.current); else S.focus(session.current); sync(); };
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
      const open = node.querySelector('.pg-grown .kk-gate-open, .pg-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- trips ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    setLevel(id);
    // Opening a trip is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak(), performance.now())) { sync(); return; }
    setTrip(createTrip(id, newSeed(), tripRef.current.pace));
    setResult(null); setShowing(false); setByKey(false);
    sound.tap();
    sync();
  }

  /** A pin or a destination button. */
  function goTo(stop: number, viaKey: boolean) {
    const s = session.current, before = tripRef.current;
    if (S.tap(s) !== 'counts') return;
    const next = fly(before, stop);
    if (next === before) return;
    setByKey(viaKey);
    S.shown(s, performance.now());
    setTrip(next);
    if (!live.current.slow) sound.fly(); else sound.tap();
  }

  /** The plane lands (called by the map when its flight finishes; a held flight never gets here). */
  const landed = () => {
    const before = tripRef.current, next = land(before);
    if (next === before) return;
    S.shown(session.current, performance.now());
    sound.land();
    setTrip(next);
  };

  /** ➜ on a postcard. */
  function turn(viaKey: boolean, fromFinger: boolean) {
    const s = session.current, before = tripRef.current;
    if (before.phase !== 'card') return;
    if (S.tap(s) !== 'counts') return;
    if (fromFinger && !S.freshTap(s, performance.now())) return;
    const next = nextCard(before);
    setGhost(false); setByKey(viaKey);
    S.shown(s, performance.now());
    sound.page();
    setTrip(next);
  }

  /** A picture, by finger or key. */
  function pick(choiceId: string, tile: HTMLElement | null, viaKey: boolean) {
    const s = session.current, before = tripRef.current;
    if (before.phase !== 'ask' || before.solved || S.tap(s) !== 'counts') return;
    const next = answer(before, choiceId);
    if (next === before) return;
    setGhost(false); setByKey(viaKey);
    clearAll();
    setTrip(next);
    if (next.solved) {
      sound.stamp(worldOf(before.level).id);
      const last = isLast(next);
      // The last question finishes the trip at this tap: stars saved, the limit checked. Only the end screen waits.
      if (S.solved(s, last, last ? kids.atBreak() : false, performance.now())) {
        const done = resultOf(next), stars = live.current.stars;
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
    sync();
  }

  /** ➜ after a right answer. */
  function onward(viaKey: boolean, fromFinger: boolean) {
    const s = session.current, now = tripRef.current, last = isLast(now);
    if (S.tap(s) !== 'counts') return;
    if (fromFinger && !S.freshTap(s, performance.now())) return;
    const went = S.advance(s, last, performance.now());
    if (went === 'ignored') return;
    clearAll(); setByKey(viaKey);
    if (went === 'next') { setTrip(advance(now)); sound.page(); }
    else if (result && !s.resting) {
      sound.stars(result.stars);
      if (isWorldEnd(result.level)) sound.tune(worldOf(result.level).id);
      if (!live.current.slow && (whole.current || isWorldEnd(result.level))) confetti({ count: whole.current ? 110 : 60, y: 0.3 });
    }
    sync();
  }

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishTrip = () => {
    // শেষ: back to the title, with the next trip ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(live.current.stars);
    setLevel(after); setTrip(createTrip(after, newSeed(), tripRef.current.pace));
    toTitle();
  };
  const openChoice = (kind: 'levels' | 'passport') => { S.openChoice(session.current, kind); sound.tap(); sync(); };
  const closeChoice = () => { S.closeChoice(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeChoice(session.current); session.current.screen = 'title'; begin(id); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show')) return;
      const s = session.current, key = event.key, now = tripRef.current;
      if (kids.resting && s.screen !== 'play') return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      const go = key === 'Enter' || key === ' ';
      if (s.screen === 'title' && go) { event.preventDefault(); if (!event.repeat) begin(level); return; }
      if (s.screen === 'end' && go) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(level); return; }
      if (s.screen !== 'play') return;
      const digit = '1234'.indexOf(key);
      if (now.phase === 'map' && digit >= 0 && digit < 3) { event.preventDefault(); if (!event.repeat) goTo(digit, true); return; }
      if (now.phase === 'ask' && digit >= 0 && !now.solved) {
        event.preventDefault();
        const id = now.choices[digit];
        if (id && !event.repeat) { keyAt.current = performance.now(); pick(id, tiles.current.get(id) ?? null, true); }
        return;
      }
      if (!go) return;
      event.preventDefault();
      if (!S.freshKey(s, event.timeStamp, event.repeat)) return;
      keyAt.current = performance.now();
      if (now.phase === 'card') turn(true, false);
      else if (now.phase === 'ask' && now.solved) onward(true, false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const spec = levelOf(screen === 'play' || screen === 'end' ? trip.level : level), world = worldOf(screen === 'play' || screen === 'end' ? trip.level : level);
  const ids = stopIds(spec.id);
  const stamps = useMemo(() => stampedIds(levels.stars), [levels.stars]);
  const q = questionNow(trip), here = trip.at >= 0 ? countryAt(trip, trip.at) : null;
  const target = q ? countryAt(trip, q.stop) : null;
  const hint = hintOn(trip), last = isLast(trip);
  const restUp = kids.resting && screen !== 'play';
  const card = useMemo(() => result && cardOf(result), [result]);
  const phase = trip.phase;
  const say = !q || !target ? '' : trip.solved ? rightLine(target, q.ask) : trip.tried.length ? whyLine(countryOf(trip.tried.at(-1)!)!, q.ask) : questionOf(target, q.ask);
  const looking = screen === 'play';

  return <div ref={root} className="pg" data-world={world.id} data-screen={screen} data-slow={slow || undefined} data-instant={byKey || undefined}>
    {screen === 'title' && <Title level={level} stamped={stamps.length} total={COUNTRIES.length} slow={slow} onStart={() => begin(level)} onLevels={() => openChoice('levels')} onPassport={() => openChoice('passport')}>
      <div className="pg-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="পৃথিবী ঘুরি" text="ঢাকা থেকে উড়ে ১৮টা দেশ ঘুরে আসার খেলা: হ্যালো, খাবার, প্রাণী আর পাসপোর্টে সিল। ৬–১২ বছরের জন্য।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} overTrip={overTrip} onPick={pickLevel} onClose={closeChoice} />}
    {screen === 'passport' && <PassportPage stamped={stamps} onClose={closeChoice} />}

    {looking && <div className="pg-hud">
      <p className="pg-badge"><LevelIcon icon={spec.icon} className="pg-badge-icon" />
        <span><b>{spec.title}</b><small>{spec.finale ? 'পাসপোর্ট চেক' : `লেভেল ${bn(placeOf(spec.id))}`}</small></span></p>
      <ol className="pg-slots" aria-label={`${bn(ids.length)}টা দেশের মধ্যে ${bn(trip.stamped.length)}টায় সিল`}>
        {ids.map((id, index) => <li key={id} data-got={trip.stamped.includes(index) || undefined} data-now={trip.at === index || undefined}>{trip.stamped.includes(index) && <Pic k={`${id}:animal`} className="pg-slot-pic" />}</li>)}
      </ol>
    </div>}

    {looking && (phase === 'map' || phase === 'fly') && <div className="pg-map-screen">
      <div className="pg-window"><WorldMap ids={ids} visited={trip.visited} flying={phase === 'fly' ? trip.at : null} slow={slow} frozen={frozen} onLanded={landed} onPin={index => goTo(index, false)} /></div>
      <p className="pg-say" role="status" aria-live="polite">{phase === 'fly' && here ? `${here.name} যাচ্ছি…` : trip.visited.length ? 'পরের দেশটা বেছে নাও।' : 'কোন দেশে যাবে? একটা চাপো।'}</p>
      <ul className="pg-go-list">
        {ids.map((id, index) => {
          const was = trip.visited.includes(index), c = countryOf(id)!;
          return <li key={id}><button type="button" className={`pg-go${was ? ' was' : ''}`} disabled={was || phase === 'fly'} aria-label={was ? `${c.name}, ঘোরা হয়েছে` : `${c.name} যাও`}
            onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary && event.button === 0) { event.preventDefault(); goTo(index, false); } }}
            onClick={event => { if (event.detail === 0 && performance.now() - keyAt.current > 400) goTo(index, false); }}>
            <span className="pg-pin-dot" style={{ background: PINS[index] }} aria-hidden="true">{was && <svg viewBox="0 0 12 12"><path d="M2.5 6.4l2.3 2.3 4.7-5.4" /></svg>}</span>
            <Badge id={id} />
            <span className="pg-go-name">{c.name}</span>
            <span className="pg-key" aria-hidden="true">{bn(index + 1)}</span>
            {ghost && phase === 'map' && !trip.visited.length && index === 0 && <Finger />}
          </button></li>;
        })}
      </ul>
    </div>}

    {looking && phase === 'card' && here && <div className="pg-visit">
      <Where country={here} />
      <div className="pg-card-wrap" key={`${trip.at}-${trip.card}`}><Postcard country={here} card={cardsHere(trip)[trip.card]} /></div>
      <ol className="pg-dots" aria-label={`${bn(cardsHere(trip).length)}টার মধ্যে ${bn(trip.card + 1)} নম্বর`}>{cardsHere(trip).map((k, i) => <li key={k} className={i < trip.card ? 'done' : i === trip.card ? 'now' : ''} />)}</ol>
      <button type="button" className="pg-next" aria-label={trip.card + 1 < cardsHere(trip).length ? 'পরের কার্ড' : 'প্রশ্ন'} onClick={event => { event.currentTarget.blur(); turn(false, true); }}>
        <NextArrow />
        {ghost && trip.card === 0 && !trip.stamped.length && <Finger />}
      </button>
    </div>}

    {looking && phase === 'ask' && q && target && <div className="pg-visit pg-ask" data-ask={q.ask}>
      {q.ask !== 'hello' && <Where country={target} ask={q.ask} />}
      <div className="pg-prompt">
        {q.ask === 'hello' && <p className="pg-bubble pg-bubble-ask"><span>{target.hello.word}</span></p>}
        {trip.solved
          ? <div className="pg-stamp" style={{ '--ink': target.ink } as CSSProperties}><Pic k={`${target.id}:animal`} className="pg-pic" /><span>{target.name}</span></div>
          : q.ask !== 'hello' && <div className="pg-stamp pg-stamp-empty" aria-hidden="true"><span>?</span></div>}
      </div>
      <p className="pg-q" role="status" aria-live="polite" data-kind={trip.solved ? 'why' : trip.tried.length ? 'try' : 'ask'}>{say}</p>
      <div className="pg-lower" key={`${trip.shown}`}>
        {trip.solved
          ? <button type="button" className="pg-next" aria-label={last ? 'দেখো কী পেলে' : 'পরেরটা'} data-last={last || undefined} onClick={event => { event.currentTarget.blur(); onward(false, true); }}><NextArrow last={last} /></button>
          : <ul className={`pg-choices pg-n${trip.choices.length}`}>
              {trip.choices.map((id, at) => {
                const right = id === target.id, c = countryOf(id)!;
                const label = q.ask === 'flag' ? `${bn(at + 1)}: ${c.name}র পতাকা` : q.ask === 'hello' ? `${bn(at + 1)}: ${c.name}` : `${bn(at + 1)}: ${c[q.ask].name}`;
                return <li key={`${trip.shown}-${id}`}><button type="button" ref={node => { if (node) tiles.current.set(id, node); else tiles.current.delete(id); }} aria-label={label} style={{ '--i': at } as CSSProperties}
                  className={`pg-choice${hint && right ? ' hint' : ''}${trip.tried.includes(id) ? ' tried' : ''}`}
                  onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
                    // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
                    if (!event.isPrimary || event.button !== 0) return;
                    event.preventDefault();
                    pick(id, event.currentTarget, false);
                  }}
                  // A screen reader's activation (a click with no pointer); a key press already picked through the window.
                  onClick={event => { if (event.detail === 0 && performance.now() - keyAt.current > 400) pick(id, event.currentTarget, false); }}>
                  <span className="pg-choice-key" aria-hidden="true">{bn(at + 1)}</span>
                  <Face ask={q.ask} id={id} />
                  {ghost && trip.shown === 1 && right && <Finger />}
                </button></li>;
              })}
            </ul>}
      </div>
    </div>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(result.level)} onDone={finishTrip} onShow={() => setShowing(true)} />}

    {card && result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `prithibi-ghuri-sofor-${result.level}.png`, make: () => cardBlob(card, location.host) }}>
      <div className="kit-card"><RoundCard data={card} /></div>
      <p className="pg-parent-line"><b>বড়দের জন্য:</b> {result.ids.length ? `জিজ্ঞেস করো, ${inside(countryOf(result.ids.at(-1)!)!.name)} কীভাবে হ্যালো বলে? ` : ''}রাতে মোবাইলের ম্যাপ বা গ্লোব খুলে দেশগুলো ঢাকা থেকে কোন দিকে, একসাথে খুঁজে দেখো।</p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
