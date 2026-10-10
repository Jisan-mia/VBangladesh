'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { addToTally, readTally, type Tally } from '../../../shared/share-client';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import { answerOf, checkAnswer, currentPuzzle, dhakaDate, isFinished, nextPuzzle, PER_DAY, pickTile, puzzleById, removeLast, removeTile, restoreGame, revealAnswer, shiftDate, takeHint, tileOrder, type Game } from '../lib/puzzles';
import { bn, bnDate, caption, cleanName, createCard, friendLine, liveStreak, MAX_NAME_LENGTH, nextStreak, parseShareHash, readStreak, rowsOf, shareHash, solvedCount, type Shared, type Streak } from '../lib/result';

const TOOL = 'shobdo-khela';
const KEYS = { game: 'shobdojot-game', streak: 'shobdojot-streak', name: 'shobdojot-name', mine: 'shobdojot-mine' };
// A percentage from a handful of people is noise ("১০০% পেরেছে" after one player), so it waits for this many.
const PERCENT_MIN = 20;

function load(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: the game still works, it just won't survive a reload */ }
}

function untilTomorrow(today: string) {
  const minutes = Math.max(0, Math.ceil((Date.parse(`${shiftDate(today, 1)}T00:00:00+06:00`) - Date.now()) / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${bn(hours)} ঘণ্টা ${bn(minutes % 60)} মিনিট` : `${bn(minutes)} মিনিট`;
}

export function Shobdojot() {
  const [game, setGame] = useState<Game | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [notice, setNotice] = useState('');
  const [miss, setMiss] = useState(0);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [added, setAdded] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  useEffect(() => {
    // The day's set depends on the Dhaka date and this browser's saved game, so it is only known after mount.
    const open = () => setGame(current => current?.date === dhakaDate() ? current : restoreGame(load(KEYS.game), dhakaDate()));
    open();
    setStreak(readStreak(load(KEYS.streak)));
    const savedName = load(KEYS.name);
    if (typeof savedName === 'string') setName(cleanName(savedName));
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    window.addEventListener('hashchange', readFriend);
    // A tab left open overnight picks up the new day when it comes back into view.
    document.addEventListener('visibilitychange', open);
    return () => { window.removeEventListener('hashchange', readFriend); document.removeEventListener('visibilitychange', open); };
  }, []);

  useEffect(() => { if (game) save(KEYS.game, game); }, [game]);

  const finished = game ? isFinished(game) : false;
  useEffect(() => {
    if (!game || !finished) return;
    const next = nextStreak(streak, game.date);
    if (next !== streak) { setStreak(next); save(KEYS.streak, next); }
  }, [finished, game, streak]);

  const own = useMemo<Shared | null>(() => game && { date: game.date, rows: rowsOf(game), streak: liveStreak(streak, game.date), name }, [game, streak, name]);
  const card = useMemo(() => own && createCard(own, friend), [own, friend]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts('আজকের শব্দজট').then(() => {
      if (cancelled) return;
      if (finished && card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), 'feed', site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, finished, format, site, friend]);

  function percent(id: string) {
    const seen = everyone?.counts[`seen:${id}`] ?? 0;
    return seen >= PERCENT_MIN ? Math.round(((everyone?.counts[id] ?? 0) / seen) * 100) : null;
  }

  // The keyed result section is the same DOM node in both trees, so useInView keeps watching it.
  if (!game || !own || !card) {
    return <div className="jot" aria-busy="true"><div className="jot-board jot-skeleton"><div className="jot-mast"><p><strong>আজকের শব্দজট</strong></p></div><p className="jot-count">একটু দাঁড়াও…</p><div className="jot-slots"><span className="jot-slot" /><span className="jot-slot" /><span className="jot-slot" /></div></div><section key="result" className="jot-result" id="result" ref={result} /></div>;
  }

  const puzzle = currentPuzzle(game);
  const round = game.rounds[game.index];
  const today = game.date;
  const solved = solvedCount(own.rows);
  const state = shareHash(own).slice(1);

  function choose(tile: number) {
    if (!game || !puzzle || !round) return;
    const placed = pickTile(game, tile);
    const checked = checkAnswer(placed);
    setGame(checked);
    const after = checked.rounds[checked.index];
    if (after.outcome === 'solved') {
      const share = percent(puzzle.id);
      setNotice(`ঠিক ধরেছ! ‘${answerOf(puzzle)}’।${share !== null ? ` আজ ${bn(share)}% মানুষ এটা পেরেছে।` : ''}`);
    } else if (after.attempts > round.attempts) {
      setMiss(count => count + 1);
      const tried = placed.rounds[placed.index].picked.map(index => puzzle.parts[index]).join('');
      setNotice(`উঁহু, ‘${tried}’ হলো না। আবার সাজাও।`);
    } else setNotice('');
  }

  function remove(position: number) {
    if (game) setGame(removeTile(game, position));
  }

  function hint() {
    if (!game) return;
    setGame(takeHint(game));
    setNotice('প্রথম টুকরোটা বসিয়ে দিলাম। এবার বাকিটা তুমি।');
  }

  function reveal() {
    if (!game || !puzzle) return;
    setGame(revealAnswer(game));
    setNotice(`উত্তর ছিল ‘${answerOf(puzzle)}’। পরেরটায় চলো!`);
  }

  function next() {
    if (!game) return;
    const moved = nextPuzzle(game);
    setGame(moved);
    setNotice(isFinished(moved) ? '' : round?.outcome === 'playing' ? 'ঠিক আছে, এটা বাদ। নতুন সূত্রটা পড়ো।' : '');
    document.getElementById(isFinished(moved) ? 'result' : 'board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Backspace' || event.ctrlKey || event.metaKey || event.altKey || !game) return;
    event.preventDefault();
    setGame(removeLast(game));
  }

  function changeName(value: string) {
    setName(value);
    save(KEYS.name, value);
  }

  async function addMine() {
    if (!game) return;
    setAdded('sending');
    // Each browser sends everything it has ever finished, because a new vote replaces its old one on the server.
    const mine = load(KEYS.mine) as { seen?: unknown; solved?: unknown } | null;
    const known = new Set<string>(game.ids);
    const keep = (list: unknown) => Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string' && Boolean(puzzleById(id))) : [];
    const seen = [...new Set([...keep(mine?.seen), ...known])];
    const solvedIds = [...new Set([...keep(mine?.solved), ...game.ids.filter((_, index) => game.rounds[index].outcome === 'solved')])];
    const tally = await addToTally(TOOL, [...solvedIds, ...seen.map(id => `seen:${id}`)]);
    if (tally) { save(KEYS.mine, { seen, solved: solvedIds }); setEveryone(tally); setAdded('done'); }
    else setAdded('failed');
  }

  const marksSoFar = own.rows.map((row, index) => (game.rounds[index].outcome === 'playing' ? '' : row.mark));

  return (
    <div className="jot">
      {friend && (
        <section className="jot-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || 'বন্ধুর'} শব্দজটের ফল`} />
          <div>
            <p className="jot-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
            <h2 id="friend-title">{friendLine(friend, today)}।<br /><span>{finished ? `তুমি পেরেছ ${bn(solved)}টা!` : 'তুমি কয়টা পারো?'}</span></h2>
            <a className="kit-primary" href={finished ? '#result' : '#board'}>{finished ? 'আমার ফল দেখো' : 'আমিও খেলি'}</a>
          </div>
        </section>
      )}

      <section className="jot-board" id="board" aria-labelledby="board-title" onKeyDown={keyboard}>
        <header className="jot-mast">
          <p><strong id="board-title">আজকের শব্দজট</strong><span>{bnDate(today)}</span></p>
          <ol className="jot-dots" aria-label={`পাঁচটার মধ্যে ${bn(solved)}টা পেরেছ`}>
            {marksSoFar.map((mark, index) => <li key={index} data-mark={mark} aria-current={index === game.index ? 'step' : undefined} />)}
          </ol>
        </header>

        {puzzle && round ? <>
          <p className="jot-count">ধাঁধা {bn(game.index + 1)} / {bn(PER_DAY)} · {bn(puzzle.parts.length)} টুকরো</p>
          <h2 className="jot-clue" id="jot-clue">{puzzle.clue}</h2>
          <div className="jot-slots" key={miss} data-miss={miss > 0 && round.outcome === 'playing'} aria-label="তোমার সাজানো শব্দ">
            {puzzle.parts.map((_, position) => {
              const tile = round.picked[position];
              if (tile === undefined) return <span key={position} className="jot-slot" aria-hidden="true" />;
              const locked = round.outcome !== 'playing' || (round.hint && position === 0);
              return <button key={position} type="button" className="jot-slot" data-filled data-hint={round.hint && position === 0} data-outcome={round.outcome} disabled={locked} aria-label={locked ? puzzle.parts[tile] : `${puzzle.parts[tile]} ফেরত নাও`} onClick={() => remove(position)}>{puzzle.parts[tile]}</button>;
            })}
          </div>
          {round.outcome === 'playing' ? <>
            <p className="jot-help">{round.picked.length ? 'ভুল টুকরো বসালে সেটায় ছুঁয়ে ফেরত নাও।' : 'টুকরোগুলো ঠিক ক্রমে ছোঁও, শব্দটা ওপরে সাজবে।'}</p>
            <div className="jot-pool" role="group" aria-label="টুকরোগুলো">
              {tileOrder(puzzle.id).map(tile => <button key={tile} type="button" className="jot-tile" disabled={round.picked.includes(tile)} aria-label={`${puzzle.parts[tile]} বসাও`} onClick={() => choose(tile)}>{puzzle.parts[tile]}</button>)}
            </div>
          </> : null}
          <p className="jot-notice" role="status" aria-live="polite">{notice}</p>
          {round.outcome === 'playing' ? (
            <div className="jot-actions">
              {round.hint ? <button type="button" className="kit-link" onClick={reveal}>উত্তর দেখাও</button> : <button type="button" className="kit-link" onClick={hint}>একটা হিন্ট দাও</button>}
              <button type="button" className="kit-link" onClick={next}>এটা বাদ দাও</button>
            </div>
          ) : <button type="button" className="kit-primary jot-next" onClick={next}>{game.index === PER_DAY - 1 ? 'আজকের ফল দেখো' : 'পরের ধাঁধা'} <span aria-hidden="true">→</span></button>}
        </> : (
          <div className="jot-done">
            <p className="jot-count">আজকের পাঁচটা শেষ</p>
            <ol className="jot-answers">
              {game.ids.map((id, index) => {
                const share = percent(id);
                return <li key={id} data-mark={own.rows[index].mark}><strong>{answerOf(puzzleById(id)!)}</strong><span>{{ g: 'নিজে পেরেছ', h: 'হিন্ট নিয়ে পেরেছ', x: 'উত্তর দেখেছ', s: 'বাদ দিয়েছ' }[own.rows[index].mark]}{share !== null ? ` · আজ ${bn(share)}% মানুষ পেরেছে` : ''}</span></li>;
              })}
            </ol>
            <p className="jot-tomorrow">পরের পাঁচটা আসবে <strong>{untilTomorrow(today)}</strong> পর, রাত ১২টায়।</p>
          </div>
        )}
      </section>

      <StickyNext show={finished && !resultVisible} title={<><strong>{bn(solved)}/{bn(PER_DAY)}</strong> পেরেছ</>} sub={card.line} href="#result" label="ফল শেয়ার করো" />

      <section key="result" className="jot-result" id="result" ref={result} aria-labelledby={finished ? 'result-title' : undefined}>
        {finished && <>
          <div className="jot-result-head">
            <h2 id="result-title">আজ <em>{bn(PER_DAY)}টার মধ্যে {bn(solved)}টা</em>{own.streak > 1 && <small> · টানা {bn(own.streak)} দিন</small>}</h2>
            <p>{card.line}</p>
          </div>
          <div className="jot-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`আজকের শব্দজট, ${bnDate(today)}: ${bn(PER_DAY)}টার মধ্যে ${bn(solved)}টা। ${card.line}`} />
              {previewError && <p className="kit-status" role="alert">ফলের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="jot-controls">
              <label className="jot-field">
                <span>নাম <small>না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => changeName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="ajker-shobdojot.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(own)} state={state} hint="ছবিতে বা লিংকে উত্তর থাকে না, শুধু রঙিন ঘর। বন্ধুর মজা নষ্ট হবে না।" />
            </div>
          </div>
          <div className="jot-everyone">
            <h3>সবার সাথে মিলিয়ে দেখবে?</h3>
            {added === 'done' ? <p>যোগ হয়েছে! ওপরের শব্দগুলোর পাশে দেখো কত শতাংশ মানুষ পেরেছে{everyone && game.ids.every(id => percent(id) === null) ? '। এখনো অল্প কয়েকজন খেলেছে, আরেকটু পরে হিসাবটা দেখা যাবে।' : '।'}</p> : <>
              <p>তোমার আজকের ফল সবার হিসাবে যোগ করলে দেখা যাবে কোন শব্দটা কত শতাংশ মানুষ পেরেছে। নাম যাবে না, শুধু কোন ধাঁধা পেরেছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={addMine} disabled={added === 'sending'}>{added === 'sending' ? 'যোগ হচ্ছে…' : 'হ্যাঁ, যোগ করো'}</button>
              {added === 'failed' && <p className="kit-status" role="alert">এখন যোগ করা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </>}
          </div>
        </>}
      </section>
    </div>
  );
}
