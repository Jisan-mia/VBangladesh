// Original flat SVG art: seven places, simple children and grown-ups whose faces carry the feeling, and the story objects.
import type { ReactNode } from "react";
import { PEOPLE, type Actor, type Mood, type Panel, type Person, type Place, type Pose, type Prop } from "../lib/stories";

const INK = "#2b2118";
const GROUND = 186;

function Face({ mood }: { mood: Mood }) {
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
      : <><circle cx="-6" cy="-87" r={eyeR} fill={INK} /><circle cx="6" cy="-87" r={eyeR} fill={INK} /></>}
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

function Upper({ person, mood, pose }: { person: Person; mood: Mood; pose: Pose | "chair" }) {
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
    <Face mood={mood} />
    {person.glasses && <g fill="none" stroke={INK} strokeWidth="1.4"><circle cx="-6" cy="-87" r="4.6" /><circle cx="6" cy="-87" r="4.6" /><path d="M-1.4 -87 L1.4 -87" /></g>}
    {pose === "blind" && <rect x="-17" y="-91" width="34" height="7" rx="3" fill="#c0392b" />}
  </g>;
}

export function Figure({ who, mood, pose = "stand", x, ground = GROUND }: { who: string; mood: Mood; pose?: Pose; x: number; ground?: number }) {
  const person = PEOPLE[who];
  if (!person) return null;
  const scale = person.size === "small" ? 0.78 : person.size === "adult" ? 1.2 : 1;
  const leg = { stroke: person.dress ? person.skin : person.bottom, strokeWidth: 7, strokeLinecap: "round" as const, fill: "none" };
  const shoe = "#3a2b20";
  let body: ReactNode;
  if (person.wheelchair) {
    body = <>
      <circle cx="-2" cy="-20" r="19" fill="none" stroke="#4a4f55" strokeWidth="3" /><path d="M-2 -39 L-2 -1 M-21 -20 L17 -20" stroke="#8a9096" strokeWidth="1.2" /><circle cx="-2" cy="-20" r="3" fill="#4a4f55" />
      <path d="M-16 -64 L-14 -28 L18 -28" fill="none" stroke="#4a4f55" strokeWidth="3.5" strokeLinejoin="round" /><circle cx="24" cy="-4" r="4" fill="#4a4f55" />
      <path d="M-4 -30 L16 -30 L18 -8" {...leg} /><rect x="13" y="-7" width="11" height="4" rx="2" fill={shoe} />
      <g transform="translate(0 6)"><Upper person={person} mood={mood} pose="chair" /></g>
    </>;
  } else if (pose === "sit") {
    body = <>
      <path d="M-5 -12 L18 -9 L20 -2" {...leg} /><path d="M5 -12 L24 -6" {...leg} />
      <g transform="translate(0 24)"><Upper person={person} mood={mood} pose="stand" /></g>
    </>;
  } else if (pose === "run") {
    body = <g transform="rotate(7 0 -40)">
      <path d="M-4 -34 L-14 -2" {...leg} /><path d="M4 -34 L15 -14 L10 -2" {...leg} />
      <Upper person={person} mood={mood} pose="run" />
    </g>;
  } else {
    body = <>
      <path d="M-5 -34 L-5 -3" {...leg} /><path d="M5 -34 L5 -3" {...leg} />
      <rect x="-11" y="-4" width="10" height="4" rx="2" fill={shoe} /><rect x="1" y="-4" width="10" height="4" rx="2" fill={shoe} />
      <Upper person={person} mood={mood} pose={pose} />
    </>;
  }
  return <g transform={`translate(${x} ${ground}) scale(${scale})`}>{body}</g>;
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

/** One panel as a picture. Decorative for screen readers: the panel text says the same thing. */
export function Scene({ panel, className }: { panel: Panel; className?: string }) {
  const props = panel.props ?? [];
  const kite = props.find(prop => prop[0] === "kite"), reel = props.find(prop => prop[0] === "latai");
  return <svg className={className} viewBox="0 0 320 200" aria-hidden="true" focusable="false">
    {SCENES[panel.place]}
    {kite && reel && <path d={`M${kite[1]} ${kite[2] + 18} Q${(kite[1] + reel[1]) / 2 + 12} ${(kite[2] + reel[2]) / 2 + 20} ${reel[1]} ${reel[2]}`} fill="none" stroke="#6b5a4a" strokeWidth=".8" />}
    {panel.cast.map(([who, mood, x, pose]: Actor) => <Figure key={who} who={who} mood={mood} x={x} pose={pose} />)}
    {props.map((prop, index) => <g key={index} transform={`translate(${prop[1]} ${prop[2]}) scale(${prop[3] ?? 1})`}><PropArt kind={prop[0]} /></g>)}
    {panel.night && <><rect width="320" height="200" fill="#0e1b3a" opacity=".5" /><circle cx="161" cy="40" r="9" fill="#f6e7a1" /></>}
  </svg>;
}

/** One person's head and shoulders, big, for the end screen. */
export function Portrait({ who, mood }: { who: string; mood: Mood }) {
  const person = PEOPLE[who];
  const scale = person?.size === "small" ? 0.78 : person?.size === "adult" ? 1.2 : 1;
  const cy = (person?.wheelchair ? -78 : -84) * scale, half = 32 * scale;
  return <svg className="gm-portrait" viewBox={`${-half} ${cy - half} ${half * 2} ${half * 2}`} aria-hidden="true" focusable="false"><Figure who={who} mood={mood} x={0} ground={0} /></svg>;
}
