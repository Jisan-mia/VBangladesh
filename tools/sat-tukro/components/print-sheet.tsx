'use client';
// The ?print sheet: the seven pieces as one 10 cm square to cut out, and six shadows to build on the table. Printed with the browser.
import { FIGURES, PRINT_IDS } from '../lib/figures';
import { PIECE_COLOR, figureView } from '../lib/game';
import { SET, corners, placed, type Point } from '../lib/tangram';

/** The classic square, one piece per entry in SET order (two large, medium, two small, square, parallelogram). */
const SQUARE = [placed('L', 5, 2, 2), placed('L', 3, 2, 2), placed('M', 4, 4, 4), placed('S', 7, 3, 1), placed('S', 1, 2, 2), placed('Q', 1, 3, 1), placed('P', 0, 3, 3, true)];
const points = (list: readonly Point[]) => list.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');

export function PrintSheet() {
  return <div className="st-sheet">
    <div className="st-sheet-actions">
      <button type="button" className="kit-primary" onClick={() => print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/sat-tukro">খেলায় ফেরো</a>
    </div>
    <h2>সাত টুকরো · কেটে খেলার পাতা</h2>
    <p className="st-sheet-ask">মোটা দাগ ধরে সাতটা টুকরো কাটো (কাঁচি বড়রা ধরবে)। তারপর নিচের ছায়াগুলো বানাও।</p>
    <svg className="st-sheet-square" viewBox="-0.1 -0.1 4.2 4.2" role="img" aria-label="সাত টুকরোর বর্গ, কেটে নেওয়ার জন্য">
      {SQUARE.map((pose, index) => <polygon key={index} points={points(corners(pose))} fill={PIECE_COLOR[index]} fillOpacity={0.35} stroke="#000" strokeWidth={0.03} strokeLinejoin="round" />)}
    </svg>
    <p className="st-sheet-kinds">{SET.length}টা টুকরো: ২টা বড় ত্রিভুজ, ১টা মাঝারি ত্রিভুজ, ২টা ছোট ত্রিভুজ, ১টা বর্গ, ১টা সামান্তরিক।</p>
    <ol className="st-sheet-grid">
      {PRINT_IDS.map(id => {
        const figure = FIGURES.find(f => f.id === id)!, view = figureView(figure);
        return <li key={id}>
          <svg viewBox={`-0.2 -0.2 ${view.width + 0.4} ${view.height + 0.4}`} role="img" aria-label={`${figure.name}-এর ছায়া`}>
            {view.shapes.map((shape, index) => <polygon key={index} points={points(shape.points)} fill="#555" stroke="#555" strokeWidth={0.04} strokeLinejoin="round" />)}
          </svg>
          <b>{figure.name}</b>
        </li>;
      })}
    </ol>
    <p className="st-sheet-foot">একটুখানি · সাত টুকরো। ছায়াগুলো ছোট করে আঁকা: টুকরো পাশে রেখে দেখে দেখে বানাও।</p>
  </div>;
}
