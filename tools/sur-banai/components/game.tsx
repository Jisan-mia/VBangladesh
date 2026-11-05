'use client';
// IP: what we avoided — no Chrome Music Lab, Song Maker or Incredibox look, layout or sounds; no known tunes (no rhymes set to music, never the anthem); instruments are our own SVG and synthesized tones.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, play.ts the beat loop, session.ts the
// screens, pause and the rest screen); this file feeds taps and keys in, draws, runs the beat timer and plays the sounds.
import { useEffect, useRef, useState } from 'react';
import { useGamePlayer } from '../../../shared/game-player-client';
import { confetti, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { renderCard } from '../../../shared/card-canvas';
import { DRAFT_KEY, draftText, readDraft } from '../lib/draft';
import { LEVEL_COUNT, ORDER, isLevel, isWorldEnd, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from '../lib/levels';
import { DEMO, MAX_SAVED, SOUNDS, STEPS_NARROW, STEPS_WIDE, TEMPOS, addSaved, emptyTune, has, noteCount, readSaved, toggle, type Saved, type Today, type Tune } from '../lib/music';
import { beatAt, beatMs, playLength, type Playing } from '../lib/play';
import { canCheck, canTap, check as checkRound, clear as clearRound, createRound, hintTune, listened, resultOf, tap as tapRound, type Round } from '../lib/round';
import { NEED } from '../lib/rules';
import * as S from '../lib/session';
import { playBeat, playNote, sound } from '../lib/sound';
import { drawCard } from '../lib/draw-card';
import { CardCanvas } from './card-canvas';
import { EndScreen, type EndData } from './end-screen';
import { NoteGrid, type Cell } from './grid';
import { LevelList } from './level-list';
import { Finger, Icon, Instrument } from './pictures';
import { Title } from './title';

const SLUG = 'sur-banai';
const SAVED_KEY = 'ektukhani-sur-banai-tunes';
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: the tune just isn't kept */ } };

export function SurGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreenState] = useState<S.Screen>('title');
  const [level, setLevel] = useState(ORDER[0]);
  const [round, setRoundState] = useState<Round>(() => createRound(ORDER[0]));
  const roundRef = useRef(round);
  const [free, setFreeState] = useState<Tune>(() => emptyTune(STEPS_NARROW));
  const freeRef = useRef(free);
  const [sound_, setSound] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [draft, setDraft] = useState<Saved | null>(null);
  const [playing, setPlaying] = useState<Playing>('none');
  const [head, setHead] = useState(-1);
  const [played, setPlayed] = useState(false);
  const [end, setEnd] = useState<EndData | null>(null);
  const [today, setToday] = useState<Today>({ made: 0, matched: 0, last: null });
  const [showing, setShowing] = useState(false);
  const [ghost, setGhost] = useState(false);
  const [fresh, setFresh] = useState<Cell | null>(null);
  const [gateKey, setGateKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const whole = useRef(false);
  const live = useRef({ slow, tempo, sound: sound_, level, stars: levels.stars });
  live.current = { slow, tempo, sound: sound_, level, stars: levels.stars };

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const setFree = (next: Tune, instrument = live.current.sound) => { freeRef.current = next; setFreeState(next); write(DRAFT_KEY, draftText(next, instrument)); setDraft(noteCount(next) ? { tune: next, sound: instrument } : null); };
  const sync = () => setScreenState(session.current.screen);

  // ---- the beat loop: a timer chain, stopped by every way of leaving ----
  const instrument = () => { const world = worldOf(roundRef.current.level); return session.current.screen === 'play' && world.sound >= 0 ? world.sound : live.current.sound; };
  const msNow = () => beatMs(session.current.screen === 'play' ? worldOf(roundRef.current.level).ms : TEMPOS[live.current.tempo].ms, live.current.slow);
  const tuneOf = (kind: Playing): Tune => {
    const now = roundRef.current;
    if (kind === 'free') return freeRef.current;
    if (kind === 'target') return now.kind === 'gap' ? now.given : (now.target as Tune);
    return now.guess;
  };
  const lengthOf = (kind: Playing) => {
    const now = roundRef.current;
    if (kind === 'target') return now.kind === 'gap' ? now.given.length : playLength(now.target as Tune);
    return playLength(now.guess);
  };
  const halt = () => { clearTimeout(timer.current); timer.current = undefined; S.stopPlay(session.current); setPlaying('none'); setHead(-1); };
  function run(kind: Exclude<Playing, 'none'>, onEnd?: () => void) {
    clearTimeout(timer.current);
    if (!S.startPlay(session.current, kind)) return false;
    setPlaying(kind);
    let step = 0;
    const beat = () => {
      const tune = tuneOf(kind);
      const { beat: now, next } = beatAt(kind, tune, step, lengthOf(kind));
      if (!now) { halt(); onEnd?.(); return; }
      step = next;
      setHead(now.head);
      playBeat(now.rows, instrument());
      timer.current = setTimeout(beat, msNow());
    };
    beat();
    return true;
  }
  useEffect(() => () => { clearTimeout(timer.current); silenceScheduled(); }, []);

  // ---- first load: the kept tunes, the draft, the level this phone is ready for ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setSaved(readSaved(read(SAVED_KEY)));
    const found = readDraft(read(DRAFT_KEY));
    if (found) { freeRef.current = found.tune; setFreeState(found.tune); setSound(found.sound); setDraft(found); }
    const ready = nextToPlay(levels.stars);
    setLevel(ready); setRound(createRound(ready));
    setGhost(Object.keys(levels.stars).length === 0);
    if (location.hash === '#og') {
      const s = session.current;
      s.screen = 'end'; s.endKind = 'kept';
      setToday({ made: 1, matched: 0, last: DEMO }); setEnd({ kind: 'kept', tune: DEMO.tune, notes: noteCount(DEMO.tune) }); setShowing(true); sync();
    }
  }, [levels.loaded, levels.stars]);

  // An empty free grid follows the screen (turning a tablet); a tune already started keeps its beats.
  useEffect(() => {
    const wide = matchMedia('(min-width: 720px)');
    const fit = () => { const next = wide.matches ? STEPS_WIDE : STEPS_NARROW, old = freeRef.current; if (!noteCount(old) && old.length !== next) { freeRef.current = emptyTune(next); setFreeState(freeRef.current); } };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __sb: { round: () => roundRef.current, session: () => session.current, free: () => freeRef.current } });
  }, []);

  // ---- the player ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); halt(); silenceScheduled(); },
    onResume: () => S.resume(session.current),
    onRestart: () => { halt(); silenceScheduled(); S.toTitle(session.current); setShowing(false); sync(); },
    onLevels: () => { halt(); silenceScheduled(); S.openLevels(session.current, true); sync(); },
  });

  // ---- away and back: the beat stops, the first tap back only wakes the game ----
  useEffect(() => {
    const away = () => { S.blur(session.current); halt(); };
    const back = () => S.focus(session.current);
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
      const open = node.querySelector('.sb-grown .kk-gate-open, .sb-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- rounds ----
  function beginLevel(id: number) {
    const s = session.current;
    halt(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak(), false)) { sync(); return; }
    setRound(createRound(id)); setEnd(null); setShowing(false); setFresh(null);
    sound.page(); sync();
  }
  function beginFree(item?: Saved) {
    const s = session.current;
    halt(); silenceScheduled();
    if (!S.begin(s, kids.atBreak(), true)) { sync(); return; }
    if (item) {
      // Opening a kept tune never throws away the one being made: that goes on the shelf first.
      const current = freeRef.current;
      let shelf = saved;
      if (noteCount(current) && !shelf.some(old => old.tune.join('.') === current.join('.'))) shelf = addSaved(shelf, { tune: [...current], sound: live.current.sound });
      shelf = shelf.filter(old => old !== item);
      const next = [item, ...shelf].slice(0, MAX_SAVED);
      setSaved(next); write(SAVED_KEY, JSON.stringify(next));
      setSound(item.sound); setFree([...item.tune], item.sound);
    }
    setEnd(null); setShowing(false); setFresh(null); setPlayed(false);
    sound.page(); sync();
  }

  /** A cell, by finger or key. */
  function tapCell(step: number, row: number, viaKey = false) {
    const s = session.current;
    const taken = S.tapCell(s);
    if (taken !== 'counts') return;
    if (s.screen === 'free') {
      const next = toggle(freeRef.current, step, row), on = has(next, step, row);
      setFree(next); setFresh(on && !viaKey ? { step, row } : null);
      if (on) playNote(row, live.current.sound); else sound.off();
      return;
    }
    const before = roundRef.current;
    if (!canTap(before, step)) { sound.locked(); return; }
    const next = tapRound(before, step, row), on = has(next.guess, step, row);
    setRound(next); setFresh(on && !viaKey ? { step, row } : null); setGhost(false);
    if (on) playNote(row, instrument()); else sound.off();
  }

  const ear = () => {
    if (playing === 'target') { halt(); return; }
    halt();
    run('target', () => { setRound(listened(roundRef.current)); });
  };
  const mine = () => {
    if (playing === 'mine') { halt(); return; }
    halt();
    run('mine');
  };
  const playFree = () => {
    // Stopping is midway, never a break: no rest screen, nothing saved or lost.
    if (playing === 'free') { sound.tap(); halt(); return; }
    setPlayed(true);
    run('free');
  };

  function clearCells() {
    sound.off();
    if (session.current.screen === 'free') setFree(emptyTune(freeRef.current.length));
    else if (!session.current.answered) setRound(clearRound(roundRef.current));
    setFresh(null);
  }

  function checkIt() {
    const s = session.current, before = roundRef.current;
    if (s.screen !== 'play' || s.answered || s.paused || !canCheck(before)) return;
    halt();
    const next = checkRound(before);
    setRound(next);
    if (!next.solved) { sound.miss(); return; }
    // The match is recorded at this tap: the stars saved, the limit checked. Only the ➜ waits.
    if (!S.won(s, kids.atBreak(), performance.now())) return;
    const done = resultOf(next), spec = levelOf(done.level), stars = live.current.stars;
    const wasComplete = ORDER.every(id => stars[id]);
    whole.current = !wasComplete && ORDER.every(id => id === done.level || stars[id]);
    levels.record(done.level, done.stars);
    setEnd({ kind: 'level', result: done });
    setGhost(false);
    const sounding = worldOf(done.level).sound >= 0 ? worldOf(done.level).sound : live.current.sound;
    setToday(day => ({ ...day, matched: day.matched + (spec.kind === 'make' ? 0 : 1), made: day.made + (spec.kind === 'make' ? 1 : 0), last: { tune: done.tune, sound: sounding } }));
    if (spec.finale && spec.kind === 'make') {
      const shelf = addSaved(saved, { tune: done.tune, sound: sounding });
      setSaved(shelf); write(SAVED_KEY, JSON.stringify(shelf));
    }
    // The signature: your own tune plays through, lit, and a chime rings out as it ends.
    sound.match((playLength(done.tune) * msNow()) / 1000);
    run('echo');
  }

  /** ➜ */
  function onward() {
    const s = session.current;
    if (!S.advance(s, performance.now())) return;
    halt();
    const result = end?.kind === 'level' ? end.result : null;
    if (result && !s.resting) {
      sound.stars(result.stars);
      if (isWorldEnd(result.level)) sound.tune(worldOf(result.level).id);
      if (!live.current.slow && (whole.current || isWorldEnd(result.level))) confetti({ count: whole.current ? 110 : 60, y: 0.3 });
    }
    sync();
  }

  function keep() {
    const s = session.current, tune = freeRef.current;
    if (s.screen !== 'free' || !noteCount(tune)) return;
    halt();
    const item = { tune: [...tune], sound: live.current.sound };
    // A break: the tune goes on the shelf first, then the limit is checked.
    const shelf = addSaved(saved, item);
    setSaved(shelf); write(SAVED_KEY, JSON.stringify(shelf));
    setToday(day => ({ ...day, made: day.made + 1, last: item }));
    setFree(emptyTune(tune.length)); setFresh(null);
    setEnd({ kind: 'kept', tune: item.tune, notes: noteCount(item.tune) });
    S.kept(s, kids.atBreak(), performance.now());
    sound.keep(); sync();
  }

  // ---- screens ----
  const toTitle = () => { halt(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    if (end?.kind === 'level') { const after = nextInOrder(end.result.level) || nextToPlay(live.current.stars); setLevel(after); setRound(createRound(after)); }
    toTitle();
  };
  const againRound = () => { if (end?.kind === 'kept') beginFree(); else beginLevel(end?.kind === 'level' ? end.result.level : level); };
  const openLevels = () => { S.openLevels(session.current); sound.tap(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = 'title'; beginLevel(id); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show, .sb-grid')) return;
      const s = session.current, key = event.key, go = key === 'Enter' || key === ' ';
      if (kids.resting && !S.onGrid(s)) return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      if (!go) return;
      event.preventDefault();
      if (s.screen === 'title') { if (!event.repeat) beginLevel(level); return; }
      if (s.screen === 'free') { if (!event.repeat) playFree(); return; }
      if (s.screen === 'play') {
        if (S.freshNext(s, event.timeStamp, event.repeat)) { onward(); return; }
        if (event.repeat || s.answered) return;
        if (!roundRef.current.heard) ear(); else checkIt();
        return;
      }
      if (s.screen === 'end' && S.freshKey(s, event.timeStamp, event.repeat)) againRound();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  // ---- what is on screen ----
  const spec = levelOf(round.level), world = worldOf(screen === 'play' || screen === 'end' ? round.level : level);
  const inPlay = screen === 'play', inFree = screen === 'free';
  const placed = noteCount(round.guess) - noteCount(round.given);
  const need = spec.kind === 'make' ? NEED[spec.rule ?? 'own'] : round.target ? noteCount(round.target) - noteCount(round.given) : 0;
  const firstTarget = round.target ? round.target.findIndex(mask => mask) : 0;
  const firstCell = round.target && firstTarget >= 0 ? { step: firstTarget, row: [0, 1, 2, 3, 4].find(row => has(round.target as Tune, firstTarget, row)) ?? 0 } : null;
  const gap = round.kind === 'gap';
  const ghostCell: Cell | null = inFree ? (!noteCount(free) && !played ? { step: 1, row: 2 } : null)
    : inPlay && ghost && round.heard && !placed && round.tries === 0 && ORDER[0] === round.level && firstCell && !gap ? firstCell : null;
  const hint = inPlay ? hintTune(round) : null;
  const sounding = playing === 'none' ? null : tuneOf(playing);
  const shown = inFree ? free : round.guess;
  const heardIt = round.heard;
  const say = inFree
    ? (noteCount(free) ? (playing === 'free' ? 'বাজতে বাজতেও ঘর বদলানো যায়।' : 'বাজাও চাপো, সুরটা ঘুরে ঘুরে বাজবে।') : 'যেকোনো ঘরে চাপো। এখানে কোনো সুরই ভুল না।')
    : round.solved ? (playing === 'echo' ? 'শোনো, তোমার সুর।' : 'মিলেছে! এবার তীর চাপো।')
      : round.line ? round.line
        : spec.kind === 'make' ? (spec.rule === 'rising' ? 'একটার পর একটা উঁচু নোট বসাও, সিঁড়ির মতো।' : spec.rule === 'hill' ? 'ওপরে উঠে তারপর নিচে নামো, পাহাড়ের মতো।' : 'ছয়টা নোটের নিজের সুর বানাও, অন্তত তিন রকম।')
          : !heardIt ? (gap ? 'আগে শোনো। সুরটার ফাঁকে একটা নোট নেই।' : 'আগে শোনো আর দেখো, কোন ঘরে আলো জ্বলে।')
            : playing === 'target' ? 'দেখো, কোন ঘরে আলো জ্বলছে।'
              : gap ? 'ফাঁকের ঘরে ঠিক নোটটা বসাও।' : 'এবার ঠিক ওই ঘরগুলোতে চাপো, তারপর মিলিয়ে দেখো।';
  const restUp = kids.resting && !S.onGrid({ screen } as S.Session);
  const dots = Math.max(1, need);
  const pickInstrument = (index: number) => { setSound(index); if (inFree && noteCount(freeRef.current)) write(DRAFT_KEY, draftText(freeRef.current, index)); playNote(2, index); };
  const chooser = (inFree || (inPlay && spec.kind === 'make')) && <div className="sb-options">
    <div className="sb-sounds" role="group" aria-label="কোন বাজনা">
      {SOUNDS.map((item, index) => <button type="button" key={item.name} aria-pressed={sound_ === index} aria-label={item.name} onClick={event => { event.currentTarget.blur(); pickInstrument(index); }}><Instrument sound={index} /></button>)}
    </div>
    {inFree && <div className="sb-tempo" role="group" aria-label="তাল">
      {TEMPOS.map((item, index) => <button type="button" key={item.name} aria-pressed={tempo === index} aria-label={item.name} onClick={event => { event.currentTarget.blur(); setTempo(index); sound.tap(); }}><Icon id={index === 0 ? 'slow' : index === 1 ? 'mid' : 'fast'} /></button>)}
    </div>}
  </div>;
  const off = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };

  return <div ref={root} className="sb" data-world={inFree ? 3 : world.id} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} first={ghost} draft={draft} shelf={saved} onStart={() => beginLevel(level)} onFree={() => beginFree()} onLevels={openLevels} onLoad={item => beginFree(item)}>
      <div className="sb-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="সুর বানাই" text="ঘরে চেপে চেপে সুর বানানোর খেলা, ছোটদের জন্য। শব্দ বন্ধ রাখলেও আলো জ্বলে।" />
          {saved.length > 0 && <button type="button" className="kit-secondary" onClick={() => { setSaved([]); write(SAVED_KEY, '[]'); }}>রাখা সুরগুলো মুছে ফেলো</button>}
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(inPlay || inFree) && <>
      <div className="sb-hud">
        {inFree
          ? <p className="sb-badge"><Icon id="grid" className="sb-badge-ic" /><span><b>আমার সুর</b></span></p>
          : <p className="sb-badge"><Icon id={spec.icon} className="sb-badge-ic" /><span><b>{spec.title}</b><small>{spec.finale ? 'ফাইনাল' : `লেভেল ${bn(placeOf(round.level))}`}</small></span></p>}
        {inFree
          ? <button type="button" className="sb-home" onClick={off(toTitle)} aria-label="শুরুতে যাও"><Icon id="home" /></button>
          : <ol className="sb-dots" aria-label={`${bn(dots)}টার মধ্যে ${bn(Math.min(dots, placed))}টা বসেছে`}>
            {Array.from({ length: dots }, (_, index) => <li key={index} data-on={index < placed || undefined} />)}
          </ol>}
      </div>
      <div className="sb-main">
      <NoteGrid view={{ shown, given: gap ? round.given : null, gaps: inPlay && gap ? round.gaps : null, hint, wobble: inPlay && !slow ? round.wobble : null, head, sounding, fresh, ghost: ghostCell }}
        onTap={(step, row, viaKey) => tapCell(step, row, viaKey)} />
      <p className="sb-say" role="status" aria-live="polite" data-kind={round.line && inPlay ? 'try' : undefined}>{say}</p>

      {inFree && <div className="sb-actions sb-actions-free">
        <button type="button" className={`sb-act sb-act-main${playing === 'free' ? ' on' : ''}`} disabled={!noteCount(free)} onClick={off(playFree)} aria-label={playing === 'free' ? 'থামাও' : 'বাজাও'}>
          <Icon id={playing === 'free' ? 'stop' : 'play'} className="sb-act-ic" /><span>{playing === 'free' ? 'থামাও' : 'বাজাও'}</span>
          {noteCount(free) > 0 && !played && <Finger />}
        </button>
        <button type="button" className="sb-act sb-act-keep" disabled={!noteCount(free)} onClick={off(keep)} aria-label="রাখো"><Icon id="heart" className="sb-act-ic" /><span>রাখো</span></button>
        <button type="button" className="sb-act sb-act-small" disabled={!noteCount(free)} onClick={off(clearCells)} aria-label="মুছো"><Icon id="eraser" className="sb-act-ic" /><span>মুছো</span></button>
      </div>}

      {inPlay && (round.solved
        ? <div className="sb-actions sb-actions-next">
          <button type="button" className="sb-next" aria-label={spec.finale ? 'দেখো কী পেলে' : 'এগিয়ে চলো'} data-last={spec.finale || undefined} onClick={off(onward)}>
            <Icon id={spec.finale ? 'star' : 'next'} className="sb-next-ic" />
          </button>
        </div>
        : <div className="sb-actions">
          {spec.kind !== 'make' && <button type="button" className={`sb-act${playing === 'target' ? ' on' : ''}${!heardIt ? ' sb-act-lead' : ''}`} onClick={off(ear)} aria-label={playing === 'target' ? 'থামাও' : 'শোনো'}>
            <Icon id={playing === 'target' ? 'stop' : 'ear'} className="sb-act-ic" /><span>{playing === 'target' ? 'থামাও' : 'শোনো'}</span>
            {ghost && !heardIt && playing === 'none' && <Finger />}
          </button>}
          <button type="button" className={`sb-act${playing === 'mine' ? ' on' : ''}`} disabled={!placed && !noteCount(round.guess)} onClick={off(mine)} aria-label={playing === 'mine' ? 'থামাও' : 'বাজাও'}>
            <Icon id={playing === 'mine' ? 'stop' : 'play'} className="sb-act-ic" /><span>{playing === 'mine' ? 'থামাও' : 'বাজাও'}</span>
          </button>
          <button type="button" className="sb-act sb-act-check" disabled={!canCheck(round)} onClick={off(checkIt)} aria-label="মিলিয়ে দেখো"><Icon id="tick" className="sb-act-ic" /><span>মেলাও</span></button>
          <button type="button" className="sb-act sb-act-small" disabled={!placed} onClick={off(clearCells)} aria-label="মুছো"><Icon id="eraser" className="sb-act-ic" /><span>মুছো</span></button>
        </div>)}
      {chooser}
      </div>
    </>}

    {screen === 'end' && end && <EndScreen data={end} slow={slow} head={-1} onAgain={againRound} onDone={finishRound} onShow={() => setShowing(true)} />}

    {today.last && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: 'sur-banai.png',
      make: () => renderCard(canvas => drawCard(canvas, today, location.host)),
    }}>
      <div className="kit-card"><CardCanvas today={today} /></div>
      <p className="sb-parent-line"><b>বড়দের জন্য:</b> সা রে গা পা ধা, এই পাঁচ নোট যেভাবেই সাজানো হোক, শুনতে ভালো লাগে। ছবির প্রতিটা রঙিন ঘর একটা নোট, বাম থেকে ডানে বাজে। জিজ্ঞেস করো, সবচেয়ে উঁচু সুর কোন সারিতে।</p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
