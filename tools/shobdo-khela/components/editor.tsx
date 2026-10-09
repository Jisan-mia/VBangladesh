'use client';

import { useState, type KeyboardEvent } from 'react';
import { saveBlob } from '../../../shared/art-export';
import { answerState, checkAnswer, newGame, nextPuzzle, pickTile, puzzles, removeLast, resultText, revealAnswer, score, tileOrder } from '../lib/puzzles';
import '../product.css';

const number = new Intl.NumberFormat('bn-BD');

export function Editor() {
  const [game, setGame] = useState(newGame);
  const [notice, setNotice] = useState('সূত্রটা পড়ো, তারপর নিচের টুকরো ছুঁয়ে শব্দটা সাজাও।');
  const [exportNotice, setExportNotice] = useState('');
  const puzzle = puzzles[game.index];
  const round = game.rounds[game.index];
  const result = score(game);
  const finished = game.index >= puzzles.length;
  const report = resultText(game);

  function choose(tile: number) {
    setGame(current => pickTile(current, tile));
    setNotice('সাজানো হলে “মিলিয়ে দেখো” চাপো।');
  }

  function backspace() {
    if (!round || round.outcome !== 'playing' || !round.picked.length) return;
    setGame(removeLast);
    setNotice('শেষ টুকরোটা ফিরে এসেছে। আবার বাছো।');
  }

  function check() {
    if (!round || round.outcome !== 'playing') return;
    const answer = answerState(game);
    setGame(checkAnswer);
    setNotice(answer === 'correct' ? `ঠিক ধরেছ! শব্দটা “${puzzle.parts.join('')}”। চলো, পরের ধাঁধায়।` : answer === 'incomplete' ? 'আগে সব টুকরো বসাও, তারপর মিলিয়ে দেখো।' : 'উঁহু, এখনো মেলেনি। শেষ টুকরো ফিরিয়ে আবার সাজাও, যতবার খুশি।');
  }

  function next() {
    setGame(nextPuzzle);
    setNotice(game.index + 1 >= puzzles.length ? 'সব ধাঁধা শেষ! এবার স্কোরটা দেখো।' : 'নতুন সূত্র এসেছে। পড়ে দেখো তো!');
  }

  function showAnswer() {
    setGame(revealAnswer);
    setNotice(`উত্তর ছিল “${puzzle.parts.join('')}”। এটা “উত্তর দেখেছি”-তে গোনা হবে।`);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey || finished) return;
    if (event.key === 'Backspace') { event.preventDefault(); backspace(); }
    if (event.key === 'Enter') { event.preventDefault(); check(); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(report); setExportNotice('স্কোর কপি হয়ে গেছে! বন্ধুকে পাঠিয়ে দেখো, সে কয়টা পারে।'); }
    catch { setExportNotice('কপি হলো না। নিচে “স্কোরের লেখা” খুলে নিজে কপি করে নাও, বা ফাইলটা ডাউনলোড করো।'); }
  }

  function download() {
    try { saveBlob(new Blob([report], { type: 'text/plain;charset=utf-8' }), 'শব্দ-সাজাই-স্কোর.txt'); setExportNotice('ফাইলটা নামানো হচ্ছে। ডাউনলোড ফোল্ডারে দেখো।'); }
    catch { setExportNotice('ফাইলটা বানানো গেল না। নিচের “স্কোরের লেখা” থেকে কপি করে নাও।'); }
  }

  return <div className="word-layout">
    <div className="word-board" tabIndex={0} onKeyDown={keyboard} aria-label="শব্দ সাজানোর খাতা" aria-describedby="word-keyboard-help">
      <div className="word-board-top"><span>শব্দ সাজাই</span><span>{finished ? 'তোমার খেলার খাতা' : `ধাঁধা ${number.format(game.index + 1)} / ${number.format(puzzles.length)}`}</span></div>
      {!finished ? <>
        <p className="word-clue-label">শব্দটা কী?</p><h2 className="word-clue">{puzzle.clue}</h2>
        <div className="word-answer" aria-label="তোমার সাজানো শব্দ" aria-live="polite">{puzzle.parts.map((_, index) => <span key={index} className={round.picked[index] === undefined ? 'word-empty' : ''}>{round.picked[index] === undefined ? <span aria-hidden="true">—</span> : puzzle.parts[round.picked[index]]}</span>)}</div>
        <p className="word-pool-label">একটা একটা করে টুকরো ছোঁও</p>
        <div className="word-pool">{tileOrder(game.index).map(tile => <button key={tile} type="button" disabled={round.picked.includes(tile) || round.outcome !== 'playing'} aria-label={`${puzzle.parts[tile]} বসাও`} onClick={() => choose(tile)}>{puzzle.parts[tile]}</button>)}</div>
        <div className="word-main-actions"><button type="button" className="button" disabled={round.outcome !== 'playing'} onClick={check}>মিলিয়ে দেখো</button><button type="button" className="button-secondary" disabled={!round.picked.length || round.outcome !== 'playing'} onClick={backspace}>শেষ টুকরো ফেরাও</button></div>
        <p className="word-notice" role="status">{notice}</p>
        <div className="word-secondary-actions"><button type="button" disabled={round.outcome !== 'playing'} onClick={showAnswer}>উত্তর দেখাও</button><button type="button" onClick={next}>{round.outcome === 'playing' ? 'এটা বাদ দাও' : game.index === puzzles.length - 1 ? 'স্কোর দেখো' : 'পরের ধাঁধা'} <span aria-hidden="true">→</span></button></div>
      </> : <div className="word-finish"><p className="word-clue-label">আজকের খেলা শেষ</p><h2>তুমি নিজে মিলিয়েছ<br/><strong>{number.format(result.solved)}টা শব্দ</strong></h2><p>উত্তর দেখেছ {number.format(result.revealed)}টা, বাদ দিয়েছ {number.format(result.skipped)}টা। আবার খেলে দেখো, এবার কয়টা পারো।</p><button type="button" className="button" onClick={() => { setGame(newGame()); setNotice('আবার শুরু! ধীরেসুস্থে সাজাও।'); setExportNotice(''); }}>আবার খেলো</button><p className="studio-note">স্কোরটা রাখতে চাইলে আবার শুরুর আগেই কপি করো বা নামিয়ে রাখো।</p></div>}
      <p className="word-keyboard" id="word-keyboard-help">কিবোর্ডে খেলতে: Tab দিয়ে টুকরোয় যাও, Enter বা Space দিয়ে বাছো। খাতায় ফোকাস থাকলে Backspace শেষ টুকরো ফেরায়, Enter মিলিয়ে দেখে।</p>
    </div>
    <aside className="word-record" aria-labelledby="word-record-heading"><p className="eyebrow">ধীরেসুস্থে খেলো</p><h2 id="word-record-heading">তোমার স্কোর</h2><dl><div><dt>নিজে মিলিয়েছ</dt><dd>{number.format(result.solved)}<span>টা</span></dd></div><div><dt>উত্তর দেখেছ</dt><dd>{number.format(result.revealed)}<span>টা</span></dd></div><div><dt>বাদ দিয়েছ</dt><dd>{number.format(result.skipped)}<span>টা</span></dd></div></dl><p className="word-reassurance">ঘড়ি নেই, ভুলে নম্বরও কাটে না। এটা কোনো পরীক্ষা না, মায়ের ভাষার চেনা শব্দ নিয়ে একটু খেলা।</p><div className="studio-actions"><button type="button" onClick={copy}>স্কোর কপি করো</button><button type="button" onClick={download}>স্কোর ডাউনলোড করো</button></div><p className="studio-live" role="status">{exportNotice}</p><details className="word-report"><summary>স্কোরের লেখা</summary><textarea aria-label="কপি করার জন্য স্কোরের লেখা" value={report} readOnly rows={12}/></details><p className="studio-note">স্কোরে উত্তরের শব্দ থাকে না, তাই বন্ধুর মজা নষ্ট হবে না। পাতা বন্ধ করলে হিসাবটা মুছে যাবে।</p></aside>
  </div>;
}
