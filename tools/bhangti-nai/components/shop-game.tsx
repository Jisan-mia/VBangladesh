'use client';
// IP: what we avoided — no real taka note or coin art (no portraits, monuments, state emblems or note colours copied), no real shop, brand or product names, no cash-register game's look; plain coloured chits with Bangla numerals, made-up prices, our own shop and neighbours.

import { useEffect, useRef, useState } from 'react';
import { possessive } from '../../../shared/bangla';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { cleanName, confetti, hiss, MAX_NAME, newSeed, sfx, shake, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode } from '../../../shared/game-kit';
import { LevelGrid, SoundToggle, StarReveal } from '../../../shared/game-ui';
import { FormatToggle, ShareBar, useInView } from '../../../shared/share-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import {
  CHITS, CUSTOMERS, DAYS, EXAMPLE, EXAMPLE_TRAY, LATE_LINE, MAX_TRAY, PEOPLE, RIGHT_LINES,
  bestLine, bn, changeOf, chitsText, current, dayStars, fewest, give, humanLine, isOver, nearLine, rightCount, saying, secondsFor, startRun, takeBack, tap, timeUp, trayTotal, undo, wrongLine,
  type Chit, type Customer, type Run,
} from '../lib/game';
import { banner, caption, compareLine, dayTag, outOf, parseShared, sharedHash, type Shared } from '../lib/link';
import { Chit as ChitArt, Person, Shelf, type Mood } from './art';

const TOOL = 'bhangti-nai';
const RELAXED = 'bhangti-nai-relaxed';
type Phase = 'ready' | 'playing' | 'paused' | 'over';
type Reaction = { kind: 'right' | 'wrong' | 'late' | 'nudge'; text: string; points?: number; bonus?: number; customer?: Customer; index?: number; tray?: Chit[] };
type Result = { seed: number; score: number; right: number; record: boolean; day: number; clean: number; stars: number };

/** Cash-box order: big notes first, the way change is counted out. */
const BOX: Chit[] = [100, 50, 20, 10, 5, 2, 1];

const readRelaxed = () => { try { return localStorage.getItem(RELAXED) === '1'; } catch { return false; } };
const saveRelaxed = (on: boolean) => { try { localStorage.setItem(RELAXED, on ? '1' : '0'); } catch { /* private mode: fine */ } };

/** Coins clink, notes rustle: the sound says which kind of chit went down. */
function chitSound(value: number, soft = false) {
  const volume = soft ? 0.5 : 1;
  if (value <= 5) { tone(2637, 0.08, 0.06 * volume, 'sine'); tone(3520, 0.11, 0.04 * volume, 'sine', 0.025); }
  else { hiss(0.08, 0.1 * volume, 3200, 'highpass'); hiss(0.07, 0.06 * volume, 1800, 'bandpass', 0.05); }
}
/** The signature sound: the cash drawer slides out and its bell rings, ক্যাচিং. */
const till = () => { hiss(0.12, 0.12, 900, 'lowpass'); tone(1760, 0.3, 0.08, 'triangle', 0.06); tone(2637, 0.4, 0.05, 'sine', 0.08); };

export function ShopGame() {
  const [phase, setPhaseState] = useState<Phase>('ready');
  const [run, setRun] = useState<Run>(() => startRun(1));
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [relaxed, setRelaxedState] = useState(false);
  const [day, setDay] = useState(1);
  // Each shop day keeps its own best; the classic queue from an old link keeps the key it always had.
  const [best, submitBest] = useBest(day ? `${TOOL}-day-${day}` : TOOL);
  const levels = useLevels(TOOL, DAYS);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [restartReady, setRestartReady] = useState(true);
  const [wrongs, setWrongs] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [live] = useState(() => ({ elapsed: 0, limit: 10, lock: false, shown: -1, seed: 1, day: 1, streak: 0, tick: Infinity }));
  const phaseRef = useRef<Phase>('ready');
  const runRef = useRef(run);
  runRef.current = run;
  const bestRef = useRef(best);
  bestRef.current = best;
  const advance = useRef(0);
  const bar = useRef<HTMLElement>(null);
  const shop = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const trayBox = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const shopInView = useInView(shop);

  const dayOf = (r: Result) => r.day ? { day: r.day, clean: r.clean } : {};
  const card = result ? { score: result.score, right: result.right, name: cleanName(name), ...dayOf(result) } : null;
  const state = result ? sharedHash({ seed: result.seed, score: result.score, right: result.right, name, ...dayOf(result) }) : '';
  const allStars = totalStars(levels.stars);

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }
  const calm = () => slow || matchMedia('(prefers-reduced-motion: reduce)').matches;

  function meet(customer: Customer | undefined) {
    live.elapsed = 0;
    live.shown = -1;
    live.tick = Infinity;
    live.limit = customer ? secondsFor(customer, slow, live.day) : 10;
    live.lock = false;
  }

  function clearTimers() { window.clearTimeout(advance.current); timers.current.forEach(clearTimeout); timers.current = []; }

  function startGame(seed: number, nextDay = live.day) {
    clearTimers();
    const fresh = startRun(seed, nextDay);
    live.seed = seed;
    live.day = nextDay;
    live.streak = 0;
    setDay(nextDay);
    meet(fresh.customers[0]);
    setRun(fresh);
    setReaction(null);
    setResult(null);
    go('playing');
    // On a short laptop screen the cash box can sit below the fold; bring the counter into view once.
    const box = shop.current?.parentElement;
    if (box && box.getBoundingClientRect().bottom > window.innerHeight) box.scrollIntoView({ block: 'end', behavior: calm() ? 'auto' : 'smooth' });
  }

  function finish() {
    const done = runRef.current, right = rightCount(done.results), hadBest = bestRef.current !== null;
    const stars = dayStars(done.clean), record = submitBest(done.score) && hadBest;
    if (done.day && stars) levels.record(done.day, stars);
    go('over');
    setResult({ seed: live.seed, score: done.score, right, record, day: done.day, clean: done.clean, stars });
    // The stars chime in one by one (StarReveal); the fanfare waits for them, confetti only for 3 stars or a new best.
    const after = ((done.day ? stars : 0) + 1) * 260;
    if (stars === 3 || record) timers.current.push(window.setTimeout(() => { sfx.levelUp(); confetti(); }, after));
    else if (stars) timers.current.push(window.setTimeout(sfx.good, after));
    else sfx.lose();
    // A thumb still on "দাও" must not skip the result with the same tap.
    setRestartReady(false);
    window.setTimeout(() => setRestartReady(true), 700);
  }

  /** After a right answer or a missed one, the customer lingers a moment, then the next one steps up. */
  function later(ms: number) {
    window.clearTimeout(advance.current);
    advance.current = window.setTimeout(() => {
      setReaction(null);
      if (isOver(runRef.current)) finish();
      else meet(current(runRef.current));
    }, slow ? ms * 1.4 : ms);
  }

  function pick(chit: Chit) {
    if (phaseRef.current !== 'playing' || live.lock) return;
    const next = tap(run, chit);
    if (next === run) {
      if (run.tray.length >= MAX_TRAY) setReaction({ kind: 'nudge', text: 'এত চিরকুট লাগবে না! কিছু ফিরিয়ে নাও।' });
      return;
    }
    setRun(next);
    if (reaction?.kind === 'nudge') setReaction(null);
    chitSound(chit);
  }

  function putBack(chit: Chit) {
    if (phaseRef.current !== 'playing' || live.lock) return;
    setRun(takeBack(run, chit));
    chitSound(chit, true);
  }

  function takeLast() {
    if (phaseRef.current !== 'playing' || live.lock || !run.tray.length) return;
    setRun(undo(run));
    chitSound(run.tray[run.tray.length - 1], true);
  }

  function hand() {
    if (phaseRef.current !== 'playing' || live.lock) return;
    if (!run.tray.length) { sfx.tap(); setReaction({ kind: 'nudge', text: 'আগে নিচের চিরকুট চেপে ভাংতি সাজাও।' }); return; }
    const customer = current(run)!;
    const left = relaxed ? null : Math.max(0, 1 - live.elapsed / live.limit);
    const handed = give(run, left);
    if (handed.diff !== 0) {
      setRun(handed.run);
      setReaction({ kind: 'wrong', text: wrongLine(handed.diff, handed.run.tries) });
      setWrongs(count => count + 1);
      live.streak = 0;
      sfx.wrong();
      shake(trayBox.current);
      return;
    }
    live.lock = true;
    till();
    // Right on the first try, again and again: each one in a row rings a step higher.
    live.streak = run.tries === 0 ? live.streak + 1 : 0;
    const step = live.streak - 2;
    if (step >= 0) timers.current.push(window.setTimeout(() => sfx.combo(step), 200));
    setRun(handed.run);
    setReaction({ kind: 'right', text: handed.bonus >= 40 ? 'বাহ, ঝটপট!' : RIGHT_LINES[run.index % 3], points: handed.points, bonus: handed.bonus, customer, index: run.index, tray: run.tray });
    later(850);
  }

  function lateNow() {
    if (live.lock) return;
    live.lock = true;
    const now = runRef.current, customer = current(now);
    if (!customer) return;
    setRun(timeUp(now));
    live.streak = 0;
    sfx.drop();
    setReaction({ kind: 'late', text: LATE_LINE, customer, index: now.index, tray: now.tray });
    later(2000);
  }

  function pause() { if (phaseRef.current === 'playing') go('paused'); }
  function resume() { if (phaseRef.current === 'paused') go('playing'); }
  /** The friend's ten customers while on the friend's day; a fresh queue otherwise. */
  const seedFor = (forDay: number) => friend && (friend.day ?? 0) === forDay ? friend.seed : newSeed();
  function restart() { if (phaseRef.current === 'over' && restartReady) startGame(seedFor(live.day)); }

  /** "পরের দিন" starts straight away; a day picked from the list waits on the ready screen. */
  function nextDay() { if (phaseRef.current === 'over' && restartReady) startGame(newSeed(), live.day + 1); }
  function pickDay(nextDay: number) {
    clearTimers();
    live.day = nextDay;
    live.seed = seedFor(nextDay);
    setDay(nextDay);
    setResult(null);
    setReaction(null);
    go('ready');
    shop.current?.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
  }

  function setRelaxed(on: boolean) { setRelaxedState(on); saveRelaxed(on); }

  // The clock: a fixed-step loop that stops when the tab hides. The bar is written straight to the DOM, never through React.
  useGameLoop(dt => {
    if (live.lock) return;
    live.elapsed += dt;
    // The last three seconds tick, once each.
    const left = Math.ceil(live.limit - live.elapsed);
    if (left <= 3 && left < live.tick) { live.tick = left; if (left > 0) sfx.tick(); }
    if (live.elapsed >= live.limit) lateNow();
  }, () => {
    const element = bar.current;
    if (!element) return;
    const left = Math.max(0, 1 - live.elapsed / live.limit), shown = Math.round(left * 300);
    if (shown === live.shown) return;
    live.shown = shown;
    element.style.transform = `scaleX(${shown / 300})`;
    element.dataset.low = String(left < 0.3);
  }, phase === 'playing' && !relaxed);

  useEffect(() => {
    setSite(window.location.host);
    setRelaxedState(readRelaxed());
    // In-page jumps don't touch a challenge, so only a real link counts.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return;
      clearTimers();
      setFriend(shared);
      setResult(null);
      setReaction(null);
      live.seed = shared.seed;
      live.day = shared.day ?? 0;
      setDay(live.day);
      go('ready');
    };
    if (!parseShared(window.location.hash)) live.seed = newSeed();
    readFriend();
    const hide = () => { if (document.hidden) pause(); };
    window.addEventListener('hashchange', readFriend);
    document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('hashchange', readFriend); document.removeEventListener('visibilitychange', hide); clearTimers(); };
  }, []);

  // Open on the furthest day this phone has reached (a friend's link chooses its own day).
  useEffect(() => {
    if (!levels.loaded || parseShared(window.location.hash) || phaseRef.current !== 'ready') return;
    live.day = levels.unlocked;
    setDay(levels.unlocked);
    // Only once storage has been read; later clears move on through "পরের দিন".
  }, [levels.loaded]);

  // Scrolling the counter away mid-game pauses it, so no clock runs off-screen.
  useEffect(() => { if (!shopInView) pause(); }, [shopInView]);

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.('input, textarea, select, [contenteditable]')) return;
    const now = phaseRef.current, key = event.key;
    const slot = '১২৩৪৫৬৭'.indexOf(key) >= 0 ? '১২৩৪৫৬৭'.indexOf(key) : '1234567'.indexOf(key);
    if (slot >= 0 && key.length === 1) { if (now === 'playing') { event.preventDefault(); pick(CHITS[slot]); } return; }
    if (key === 'Backspace') { if (now === 'playing') { event.preventDefault(); takeLast(); } return; }
    if (key === 'Escape' || key === 'p' || key === 'P') { if (now === 'playing') pause(); else resume(); return; }
    if (key !== 'Enter' && key !== ' ') return;
    if (target?.closest?.('button, a, summary')) return;
    event.preventDefault();
    if (now === 'ready') startGame(live.seed);
    else if (now === 'playing') hand();
    else if (now === 'paused') resume();
    else if (hasNext) nextDay();
    else restart();
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts('ভাংতি নাই! ১০ জনের ৯ জনকে ১২৪০').then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, 'feed', site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function seeCard() {
    resultBox.current?.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
  }
  function playFromCard() {
    startGame(seedFor(live.day));
    shop.current?.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
  }

  const ready = phase === 'ready', over = phase === 'over' && result;
  const shown = ready ? EXAMPLE : reaction?.customer ?? current(run) ?? EXAMPLE;
  const shownIndex = ready ? -1 : reaction?.index ?? run.index;
  const tray = ready ? EXAMPLE_TRAY : reaction?.tray ?? run.tray;
  const mood: Mood = ready || reaction?.kind === 'right' ? 'happy' : reaction?.kind === 'wrong' ? 'puzzled' : 'normal';
  const given = trayTotal(tray);
  const groups = BOX.map(value => [value, tray.filter(chit => chit === value).length] as const).filter(([, count]) => count > 0);
  const locked = phase !== 'playing' || Boolean(reaction && (reaction.kind === 'right' || reaction.kind === 'late'));
  const rival = friend ? possessive(friend.name || 'বন্ধু') : '';
  const right = rightCount(run.results);
  const answer = reaction?.kind === 'late' && reaction.customer ? fewest(changeOf(reaction.customer), reaction.customer.out) : null;
  const hasNext = Boolean(result && result.day && result.stars > 0 && result.day < DAYS);
  const near = result && result.day ? nearLine(result.clean) : '';
  const versus = result && friend && friend.seed === result.seed && (friend.day ?? 0) === result.day ? compareLine(result.score, friend.score, friend.name) : '';
  const perCustomer = secondsFor(EXAMPLE, slow, day);

  return (
    <div className="bt" data-slow={slow}>
      {friend && (
        <section className="bt-friend" aria-labelledby="bt-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${rival} কার্ড: ${bn(friend.score)} পয়েন্ট, ${outOf(friend.right)} ঠিক ভাংতি`} />
          <div>
            <h2 id="bt-friend-title">{banner(friend)}</h2>
            <p>{rival} নিজের ফোনের স্কোর · {outOf(friend.right)} ঠিক ভাংতি</p>
          </div>
        </section>
      )}

      <p className="bt-level">
        <span><b>{day ? `দিন ${bn(day)}` : 'বন্ধুর দোকান'}</b> · {relaxed ? 'ঘড়ি ছাড়া' : `খদ্দেরপ্রতি ${bn(Math.round(perCustomer))} সেকেন্ড`}</span>
        <span aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(DAYS * 3)}</span>
      </p>

      <div className="bt-hud">
        {ready ? <p className="bt-howto">খদ্দেরের টাকা থেকে দাম বাদ দাও, <b>বাকিটা ফেরত দাও</b>।</p> : <>
          <p className="bt-count"><span>খদ্দের</span><b>{bn(phase === 'over' ? CUSTOMERS : shownIndex + 1)}/{bn(CUSTOMERS)}</b></p>
          <ol className="bt-dots" aria-label={`${bn(run.results.length)} জন গেছে, ${bn(right)} জন ঠিক ভাংতি পেয়েছে`}>
            {Array.from({ length: CUSTOMERS }, (_, index) => <li key={index} data-mark={run.results[index] ?? (index === shownIndex && phase !== 'over' ? 'now' : 'todo')} />)}
          </ol>
          <p className="bt-score"><span>পয়েন্ট</span><b>{bn(run.score)}</b></p>
          <button type="button" className="bt-pause" onClick={phase === 'paused' ? resume : pause} disabled={phase !== 'playing' && phase !== 'paused'} aria-label={phase === 'paused' ? 'চালিয়ে যাও' : 'একটু থামাও'}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{phase === 'paused' ? <path d="M8 5v14l11-7z" className="bt-fill" /> : <path d="M9 5v14M15 5v14" />}</svg>
          </button>
        </>}
      </div>

      <div className="bt-counter-block">
        <div className="bt-shop" ref={shop} data-phase={phase}>
          <Shelf />
          <span className="bt-timer" data-off={relaxed || phase !== 'playing' || locked} aria-hidden="true"><i ref={bar} /></span>
          {shown.out !== 0 && !over && <p className="bt-sold">{bn(shown.out)} টাকার ভাংতি নাই!</p>}
          {ready && <p className="bt-ribbon">উদাহরণ</p>}
          <div className="bt-guest" key={shownIndex}>
            <Person who={shown.who} mood={mood} />
            <div className="bt-talk">
              <p className="bt-bubble" aria-live="polite">
                <span className="bt-sr">{PEOPLE[shown.who]} বলছে: </span>
                {saying(shown).map((line, row) => <span key={row} className="bt-line">{line.map((part, at) => typeof part === 'number' ? <b key={at}>{bn(part)}</b> : part)}</span>)}
              </p>
              {reaction && reaction.kind !== 'nudge' && (
                <p className="bt-reply" data-kind={reaction.kind} key={`${wrongs}-${reaction.kind}`} role="status">
                  {reaction.text}
                  {reaction.kind === 'right' && <span className="bt-points">+{bn(reaction.points!)}{reaction.bonus ? <small> ঝটপট +{bn(reaction.bonus)} সহ</small> : null}</span>}
                </p>
              )}
            </div>
          </div>
          <div className="bt-paid" aria-label={`খদ্দের দিয়েছে ${bn(shown.notes.reduce((a, b) => a + b, 0))} টাকা`}>
            {shown.notes.map((note, index) => <ChitArt key={index} value={note} small />)}
          </div>
        </div>

        <div className="bt-tray" ref={trayBox} data-kind={reaction?.kind ?? ''}>
          {answer ? <p className="bt-answer">ঠিক ভাংতি ছিল <b>{bn(changeOf(reaction!.customer!))}</b> টাকা <span className="bt-sr">: {chitsText(answer)}</span><span className="bt-answer-chits" aria-hidden="true">{answer.map((chit, index) => <ChitArt key={index} value={chit} small />)}</span></p>
            : over ? <p className="bt-answer">আজকের মতো ক্যাশবাক্স বন্ধ।</p>
            : <>
              <div className="bt-given" role="group" aria-label="খদ্দেরকে যা ফেরত দিচ্ছ, চাপলে একটা ফেরত আসবে">
                {groups.length ? groups.map(([value, count]) => (
                  <button type="button" key={value} className="bt-taken" onClick={() => putBack(value)} disabled={locked} aria-label={`${bn(value)} টাকার একটা ফিরিয়ে নাও${count > 1 ? `, আছে ${bn(count)}টা` : ''}`}>
                    <ChitArt value={value} small />{count > 1 && <i>×{bn(count)}</i>}
                  </button>
                )) : <span className="bt-empty">{reaction?.kind === 'nudge' ? reaction.text : 'নিচ থেকে চিরকুট চাপো'}</span>}
              </div>
              {ready && <p className="bt-total"><span>{bn(50)} − {bn(35)} =</span><b>{bn(15)} ✓</b></p>}
            </>}
        </div>
        {phase === 'paused' && (
          <div className="bt-overlay">
            <div className="bt-note">
              <p>থেমে আছে। খদ্দের দাঁড়িয়ে আছে, তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
        {over && (
          <div className="bt-overlay">
            <div className="bt-note bt-slip" role="status">
              <h2>{result.day ? `দিন ${bn(result.day)} শেষ, দোকান বন্ধ!` : 'দোকান বন্ধ!'}</h2>
              {result.day > 0 && result.stars > 0 && <StarReveal count={result.stars} />}
              <p className="bt-tally">{outOf(result.right)} ঠিক ভাংতি{result.day > 0 && <small>একবারে ঠিক {bn(result.clean)} জন</small>}</p>
              <p className="bt-final"><b>{bn(result.score)}</b> পয়েন্ট</p>
              {near && <p className="bt-near">{near}</p>}
              <p className="bt-record">{versus || (result.record ? 'এই ফোনে নতুন রেকর্ড!' : best !== null && best > result.score ? bestLine(result.score, best, result.day) : humanLine(result.right, result.score))}</p>
              <button type="button" className="kit-link bt-see" onClick={seeCard}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
            </div>
          </div>
        )}
      </div>

      <div className="bt-box" data-off={phase === 'over' || phase === 'paused'} role="group" aria-label="ক্যাশবাক্স: চিরকুট চাপলে খদ্দেরের দিকে যাবে">
        {BOX.map(value => {
          const gone = !ready && !over && shown.out === value;
          return <button type="button" key={value} className="bt-slot" onClick={() => ready ? startGame(live.seed) : pick(value)} disabled={(locked && !ready) || gone} data-gone={gone}
            aria-label={gone ? `${bn(value)} টাকার চিরকুট শেষ` : `${bn(value)} টাকা দাও`}>
            <ChitArt value={value} />{gone && <em aria-hidden="true">শেষ</em>}
          </button>;
        })}
        <button type="button" className="bt-slot bt-undo" onClick={takeLast} disabled={locked || !run.tray.length} aria-label="শেষ চিরকুটটা ফিরিয়ে নাও">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফেরাও
        </button>
      </div>

      <div className="bt-actions">
        {ready ? <button type="button" className="kit-primary bt-go" onClick={() => startGame(live.seed)}>শুরু করো</button>
          : phase === 'over' ? <>
            {hasNext && <button type="button" className="kit-primary bt-go" onClick={nextDay} disabled={!restartReady}>পরের দিন</button>}
            <button type="button" className={hasNext ? 'kit-secondary bt-go' : 'kit-primary bt-go'} onClick={restart} disabled={!restartReady}>{hasNext ? 'আবার খেলো' : 'আরেকবার'}</button>
          </>
          : <button type="button" className="kit-primary bt-go" onClick={hand}>দাও{run.tray.length > 0 && <small aria-live="polite">{bn(given)} টাকা</small>}</button>}
      </div>

      <div className="bt-toggles">
        <SoundToggle compact />
        <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <button type="button" aria-pressed={relaxed} onClick={() => setRelaxed(!relaxed)}>সময় নিয়ে <small>(ঘড়ি ছাড়া)</small></button>
        <p className="bt-keys">কিবোর্ডে: ১–৭ চিরকুট, Backspace ফেরাও, Enter দাও</p>
      </div>

      <details className="bt-days">
        <summary>সব দিন <span>★ {bn(allStars)}/{bn(DAYS * 3)}</span></summary>
        <p>দোকানের বিশ দিন। প্রতিদিন দাম একটু ঘোরানো, ঘড়ি একটু তাড়াতাড়ি। দশজনের ছয়জনকে একবারে ঠিক ভাংতি দিলে দিন পার, আটজনে ২ তারা, দশে দশ হলে ৩ তারা। খোলা দিন খোলাই থাকে।</p>
        <LevelGrid count={DAYS} stars={levels.stars} unlocked={Math.max(levels.unlocked, friend?.day ?? 1)} current={day || undefined} onPick={pickDay} noun="দিন" />
      </details>

      {card && result && (
        <section className="bt-result" id="result" ref={resultBox} aria-labelledby="bt-result-title">
          <h2 id="bt-result-title"><em>{outOf(result.right)}</em> ঠিক ভাংতি দিয়েছ</h2>
          <p>{versus || humanLine(result.right, result.score)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bt-card-summary" />
            <figcaption id="bt-card-summary" className="bt-sr">ভাংতি নাই! কার্ড: {card.name && `${card.name}, `}{dayTag(card.day)}{outOf(card.right)} ঠিক ভাংতি, {bn(card.score)} পয়েন্ট। {humanLine(card.right, card.score)}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <label className="bt-name">
            <span>তোমার নাম <small>কার্ডে আর লিংকে যাবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="bhangti-nai.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই দশজন খদ্দেরই পাবে, একই দাম, একই নোট।" />
          <button type="button" className="kit-link bt-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
        </section>
      )}
    </div>
  );
}
