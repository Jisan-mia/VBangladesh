'use client';
// The ?print sheet "ভেঙে লেখো": one A4 page of picture words, each যুক্তবর্ণ with empty boxes for its letters, answers at the foot.
// A bare ?print gives the ten words (easy to hard); ?print=N gives that level's words.
import { WordLine, WordPicture } from './word-parts';
import { levelOf } from '../lib/levels';
import { bn, conjunct, equation, printItems } from '../lib/words';

export function PrintSheet({ level = 0 }: { level?: number }) {
  const items = level ? [...levelOf(level).words] : printItems();
  return <div className="jb-sheet">
    <div className="jb-sheet-actions">
      <button type="button" className="kit-primary" onClick={() => print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/juktoborno">খেলায় ফেরো</a>
    </div>
    <h2>ভেঙে লেখো{level ? `: ${levelOf(level).title}` : ''}</h2>
    <p className="jb-sheet-ask">রঙিন যুক্তবর্ণটা কোন কোন বর্ণে তৈরি? ক্রম মেনে ঘরে লেখো। যেমন: ক্ষ = ক + ষ</p>
    <ol className="jb-sheet-list">
      {items.map((item, index) => <li key={item.word}>
        <span className="jb-sheet-n">{bn(index + 1)}.</span>
        <WordPicture pic={item.pic} size={64} />
        <WordLine word={item} />
        <span className="jb-sheet-sum"><b>{conjunct(item.parts)}</b> = {item.parts.map((_, i) => <span key={i}>{i > 0 && ' + '}<i className="jb-sheet-box" /></span>)}</span>
      </li>)}
    </ol>
    <p className="jb-sheet-key">উত্তর: {items.map(item => equation(item.parts)).join(' · ')}</p>
    <p className="jb-sheet-foot">একটুখানি · যুক্তবর্ণ ভাঙি-জুড়ি</p>
  </div>;
}
