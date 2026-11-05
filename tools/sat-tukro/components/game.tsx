'use client';
// IP: what we avoided — no copied tangram books, apps or puzzle cards; every silhouette is our own arrangement of the classic seven-piece set (public domain), and no TV characters.
// The game inside the shared player. The rules live in lib/ (game.ts plays a round, session.ts decides screens, the cheer timer,
// pause and the rest screen); this file feeds touches and keys in, draws through the Table and plays the sounds.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, newSeed, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob, cardLine, drawCard } from '../lib/draw-card';
import { FIGURES } from '../lib/figures';
import { drop, easeFrom, flipPiece, newRound, nudge, resultOf, tapPiece, toView, turnPiece, PIECE_COLOR, type Outcome, type Result, type Round } from '../lib/game';
import { LEVEL_COUNT, figureOf, isFinale, isLevel, nextInOrder, nextToPlay, specOf, worldOf } from '../lib/levels';
import * as S from '../lib/session';
import { sound } from '../lib/sound';
import { EndScreen } from './end-screen';
import { FigureArt } from './figure-art';
import { LevelList } from './level-list';
import { PrintSheet } from './print-sheet';
import { Table, type Dropped, type TableApi } from './table';
import { Title } from './title';

const CHEER_MS = 1300, CHEER_SLOW_MS = 500, BREATH_MS = 500, IDLE_MS = 10000;

export function TangramGame() {
  const [print, setPrint] = useState(false);
  useEffect(() => { setPrint(new URLSearchParams(location.search).has('print')); }, []);
  // The ?print sheet is a whole A4 page, so it covers the site instead of sitting in the stage.
  useEffect(() => {
    if (!print) return;
    document.documentElement.classList.add('st-printing');
    return () => document.documentElement.classList.remove('st-printing');
  }, [print]);
  return print ? createPortal(<div className="st-print-root tool-sat-tukro"><PrintSheet /></div>, document.body) : <Play />;
}

function Play() {
  const levels = useLevels('sat-tukro', LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  // The phone's own reduced-motion setting counts like ধীরে খেলো for the canvas (the CSS has its own media query).
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)'), sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const calm = slow || reduced;
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => newRound(1, 1));
  const roundRef = useRef(round);
  const [roundKey, setRoundKey] = useState('1:0');
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(0);
  const [idle, setIdle] = useState(false);
  const [cheer, setCheer] = useState(0);
  const [made, setMade] = useState<string[]>([]);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const root = useRef<HTMLDivElement>(null), table = useRef<TableApi | null>(null);
  const ease = useRef(0);
  const live = useRef({ slow: calm, level, stars: levels.stars });
  live.current = { slow: calm, level, stars: levels.stars };

  // ---- timers: the one cheer timer and the quiet-spell timer; both cleared together ----
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | null>(null), idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopCheer = () => { if (cheerTimer.current) clearTimeout(cheerTimer.current); cheerTimer.current = null; };
  const stopIdle = () => { if (idleTimer.current) clearTimeout(idleTimer.current); idleTimer.current = null; };
  const clearAll = () => { stopCheer(); stopIdle(); };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const sync = () => setScreen(session.current.screen);
  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };

  /** A quiet spell: after 10 s of nothing, the right spot glows (and the first levels show the ghost finger again). */
  const armIdle = () => {
    stopIdle();
    if (!S.hintMayShow(session.current)) return;
    idleTimer.current = setTimeout(() => {
      idleTimer.current = null;
      if (!S.hintMayShow(session.current)) return;
      setIdle(true);
      const id = roundRef.current.level;
      if (id <= 2) setGhost(id);
    }, IDLE_MS);
  };
  const touch = () => { setGhost(0); setIdle(false); armIdle(); };

  // ---- first load: this phone's progress picks the picture that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready);
    setRound(newRound(ready, newSeed()));
    setRoundKey(`${ready}:0`);
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __sat: { round: () => roundRef.current, session: () => session.current, table: () => table.current, toView } });
  }, []);

  // ---- the player: pause freezes the cheer timer; resume gives it back after a breath ----
  const armCheer = (ms: number) => {
    stopCheer();
    cheerTimer.current = setTimeout(() => { cheerTimer.current = null; fire(); }, ms);
  };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); stopCheer(); stopIdle(); table.current?.cancel(); table.current?.stop(); },
    onResume: () => { S.resume(session.current); table.current?.kick(); if (session.current.pending !== 'none') armCheer(BREATH_MS); else armIdle(); },
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); setIdle(false); setGhost(0); sync(); },
    onLevels: () => openLevels(),
  });

  // ---- away and back: the first press back only wakes the game ----
  useEffect(() => {
    const onBlur = () => { S.blur(session.current); stopIdle(); };
    const onFocus = () => { S.focus(session.current); };
    const onVisibility = () => { if (document.hidden) onBlur(); else onFocus(); };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  // ---- an open parent gate shuts on the next touch anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.st-grown .kk-gate-open, .st-grown .kk-gate');
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
    setRound(newRound(id, newSeed(), ease.current));
    ease.current = 0;
    setRoundKey(`${id}:${s.serial}`);
    setResult(null); setShowing(false); setIdle(false);
    setGhost(id <= 2 && !live.current.stars[id] ? id : 0);
    sound.tap();
    sync();
    armIdle();
  }

  function fire() {
    const s = session.current;
    S.timerFires(s, performance.now());
    const done = roundRef.current;
    // Under the rest screen the round ends quietly.
    if (!s.resting) {
      sound.stars(resultOf(done).stars);
      if (isFinale(done.level)) { sound.tune(worldOf(done.level).id); if (!live.current.slow) confetti({ count: 80, y: 0.3 }); }
    }
    sync();
  }

  /** What a landing piece does to the page: a sound, and on the last one the stars, the limit and the cheer. */
  function landed(next: Round, outcome: Outcome) {
    const count = next.pieces.filter(piece => piece.done).length;
    sound.thock(count, live.current.slow ? 0.05 : 0.14);
    if (outcome !== 'done') return;
    const s = session.current;
    stopIdle(); setIdle(false);
    // The last piece finishes the picture at this very drop: stars saved, the limit checked. Only the end screen waits.
    if (S.finished(s, kids.atBreak())) {
      const done = resultOf(next);
      levels.record(done.level, done.stars);
      ease.current = easeFrom(done.misses);
      setResult(done);
      setMade(list => [...list, done.figure]);
      sound.whole();
      setCheer(value => value + 1);
      armCheer(live.current.slow ? CHEER_SLOW_MS : CHEER_MS);
    }
  }

  function react(next: Round, outcome: Outcome | 'select' | 'rotate' | 'flip') {
    setRound(next);
    if (outcome === 'fit' || outcome === 'done') landed(next, outcome);
    else if (outcome === 'select') sound.lift();
    else if (outcome === 'rotate') sound.turn();
    else if (outcome === 'flip') sound.flip();
    else if (outcome === 'turn') sound.ask();
    else if (outcome === 'miss') sound.glide();
    else if (outcome === 'park' || outcome === 'home') sound.pat();
  }

  const drops = (id: number, x: number, y: number): Dropped | null => {
    if (S.pressTable(session.current) === 'ignored') return null;
    touch();
    const got = drop(roundRef.current, id, x, y);
    react(got.round, got.outcome);
    return got;
  };
  const tap = (id: number) => { touch(); const got = tapPiece(roundRef.current, id); react(got.round, got.outcome); };
  const turn = (id: number) => { touch(); const got = turnPiece(roundRef.current, id); react(got.round, got.outcome); };
  const flip = () => { const r = roundRef.current; if (r.selected === null) return; touch(); const got = flipPiece(r, r.selected); react(got.round, got.outcome); };
  const turnSelected = () => { const r = roundRef.current; if (r.selected !== null) turn(r.selected); };

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next picture ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(newRound(after, newSeed())); setRoundKey(`${after}:t${session.current.serial}`);
    toTitle();
  };
  function openLevels() {
    const s = session.current;
    stopCheer(); stopIdle(); table.current?.cancel();
    S.openLevels(s, performance.now());
    sound.tap(); sync();
  }
  const closeLevels = () => { S.closeLevels(session.current); sync(); armIdle(); };
  const pickLevel = (id: number) => {
    const s = session.current;
    if (S.pickFromList(s, id === roundRef.current.level) === 'resume') { closeLevels(); return; }
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
      if (s.screen === 'title' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (!event.repeat) begin(live.current.level); return; }
      if (s.screen === 'end' && (key === 'Enter' || key === ' ')) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(roundRef.current.level); return; }
      if (s.screen !== 'play' || S.pressTable(s) === 'ignored') return;
      const r = roundRef.current, waiting = r.pieces.filter(piece => !piece.done), at = '1234567'.indexOf(key);
      if (at >= 0 && waiting[at]) { event.preventDefault(); if (!event.repeat) { touch(); table.current?.quick(); const got = tapPiece({ ...r, selected: null }, waiting[at].id); react(got.round, got.outcome); } return; }
      const held = r.selected === null ? null : r.pieces[r.selected];
      const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (step[key]) {
        event.preventDefault();
        const piece = held && !held.done ? held : waiting[0];
        if (!piece) return;
        touch(); table.current?.quick();
        const size = event.shiftKey ? 2 : 0.5, got = nudge(r, piece.id, step[key][0] * size, step[key][1] * size);
        react(got.round, got.outcome === 'park' ? 'none' : got.outcome);
        return;
      }
      if ((key === 'r' || key === 'R') && !event.repeat) { event.preventDefault(); if (held && !held.done) { table.current?.quick(); turn(held.id); } return; }
      if ((key === 'f' || key === 'F') && !event.repeat) { event.preventDefault(); table.current?.quick(); flip(); return; }
      if ((key === 'Enter' || key === ' ') && !event.repeat && held && !held.done && !held.inTray) {
        event.preventDefault(); touch(); table.current?.quick();
        const got = drop(r, held.id, held.x, held.y);
        react(got.round, got.outcome);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const stageH = player.stage.height || 760;
  const picture = Math.round(Math.max(150, Math.min(240, (stageH - 360) * 0.7)));
  const spec = round.spec, figure = round.figure, world = spec.world;
  const turning = spec.turns > 0 || spec.flip;
  const held = round.selected === null ? null : round.pieces[round.selected];
  const restUp = kids.resting && screen !== 'play';
  const placed = round.pieces.filter(piece => piece.done).length;

  return <div ref={root} className="st" data-world={screen === 'title' || screen === 'levels' ? worldOf(level).id : world} data-screen={screen} data-slow={calm || undefined}>
    {screen === 'title' && <Title level={level} size={picture} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="st-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="সাত টুকরো" text="সাত টুকরো ঘুরিয়ে ছায়ার ভেতর বসানোর খেলা, ৫–১২ বছরের জন্য।" />
          <a className="kit-secondary st-print" href="/sat-tukro?print">কাটার পাতা প্রিন্ট করো</a>
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {screen === 'play' && <>
      <div className="st-hud">
        <button type="button" className="st-badge" onClick={event => { event.currentTarget.blur(); player.requestPause(); }} aria-label={`ছবি ${bn(round.level)}: ${figure.name}। থামাও`}>
          <FigureArt figure={figure} size={34} label={false} className="st-badge-art" />
          <span><b>{figure.name}</b><small>ছবি {bn(round.level)}{spec.finale ? ' · শেষ ছবি' : ''}</small></span>
        </button>
        <ol className="st-dots" aria-label={`সাতটার মধ্যে ${bn(placed)}টা বসেছে`}>
          {round.pieces.map(piece => <li key={piece.id} data-in={piece.done || undefined} style={{ ['--c' as string]: PIECE_COLOR[piece.id] }} />)}
        </ol>
      </div>
      <div className="st-bar" aria-hidden="true"><i style={{ transform: `scaleX(${placed / 7})` }} /></div>
      <Table round={round} roundKey={roundKey} calm={calm} ghost={ghost} idle={idle} cheer={cheer} api={table}
        live={() => S.pressTable(session.current) === 'counts'} wake={() => S.pressTable(session.current) === 'woke'}
        onDrop={drops} onTap={tap} onTurn={turn} onLift={() => { touch(); sound.lift(); }} />
      {turning && <div className="st-controls">
        <button type="button" className="st-ctl" disabled={!held || held.done} onClick={event => { event.currentTarget.blur(); turnSelected(); }} aria-label="টুকরো ঘোরাও">
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg><span>ঘোরাও</span>
        </button>
        {held?.kind === 'P' && <button type="button" className="st-ctl" onClick={event => { event.currentTarget.blur(); flip(); }} aria-label="সামান্তরিক উল্টাও">
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6v36" /><path d="M18 14L6 34h12z" /><path d="M30 14l12 20H30z" /></svg><span>উল্টাও</span>
        </button>}
      </div>}
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={calm} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {made.length > 0 && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: 'sat-tukro.png', make: () => cardBlob(made, location.host) }}>
      <div className="kit-card"><Card ids={made} /></div>
      <p>{cardLine(made)}: {made.map(id => FIGURES.find(f => f.id === id)?.name).join(', ')}।</p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}

/** The card for the parent, drawn once the fonts are in. */
function Card({ ids }: { ids: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    loadCardFonts(`${cardLine(ids)} ${ids.map(id => FIGURES.find(f => f.id === id)?.name).join(' ')}`).then(() => { if (alive && ref.current) drawCard(ref.current, ids, location.host); });
    return () => { alive = false; };
  }, [ids]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={cardLine(ids)} role="img" />;
}
