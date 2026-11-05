'use client';
// IP: what we avoided — no film, toy or museum dinosaur designs and no "Jurassic" look; every dinosaur, bone, rock and shell is our own
// round, smiling drawing, and the facts are re-said in our words from the Natural History Museum's Dino Directory.
// The game inside the shared player. The rules live in lib/ (round.ts plays a round, pit.ts + pit.hot.ts dig, stroke.ts is the finger,
// session.ts decides screens, pause, ▶ and the rest screen); this file feeds taps and keys in, draws, and plays the sounds.
import { useEffect, useMemo, useRef, useState } from 'react';
import { confetti, newSeed, shake, silenceScheduled, useLevels, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { addToBook, BOOK_KEY, readBook } from '../lib/book';
import { DIET_WORD, DINOS, teethHint, type Diet, type Part } from '../lib/dinos';
import { afterDig, boneFound, chooseDiet, createRound, dinoNow, glowOn, isLastDino, nextDino, pick, pitDone, pitKinds, pitSeed, place, resultOf, FRESH_PACE, type Result, type Round } from '../lib/round';
import * as S from '../lib/session';
import { boneName, placeHint } from '../lib/skeleton';
import { sound } from '../lib/sound';
import { DECOY_NAME } from '../lib/things';
import { isLevel, isWorldEnd, LEVEL_COUNT, levelOf, nextInOrder, nextToPlay, placeOf, WORLDS } from '../lib/worlds';
import type { Pit } from '../lib/pit';
import { Book } from './book';
import { Skeleton, Stand, type Fly, FRAME } from './board';
import { EndScreen } from './end-screen';
import { LevelList } from './level-list';
import { BoneArt, FactCard, GhostFinger, Leaf, Meat, SizePicture } from './pieces';
import { RoundCard } from './round-card';
import { SandLayer, type SandApi } from './sand-layer';
import { Title } from './title';

const SLUG = 'dinosaur';
const BREATH_MS = 400, SETTLE_MS = 800, IDLE_MS = 8000;
type Say = { title?: string; text: string; hint?: boolean };
const NO_SAY: Say = { text: '' };
const store = { read: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } }, write: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } } };
const BUILD_LINE = 'একটা হাড় বেছে নাও, তারপর কঙ্কালের ঠিক জায়গায় চাপো।';
const SECOND_PIT = 'আরেকটা গর্তে বাকি হাড়।';

export function DinoGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>('title');
  const [level, setLevel] = useState(1);
  const [round, setRoundState] = useState<Round>(() => createRound(1, 1));
  const roundRef = useRef(round);
  const [book, setBook] = useState<string[]>([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [said, setSaid] = useState<Say>(NO_SAY);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [away, setAway] = useState(false);
  const [settling, setSettling] = useState(false);
  const [hint, setHint] = useState(-1);
  const [wobble, setWobble] = useState<{ key: string; n: number } | null>(null);
  const [fly, setFly] = useState<Fly | null>(null);
  const root = useRef<HTMLDivElement>(null), tray = useRef<HTMLDivElement>(null), diets = useRef<HTMLDivElement>(null);
  const sand = useRef<SandApi | null>(null);
  const beginRef = useRef<(id: number) => void>(() => undefined);
  const lastAct = useRef(0), flyN = useRef(0);
  const live = useRef({ slow, level });
  live.current = { slow, level };

  // ---- timers: the small ones (confetti, the world tune), all cleared together ----
  const small = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = (run: () => void, ms: number) => { const id = setTimeout(() => { small.current.delete(id); run(); }, ms); small.current.add(id); };
  const clearAll = () => { for (const id of small.current) clearTimeout(id); small.current.clear(); };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const setRound = (next: Round) => { roundRef.current = next; setRoundState(next); };
  const sync = () => setScreen(session.current.screen);
  const spec = levelOf(round.level), dino = dinoNow(round);

  useEffect(() => { setBook(readBook(store.read(BOOK_KEY))); }, []);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const ready = nextToPlay(levels.stars);
    setLevel(ready); setRound(createRound(ready, newSeed()));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    Object.assign(window, { __dino: { round: () => roundRef.current, session: () => session.current, dino: () => dinoNow(roundRef.current), begin: (id: number) => beginRef.current(id) } });
  }, []);

  const openLevels = () => { clearAll(); sand.current?.release(); S.openLevels(session.current); sound.tap(); sync(); };
  // ---- the player: pause freezes everything; the first tap back only wakes the game ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); sand.current?.release(); setAway(true); },
    onResume: () => { S.resume(session.current); later(() => setAway(false), BREATH_MS); },
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); setBookOpen(false); setSettling(false); setAway(false); sync(); },
    onLevels: openLevels,
  });
  const frozen = player.paused || bookOpen || away;

  useEffect(() => {
    const onBlur = () => { S.blur(session.current); sand.current?.release(); };
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
    const down = (event: PointerEvent) => {
      const open = node.querySelector('.dn-grown .kk-gate-open, .dn-grown .kk-gate');
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener('pointerdown', down, true);
    return () => node.removeEventListener('pointerdown', down, true);
  }, []);

  // ---- the dig is done: a short beat to see the last bone lift, then the next pit or the skeleton. It waits while paused. ----
  useEffect(() => {
    if (!settling || frozen) return;
    const id = setTimeout(() => {
      const before = roundRef.current, next = afterDig(before);
      setSettling(false); setTouched(false); setHint(-1);
      if (next === before) return;
      setRound(next);
      setSaid({ text: next.phase === 'build' ? BUILD_LINE : SECOND_PIT });
      if (next.phase === 'build') sound.tap();
    }, SETTLE_MS);
    return () => clearTimeout(id);
  }, [settling, frozen]);

  // ---- a quiet while in the dig: a sparkle over the next bone ----
  useEffect(() => {
    if (screen !== 'play' || round.phase !== 'dig' || settling || frozen) return;
    lastAct.current = performance.now();
    const id = setInterval(() => {
      if (performance.now() - lastAct.current < IDLE_MS) return;
      const now = roundRef.current, at = pitKinds(now).findIndex(kind => !now.found.includes(kind));
      setHint(at);
    }, 1000);
    return () => clearInterval(id);
  }, [screen, round.phase, round.dig, round.index, settling, frozen]);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    clearAll(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    const next = createRound(id, newSeed(), roundRef.current.pace ?? FRESH_PACE);
    setRound(next); setTouched(false); setSaid({ text: levelOf(id).tip }); setResult(null); setShowing(false); setAway(false); setSettling(false); setHint(-1); setFly(null); setWobble(null); setBookOpen(false);
    sound.tap();
    sync();
  }

  beginRef.current = begin;

  /** The brush uncovered something. Bones go to the round; the last one of the pit starts the beat before the next step. */
  function stamped(pit: Pit) {
    lastAct.current = performance.now();
    setTouched(true);
    if (hint >= 0) setHint(-1);
    let now = roundRef.current, name = '';
    for (let k = 0; k < pit.nFreshBone; k++) {
      const kind = pit.bones[pit.freshBone[k]].kind;
      now = boneFound(now, kind);
      name = boneName(kind, dino);
    }
    if (pit.nFreshBone > 0) {
      setRound(now);
      sound.found();
      if (pitDone(now)) { setSettling(true); setSaid({ text: 'সব হাড় উঠে এসেছে।' }); }
      else setSaid({ text: `${name} পেলে। আরও খোঁজো।` });
    }
    if (pit.nFreshDecoy > 0) { sound.plop(); setSaid({ text: `এটা ${DECOY_NAME[pit.decoys[pit.freshDecoy[0]].kind]}, হাড় নয়।` }); }
  }

  function wobbleOn(key: string) { setWobble(value => ({ key, n: (value?.n ?? 0) + 1 })); }

  function pickBone(kind: Round['kinds'][number]) {
    if (S.touch(session.current) !== 'counts') return;
    sound.pickUp(); setTouched(true);
    setRound(pick(roundRef.current, kind));
  }

  /** A tap on the skeleton (or a place by key): the picked bone goes to the nearest empty place. */
  function placeAt(slot: Part | null) {
    if (S.touch(session.current) !== 'counts') return;
    const before = roundRef.current, { round: next, result: how } = place(before, slot ? slot[0] : null);
    if (how === 'none') return;
    setTouched(true);
    if (how === 'pick-first') { sound.miss(); wobbleOn('tray'); setSaid({ text: 'আগে নিচ থেকে একটা হাড় বেছে নাও।', hint: true }); return; }
    if (how === 'slip') { sound.miss(); wobbleOn(slot![0]); setRound(next); setSaid({ text: placeHint(before.picked!, dino), hint: true }); return; }
    // The bone flies in from where it sat in the tray.
    const button = tray.current?.querySelector<HTMLElement>(`[data-bone="${before.picked}"]`), svg = root.current?.querySelector<SVGSVGElement>('.dn-skeleton');
    if (button && svg && slot) {
      const a = button.getBoundingClientRect(), b = svg.getBoundingClientRect();
      flyN.current += 1;
      setFly({ kind: slot[0], dx: (a.left + a.width / 2 - b.left) / b.width * 240 - slot[1], dy: (a.top + a.height / 2 - b.top) / b.height * FRAME.height + FRAME.top - slot[2], n: flyN.current });
    }
    sound.snap(next.placed.length);
    setRound(next);
    if (how === 'stands') { sound.stands(0.35); setTouched(false); setSaid({ title: dino.name, text: 'ও কী খেত? মুখটা দেখো।' }); }
    else setSaid({ text: `${boneName(slot![0], dino)} বসল।` });
  }

  /** The food. The last dinosaur's right answer wins the round: the stars are saved and the daily limit is checked in this very tap. */
  function sort(diet: Diet, node: Element | null) {
    const s = session.current;
    if (S.touch(s) !== 'counts') return;
    const before = roundRef.current, { round: next, result: how } = chooseDiet(before, diet);
    if (how === 'none') return;
    if (how === 'slip') { sound.miss(); shake(node); setRound(next); setSaid({ text: teethHint(dino.teeth), hint: true }); return; }
    sound.good();
    const last = isLastDino(before);
    setRound(next);
    const added = addToBook(book, dino.id);
    setBook(added); store.write(BOOK_KEY, JSON.stringify(added));
    if (S.solve(s, last, last ? kids.atBreak() : false, performance.now())) {
      const done = resultOf(next);
      levels.record(done.level, done.stars);
      setResult(done);
    }
    setSaid({ text: `মুখ দেখে ধরেছ: ${DIET_WORD[diet]}।` });
  }

  /** ▶ : the next dinosaur, or after the last one the end screen. */
  function go(key?: { timeStamp: number; repeat: boolean }) {
    const s = session.current, step = S.advance(s, key);
    if (step === 'no') return;
    if (step === 'next') {
      const next = nextDino(roundRef.current);
      if (next) { setRound(next); setTouched(false); setSaid({ text: levelOf(next.level).tip }); setHint(-1); setFly(null); setWobble(null); sound.page(); }
    } else {
      const done = resultOf(roundRef.current), world = levelOf(done.level).world;
      // Under the rest screen the round ends quietly.
      if (!s.resting) {
        sound.stars(done.stars);
        if (isWorldEnd(done.level)) { sound.tune(world); if (!live.current.slow) later(() => confetti({ count: 70, y: 0.3 }), 300); }
      }
      sync();
    }
  }

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(level) || nextToPlay(levels.stars);
    setLevel(after); setRound(createRound(after, newSeed(), roundRef.current.pace));
    toTitle();
  };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = 'title'; begin(id); };
  const openBook = () => { sand.current?.release(); S.openBook(session.current); setBookOpen(true); sound.tap(); };
  const closeBook = () => { S.closeBook(session.current); setBookOpen(false); sound.tap(); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show, .dn-book')) return;
      const s = session.current, key = event.key;
      if (kids.resting && s.screen !== 'play') return;
      if (s.book) return;
      if (key === 'p' || key === 'P') { event.preventDefault(); player.requestPause(); return; }
      const press = key === 'Enter' || key === ' ';
      const onButton = !!target?.closest?.('button, [role=button]:not(.dn-sand), a, summary');
      if (s.screen === 'title' && press) { if (onButton) return; event.preventDefault(); if (!event.repeat) begin(level); return; }
      if (s.screen === 'end' && press) { if (onButton) return; event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(level); return; }
      if (s.screen !== 'play') return;
      const now = roundRef.current;
      if (press) {
        if (s.solved) { if (onButton) return; event.preventDefault(); go({ timeStamp: event.timeStamp, repeat: event.repeat }); return; }
        if (onButton) return;
        event.preventDefault();
        if (now.phase === 'dig' && !event.repeat && !settling) sand.current?.key();
        return;
      }
      if (now.phase === 'build' && !event.repeat) {
        const at = '123456'.indexOf(key), left = now.found.filter(kind => !now.placed.includes(kind));
        if (at >= 0 && left[at]) { event.preventDefault(); pickBone(left[at]); }
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  });

  const parts = dino.parts.slice(0, round.kinds.length) as Part[];
  const kinds = useMemo(() => pitKinds(round), [round.kinds, round.dig, round.level]); // eslint-disable-line react-hooks/exhaustive-deps
  const pitSpec = useMemo(() => ({ depth: spec.depth, rocks: spec.rocks, decoys: spec.decoys }), [spec.depth, spec.rocks, spec.decoys]);
  const trayBones = round.found.filter(kind => !round.placed.includes(kind));
  const glow = glowOn(round);
  const restUp = kids.resting && screen !== 'play';
  const world = WORLDS[spec.world];
  const wobbleClass = (key: string) => wobble?.key === key && !slow ? ` dn-wobble dn-w${wobble.n % 2}` : '';
  const inPlay = screen === 'play' || screen === 'end';
  const dinoCount = spec.dinos.length;
  const dotState = (i: number) => (i < round.index || (i === round.index && round.phase === 'facts') || screen === 'end') ? 'got' : i === round.index && screen === 'play' ? 'now' : undefined;

  return <div ref={root} className="dn" data-world={levelOf(screen === 'levels' || screen === 'title' ? level : round.level).world} data-screen={screen} data-slow={slow || undefined}>
    {screen === 'title' && <Title level={level} bookCount={book.length} bookTotal={DINOS.length} onStart={() => begin(level)} onLevels={openLevels} onBook={openBook}>
      <div className="dn-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="ডাইনোসর খুঁজি" text="ছোটদের ডাইনোসর গেম: বালু সরিয়ে হাড় খোঁজো, কঙ্কাল জোড়া দাও। ফ্রি, বিজ্ঞাপন নেই।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === 'levels' && <LevelList stars={levels.stars} book={book} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {inPlay && <div className="dn-hud">
      <p className="dn-badge"><span className="dn-badge-n" aria-hidden="true">{bn(placeOf(round.level))}</span><span><b>{spec.title}</b><small>লেভেল {bn(placeOf(round.level))} · {world.name}</small></span></p>
      <div className="dn-hud-right">
        <ol className="dn-dots" aria-label={`${bn(dinoCount)}টার মধ্যে ${bn(round.index + (round.phase === 'facts' || screen === 'end' ? 1 : 0))}টা হয়েছে`}>
          {spec.dinos.map((id, i) => <li key={id} data-state={dotState(i)} />)}
        </ol>
        <button type="button" className="dn-bookbtn dn-bookbtn-hud" onClick={event => { event.currentTarget.blur(); openBook(); }} aria-label={`খোঁজার বই: ${bn(DINOS.length)}টার ${bn(book.length)}টা পেয়েছ`}>
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M4 7Q10 4 16 8Q22 4 28 7V26Q22 23 16 27Q10 23 4 26Z" /><path d="M16 8V27" /></svg>
          <span>{bn(book.length)}/{bn(DINOS.length)}</span>
        </button>
      </div>
    </div>}

    {screen === 'play' && <>
      <div className="dn-board" data-phase={round.phase} data-finale={spec.finale || undefined}>
        {round.phase === 'dig' && <SandLayer key={`${round.seed}-${round.index}-${round.dig}`} kinds={kinds} spec={pitSpec} world={spec.world} marks={spec.marks} seed={pitSeed(round)}
          found={round.found} slow={slow} gate={() => S.touch(session.current)} onStamp={stamped} hint={hint} api={sand} live={!settling && !frozen}
          demo={!touched && !settling && !frozen ? (spec.depth === 2 ? 'two' : 'one') : null} />}
        {round.phase === 'build' && <Skeleton dino={dino} parts={parts} placed={round.placed} picked={round.picked} glow={glow} ghost={spec.ghost} wobble={wobble} slow={slow} fly={fly} onSlot={placeAt} />}
        {round.phase === 'meet' && <Stand dino={dino} parts={parts} mouth />}
        {round.phase === 'facts' && <SizePicture dino={dino} scene />}
        {spec.finale && round.phase === 'meet' && <p className="dn-banner" aria-hidden="true">{spec.title}</p>}
      </div>

      {round.phase === 'dig' && <ol className="dn-tally" aria-label={`${bn(round.kinds.length)}টার মধ্যে ${bn(round.found.length)}টা হাড় পেয়েছ`}>
        {round.kinds.map(kind => <li key={kind} data-on={round.found.includes(kind) || undefined}>{round.found.includes(kind) && <BoneArt kind={kind} />}</li>)}
      </ol>}
      {round.phase === 'build' && <div ref={tray} className={`dn-tray${wobbleClass('tray')}`}>
        {trayBones.map((kind, i) => <button key={kind} type="button" data-bone={kind} className={`dn-bone${round.picked === kind ? ' picked' : ''}`} aria-pressed={round.picked === kind} aria-label={boneName(kind, dino)}
          onClick={event => { event.currentTarget.blur(); pickBone(kind); }}>
          <BoneArt kind={kind} />
          <span className="dn-key" aria-hidden="true">{bn(i + 1)}</span>
          {!touched && i === 0 && <span className="dn-ghost dn-tap"><GhostFinger /></span>}
        </button>)}
      </div>}
      {round.phase === 'meet' && <div ref={diets} className="dn-diet">
        {(['plant', 'meat'] as const).map(diet => <button key={diet} type="button" data-diet={diet} disabled={round.wrongDiet.includes(diet)}
          className={`dn-diet-button${diet === dino.diet && glow ? ' glow' : ''}`} aria-label={diet === 'plant' ? 'পাতা খেত' : 'মাংস খেত'}
          onClick={event => { const node = event.currentTarget; node.blur(); sort(diet, node); }}>
          <span className="dn-icon">{diet === 'plant' ? <Leaf /> : <Meat />}</span>
          <b>{diet === 'plant' ? 'পাতা খেত' : 'মাংস খেত'}</b>
        </button>)}
      </div>}
      {round.phase === 'facts' && <FactCard dino={dino} scene={false} action={
        <button type="button" className="dn-go" aria-label={isLastDino(round) ? 'শেষ দেখো' : 'পরের ডাইনোসর'} onClick={event => { event.currentTarget.blur(); go(); }}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 9v30l24-15z" /></svg>
        </button>} />}

      <p className={`dn-say${said.hint ? ' hint' : ''}`} role="status" aria-live="polite">{said.title && <b>{said.title}</b>}{said.text || ' '}</p>
    </>}

    {screen === 'end' && result && <EndScreen result={result} slow={slow} onAgain={() => begin(round.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    {bookOpen && <Book found={book} onClose={closeBook} />}
    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `dinosaur-level-${placeOf(result.level)}.png`, make: async () => { const { cardBlob } = await import('../lib/card'); return cardBlob(result, book.length, location.host); } }}>
      <RoundCard result={result} bookCount={book.length} />
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
