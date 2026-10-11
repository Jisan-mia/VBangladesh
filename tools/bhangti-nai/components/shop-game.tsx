'use client';
// IP: what we avoided — no real taka note or coin art (no portraits, monuments, state emblems or note colours copied), no real shop, brand or product names, no cash-register game's look; plain coloured chits with Bangla numerals, made-up prices, our own shop and neighbours.

import { useEffect, useRef, useState } from 'react';
import { possessive } from '../../../shared/bangla';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { cleanName, MAX_NAME, newSeed, useBest, useGameLoop, useSlowMode } from '../../../shared/game-kit';
import { FormatToggle, ShareBar, useInView } from '../../../shared/share-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import {
  CHITS, CUSTOMERS, EXAMPLE, EXAMPLE_TRAY, LATE_LINE, MAX_TRAY, PEOPLE, RIGHT_LINES,
  bn, changeOf, chitsText, current, fewest, give, humanLine, isOver, rightCount, saying, secondsFor, startRun, takeBack, tap, timeUp, trayTotal, undo, wrongLine,
  type Chit, type Customer, type Run,
} from '../lib/game';
import { banner, caption, compareLine, outOf, parseShared, sharedHash, type Shared } from '../lib/link';
import { Chit as ChitArt, Person, Shelf, type Mood } from './art';

const TOOL = 'bhangti-nai';
const RELAXED = 'bhangti-nai-relaxed';
type Phase = 'ready' | 'playing' | 'paused' | 'over';
type Reaction = { kind: 'right' | 'wrong' | 'late' | 'nudge'; text: string; points?: number; bonus?: number; customer?: Customer; index?: number; tray?: Chit[] };
type Result = { seed: number; score: number; right: number; record: boolean };

/** Cash-box order: big notes first, the way change is counted out. */
const BOX: Chit[] = [100, 50, 20, 10, 5, 2, 1];

const readRelaxed = () => { try { return localStorage.getItem(RELAXED) === '1'; } catch { return false; } };
const saveRelaxed = (on: boolean) => { try { localStorage.setItem(RELAXED, on ? '1' : '0'); } catch { /* private mode: fine */ } };

export function ShopGame() {
  const [phase, setPhaseState] = useState<Phase>('ready');
  const [run, setRun] = useState<Run>(() => startRun(1));
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [relaxed, setRelaxedState] = useState(false);
  const [best, submitBest] = useBest(TOOL);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [restartReady, setRestartReady] = useState(true);
  const [shake, setShake] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [live] = useState(() => ({ elapsed: 0, limit: 10, lock: false, shown: -1, seed: 1 }));
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
  const shopInView = useInView(shop);

  const card = result ? { score: result.score, right: result.right, name: cleanName(name) } : null;
  const state = result ? sharedHash({ seed: result.seed, score: result.score, right: result.right, name }) : '';

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }
  const calm = () => slow || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buzz = () => { if (!slow && typeof navigator.vibrate === 'function') navigator.vibrate(8); };

  function meet(customer: Customer | undefined) {
    live.elapsed = 0;
    live.shown = -1;
    live.limit = customer ? secondsFor(customer, slow) : 10;
    live.lock = false;
  }

  function startGame(seed: number) {
    window.clearTimeout(advance.current);
    const fresh = startRun(seed);
    live.seed = seed;
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
    go('over');
    setResult({ seed: live.seed, score: done.score, right, record: submitBest(done.score) && hadBest });
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
    buzz();
  }

  function putBack(chit: Chit) {
    if (phaseRef.current === 'playing' && !live.lock) setRun(takeBack(run, chit));
  }

  function takeLast() {
    if (phaseRef.current === 'playing' && !live.lock) setRun(undo(run));
  }

  function hand() {
    if (phaseRef.current !== 'playing' || live.lock) return;
    if (!run.tray.length) { setReaction({ kind: 'nudge', text: 'আগে নিচের চিরকুট চেপে ভাংতি সাজাও।' }); return; }
    const customer = current(run)!;
    const left = relaxed ? null : Math.max(0, 1 - live.elapsed / live.limit);
    const handed = give(run, left);
    if (handed.diff !== 0) {
      setRun(handed.run);
      setReaction({ kind: 'wrong', text: wrongLine(handed.diff, handed.run.tries) });
      setShake(count => count + 1);
      return;
    }
    live.lock = true;
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
    setReaction({ kind: 'late', text: LATE_LINE, customer, index: now.index, tray: now.tray });
    later(2000);
  }

  function pause() { if (phaseRef.current === 'playing') go('paused'); }
  function resume() { if (phaseRef.current === 'paused') go('playing'); }
  function restart() { if (phaseRef.current === 'over' && restartReady) startGame(friend ? friend.seed : newSeed()); }

  function setRelaxed(on: boolean) { setRelaxedState(on); saveRelaxed(on); }

  // The clock: a fixed-step loop that stops when the tab hides. The bar is written straight to the DOM, never through React.
  useGameLoop(dt => {
    if (live.lock) return;
    live.elapsed += dt;
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
      window.clearTimeout(advance.current);
      setFriend(shared);
      setResult(null);
      setReaction(null);
      live.seed = shared.seed;
      go('ready');
    };
    if (!parseShared(window.location.hash)) live.seed = newSeed();
    readFriend();
    const hide = () => { if (document.hidden) pause(); };
    window.addEventListener('hashchange', readFriend);
    document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('hashchange', readFriend); document.removeEventListener('visibilitychange', hide); window.clearTimeout(advance.current); };
  }, []);

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
    startGame(friend ? friend.seed : newSeed());
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
                <p className="bt-reply" data-kind={reaction.kind} key={`${shake}-${reaction.kind}`} role="status">
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

        <div className="bt-tray" data-shake={shake % 2 === 1} data-kind={reaction?.kind ?? ''}>
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
              <h2>দোকান বন্ধ!</h2>
              <p className="bt-tally">{outOf(result.right)} ঠিক ভাংতি</p>
              <p className="bt-final"><b>{bn(result.score)}</b> পয়েন্ট</p>
              <p className="bt-record">{friend ? compareLine(result.score, friend.score, friend.name) : result.record ? 'এই ফোনে নতুন রেকর্ড!' : best !== null && best > result.score ? `এই ফোনে সেরা ${bn(best)}` : humanLine(result.right, result.score)}</p>
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
          : phase === 'over' ? <button type="button" className="kit-primary bt-go" onClick={restart} disabled={!restartReady}>আরেকবার</button>
          : <button type="button" className="kit-primary bt-go" onClick={hand}>দাও{run.tray.length > 0 && <small aria-live="polite">{bn(given)} টাকা</small>}</button>}
      </div>

      <div className="bt-toggles">
        <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <button type="button" aria-pressed={relaxed} onClick={() => setRelaxed(!relaxed)}>সময় নিয়ে <small>(ঘড়ি ছাড়া)</small></button>
        <p className="bt-keys">কিবোর্ডে: ১–৭ চিরকুট, Backspace ফেরাও, Enter দাও</p>
      </div>

      {card && result && (
        <section className="bt-result" id="result" ref={resultBox} aria-labelledby="bt-result-title">
          <h2 id="bt-result-title"><em>{outOf(result.right)}</em> ঠিক ভাংতি দিয়েছ</h2>
          <p>{friend ? compareLine(result.score, friend.score, friend.name) : humanLine(result.right, result.score)}</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bt-card-summary" />
            <figcaption id="bt-card-summary" className="bt-sr">ভাংতি নাই! কার্ড: {card.name && `${card.name}, `}{outOf(card.right)} ঠিক ভাংতি, {bn(card.score)} পয়েন্ট। {humanLine(card.right, card.score)}</figcaption>
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
