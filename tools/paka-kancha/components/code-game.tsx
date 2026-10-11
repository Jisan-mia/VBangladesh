'use client';
// IP: what we avoided — no "Mastermind" name, pegs or peg board; no green-yellow-grey letter grid or emoji-square post text from the word-guessing craze; not শব্দ সাজাই's newsprint squares. Mangoes, pad and card are drawn fresh.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { MAX_NAME, newSeed, useBest, useSlowMode } from '../../../shared/game-kit';
import { FormatToggle, ShareBar } from '../../../shared/share-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import { LENGTH, RULE, TRIES, asciiDigits, bn, bnDigits, codeFromSeed, codeOf, dhakaDate, erase, humanLine, isCode, keyHints, markNames, rowsOf, samePuzzle, solved, submit, typeDigit, validGuesses, type Mark, type Play, type Puzzle } from '../lib/game';
import { BLUSH, BODY, HALF, HALF_SKIN, LEAF, RAW_SCALE, SEED, STEM, colors, markHint } from '../lib/mango';
import { caption, friendBanner, parseShare, puzzleLabel, shareHash, versusLine, type Shared } from '../lib/result';

const TOOL = 'paka-kancha';
const SAVED = 'paka-kancha-day';
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
  const submittedAt = useRef(-1);
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);

  const { puzzle, guesses, input } = play;
  const code = useMemo(() => codeOf(puzzle), [puzzle]);
  const rows = useMemo(() => rowsOf(code, guesses), [code, guesses]);
  const hints = useMemo(() => keyHints(code, guesses), [code, guesses]);
  const won = solved(rows), over = won || rows.length >= TRIES;
  const mine: Shared = { puzzle, rows, name };
  const state = over ? shareHash(mine) : '';
  const rival = friend?.rows.length && samePuzzle(friend.puzzle, puzzle) ? friend : null;
  const versus = over && rival ? versusLine(rows, rival.rows, rival.name) : '';
  const isToday = puzzle.kind === 'day' && puzzle.date === today;
  // The banner only belongs to the friend's puzzle; after "আরেকবার" it steps aside.
  const banner = friend && today && samePuzzle(friend.puzzle, puzzle) ? friendBanner(friend, today) : null;
  const madeCode = asciiDigits(made);
  const invite: Shared = { puzzle: { kind: 'code', code: isCode(madeCode) ? madeCode : '0123' }, rows: [], name };

  useEffect(() => {
    const now = dhakaDate();
    const shared = parseShare(window.location.hash, now);
    const start: Puzzle = shared?.puzzle ?? { kind: 'day', date: now };
    setToday(now);
    setSite(window.location.host);
    setFriend(shared);
    setPlay({ puzzle: start, guesses: restore(start, now), input: '' });
  }, []);

  // Today's game stays on this phone, so a reload neither loses it nor hands out a second go.
  useEffect(() => {
    if (!isToday) return;
    try { localStorage.setItem(SAVED, JSON.stringify({ d: today, g: guesses })); } catch { /* private mode: fine */ }
  }, [isToday, today, guesses]);

  useEffect(() => {
    if (!over || submittedAt.current !== guesses.length) return;
    submittedAt.current = -1;
    setRecord(won && submitBest(guesses.length) && best !== null);
    // Only when a game ends here; a finished game restored on reload doesn't count again.
  }, [over, guesses.length]);

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

  function press(key: string) {
    if (over) return;
    if (key === 'erase') { setNudge(''); setPlay(erase); return; }
    if (key === 'check') {
      if (input.length < LENGTH) { setNudge(`আরও ${bn(LENGTH - input.length)}টা অঙ্ক দাও।`); return; }
      submittedAt.current = guesses.length + 1;
      setNudge('');
      setPlay(current => submit(code, current));
      return;
    }
    if (input.includes(key)) { setNudge(`${bnDigits(key)} তো দিয়েছই। ${RULE}`); return; }
    if (input.length >= LENGTH) { setNudge('চারটা হয়ে গেছে। এবার ‘দেখো’ চাপো।'); return; }
    if (!slow) navigator.vibrate?.(8);
    setNudge('');
    setPlay(current => typeDigit(code, current, key));
  }

  function start(next: Puzzle) {
    setPlay({ puzzle: next, guesses: restore(next, today), input: '' });
    setRecord(false);
    setNudge('');
    if ((board.current?.getBoundingClientRect().top ?? 0) < 0) board.current?.scrollIntoView({ block: 'start' });
  }

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

      <div className="pk-top">
        <p><b>{today ? puzzleLabel(puzzle, today) : 'আজকের কোড'}</b> · {over ? (won ? `${bn(rows.length)} বারে মিলেছে` : 'এবার হয়নি') : `আর ${bn(TRIES - rows.length)} বার`}</p>
        {today && !isToday && <button type="button" className="kit-link" onClick={() => start({ kind: 'day', date: today })}>আজকের কোডে ফেরো</button>}
      </div>

      <div className="pk-board" ref={board}>
        <div className="pk-example">
          <p className="pk-example-title">এভাবে বুঝবে <span>(উদাহরণ)</span></p>
          <ul className="pk-rows"><Row guess={EXAMPLE.guess} marks={EXAMPLE.marks} /></ul>
          <ul className="pk-legend">
            {(['p', 'a', 'k'] as const).map(mark => <li key={mark}><Mango mark={mark} /><span><b>{markNames[mark]}</b> {markHint[mark]}</span></li>)}
          </ul>
        </div>
        <ol className="pk-rows" aria-label={`তোমার চেষ্টা, ${bn(TRIES)} বারের মধ্যে`}>
          {Array.from({ length: TRIES }, (_, index) => {
            if (index < rows.length) return <Row key={index} number={index + 1} guess={guesses[index]} marks={rows[index]} fresh={index === last} win={won && index === last} />;
            const current = index === rows.length && !over;
            return <li key={index} className="pk-row" data-empty={!current} data-current={current} aria-label={current ? `এখন: ${input ? bnDigits(input).split('').join(' ') : 'খালি'}` : undefined} aria-hidden={!current}>
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
          {PAD.map(key => {
            if (key === 'erase') return <button key={key} type="button" className="pk-key pk-erase" onClick={() => press(key)} disabled={!input}>মুছো</button>;
            if (key === 'check') return <button key={key} type="button" className="pk-key pk-check" onClick={() => press(key)} aria-disabled={input.length < LENGTH}>দেখো</button>;
            const hint = hints[key];
            return <button key={key} type="button" className="pk-key" data-hint={hint} disabled={input.includes(key)} onClick={() => press(key)} aria-label={hint ? `${bnDigits(key)}, ${markNames[hint]}` : bnDigits(key)}>
              {bnDigits(key)}{hint && <Mango mark={hint} />}
            </button>;
          })}
        </div>
      </> : (
        <div className="pk-over">
          <h2>{won ? `${bn(rows.length)} বারে ধরে ফেলেছ!` : <>এবার হলো না। কোডটা ছিল <b>{bnDigits(code)}</b></>}</h2>
          <p>{versus || humanLine(rows)}</p>
          {(record || best !== null) && <p className="pk-best">{record ? 'নতুন রেকর্ড! এই ফোনে এত কম বারে আগে পারোনি।' : `এই ফোনে সবচেয়ে কম: ${bn(best!)} বার`}</p>}
          <button type="button" className="kit-primary pk-again" onClick={() => start({ kind: 'seed', seed: newSeed() })}>আরেকবার</button>
          <p className="pk-again-note">{isToday ? 'নতুন একটা কোড পাবে। পরের দিনের কোড আসবে রাত ১২টায়।' : 'নতুন একটা কোড পাবে।'}</p>
        </div>
      )}

      <div className="pk-toggles">
        <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <button type="button" aria-expanded={making} aria-controls="pk-make" onClick={() => setMaking(!making)}>বন্ধুর জন্য কোড বানাও</button>
      </div>

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
            <figcaption id="pk-card-summary" className="pk-sr">ফলের ছবি: {today ? puzzleLabel(puzzle, today) : ''}, {won ? `${bn(rows.length)} বারে` : 'এবার হয়নি'}। {humanLine(rows)}</figcaption>
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
