// Original SVG art: a sky for each part of the day, one object for each activity, and the ghost finger. No people, no textbook look.
import type { ActivityId } from "../lib/day";
import type { Part } from "../lib/time";

const INK = "#24323f";

const SKY: Record<Part, [string, string]> = {
  "ভোর": ["#f6cfa8", "#cfe3f3"], "সকাল": ["#a9dcff", "#e8f6ff"], "দুপুর": ["#7cc6f7", "#d5efff"],
  "বিকেল": ["#ffcf8a", "#ffeccc"], "সন্ধ্যা": ["#e9805a", "#5d4e8c"], "রাত": ["#1b2350", "#34417c"],
};

/** The sky tells the part of the day: low sun, high sun, slanting sun, setting sun, or the moon. */
function Sky({ part }: { part: Part }) {
  const [top, low] = SKY[part], id = `gd-sky-${part === "রাত" ? "night" : top.slice(1)}`;
  const night = part === "রাত";
  const sun = { "ভোর": [24, 66], "সকাল": [30, 34], "দুপুর": [60, 18], "বিকেল": [92, 36], "সন্ধ্যা": [96, 70], "রাত": [0, 0] }[part];
  return <>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={night ? top : low} /><stop offset="1" stopColor={night ? low : top} /></linearGradient></defs>
    <rect width="120" height="80" fill={`url(#${id})`} />
    {night ? <>
      <circle cx="26" cy="22" r="11" fill="#fff4c9" /><circle cx="31" cy="18" r="10" fill={top} />
      {[[60, 12], [86, 26], [104, 10], [48, 34], [112, 44]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.6" fill="#fff" opacity=".8" />)}
    </> : <circle cx={sun[0]} cy={sun[1]} r={part === "দুপুর" ? 10 : 12} fill={part === "সন্ধ্যা" ? "#ffb15c" : "#ffd24d"} />}
    <rect y="70" width="120" height="10" fill={night ? "#26315f" : part === "সন্ধ্যা" ? "#7a5a6a" : "#8cc56a"} />
  </>;
}

/** The thing that stands for each activity, drawn in a 120×80 box over the sky. */
function Thing({ id }: { id: ActivityId }) {
  const s = { stroke: INK, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (id) {
    case "wake": return <g {...s}><rect x="40" y="48" width="62" height="22" rx="4" fill="#f4a3a3" /><rect x="34" y="40" width="22" height="14" rx="6" fill="#fff" /><path d="M64 48 q8 -8 16 0" fill="none" /></g>;
    case "sleep": return <g {...s}><rect x="34" y="46" width="70" height="24" rx="4" fill="#8fa8e8" /><rect x="38" y="38" width="22" height="14" rx="6" fill="#fff" /><path d="M30 70 V22 H108 V70" fill="none" stroke="#ffffffaa" strokeDasharray="3 3" /></g>;
    case "breakfast": return <g {...s}><ellipse cx="66" cy="60" rx="34" ry="11" fill="#fff" /><circle cx="54" cy="54" r="11" fill="#e9c48a" /><circle cx="70" cy="56" r="11" fill="#e9c48a" /><ellipse cx="86" cy="56" rx="8" ry="6" fill="#fff" /><circle cx="86" cy="56" r="3" fill="#ffc531" stroke="none" /></g>;
    case "brush": return <g {...s}><rect x="36" y="44" width="22" height="26" rx="4" fill="#9ad3e8" /><path d="M64 70 L96 30" strokeWidth="5" stroke="#3b8fd9" /><rect x="90" y="22" width="12" height="9" rx="2" fill="#fff" transform="rotate(-50 96 26)" /></g>;
    case "moktob": return <g {...s}><path d="M44 70 L84 44 M84 70 L44 44" strokeWidth="4" stroke="#8a5a32" /><path d="M42 46 q11 -8 22 0 q11 -8 22 0 v-12 q-11 -8 -22 0 q-11 -8 -22 0 z" fill="#fff" /><path d="M64 46 V34" /></g>;
    case "school": return <g {...s}><rect x="44" y="34" width="40" height="36" rx="8" fill="#e8574c" /><path d="M54 34 q10 -14 20 0" fill="none" /><rect x="50" y="52" width="28" height="12" rx="3" fill="#f59a8f" /></g>;
    case "tiffin": return <g {...s}><rect x="46" y="40" width="36" height="10" rx="3" fill="#cfd8de" /><rect x="46" y="50" width="36" height="10" rx="3" fill="#dfe6ea" /><rect x="46" y="60" width="36" height="10" rx="3" fill="#cfd8de" /><path d="M50 40 V30 H78 V40" fill="none" /></g>;
    case "chuti": return <g {...s}><path d="M48 62 q0 -26 16 -26 q16 0 16 26 z" fill="#ffc531" /><rect x="44" y="62" width="40" height="5" rx="2" fill="#ffc531" /><circle cx="64" cy="70" r="3" fill={INK} /><path d="M64 36 V30" /></g>;
    case "lunch": return <g {...s}><ellipse cx="60" cy="60" rx="30" ry="10" fill="#fff" /><path d="M42 58 q18 -20 36 0 z" fill="#fffdf2" /><path d="M86 62 h18 l-3 8 h-12 z" fill="#f2b33d" /></g>;
    case "draw": return <g {...s}><rect x="38" y="36" width="44" height="34" rx="2" fill="#fff" /><path d="M46 60 q8 -14 16 0 t16 -4" fill="none" stroke="#2f9e44" /><circle cx="70" cy="46" r="5" fill="#ffd24d" stroke="none" /><path d="M86 70 L102 40" strokeWidth="6" stroke="#e8574c" /></g>;
    case "bath": return <g {...s}><path d="M40 44 h40 l-5 26 h-30 z" fill="#4dabf7" /><ellipse cx="60" cy="44" rx="20" ry="4" fill="#a5d8ff" /><rect x="86" y="52" width="16" height="18" rx="3" fill="#ffa94d" /><path d="M102 56 h5 v8 h-5" fill="none" /></g>;
    case "play": return <g {...s}><circle cx="64" cy="54" r="16" fill="#fff" /><path d="M64 46 l7 5 -3 8 h-8 l-3 -8 z" fill={INK} /></g>;
    case "study": return <g {...s}><path d="M36 66 q14 -8 28 0 q14 -8 28 0 v-20 q-14 -8 -28 0 q-14 -8 -28 0 z" fill="#fff" /><path d="M64 66 V46" /><path d="M96 70 V44 M88 44 h16 l-4 -10 h-8 z" fill="#ffd24d" /></g>;
    case "dinner": return <g {...s}><ellipse cx="58" cy="60" rx="28" ry="10" fill="#fff" /><path d="M42 58 q16 -18 32 0 z" fill="#fffdf2" /><path d="M90 42 h14 l-2 28 h-10 z" fill="#d0ebff" /></g>;
  }
}

export function Scene({ activity, part }: { activity: ActivityId; part: Part }) {
  return <svg className="gd-scene-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false"><Sky part={part} /><Thing id={activity} /></svg>;
}

/** A pointing hand, fingertip at (0,0), for the "watch me first" demo. */
export function GhostFingerPath() {
  return <path d="M0 0 C-3 0 -4 3 -4 6 V20 L-7 18 C-11 15 -15 19 -12 23 L-3 36 C0 41 5 43 11 43 H15 C22 43 27 38 27 31 V17 C27 13 22 13 21 17 C21 12 16 12 15 16 C15 11 10 11 9 15 V6 C9 2 5 0 3 0 Z"
    fill="#fff" stroke="#24323f" strokeWidth="2.2" strokeLinejoin="round" />;
}
