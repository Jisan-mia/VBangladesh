// The ?print view: one A4 sheet, A to Z, each letter pair with its picture in outline to colour and the word under it.
import { LETTERS } from "../lib/letters";
import { EnglishWord, Pic } from "./pieces";

export function PrintSheet() {
  return <div className="ab-print">
    <div className="ab-print-bar">
      <button type="button" className="kit-primary" onClick={() => window.print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/abc-bazar">খেলায় ফিরে যাও</a>
    </div>
    <article className="ab-sheet" aria-label="A থেকে Z রং করার পাতা">
      <h2>A থেকে Z: ছবিতে রং করো</h2>
      <p>অক্ষরটা আঙুল দিয়ে ছুঁয়ে বলো, তারপর ছবিতে রং করো।</p>
      <ol className="ab-sheet-grid">
        {LETTERS.map(entry => <li key={entry.letter}>
          <span className="ab-sheet-letter" lang="en">{entry.letter} {entry.letter.toLowerCase()}</span>
          <Pic letter={entry.letter} className="ab-pic ab-colour" />
          <EnglishWord entry={entry} />
          <span className="ab-sheet-bn">{entry.bn}</span>
        </li>)}
      </ol>
      <p className="ab-sheet-foot">X-এর শব্দ Box: x আছে শেষে। · একটুখানি · এবিসি বাজার</p>
    </article>
  </div>;
}
