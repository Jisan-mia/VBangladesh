// Original flat SVG art: seven places, simple children and grown-ups whose faces carry the feeling, and the story objects.
import { useId, type ReactNode } from "react";
import { PEOPLE, type Actor, type Mood, type Panel, type Person, type Place, type Pose, type Prop } from "../lib/stories";

const INK = "#2b2118";
const GROUND = 186;

function Face({ mood, blink }: { mood: Mood; blink: number }) {
  const line = { fill: "none", stroke: INK, strokeWidth: 1.6, strokeLinecap: "round" as const };
  const eyeR = mood === "surprised" ? 2.4 : 1.8;
  const brows = mood === "sad" || mood === "worried"
    ? <><path d="M-9 -91 L-3 -94" {...line} /><path d="M9 -91 L3 -94" {...line} /></>
    : mood === "surprised" ? <><path d="M-9 -94 Q-6 -97 -3 -94" {...line} /><path d="M9 -94 Q6 -97 3 -94" {...line} /></> : null;
  const mouth = {
    happy: <path d="M-6 -79 Q0 -72 6 -79" {...line} />,
    calm: <path d="M-4 -78 Q0 -76 4 -78" {...line} />,
    sad: <path d="M-5 -75 Q0 -80 5 -75" {...line} />,
    worried: <path d="M-5 -77 Q-2.5 -79 0 -77 Q2.5 -75 5 -77" {...line} />,
    surprised: <ellipse cx="0" cy="-77" rx="2.8" ry="3.6" fill={INK} />,
    shy: <path d="M-3 -78 Q0 -76 3 -78" {...line} />,
  }[mood];
  return <g>
    {mood === "shy"
      ? <><path d="M-8 -87 Q-6 -85 -4 -87" {...line} /><path d="M8 -87 Q6 -85 4 -87" {...line} /><circle cx="-10" cy="-81" r="3" fill="#e0786a" opacity=".45" /><circle cx="10" cy="-81" r="3" fill="#e0786a" opacity=".45" /></>
      : <g className="gm-eyes" style={{ animationDelay: `${blink}s` }}><circle cx="-6" cy="-87" r={eyeR} fill={INK} /><circle cx="6" cy="-87" r={eyeR} fill={INK} /></g>}
    {brows}{mouth}
  </g>;
}

function HairBack({ person }: { person: Person }) {
  const c = person.hairColor;
  switch (person.hair) {
    case "long": return <rect x="-18" y="-96" width="36" height="42" rx="14" fill={c} />;
    case "hijab": return <><circle cx="0" cy="-86" r="21" fill={person.scarf} /><path d="M-21 -86 Q-25 -60 -17 -56 L17 -56 Q25 -60 21 -86Z" fill={person.scarf} /></>;
    case "elder": return person.scarf ? <path d="M-20 -86 A20 20 0 0 1 20 -86 L21 -62 L-21 -62Z" fill={person.scarf} stroke="#00000014" /> : null;
    case "pony": return <ellipse cx="17" cy="-82" rx="5" ry="11" fill={c} transform="rotate(-18 17 -82)" />;
    case "braids": return <><ellipse cx="-16" cy="-72" rx="4" ry="11" fill={c} /><ellipse cx="16" cy="-72" rx="4" ry="11" fill={c} /><circle cx="-16" cy="-61" r="2.6" fill="#f2c94c" /><circle cx="16" cy="-61" r="2.6" fill="#f2c94c" /></>;
    case "bun": return <circle cx="0" cy="-103" r="7" fill={c} />;
    default: return null;
  }
}

function HairFront({ person }: { person: Person }) {
  const c = person.hairColor;
  if (person.hair === "hijab") return null;
  if (person.hair === "curly") return <g fill={c}>{[[-12, -94], [-5, -99], [4, -99], [12, -94], [-15, -87], [15, -87]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" />)}</g>;
  if (person.hair === "elder") return <path d="M-16 -86 C-16 -107 16 -107 16 -86 C9 -95 -9 -95 -16 -86Z" fill={c} />;
  return <path d="M-17 -84 C-18 -109 18 -109 17 -84 C12 -94 -4 -97 -17 -84Z" fill={c} />;
}

function Upper({ person, mood, pose, blink }: { person: Person; mood: Mood; pose: Pose | "chair"; blink: number }) {
  const arm = { stroke: person.skin, strokeWidth: 6, strokeLinecap: "round" as const, fill: "none" };
  const arms = pose === "run" ? ["M-14 -62 L-24 -46", "M14 -62 L23 -72"] : pose === "blind" ? ["M-14 -62 L-27 -70", "M14 -62 L27 -70"] : pose === "chair" ? ["M-14 -62 L-14 -40", "M14 -62 L18 -40"] : ["M-14 -62 L-20 -38", "M14 -62 L20 -38"];
  const headR = person.hair === "hijab" ? 13.5 : 16;
  return <g>
    <HairBack person={person} />
    {arms.map(d => <path key={d} d={d} {...arm} />)}
    {person.dress
      ? <path d="M-15 -67 L15 -67 L21 -26 L-21 -26Z" fill={person.top} stroke="#00000018" strokeLinejoin="round" />
      : <><rect x="-15" y="-68" width="30" height="34" rx="7" fill={person.top} stroke="#00000018" /><rect x="-14" y="-38" width="28" height="7" fill={person.bottom} /></>}
    {person.dress && person.scarf && person.hair !== "hijab" && <path d="M-15 -66 L-9 -66 L18 -34 L12 -30Z" fill={person.scarf} opacity=".9" />}
    {person.hair === "hijab" && <path d="M-17 -70 Q0 -60 17 -70 L15 -58 Q0 -52 -15 -58Z" fill={person.scarf} />}
    <rect x="-4" y="-73" width="8" height="7" fill={person.skin} />
    <circle cx="0" cy="-86" r={headR} fill={person.skin} />
    <HairFront person={person} />
    <Face mood={mood} blink={blink} />
    {person.glasses && <g fill="none" stroke={INK} strokeWidth="1.4"><circle cx="-6" cy="-87" r="4.6" /><circle cx="6" cy="-87" r="4.6" /><path d="M-1.4 -87 L1.4 -87" /></g>}
    {pose === "blind" && <rect x="-17" y="-91" width="34" height="7" rx="3" fill="#c0392b" />}
  </g>;
}

export function Figure({ who, mood, pose = "stand", x, ground = GROUND }: { who: string; mood: Mood; pose?: Pose; x: number; ground?: number }) {
  const person = PEOPLE[who];
  if (!person) return null;
  const blink = -((x * 7) % 50) / 10, breathe = -((x * 3) % 30) / 10;
  const scale = person.size === "small" ? 0.78 : person.size === "adult" ? 1.2 : 1;
  const leg = { stroke: person.dress ? person.skin : person.bottom, strokeWidth: 7, strokeLinecap: "round" as const, fill: "none" };
  const shoe = "#3a2b20";
  let body: ReactNode;
  if (person.wheelchair) {
    body = <>
      <circle cx="-2" cy="-20" r="19" fill="none" stroke="#4a4f55" strokeWidth="3" /><path d="M-2 -39 L-2 -1 M-21 -20 L17 -20" stroke="#8a9096" strokeWidth="1.2" /><circle cx="-2" cy="-20" r="3" fill="#4a4f55" />
      <path d="M-16 -64 L-14 -28 L18 -28" fill="none" stroke="#4a4f55" strokeWidth="3.5" strokeLinejoin="round" /><circle cx="24" cy="-4" r="4" fill="#4a4f55" />
      <path d="M-4 -30 L16 -30 L18 -8" {...leg} /><rect x="13" y="-7" width="11" height="4" rx="2" fill={shoe} />
      <g transform="translate(0 6)"><Upper person={person} mood={mood} pose="chair" blink={blink} /></g>
    </>;
  } else if (pose === "sit") {
    body = <>
      <path d="M-5 -12 L18 -9 L20 -2" {...leg} /><path d="M5 -12 L24 -6" {...leg} />
      <g transform="translate(0 24)"><Upper person={person} mood={mood} pose="stand" blink={blink} /></g>
    </>;
  } else if (pose === "run") {
    body = <g transform="rotate(7 0 -40)">
      <path d="M-4 -34 L-14 -2" {...leg} /><path d="M4 -34 L15 -14 L10 -2" {...leg} />
      <Upper person={person} mood={mood} pose="run" blink={blink} />
    </g>;
  } else {
    body = <>
      <path d="M-5 -34 L-5 -3" {...leg} /><path d="M5 -34 L5 -3" {...leg} />
      <rect x="-11" y="-4" width="10" height="4" rx="2" fill={shoe} /><rect x="1" y="-4" width="10" height="4" rx="2" fill={shoe} />
      <Upper person={person} mood={mood} pose={pose} blink={blink} />
    </>;
  }
  return <g transform={`translate(${x} ${ground}) scale(${scale})`}>
    <ellipse className="gm-shadow" cx={pose === "sit" ? 8 : 0} cy="1" rx={person.wheelchair ? 24 : 15} ry="3.2" fill="#2b1d1433" />
    <g className="gm-fig" style={{ animationDelay: `${breathe}s` }}>{body}</g>
  </g>;
}

function PropArt({ kind }: { kind: Prop[0] }) {
  switch (kind) {
    case "tiffin": return <><path d="M-14 0 Q-13 12 0 12 Q13 12 14 0Z" fill="#b8c0c8" stroke="#8a939c" /><ellipse cx="0" cy="0" rx="14" ry="4" fill="#d9dee3" stroke="#8a939c" /></>;
    case "spill": return <><ellipse cx="-8" cy="0" rx="22" ry="5" fill="#e3b23c" /><circle cx="-16" cy="-1" r="2" fill="#c98a1e" /><circle cx="-2" cy="1" r="1.6" fill="#7da33c" /><g transform="translate(16 -6) rotate(70)"><path d="M-12 0 Q-11 10 0 10 Q11 10 12 0Z" fill="#b8c0c8" stroke="#8a939c" /></g></>;
    case "roti": return <><ellipse cx="-3" cy="2" rx="13" ry="4" fill="#d9b06c" stroke="#b58848" /><ellipse cx="3" cy="-2" rx="13" ry="4" fill="#e9c98c" stroke="#b58848" /><circle cx="6" cy="-3" r="2" fill="#e3b23c" /></>;
    case "cup": return <><ellipse cx="0" cy="0" rx="13" ry="3" fill="#fff" stroke="#9aa5ad" /><path d="M-8 -15 L8 -15 L6 -1 L-6 -1Z" fill="#fff" stroke="#9aa5ad" /><path d="M8 -12 q6 1 0 7" fill="none" stroke="#9aa5ad" strokeWidth="2" /><circle cx="0" cy="-8" r="2.6" fill="#3567a8" /></>;
    case "cupBroken": return <><g transform="translate(-8 0) rotate(-22)"><path d="M-8 -14 L0 -14 L0 0 L-6 0Z" fill="#fff" stroke="#9aa5ad" /><circle cx="-1" cy="-7" r="2" fill="#3567a8" /></g><g transform="translate(9 0) rotate(28)"><path d="M0 -14 L8 -14 L6 0 L0 0Z" fill="#fff" stroke="#9aa5ad" /><circle cx="1" cy="-7" r="2" fill="#3567a8" /></g></>;
    case "glass": return <><path d="M-6 -16 L6 -16 L5 0 L-5 0Z" fill="#c5ccd3" stroke="#8a939c" /><rect x="-5.6" y="-13" width="11.2" height="3" fill="#a0612d" /></>;
    case "ball": return <><circle r="6" fill="#c0392b" /><path d="M-4 -4 Q0 0 -4 4 M4 -4 Q0 0 4 4" stroke="#fff" strokeWidth=".8" fill="none" /></>;
    case "kite": return <><path d="M0 -16 L12 0 L0 18 L-12 0Z" fill="#d63a2f" stroke="#8e1f17" /><path d="M0 -16 L0 18 M-12 0 L12 0" stroke="#8e1f17" strokeWidth=".8" /><path d="M0 18 q-6 6 0 10 q6 4 0 10" fill="none" stroke="#f2c94c" strokeWidth="2" /></>;
    case "latai": return <><rect x="-7" y="-7" width="14" height="14" rx="2" fill="#b07a3c" stroke="#7a4f22" /><circle r="4" fill="#f5f0e6" /></>;
    case "note": return <><rect x="-13" y="-7" width="26" height="14" rx="1.5" fill="#a8d0a8" stroke="#4f7a50" /><text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2f5132">১০</text></>;
    case "achar": return <><path d="M-7 -11 L7 -11 L9 10 L-9 10Z" fill="#e67e22" stroke="#a6561a" /><rect x="-8" y="-3" width="16" height="5" fill="#fff3d6" /></>;
    case "bat": return <g transform="rotate(-28)"><rect x="-4.5" y="-30" width="9" height="30" rx="2" fill="#dcbb7d" stroke="#a88648" /><rect x="-1.6" y="-42" width="3.2" height="13" fill="#333" /></g>;
    case "stumps": return <g fill="#efe2bf" stroke="#b4a274"><rect x="-9" y="-30" width="3.4" height="30" /><rect x="-1.7" y="-30" width="3.4" height="30" /><rect x="5.6" y="-30" width="3.4" height="30" /><rect x="-9" y="-32" width="18" height="2.2" /></g>;
    case "glasses": return <g fill="none" stroke={INK} strokeWidth="1.4"><circle cx="-5" cy="0" r="4.2" /><circle cx="5" cy="0" r="4.2" /><path d="M-1 0 L1 0" /></g>;
    case "medal": return <><path d="M-7 -14 L0 2 L7 -14" fill="none" stroke="#c0392b" strokeWidth="3" /><circle cx="0" cy="6" r="6" fill="#f2c94c" stroke="#b8902a" /></>;
    case "tape": return <><rect x="-34" y="-12" width="3" height="56" fill="#7a5a3a" /><rect x="31" y="-12" width="3" height="56" fill="#7a5a3a" /><path d="M-31 0 L31 0" stroke="#d63a2f" strokeWidth="3" /></>;
    case "bag": return <><path d="M-15 -14 Q0 -30 15 -14" fill="none" stroke="#8a6a3a" strokeWidth="2" /><ellipse cx="6" cy="-15" rx="5" ry="9" fill="#9cc56b" transform="rotate(20 6 -15)" /><path d="M-15 -14 L15 -14 L12 12 L-12 12Z" fill="#c9a66b" stroke="#8a6a3a" /></>;
    case "onion": return <><circle r="6" fill="#b5577a" /><path d="M0 -6 L1 -10" stroke="#7a9a3a" strokeWidth="1.5" /></>;
    case "mango": return <><ellipse rx="9" ry="7" fill="#f2b632" stroke="#c98a1e" /><ellipse cx="-5" cy="-6" rx="3" ry="1.5" fill="#4f8f3a" /></>;
    case "mangoPlate": return <><ellipse rx="28" ry="6" fill="#fff" stroke="#b9c3cc" /><ellipse cx="-8" cy="-4" rx="12" ry="6" fill="#f5a623" stroke="#c98a1e" /><ellipse cx="13" cy="-3" rx="7" ry="4" fill="#f5a623" stroke="#c98a1e" /></>;
    case "mangoBig": return <ellipse rx="12" ry="6" fill="#f5a623" stroke="#c98a1e" />;
    case "mangoSmall": return <ellipse rx="7" ry="4" fill="#f5a623" stroke="#c98a1e" />;
    case "gloves": return <><ellipse cx="-6" cy="0" rx="6" ry="4" fill="#e9dcc0" stroke="#a89878" /><ellipse cx="6" cy="0" rx="6" ry="4" fill="#e9dcc0" stroke="#a89878" /></>;
  }
}

const SCENES: Record<Place, ReactNode> = {
  class: <>
    <rect width="320" height="200" fill="#f1e3bf" /><rect y="160" width="320" height="40" fill="#c19a6b" /><rect y="158" width="320" height="3" fill="#a77e52" />
    <rect x="86" y="18" width="150" height="60" fill="#2f5d46" stroke="#8b5a2b" strokeWidth="4" /><text x="161" y="54" textAnchor="middle" fontSize="16" fill="#e8efe9">১ + ১ = ২</text>
    <rect x="12" y="26" width="46" height="66" fill="#cfe8f5" stroke="#8b5a2b" strokeWidth="3" /><path d="M24 26 V92 M35 26 V92 M46 26 V92" stroke="#6b5a4a" strokeWidth="1.5" />
    <rect x="266" y="30" width="40" height="28" fill="#fff8e6" stroke="#b7a37a" /><path d="M272 38 H300 M272 44 H296 M272 50 H290" stroke="#b7a37a" />
    <rect x="10" y="134" width="300" height="7" rx="2" fill="#9c6b3f" /><rect x="18" y="141" width="5" height="24" fill="#7a5230" /><rect x="297" y="141" width="5" height="24" fill="#7a5230" />
  </>,
  home: <>
    <rect width="320" height="200" fill="#e7eedf" /><rect y="166" width="320" height="34" fill="#cfae84" />
    <rect x="132" y="22" width="58" height="48" fill="#cfe8f5" stroke="#7a5a3a" strokeWidth="3" /><path d="M132 22 Q140 46 132 70 M190 22 Q182 46 190 70" fill="#e98b6d" stroke="#e98b6d" strokeWidth="6" />
    <rect x="0" y="128" width="104" height="14" fill="#f0e6d2" /><path d="M8 132 H96 M8 137 H96" stroke="#d98c8c" strokeWidth="2" /><rect x="0" y="141" width="104" height="9" fill="#8b5a2b" /><rect x="6" y="150" width="6" height="34" fill="#7a4a22" /><rect x="92" y="150" width="6" height="34" fill="#7a4a22" />
    <rect x="240" y="129" width="64" height="6" fill="#8b5a2b" /><rect x="246" y="135" width="5" height="50" fill="#7a4a22" /><rect x="293" y="135" width="5" height="50" fill="#7a4a22" />
  </>,
  uthan: <>
    <rect width="320" height="200" fill="#d6ecf5" /><rect y="150" width="320" height="50" fill="#dcb983" />
    <rect x="0" y="72" width="108" height="92" fill="#c98f5a" /><rect x="40" y="110" width="26" height="54" fill="#6b4226" />
    <path d="M-6 74 L114 74 L100 46 L8 46Z" fill="#8fa3b0" /><path d="M20 48 L14 74 M40 46 V74 M60 46 V74 M80 46 V74 M98 48 L104 74" stroke="#73879a" />
    <rect x="80" y="128" width="6" height="28" fill="#4d6b7a" /><path d="M86 132 L96 134 M80 132 L66 124" stroke="#4d6b7a" strokeWidth="3" strokeLinecap="round" />
    <rect x="270" y="70" width="14" height="96" fill="#7a4a2a" /><circle cx="277" cy="58" r="40" fill="#4f8f3a" /><circle cx="244" cy="76" r="24" fill="#5c9c44" /><circle cx="306" cy="80" r="24" fill="#5c9c44" />
    <ellipse cx="258" cy="70" rx="4" ry="5" fill="#f2b632" /><ellipse cx="292" cy="48" rx="4" ry="5" fill="#f2b632" /><ellipse cx="300" cy="86" rx="4" ry="5" fill="#e3c13c" />
  </>,
  roof: <>
    <rect width="320" height="200" fill="#cde5f3" />
    <rect x="70" y="112" width="44" height="60" fill="#b9c3cc" /><rect x="120" y="98" width="36" height="74" fill="#a9b4bd" /><rect x="230" y="118" width="56" height="54" fill="#b9c3cc" /><rect x="292" y="104" width="30" height="68" fill="#a9b4bd" />
    <g fill="#8e9ba6"><rect x="78" y="122" width="8" height="8" /><rect x="96" y="122" width="8" height="8" /><rect x="128" y="110" width="8" height="8" /><rect x="240" y="128" width="8" height="8" /><rect x="262" y="128" width="8" height="8" /></g>
    <rect x="16" y="108" width="46" height="56" rx="5" fill="#3a3d42" /><ellipse cx="39" cy="108" rx="23" ry="5" fill="#55595f" />
    <rect y="164" width="320" height="6" fill="#c4b8a8" /><rect y="170" width="320" height="30" fill="#d8cfc2" />
  </>,
  math: <>
    <rect width="320" height="200" fill="#d3ecf7" />
    <g fill="#3f7f45">{[10, 46, 84, 120, 160, 198, 236, 274, 312].map(x => <circle key={x} cx={x} cy={118} r={22} />)}</g>
    <rect y="126" width="320" height="74" fill="#93c66e" /><path d="M0 150 H320 M0 176 H320" stroke="#a7d384" strokeWidth="6" />
  </>,
  goli: <>
    <rect width="320" height="200" fill="#d8ecf4" /><path d="M0 22 Q160 40 320 18 M0 30 Q160 50 320 28" stroke="#3a3a3a" strokeWidth="1" fill="none" />
    <rect x="0" y="62" width="122" height="104" fill="#e5d3b3" /><rect x="0" y="56" width="122" height="8" fill="#c9b08a" /><text x="60" y="84" textAnchor="middle" fontSize="11" fill="#6b5236">স্কুল</text>
    <g stroke="#3d4a5a" strokeWidth="2.5"><path d="M62 100 H120 M62 166 V100 M76 166 V100 M90 166 V100 M104 166 V100 M118 166 V100" /></g>
    <rect y="164" width="320" height="36" fill="#cdc4b5" />
    <rect x="236" y="118" width="72" height="34" rx="3" fill="#d35400" /><g fill="#f5d7a1" stroke="#a6561a"><rect x="244" y="104" width="12" height="16" rx="3" /><rect x="262" y="102" width="12" height="18" rx="3" /><rect x="280" y="104" width="12" height="16" rx="3" /></g>
    <circle cx="250" cy="160" r="9" fill="#3a3a3a" /><circle cx="296" cy="160" r="9" fill="#3a3a3a" />
  </>,
  stairs: <>
    <rect width="320" height="200" fill="#e9dfcf" /><rect y="184" width="320" height="16" fill="#cbbba3" />
    <rect x="18" y="72" width="50" height="112" fill="#7b5434" /><rect x="36" y="88" width="14" height="8" fill="#e9dfcf" /><circle cx="60" cy="130" r="2.5" fill="#e9c46a" />
    <path d="M150 184 V170 H170 V156 H190 V142 H210 V128 H230 V114 H250 V100 H270 V86 H290 V72 H320 V184Z" fill="#cbbba3" stroke="#a8977c" />
    <path d="M150 140 L320 30" stroke="#6b5a4a" strokeWidth="3" /><path d="M170 127 V160 M210 101 V134 M250 75 V108 M290 49 V82" stroke="#6b5a4a" strokeWidth="1.5" />
  </>,
};

const SKY: Record<Place, string> = { class: "#efdcae", home: "#dfe7d4", uthan: "#bfe0f0", roof: "#b6d9ee", math: "#bfe3f4", goli: "#c6e4f0", stairs: "#ddd0bb" };
const OUTDOOR = new Set<Place>(["uthan", "roof", "math", "goli"]);

/** A feeling as a small picture, centred on 0 0, about 20 units wide: shape and colour both say it. */
export function MoodGlyph({ mood }: { mood: Mood }) {
  switch (mood) {
    case "happy": return <g><circle r="5" fill="#f6b823" /><g stroke="#f6b823" strokeWidth="1.8" strokeLinecap="round">{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M0 -7.5 L0 -10" transform={`rotate(${angle})`} />)}</g></g>;
    case "sad": return <path d="M0 -9 C5 -2 7 1 7 4 A7 7 0 0 1 -7 4 C-7 1 -5 -2 0 -9Z" fill="#4d90d6" stroke="#2f6aa8" strokeWidth="1" />;
    case "worried": return <g><path d="M-8 3 A4.5 4.5 0 0 1 -6 -5 A6 6 0 0 1 5 -6 A5 5 0 0 1 8 3Z" fill="#a9b4c0" stroke="#7d8996" strokeWidth="1" /><path d="M-3 6 Q-1 8 -3 10 M3 6 Q5 8 3 10" fill="none" stroke="#4d90d6" strokeWidth="1.6" strokeLinecap="round" /></g>;
    case "surprised": return <path d="M0 -10 L2.6 -3.6 L9.5 -3 L4.2 1.6 L5.9 8.4 L0 4.8 L-5.9 8.4 L-4.2 1.6 L-9.5 -3 L-2.6 -3.6Z" fill="#f08a24" stroke="#c46a12" strokeWidth="1" strokeLinejoin="round" />;
    case "shy": return <path d="M0 8 C-12 -1 -8 -9 -3.5 -8 C-1.5 -7.5 0 -5.5 0 -4.5 C0 -5.5 1.5 -7.5 3.5 -8 C8 -9 12 -1 0 8Z" fill="#e86a8a" stroke="#c4476a" strokeWidth="1" strokeLinejoin="round" />;
    default: return <g><path d="M-8 6 C-8 -4 0 -9 8 -9 C8 0 3 7 -8 6Z" fill="#6bb36b" stroke="#4a8d4a" strokeWidth="1" strokeLinejoin="round" /><path d="M-6 4 L4 -5" stroke="#4a8d4a" strokeWidth="1" fill="none" /></g>;
  }
}

/** Slow things in the air, in CSS only: clouds outside, dust in the light inside, a leaf under the tree. */
function Ambient({ place }: { place: Place }) {
  if (OUTDOOR.has(place)) {
    return <g className="gm-amb">
      <g className="gm-cloud"><ellipse cx="60" cy="-28" rx="22" ry="7" fill="#fff" opacity=".85" /><ellipse cx="74" cy="-33" rx="14" ry="7" fill="#fff" opacity=".85" /></g>
      <g className="gm-cloud gm-cloud-b"><ellipse cx="236" cy="-12" rx="18" ry="5.5" fill="#fff" opacity=".8" /><ellipse cx="246" cy="-17" rx="11" ry="5.5" fill="#fff" opacity=".8" /></g>
      {place === "uthan" && <ellipse className="gm-leaf" cx="262" cy="64" rx="3.4" ry="1.7" fill="#6ba24a" />}
    </g>;
  }
  const beam = place === "class" ? "M12 26 L58 26 L110 170 L40 170Z" : place === "home" ? "M132 22 L190 22 L228 168 L150 168Z" : "";
  return <g className="gm-amb">
    {beam && <path d={beam} fill="#fff6d6" opacity=".28" />}
    {[[70, 70], [96, 104], [120, 62], [150, 120], [48, 128]].map(([x, y], index) => <circle key={index} className="gm-mote" cx={x} cy={y} r="1.5" fill="#fffbe8" style={{ animationDelay: `${-index * 1.7}s` }} />)}
  </g>;
}

/**
 * One panel as a picture. Decorative for screen readers: the panel text says the same thing.
 * `tall` shows 44 more units of sky or ceiling above, for a phone held upright. `bubble` names the person whose feeling
 * shows as a small picture over their head. `view` crops the picture (a cover) and `slice` fills the frame.
 */
export function Scene({ panel, className, tall, bubble, view, slice }: { panel: Panel; className?: string; tall?: boolean; bubble?: string; view?: string; slice?: boolean }) {
  const id = useId().replace(/:/g, "");
  const props = panel.props ?? [];
  const kite = props.find(prop => prop[0] === "kite"), reel = props.find(prop => prop[0] === "latai");
  const feeling = bubble ? panel.cast.find(actor => actor[0] === bubble) : undefined;
  const person = feeling ? PEOPLE[feeling[0]] : undefined;
  let mark: ReactNode = null;
  if (feeling && person && feeling[1] !== "calm") {
    const scale = person.size === "small" ? 0.78 : person.size === "adult" ? 1.2 : 1;
    const top = GROUND - (feeling[3] === "sit" ? 88 : person.wheelchair ? 100 : 112) * scale - 17;
    const cx = Math.max(16, Math.min(304, feeling[2] + 24 * scale)), cy = Math.max(-26, top);
    mark = <g transform={`translate(${cx} ${cy})`}><g className="gm-bubble"><path d="M-5 9 L-9 17 L3 11Z" fill="#fff" stroke="#2b211833" /><circle r="13" fill="#fff" stroke="#2b211833" strokeWidth="1.2" /><MoodGlyph mood={feeling[1]} /></g></g>;
  }
  return <svg className={className} viewBox={view ?? (tall ? "0 -44 320 244" : "0 0 320 200")} preserveAspectRatio={slice ? "xMidYMax slice" : "xMidYMid meet"} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff9e0" stopOpacity=".42" /><stop offset=".6" stopColor="#fff9e0" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stopColor="#2b1d14" stopOpacity="0" /><stop offset="1" stopColor="#2b1d14" stopOpacity=".2" /></linearGradient>
    </defs>
    <rect x="-2" y="-48" width="324" height="50" fill={SKY[panel.place]} />
    {SCENES[panel.place]}
    <Ambient place={panel.place} />
    {kite && reel && <path d={`M${kite[1]} ${kite[2] + 18} Q${(kite[1] + reel[1]) / 2 + 12} ${(kite[2] + reel[2]) / 2 + 20} ${reel[1]} ${reel[2]}`} fill="none" stroke="#6b5a4a" strokeWidth=".8" />}
    {panel.cast.map(([who, mood, x, pose]: Actor) => <Figure key={who} who={who} mood={mood} x={x} pose={pose} />)}
    {props.map((prop, index) => <g key={index} transform={`translate(${prop[1]} ${prop[2]}) scale(${prop[3] ?? 1})`}><g className={`gm-prop gm-prop-${prop[0]}`}><PropArt kind={prop[0]} /></g></g>)}
    {panel.night && <><rect x="-2" y="-48" width="324" height="250" fill="#0e1b3a" opacity=".5" /><circle cx="161" cy="40" r="9" fill="#f6e7a1" /></>}
    <rect x="-2" y="-48" width="324" height="250" fill={`url(#${id}l)`} />
    <rect x="-2" y="-48" width="324" height="250" fill={`url(#${id}v)`} />
    {mark}
  </svg>;
}

/** One person's head and shoulders, big, with their feeling as a picture beside them, for the end page. */
export function Portrait({ who, mood, className }: { who: string; mood: Mood; className?: string }) {
  const person = PEOPLE[who];
  const scale = person?.size === "small" ? 0.78 : person?.size === "adult" ? 1.2 : 1;
  const cy = (person?.wheelchair ? -78 : -84) * scale, half = 34 * scale;
  return <svg className={className} viewBox={`${-half * 1.2} ${cy - half * 1.75} ${half * 3} ${half * 2.95}`} aria-hidden="true" focusable="false">
    <clipPath id={`gm-pc-${who}`}><circle cx="0" cy={cy} r={half} /></clipPath>
    <circle cx="0" cy={cy} r={half} fill="#fff6e3" stroke="#e3cfa0" strokeWidth="1.5" />
    <g clipPath={`url(#gm-pc-${who})`}><Figure who={who} mood={mood} x={0} ground={0} /></g>
    <g transform={`translate(${half * 0.95} ${cy - half * 0.95}) scale(${half / 22})`}><g className="gm-bubble"><circle r="14" fill="#fff" stroke="#2b211833" strokeWidth="1.2" /><MoodGlyph mood={mood} /></g></g>
  </svg>;
}
