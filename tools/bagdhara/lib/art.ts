import type { IdiomId } from "./idioms";

// Original line drawings in the manner of an old grammar-book plate: black ink, paper-white fills, one or two faded print colours.
// Box 200×140. Each drawing takes the idiom literally. No text inside the art (an SVG drawn into a canvas can't load web fonts).
const INK = "#2a2018";
const PAPER = "#fffaf0";
const S = (w = 2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const p = (d: string, fill = "none", w = 2) => `<path d="${d}" fill="${fill}" ${S(w)}/>`;
const c = (cx: number, cy: number, r: number, fill = "none", w = 2) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${S(w)}/>`;
const e = (cx: number, cy: number, rx: number, ry: number, fill = "none", w = 2, rotate = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${S(w)}${rotate ? ` transform="rotate(${rotate} ${cx} ${cy})"` : ""}/>`;
const dot = (cx: number, cy: number, r = 1.8, fill = INK) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const tint = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;
const ground = (y = 126) => p(`M10 ${y}H190`, "none", 1.6) + p(`M28 ${y}l2-5 2 5M152 ${y}l2-6 2 6M174 ${y}l1.5-4 1.5 4`, "none", 1.3);
const drop = (x: number, y: number, fill = "#86aec4") => `<path d="M${x} ${y}q4 6 0 8q-4-2 0-8z" fill="${fill}" ${S(1.2)}/>`;
const eye = (x: number, y: number, r = 5) => c(x, y, r, PAPER, 1.6) + dot(x + 0.5, y + 0.8, r * 0.55) + dot(x - r * 0.25, y - r * 0.2, r * 0.18, PAPER);
/** Hatching: short parallel strokes for shade, the way cheap print did it. */
const hatch = (x: number, y: number, count: number, gap = 4, len = 7) => p(Array.from({ length: count }, (_, i) => `M${x + i * gap} ${y}l${-len * 0.5} ${len}`).join(""), "none", 1);
const round = (value: number) => Math.round(value * 10) / 10;

function tree(x: number, top: number, r: number, base = 126, face = "") {
  return p(`M${x - 5} ${base}Q${x - 3} ${top + r} ${x - 2} ${top + r * 0.6}M${x + 5} ${base}Q${x + 3} ${top + r} ${x + 2} ${top + r * 0.6}`, "none", 2)
    + p(`M${x - r} ${top + r * 0.3}q-6-${r * 0.7} ${r * 0.4}-${r}q${r * 0.3}-${r * 0.6} ${r * 0.9}-${r * 0.3}q${r * 0.7}-${r * 0.2} ${r * 0.9} ${r * 0.5}q${r * 0.6} ${r * 0.6} ${r * 0.1} ${r * 1.1}q-${r * 0.5} ${r * 0.5}-${r * 1.1} ${r * 0.2}q-${r * 0.7} ${r * 0.1}-${r * 1.2}-${r * 0.5}z`, "#c9d6a3")
    + face;
}

function person(x: number, y: number, opts: { mouth?: string; eyes?: string } = {}) {
  return c(x, y, 9, PAPER) + (opts.eyes ?? dot(x - 3, y - 1, 1.4) + dot(x + 3, y - 1, 1.4)) + (opts.mouth ?? p(`M${x - 3} ${y + 4}q3 2 6 0`, "none", 1.4));
}

const art: Record<IdiomId, () => string> = {
  "bheja-biral": () => {
    const rain = [[30, 10], [52, 30], [24, 56], [44, 78], [150, 14], [172, 38], [158, 70], [182, 86], [70, 8], [130, 6], [140, 40], [60, 52]]
      .map(([x, y]) => `M${x} ${y}l-5 12`).join("");
    return `<path d="${rain}" stroke="#6f8fa3" stroke-width="1.6" stroke-linecap="round"/>`
      + e(100, 127, 60, 7, "#c9dbe2", 0) + p("M58 127h10M128 129h14", "none", 1.2)
      + p("M122 120Q152 124 150 106Q148 96 140 100", "none", 5) + p("M122 120Q152 124 150 106Q148 96 140 100", "none", 2)
      + p("M78 124Q72 98 82 80Q100 70 118 80Q128 98 122 124L117 119L112 125L107 119L102 125L97 119L92 125L87 119L82 125Z", "#d8d0c0")
      + hatch(112, 88, 4, 3.5, 9) + p("M92 98V122M108 98V122", "none", 1.6)
      + p("M83 49L64 53L82 60Z", "#d8d0c0") + p("M117 49L136 53L118 60Z", "#d8d0c0")
      + c(100, 60, 21, "#d8d0c0") + p("M88 42l3-5 3 5 3-6 3 6 3-6 3 6 3-5", "none", 1.6)
      + eye(92, 60, 7) + eye(108, 60, 7) + p("M84 50q5-3 10 1M106 51q5-4 10-1", "none", 1.6)
      + p("M98 67h4l-2 3z", INK, 1.2) + p("M96 73q4 3 8 0", "none", 1.4)
      + p("M88 70L73 76M88 73L75 81M112 70L127 76M112 73L125 81", "none", 1.1)
      + drop(84, 122) + drop(114, 124) + drop(101, 38);
  },
  "oronne-rodon": () => {
    const sleep = (x: number, y: number) => p(`M${x - 7} ${y}q3 3 6 0M${x + 3} ${y}q3 3 6 0`, "none", 1.4) + p(`M${x + 12} ${y - 14}h6l-6 6h6M${x + 20} ${y - 22}h4l-4 4h4`, "none", 1.2);
    return ground() + tree(34, 36, 24, 126, sleep(34, 52)) + tree(162, 34, 24, 126, sleep(162, 50)) + tree(128, 60, 16, 126, sleep(128, 72))
      + p("M70 126Q66 106 80 100Q96 99 98 112L98 126Z", "#e9d9b6") + c(94, 110, 7, "#e9d9b6")
      + p("M80 106q8 6 16 2", "none", 1.6) + person(82, 90, { eyes: p("M77 89q2 2 4 0M84 89q2 2 4 0", "none", 1.4), mouth: e(83, 95, 2.4, 2, INK, 0) })
      + p("M78 92v7M87 92v8", "none", 1.4).replace(INK, "#5d8fb0") + drop(76, 101) + drop(89, 103)
      + p("M96 82q5 4 0 9M101 78q8 8 0 17M106 74q11 12 0 24", "none", 1.4);
  },
  "kanthaler-amsotto": () => {
    const spikes = Array.from({ length: 30 }, (_, i) => {
      const row = Math.floor(i / 5), col = i % 5;
      const x = 42 + col * 9 + (row % 2) * 4, y = 50 + row * 11;
      return `M${x - 2} ${y + 2}l2-3 2 3`;
    }).join("");
    return ground(128) + e(62, 86, 34, 42, "#b8bf5a", 2, -8) + p(spikes, "none", 1.1) + p("M58 44Q60 34 70 30", "none", 3)
      + e(62, 128, 30, 3, "#2a201822", 0)
      + p("M100 86Q112 76 124 84", "none", 2) + p("M118 78l7 6-9 2", "none", 2)
      + p("M128 92q6-4 12 0t12 0 12 0 12 0v28q-6 4-12 0t-12 0-12 0-12 0z", "#e0953a") + p("M134 100h34M134 108h34M134 116h30", "none", 1).replace(INK, "#a8601f")
      + p("M168 92q8 2 6 10", "none", 1.6)
      + p("M144 40q0-14 13-14t13 12q0 9-11 13v9", "none", 4) + dot(159, 72, 3);
  },
  "bhuter-mukhe": () => {
    const flower = (x: number, y: number) => [0, 72, 144, 216, 288].map(a => dot(round(x + Math.cos(a * Math.PI / 180) * 3.6), round(y + Math.sin(a * Math.PI / 180) * 3.6), 2.6, "#e08a6a")).join("") + dot(x, y, 1.8, "#e7c76a");
    return `<path d="M170 14a14 14 0 1 0 10 26a11 11 0 1 1-10-26z" fill="#e7c76a" ${S(1.6)}/>`
      + p("M146 20l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM186 64l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z", "#e7c76a", 1)
      + p("M58 124Q54 70 66 50Q82 28 100 30Q120 30 134 52Q142 72 138 124l-10-8-10 8-10-8-10 8-10-8-10 8-10-8-10 8-10-8z", PAPER)
      + hatch(124, 70, 4, 3.5, 10)
      + p("M83 61q5 4 10 0M105 61q5 4 10 0", "none", 1.8) + p("M94 73q5 4 10 0", "none", 1.6)
      + p("M78 92Q90 98 98 88M122 92Q110 98 102 88", "none", 1.8) + p("M100 72Q106 82 100 92Q94 82 100 72Z", PAPER, 1.6)
      + p("M14 30q0-16 26-16t26 16-26 16q-4 0-8-1l-6 9 0-11Q14 40 14 30Z", PAPER, 1.6)
      + flower(28, 29) + flower(42, 26) + flower(55, 30);
  },
  "tele-begune": () => {
    const flame = (x: number, h: number) => `<path d="M${x - 7} 134q-2-${h * 0.6} 7-${h}q9 ${h * 0.4} 7 ${h}z" fill="#e8743a" ${S(1.4)}/><path d="M${x - 3} 134q0-${h * 0.4} 3-${h * 0.6}q3 ${h * 0.3} 3 ${h * 0.6}z" fill="#f2c230"/>`;
    return flame(70, 16) + flame(88, 22) + flame(106, 18) + flame(124, 22) + flame(140, 14)
      + p("M36 94q-14-2-14 6t12 4M164 94q14-2 14 6t-12 4", "none", 3)
      + p("M34 92Q100 146 166 92Z", "#4a4038") + e(100, 92, 66, 8, "#e2b33f", 2)
      + c(70, 92, 2.4, "#f5d77a", 1) + c(132, 90, 2, "#f5d77a", 1) + c(146, 93, 1.6, "#f5d77a", 1) + c(60, 90, 1.5, "#f5d77a", 1)
      + p("M100 92Q74 90 76 66Q78 48 96 46Q114 48 118 66Q122 90 100 92Z", "#6b3d6e")
      + p("M86 48Q96 38 106 48L112 44L106 53L96 50L86 53L80 44Z", "#6f8f3a", 1.6) + p("M96 41Q97 33 102 29", "none", 3)
      + `<path d="M84 60l11 4M116 60l-11 4M90 78l4-3 4 3 4-3 4 3 4-3" fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
      + dot(91, 68, 2.6, PAPER) + dot(109, 68, 2.6, PAPER)
      + p("M80 30q-6-6 0-12t0-12M100 22q-6-6 0-10M120 30q6-6 0-12t0-12", "none", 1.6).replace(INK, "#8a8178")
      + p("M60 70l-8-6M58 82l-10 0M140 70l8-6M142 82l10 0", "none", 1.6);
  },
  "okal-kushmando": () => {
    const rays = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return `M${round(162 + Math.cos(a) * 22)} ${round(30 + Math.sin(a) * 22)}L${round(162 + Math.cos(a) * 30)} ${round(30 + Math.sin(a) * 30)}`;
    }).join("");
    return p(rays, "none", 2) + c(162, 30, 16, "#f0b43c") + p("M154 30q8 6 16 0", "none", 1.6) + dot(156, 25, 1.6) + dot(168, 25, 1.6)
      + p("M18 120q20-30 40-16t30-8", "none", 2).replace(INK, "#5f7f34") + p("M40 96q6-12 18-8q-2 12-18 8z", "#8fae5a", 1.4)
      + p("M48 126Q60 104 96 108Q132 104 148 126Z", "#8fae5a") + p("M96 110V124M76 112l10 10M118 112l-10 10", "none", 1)
      + e(98, 102, 30, 22, "#d9893a") + p("M86 82Q78 102 86 122M110 82Q118 102 110 122M98 80V124", "none", 1.4)
      + p("M98 80q-2-10 6-14", "none", 3)
      + p("M70 92Q98 104 126 92L128 100Q98 112 68 100Z", "#c4453a", 1.6) + p("M120 98l6 22 8-2-6-20", "#c4453a", 1.6)
      + p("M80 96l-2 8M92 99l-1 8M104 99l1 8M116 96l2 8M124 106l6-2M126 112l6-2", "none", 1.2).replace(INK, PAPER)
      + p("M88 112q3-2 6 0M102 112q3-2 6 0M94 118q4 2 8 0", "none", 1.4)
      + drop(64, 82, "#9cc3d6") + drop(132, 78, "#9cc3d6") + drop(140, 90, "#9cc3d6")
      + p("M30 58q4-4 8 0t8 0M150 66q4-4 8 0t8 0", "none", 1.2).replace(INK, "#c8873a");
  },
  "jilapir-pach": () => {
    const points: string[] = [];
    for (let t = 0; t <= Math.PI * 5.2; t += 0.2) {
      const r = 8 + t * 2.9;
      points.push(`${round(100 + Math.cos(t) * r)} ${round(74 + Math.sin(t) * r * 0.86)}`);
    }
    const spiral = `M${points.join("L")}`;
    const t = Math.PI * 2.6, r = 8 + t * 2.9;
    const ax = round(100 + Math.cos(t) * r), ay = round(74 + Math.sin(t) * r * 0.86);
    return e(100, 80, 82, 52, "#a9bf7a", 2) + p("M30 70q30 10 70 10t70-10M40 104q30-6 60-6t60 6", "none", 1).replace(INK, "#7c955a")
      + `<path d="${spiral}" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${spiral}" fill="none" stroke="#e8962e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${spiral}" fill="none" stroke="#f6c46a" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 10"/>`
      + `<g transform="translate(${ax} ${ay})">` + e(-5, 0, 3, 2.2, INK, 0) + e(0, 0, 2, 1.6, INK, 0) + e(5, 0, 3.4, 2.6, INK, 0)
      + p("M-1 0l-3 4M0 0v5M1 0l3 4M-1 0l-3-4M0 0v-5M1 0l3-4M-7 -1l-4-4M-7 1l-4-1", "none", 0.9) + `</g>`
      + p(`M${ax + 2} ${ay - 26}q0-8 7-8t7 7q0 5-6 7v4`, "none", 2.4) + dot(ax + 9, ay - 8, 1.8);
  },
  "gure-bali": () => {
    const sand = Array.from({ length: 18 }, (_, i) => dot(round(118 - i * 1.3 + (i % 3) * 3), round(46 + i * 1.6), 1.4, "#b08d4a")).join("");
    return ground() + `<g transform="rotate(130 140 34)">${p("M124 24H156L152 46H128Z", "#9aa0a6")}${p("M126 24Q140 6 154 24", "none", 1.6)}${p("M130 32H150", "none", 1)}</g>`
      + p("M116 44Q106 58 104 74L116 76Q118 60 126 48Z", "#e3c27a", 1.2) + sand
      + e(90, 124, 32, 3, "#2a201822", 0)
      + p("M62 80Q52 108 72 120Q90 128 108 120Q128 108 118 80Z", "#b65a32") + e(90, 78, 30, 7, "#b65a32") + e(90, 78, 22, 4.5, "#6b3a1a", 1.4)
      + p("M104 76q2-6 8-4l-2 6z", "#e3c27a", 1)
      + p("M72 92q4-2 8 0M98 92q4-2 8 0M80 106q9-6 18 0", "none", 1.8) + dot(76, 96, 1.8) + dot(102, 96, 1.8)
      + drop(108, 100, "#9cc3d6")
      + p("M64 86q-2 10 2 22", "none", 1.4).replace(INK, "#e9a27a")
      + p("M46 50q6-6 10 0M42 42l-6-4M58 40l3-6", "none", 1.4) + e(50, 46, 4, 3, PAPER, 1.2);
  },
  "pukur-churi": () => {
    return ground() + `<ellipse cx="38" cy="126" rx="28" ry="5" fill="none" ${S(1.4)} stroke-dasharray="4 4"/>`
      + p("M14 112q6-6 12 0M24 104q6-6 12 0", "none", 1.4).replace(INK, "#a08a6a")
      + p("M62 76h-18M64 88h-24M66 100h-18", "none", 1.6)
      + e(100, 32, 46, 15, "#8a6a44") + e(100, 30, 40, 11, "#8fbfd2", 1.6) + p("M74 28q8-4 16 0M108 34q8-3 14 0", "none", 1).replace(INK, PAPER)
      + e(118, 27, 7, 3, "#5f8a3a", 1.2) + p("M66 30l-2-14M70 28l2-12M134 30l3-14", "none", 1.6).replace(INK, "#5f7f34")
      + p("M88 24q6-16 16-6q-4 4-8 2q-4 2-8 4z", "#e0953a", 1.4) + dot(98, 16, 1)
      + drop(74, 46) + drop(126, 48)
      + p("M104 78L86 52L82 44M116 78L120 52L122 44", "none", 2.4)
      + p("M102 74L118 74L114 100L98 100Z", PAPER) + p("M101 80H117M100 86H116M99 92H115", "none", 2)
      + p("M102 100L90 112L80 110M110 100L120 116L132 112", "none", 2.6)
      + person(110, 64, { eyes: `<rect x="100" y="59" width="20" height="5" rx="2" fill="${INK}"/>${dot(105, 61.5, 1.2, PAPER)}${dot(114, 61.5, 1.2, PAPER)}`, mouth: p("M106 69q4 2 8 0", "none", 1.4) });
  },
  "akash-theke-pora": () => {
    return ground() + p("M22 34q-2-14 14-14q4-12 20-10q12-10 26 2q18-2 18 12q10 4 4 12H26q-8-2-4-2z", PAPER)
      + `<path d="M64 46l14 22M82 44l14 22" fill="none" ${S(1.2)} stroke-dasharray="3 5"/>`
      + p("M98 70L84 50M98 70L104 46", "none", 2.6) + p("M84 50l-6-3M104 46l4-5", "none", 2.6)
      + p("M96 70L112 92L102 96L90 76Z", "#e0953a") + p("M106 84L130 76M100 90L82 104", "none", 2.4)
      + person(114, 104, { eyes: eye(110, 102, 3.6) + eye(119, 102, 3.6), mouth: e(115, 110, 2.4, 3, INK, 0) })
      + p("M108 94l-2-5M114 93v-6M120 94l2-5", "none", 1.6)
      + p("M144 80v14", "none", 4) + dot(144, 102, 2.6) + p("M150 104l10-4M150 112l12 0M150 120l10 4", "none", 1.4);
  },
  "gachhe-kanthal": () => {
    const fruit = (x: number, y: number) => e(x, y, 9, 13, "#b8bf5a", 1.6) + p(`M${x - 4} ${y - 4}l2-2 2 2M${x} ${y + 3}l2-2 2 2M${x - 3} ${y + 8}l2-2 2 2`, "none", 0.9) + p(`M${x} ${y - 13}v-4`, "none", 1.6);
    return ground() + p("M38 126Q44 80 40 40M56 126Q50 80 54 40", "#9a7048") + p("M40 40Q47 37 54 40", "none", 1)
      + p("M14 48q-6-22 16-28q8-18 30-10q20-8 28 10q16 8 4 26q-14 10-40 6q-26 6-38-4z", "#9fb46a")
      + fruit(38, 66) + fruit(58, 78) + fruit(42, 96)
      + `<path d="M118 60c-8-4-16-6-24-10M90 50c-6-2-12-2-16 0" fill="none" ${S(1.4)} stroke-dasharray="2 5"/>`
      + p("M118 126V112M138 126V112", "none", 2.4) + p("M114 112H142L140 96H116Z", "#9aa8c8") + p("M120 96v16M128 96v16M136 96v16M115 104h26", "none", 1).replace(INK, "#5a6890")
      + p("M116 96L112 76Q128 70 144 76L140 96Z", PAPER) + p("M118 80L152 62", "none", 2.4)
      + person(128, 62, { eyes: p("M122 60q2 2 4 0M130 60q2 2 4 0", "none", 1.4), mouth: p("M125 70q3 2 6 0", "none", 1.4) })
      + p("M128 66q-8-2-12 2q-2-6 4-8M128 66q8-2 12 2q2-6-4-8", "#3a2a1a", 1.4) + p("M120 64l2-1M136 64l-2-1", "none", 1).replace(INK, PAPER)
      + `<g transform="rotate(-40 154 56)">${p("M150 48h8v14h-8z", "#e2b33f", 1.6)}${p("M152 44h4v4h-4z", INK, 1)}</g>`
      + drop(144, 68, "#e2b33f");
  },
  "byanger-sordi": () => {
    return e(100, 120, 60, 10, "#5f8a3a") + p("M100 120L130 114", "none", 2)
      + p("M64 116Q58 84 82 76Q100 70 118 76Q142 84 136 116Z", "#86ad58")
      + c(84, 66, 11, "#86ad58") + c(116, 66, 11, "#86ad58") + c(84, 66, 6.5, PAPER, 1.4) + c(116, 66, 6.5, PAPER, 1.4)
      + dot(84, 68, 3.2) + dot(116, 68, 3.2) + p("M77 64h14M109 64h14", "none", 1.8)
      + `<path d="M77.6 63.5a6.5 6.5 0 0 1 12.8 0zM109.6 63.5a6.5 6.5 0 0 1 12.8 0z" fill="#86ad58"/>`
      + p("M66 92Q100 104 134 92L136 100Q100 112 64 100Z", "#c4453a", 1.6) + p("M128 98l4 18 8-2-4-16", "#c4453a", 1.6)
      + p("M78 96l-2 8M92 99v8M108 99v8M122 96l2 8", "none", 1.2).replace(INK, PAPER)
      + p("M86 84q14 6 28 0", "none", 1.6) + c(100, 80, 2.2, "#e48a8a", 1)
      + p("M54 76Q66 70 76 86Q66 92 54 88Z", PAPER, 1.4) + p("M76 86l8 10", "none", 2.4)
      + p("M40 74l-10-4M40 82l-12 1M42 90l-10 5M48 66l-6-8", "none", 1.4) + dot(34, 64, 1.5, "#86aec4") + dot(26, 78, 1.5, "#86aec4") + dot(30, 92, 1.5, "#86aec4")
      + p("M72 112l-6 6h10M128 112l6 6h-10", "none", 1.6);
  },
  "gachhe-tule-moi": () => {
    const note = (x: number, y: number) => p(`M${x} ${y}v-9l5-2v9`, "none", 1.4) + dot(x - 1.6, y, 2) + dot(x + 3.4, y - 2, 2);
    return ground() + p("M58 126Q62 90 60 56M74 126Q70 90 74 56", "#9a7048") + p("M64 70L88 48M70 62L46 46", "none", 3).replace(INK, "#7a5838")
      + p("M24 46q-6-22 16-28q10-16 32-8q22-6 30 12q16 8 6 24q-14 12-42 6q-30 6-42-6z", "#9fb46a")
      + p("M80 50q4 10 10 18M92 50q-2 10 2 20", "none", 2.4) + p("M76 44Q86 40 96 46", "none", 2.6)
      + person(88, 34, { eyes: eye(84, 33, 3) + eye(92, 33, 3), mouth: e(88, 39, 2, 2.4, INK, 0) }) + drop(100, 28, "#9cc3d6")
      + `<path d="M80 126h10M82 120h6" fill="none" ${S(1)} stroke-dasharray="2 3"/>`
      + p("M112 104L182 72M118 112L188 80", "none", 2.4) + p("M124 98l6 8M138 92l6 8M152 86l6 8M166 80l6 8", "none", 2)
      + person(146, 82) + p("M146 91V110M146 110l-8 16M146 110l8 16M146 96l-8 8M146 96l8 4", "none", 2.4)
      + note(160, 64) + note(172, 54);
  },
  "chinir-bolod": () => {
    const cubes = [[156, 92], [162, 104], [168, 116], [176, 124], [186, 126]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="4" fill="${PAPER}" ${S(1)}/>`).join("");
    const ants = [[146, 126], [160, 127], [172, 127]].map(([x, y]) => dot(x, y, 1.6) + dot(x + 3, y, 1.3) + dot(x + 6, y, 1.8)).join("");
    return ground() + p("M78 104V126M88 106V126M126 106V126M136 104V126", "none", 3)
      + e(108, 88, 44, 22, "#ece3cf") + p("M118 66Q126 56 136 68", "#ece3cf") + p("M152 84q12 4 10 24", "none", 1.8) + p("M160 106l4 6-6-2z", INK, 1)
      + p("M70 76Q54 70 48 82Q46 96 58 98Q68 98 72 92Z", "#ece3cf") + p("M58 72q-6-8-2-14M66 72q4-8 12-10", "none", 2.4)
      + p("M52 82q3 2 6 0", "none", 1.6) + p("M51 79h8", "none", 1.4) + dot(52, 92, 1.4) + dot(56, 93, 1.4) + drop(66, 84, "#9cc3d6")
      + p("M88 68Q86 50 100 46Q110 40 120 46Q134 50 130 68Z", PAPER) + p("M104 46q2-8 8-4", "none", 1.6) + p("M96 56h26M94 62h30", "none", 1).replace(INK, "#c8b896")
      + p("M130 64q8 6 14 4q2 6-4 10", "none", 1.4) + cubes + ants;
  },
  "saper-pach-pa": () => {
    const body = "M28 116Q70 122 108 110Q132 100 124 78Q116 60 118 46";
    const legs = [40, 56, 72, 88, 104].map(x => p(`M${x} ${x < 100 ? 119 : 113}l-1 11h6`, "none", 2)).join("");
    return ground(132) + legs
      + `<path d="${body}" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/><path d="${body}" fill="none" stroke="#8fae4a" stroke-width="12" stroke-linecap="round"/>`
      + p("M120 96Q130 84 124 72", "none", 4).replace(INK, "#e3d98a")
      + e(116, 40, 15, 10, "#8fae4a", 2, -18) + p("M108 36q4-3 8 0", "none", 1.8) + p("M106 32l10-3", "none", 1.6) + dot(112, 37, 1.6)
      + p("M128 38q4 1 6-2", "none", 1.4) + p("M130 42l10 4M140 46l4-3M140 46l4 3", "none", 1.4).replace(INK, "#c4453a")
      + p("M144 22l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM96 18l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z", "#e7c76a", 1)
      + p("M60 108l3 2M76 106l3 2M92 104l3 2", "none", 1.2);
  },
  "shak-diye-mach": () => {
    const scales = [64, 76, 88, 100, 112, 124].map(x => p(`M${x} 84q4 6 0 12M${x + 6} 90q4 6 0 12`, "none", 1).replace(INK, "#8a979a")).join("");
    const leaf = (x: number, y: number, r: number) => `<g transform="rotate(${r} ${x} ${y})">${p(`M${x - 22} ${y}Q${x} ${y - 16} ${x + 22} ${y}Q${x} ${y + 16} ${x - 22} ${y}Z`, "#5f8a3a", 1.6)}${p(`M${x - 18} ${y}H${x + 20}M${x - 6} ${y}l6-6M${x + 6} ${y}l6-6M${x - 6} ${y}l6 6M${x + 6} ${y}l6 6`, "none", 1).replace(INK, "#a8c87a")}</g>`;
    return e(100, 102, 86, 28, "#cfcac0") + e(100, 100, 70, 20, "#e2ded6", 1.4) + p("M30 112q20 10 50 12", "none", 2).replace(INK, PAPER)
      + p("M40 92Q60 74 100 76Q136 76 152 92Q136 108 100 108Q60 108 40 92Z", "#b8c2c4") + scales
      + p("M152 92L172 76L168 92L172 108Z", "#b8c2c4") + p("M58 80Q52 92 58 104", "none", 1.6)
      + eye(50, 88, 3.6) + p("M40 94h6", "none", 1.4) + p("M64 80q30-8 70 0", "none", 1.6).replace(INK, "#c4453a")
      + leaf(98, 90, -8) + leaf(116, 94, 14);
  },
  "amra-kather-dheki": () => {
    return ground(120) + e(30, 121, 14, 4, "#5a4636")
      + p("M26 82L84 98L84 106L26 92Z", "#c49a62") + p("M84 98L176 78L176 86L86 106Z", "#c49a62")
      + p("M34 88l40 12M96 98l70-15", "none", 1).replace(INK, "#8a6a40")
      + p("M80 96l4 4-3 3 4 4", "none", 1.6) + p("M86 96l6-6M84 108l2 8", "none", 1.2)
      + p("M24 90h12v26H24z", "#a8804a") + p("M136 86L132 120M146 84L150 120", "none", 3) + c(141, 84, 3, PAPER, 1.6)
      + p("M174 30L170 74", "none", 8).replace(INK, "#e9d2ac") + p("M168 30L164 74M180 30L176 74", "none", 2)
      + p("M160 74Q170 70 182 76L180 80Q170 78 160 80Z", "#e9d2ac", 1.6)
      + p("M64 108q-6-6 0-12M100 112q6-6 12-2", "none", 1.2).replace(INK, "#a08a6a")
      + e(96, 116, 7, 5, "#a6b84a", 1.6) + e(110, 117, 6, 4.5, "#a6b84a", 1.6, 20) + p("M96 111q2-4 6-4", "none", 1.2);
  },
  "aday-kanchkolay": () => {
    return ground()
      + p("M28 120Q20 102 34 96Q30 80 44 78Q54 68 64 80Q78 78 76 94Q88 102 78 116Q72 126 54 124Q38 128 28 120Z", "#ddbb85")
      + p("M38 90q4 2 8 0M58 108q4 2 8 0M42 112q3 2 6 0", "none", 1).replace(INK, "#a8804a")
      + p("M44 92l10 4M70 92l-10 4", "none", 2.2) + dot(50, 100, 2) + dot(64, 100, 2) + p("M50 110q7-5 14 0", "none", 1.8)
      + p("M78 100l12-8", "none", 2.2) + c(92, 90, 4, "#ddbb85", 1.6)
      + p("M128 124Q116 84 134 50Q140 42 146 46Q138 82 150 124Q140 130 128 124Z", "#7fa650") + p("M134 50q2-8 8-8l2 4", "#4a5a2a", 1.6)
      + p("M134 74l10 4M150 70l-8 6", "none", 2) + dot(138, 84, 1.8) + dot(147, 82, 1.8) + p("M138 96q5-4 10 0", "none", 1.8)
      + p("M130 92l-14-6", "none", 2.2) + c(112, 84, 4, "#7fa650", 1.6)
      + p("M100 74l-4 8h6l-4 8M104 96l3 6M98 62l2-6", "none", 1.8).replace(INK, "#c4453a");
  },
  "bina-meghe": () => {
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `M${round(42 + Math.cos(a) * 22)} ${round(34 + Math.sin(a) * 22)}L${round(42 + Math.cos(a) * 30)} ${round(34 + Math.sin(a) * 30)}`;
    }).join("");
    return ground() + p(rays, "none", 2) + c(42, 34, 17, "#f0b43c") + dot(36, 30, 1.8) + dot(48, 30, 1.8) + p("M34 38q8 7 16 0", "none", 1.8)
      + p("M150 4L128 54L144 56L124 118L170 46L152 44L170 4Z", "#f2c230")
      + p("M116 122l-6-8M124 112v-10M134 122l8-6M110 126h-8M140 126h8", "none", 1.8) + e(124, 127, 14, 2.5, "#2a201844", 0)
      + person(80, 86, { eyes: eye(76, 84, 3.4) + eye(85, 84, 3.4), mouth: e(80, 92, 2.4, 3, INK, 0) })
      + p("M74 77l-3-7M80 76v-8M86 77l3-7", "none", 1.8)
      + p("M80 95V112M80 112l-8 14M80 112l8 14M80 100l-12-10M80 100l12-10", "none", 2.4)
      + `<g transform="rotate(-24 70 56)">${p("M58 60h24M64 60q0-12 12-12t12 12", "#c4453a", 1.8)}</g>` + p("M64 66l-4 2M92 64l4 2", "none", 1.2);
  },
  "dumurer-ful": () => {
    const fig = (x: number, y: number) => c(x, y, 6, "#a89a5a", 1.6) + dot(x - 2, y - 2, 1.2, "#d8cf9a");
    const leaf = (x: number, y: number, r: number) => `<g transform="rotate(${r} ${x} ${y})">${p(`M${x} ${y}q-14-6-16-20q8-2 12 4q0-12 6-14q6 2 6 14q4-6 12-4q-2 14-16 20z`, "#7f9f4a", 1.6)}${p(`M${x} ${y}v-26`, "none", 1).replace(INK, "#b8cf8a")}</g>`;
    return ground() + p("M0 26Q60 30 120 22Q150 18 170 8", "none", 7).replace(INK, "#7a5838") + p("M0 26Q60 30 120 22Q150 18 170 8", "none", 1.6)
      + leaf(36, 26, -10) + leaf(96, 24, 8) + leaf(150, 16, -30)
      + fig(52, 34) + fig(62, 36) + fig(58, 44) + fig(110, 30) + fig(120, 30) + fig(116, 38) + fig(134, 26)
      + person(118, 86, { eyes: dot(115, 85, 1.4) + c(123, 85, 3, PAPER, 1.2) + dot(123, 85.5, 1.4), mouth: p("M115 91h6", "none", 1.4) })
      + p("M118 95V112M118 112l-8 14M118 112l8 14M118 100l-14-12M118 100l10 4", "none", 2.4)
      + c(98, 76, 10, "#cfe3ea", 2.4) + p("M104 84L106 90", "none", 3)
      + p("M140 60q0-10 9-10t9 9q0 6-7 8v5", "none", 2.6) + dot(151, 80, 2);
  },
};

/** The drawing as a standalone SVG. `size` adds width/height so a canvas can decode it at that resolution. */
export function idiomSvg(id: IdiomId, size?: number) {
  const box = size ? ` width="${size}" height="${Math.round(size * 0.7)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"${box} aria-hidden="true">${art[id]()}</svg>`;
}

export const artIds = Object.keys(art) as IdiomId[];
