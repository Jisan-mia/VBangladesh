'use client';

import { useState, type KeyboardEvent } from 'react';
import { saveBlob } from '../../../shared/art-export';
import { answerState, checkAnswer, newGame, nextPuzzle, pickTile, puzzles, removeLast, resultText, revealAnswer, score, tileOrder } from '../lib/puzzles';
import '../product.css';

const number = new Intl.NumberFormat('bn-BD');

export function Editor() {
  const [game, setGame] = useState(newGame);
  const [notice, setNotice] = useState('সূত্র পড়ে নিচের টুকরোগুলো বেছে নিন।');
  const [exportNotice, setExportNotice] = useState('');
  const puzzle = puzzles[game.index];
  const round = game.rounds[game.index];
  const result = score(game);
  const finished = game.index >= puzzles.length;
  const report = resultText(game);

  function choose(tile: number) {
    setGame(current => pickTile(current, tile));
    setNotice('শব্দ সাজিয়ে হলে “মিলিয়ে দেখুন” চাপুন।');
  }

  function backspace() {
    if (!round || round.outcome !== 'playing' || !round.picked.length) return;
    setGame(removeLast);
    setNotice('শেষ টুকরোটি ফিরে এসেছে। আবার বেছে নিন।');
  }

  function check() {
    if (!round || round.outcome !== 'playing') return;
    const answer = answerState(game);
    setGame(checkAnswer);
    setNotice(answer === 'correct' ? `মিলেছে! শব্দটি “${puzzle.parts.join('')}”। চাইলে পরের ধাঁধায় যান।` : answer === 'incomplete' ? 'সব টুকরো বেছে শব্দটি শেষ করুন। তারপর মিলিয়ে দেখুন।' : 'এখনো মেলেনি। শেষ টুকরো ফেরত দিয়ে আবার সাজান। যতবার খুশি চেষ্টা করতে পারবেন।');
  }

  function next() {
    setGame(nextPuzzle);
    setNotice(game.index + 1 >= puzzles.length ? 'সব ধাঁধা দেখা হয়েছে। নিচে আপনার খেলার ফল আছে।' : 'নতুন সূত্র পড়ে শব্দটি সাজান।');
  }

  function showAnswer() {
    setGame(revealAnswer);
    setNotice(`উত্তর: ${puzzle.parts.join('')}। এটি “উত্তর দেখেছি” হিসেবে থাকবে।`);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey || finished) return;
    if (event.key === 'Backspace') { event.preventDefault(); backspace(); }
    if (event.key === 'Enter') { event.preventDefault(); check(); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(report); setExportNotice('ফলাফল কপি হয়েছে। চাইলে বন্ধুকে পাঠাতে পারবেন।'); }
    catch { setExportNotice('কপি করা যায়নি। “ফলাফলের লেখা” খুলে নিজে কপি করুন, অথবা ফাইল নামিয়ে নিন।'); }
  }

  function download() {
    try { saveBlob(new Blob([report], { type: 'text/plain;charset=utf-8' }), 'শব্দ-সাজাই-ফলাফল.txt'); setExportNotice('ফলাফলের ফাইল ডাউনলোডের জন্য পাঠানো হয়েছে।'); }
    catch { setExportNotice('ফাইল তৈরি করা যায়নি। নিচের ফলাফলের লেখা থেকে কপি করুন।'); }
  }

  return <div className="word-layout">
    <div className="word-board" tabIndex={0} onKeyDown={keyboard} aria-label="শব্দ সাজানোর খাতা" aria-describedby="word-keyboard-help">
      <div className="word-board-top"><span>শব্দ সাজাই</span><span>{finished ? 'আপনার খেলার খাতা' : `ধাঁধা ${number.format(game.index + 1)} / ${number.format(puzzles.length)}`}</span></div>
      {!finished ? <>
        <p className="word-clue-label">শব্দটি কী?</p><h2 className="word-clue">{puzzle.clue}</h2>
        <div className="word-answer" aria-label="আপনার সাজানো শব্দ" aria-live="polite">{puzzle.parts.map((_, index) => <span key={index} className={round.picked[index] === undefined ? 'word-empty' : ''}>{round.picked[index] === undefined ? <span aria-hidden="true">—</span> : puzzle.parts[round.picked[index]]}</span>)}</div>
        <p className="word-pool-label">একটি করে টুকরো বেছে নিন</p>
        <div className="word-pool">{tileOrder(game.index).map(tile => <button key={tile} type="button" disabled={round.picked.includes(tile) || round.outcome !== 'playing'} aria-label={`${puzzle.parts[tile]} বেছে নিন`} onClick={() => choose(tile)}>{puzzle.parts[tile]}</button>)}</div>
        <div className="word-main-actions"><button type="button" className="button" disabled={round.outcome !== 'playing'} onClick={check}>মিলিয়ে দেখুন</button><button type="button" className="button-secondary" disabled={!round.picked.length || round.outcome !== 'playing'} onClick={backspace}>শেষ টুকরো ফেরত দিন</button></div>
        <p className="word-notice" role="status">{notice}</p>
        <div className="word-secondary-actions"><button type="button" disabled={round.outcome !== 'playing'} onClick={showAnswer}>উত্তর দেখুন</button><button type="button" onClick={next}>{round.outcome === 'playing' ? 'এটি বাদ দিন' : game.index === puzzles.length - 1 ? 'ফলাফল দেখুন' : 'পরের ধাঁধা'} <span aria-hidden="true">→</span></button></div>
      </> : <div className="word-finish"><p className="word-clue-label">আজ এ পর্যন্তই</p><h2>নিজে মিলিয়েছেন<br/><strong>{number.format(result.solved)}টি শব্দ</strong></h2><p>উত্তর দেখেছেন {number.format(result.revealed)}টি, বাদ দিয়েছেন {number.format(result.skipped)}টি। চাইলে একই ধাঁধাগুলো আবার সাজাতে পারবেন।</p><button type="button" className="button" onClick={() => { setGame(newGame()); setNotice('আবার শুরু হলো। নিজের সময় নিয়ে সাজান।'); setExportNotice(''); }}>আবার খেলুন</button><p className="studio-note">এই ফল রাখতে চাইলে আবার শুরুর আগে কপি বা ডাউনলোড করুন।</p></div>}
      <p className="word-keyboard" id="word-keyboard-help">টুকরোর বোতামে Tab দিয়ে যান, Enter বা Space দিয়ে বাছুন। খাতায় ফোকাস থাকলে Backspace শেষ টুকরো ফেরত দেয়, Enter উত্তর মিলিয়ে দেখে।</p>
    </div>
    <aside className="word-record" aria-labelledby="word-record-heading"><p className="eyebrow">নিজের সময় নিয়ে খেলুন</p><h2 id="word-record-heading">আপনার খেলার হিসাব</h2><dl><div><dt>নিজে মিলিয়েছেন</dt><dd>{number.format(result.solved)}<span>টি</span></dd></div><div><dt>উত্তর দেখেছেন</dt><dd>{number.format(result.revealed)}<span>টি</span></dd></div><div><dt>বাদ দিয়েছেন</dt><dd>{number.format(result.skipped)}<span>টি</span></dd></div></dl><p className="word-reassurance">সময়সীমা নেই। ভুল হলে নম্বর কাটে না। এটি ভাষাজ্ঞানের পরীক্ষা নয়—চেনা শব্দ নিয়ে একটু খেলা।</p><div className="studio-actions"><button type="button" onClick={copy}>ফলাফল কপি করুন</button><button type="button" onClick={download}>ফলাফল নামান</button></div><p className="studio-live" role="status">{exportNotice}</p><details className="word-report"><summary>ফলাফলের লেখা</summary><textarea aria-label="কপি করার ফলাফল" value={report} readOnly rows={12}/></details><p className="studio-note">ফলাফলে উত্তরের শব্দগুলো থাকে না। বন্ধু চাইলে নিজে খেলে দেখতে পারবেন। পাতা বন্ধ করলে খেলার হিসাব থাকবে না।</p></aside>
  </div>;
}
