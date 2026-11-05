// The ?print view: an A4 sheet of six blank clocks through a day. The child draws the hands; the answers sit small at the bottom.
import { activityOf, PRINT_DAY } from "../lib/day";
import { say } from "../lib/round";
import { levelOf } from "../lib/levels";
import { bn } from "../lib/time";
import { BlankClock } from "./face";

export function PrintSheet() {
  const spec = levelOf(11);
  return <div className="gd-print">
    <div className="gd-print-bar">
      <button type="button" className="kit-primary" onClick={() => window.print()}>প্রিন্ট করো</button>
      <a className="kit-secondary" href="/ghori-dekhi">খেলায় ফিরে যাও</a>
    </div>
    <article className="gd-sheet" aria-label="কাঁটা আঁকার ঘড়ির পাতা">
      <h2>ঘড়িতে কাঁটা এঁকে দাও</h2>
      <p>ছোট কাঁটা ছোট আর মোটা, বড় কাঁটা লম্বা। আগে বড় কাঁটা আঁকো।</p>
      <ol className="gd-sheet-grid">
        {PRINT_DAY.map(({ time, activity }) => <li key={activity}>
          <BlankClock label={`খালি ঘড়ি: ${say(time, spec)}`} />
          <b>{say(time, spec)}</b>
          <span>{activityOf(activity).name}</span>
        </li>)}
      </ol>
      <p className="gd-answers">উত্তর, বড় কাঁটা: {PRINT_DAY.map(({ time }) => `${bn(time.m ? time.m / 5 : 12)}`).join(", ")} নম্বরে। · একটুখানি · ঘড়ি দেখি</p>
    </article>
  </div>;
}
