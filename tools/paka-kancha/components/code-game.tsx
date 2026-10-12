'use client';
// IP: what we avoided — no "Mastermind" name, pegs or peg board; no green-yellow-grey letter grid or emoji-square post text from the word-guessing craze; not শব্দ সাজাই's newsprint squares. Mangoes, pad and card are drawn fresh.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { MAX_NAME, buzz, confetti, hiss, newSeed, sfx, shake, tone, totalStars, useBest, useLevels, useSlowMode } from '../../../shared/game-kit';
import { LevelGrid, SoundToggle, StarReveal } from '../../../shared/game-ui';
import { FormatToggle, ShareBar } from '../../../shared/share-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import {
  LENGTH, LEVELS, LEVEL_COUNT, RULE, WORLD_SIZE, asciiDigits, bn, bnDigits, codeFromSeed, codeOf, dhakaDate, erase, humanLine, isCode, keyHints, markNames, migrateLevels, poolOf, rowsOf, rulesOf, samePuzzle, solved, starsOf, startLevel, submit, triesToNextStar, typeDigit, validGuesses, type Mark, type Play, type Puzzle,
} from '../lib/game';
import { BLUSH, BODY, HALF, HALF_SKIN, LEAF, RAW_SCALE, SEED, STEM, colors, markHint } from '../lib/mango';
import { caption, friendBanner, parseShare, puzzleLabel, shareHash, versusLine, type Shared } from '../lib/result';

const TOOL = 'paka-kancha';
const SAVED = 'paka-kancha-day';
const LEVELS_KEY = `ektukhani-levels-${TOOL}`, BEST_KEY = `ektukhani-best-${TOOL}`;
/** A mango falling on the উঠান: a full ধপ for পাকা, a softer one for আধপাকা, a dry leaf tick for কাঁচা. In step with the CSS pop (120 ms apart). */
function dropMangoes(marks: readonly Mark[]) {
  marks.forEach((mark, index) => {
    const at = 0.06 + index * 0.12;
    if (mark === 'p') { tone(150, 0.17, 0.22, 'sine', at, 52); hiss(0.06, 0.07, 450, 'lowpass', at); }
    else if (mark === 'a') tone(260, 0.11, 0.1, 'sine', at, 140);
    else tone(1500, 0.025, 0.03, 'triangle', at);
  });
  if (marks.includes('p')) window.setTimeout(() => buzz(12), 60);
}
/** What the next level changes, in a few words. */
function nextRule(level: number) {
  const now = LEVELS[level - 1], before = LEVELS[level - 2];
  if (now.digits > before.digits) return now.digits === 10 ? 'প্যাডে ০ যোগ হলো, পুরো ১০টা অঙ্ক।' : `প্যাডে আরেকটা অঙ্ক, ${bnDigits(String(now.digits))}।`;
  if (now.tries < before.tries) return `সুযোগ ${bn(now.tries)} বার।`;
  return `৩ তারার জন্য ${bn(now.three)} বার।`;
}
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const EXAMPLE: { guess: string; marks: Mark[] } = { guess: '5281', marks: ['p', 'a', 'k', 'k'] };
const PAD = ['1', '2', '3', '4', '5', 'erase', '6', '7', '8', '9', '0', 'check'] as const;

export function Mango({ mark }: { mark: Mark }) {
  return <svg className="pk-mango" viewBox="0 0 40 40" aria-hidden="true" focusable="false" strokeLinejoin="round" strokeLinecap="round">
    {mark === 'p' && <>
      <path d={BODY} fill={colors.ripe} stroke={colors.ripeEdge} strokeWidth="1.6" />
      <ellipse cx={BLUSH.cx} cy={BLUSH.cy} rx={BLUSH.rx} ry={BLUSH.ry} transform={`rotate(${BLUSH.angle * 57.3} ${BLUSH.cx} ${BLUSH.cy})`} fill={colors.blush} opacity=".5" />
      <path d={STEM} stroke={colors.stem} strokeWidth="2" fill="none" />
      <path d={LEAF} fill={colors.leaf} />
    </>}
    {mark === 'a' && <>
      <path d={HALF} fill={colors.flesh} />
      <path d={SEED} fill={colors.seed} />
      <path d={HALF_SKIN} fill="none" stroke={colors.skin} strokeWidth="3.2" />
      <path d="M13 5V37" stroke={colors.fleshEdge} strokeWidth="1.6" />
    </>}
    {mark === 'k' && <path d={BODY} transform={`translate(${20 * (1 - RAW_SCALE)} ${21 * (1 - RAW_SCALE)}) scale(${RAW_SCALE})`} fill={colors.rawFill} stroke={colors.raw} strokeWidth="2.4" strokeDasharray="3.5 2.6" />}
  </svg>;
}

const rowWords = (guess: string, marks: readonly Mark[]) => [...guess].map((digit, index) => `${bnDigits(digit)} ${markNames[marks[index]]}`).join(', ');

function Row({ guess, marks, number, fresh, win }: { guess: string; marks: readonly Mark[]; number?: number; fresh?: boolean; win?: boolean }) {
  return <li className="pk-row" data-fresh={fresh} data-win={win} aria-label={`${number ? `${bn(number)} নম্বর চেষ্টা` : 'উদাহরণ'}: ${rowWords(guess, marks)}`}>
    <span className="pk-n" aria-hidden="true">{number ? bn(number) : ''}</span>
    {[...guess].map((digit, index) => (
      <span key={index} className="pk-cell" data-mark={marks[index]} style={{ '--i': index } as CSSProperties} aria-hidden="true">
        <b>{bnDigits(digit)}</b><Mango mark={marks[index]} />
      </span>
    ))}
  </li>;
}

function restore(puzzle: Puzzle, today: string): string[] {
  if (puzzle.kind !== 'day' || puzzle.date !== today) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED) ?? 'null') as { d?: string; g?: unknown } | null;
    const guesses = saved?.d === today && Array.isArray(saved.g) ? saved.g.filter(guess => typeof guess === 'string') : [];
    return validGuesses(codeOf(puzzle), guesses) ? guesses : [];
  } catch { return []; }
}

export function CodeGame() {
  const [today, setToday] = useState('');
  const [play, setPlay] = useState<Play>({ puzzle: { kind: 'day', date: '' }, guesses: [], input: '' });
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL, false);
  const [record, setRecord] = useState(false);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [making, setMaking] = useState(false);
  const [made, setMade] = useState('');
  const [nudge, setNudge] = useState('');
  const [previewError, setPreviewError] = useState(false);
  // Before the level store is read: a phone that already solved full codes skips the small-pad world (once).
  useEffect(() => {
    try {
      const moved = migrateLevels(localStorage.getItem(LEVELS_KEY), localStorage.getItem(BEST_KEY));
      if (moved) localStorage.setItem(LEVELS_KEY, moved);
    } catch { /* storage blocked: nothing to move */ }
  }, []);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [earned, setEarned] = useState(0);
  const opened = useRef(false);
  const timers = useRef<number[]>([]);
  const submittedAt = useRef(-1);
  const board = useRef<HTMLDivElement>(null);
  const typing = useRef<HTMLLIElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);

  const { puzzle, guesses, input } = play;
  const code = useMemo(() => codeOf(puzzle), [puzzle]);
  const rows = useMemo(() => rowsOf(code, guesses), [code, guesses]);
  const hints = useMemo(() => keyHints(code, guesses), [code, guesses]);
  const { digits, tries } = rulesOf(puzzle);
  const pool = poolOf(digits);
  const level = puzzle.kind === 'level' ? puzzle.level : 0;
  const total = totalStars(levels.stars);
  const won = solved(rows), over = won || rows.length >= tries;
  const mine: Shared = { puzzle, rows, name };
  const state = over ? shareHash(mine) : '';
  const rival = friend?.rows.length && samePuzzle(friend.puzzle, puzzle) ? friend : null;
  const versus = over && rival ? versusLine(rows, rival.rows, rival.name) : '';
  const isToday = Boolean(today) && puzzle.kind === 'day' && puzzle.date === today;
  // The banner only belongs to the friend's puzzle; after "আরেকবার" it steps aside.
  const banner = friend && today && samePuzzle(friend.puzzle, puzzle) ? friendBanner(friend, today) : null;
  const madeCode = asciiDigits(made);
  const invite: Shared = { puzzle: { kind: 'code', code: isCode(madeCode) ? madeCode : '0123' }, rows: [], name };

  // After the level store is read: a friend's link, else today's code for anyone who has played before, else লেভেল ১ (or where they left off).
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    const now = dhakaDate();
    const shared = parseShare(window.location.hash, now);
    const day: Puzzle = { kind: 'day', date: now };
    const dayGuesses = restore(day, now);
    const returning = Object.keys(levels.stars).length > 0 || stored(BEST_KEY) !== null || stored(SAVED) !== null;
    const dayOpen = dayGuesses.length < rulesOf(day).tries && dayGuesses.at(-1) !== codeOf(day);
    const start: Puzzle = shared?.puzzle ?? (returning && dayOpen ? day : { kind: 'level', level: startLevel(levels.stars, levels.unlocked), seed: newSeed() });
    setToday(now);
    setSite(window.location.host);
    setFriend(shared);
    setPlay({ puzzle: start, guesses: restore(start, now), input: '' });
  }, [levels.loaded]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Today's game stays on this phone, so a reload neither loses it nor hands out a second go.
  useEffect(() => {
    if (!isToday) return;
    try { localStorage.setItem(SAVED, JSON.stringify({ d: today, g: guesses })); } catch { /* private mode: fine */ }
  }, [isToday, today, guesses]);

  // Each new row of mangoes drops with its sound; the end of a game (played here, not restored) saves stars or the best and cheers.
  useEffect(() => {
    if (submittedAt.current !== guesses.length) return;
    submittedAt.current = -1;
    dropMangoes(rows[rows.length - 1]);
    if (!over) return;
    const later = (seconds: number, sound: () => void) => timers.current.push(window.setTimeout(sound, seconds * 1000));
    const settled = 0.62;
    if (!won) { setEarned(0); later(settled, sfx.lose); return; }
    if (level) {
      const stars = starsOf(level, rows);
      setEarned(stars);
      levels.record(level, stars);
      // StarReveal chimes each star; then a cheer that fits: confetti only for three stars or a finished world.
      const party = stars === 3 || ((level === WORLD_SIZE || level === LEVEL_COUNT) && !levels.stars[level]);
      later(settled + 0.32 * (stars + 1), party ? () => { sfx.levelUp(); confetti({ colors: ['#f5a011', '#e2522b', '#3d8a3c', '#ffd45e', '#f6c443'] }); } : sfx.good);
      return;
    }
    const beaten = submitBest(guesses.length) && best !== null;
    setRecord(beaten);
    later(settled, beaten ? () => { sfx.win(); confetti({ colors: ['#f5a011', '#e2522b', '#3d8a3c', '#ffd45e', '#f6c443'] }); } : sfx.good);
  }, [guesses.length]);

  useEffect(() => {
    if (!over && !friend?.rows.length) return;
    let cancelled = false;
    loadCardFonts('পাকা-কাঁচা আজকের কোড ৪/৭').then(() => {
      if (cancelled) return;
      if (over && preview.current) drawCard(preview.current, mine, today, format, site);
      if (friend?.rows.length && friendPreview.current) drawCard(friendPreview.current, friend, today, 'feed', site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` holds everything the card draws.
  }, [state, over, format, site, friend, today]);

  /** A gentle no: the line under the board says why, the row being typed shakes. */
  function refuse(line: string) {
    setNudge(line);
    sfx.wrong();
    shake(typing.current);
  }

  function press(key: string) {
    if (over) return;
    if (key === 'erase') { if (input) tone(700, 0.04, 0.05, 'triangle', 0, 500); setNudge(''); setPlay(erase); return; }
    if (key === 'check') {
      if (input.length < LENGTH) { refuse(`আরও ${bn(LENGTH - input.length)}টা অঙ্ক দাও।`); return; }
      submittedAt.current = guesses.length + 1;
      setNudge('');
      sfx.pick();
      setPlay(current => submit(code, current));
      return;
    }
    if (!pool.includes(key)) { refuse(`এই লেভেলে শুধু ১ থেকে ${bnDigits(String(digits))} পর্যন্ত অঙ্ক।`); return; }
    if (input.includes(key)) { refuse(`${bnDigits(key)} তো দিয়েছই। ${RULE}`); return; }
    if (input.length >= LENGTH) { refuse('চারটা হয়ে গেছে। এবার ‘দেখো’ চাপো।'); return; }
    sfx.tap();
    setNudge('');
    setPlay(current => typeDigit(code, current, key));
  }

  function start(next: Puzzle) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlay({ puzzle: next, guesses: restore(next, today), input: '' });
    setRecord(false);
    setEarned(0);
    setNudge('');
    if ((board.current?.getBoundingClientRect().top ?? 0) < 0) board.current?.scrollIntoView({ block: 'start' });
  }
  const playLevel = (next: number) => start({ kind: 'level', level: Math.max(1, Math.min(LEVEL_COUNT, next)), seed: newSeed() });

  // Digits (Bangla or English), Backspace and Enter work from anywhere except text fields; Enter on a button still presses that button.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest?.('input, textarea, select, [contenteditable]')) return;
      const digit = asciiDigits(event.key);
      if (/^\d$/.test(digit)) { event.preventDefault(); press(digit); }
      else if (event.key === 'Backspace') { event.preventDefault(); press('erase'); }
      else if (event.key === 'Enter' && !target.closest?.('button, a, summary')) { event.preventDefault(); press('check'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const last = rows.length - 1;
  // Only this level's keys; দেখো stretches to fill the last row of six.
  const keysShown = PAD.filter(key => key === 'erase' || key === 'check' || pool.includes(key));
  const checkSpan = 6 - ((keysShown.length - 1) % 6);
  // The near miss, in exact numbers: tries to the next star, tries to a new best, or how close the best row came.
  const closest = rows.reduce((top, row) => Math.max(top, row.filter(mark => mark === 'p').length), 0);
  const fewer = level && won ? triesToNextStar(level, rows) : 0;
  const near = !over ? ''
    : !won ? (closest ? `সবচেয়ে কাছে: এক চেষ্টায় ${bn(closest)}টা পাকা।` : '')
    : level ? (fewer ? `আর ${bn(fewer)} বার কম লাগলে ${bn(earned + 1)} তারা।` : '')
    : record ? 'নতুন রেকর্ড! এই ফোনে এত কম বারে আগে পারোনি।'
    : best === null ? ''
    : rows.length === best ? `সেরার সমান। আর ১ বার কম লাগলে নতুন রেকর্ড।`
    : `এই ফোনে সেরা ${bn(best)} বার। আর ${bn(rows.length - best + 1)} বার কম লাগলে নতুন রেকর্ড।`;
  const announce = over ? (won ? `${bn(rows.length)} বারে মিলেছে!` : `এবার হলো না। কোডটা ছিল ${bnDigits(code)}।`) : last >= 0 ? rowWords(guesses[last], rows[last]) : '';
  const linkHint = puzzle.kind === 'code' ? 'বন্ধুর কোডের লিংকে কোডটা লেখা থাকে, ওটা গোপন না।' : 'লিংকে শুধু আমগুলো যায়, কোনো অঙ্ক না।';

  return (
    <div className="pk" data-slow={slow}>
      {friend && banner && (
        <section className="pk-friend" aria-labelledby="pk-friend-title" data-invite={!friend.rows.length}>
          {friend.rows.length > 0 && <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || 'বন্ধুর'} ফলের ছবি, শুধু আম, কোনো অঙ্ক নেই`} />}
          <div>
            <h2 id="pk-friend-title">{banner.title}</h2>
            <p>{banner.sub}</p>
          </div>
        </section>
      )}

      <div className="pk-modes" role="group" aria-label="কোন খেলা">
        <button type="button" aria-pressed={isToday} onClick={() => { if (!isToday && today) { sfx.tap(); start({ kind: 'day', date: today }); } }}>আজকের কোড</button>
        <button type="button" aria-pressed={Boolean(level)} onClick={() => { if (!level) { sfx.tap(); playLevel(startLevel(levels.stars, levels.unlocked)); } }}>লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></button>
      </div>

      <div className="pk-top">
        <p><b>{level ? `লেভেল ${bn(level)}` : today ? puzzleLabel(puzzle, today) : 'আজকের কোড'}</b> · {over ? (won ? `${bn(rows.length)} বারে মিলেছে` : 'এবার হয়নি') : `আর ${bn(tries - rows.length)} বার`}</p>
        {level > 0 && <p className="pk-rule">{digits < 10 ? `১–${bnDigits(String(digits))} অঙ্কের কোড` : '০–৯ অঙ্কের কোড'} · ★★★ {bn(LEVELS[level - 1].three)} বারে</p>}
      </div>

      <div className="pk-board" ref={board}>
        <div className="pk-example">
          <p className="pk-example-title">এভাবে বুঝবে <span>(উদাহরণ)</span></p>
          <ul className="pk-rows"><Row guess={EXAMPLE.guess} marks={EXAMPLE.marks} /></ul>
          <ul className="pk-legend">
            {(['p', 'a', 'k'] as const).map(mark => <li key={mark}><Mango mark={mark} /><span><b>{markNames[mark]}</b> {markHint[mark]}</span></li>)}
          </ul>
        </div>
        <ol className="pk-rows" aria-label={`তোমার চেষ্টা, ${bn(tries)} বারের মধ্যে`}>
          {Array.from({ length: tries }, (_, index) => {
            if (index < rows.length) return <Row key={index} number={index + 1} guess={guesses[index]} marks={rows[index]} fresh={index === last} win={won && index === last} />;
            const current = index === rows.length && !over;
            return <li key={index} ref={current ? typing : undefined} className="pk-row" data-empty={!current} data-current={current} aria-label={current ? `এখন: ${input ? bnDigits(input).split('').join(' ') : 'খালি'}` : undefined} aria-hidden={!current}>
              <span className="pk-n" aria-hidden="true">{bn(index + 1)}</span>
              {Array.from({ length: LENGTH }, (_, slot) => <span key={slot} className="pk-cell" data-next={current && slot === input.length}><b>{current ? bnDigits(input[slot] ?? '') : ''}</b></span>)}
            </li>;
          })}
        </ol>
      </div>
      <p className="pk-sr" aria-live="polite">{announce}</p>

      {!over ? <>
        <p className="pk-howto" role="status">{nudge || <>৪টা অঙ্ক চাপো, তারপর <b>দেখো</b>। একই অঙ্ক দুবার না।</>}</p>
        <div className="pk-pad" role="group" aria-label="অঙ্কের প্যাড">
          {keysShown.map(key => {
            if (key === 'erase') return <button key={key} type="button" className="pk-key pk-erase" onClick={() => press(key)} disabled={!input}>মুছো</button>;
            if (key === 'check') return <button key={key} type="button" className="pk-key pk-check" style={{ gridColumn: `span ${checkSpan}` }} onClick={() => press(key)} aria-disabled={input.length < LENGTH}>দেখো</button>;
            const hint = hints[key];
            return <button key={key} type="button" className="pk-key" data-hint={hint} disabled={input.includes(key)} onClick={() => press(key)} aria-label={hint ? `${bnDigits(key)}, ${markNames[hint]}` : bnDigits(key)}>
              {bnDigits(key)}{hint && <Mango mark={hint} />}
            </button>;
          })}
        </div>
      </> : (
        <div className="pk-over" role="status">
          <h2>{won ? `${bn(rows.length)} বারে ধরে ফেলেছ!` : <>এবার হলো না। কোডটা ছিল <b>{bnDigits(code)}</b></>}</h2>
          {level > 0 && won && <StarReveal count={earned} delay={320} />}
          <p>{versus || humanLine(rows, tries)}</p>
          {near && <p className="pk-best">{near}</p>}
          {level > 0 ? <>
            <div className="pk-over-actions">
              {won && level < LEVEL_COUNT && <button type="button" className="kit-secondary" onClick={() => playLevel(level)}>আবার খেলো</button>}
              {won && level < LEVEL_COUNT
                ? <button type="button" className="kit-primary pk-again" onClick={() => playLevel(level + 1)}>পরের লেভেল</button>
                : <button type="button" className="kit-primary pk-again" onClick={() => playLevel(level)}>আবার খেলো</button>}
            </div>
            <p className="pk-again-note">{won && level === LEVEL_COUNT ? 'সব লেভেল শেষ! তারা কম থাকলে নিচে থেকে আবার খেলো।' : won ? `লেভেল ${bn(level + 1)}: ${nextRule(level + 1)}` : 'নতুন একটা কোড পাবে, একই লেভেলে।'}</p>
          </> : <>
            <button type="button" className="kit-primary pk-again" onClick={() => start({ kind: 'seed', seed: newSeed() })}>আরেকবার</button>
            <p className="pk-again-note">{isToday ? 'নতুন একটা কোড পাবে। পরের দিনের কোড আসবে রাত ১২টায়।' : 'নতুন একটা কোড পাবে।'} <button type="button" className="kit-link" onClick={() => playLevel(startLevel(levels.stars, levels.unlocked))}>বা লেভেল খেলো</button></p>
          </>}
        </div>
      )}

      <div className="pk-toggles">
        <SoundToggle compact />
        <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <button type="button" aria-expanded={making} aria-controls="pk-make" onClick={() => setMaking(!making)}>বন্ধুর জন্য কোড বানাও</button>
      </div>

      <details className="pk-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>উঠানে ১–৯: প্যাডে ৫ থেকে ৭টা অঙ্ক। আমবাগানে ১০–১৮: ৮ থেকে ১০টা। কম বারে ধরলে বেশি তারা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, level)} current={level || undefined} onPick={next => { playLevel(next); board.current?.scrollIntoView({ block: 'start' }); }} />
      </details>

      {making && (
        <section className="pk-make" id="pk-make" aria-labelledby="pk-make-title">
          <h2 id="pk-make-title">বন্ধুর জন্য কোড বানাও</h2>
          <label className="pk-field">
            <span>৪ অঙ্কের কোড <small>{RULE}</small></span>
            <input inputMode="numeric" autoComplete="off" value={bnDigits(made)} placeholder="যেমন ৪৭১৯" aria-invalid={made.length === LENGTH && !isCode(madeCode)}
              onChange={event => setMade(asciiDigits(event.target.value).replace(/\D/g, '').slice(0, LENGTH))} />
          </label>
          <button type="button" className="kit-link" onClick={() => setMade(codeFromSeed(newSeed()))}>নিজে না ভেবে একটা দাও</button>
          {made.length === LENGTH && !isCode(madeCode) && <p className="kit-status" role="alert">একই অঙ্ক দুবার হয়ে গেছে। চারটা আলাদা অঙ্ক দাও।</p>}
          <label className="pk-field">
            <span>তোমার নাম <small>বন্ধু দেখবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} autoComplete="given-name" placeholder="যেমন রাফি" onChange={event => setName(event.target.value)} />
          </label>
          <p className="pk-note">কোডটা লিংকের মধ্যেই লেখা থাকে, তাই এটা গোপন না। বন্ধুকে বলো লিংকে উঁকি না দিতে!</p>
          <ShareBar tool={TOOL} fileName="paka-kancha-code.png" makeImage={() => cardBlob(invite, today, format, site)} imageKey={`${shareHash(invite)}|${format}`}
            caption={caption(invite, today)} state={shareHash(invite)} disabled={!isCode(madeCode)} hint={made.length < LENGTH ? 'আগে চারটা আলাদা অঙ্ক দাও।' : ''} />
        </section>
      )}

      {over && (
        <section className="pk-result" id="result" aria-labelledby="pk-result-title">
          <h2 id="pk-result-title">{isToday ? 'আজকের' : 'তোমার'} <em>ফল</em></h2>
          <p>ছবিতে শুধু আম থাকে, কোনো অঙ্ক না। বন্ধু দেখে বুঝবে তুমি কয়বারে পেরেছ, উত্তর না।</p>
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pk-card-summary" />
            <figcaption id="pk-card-summary" className="pk-sr">ফলের ছবি: {today ? puzzleLabel(puzzle, today) : ''}, {won ? `${bn(rows.length)} বারে` : 'এবার হয়নি'}{earned ? `, ${bn(earned)} তারা` : ''}। {humanLine(rows, tries)}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <label className="pk-field">
            <span>তোমার নাম <small>ছবিতে আর লিংকে যাবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} autoComplete="given-name" placeholder="যেমন রাফি" onChange={event => setName(event.target.value)} />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="paka-kancha.png" makeImage={() => cardBlob(mine, today, format, site)} imageKey={`${state}|${format}`} caption={caption(mine, today)} state={state} hint={linkHint} />
        </section>
      )}
    </div>
  );
}
