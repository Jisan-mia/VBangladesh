'use client';
// The ?print sheet: one A4 page of ten pictures, each word with an empty sign slot to write in. Printed with the browser.
import { WordPicture, WordSlot } from './word-parts';
import { levelOf } from '../lib/levels';
import { KARS, dotted } from '../lib/words';

export function PrintSheet({ level }: { level: number }) {
  const spec = levelOf(level);
  return <div className="kc-sheet">
    <div className="kc-sheet-actions">
      <button type="button" className="kit-primary" onClick={() => print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/kar-chinho">খেলায় ফেরো</a>
    </div>
    <h2>কার-চিহ্ন বসাও · {spec.title}</h2>
    <p className="kc-sheet-ask">ছবির নামটা বলো। ফাঁকা ঘরে ঠিক কার-চিহ্নটা লেখো।</p>
    <ol className="kc-sheet-grid">
      {spec.items.map(item => <li key={`${item.word}${item.kar}${item.nth}`}>
        <WordPicture pic={item.pic} size={96} />
        <WordSlot item={item} />
      </li>)}
    </ol>
    <p className="kc-sheet-kars"><span>কার-চিহ্নগুলো:</span> {KARS.map(kar => <b key={kar}>{dotted(kar)}</b>)}</p>
    <p className="kc-sheet-foot">একটুখানি · কার-চিহ্ন বসাও</p>
  </div>;
}
