// The ?print view: an A4 tracing sheet for one set. Each row: one letter with numbered start dots and arrows,
// three dotted copies to trace with a pencil, and an empty box to write it alone.
import { ORDER, bn, levelOf, placeOf } from "../lib/levels";
import { strokesOf } from "../lib/strokes";
import { Arrow, GuideLetter, StartDot, StrokeLine } from "./marks";

function Cell({ char, mode }: { char: string; mode: "guide" | "dotted" | "blank" }) {
  const strokes = strokesOf(char);
  return <svg className="bl-cell" viewBox="0 0 100 100" role="img" aria-label={mode === "blank" ? "খালি ঘর" : `ডট দেওয়া ${char}`}>
    <line className="bl-cell-rule" x1="4" y1="96" x2="96" y2="96" />
    {mode !== "blank" && <>
      {mode === "guide" && <GuideLetter char={char} className="bl-glyph bl-glyph-print" />}
      {strokes.map((stroke, i) => <StrokeLine key={i} stroke={stroke} className="bl-print-dots" />)}
      {mode === "guide" && strokes.map((stroke, i) => <Arrow key={i} stroke={stroke} className="bl-arrow bl-arrow-print" />)}
      {strokes.map((stroke, i) => mode === "guide" ? <StartDot key={i} stroke={stroke} n={i + 1} className="bl-start bl-start-print" /> : <circle key={i} className="bl-print-start" cx={stroke.line[0][0]} cy={stroke.line[0][1]} r={2.2} />)}
    </>}
  </svg>;
}

export function PrintSheet({ level }: { level: number }) {
  const spec = levelOf(level);
  return <div className="bl-print">
    <div className="bl-print-bar">
      <button type="button" className="kit-primary" onClick={() => window.print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/borno-likhi">খেলায় ফিরে যাও</a>
    </div>
    <nav className="bl-print-sets" aria-label="কোন সেটের পাতা">
      {ORDER.map(id => <a key={id} href={`/borno-likhi?print=${id}`} aria-current={id === spec.id ? "page" : undefined}>{levelOf(id).title}</a>)}
    </nav>
    <article className="bl-pr-sheet" aria-label={`হাতের লেখার পাতা: ${spec.title}`}>
      <h2>বর্ণ লিখি · {spec.title}</h2>
      <p>১ লেখা বিন্দু থেকে শুরু করো, তীর যেদিকে, সেদিকে টানো। মাত্রা সবার শেষে। শেষ ঘরে নিজে লেখো।</p>
      <ol className="bl-pr-rows">
        {spec.letters.map(char => <li key={char}>
          <Cell char={char} mode="guide" />
          <Cell char={char} mode="dotted" />
          <Cell char={char} mode="dotted" />
          <Cell char={char} mode="dotted" />
          <Cell char={char} mode="blank" />
        </li>)}
      </ol>
      <p className="bl-pr-foot">একটুখানি · বর্ণ লিখি · সেট {bn(placeOf(spec.id))}</p>
    </article>
  </div>;
}
