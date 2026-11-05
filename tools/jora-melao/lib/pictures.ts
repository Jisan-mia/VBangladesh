// The three picture sets, drawn in code as SVG paths on a 64×64 box: the cards use them as <symbol>s, the share card as Path2D.
// Each world has ten pictures and three look-alike twins. A twin differs from its base in colour AND in shape (dots, a moon,
// a zigzag, a leaf, a collar, a beak), so it stays apart without colour vision. Ids are part of every link: only ever append.
//
// IP: no cartoon characters, mascots, licensed toys or famous card designs; plain shapes of things from a Bangladeshi
// মেলা, a fruit হাট and a বিল.

export type Part = { d: string; fill?: string; stroke?: string; width?: number };
export type Picture = { id: number; key: string; name: string; tint: string; world: number; twinOf: number; parts: Part[] };

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const dots = (points: readonly (readonly [number, number])[], r: number) => points.map(([x, y]) => circle(x, y, r)).join("");
/** Small marks on a grid inside an ellipse: a jackfruit's skin, a pineapple's eyes. */
function inside(cx: number, cy: number, rx: number, ry: number, step: number, mark: (x: number, y: number) => string, stagger = true) {
  let out = "";
  for (let y = cy - ry + step * 0.8, row = 0; y < cy + ry - step * 0.5; y += step, row++) {
    for (let x = cx - rx + step * (stagger && row % 2 ? 1 : 0.5); x < cx + rx; x += step) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.78) out += mark(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    }
  }
  return out;
}
/** A copy of a picture's parts with some colours swapped. */
const paint = (parts: readonly Part[], map: Record<string, string>): Part[] =>
  parts.map(part => ({ ...part, fill: part.fill && (map[part.fill] ?? part.fill), stroke: part.stroke && (map[part.stroke] ?? part.stroke) }));

const WOOD = "#7a4b1f", BAMBOO = "#d9a441", STEM = "#6b4423", LEAF = "#3f8f3a", LEAF_DEEP = "#2d6b2a";

// ---- ১ বৈশাখী মেলা: the fair-stall toys (the old art, unchanged, in the old order) ----
const belun: Part[] = [
  { d: "M32 46C27 51 37 55 31 62", stroke: "#6b5b4b", width: 1.6 },
  { d: "M28.5 47.5h7L32 42.5Z", fill: "#b02525" },
  { d: ellipse(32, 25, 15, 18), fill: "#e03131" },
  { d: "M24 14.5C21 18 20.5 23 22.5 27", stroke: "#ffffffb8", width: 3 },
];
const ghuri: Part[] = [
  { d: "M32 50C27 54 37 57 31 63", stroke: "#e03131", width: 1.8 },
  { d: "M27 55.5l-3.5-2.5v5ZM35.5 59.5l3.5-2.5v5Z", fill: "#e03131" },
  { d: "M32 5L53 27H11Z", fill: "#2f9e44" },
  { d: "M11 27H53L32 50Z", fill: "#fcc419" },
  { d: "M32 5V50M11 27Q32 14 53 27", stroke: "#5c3d1e", width: 1.4 },
];
const latim: Part[] = [
  { d: "M32 50V60", stroke: "#495057", width: 2.6 },
  { d: "M13 25C13 14 51 14 51 25C51 35 40 44 32 52C24 44 13 35 13 25Z", fill: "#f76707" },
  { d: "M14 27C24 32 40 32 50 27M19 37C27 41 37 41 45 37", stroke: "#ffe066", width: 2.6 },
  { d: ellipse(32, 18, 9, 3.2), fill: "#c2410c" },
  { d: "M29 9h6v9h-6Z", fill: WOOD },
];
const TOYS: Array<[string, string, string, Part[]]> = [
  ["belun", "বেলুন", "#dff1fb", belun],
  ["ghuri", "ঘুড়ি", "#fff6cc", ghuri],
  ["latim", "লাটিম", "#ffe8cc", latim],
  ["bansi", "বাঁশি", "#e6f5dc", [
    { d: "M12 52C8 56 10 60 6 62M12 52C12 57 15 59 13 63", stroke: "#e03131", width: 2 },
    { d: "M12 52L52 12", stroke: BAMBOO, width: 9 },
    { d: "M11 49L49 11", stroke: "#f5d98b", width: 2 },
    { d: "M20 37.6L26.4 44M44 13.6L50.4 20", stroke: "#a8742a", width: 1.6 },
    { d: [circle(18, 46, 1.7), circle(28, 36, 1.6), circle(32.8, 31.2, 1.6), circle(37.6, 26.4, 1.6), circle(42.4, 21.6, 1.6)].join(""), fill: "#4a3015" },
  ]],
  ["ektara", "একতারা", "#efe9fb", [
    { d: "M24 41L29.5 7M40 41L34.5 7", stroke: "#c9a063", width: 4 },
    { d: "M26 10.5H38", stroke: WOOD, width: 3 },
    { d: circle(32, 47, 13), fill: "#8a4f22" },
    { d: "M20.5 43C27 47.5 37 47.5 43.5 43", stroke: "#e8b04a", width: 2.2 },
    { d: "M32 10V58", stroke: "#fdfbf5", width: 1.1 },
    { d: circle(32, 7.5, 2.4), fill: WOOD },
  ]],
  ["putul", "মাটির পুতুল", "#fff0f3", [
    { d: "M24 36L16 44M40 36L48 44", stroke: "#d0582e", width: 5 },
    { d: "M18 58C20 40 26 28 32 28C38 28 44 40 46 58Z", fill: "#d0582e" },
    { d: circle(32, 19, 9), fill: "#d0582e" },
    { d: "M23 18C23.5 10 40.5 10 41 18C38 14.5 26 14.5 23 18Z", fill: "#3b2a20" },
    { d: circle(32, 9.5, 3.4), fill: "#3b2a20" },
    { d: circle(28.8, 20, 1.3) + circle(35.2, 20, 1.3), fill: "#3b2a20" },
    { d: "M21 50.5C28 46.5 36 46.5 43 50.5", stroke: "#fff3e0", width: 2.2 },
    { d: circle(27, 40, 1.5) + circle(37, 40, 1.5) + circle(32, 36, 1.5) + circle(32, 43, 1.5), fill: "#fff3e0" },
  ]],
  ["tomtom", "টমটম গাড়ি", "#e3faf1", [
    { d: "M43 33L60 7", stroke: "#c9a063", width: 3.2 },
    { d: "M24 22L20 14M36 22L40 14", stroke: WOOD, width: 1.8 },
    { d: circle(20, 13.5, 2.2) + circle(40, 13.5, 2.2), fill: "#e03131" },
    { d: "M17 24H43V39a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2Z", fill: "#1971c2" },
    { d: "M18 33l4-4l4 4l4-4l4 4l4-4l4 4", stroke: "#ffffff", width: 1.6 },
    { d: ellipse(30, 24, 13, 3.6), fill: "#f1e3c6", stroke: "#0f4c8a", width: 1.4 },
    { d: "M14 47H46", stroke: "#5c3d1e", width: 2 },
    { d: circle(16, 47, 8) + circle(44, 47, 8), fill: "#fcc419", stroke: WOOD, width: 2 },
    { d: circle(16, 47, 2.2) + circle(44, 47, 2.2), fill: WOOD },
  ]],
  ["jhunjhuni", "ঝুনঝুনি", "#fff4e0", [
    { d: "M32 36V59", stroke: "#7048e8", width: 6.5 },
    { d: "M28.5 46H35.5M28.5 53H35.5", stroke: "#d0bfff", width: 2 },
    { d: circle(32, 22, 14), fill: "#7048e8" },
    { d: circle(32, 22, 7.5), fill: "#f3f0ff" },
    { d: circle(32, 22, 3), fill: "#7048e8" },
    { d: [circle(21.4, 11.4, 3), circle(42.6, 11.4, 3), circle(21.4, 32.6, 3), circle(42.6, 32.6, 3)].join(""), fill: "#fab005", stroke: "#a5680a", width: 1 },
  ]],
  ["charki", "চরকি", "#e3f6fb", [
    { d: "M32 27V62", stroke: "#8d6e4f", width: 3 },
    { d: "M32 26L32 6C41 6 46 13 32 26ZM32 26L32 46C23 46 18 39 32 26Z", fill: "#e64980" },
    { d: "M32 26L52 26C52 35 45 40 32 26ZM32 26L12 26C12 17 19 12 32 26Z", fill: "#fcc419" },
    { d: circle(32, 26, 2.6), fill: "#2b8a3e" },
  ]],
  ["nouka", "টিনের নৌকা", "#fff5d6", [
    { d: circle(47, 15, 2.6) + circle(50.5, 9.5, 2), fill: "#ced4da" },
    { d: "M43 21h5v17h-5Z", fill: "#495057" },
    { d: "M19 27h20v11H19Z", fill: "#f03e3e" },
    { d: circle(25, 32.5, 2.1) + circle(33, 32.5, 2.1), fill: "#fff9db" },
    { d: "M7 38H57L48.5 51H15.5Z", fill: "#0c8599" },
    { d: "M10.5 42.5H53.5", stroke: "#ffffff", width: 2 },
    { d: "M4 56C10 53 14 59 20 56S30 53 36 56S46 59 52 56S58 54 60 55", stroke: "#74c0fc", width: 1.8 },
  ]],
];
const TOY_TWINS: Array<[string, string, string, number, Part[]]> = [
  ["belun-nil", "নীল বেলুন", "#e7f0ff", 0, [
    ...paint(belun, { "#e03131": "#2f6fd6", "#b02525": "#1f4f9e" }),
    { d: dots([[27, 25], [37, 22], [33, 32], [38, 33], [28, 35]], 1.9), fill: "#ffffffd9" },
  ]],
  ["chandial", "চাঁদিয়াল ঘুড়ি", "#fff1ea", 1, [
    { d: "M32 50C27 54 37 57 31 63", stroke: "#1f4f9e", width: 1.8 },
    { d: "M27 55.5l-3.5-2.5v5ZM35.5 59.5l3.5-2.5v5Z", fill: "#1f4f9e" },
    { d: "M32 5L53 27H11Z", fill: "#e03131" },
    { d: "M11 27H53L32 50Z", fill: "#fff3d6" },
    { d: "M32 5V50M11 27Q32 14 53 27", stroke: "#5c3d1e", width: 1.4 },
    { d: "M35 31a7 7 0 1 0 0 12a5.4 5.4 0 1 1 0-12Z", fill: "#fcc419" },
  ]],
  ["latim-sobuj", "সবুজ লাটিম", "#e8f6df", 2, [
    { d: "M32 50V60", stroke: "#495057", width: 2.6 },
    { d: "M13 25C13 14 51 14 51 25C51 35 40 44 32 52C24 44 13 35 13 25Z", fill: "#2f9e44" },
    { d: "M15 28l4.5 4 4.5-4 4.5 4 4.5-4 4.5 4 4.5-4 4.5 4 3-2.6M21 38l3.7 3 3.7-3 3.7 3 3.7-3 3.7 3 3.5-2.6", stroke: "#fff3b0", width: 2.2 },
    { d: ellipse(32, 18, 9, 3.2), fill: "#1f6e2e" },
    { d: "M29 9h6v9h-6Z", fill: WOOD },
  ]],
];

// ---- ২ মধুমাসের হাট: the fruits of জ্যৈষ্ঠ ----
const leafAt = (x: number, y: number, flip = false): Part[] => {
  const s = flip ? -1 : 1;
  return [
    { d: `M${x} ${y}C${x + 6 * s} ${y - 5} ${x + 15 * s} ${y - 4} ${x + 20 * s} ${y}C${x + 14 * s} ${y + 5} ${x + 6 * s} ${y + 5} ${x} ${y}Z`, fill: LEAF },
    { d: `M${x + 2 * s} ${y}H${x + 17 * s}`, stroke: LEAF_DEEP, width: 1 },
  ];
};
const aamBody = "M17 25C23 11 46 12 51 30C55 45 44 57 30 56C17 55 10 39 17 25Z";
const banana = ["M33 14C20 18 12 32 16 50C18 46 22 30 34 18Z", "M34 14C29 28 30 44 36 56C38 50 38 30 36 15Z", "M35 14C48 18 56 32 52 50C50 46 46 30 35 18Z"].join("");
const dabBody = "M14 35C14 21 22 15 32 15C42 15 50 21 50 35C50 49 42 57 32 57C22 57 14 49 14 35Z";
const FRUITS: Array<[string, string, string, Part[]]> = [
  ["aam", "আম", "#fff4d8", [
    { d: aamBody, fill: "#f6b928" },
    { d: ellipse(42, 27, 8, 7.5), fill: "#f2763a9c" },
    { d: "M22 29C22 23 25 19 29 17.5", stroke: "#fff6c8", width: 2.6 },
    { d: "M33 13L35 6", stroke: STEM, width: 2.4 },
    ...leafAt(35, 7),
  ]],
  ["kathal", "কাঁঠাল", "#f3f7df", [
    { d: "M32 15V6", stroke: STEM, width: 3.2 },
    { d: ellipse(32, 37, 18, 21), fill: "#9db83c" },
    { d: inside(32, 37, 18, 21, 5.2, (x, y) => `M${x - 1.6} ${y}L${x} ${y - 1.8}L${x + 1.6} ${y}L${x} ${y + 1.8}Z`), fill: "#748f24" },
    { d: "M20 30C20 24 23 20 27 18.5", stroke: "#d6e89a", width: 2.4 },
  ]],
  ["lichu", "লিচু", "#fdeef0", [
    { d: "M10 10C22 12 30 19 33 28M33 28L26 30M33 28L41 31M33 28L34 40", stroke: STEM, width: 2 },
    ...leafAt(12, 11, false),
    { d: circle(25, 40, 10) + circle(42, 41, 10) + circle(34, 52, 8.5), fill: "#d73a49" },
    { d: [inside(25, 40, 10, 10, 4, (x, y) => circle(x, y, 0.9)), inside(42, 41, 10, 10, 4, (x, y) => circle(x, y, 0.9)), inside(34, 52, 8.5, 8.5, 4, (x, y) => circle(x, y, 0.9))].join(""), fill: "#9e1b30" },
    { d: "M19 37C19.5 34 21.5 32 24 31.5M36.5 38C37 35 39 33 41.5 32.5", stroke: "#ffd3da", width: 1.8 },
  ]],
  ["jam", "জাম", "#f1ebf6", [
    { d: "M33 8C31 15 27 20 22 27M33 8C35 17 39 22 43 28M33 8C33 20 33 30 32 38", stroke: "#5b3a1e", width: 1.8 },
    ...leafAt(33, 9, true),
    { d: ellipse(21, 37, 7.5, 10) + ellipse(43, 38, 7.5, 10) + ellipse(32, 48, 7.5, 10), fill: "#4a2560" },
    { d: ellipse(18.5, 33, 2, 3.2) + ellipse(40.5, 34, 2, 3.2) + ellipse(29.5, 44, 2, 3.2), fill: "#a283bd" },
  ]],
  ["kola", "কলা", "#fffbe0", [
    { d: "M29 6L34 15", stroke: "#6b5323", width: 3.4 },
    { d: banana, fill: "#f5cf33", stroke: "#c49a1c", width: 1.2 },
    { d: dots([[16, 50], [36, 56], [52, 50]], 1.9), fill: "#5b4312" },
  ]],
  ["peyara", "পেয়ারা", "#f2f9e6", [
    { d: "M32 15V9", stroke: STEM, width: 2.4 },
    ...leafAt(33, 11),
    { d: "M32 15C44 15 52 26 50 38C48 50 40 57 32 57C24 57 16 50 14 38C12 26 20 15 32 15Z", fill: "#a9cf54" },
    { d: ellipse(25, 31, 5, 7), fill: "#cfe58f" },
    { d: "M28 57l2-3.4 2 3.4 2-3.4 2 3.4", stroke: "#6b7d2a", width: 1.4 },
  ]],
  ["anaros", "আনারস", "#fff3e0", [
    { d: "M32 27L22 5L29 18L32 2L35 18L42 5Z", fill: LEAF },
    { d: "M32 27L15 14L27 24M32 27L49 14L37 24", stroke: LEAF_DEEP, width: 2.4 },
    { d: ellipse(32, 43, 14, 17), fill: "#e9a52b" },
    { d: inside(32, 43, 14, 17, 5.4, (x, y) => `M${x - 2.2} ${y}L${x} ${y - 2.2}L${x + 2.2} ${y}L${x} ${y + 2.2}Z`), fill: "#b8741a" },
  ]],
  ["dab", "ডাব", "#e9f5e4", [
    { d: dabBody, fill: "#4f9a3a" },
    { d: ellipse(32, 17, 8, 3), fill: "#f1e7c6" },
    { d: "M34 17L45 2", stroke: "#e64980", width: 3 },
    { d: "M20 31C20 25 24 21 28 20", stroke: "#a3d483", width: 2.6 },
  ]],
  ["tormuj", "তরমুজ", "#fdeeee", [
    { d: "M5 28H59A27 27 0 0 1 5 28Z", fill: "#2f8a3a" },
    { d: "M8.5 28H55.5A23.5 23.5 0 0 1 8.5 28Z", fill: "#d8f0a8" },
    { d: "M12 28H52A20 20 0 0 1 12 28Z", fill: "#ec3d4a" },
    { d: [ellipse(22, 34, 1.4, 2.2), ellipse(32, 36, 1.4, 2.2), ellipse(42, 34, 1.4, 2.2), ellipse(27, 42, 1.4, 2.2), ellipse(37, 42, 1.4, 2.2), ellipse(32, 47, 1.4, 2.2)].join(""), fill: "#2b1a12" },
  ]],
  ["jamrul", "জামরুল", "#fff0f4", [
    { d: "M22 14V8M42 18V12", stroke: STEM, width: 2 },
    { d: "M22 14C27 14 29 19 29 26C29 34 33 40 31 46C29 52 15 52 13 46C11 40 15 34 15 26C15 19 17 14 22 14Z", fill: "#f39cb0" },
    { d: "M42 18C47 18 49 23 49 30C49 38 53 44 51 50C49 56 35 56 33 50C31 44 35 38 35 30C35 23 37 18 42 18Z", fill: "#f6b5c4" },
    { d: "M15 47l3-3 3 3 3-3 3 3 3-3M35 51l3-3 3 3 3-3 3 3 3-3", stroke: "#c45a77", width: 1.4 },
    { d: "M18 22C18 19 19.5 17 21.5 16.5M38 26C38 23 39.5 21 41.5 20.5", stroke: "#fff1f4", width: 2 },
  ]],
];
const FRUIT_TWINS: Array<[string, string, string, number, Part[]]> = [
  ["kacha-aam", "কাঁচা আম", "#eef7e0", 0, [
    { d: aamBody, fill: "#86c04a" },
    { d: "M22 29C22 23 25 19 29 17.5", stroke: "#e8f7c4", width: 2.6 },
    { d: dots([[27, 37], [35, 44], [41, 34], [30, 27], [44, 43], [22, 44]], 1.3), fill: "#d4ecad" },
    { d: "M33 13L35 6", stroke: STEM, width: 2.4 },
    ...leafAt(35, 7),
    ...leafAt(34, 8, true),
  ]],
  ["kachkola", "কাঁচকলা", "#ecf5e2", 4, [
    { d: "M29 6L34 15", stroke: "#4f6b23", width: 3.4 },
    { d: banana, fill: "#6fae3c", stroke: "#3f7a26", width: 1.2 },
    { d: "M19 44C20 33 25 25 32 19M34 50C33 38 34 28 35.5 19M49 44C48 33 43 25 36 19", stroke: "#3f7a26", width: 1.3 },
    { d: dots([[16, 50], [36, 56], [52, 50]], 1.9), fill: "#2f4f1a" },
  ]],
  ["narkel", "ঝুনা নারকেল", "#f6eee4", 7, [
    { d: ellipse(32, 37, 18, 19), fill: "#8a5a2b" },
    { d: "M18 30l-3-2M20 44l-3 1M26 53l-1 3M38 53l1 3M46 44l3 1M46 30l3-2M24 22l-2-3M40 22l2-3M32 56v3", stroke: "#6b4320", width: 1.6 },
    { d: circle(27, 27, 2.4) + circle(37, 27, 2.4) + circle(32, 34, 2.4), fill: "#3b2410" },
    { d: "M20 36C20 30 22 26 25 24", stroke: "#b07a45", width: 2.2 },
  ]],
];

// ---- ৩ বিলের পাখি: the birds of a বিল, side view, facing right ----
type Bird = {
  body: string; head: string; beak: string; tail: string; wing: string;
  belly?: string; beakLen?: number; beakThick?: number; tailUp?: number; tailLen?: number; eye?: string; eyeR?: number;
  legs?: string; perch?: "branch" | "water" | "reeds"; extra?: Part[]; top?: Part[];
};
function bird(b: Bird): Part[] {
  const len = b.beakLen ?? 7, thick = b.beakThick ?? 3, up = b.tailUp ?? 0, tl = b.tailLen ?? 13;
  const perch: Part[] = b.perch === "water"
    ? [{ d: "M4 54C10 51 14 57 20 54S30 51 36 54S46 57 52 54S58 52 60 53", stroke: "#5fa8d3", width: 1.8 }]
    : b.perch === "reeds"
      ? [{ d: "M8 62C9 52 8 46 6 40M14 62C14 54 16 48 19 44M56 62C55 54 56 48 58 42", stroke: "#7d9a4a", width: 2 }]
      : [{ d: "M4 52C20 49 44 50 60 53", stroke: "#8a6a45", width: 2.6 }];
  const tail = `M19 35L${19 - tl} ${33 - up - 3}L${19 - tl + 2} ${36 - up}L${19 - tl} ${39 - up + 3}L19 41Z`;
  return [
    ...perch,
    ...(b.legs ? [{ d: "M28 46L26 52M34 46L35 52", stroke: b.legs, width: 1.8 }] : []),
    { d: tail, fill: b.tail },
    { d: ellipse(31, 38, 14.5, 10.5), fill: b.body },
    ...(b.belly ? [{ d: "M19 41C24 49 38 50 44 41C38 45 26 46 19 41Z", fill: b.belly }] : []),
    { d: "M20 35C26 28 38 30 41 38C34 42 26 42 20 35Z", fill: b.wing },
    { d: circle(44, 27, 8), fill: b.head },
    ...(b.top ?? []),
    { d: `M50.5 ${27 - thick / 2}L${50.5 + len} 27.6L50.5 ${27 + thick / 2}Z`, fill: b.beak },
    { d: circle(46.5, 25, b.eyeR ?? 1.6), fill: b.eye ?? "#111" },
    ...(b.extra ?? []),
  ];
}
const BIRDS: Array<[string, string, string, Part[]]> = [
  ["doyel", "দোয়েল", "#eef3f7", bird({
    body: "#1f2328", head: "#1f2328", wing: "#2b3036", tail: "#1f2328", beak: "#1f2328", belly: "#ffffff", tailUp: 12, tailLen: 12, eye: "#ffffff", eyeR: 1.1,
    extra: [{ d: "M24 34C29 31 35 32 38 35", stroke: "#ffffff", width: 2.4 }, { d: "M8 21L12 18", stroke: "#ffffff", width: 2 }], legs: "#3a3a3a",
  })],
  ["shalik", "শালিক", "#f6efe6", bird({
    body: "#7b4b2a", head: "#2a1f1a", wing: "#5f3a20", tail: "#2a1f1a", beak: "#f2c230", legs: "#e3b21f",
    top: [{ d: ellipse(47, 26, 4.2, 3.2), fill: "#f2c230" }], extra: [{ d: ellipse(28, 40, 3.8, 2.4), fill: "#ffffff" }],
  })],
  ["machhranga", "মাছরাঙা", "#e8f4fb", bird({
    body: "#1d78c8", head: "#1d78c8", wing: "#145a99", tail: "#145a99", beak: "#d9342b", belly: "#e5812b", beakLen: 15, beakThick: 3.2, tailLen: 8, perch: "reeds",
    top: [{ d: "M39 30C42 33 47 33 50 30C48 34 42 35 39 30Z", fill: "#ffffff" }, { d: ellipse(42, 27, 3, 2), fill: "#e5812b" }],
  })],
  ["kak", "কাক", "#eef0f2", bird({
    body: "#23262b", head: "#23262b", wing: "#16181c", tail: "#16181c", beak: "#16181c", beakLen: 8, beakThick: 3.6, eye: "#4a2a1a", legs: "#23262b",
    extra: [{ d: "M37 32C40 27 45 33 49 32C49 36 43 39 37 37Z", fill: "#8e949b" }],
  })],
  ["tia", "টিয়া", "#eaf6e7", bird({
    body: "#3aa64a", head: "#3aa64a", wing: "#2b8a3a", tail: "#2b8a3a", beak: "#d6282f", beakLen: 0.1, tailUp: -10, tailLen: 17,
    extra: [{ d: "M50 24C56 23 58 28 55 32C54 30 52 29 50 30Z", fill: "#d6282f" }, { d: "M38 31C41 35 46 35 49 32", stroke: "#1b1b1b", width: 1.6 }, { d: "M38.5 33C41 37 46 37 49 34", stroke: "#f08aa6", width: 1.2 }],
  })],
  ["bok", "বক", "#e7f1f6", [
    { d: "M4 56C10 53 14 59 20 56S30 53 36 56S46 59 52 56S58 54 60 55", stroke: "#5fa8d3", width: 1.8 },
    { d: "M26 46L24 58M32 46L33 58", stroke: "#2b2b2b", width: 1.6 },
    { d: "M16 38L6 34L10 40Z", fill: "#e9edf0", stroke: "#b9c2ca", width: 1 },
    { d: ellipse(27, 40, 12, 7.5), fill: "#ffffff", stroke: "#b9c2ca", width: 1.2 },
    { d: "M36 37C44 30 34 24 41 15", stroke: "#b9c2ca", width: 6.4 },
    { d: "M36 37C44 30 34 24 41 15", stroke: "#ffffff", width: 4.4 },
    { d: circle(43, 13, 4.4), fill: "#ffffff", stroke: "#b9c2ca", width: 1.2 },
    { d: "M46.5 11.6L59 13.6L46.5 15Z", fill: "#f2b705" },
    { d: circle(44.4, 12.3, 1.1), fill: "#111" },
  ]],
  ["chorui", "চড়ুই", "#f5efe7", bird({
    body: "#a0703f", head: "#8a8f96", wing: "#6e4a28", tail: "#6e4a28", beak: "#2a2a2a", beakLen: 5, beakThick: 4, belly: "#e7dccb", tailLen: 9, legs: "#b8865a",
    top: [{ d: "M38 28C40 31 45 32 48 30C47 34 42 35 38 33Z", fill: "#e7dccb" }, { d: "M48 31C50 33 50 36 47 37C46 35 46 33 48 31Z", fill: "#2a2a2a" }],
    extra: [{ d: "M23 35l4-3M29 33l4-3M26 38l4-3", stroke: "#3f2a16", width: 1.4 }],
  })],
  ["kokil", "কোকিল", "#eef0f5", bird({
    body: "#1b1e24", head: "#1b1e24", wing: "#111317", tail: "#111317", beak: "#b7c98a", beakLen: 7, beakThick: 3, tailLen: 21, tailUp: -2, eye: "#e0262f", eyeR: 2.4,
    extra: [{ d: "M24 34C29 32 35 33 38 36", stroke: "#3b4a6a", width: 1.4 }],
  })],
  ["hans", "হাঁস", "#e8f3f8", [
    { d: "M4 54C10 51 14 57 20 54S30 51 36 54S46 57 52 54S58 52 60 53", stroke: "#5fa8d3", width: 1.8 },
    { d: "M11 40C11 31 22 31 30 34C38 36 42 34 44 30L48 34C50 46 40 52 28 52C17 52 11 47 11 40Z", fill: "#fbfbf7", stroke: "#c4cbd1", width: 1.2 },
    { d: "M42 34C42 25 40 20 44 15C48 11 54 14 53 20C52 24 48 26 48 34Z", fill: "#fbfbf7", stroke: "#c4cbd1", width: 1.2 },
    { d: "M52 17.5C56 17 60 18 60 20C60 22 56 22.5 52 21.5Z", fill: "#f08a24" },
    { d: circle(49.5, 17.5, 1.3), fill: "#111" },
    { d: "M18 40C24 38 31 40 35 44", stroke: "#c4cbd1", width: 1.6 },
  ]],
  ["bulbuli", "বুলবুলি", "#f3eeea", bird({
    body: "#4a3b33", head: "#16110e", wing: "#3a2d26", tail: "#3a2d26", beak: "#16110e", beakLen: 6, belly: "#bfb6ad", tailLen: 13, tailUp: -3, legs: "#3a3a3a",
    top: [{ d: "M39 22L42 9L49 21Z", fill: "#16110e" }],
    extra: [{ d: ellipse(20, 44, 4.6, 3), fill: "#d62d35" }, { d: ellipse(18, 37, 3, 2), fill: "#ece6e0" }],
  })],
];
const BIRD_TWINS: Array<[string, string, string, number, Part[]]> = [
  ["darkak", "দাঁড়কাক", "#ecedf3", 3, bird({
    body: "#15171a", head: "#15171a", wing: "#0c0d0f", tail: "#0c0d0f", beak: "#0c0d0f", beakLen: 11, beakThick: 6.5, eye: "#4a2a1a", legs: "#15171a",
    extra: [{ d: "M50 23.5C54 22 59 24 61.5 27.6L50 25Z", fill: "#0c0d0f" }, { d: "M24 34C29 31 35 32 39 36", stroke: "#3b4f7a", width: 1.6 }],
  })],
  ["gangshalik", "গাঙশালিক", "#eef0f3", 1, bird({
    body: "#8d939c", head: "#8d939c", wing: "#6c727b", tail: "#2a2d33", beak: "#f08a2c", legs: "#e8a04a",
    top: [{ d: "M36 26C36 18 44 16 50 20C46 21 40 22 36 26Z", fill: "#1f2125" }, { d: "M41 23L53 25L46 32Z", fill: "#e8612c" }],
    extra: [{ d: ellipse(28, 40, 3.8, 2.4), fill: "#ffffff" }],
  })],
  ["kanibok", "কানিবক", "#f2eee6", 5, [
    { d: "M4 56C10 53 14 59 20 56S30 53 36 56S46 59 52 56S58 54 60 55", stroke: "#5fa8d3", width: 1.8 },
    { d: "M26 47L25 56M32 47L33 56", stroke: "#b7b043", width: 1.8 },
    { d: "M16 40L7 37L10 43Z", fill: "#ffffff", stroke: "#b9a88c", width: 1 },
    { d: ellipse(28, 41, 13, 8), fill: "#b98a55" },
    { d: "M18 42C24 48 34 49 40 44C34 46 24 46 18 42Z", fill: "#ffffff" },
    { d: "M35 38C38 32 37 28 40 24L46 26C45 30 44 34 40 40Z", fill: "#c9a06b" },
    { d: "M38 30l3 1M37.5 34l3 1", stroke: "#7a5530", width: 1.2 },
    { d: circle(43, 23, 5.2), fill: "#c9a06b" },
    { d: "M47.5 21.5L58 23.6L47.5 25.2Z", fill: "#e2c23a" },
    { d: "M55 22.8L58 23.6L55 24.4Z", fill: "#2b2b2b" },
    { d: circle(44.6, 22, 1.2), fill: "#111" },
  ]],
];

/** Every picture by id. World 1 first (the old toys keep ids 0–9, the legacy boards' toy indexes), then each world's twins. */
export const PICTURES: readonly Picture[] = (() => {
  const out: Picture[] = [];
  const add = (world: number, base: typeof TOYS, twins: typeof TOY_TWINS) => {
    const first = out.length;
    for (const [key, name, tint, parts] of base) out.push({ id: out.length, key, name, tint, world, twinOf: -1, parts });
    for (const [key, name, tint, of, parts] of twins) out.push({ id: out.length, key, name, tint, world, twinOf: first + of, parts });
  };
  add(0, TOYS, TOY_TWINS);
  add(1, FRUITS, FRUIT_TWINS);
  add(2, BIRDS, BIRD_TWINS);
  return out;
})();

/** One world's set: its ten pictures and its three [twin, base] look-alike pairs. */
export function worldSet(world: number) {
  const mine = PICTURES.filter(picture => picture.world === world);
  return {
    base: mine.filter(picture => picture.twinOf < 0).map(picture => picture.id),
    twins: mine.filter(picture => picture.twinOf >= 0).map(picture => [picture.id, picture.twinOf] as const),
  };
}
export const pictureName = (id: number) => PICTURES[id]?.name ?? "";
/** The look-alike of a picture on the same board, if its twin set exists (else -1). */
export function twinOf(id: number) {
  const picture = PICTURES[id];
  if (!picture) return -1;
  if (picture.twinOf >= 0) return picture.twinOf;
  return PICTURES.find(other => other.twinOf === id)?.id ?? -1;
}

/** Draws a picture into a canvas, `size` pixels square with its top-left at (x, y). Browser only (Path2D). */
export function drawPicture(context: CanvasRenderingContext2D, id: number, x: number, y: number, size: number) {
  const picture = PICTURES[id];
  if (!picture) return;
  context.save();
  context.translate(x, y);
  context.scale(size / 64, size / 64);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const part of picture.parts) {
    const path = new Path2D(part.d);
    if (part.fill) { context.fillStyle = part.fill; context.fill(path); }
    if (part.stroke) { context.strokeStyle = part.stroke; context.lineWidth = part.width ?? 1.5; context.stroke(path); }
  }
  context.restore();
}
