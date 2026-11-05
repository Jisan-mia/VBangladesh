// The small drawn parts of the stall: a picture, a b d p q drawing (with optional reading-order numbers), a word with its
// letter coloured, the stall's awning, the ghost finger, and the sign that hangs on it. No voice: everything is seen.
import { artGroup } from "../lib/art";
import { entryOf, MIRROR_SHAPE, splitWord, type Entry, type Mirror } from "../lib/letters";
import type { Item } from "../lib/levels";
import { answerOf } from "../lib/play";

export function Pic({ letter, className = "ab-pic" }: { letter: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artGroup(letter) }} />;
}

/** Which part is read first from the left: b and p stick first, d and q belly first. */
const STICK_FIRST: Record<Mirror, boolean> = { b: true, p: true, d: false, q: false };

/** b d p q as a blue stick and an orange belly on a writing line. `order` adds 1 and 2 badges: which part comes first when read from the left. */
export function Glyph({ letter, className = "ab-glyph", order = false }: { letter: string; className?: string; order?: boolean }) {
  const shape = MIRROR_SHAPE[letter as Mirror];
  if (!shape) return null;
  const stickFirst = STICK_FIRST[letter as Mirror];
  const stickEnd = letter === "b" || letter === "d" ? shape.from : shape.to;
  return <svg className={className} viewBox="0 0 64 104" role="img" aria-label={letter}>
    <path className="ab-line" d="M2 80h60" />
    <circle className="ab-belly" cx={shape.belly} cy="62" r="18" />
    <path className="ab-stick" d={`M${shape.stick} ${shape.from}V${shape.to}`} />
    {order && <g className="ab-order" aria-hidden="true">
      <circle cx={shape.stick} cy={stickEnd === shape.from ? 9 : 95} r="8" /><text x={shape.stick} y={stickEnd === shape.from ? 14.5 : 100.5}>{stickFirst ? "1" : "2"}</text>
      <circle cx={shape.belly} cy="62" r="8" /><text x={shape.belly} y="67.5">{stickFirst ? "2" : "1"}</text>
    </g>}
  </svg>;
}

/** "Mango" with the M coloured; "Box" with the x coloured. */
export function EnglishWord({ entry }: { entry: Entry }) {
  const [before, letter, after] = splitWord(entry);
  return <b className="ab-word" lang="en">{before}<span>{letter}</span>{after}</b>;
}

/** The stall's striped awning, in the world's colours. */
export function Awning() {
  return <svg className="ab-awning" viewBox="0 0 320 36" preserveAspectRatio="none" aria-hidden="true">
    {Array.from({ length: 10 }, (_, at) => <path key={at} className={at % 2 ? "ab-awn-b" : "ab-awn-a"} d={`M${at * 32} 0h32v22q-16 18-32 0z`} />)}
  </svg>;
}

/** A ghost finger that shows a tap, for a child who cannot read yet. */
export function Finger() {
  return <svg className="ab-finger" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="ab-ripple" cx="20" cy="10" r="10" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#2b2433" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** What hangs on the stall: the letter, or the picture with its word blanked, or a b d p q drawing. */
export function Sign({ item }: { item: Item }) {
  const entry = entryOf(item.letter);
  if (item.kind === "picture") return <p className="ab-sign-letters" lang="en" aria-label={`${entry.letter} ${entry.letter.toLowerCase()}`}>{entry.letter} <span>{entry.letter.toLowerCase()}</span></p>;
  if (item.kind === "small") return <p className="ab-sign-letters" lang="en">{entry.letter}</p>;
  if (item.kind === "capital") return <p className="ab-sign-letters" lang="en">{entry.letter.toLowerCase()}</p>;
  if (item.kind === "same") return <Glyph letter={answerOf(item)} className="ab-sign-glyph" />;
  return <div className="ab-sign-pic">
    <Pic letter={entry.letter} />
    <p><b lang="en"><span className="ab-blank">_</span>{entry.word.slice(1)}</b></p>
  </div>;
}

/** One tile's face: a picture, a letter, or a b d p q drawing. */
export function Face({ item, value }: { item: Item; value: string }) {
  if (item.kind === "picture") return <Pic letter={value} />;
  if (item.kind === "mirror" || item.kind === "same") return <Glyph letter={value} />;
  return <span className="ab-letter" lang="en">{value}</span>;
}

export const faceLabel = (item: Item, value: string) => item.kind === "picture" ? `${entryOf(value).word}, ${entryOf(value).bn}` : value;
