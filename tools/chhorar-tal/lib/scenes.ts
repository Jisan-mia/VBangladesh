// Our own flat drawings (viewBox 320×200), one scene per ছড়া. The picture is built as the rhyme goes: every line adds
// one thing that the line is about, so the finished picture is what the child made. Ink outline, flat fills, no gradients,
// no text. A thing that should bounce on the beat wears class "bob".
const INK = "#3a2a1c";
const o = (w = 2.5) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const bob = (inner: string) => `<g class="bob">${inner}</g>`;

export type Scene = { base: string; props: readonly string[] };

function creature(x: number, y: number, s: number, horns: boolean) {
  const horn = horns ? `<path d="M20 -36 Q10 -60 26 -66" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M20 -36 Q10 -60 26 -66" fill="none" stroke="#f6e7c7" stroke-width="3.6" stroke-linecap="round"/><path d="M32 -38 Q36 -62 50 -62" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M32 -38 Q36 -62 50 -62" fill="none" stroke="#f6e7c7" stroke-width="3.6" stroke-linecap="round"/>` : "";
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 24 V44 M10 24 V44 M-18 44 H-6 M4 44 H16" fill="none" ${o()}/><ellipse rx="34" ry="28" fill="#c0562b" ${o()}/><path d="M-28 -2 Q-46 -22 -28 -26 Q-22 -10 -28 6Z" fill="#9c3f1b" ${o(2)}/><path d="M-6 -4 Q8 4 18 -6" fill="none" stroke="#e08a5a" stroke-width="3" stroke-linecap="round"/>${horn}<circle cx="26" cy="-24" r="16" fill="#c0562b" ${o()}/><path d="M38 -28 L54 -22 L38 -17Z" fill="#f2b632" ${o(2)}/><circle cx="31" cy="-28" r="2.8" fill="${INK}"/></g>`;
}

function person(x: number, y: number, body: string, hair = INK, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 22 L-12 0 Q0 -6 12 0 L9 22Z" fill="${body}" ${o(2)}/><circle cy="-10" r="9" fill="#c98f5e" ${o(2)}/><path d="M-9 -13 Q0 -26 9 -13 Q0 -17 -9 -13Z" fill="${hair}"/></g>`;
}

const sparkle = (x: number, y: number, r: number, fill: string) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z" fill="${fill}"/>`;

// Borrowed 100×100 drawings (the old rhyme pictures), scaled into scenes.
const BOU = `<path d="M18 92 Q14 20 50 12 Q86 20 82 92Z" fill="#c62828"/><path d="M23 90 Q20 26 50 18 Q80 26 77 90" fill="none" stroke="#f2c14e" stroke-width="3"/><circle cx="50" cy="52" r="21" fill="#e0a77a"/><circle cx="42" cy="50" r="2.6" fill="#2b2b2b"/><circle cx="58" cy="50" r="2.6" fill="#2b2b2b"/><path d="M43 61 Q50 66 57 61" fill="none" stroke="#7a3b2b" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="39" r="2.8" fill="#c62828"/>`;
const MURO = `<path d="M70 20 Q26 18 12 50 Q26 82 70 80Z" fill="#9fb8c8" stroke="#3d5566" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 20 Q82 50 70 80" fill="#e98a8a" stroke="#3d5566" stroke-width="3"/><path d="M54 30 Q45 50 54 70" fill="none" stroke="#3d5566" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="42" r="7" fill="#fff" stroke="#3d5566" stroke-width="2"/><circle cx="34" cy="42" r="3" fill="#222"/><path d="M12 50 L24 54" stroke="#3d5566" stroke-width="3" stroke-linecap="round"/>`;
const DHULI = `<rect x="38" y="76" width="9" height="20" rx="3" fill="#3b3b6b"/><rect x="53" y="76" width="9" height="20" rx="3" fill="#3b3b6b"/><path d="M33 34 Q50 27 67 34 L70 74 L30 74Z" fill="#f2c14e"/><circle cx="50" cy="20" r="11" fill="#c58c5c"/><path d="M39 18 Q50 4 61 18" fill="#2b2b2b"/><rect x="20" y="52" width="60" height="26" rx="12" fill="#b5651d" stroke="#5b3510" stroke-width="3"/><path d="M30 54 L37 76 L44 54 L51 76 L58 54 L65 76 L71 54" fill="none" stroke="#f3e2c0" stroke-width="2" stroke-linecap="round"/><ellipse cx="21" cy="65" rx="5" ry="13" fill="#f3e2c0" stroke="#5b3510" stroke-width="2"/><ellipse cx="79" cy="65" rx="5" ry="13" fill="#f3e2c0" stroke="#5b3510" stroke-width="2"/><path d="M34 38 L14 50 M66 38 L88 46" stroke="#c58c5c" stroke-width="6" stroke-linecap="round"/><path d="M88 46 L80 60" stroke="#5b3510" stroke-width="3" stroke-linecap="round"/>`;
const NOUKA = `<path d="M50 14 V60" stroke="#4a2e12" stroke-width="3"/><path d="M53 18 L80 56 L53 56Z" fill="#fff6e0" stroke="#4a2e12" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 60 Q50 72 90 60 L80 78 Q50 88 20 78Z" fill="#8b5a2b" stroke="#4a2e12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

const dhol = (x: number, y: number, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-34" y="-20" width="68" height="40" rx="16" fill="#b5651d" stroke="#5b3510" stroke-width="3"/><path d="M-22 -18 L-16 18 L-8 -18 L0 18 L8 -18 L16 18 L22 -14" fill="none" stroke="#f3e2c0" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-34" rx="6" ry="20" fill="#f3e2c0" stroke="#5b3510" stroke-width="3"/><ellipse cx="34" rx="6" ry="20" fill="#f3e2c0" stroke="#5b3510" stroke-width="3"/></g>`;

const stars = (list: readonly (readonly [number, number])[]) => list.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#f6e7a1"/>`).join("");

const hattima: Scene = {
  base: `<rect width="320" height="200" fill="#fbe6bd"/><circle cx="268" cy="40" r="20" fill="#f2b632"/><path d="M0 128 Q80 114 160 126 T320 122 V200 H0Z" fill="#9cb85a"/><path d="M0 168 Q100 156 200 170 T320 164 V200 H0Z" fill="#7fa046"/><path d="M30 150 l4 -10 l4 10 M250 146 l4 -10 l4 10 M170 182 l4 -10 l4 10" fill="none" stroke="#5f7f33" stroke-width="3" stroke-linecap="round"/>`,
  props: [
    bob(creature(100, 112, 1, false)),
    `<ellipse cx="170" cy="168" rx="12" ry="15" fill="#fff6e0" ${o()}/><ellipse cx="198" cy="175" rx="12" ry="15" fill="#fff6e0" ${o()}/><ellipse cx="226" cy="167" rx="12" ry="15" fill="#fff6e0" ${o()}/><path d="M165 162 q3 -5 7 -3" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    bob(`<g transform="translate(100 112)"><path d="M20 -36 Q10 -60 26 -66" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M20 -36 Q10 -60 26 -66" fill="none" stroke="#f6e7c7" stroke-width="3.6" stroke-linecap="round"/><path d="M32 -38 Q36 -62 50 -62" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M32 -38 Q36 -62 50 -62" fill="none" stroke="#f6e7c7" stroke-width="3.6" stroke-linecap="round"/></g>`),
    bob(creature(262, 132, 0.62, true)),
  ],
};

const ata: Scene = {
  base: `<rect width="320" height="200" fill="#d6ecf4"/><circle cx="40" cy="36" r="16" fill="#f7d66b"/><path d="M0 146 Q90 112 180 140 T320 134 V200 H0Z" fill="#a9cf7e"/><path d="M0 176 Q120 160 320 176 V200 H0Z" fill="#86b05d"/>`,
  props: [
    `<rect x="62" y="98" width="14" height="76" fill="#7a4b25" ${o(2)}/><circle cx="68" cy="84" r="30" fill="#4f9244" ${o(2)}/><circle cx="44" cy="98" r="21" fill="#4f9244" ${o(2)}/><circle cx="94" cy="98" r="21" fill="#4f9244" ${o(2)}/><circle cx="52" cy="92" r="6" fill="#9cc34e"/><circle cx="82" cy="78" r="6" fill="#9cc34e"/><circle cx="72" cy="106" r="6" fill="#9cc34e"/>` +
      bob(`<g transform="translate(112 106)"><path d="M-4 12 L-14 34 L0 26Z" fill="#2f7a3e" ${o(2)}/><ellipse rx="11" ry="15" fill="#3e9b4f" ${o(2)}/><circle cx="6" cy="-17" r="9" fill="#3e9b4f" ${o(2)}/><path d="M14 -19 L25 -14 L14 -11Z" fill="#c62828" ${o(2)}/><circle cx="9" cy="-19" r="2.2" fill="${INK}"/><path d="M-8 -4 Q-14 6 -6 12" fill="none" stroke="#2a6a36" stroke-width="3" stroke-linecap="round"/></g>`),
    `<rect x="244" y="104" width="12" height="70" fill="#7a4b25" ${o(2)}/><circle cx="252" cy="92" r="26" fill="#5aa14a" ${o(2)}/><circle cx="230" cy="106" r="18" fill="#5aa14a" ${o(2)}/><circle cx="276" cy="106" r="18" fill="#5aa14a" ${o(2)}/><circle cx="240" cy="90" r="7" fill="#c8302c" ${o(2)}/><circle cx="264" cy="98" r="7" fill="#c8302c" ${o(2)}/><circle cx="250" cy="114" r="7" fill="#c8302c" ${o(2)}/><circle cx="280" cy="116" r="6" fill="#c8302c" ${o(2)}/>` +
      bob(`<g transform="translate(206 76)"><ellipse rx="9" ry="6.5" fill="#f4c430" ${o(2)}/><path d="M-3 -6 V6 M3 -6 V6" stroke="${INK}" stroke-width="2.4"/><ellipse cx="-2" cy="-9" rx="6" ry="4" fill="#e9f4ff" stroke="${INK}" stroke-width="1.4"/></g>`),
    `${person(150, 150, "#2f6fd0", INK, 1.15)}<path d="M164 132 Q174 134 176 146 M170 124 Q186 128 188 146 M176 118 Q198 124 200 146" fill="none" ${o(2.6)}/>`,
    bob(`<g transform="translate(156 52) scale(.55)">${BOU}</g>`),
  ],
};

const chand: Scene = {
  base: `<rect width="320" height="200" fill="#232a68"/>${stars([[20, 24], [58, 60], [96, 18], [236, 30], [284, 70], [300, 22], [30, 96], [262, 110], [200, 14]])}<path d="M0 156 Q100 132 200 152 T320 142 V200 H0Z" fill="#1b2052"/>`,
  props: [
    bob(`<circle cx="160" cy="68" r="36" fill="#f6e7a1" ${o(2.4)}/><circle cx="144" cy="82" r="6" fill="#e3d38a"/><circle cx="176" cy="84" r="4" fill="#e3d38a"/><path d="M144 66 q5 -5 10 0 M166 66 q5 -5 10 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M148 80 Q160 90 172 80" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`),
    `<circle cx="160" cy="48" r="5.5" fill="#d63b3b"/>${sparkle(190, 36, 8, "#fff")}${sparkle(126, 44, 6, "#fff")}${sparkle(200, 76, 5, "#fff")}<g transform="translate(78 160)"><path d="M-10 26 L-12 0 Q0 -6 12 0 L10 26Z" fill="#f2f2f2" ${o(2)}/><circle cy="-11" r="10" fill="#c98f5e" ${o(2)}/><path d="M-10 -14 Q0 -28 10 -14 Q0 -18 -10 -14Z" fill="${INK}"/><path d="M-10 0 L-20 -16 M10 0 L20 -16" ${o(3)}/></g>`,
    `<path d="M214 160 Q252 164 290 160 L282 186 Q252 192 222 186Z" fill="#b07a3c" ${o(2.2)}/><ellipse cx="252" cy="158" rx="36" ry="14" fill="#e6b93a" ${o(2.2)}/><path d="M232 154 l5 -6 M250 150 l5 -6 M268 154 l5 -6 M242 162 l4 -4 M262 163 l4 -4" fill="none" stroke="#a97d12" stroke-width="2" stroke-linecap="round"/>`,
    bob(`<g transform="translate(228 92) scale(.72)">${MURO}</g>`),
  ],
};

const agdum: Scene = {
  base: `<rect width="320" height="200" fill="#fcd9a2"/><path d="M0 12 Q160 42 320 12" fill="none" stroke="${INK}" stroke-width="2.4"/>${[[30, "#c62828"], [80, "#2f7a3e"], [130, "#f2b632"], [190, "#c62828"], [240, "#2f7a3e"], [290, "#f2b632"]].map(([x, c]) => { const px = x as number, y = 12 + 30 * (1 - Math.pow(2 * px / 320 - 1, 2)) ; return `<path d="M${px - 9} ${y.toFixed(1)} L${px + 9} ${y.toFixed(1)} L${px} ${(y + 20).toFixed(1)}Z" fill="${c}" ${o(1.8)}/>`; }).join("")}<path d="M0 150 H320 V200 H0Z" fill="#d9a35a"/><path d="M20 176 h30 M120 184 h40 M230 176 h36" stroke="#c28a43" stroke-width="3" stroke-linecap="round"/>`,
  props: [
    bob(`<g transform="translate(78 132)"><path d="M-22 18 V40 M-6 18 V40 M12 18 V40 M26 18 V40" fill="none" ${o(3.4)}/><ellipse rx="36" ry="20" fill="#8a5a2b" ${o()}/><path d="M-12 -12 H14 V8 H-12Z" fill="#c62828" ${o(2)}/><path d="M26 -8 Q38 -30 50 -34 L60 -24 Q52 -18 46 -4Z" fill="#8a5a2b" ${o(2)}/><path d="M-34 -4 Q-48 -2 -44 18" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="54" cy="-28" r="2.2" fill="${INK}"/></g>`),
    `${dhol(164, 152, 0.9)}` + bob(`<circle cx="186" cy="98" r="14" fill="#f2c14e" ${o(2.2)}/><circle cx="186" cy="98" r="5" fill="#d89a1d"/><circle cx="214" cy="108" r="14" fill="#f2c14e" ${o(2.2)}/><circle cx="214" cy="108" r="5" fill="#d89a1d"/>`),
    bob(`<g transform="translate(226 42) scale(.82)">${DHULI}</g>`),
    `<g transform="translate(284 162)"><circle cx="-12" cy="0" r="6" fill="#fff6e3" ${o(1.6)}/><circle cx="12" cy="0" r="6" fill="#fff6e3" ${o(1.6)}/><circle cy="-12" r="6" fill="#fff6e3" ${o(1.6)}/><circle cy="12" r="6" fill="#fff6e3" ${o(1.6)}/><circle r="6" fill="#f2b632" ${o(1.6)}/></g><circle cx="262" cy="178" r="9" fill="#f08a1c" ${o(2)}/><path d="M262 169 q4 -6 9 -4" fill="none" stroke="#2f7a3e" stroke-width="3" stroke-linecap="round"/>`,
  ],
};

const notun: Scene = {
  base: `<rect width="320" height="200" fill="#d3eaf4"/><path d="M0 118 H320 V132 H0Z" fill="#8fbf6a"/><path d="M0 132 H320 V200 H0Z" fill="#5ea6c8"/><path d="M20 154 q10 -6 20 0 t20 0 M130 168 q10 -6 20 0 t20 0 M240 186 q10 -6 20 0 t20 0" fill="none" stroke="#9fd0e6" stroke-width="3" stroke-linecap="round"/><rect x="0" y="92" width="158" height="30" fill="#e8cf9c"/><rect x="0" y="82" width="164" height="12" fill="#a65f3a" ${o(2)}/>`,
  props: [
    [36, 74, 112].map(x => bob(`<g transform="translate(${x} 74)"><path d="M-12 2 L-24 6 L-12 -2Z" fill="#7b8598" ${o(1.8)}/><ellipse rx="12" ry="9" fill="#9aa4b5" ${o(2)}/><circle cx="10" cy="-8" r="6.5" fill="#9aa4b5" ${o(2)}/><path d="M16 -9 L22 -7 L16 -5Z" fill="#f2b632" ${o(1.4)}/><circle cx="12" cy="-10" r="1.4" fill="${INK}"/><path d="M-2 -2 Q4 6 10 0" fill="none" stroke="#7b8598" stroke-width="2.5" stroke-linecap="round"/></g>`)).join(""),
    [36, 74, 112].map(x => `<g transform="translate(${x + 10} 56)"><circle r="3.6" fill="#d63b3b" ${o(1.4)}/><path d="M-3 -2 L-8 -8 M3 -2 L8 -8" stroke="#d63b3b" stroke-width="2.4" stroke-linecap="round"/></g>`).join(""),
    `${person(210, 106, "#e8749a", INK, 0.9)}${person(238, 106, "#2f6fd0", INK, 0.9)}`,
    `<g transform="translate(244 156)"><circle r="8" fill="#c98f5e" ${o(2)}/><path d="M-8 -3 Q0 -14 8 -3 Q0 -6 -8 -3Z" fill="${INK}"/><path d="M-8 4 L-18 -12 M8 4 L18 -12" ${o(3)}/><ellipse cy="9" rx="16" ry="4" fill="none" stroke="#fff" stroke-width="2.4"/></g><g transform="translate(284 168)"><circle r="8" fill="#c98f5e" ${o(2)}/><path d="M-8 -3 Q0 -14 8 -3 Q0 -6 -8 -3Z" fill="${INK}"/><path d="M-8 4 L-18 -12 M8 4 L18 -12" ${o(3)}/><ellipse cy="9" rx="16" ry="4" fill="none" stroke="#fff" stroke-width="2.4"/></g>`,
  ],
};

const drop = (x: number, y: number) => `<path d="M${x} ${y} q5 8 0 12 q-5 -4 0 -12Z" fill="#3d78a8"/>`;
const brishti: Scene = {
  base: `<rect width="320" height="200" fill="#a9bdd0"/><ellipse cx="90" cy="36" rx="54" ry="24" fill="#e9eef3" ${o(2)}/><ellipse cx="160" cy="28" rx="62" ry="28" fill="#e9eef3" ${o(2)}/><ellipse cx="240" cy="38" rx="52" ry="22" fill="#e9eef3" ${o(2)}/><path d="M0 130 Q160 116 320 130 V200 H0Z" fill="#8fbf6a"/>`,
  props: [
    bob(`${[[40, 74], [72, 96], [104, 70], [136, 100], [168, 76], [200, 98], [232, 72], [264, 96], [292, 76], [56, 110], [150, 112], [248, 112]].map(([x, y]) => drop(x, y)).join("")}`),
    `<path d="M0 120 Q80 112 160 120 T320 116 V200 H0Z" fill="#4b8bb3"/><path d="M20 150 q10 -6 20 0 t20 0 M200 160 q10 -6 20 0 t20 0 M110 184 q10 -6 20 0 t20 0" fill="none" stroke="#9fd0e6" stroke-width="3" stroke-linecap="round"/>` + bob(`<g transform="translate(118 78) scale(.9)">${NOUKA}</g>`),
  ],
};

const ghum: Scene = {
  base: `<rect width="320" height="200" fill="#3a3470"/><rect x="236" y="26" width="64" height="78" fill="#1d1b4a" ${o(2.4)}/><circle cx="270" cy="56" r="15" fill="#f6e7a1"/>${stars([[250, 40], [290, 42], [252, 88], [288, 90]])}<path d="M268 26 V104 M236 65 H300" stroke="${INK}" stroke-width="2.4"/><path d="M0 150 H320 V200 H0Z" fill="#50407f"/>`,
  props: [
    bob(person(40, 112, "#3b6fb8", "#e8e8f0", 1.3)),
    bob(person(84, 116, "#d65f8e", "#e8e8f0", 1.25)),
    `<rect x="108" y="160" width="104" height="20" rx="4" fill="#c98c4a" ${o(2)}/><path d="M122 160 v20 M140 160 v20 M158 160 v20 M176 160 v20 M194 160 v20" stroke="#f2d59b" stroke-width="3"/>`,
    bob(`<g transform="translate(160 140)"><ellipse cy="12" rx="18" ry="22" fill="#f2f2f2" ${o(2.2)}/><circle cy="-14" r="15" fill="#c98f5e" ${o(2.2)}/><path d="M-15 -18 Q0 -36 15 -18 Q0 -24 -15 -18Z" fill="${INK}"/><path d="M-8 -14 q3 3 6 0 M2 -14 q3 3 6 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M-5 -6 Q0 -2 5 -6" fill="none" stroke="#7a3b2b" stroke-width="2" stroke-linecap="round"/></g>`),
    `<rect x="238" y="156" width="40" height="22" rx="7" fill="#b07a3c" ${o(2.2)}/><path d="M246 156 q-4 -14 10 -12 q-2 10 -10 12Z" fill="#3e9b4f" ${o(1.8)}/><circle cx="270" cy="150" r="5" fill="#d63b3b"/>`,
    `<circle cx="148" cy="130" r="4.4" fill="#e98a8a"/><circle cx="172" cy="130" r="4.4" fill="#e98a8a"/>`,
    `${sparkle(122, 100, 8, "#f6e7a1")}${sparkle(198, 96, 6, "#f6e7a1")}${sparkle(160, 88, 7, "#f6e7a1")}`,
    bob(`<circle cx="182" cy="108" r="4" fill="none" stroke="#cfd6ff" stroke-width="2.4"/><circle cx="192" cy="94" r="6" fill="none" stroke="#cfd6ff" stroke-width="2.4"/><circle cx="206" cy="76" r="8" fill="none" stroke="#cfd6ff" stroke-width="2.4"/>`),
  ],
};

const slot = (index: number) => 30 + index * 52;
const mela: Scene = {
  base: `<rect width="320" height="200" fill="#e6f4ee"/><path d="M16 74 L160 8 L304 74Z" fill="#14705a" ${o(2.4)}/><path d="M160 8 L88 74 H124Z M160 8 L196 74 H232Z" fill="#f2c14e"/><path d="M16 74 H304" stroke="${INK}" stroke-width="3"/><path d="M0 150 H320 V200 H0Z" fill="#e6c88a"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${slot(i) - 24}" y="${96}" width="48" height="48" rx="6" fill="#fff6e3" stroke="#14705a" stroke-width="2.4" stroke-dasharray="5 4"/>`).join("")}`,
  props: [
    `<g transform="translate(${slot(0)} 122)"><circle r="14" fill="#c0562b" ${o(2)}/><path d="M-6 -12 Q-10 -24 -2 -26 M6 -12 Q10 -24 18 -22" fill="none" stroke="#f6e7c7" stroke-width="3.4" stroke-linecap="round"/><path d="M12 -2 L22 2 L12 6Z" fill="#f2b632" ${o(1.6)}/><circle cx="6" cy="-3" r="2" fill="${INK}"/></g>`,
    `<g transform="translate(${slot(1)} 122)"><ellipse rx="12" ry="16" fill="#fff6e0" ${o(2)}/><path d="M-7 -6 q2 -5 6 -4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`,
    `<g transform="translate(${slot(2)} 122)"><path d="M-12 14 L-10 -2 Q-6 -16 6 -18 L14 -10 L10 -4 L12 14Z" fill="#8a5a2b" ${o(2)}/><circle cx="6" cy="-10" r="1.8" fill="${INK}"/><path d="M-4 -12 Q-14 -6 -12 4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`,
    `${dhol(slot(3), 122, 0.5)}`,
    `<g transform="translate(${slot(4)} 122)"><circle r="16" fill="#f6e7a1" ${o(2)}/><circle cx="-5" cy="4" r="3" fill="#e3d38a"/><path d="M-6 -4 q3 -3 6 0 M3 -4 q3 -3 6 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`,
    `<g transform="translate(${slot(5)} 122)"><circle r="16" fill="#f6e7a1" ${o(2)}/><circle cy="-6" r="3.6" fill="#d63b3b"/>${sparkle(14, -14, 5, "#f2b632")}</g>`,
  ],
};

export const SCENES: Readonly<Record<string, Scene>> = { hattima, ata, chand, agdum, notun, brishti, ghum, mela };

/** A scene as SVG markup: the base, then each line's drawing in a group that fades in when it is switched on. */
export function sceneMarkup(id: string, upTo = 0): string {
  const scene = SCENES[id];
  if (!scene) return "";
  return `${scene.base}${scene.props.map((prop, line) => `<g class="p"${line < upTo ? " data-on" : ""} data-line="${line}">${prop}</g>`).join("")}`;
}

/** A standalone SVG file for the finished scene, so the card can decode it from a data: URL (nothing is fetched). */
export const sceneDocument = (id: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">${SCENES[id].base}${SCENES[id].props.join("")}</svg>`;
