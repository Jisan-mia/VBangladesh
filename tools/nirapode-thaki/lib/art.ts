// Every picture in নিরাপদে থাকি: original flat SVG. Icons sit in a 64×64 box, scenes in 320×160.
// One source for the page (inline <svg>) and the parent's card (a data: URL, so nothing is fetched).
// Safety rule: every drawing shows a place, a thing or a safe action. No one is hurt, in the water or near flames.

const INK = "#2f2a3a";
const o = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const thin = `stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"`;
const SKIN = { a: "#c68a5e", b: "#8d5a3b", c: "#e0ac7e" };
const ACCENT = "#e8890c";

/** A thick outlined stroke (arms, legs, bamboo): the ink line underneath, the colour on top. */
const limb = (d: string, fill: string, width = 5) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width + 3.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const arrow = (d: string, color = ACCENT) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const at = (x: number, y: number, s: number, inner: string) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
const mirror = (inner: string, width = 64) => `<g transform="translate(${width} 0) scale(-1 1)">${inner}</g>`;

type Look = { skin: string; shirt: string; pants: string; hair: string; glasses?: boolean; long?: boolean };
type Pose = "stand" | "walk" | "run" | "jump" | "call" | "hold" | "holdL" | "reach" | "reel";
const KID: Look = { skin: SKIN.a, shirt: "#3f8fd2", pants: "#36404f", hair: "#2b2018" };
const GIRL: Look = { skin: SKIN.b, shirt: "#e0607e", pants: "#5b4a8a", hair: "#1e1611", long: true };
const SPECS: Look = { skin: SKIN.c, shirt: "#f2b632", pants: "#2f5d50", hair: "#3a2a1c", glasses: true };
const AMMU: Look = { skin: SKIN.a, shirt: "#2e9e8a", pants: "#2e9e8a", hair: "#1e1611", long: true };
const ABBU: Look = { skin: SKIN.b, shirt: "#f4f1ea", pants: "#4a5568", hair: "#1e1611" };

const ARMS: Record<Pose, [[number, number], [number, number]]> = {
  stand: [[10, 47], [30, 47]], walk: [[7, 43], [33, 45]], run: [[4, 35], [35, 45]], jump: [[5, 4], [35, 4]],
  call: [[16, 19], [24, 19]], hold: [[10, 47], [38, 50]], holdL: [[1, 42], [30, 47]], reach: [[10, 47], [42, 32]], reel: [[17, 40], [25, 40]],
};
const LEGS: Record<Pose, [[number, number], [number, number]]> = {
  stand: [[16, 77], [24, 77]], walk: [[10, 76], [29, 76]], run: [[5, 71], [33, 76]], jump: [[11, 68], [29, 68]],
  call: [[16, 77], [24, 77]], hold: [[16, 77], [24, 77]], holdL: [[16, 77], [24, 77]], reach: [[16, 77], [24, 77]], reel: [[16, 77], [24, 77]],
};

/** A child or grown-up in a 40×80 box. */
function person(look: Look, pose: Pose = "stand") {
  const [l, r] = ARMS[pose], [fl, fr] = LEGS[pose];
  const body = `${look.long ? `<path d="M9.5 12v15h21V12z" fill="${look.hair}"/>` : ""}
${limb(`M17 50L${fl[0]} ${fl[1]}`, look.pants, 6)}${limb(`M23 50L${fr[0]} ${fr[1]}`, look.pants, 6)}
${limb(`M14 28L${l[0]} ${l[1]}`, look.skin, 4.6)}${limb(`M26 28L${r[0]} ${r[1]}`, look.skin, 4.6)}
<path d="M12 30q0-7 8-7t8 7v22H12z" fill="${look.shirt}" ${o}/>
<circle cx="20" cy="13" r="10" fill="${look.skin}" ${o}/>
<path d="M10.4 12.5a9.6 9.6 0 0 1 19.2 0c-3-3.2-6-4.2-9.6-4.2s-6.6 1-9.6 4.2z" fill="${look.hair}"/>
<circle cx="16.5" cy="14" r="1.4" fill="${INK}"/><circle cx="23.5" cy="14" r="1.4" fill="${INK}"/>
<path d="M17 18.2q3 2.4 6 0" fill="none" ${thin}/>
${look.glasses ? `<circle cx="16.5" cy="14" r="3.3" fill="none" ${thin}/><circle cx="23.5" cy="14" r="3.3" fill="none" ${thin}/><path d="M19.8 14h0.4" ${thin}/>` : ""}`;
  return pose === "run" ? `<g transform="rotate(10 20 50)">${body}</g>` : pose === "jump" ? `<g transform="translate(0 -4)">${body}</g>` : body;
}

const palm = (fill = SKIN.a) => `<path d="M21 36V20a3.4 3.4 0 0 1 6.8 0v-4a3.4 3.4 0 0 1 6.8 0v2a3.4 3.4 0 0 1 6.8 0v4a3.4 3.4 0 0 1 6.8 0v18c0 10-6 16-15 16h-1c-6 0-9-3-12-8l-6-9a3.4 3.4 0 0 1 5.6-4z" fill="${fill}" ${o}/>`;
const steam = (x: number, y: number) => `<path d="M${x} ${y}q-3-4 0-8t0-8M${x + 7} ${y}q-3-4 0-8t0-8" fill="none" stroke="#9aa3ad" stroke-width="2.2" stroke-linecap="round"/>`;
const spool = (thread: string, extra = "") => `<rect x="14" y="10" width="5" height="46" rx="2.5" fill="#a86b3c" ${o}/><rect x="45" y="10" width="5" height="46" rx="2.5" fill="#a86b3c" ${o}/>
<rect x="17" y="18" width="30" height="30" rx="4" fill="${thread}" ${o}/>
<path d="M17 25h30M17 31h30M17 37h30M17 43h30" stroke="${INK}" stroke-opacity=".25" stroke-width="1.4"/>${extra}`;
const steps = (up: boolean) => `<rect x="2" y="44" width="60" height="18" rx="3" fill="#5aa9d6"/><path d="M8 52q6-3 12 0t12 0 12 0 12 0" fill="none" stroke="#d6ecf8" stroke-width="2"/>
<path d="M2 14h20v8h10v8h10v8h10v6H2z" fill="#c8643c" ${o}/><path d="M2 22h20M2 30h30M2 38h40" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5"/>
${arrow(up ? "M52 34 34 16m0 9v-9h9" : "M34 16l18 18m0-9v9h-9")}`;
const kiteShape = `<path d="M32 4 50 24 32 46 14 24z" fill="#e05a47" ${o}/><path d="M32 4v42M14 24h36" ${thin}/><path d="M32 4 50 24H32z" fill="#ffd166"/><path d="M32 4 50 24 32 46 14 24z" fill="none" ${o}/>
<path d="M32 46q-5 6 0 10t0 8" fill="none" ${thin}/><path d="M27 52l5 2-5 2zM37 57l-5 2 5 2z" fill="#2e9e8a" ${thin}/>`;
const tree = `<rect x="28" y="34" width="8" height="26" rx="2" fill="#8a5a33" ${o}/><circle cx="32" cy="24" r="19" fill="#4f9a45" ${o}/><circle cx="24" cy="20" r="5" fill="#6db35d"/><circle cx="39" cy="28" r="4" fill="#6db35d"/>`;
const house = `<rect x="10" y="22" width="44" height="36" fill="#efe2c8" ${o}/><rect x="6" y="16" width="52" height="8" rx="2" fill="#b9a68a" ${o}/>
<rect x="27" y="38" width="11" height="20" fill="#a86b3c" ${o}/><rect x="14" y="30" width="9" height="9" fill="#8fc6e8" ${thin}/><rect x="42" y="30" width="9" height="9" fill="#8fc6e8" ${thin}/>`;

export const ICONS: Record<string, string> = {
  "look-right": `<circle cx="27" cy="33" r="18" fill="${SKIN.a}" ${o}/><path d="M9.6 30a17.6 17.6 0 0 1 35-2c-6-6-12-8-17.6-8S15 22 9.6 30z" fill="#2b2018"/>
<ellipse cx="21" cy="34" rx="5" ry="5.6" fill="#fff" ${thin}/><ellipse cx="33" cy="34" rx="5" ry="5.6" fill="#fff" ${thin}/>
<circle cx="24" cy="34.5" r="2.6" fill="${INK}"/><circle cx="36" cy="34.5" r="2.6" fill="${INK}"/><path d="M23 44q4 2.5 8 0" fill="none" ${thin}/>
${arrow("M48 33h12m-6-6 6 6-6 6")}`,
  walk: at(14, 0, 0.8, person(KID, "walk")),
  run: at(14, 2, 0.78, person(KID, "run")),
  stand: at(16, 0, 0.8, person(GIRL, "stand")),
  jump: `<rect x="2" y="50" width="60" height="12" rx="3" fill="#5aa9d6"/>${at(16, 4, 0.66, person(KID, "jump"))}`,
  stop: `<circle cx="32" cy="32" r="29" fill="#fde3c0"/>${at(-2, 2, 1, palm())}`,
  hand: `<g transform="rotate(70 32 32)">${palm()}</g>`,
  zebra: `<rect x="4" y="6" width="56" height="52" rx="6" fill="#6b6f76" ${o}/><path d="M12 14h40M12 24h40M12 34h40M12 44h40" stroke="#fff" stroke-width="6"/>`,
  bus: `<rect x="4" y="16" width="56" height="32" rx="6" fill="#2e8b57" ${o}/><path d="M9 22h10v10H9zM23 22h10v10H23zM37 22h10v10H37z" fill="#cfe8f7" ${thin}/>
<rect x="51" y="22" width="7" height="16" fill="#cfe8f7" ${thin}/><path d="M4 38h56" stroke="#ffd166" stroke-width="3"/><circle cx="16" cy="49" r="6" fill="#3a3a44" ${o}/><circle cx="48" cy="49" r="6" fill="#3a3a44" ${o}/>`,
  footpath: `<rect x="4" y="8" width="24" height="50" rx="3" fill="#ddd4c2" ${o}/><rect x="28" y="8" width="32" height="50" fill="#6b6f76" ${o}/><path d="M44 12v8m0 8v8m0 8v8" stroke="#fff" stroke-width="2.4"/>${arrow("M40 33H12m7-7-7 7 7 7")}`,
  road: `<rect x="4" y="8" width="24" height="50" rx="3" fill="#ddd4c2" ${o}/><rect x="28" y="8" width="32" height="50" fill="#6b6f76" ${o}/><path d="M44 12v8m0 8v8m0 8v8" stroke="#fff" stroke-width="2.4"/>${arrow("M14 33h40m-7-7 7 7-7 7", "#ffd166")}`,
  "adult-hand": `${at(2, 1, 0.78, person(ABBU, "hold"))}${at(31, 21, 0.54, person(SPECS, "holdL"))}`,
  kids: `${at(2, 18, 0.58, person(KID, "hold"))}${at(29, 22, 0.52, person(GIRL, "holdL"))}`,
  call: `${at(4, 2, 0.76, person(GIRL, "call"))}<path d="M40 18q5 6 0 12M46 13q8 11 0 22M52 8q11 16 0 32" fill="none" stroke="${ACCENT}" stroke-width="3.2" stroke-linecap="round"/>`,
  "steps-down": steps(false),
  "steps-up": steps(true),
  house,
  bamboo: `${limb("M8 58 58 8", "#b7c35a", 6)}<path d="M20 46l4 4M32 34l4 4M44 22l4 4" stroke="${INK}" stroke-width="1.8"/>
<path d="M10 20h18v24H10z" fill="#e05a47" ${o}/><path d="M10 26h18M10 32h18M10 38h18M16 20v24M22 20v24" stroke="#fff" stroke-width="1.8"/>`,
  ripple: `<ellipse cx="32" cy="34" rx="28" ry="10" fill="none" stroke="#e9f6ff" stroke-width="2.4"/><ellipse cx="32" cy="34" rx="17" ry="6" fill="none" stroke="#e9f6ff" stroke-width="2.4"/><ellipse cx="32" cy="34" rx="6" ry="2.2" fill="#e9f6ff"/>`,
  bottle: `<rect x="26" y="4" width="12" height="7" rx="2" fill="#e05a47" ${o}/><path d="M27 11h10v5q8 4 8 13v25a6 6 0 0 1-6 6H25a6 6 0 0 1-6-6V29q0-9 8-13z" fill="#cfeaf8" ${o}/>
<rect x="19" y="32" width="26" height="10" fill="#4fa3d8"/><path d="M27 11h10v5q8 4 8 13v25a6 6 0 0 1-6 6H25a6 6 0 0 1-6-6V29q0-9 8-13z" fill="none" ${o}/>`,
  door: `<rect x="10" y="4" width="30" height="56" fill="#6d4a2e" ${o}/><path d="M14 8h22v52l-18 0z" fill="#fff7e3"/><path d="M14 8 30 14v46H14z" fill="#b9864f" ${o}/><circle cx="26" cy="37" r="1.8" fill="${INK}"/>${arrow("M38 34h20m-7-7 7 7-7 7")}`,
  stove: `<path d="M6 58c0-18 6-28 26-28s26 10 26 28z" fill="#b36a3d" ${o}/><path d="M24 58v-8a8 8 0 0 1 16 0v8z" fill="#3a2a22" ${thin}/><ellipse cx="32" cy="55" rx="5" ry="3" fill="#f59e0b"/>
<path d="M16 30h32l-3-14H19z" fill="#a8b0b8" ${o}/><path d="M14 16h36" ${o}/>${steam(26, 12)}`,
  pot: `<path d="M12 26h40v20a12 12 0 0 1-12 12H24a12 12 0 0 1-12-12z" fill="#a8b0b8" ${o}/><path d="M8 26h48" ${o}/><path d="M22 26a10 5 0 0 1 20 0" fill="#c4cbd2" ${o}/>${steam(26, 18)}`,
  glass: `<path d="M18 8h28l-4 50H22z" fill="#eef7fd" ${o}/><path d="M20 24h24l-2.7 32H22.7z" fill="#7cc0ea"/><path d="M18 8h28l-4 50H22z" fill="none" ${o}/>`,
  iron: `<path d="M8 50c2-14 12-22 30-22h18v22z" fill="#5d8fc4" ${o}/><path d="M24 28c0-8 6-12 14-12h12v12" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M6 54h52" ${o}/>${steam(18, 24)}`,
  kettle: `<path d="M14 54c-4-16 2-28 18-28s22 12 18 28z" fill="#d9534f" ${o}/><path d="M48 36l10-8" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M22 26a10 10 0 0 1 20 0" fill="none" stroke="${INK}" stroke-width="3.4"/><rect x="29" y="20" width="6" height="5" rx="2" fill="${INK}"/>${steam(28, 16)}`,
  kupi: `<rect x="20" y="30" width="24" height="26" rx="5" fill="#3f7d5a" ${o}/><path d="M26 30v-6h12v6" fill="#a8b0b8" ${o}/><path d="M32 24v-4" ${o}/>
<path d="M32 4c5 6 6 10 0 15-6-5-5-9 0-15z" fill="#ffd166" ${thin}/><path d="M32 10c2 3 2 5 0 7-2-2-2-4 0-7z" fill="#f59e0b"/>`,
  book: `<path d="M32 14C24 8 14 8 6 12v40c8-4 18-4 26 2 8-6 18-6 26-2V12c-8-4-18-4-26 2z" fill="#fff" ${o}/><path d="M32 14v40" ${o}/>
<path d="M12 22q8-3 14 0M12 30q8-3 14 0M12 38q8-3 14 0M38 22q8-3 14 0M38 30q8-3 14 0M38 38q8-3 14 0" fill="none" stroke="#9aa3ad" stroke-width="2"/>`,
  ball: `<circle cx="32" cy="32" r="24" fill="#e05a47" ${o}/><path d="M12 22q20 8 40 0M12 42q20-8 40 0" fill="none" stroke="#fff" stroke-width="4"/><circle cx="32" cy="32" r="24" fill="none" ${o}/>`,
  tap: `<path d="M6 10h22a6 6 0 0 1 6 6v6h-8v-4H6z" fill="#a8b0b8" ${o}/><rect x="14" y="4" width="8" height="5" rx="2" fill="#5d8fc4" ${o}/>
<path d="M28 23v14" stroke="#7cc0ea" stroke-width="6" stroke-linecap="round"/><g transform="rotate(-90 32 44) translate(0 6)">${palm()}</g>`,
  toothpaste: `<path d="M8 22h34l12 6v8l-12 6H8z" fill="#f4f7fb" ${o}/><path d="M8 28h34M8 36h34" stroke="#3f8fd2" stroke-width="3"/><rect x="54" y="27" width="6" height="10" rx="2" fill="#3f8fd2" ${o}/><path d="M8 22v20" ${o}/>`,
  oil: `<rect x="26" y="4" width="12" height="7" rx="2" fill="#2e8b57" ${o}/><path d="M27 11h10v6l6 6v31a6 6 0 0 1-6 6H27a6 6 0 0 1-6-6V23l6-6z" fill="#f2c94c" ${o}/><rect x="21" y="32" width="22" height="12" fill="#fff" ${thin}/>`,
  give: `<rect x="4" y="42" width="20" height="13" rx="2" fill="#f2b632" ${o}/><rect x="4" y="46" width="20" height="5" fill="#a86b3c"/>${arrow("M18 36q4-16 18-18m-7-4 7 4-5 6")}${at(34, 2, 0.7, person(AMMU, "stand"))}`,
  matches: `<rect x="6" y="30" width="34" height="24" rx="3" fill="#f2b632" ${o}/><rect x="6" y="38" width="34" height="8" fill="#a86b3c"/><path d="M40 46 58 14" stroke="#d6b48a" stroke-width="4" stroke-linecap="round"/><circle cx="58" cy="13" r="4" fill="#d9534f" ${thin}/>`,
  box: `<path d="M8 28h48v28H8z" fill="#c69361" ${o}/><path d="M6 20l52-6 2 10-52 6z" fill="#d9a774" ${o}/><path d="M28 28v28" stroke="${INK}" stroke-opacity=".4" stroke-width="2"/>`,
  field: `<rect x="2" y="2" width="60" height="60" rx="6" fill="#cfe8f7"/><path d="M2 40q30-8 60 0v16a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6z" fill="#7dbb5a" ${thin}/>
${at(30, 6, 0.38, kiteShape)}<path d="M42 24q-8 14-20 26" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
  wire: `<rect x="44" y="4" width="6" height="56" fill="#8a8f96" ${o}/><path d="M38 10h18" ${o}/><path d="M2 14q22 10 40-3M2 24q22 10 40-3" fill="none" stroke="${INK}" stroke-width="2"/><rect x="2" y="46" width="40" height="14" fill="#c9bfae" ${o}/>`,
  stick: `${limb("M18 60 52 6", "#a86b3c", 5)}<path d="M2 14q30 12 60-2" fill="none" stroke="${INK}" stroke-width="2"/>`,
  pull: `<path d="M8 50 58 8" stroke="${INK}" stroke-width="2"/>${at(-6, 18, 0.7, `<g transform="rotate(-40 32 32)">${palm()}</g>`)}${arrow("M44 46H24m7-7-7 7 7 7")}`,
  "let-go": `${at(-4, 22, 0.66, palm())}<path d="M22 30q-6-8 4-12t4-12" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 3"/>${at(30, 2, 0.5, kiteShape)}`,
  spool: spool("#f7f3ea"),
  "spool-metal": spool("#b8c2cc", `<path d="M22 22l6 8M34 30l6 8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`),
  "spool-glass": spool("#e98a9a", `<path d="M22 24l2 2M30 34l2 2M38 26l2 2M26 42l2 2M40 40l2 2" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`),
  phone: `<rect x="16" y="4" width="32" height="56" rx="6" fill="#3a3a44" ${o}/><rect x="20" y="12" width="24" height="38" rx="2" fill="#e8f3fb"/>
<path d="M24 20h4M30 20h4M36 20h4M24 28h4M30 28h4M36 28h4M24 36h4M30 36h4M36 36h4" stroke="#3f8fd2" stroke-width="3.4" stroke-linecap="round"/><circle cx="32" cy="45" r="3.4" fill="#2e9e44"/>`,
  balloon: `<path d="M22 40q-2 10 6 20M42 34q2 12-4 26" fill="none" stroke="${INK}" stroke-width="1.5"/><ellipse cx="22" cy="24" rx="13" ry="16" fill="#e05a47" ${o}/><ellipse cx="42" cy="20" rx="12" ry="15" fill="#ffd166" ${o}/><path d="M17 16q2-5 6-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
  mother: `${at(2, 1, 0.78, person(AMMU, "hold"))}${at(31, 21, 0.54, person(KID, "holdL"))}`,
  gate: `<path d="M6 60V26a26 22 0 0 1 52 0v34h-9V27a17 14 0 0 0-34 0v33z" fill="#e05a47" ${o}/><path d="M10 24l6 4 6-6 6 5 6-6 6 5 6-6 6 6" fill="none" stroke="#ffd166" stroke-width="3"/>${arrow("M24 46h28m-7-7 7 7-7 7", "#3f8fd2")}`,
  tree,
  wave: `<rect x="2" y="18" width="60" height="42" rx="6" fill="#5aa9d6"/><path d="M6 30q7-6 13 0t13 0 13 0 13 0M6 42q7-6 13 0t13 0 13 0 13 0M6 54q7-6 13 0t13 0 13 0 13 0" fill="none" stroke="#e9f6ff" stroke-width="2.6" stroke-linecap="round"/>`,
  kite: kiteShape,
  crouch: `<rect x="2" y="54" width="60" height="8" rx="3" fill="#7dbb5a"/>${limb("M26 46 20 56M38 46 44 56", KID.pants, 7)}<path d="M22 50q-2-14 10-14t10 14z" fill="${KID.shirt}" ${o}/>
<circle cx="32" cy="26" r="10" fill="${KID.skin}" ${o}/><path d="M22.4 25.5a9.6 9.6 0 0 1 19.2 0c-3-3.2-6-4.2-9.6-4.2s-6.6 1-9.6 4.2z" fill="${KID.hair}"/>
<path d="M28 31q4 2 8 0" fill="none" ${thin}/><path d="M28 27h1.6M34.4 27H36" ${thin}/>${limb("M24 42 21 27M40 42 43 27", KID.skin, 4.6)}`,
  clock: `<circle cx="32" cy="32" r="26" fill="#fff" ${o}/><path d="M32 32V8a24 24 0 0 1 0 48z" fill="#bfe3c4"/><circle cx="32" cy="32" r="26" fill="none" ${o}/>
<path d="M32 32V14M32 32h12" ${o}/><circle cx="32" cy="32" r="2.4" fill="${INK}"/>`,
  rickshaw: `<circle cx="16" cy="46" r="13" fill="none" ${o}/><circle cx="16" cy="46" r="2" fill="${INK}"/><circle cx="54" cy="52" r="7" fill="none" ${o}/>
<path d="M16 46h20l18 6M30 46l4-14" ${o} fill="none"/><path d="M6 34V18q2-14 22-14h2v30z" fill="#e05a47" ${o}/><path d="M10 12h14M9 20h16M8 28h18" stroke="#ffd166" stroke-width="2.4"/><rect x="6" y="32" width="26" height="6" rx="2" fill="#3f8fd2" ${o}/>`,
  "loose-wire": `<path d="M2 4q24 8 30 18t-4 24q-6 10 4 14" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M30 58l4 4" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>`,
};
ICONS["look-left"] = mirror(ICONS["look-right"]);

const sky = (color = "#dbeefa") => `<rect width="320" height="160" fill="${color}"/>`;
const figure = (look: Look, x: number, y: number, s: number, pose: Pose = "stand", flip = false) =>
  at(x, y, s, flip ? mirror(person(look, pose), 40) : person(look, pose));
const icon = (id: string, x: number, y: number, size: number) => `<g transform="translate(${x} ${y}) scale(${size / 64})">${ICONS[id]}</g>`;
const cloud = (x: number, y: number, s: number, fill: string) => at(x, y, s, `<path d="M10 30a10 10 0 0 1 4-19 14 14 0 0 1 26-3 11 11 0 0 1 16 10 7 7 0 0 1 0 12z" fill="${fill}"/>`);

/** One background per scene set; the child stands where the question happens. */
export const SCENES: Record<string, string> = {
  road: `${sky()}<path d="M0 50V30h26V18h22v12h18V24h30v26zM210 50V22h28v10h20V16h26v34z" fill="#c9d6e0"/>
<rect y="50" width="320" height="74" fill="#6b6f76"/><path d="M0 87h320" stroke="#f4f1ea" stroke-width="2.4" stroke-dasharray="14 12"/>
<path d="M150 56h44M150 68h44M150 80h44M150 94h44M150 106h44M150 118h44" stroke="#f4f1ea" stroke-width="6"/>
<rect y="124" width="320" height="36" fill="#ddd4c2"/><path d="M0 124h320" stroke="#a69c88" stroke-width="3"/>
${at(24, 54, 1, `<rect x="0" y="6" width="46" height="22" rx="10" fill="#2e8b57" ${o}/><path d="M6 8q10-8 30 0" fill="#2e8b57" ${o}/><rect x="10" y="10" width="14" height="10" fill="#cfe8f7" ${thin}/><circle cx="10" cy="30" r="5" fill="#3a3a44" ${o}/><circle cx="38" cy="30" r="5" fill="#3a3a44" ${o}/>`)}
${at(282, 90, 1, `<rect x="0" y="0" width="60" height="28" rx="5" fill="#f2b632" ${o}/><rect x="6" y="5" width="12" height="10" fill="#cfe8f7" ${thin}/><rect x="22" y="5" width="12" height="10" fill="#cfe8f7" ${thin}/><circle cx="14" cy="30" r="5" fill="#3a3a44" ${o}/>`)}
${figure(SPECS, 110, 104, 0.62)}`,
  pond: `${sky()}<rect y="56" width="320" height="104" fill="#86c06a"/>
<path d="M96 160V108q40-22 120-22t104 6v68z" fill="#5aa9d6"/><path d="M150 110q8-3 16 0M230 104q8-3 16 0M200 132q8-3 16 0M270 126q8-3 16 0" fill="none" stroke="#d6ecf8" stroke-width="2.4" stroke-linecap="round"/>
<path d="M60 70h40v12h14v12h14v12h14v54H60z" fill="#c8643c" ${o}/><path d="M60 82h40M60 94h54M60 106h68" stroke="${INK}" stroke-opacity=".3" stroke-width="1.6"/>
${at(10, 6, 1, `<path d="M20 64q6-34 2-58" fill="none" stroke="#8a5a33" stroke-width="6" stroke-linecap="round"/><path d="M22 8q-18-4-24 8M22 8q16-8 26 2M22 8q-10 6-12 18M22 8q12 2 16 14" fill="none" stroke="#3f8a3a" stroke-width="6" stroke-linecap="round"/>`)}
${at(280, 108, 1, `<ellipse cx="12" cy="10" rx="12" ry="7" fill="#fff" ${o}/><circle cx="22" cy="2" r="5" fill="#fff" ${o}/><path d="M27 2l5 1-5 2z" fill="#f2b632" ${thin}/>`)}
${figure(GIRL, 70, 28, 0.56)}`,
  kitchen: `<rect width="320" height="160" fill="#f3e3c3"/><rect y="122" width="320" height="38" fill="#d9b98a"/><path d="M0 122h320" stroke="#b9935f" stroke-width="3"/>
<rect x="232" y="16" width="56" height="44" fill="#bfe3c4" ${o}/><path d="M260 16v44M232 38h56" ${o}/>
<rect x="120" y="44" width="80" height="6" fill="#a86b3c" ${o}/><rect x="128" y="28" width="14" height="16" rx="3" fill="#e05a47" ${o}/><rect x="148" y="24" width="14" height="20" rx="3" fill="#ffd166" ${o}/>
${icon("kupi", 170, 14, 30)}${icon("stove", 18, 70, 64)}
${figure(KID, 250, 72, 0.64)}`,
  roof: `${sky()}<path d="M0 108q90-12 190 0v52H0z" fill="#7dbb5a"/><rect x="190" y="118" width="130" height="42" fill="#c9bfae"/><path d="M190 118h130" ${o}/>
<rect x="296" y="10" width="7" height="108" fill="#8a8f96" ${o}/><path d="M286 16h26" ${o}/><path d="M180 30q60 22 120-14M170 42q70 22 130-14" fill="none" stroke="${INK}" stroke-width="1.8"/>
${at(104, 16, 0.5, kiteShape)}<path d="M120 40q-20 30-44 66" fill="none" stroke="${INK}" stroke-width="1"/>
${figure(GIRL, 64, 92, 0.56, "reel")}`,
  fair: `<rect width="320" height="160" fill="#fdf1d8"/><rect y="124" width="320" height="36" fill="#e9d3a6"/>
<path d="M0 8q80 16 160 0t160 0" fill="none" stroke="${INK}" stroke-width="1.4"/><path d="M14 11l6 10 6-8zM54 15l6 10 6-9zM94 15l6 10 6-10zM134 10l6 10 6-10zM174 10l6 10 6-10zM214 15l6 10 6-10zM254 15l6 10 6-9zM294 11l6 10 6-8z" fill="#e05a47"/>
${at(10, 26, 1, `<circle cx="44" cy="46" r="40" fill="none" ${o}/><path d="M44 6v80M4 46h80M16 18l56 56M72 18 16 74" stroke="${INK}" stroke-width="1.6"/><path d="M30 92l14-46 14 46" fill="none" ${o}/>
<rect x="38" y="0" width="12" height="9" rx="2" fill="#3f8fd2" ${thin}/><rect x="78" y="40" width="12" height="9" rx="2" fill="#ffd166" ${thin}/><rect x="-2" y="40" width="12" height="9" rx="2" fill="#2e9e8a" ${thin}/><rect x="38" y="80" width="12" height="9" rx="2" fill="#e05a47" ${thin}/>`)}
<rect x="196" y="56" width="110" height="60" fill="#fff" ${o}/><path d="M190 56l10-22h102l10 22z" fill="#e05a47" ${o}/><path d="M214 34l-4 22M240 34v22M266 34l4 22M292 34l6 22" stroke="#fff" stroke-width="5"/>
<path d="M206 72h20M206 84h20M246 72h20M276 72h20" stroke="#f2b632" stroke-width="6" stroke-linecap="round"/>
${icon("balloon", 150, 50, 32)}${figure(KID, 112, 84, 0.58)}
${at(232, 98, 1, `<circle cx="10" cy="44" r="12" fill="none" ${o}/><circle cx="34" cy="50" r="5" fill="none" ${o}/><path d="M4 22h18v20h14" fill="none" ${o}/>`)}${figure(SPECS, 228, 74, 0.5)}`,
  storm: `${sky("#b9c6d3")}${cloud(10, 0, 2, "#8796a6")}${cloud(120, -6, 2.4, "#7a8999")}${cloud(230, 2, 1.8, "#8796a6")}
<path d="M30 60l-6 14M70 56l-6 14M110 64l-6 14M150 58l-6 14M190 62l-6 14M230 56l-6 14M270 64l-6 14M300 58l-6 14" stroke="#e9f2fa" stroke-width="1.6" stroke-linecap="round"/>
<rect y="104" width="320" height="56" fill="#79b45a"/><path d="M0 120h320M0 136h320M0 152h320" stroke="#5f9a43" stroke-width="2" stroke-dasharray="4 6"/>
${icon("house", 14, 52, 72)}${icon("tree", 250, 50, 66)}${figure(GIRL, 146, 82, 0.6)}`,
};

/** Draws the scene with the question's prop on top. */
export const sceneMarkup = (scene: string, prop?: { icon: string; x: number; y: number; size: number }) =>
  SCENES[scene] + (prop ? icon(prop.icon, prop.x, prop.y, prop.size) : "");

/** A standalone SVG document of an icon, for drawing on the card canvas. */
export function svgDocument(id: string, size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${ICONS[id] ?? ""}</svg>`;
}
