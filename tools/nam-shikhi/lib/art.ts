// Every picture in নাম শিখি: original flat drawings as SVG markup in a 100×100 box (the body figure is 120×200).
// One source for the page (inline <svg>) and the parent's card (drawn from a data: URL, so nothing is fetched).

const INK = "#3d2f28";
const o = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const thin = `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x: number, y: number, r = 2.6) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#2a211c"/><circle cx="${(x + r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.36).toFixed(1)}" fill="#fff"/>`;
/** A thick outlined stroke (tails, arms): the ink line underneath, the colour on top. */
const limb = (d: string, fill: string, width = 6) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width + 4.6}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${width}" stroke-linecap="round"/>`;
/** Small marks spread over an ellipse: jackfruit spikes, pineapple eyes, lychee skin. */
function texture(cx: number, cy: number, rx: number, ry: number, step: number, mark: (x: number, y: number) => string) {
  let out = "";
  for (let y = cy - ry, row = 0; y <= cy + ry; y += step, row++) {
    for (let x = cx - rx + (row % 2 ? step / 2 : 0); x <= cx + rx; x += step) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.78) out += mark(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    }
  }
  return out;
}

export const ART: Record<string, string> = {
  // ---------- পশুপাখি ----------
  cat: `${limb("M70 84c14 2 22-10 15-24", "#f2a24b", 5.5)}
<ellipse cx="50" cy="72" rx="22" ry="20" fill="#f2a24b" ${o}/><ellipse cx="50" cy="78" rx="11" ry="12" fill="#fff3e2"/>
<ellipse cx="41" cy="90" rx="7" ry="4.5" fill="#f2a24b" ${o}/><ellipse cx="59" cy="90" rx="7" ry="4.5" fill="#f2a24b" ${o}/>
<path d="M31 34 28 11l18 13z" fill="#f2a24b" ${o}/><path d="M69 34l3-23-18 13z" fill="#f2a24b" ${o}/>
<path d="M32 28l-1-11 9 7z" fill="#f7b3a8"/><path d="M68 28l1-11-9 7z" fill="#f7b3a8"/>
<circle cx="50" cy="40" r="21" fill="#f2a24b" ${o}/>
<path d="M50 20v7M43 21l2 6M57 21l-2 6" stroke="#c4691a" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="50" cy="48" rx="10.5" ry="7.5" fill="#fff3e2"/>${eye(42, 38, 3.3)}${eye(58, 38, 3.3)}
<path d="M47 44h6l-3 3.5z" fill="#e57373" ${thin}/>
<path d="M50 47.5v2.5m0 0q-3 3-6 1m6-1q3 3 6 1" fill="none" ${thin}/>
<path d="M37 46l-12-2M37 49.5l-12 2M63 46l12-2M63 49.5l12 2" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`,

  dog: `${limb("M68 76q16-4 14-22", "#c98a4b", 5.5)}
<ellipse cx="50" cy="73" rx="21" ry="19" fill="#c98a4b" ${o}/><ellipse cx="50" cy="77" rx="10" ry="12" fill="#f3dcbc"/>
<ellipse cx="41" cy="90" rx="7" ry="4.5" fill="#c98a4b" ${o}/><ellipse cx="59" cy="90" rx="7" ry="4.5" fill="#c98a4b" ${o}/>
<circle cx="50" cy="40" r="20" fill="#dba468" ${o}/><ellipse cx="58.5" cy="35" rx="7.5" ry="7" fill="#8b5a2b"/>
<path d="M34 25q-13 3-11 25q2 7 9 2q4-12 7-23z" fill="#7a4a26" ${o}/><path d="M66 25q13 3 11 25q-2 7-9 2q-4-12-7-23z" fill="#7a4a26" ${o}/>
<ellipse cx="50" cy="49" rx="11" ry="8" fill="#f3dcbc"/>${eye(42, 37, 3)}${eye(58, 37, 3)}
<ellipse cx="50" cy="45" rx="4.5" ry="3.3" fill="#2a211c"/>
<path d="M47 52q3 7 6 0z" fill="#ef7d8f" ${thin}/><path d="M50 48v3.5m0 0q-4 3-7 0m7 0q4 3 7 0" fill="none" ${thin}/>`,

  cow: `<path d="M81 45q8 6 5 22" fill="none" ${o}/><ellipse cx="86" cy="70" rx="3" ry="4.5" fill="${INK}"/>
<rect x="32" y="58" width="8" height="28" rx="3" fill="#fff" ${o}/><rect x="42" y="58" width="8" height="28" rx="3" fill="#fff" ${o}/>
<rect x="64" y="58" width="8" height="28" rx="3" fill="#fff" ${o}/><rect x="74" y="58" width="8" height="28" rx="3" fill="#fff" ${o}/>
<path d="M32 82h8v4h-8zM42 82h8v4h-8zM64 82h8v4h-8zM74 82h8v4h-8z" fill="${INK}"/>
<ellipse cx="62" cy="65" rx="6" ry="4" fill="#f6b9b0" ${thin}/>
<rect x="28" y="36" width="56" height="30" rx="14" fill="#fff" ${o}/>
<path d="M47 38q9-2 13 6q-1 11-12 9q-7-6-1-15z" fill="#7b4a2a"/><ellipse cx="73" cy="53" rx="7" ry="6" fill="#7b4a2a"/>
<path d="M15 29q-7-3-4-11q3 5 8 6zM29 29q7-3 4-11q-3 5-8 6z" fill="#efe2c3" ${thin}/>
<ellipse cx="34" cy="33" rx="7" ry="3.6" transform="rotate(-18 34 33)" fill="#fff" ${o}/>
<ellipse cx="22" cy="40" rx="11.5" ry="13" fill="#fff" ${o}/><ellipse cx="25.5" cy="36" rx="5.5" ry="5.5" fill="#7b4a2a"/>${eye(22, 38, 2.4)}
<ellipse cx="18" cy="51" rx="9.5" ry="6.5" fill="#f6b9b0" ${o}/><circle cx="14.5" cy="51" r="1.4" fill="${INK}"/><circle cx="21" cy="51" r="1.4" fill="${INK}"/>`,

  goat: `<path d="M78 45l7-9 1 8z" fill="#3a3a3a" ${o}/>
<path d="M37 56h5v30h-5zM45 56h5v30h-5zM66 56h5v30h-5zM74 56h5v30h-5z" fill="#3a3a3a" ${o}/>
<path d="M29 35l9-4 9 17-12 5z" fill="#3a3a3a" ${o}/>
<ellipse cx="57" cy="51" rx="25" ry="14" fill="#3a3a3a" ${o}/>
<path d="M42 41q16-8 32-2" fill="none" stroke="#5c5c5c" stroke-width="2.4" stroke-linecap="round"/>
<path d="M27 28q2-11 11-13q-6 6-6 14z" fill="#d9ccb2" ${thin}/>
<ellipse cx="24" cy="36" rx="11.5" ry="8" transform="rotate(-28 24 36)" fill="#3a3a3a" ${o}/>
<ellipse cx="33" cy="41" rx="7.5" ry="3" transform="rotate(58 33 41)" fill="#2b2b2b" ${o}/>
<path d="M17 43l-2 9 6-6z" fill="#3a3a3a" ${thin}/>
<circle cx="22.5" cy="33" r="2.4" fill="#f2d06b"/><rect x="21" y="32.4" width="3" height="1.2" fill="#111"/><circle cx="14.5" cy="39" r="1.1" fill="#999"/>`,

  duck: `<path d="M4 82q8-4 16 0t16 0 16 0 16 0 16 0 16 0" fill="none" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/>
<path d="M22 40q-3 18 12 24l14-4q-9-8-8-20z" fill="#fff" ${o}/>
<path d="M30 66q-2 14 24 14h16q18-2 18-16l6-14-14 6q-10-6-24-4q-22 2-26 14z" fill="#fff" ${o}/>
<path d="M48 60q14-7 26 1q-10 11-26 5z" fill="#eef1f4" ${thin}/>
<circle cx="32" cy="35" r="11.5" fill="#fff" ${o}/>
<path d="M22 34q-11-1-13 4q4 5 13 2z" fill="#f59e0b" ${o}/>${eye(31, 32, 2.4)}`,

  hen: `<path d="M68 50q13-18 7-32q-2 13-11 20zM72 56q16-10 16-26q-6 12-16 16z" fill="#5b3a22" ${o}/>
<path d="M46 72l-2 14m0 0-4 2m4-2 3 2M57 72v14m0 0-4 2m4-2 3 2" fill="none" stroke="#e3a21a" stroke-width="2.8" stroke-linecap="round"/>
<ellipse cx="52" cy="58" rx="23" ry="17" fill="#c8642e" ${o}/>
<path d="M47 55q15-5 22 6q-9 10-22 4z" fill="#a44c22" ${thin}/>
<path d="M25 30q1-8 6-3q2-7 6-1q4-4 4 3z" fill="#e53935" ${o}/>
<circle cx="32" cy="38" r="10.5" fill="#c8642e" ${o}/>
<ellipse cx="25.5" cy="48" rx="3" ry="4.6" fill="#e53935" ${thin}/>
<path d="M22.5 36l-8 3 8 3z" fill="#f2b01e" ${thin}/>${eye(30, 36, 2.3)}`,

  elephant: `<path d="M85 46q6 6 4 17" fill="none" ${o}/><path d="M87 62l3 5-5 0z" fill="${INK}"/>
<rect x="31" y="56" width="11" height="31" rx="4" fill="#8c97a3" ${o}/><rect x="44" y="56" width="11" height="31" rx="4" fill="#8c97a3" ${o}/>
<rect x="64" y="56" width="11" height="31" rx="4" fill="#8c97a3" ${o}/><rect x="77" y="56" width="10" height="31" rx="4" fill="#8c97a3" ${o}/>
<ellipse cx="59" cy="49" rx="29" ry="22" fill="#9aa5b1" ${o}/>
<path d="M17 42q-7 18 1 34q3 4 7 1q-5-14 3-28z" fill="#9aa5b1" ${o}/>
<circle cx="28" cy="38" r="16" fill="#9aa5b1" ${o}/>
<path d="M33 25q20-5 22 15q1 17-15 18q-9-1-9-11z" fill="#b8c1cb" ${o}/>
<path d="M22 49q-3 7 4 9q-1-5 0-9z" fill="#fffdf3" ${thin}/>${eye(23, 35, 2.4)}`,

  tiger: `<circle cx="29" cy="25" r="10" fill="#f08a24" ${o}/><circle cx="71" cy="25" r="10" fill="#f08a24" ${o}/>
<circle cx="29" cy="25" r="5" fill="#fff1dc"/><circle cx="71" cy="25" r="5" fill="#fff1dc"/>
<ellipse cx="50" cy="53" rx="33" ry="30" fill="#f08a24" ${o}/>
<ellipse cx="38" cy="66" rx="14" ry="11" fill="#fff8ee"/><ellipse cx="62" cy="66" rx="14" ry="11" fill="#fff8ee"/><ellipse cx="50" cy="76" rx="9" ry="6" fill="#fff8ee"/>
<path d="M50 25v10M42 27l3 8M58 27l-3 8M18 47l10 3M17 57l10 1M82 47l-10 3M83 57l-10 1M24 37l8 6M76 37l-8 6" stroke="#2a211c" stroke-width="3.2" stroke-linecap="round"/>
<ellipse cx="38" cy="42" rx="6" ry="2.4" fill="#fff8ee"/><ellipse cx="62" cy="42" rx="6" ry="2.4" fill="#fff8ee"/>
<circle cx="38.5" cy="48" r="4.6" fill="#ffe082"/><circle cx="61.5" cy="48" r="4.6" fill="#ffe082"/>${eye(38.5, 48, 2.7)}${eye(61.5, 48, 2.7)}
<path d="M44 59h12l-6 6z" fill="#e7787a" ${thin}/><path d="M50 65v3m0 0q-5 4-9 0m9 0q5 4 9 0" fill="none" stroke="#2a211c" stroke-width="2" stroke-linecap="round"/>
<circle cx="40" cy="67" r=".9" fill="#2a211c"/><circle cx="36" cy="64" r=".9" fill="#2a211c"/><circle cx="60" cy="67" r=".9" fill="#2a211c"/><circle cx="64" cy="64" r=".9" fill="#2a211c"/>`,

  monkey: `${limb("M66 85q22 4 18-20q-2-9-9-6", "#b07a47", 5)}
<ellipse cx="50" cy="74" rx="19" ry="16" fill="#b07a47" ${o}/><ellipse cx="50" cy="77" rx="10" ry="10" fill="#d8b48a"/>
<ellipse cx="40" cy="90" rx="7" ry="4" fill="#e8b9a0" ${o}/><ellipse cx="60" cy="90" rx="7" ry="4" fill="#e8b9a0" ${o}/>
<circle cx="27" cy="42" r="8" fill="#e8b9a0" ${o}/><circle cx="73" cy="42" r="8" fill="#e8b9a0" ${o}/>
<circle cx="50" cy="40" r="22" fill="#b07a47" ${o}/>
<path d="M50 30c-10-8-22 0-18 12c2 10 8 16 18 16s16-6 18-16c4-12-8-20-18-12z" fill="#f1c3ac"/>
${eye(43, 40, 2.9)}${eye(57, 40, 2.9)}<circle cx="48.5" cy="47" r="1" fill="${INK}"/><circle cx="51.5" cy="47" r="1" fill="${INK}"/>
<path d="M44 52q6 4 12 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M44 19q6-5 12 0" fill="none" stroke="#7d5330" stroke-width="2.4" stroke-linecap="round"/>`,

  deer: `<path d="M79 45l7-4-1 8z" fill="#fff8ee" ${thin}/>
<path d="M37 56h4.5v31H37zM45 56h4.5v31H45zM68 56h4.5v31H68zM76 56h4.5v31H76z" fill="#b36f33" ${o}/>
<path d="M33 31l8-3 8 19-11 4z" fill="#c9803e" ${o}/>
<ellipse cx="58" cy="51" rx="24" ry="12.5" fill="#c9803e" ${o}/>
<path d="M31 22q-2-9-8-13m7 7h-6M34 21q4-9 10-11m-4 3 4-5" fill="none" stroke="#8b5a2b" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="38" cy="25" rx="6.5" ry="3" transform="rotate(-35 38 25)" fill="#c9803e" ${o}/>
<ellipse cx="29" cy="30" rx="10.5" ry="7" transform="rotate(-18 29 30)" fill="#c9803e" ${o}/><circle cx="19.5" cy="33" r="1.6" fill="${INK}"/>
${eye(28, 28, 2.1)}
${[[44, 46], [50, 44], [56, 47], [62, 44], [68, 47], [74, 45], [47, 52], [55, 54], [63, 52], [71, 53], [52, 49], [66, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#fff3dc"/>`).join("")}`,

  camel: `<path d="M82 46q6 6 3 15" fill="none" ${o}/><path d="M84 60l2 5-4-1z" fill="${INK}"/>
<path d="M38 52h5.5v34H38zM46 52h5.5v34H46zM67 52h5.5v34H67zM75 52h5.5v34H75z" fill="#c4914c" ${o}/>
<path d="M36.5 86h8.5v3h-8.5zM45 86h8v3h-8zM66 86h8v3h-8zM74 86h8v3h-8z" fill="#a8783a"/>
<path d="M35 46q-7-14-5-25l8-2q1 12 9 19z" fill="#d6a35c" ${o}/>
<path d="M32 51q0-11 15-12q8-18 23-14q11 4 13 25q0 8-8 8H40q-8 0-8-7z" fill="#d6a35c" ${o}/>
<ellipse cx="34" cy="13.5" rx="2.4" ry="3.6" fill="#d6a35c" ${thin}/>
<ellipse cx="26" cy="19" rx="11" ry="6.5" fill="#d6a35c" ${o}/>${eye(28, 17, 1.9)}
<path d="M16 22h5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,

  penguin: `<ellipse cx="42" cy="89" rx="8" ry="3.8" fill="#f59e0b" ${o}/><ellipse cx="58" cy="89" rx="8" ry="3.8" fill="#f59e0b" ${o}/>
<path d="M28 48q-11 14-7 28q9-5 11-18zM72 48q11 14 7 28q-9-5-11-18z" fill="#263238" ${o}/>
<ellipse cx="50" cy="56" rx="24" ry="33" fill="#263238" ${o}/><ellipse cx="50" cy="63" rx="16" ry="24" fill="#fff"/>
<path d="M50 29c-6-6-16-2-14 8 1 6 6 10 14 10s13-4 14-10c2-10-8-14-14-8z" fill="#fff"/>
${eye(44, 35, 2.7)}${eye(56, 35, 2.7)}<path d="M45 41h10l-5 6z" fill="#f59e0b" ${thin}/>`,

  dolphin: `<path d="M4 84q8-4 16 0t16 0 16 0 16 0 16 0 16 0" fill="none" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/>
<path d="M52 36l7-10 6 11z" fill="#8f9aa6" ${o}/>
<path d="M7 50l17-4q2-12 16-14q24-2 40 8l10-8q2 8-2 14q6 6 4 12l-10-8q-16 12-40 10q-12-1-18-8L7 52z" fill="#8f9aa6" ${o}/>
<path d="M26 52q14 8 34 5q-12-3-30-7z" fill="#e3cfc8"/>
<path d="M40 57q-2 10 6 12q2-6 0-12z" fill="#7b8692" ${thin}/>
<circle cx="29" cy="44" r="1.5" fill="${INK}"/><path d="M9 51h14" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`,

  doyel: `<path d="M8 81q42-7 84 2" fill="none" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="80" cy="76" rx="8" ry="3.4" transform="rotate(-25 80 76)" fill="#66bb6a" ${thin}/><ellipse cx="18" cy="76" rx="7" ry="3" transform="rotate(25 18 76)" fill="#66bb6a" ${thin}/>
<path d="M60 58l16-28 8 4-15 27z" fill="#1f2328" ${o}/><path d="M80 33l-14 25" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
<path d="M46 70l-2 9M55 70v9" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="50" cy="58" rx="19" ry="13" fill="#1f2328" ${o}/>
<path d="M33 60q7 14 27 10q5-4 3-8q-13 4-30-2z" fill="#fff"/>
<path d="M45 52l18-2-2 4-16 2z" fill="#fff"/>
<circle cx="34" cy="44" r="10" fill="#1f2328" ${o}/><path d="M25 42.5l-9 2.5 9 2z" fill="#1f2328" ${thin}/>
<circle cx="31" cy="42" r="2.6" fill="#fff"/><circle cx="31" cy="42" r="1.7" fill="#000"/>`,

  // ---------- ফল ----------
  mango: `<path d="M60 20q12-12 26-6q-12 10-26 6z" fill="#4caf50" ${o}/><path d="M62 19q10-4 22-5" stroke="#2e7d32" stroke-width="1.4" fill="none"/>
<path d="M58 24q0-7 4-10" fill="none" stroke="#6d4c2f" stroke-width="3" stroke-linecap="round"/>
<path d="M58 24c20-2 30 18 28 36-2 20-18 32-38 30-18-2-28-14-24-24 3-8 12-8 16-16 4-10 2-24 18-26z" fill="#ffc531" ${o}/>
<ellipse cx="64" cy="32" rx="12" ry="7" transform="rotate(20 64 32)" fill="#a5c83a" opacity=".85"/><ellipse cx="68" cy="68" rx="12" ry="9" transform="rotate(-30 68 68)" fill="#ff8a3d" opacity=".5"/>
<path d="M36 70q4 10 14 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,

  jackfruit: `<path d="M44 16v-9" stroke="#6d4c2f" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="44" cy="52" rx="29" ry="37" fill="#a3b83c" ${o}/>
${texture(44, 52, 29, 37, 6.5, (x, y) => `<path d="M${x - 1.8} ${y + 1}l1.8-2.8 1.8 2.8" fill="none" stroke="#6f8a22" stroke-width="1.3" stroke-linecap="round"/>`)}
<ellipse cx="33" cy="40" rx="5" ry="11" fill="#fff" opacity=".22"/>
<ellipse cx="77" cy="81" rx="12" ry="8" transform="rotate(-20 77 81)" fill="#ffc93c" ${o}/><ellipse cx="78" cy="80" rx="5" ry="3" transform="rotate(-20 78 80)" fill="#ffe08a"/>`,

  banana: `${[-14, 0, 14].map(turn => `<g transform="rotate(${turn} 32 26)"><path d="M28 28q-3 40 36 54q10 3 12-3Q40 66 36 28z" fill="#ffd93b" ${o}/><circle cx="75" cy="80" r="2" fill="#5a4a2a"/></g>`).join("")}
<path d="M26 18h12v12H26z" fill="#7a8b2f" ${o}/>`,

  guava: `<path d="M40 27q2-8 8-10" fill="none" stroke="#6d4c2f" stroke-width="3" stroke-linecap="round"/>
<path d="M44 21q14-12 26-3q-14 9-26 3z" fill="#4caf50" ${o}/>
<circle cx="38" cy="52" r="26" fill="#9ccc65" ${o}/><path d="M34 78l4-4 4 4" fill="none" ${thin}/>
<circle cx="28" cy="44" r="1.2" fill="#c5e1a5"/><circle cx="45" cy="38" r="1.2" fill="#c5e1a5"/><circle cx="40" cy="60" r="1.2" fill="#c5e1a5"/><circle cx="24" cy="58" r="1.2" fill="#c5e1a5"/>
<ellipse cx="28" cy="40" rx="5" ry="8" fill="#fff" opacity=".3"/>
<circle cx="70" cy="68" r="19" fill="#9ccc65" ${o}/><circle cx="70" cy="68" r="15.5" fill="#fffbea"/>
<circle cx="70" cy="68" r="7.5" fill="#f6eccb"/>
${[[67, 65], [73, 65], [70, 71], [66, 70], [74, 70], [70, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#c9b27a"/>`).join("")}`,

  lychee: `<path d="M50 9q-4 14-15 24M50 9q6 16 17 23M50 9v19" fill="none" stroke="#6d4c2f" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="64" cy="13" rx="12" ry="5" transform="rotate(-18 64 13)" fill="#4caf50" ${o}/>
${[[33, 46], [67, 49]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#d84343" ${o}/>${texture(x, y, 15, 15, 5, (a, b) => `<circle cx="${a}" cy="${b}" r="1.1" fill="#a82c2c"/>`)}<ellipse cx="${x - 5}" cy="${y - 5}" rx="3" ry="4.5" fill="#fff" opacity=".35"/>`).join("")}
<circle cx="50" cy="73" r="15" fill="#fbf7ee" ${o}/><path d="M35 74a15 15 0 0 0 30 0z" fill="#d84343" ${o}/>
<ellipse cx="45" cy="67" rx="3" ry="4" fill="#fff"/>`,

  pineapple: `${[-56, -28, 0, 28, 56].map(turn => `<path d="M50 36q-7-16 0-32q7 16 0 32z" transform="rotate(${turn} 50 36)" fill="${turn ? "#43a047" : "#2e7d32"}" ${o}/>`).join("")}
<ellipse cx="50" cy="62" rx="23" ry="30" fill="#f9b233" ${o}/>
${texture(50, 62, 23, 30, 7, (x, y) => `<path d="M${x} ${y - 3}l3 3-3 3-3-3z" fill="none" stroke="#c97c12" stroke-width="1.3" stroke-linejoin="round"/>`)}`,

  papaya: `<ellipse cx="36" cy="44" rx="17" ry="30" transform="rotate(-28 36 44)" fill="#f6a03a" ${o}/>
<ellipse cx="44" cy="30" rx="7" ry="9" transform="rotate(-28 44 30)" fill="#9ccc3a" opacity=".8"/>
<path d="M50 14l4-5" stroke="#6d8b2f" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="64" cy="60" rx="18" ry="29" transform="rotate(-28 64 60)" fill="#c5d84a" ${o}/>
<ellipse cx="64" cy="60" rx="14.5" ry="25" transform="rotate(-28 64 60)" fill="#ff8a3d"/>
<ellipse cx="64" cy="60" rx="6" ry="14" transform="rotate(-28 64 60)" fill="#ffb74d"/>
${[[60, 52], [64, 56], [62, 61], [67, 60], [65, 65], [69, 66], [61, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#2a211c"/>`).join("")}`,

  watermelon: `<path d="M8 34a42 42 0 0 0 84 0z" fill="#2e7d32" ${o}/><path d="M13 34a37 37 0 0 0 74 0z" fill="#c5e1a5"/>
<path d="M17 34a33 33 0 0 0 66 0z" fill="#ef4b5a"/><path d="M8 34h84" ${o}/>
${[[30, 44], [42, 52], [50, 44], [58, 52], [70, 44], [36, 58], [64, 58], [50, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#2a211c"/>`).join("")}`,

  coconut: `<circle cx="40" cy="46" r="27" fill="#8d5a34" ${o}/>
<path d="M22 36l5 3M28 58l5-2M50 62l4 3M56 40l5-1M34 26l3 3M46 28l2 4M24 48l4 0M60 52l4 1" stroke="#6b4226" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="35" cy="33" r="3" fill="#4a2e1a"/><circle cx="45" cy="33" r="3" fill="#4a2e1a"/><circle cx="40" cy="40" r="3" fill="#4a2e1a"/>
<path d="M50 72a20 13 0 0 0 40 0z" fill="#8d5a34" ${o}/><ellipse cx="70" cy="72" rx="20" ry="7" fill="#fff" ${o}/><ellipse cx="70" cy="72" rx="14" ry="4" fill="#f3ead6"/>`,

  apple: `<path d="M50 30q0-10 4-16" fill="none" stroke="#6d4c2f" stroke-width="3" stroke-linecap="round"/>
<path d="M54 22q12-12 24-4q-12 10-24 4z" fill="#66bb6a" ${o}/>
<path d="M50 30C36 18 16 28 18 52s20 38 32 32c12 6 30-8 32-32S64 18 50 30z" fill="#e53935" ${o}/>
<ellipse cx="33" cy="47" rx="4" ry="9" fill="#fff" opacity=".45"/>`,

  // ---------- সবজি ----------
  potato: `<path d="M24 50c-2-20 22-26 38-22 20 4 24 24 16 38-8 14-38 16-48 6-6-6-5-14-6-22z" fill="#d4a373" ${o}/>
<path d="M38 40q2 2 4 0M58 38q2 2 4 0M64 58q2 2 4 0M42 62q2 2 4 0M32 54q2 2 4 0" fill="none" stroke="#9c6a3a" stroke-width="1.8" stroke-linecap="round"/>
<ellipse cx="40" cy="44" rx="8" ry="3" fill="#fff" opacity=".25"/>`,

  tomato: `<path d="M50 30C26 28 16 48 22 64c6 18 50 18 56 0 6-16-4-36-28-34z" fill="#e53935" ${o}/>
<path d="M50 25l4 8 10-2-8 6 6 6-10-3-2 8-2-8-10 3 6-6-8-6 10 2z" fill="#43a047" ${thin}/>
<path d="M50 25v-6" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/><ellipse cx="33" cy="48" rx="4" ry="8" fill="#fff" opacity=".4"/>`,

  brinjal: `<path d="M40 34c16-4 30 6 38 24 8 18-2 32-16 28-14-4-18-20-24-34-4-8-6-16 2-18z" fill="#6a2c91" ${o}/>
<path d="M38 31l-8-12" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>
<path d="M33 30q8-7 16 1q-2 9-11 9q-7-2-5-10z" fill="#43a047" ${o}/>
<path d="M50 48q8 14 18 22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`,

  carrot: `<path d="M44 30q-12-16-6-24q6 8 10 22zM50 30q0-20 6-26q4 10-2 26zM56 30q10-16 20-16q-4 10-16 18z" fill="#43a047" ${o}/>
<path d="M28 32q22-6 46 0q-12 32-22 58q-4 2-6-2q-10-26-18-56z" fill="#fb8c00" ${o}/>
<path d="M38 44h8M56 54h8M44 66h6M52 76h4" stroke="#d86f00" stroke-width="2" stroke-linecap="round"/>`,

  lau: `<path d="M47 14q2-6 8-8" fill="none" stroke="#6d8b2f" stroke-width="3" stroke-linecap="round"/>
<path d="M46 14c4 0 6 4 6 10 0 10-2 16 4 24 16 14 18 34 2 42-12 6-28 2-32-12-4-14 10-24 14-32 4-8 2-16 2-24 0-4 2-8 4-8z" fill="#b5d36b" ${o}/>
<path d="M36 64q-2 12 6 18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
<circle cx="56" cy="70" r="1.2" fill="#e6f2c4"/><circle cx="48" cy="58" r="1.2" fill="#e6f2c4"/><circle cx="60" cy="82" r="1.2" fill="#e6f2c4"/><circle cx="46" cy="40" r="1.2" fill="#e6f2c4"/>`,

  korola: `<g transform="rotate(-32 50 52)"><path d="M50 8l3-5" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/>
<path d="M50 10c10 14 16 34 12 56-2 14-8 24-12 26-4-2-10-12-12-26-4-22 2-42 12-56z" fill="#4c9a2a" ${o}/>
<path d="M50 16q4 34 0 72M44 26q-2 30 2 58M56 26q2 30-2 58" fill="none" stroke="#2e6b1a" stroke-width="1.4"/>
${[[47, 24], [53, 30], [45, 38], [55, 42], [43, 52], [57, 56], [47, 64], [53, 70], [49, 80], [41, 64], [59, 66], [51, 48]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.6" fill="#86c95a"/>`).join("")}</g>`,

  dheros: `${[[-14, 34], [12, 62]].map(([turn, x]) => `<g transform="rotate(${turn} ${x} 50)"><path d="M${x - 2} 18q-1-6 3-9" fill="none" stroke="#558b2f" stroke-width="3" stroke-linecap="round"/>
<path d="M${x - 6} 22l12 0q8 34-2 68q-4 4-8 0q-10-34-2-68z" fill="#7cb342" ${o}/>
<path d="M${x - 2} 26q-2 30 0 60M${x + 3} 26q2 30-1 60" fill="none" stroke="#558b2f" stroke-width="1.5"/>
<path d="M${x - 7} 24q7-9 14 0l-3 4h-8z" fill="#9ccc65" ${thin}/></g>`).join("")}`,

  pumpkin: `<path d="M48 34q0-10 6-14l4 2q-6 4-6 12z" fill="#6d4c2f" ${o}/><path d="M56 26q10-8 18 0" fill="none" stroke="#43a047" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="33" cy="60" rx="18" ry="24" fill="#f57c00" ${o}/><ellipse cx="67" cy="60" rx="18" ry="24" fill="#f57c00" ${o}/>
<ellipse cx="50" cy="60" rx="15" ry="26" fill="#fb8c00" ${o}/><ellipse cx="45" cy="50" rx="3" ry="9" fill="#fff" opacity=".3"/>`,

  cauliflower: `<path d="M18 60Q10 36 26 28q-2 18 4 30zM82 60q8-24-8-32q2 18-4 30z" fill="#81c784" ${o}/>
${[[30, 52, 10], [40, 42, 11], [55, 38, 11], [68, 46, 11], [72, 58, 9], [36, 60, 10], [50, 52, 11], [62, 60, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffbe8" ${thin}/><circle cx="${x - 3}" cy="${y - 2}" r="2" fill="#f1e7c4"/><circle cx="${x + 3}" cy="${y + 2}" r="1.6" fill="#f1e7c4"/>`).join("")}
<path d="M14 58q6 28 36 32 30-4 36-32-12 12-36 14-24-2-36-14z" fill="#66bb6a" ${o}/><path d="M50 72v16M34 70l-6 12M66 70l6 12" stroke="#43a047" stroke-width="1.6" stroke-linecap="round"/>`,

  morich: `${[[-8, 0], [18, 22]].map(([turn, dx]) => `<g transform="rotate(${turn} 50 50) translate(${dx} 0)"><path d="M30 22q2-8 9-10" fill="none" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/>
<path d="M30 22q7 8 5 28-2 24 20 38-17 0-27-16-8-16-4-38 0-8 6-12z" fill="#43a047" ${o}/>
<path d="M30 32q-2 16 4 30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".4"/></g>`).join("")}`,

  // ---------- বাংলাদেশের প্রতীক ----------
  shapla: `<path d="M6 92q8-4 16 0t16 0 16 0 16 0 16 0" fill="none" stroke="#5aa9e6" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="50" cy="76" rx="40" ry="12" fill="#4caf50" ${o}/><path d="M50 76l22-10" stroke="#2e7d32" stroke-width="2"/>
${[-64, -32, 0, 32, 64].map(turn => `<path d="M50 66q-10-20 0-44q10 24 0 44z" transform="rotate(${turn} 50 66)" fill="#fff" ${o}/>`).join("")}
${[-46, -16, 16, 46].map(turn => `<path d="M50 66q-7-14 0-30q7 16 0 30z" transform="rotate(${turn} 50 66)" fill="#fbeef3" ${thin}/>`).join("")}
<ellipse cx="50" cy="62" rx="7" ry="4" fill="#ffca28" ${thin}/>`,

  ilish: `<path d="M50 36l8-9 6 10zM50 64l6 8 4-8z" fill="#8fa7b8" ${o}/>
<path d="M8 50q22-20 52-16 16 2 24 12l12-12q-4 16 0 32L84 54q-8 10-24 12-30 4-52-16z" fill="#d4dde2" ${o}/>
<path d="M13 48q20-14 47-12 14 2 22 10-26-4-69 2z" fill="#8fa7b8"/>
<path d="M24 55q26 7 56-2" fill="none" stroke="#d8a8d0" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<path d="M26 41q-4 9 0 18" fill="none" ${thin}/><circle cx="32" cy="44" r="2.2" fill="#6c7a89"/>
<circle cx="17" cy="47" r="3.2" fill="#fff" ${thin}/><circle cx="17" cy="47" r="1.7" fill="#2a211c"/><path d="M8 50l5 1" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,

  amgach: `<ellipse cx="50" cy="92" rx="32" ry="4.5" fill="#a5d6a7"/>
<path d="M44 92q2-22-2-34l6-2q2 10 4 0l6 2q-4 12-2 34z" fill="#8d5a34" ${o}/>
${[[30, 44, 18], [50, 30, 22], [70, 44, 18], [40, 56, 16], [62, 56, 16]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2e7d32" ${o}/>`).join("")}
${[[30, 44, 13], [50, 30, 17], [70, 44, 13], [40, 55, 11], [62, 55, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#388e3c"/>`).join("")}
${[[34, 62], [58, 66], [70, 52], [46, 44]].map(([x, y]) => `<path d="M${x} ${y - 6}v3" stroke="#6d4c2f" stroke-width="1.6"/><ellipse cx="${x}" cy="${y}" rx="3.6" ry="4.6" fill="#ffc531" ${thin}/>`).join("")}`,

  // Official proportions: 10:6, the red disc's radius is a fifth of the length, centred at 9/20 of it from the pole.
  flag: `<rect x="14" y="12" width="4" height="82" rx="2" fill="#8d6e63" ${o}/><circle cx="16" cy="11" r="3.2" fill="#c9a23a" ${thin}/>
<rect x="18" y="20" width="70" height="42" fill="#006a4e" ${o}/><circle cx="49.5" cy="41" r="14" fill="#f42a41"/>`,

  // ---------- বাসা (কোথায় থাকে) ----------
  home: `<rect x="2" y="2" width="96" height="96" rx="14" fill="#cfe8ff"/><path d="M2 62h96v22a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#9ccc65"/>
<circle cx="82" cy="18" r="7" fill="#ffd54f"/><path d="M78 62V40" stroke="#6d4c2f" stroke-width="4"/><circle cx="78" cy="34" r="12" fill="#43a047" ${thin}/>
<rect x="24" y="48" width="40" height="26" fill="#d7a86e" ${o}/><path d="M18 50l26-20 26 20z" fill="#9fb3c8" ${o}/>
<path d="M28 44l4-3M36 38l4-3M48 38l4 3M56 44l4 3" stroke="#7d93aa" stroke-width="1.5"/><rect x="38" y="58" width="12" height="16" fill="#6d4c2f" ${thin}/>`,

  sundarban: `<rect x="2" y="2" width="96" height="96" rx="14" fill="#dff1e3"/>
<path d="M2 66q24-6 48 0t48 0v18a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#6fb3d9"/>
<path d="M8 78q6-3 12 0M56 86q6-3 12 0M70 74q6-3 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
${[[22, 26], [52, 22], [80, 32]].map(([x, y]) => `<path d="M${x} ${y + 16}v24M${x} ${y + 30}q-8 4-10 18M${x} ${y + 30}q8 4 10 18M${x} ${y + 34}q-3 6-3 14M${x} ${y + 34}q3 6 3 14" fill="none" stroke="#6d4c2f" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="${x}" cy="${y + 8}" rx="15" ry="12" fill="#2e7d32" ${thin}/><ellipse cx="${x - 3}" cy="${y + 5}" rx="9" ry="6" fill="#43a047"/>`).join("")}
<path d="M40 68v-5M44 69v-6M78 68v-5M12 70v-5" stroke="#6d4c2f" stroke-width="1.8" stroke-linecap="round"/>`,

  desert: `<rect x="2" y="2" width="96" height="96" rx="14" fill="#fff1c9"/><circle cx="74" cy="24" r="10" fill="#ffb300"/>
<path d="M2 66q28-18 56-2t40-4v24a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#f2c46b"/>
<path d="M2 82q40-18 96 0v2a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#e5ad4f"/>
<path d="M20 70q8-4 16 0" stroke="#d99a3c" stroke-width="1.6" fill="none"/>`,

  ice: `<rect x="2" y="2" width="96" height="96" rx="14" fill="#dff3ff"/><path d="M2 68h96v16a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#7cc4e8"/>
<path d="M50 62l12-32 14 32z" fill="#f2fbff" ${o}/><path d="M62 30l-4 14 6-4" fill="none" stroke="#b3dcf2" stroke-width="2"/>
<path d="M8 72l14-12h44l18 12z" fill="#fff" ${o}/><path d="M24 30l-6 10M18 30l6 10M15 35h12M86 14l-4 7M82 14l4 7M80 17.5h8" stroke="#9fd0ee" stroke-width="1.6" stroke-linecap="round"/>`,

  river: `<rect x="2" y="2" width="96" height="96" rx="14" fill="#e3f2fd"/><path d="M2 40q48-8 96 0v44a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#81c784"/>
<path d="M2 46q48-8 96 2v28q-48-8-96 2z" fill="#5aa9e6"/>
<path d="M10 66q6-3 12 0M70 70q6-3 12 0M76 54q6-3 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M30 58q18 10 36 0z" fill="#8d5a34" ${o}/><path d="M40 58q8-11 16 0z" fill="#d7a86e" ${thin}/><path d="M60 58v-12" stroke="#6d4c2f" stroke-width="1.6"/>`,

  forest: `<rect x="2" y="2" width="96" height="96" rx="14" fill="#e3f4ff"/>
<path d="M2 60q20-28 44-8 20-26 52-4v36a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#81c784"/>
${[[16, 52], [34, 46], [60, 40], [80, 44], [26, 68], [50, 64], [74, 66]].map(([x, y]) => `<path d="M${x} ${y + 12}v8" stroke="#6d4c2f" stroke-width="2.4"/><circle cx="${x}" cy="${y + 4}" r="9" fill="#2e7d32" ${thin}/>`).join("")}
<path d="M2 84h96a14 14 0 0 1-14 14H16A14 14 0 0 1 2 84z" fill="#4caf50"/>`,

  // ---------- রং: one paint splat, coloured per item ----------
  splat: `<path d="M50 14c8 0 10 10 16 10s10-8 16-2-2 12 2 18 12 6 10 14-12 4-12 12 8 14 2 18-12-4-18 0-6 12-16 12-8-10-16-10-12 8-18 2 2-12-2-18-14-6-12-14 12-6 12-12-8-12-2-18 12 2 16-2 4-12 12-12z" fill="var(--splat)" ${o}/>
<ellipse cx="40" cy="40" rx="6" ry="4" fill="#fff" opacity=".35"/>`,
};

/** Splat fill per colour (the white one keeps its outline). */
export const SPLAT: Record<string, string> = {
  lal: "#e53935", nil: "#1e63d6", sobuj: "#2e9e44", holud: "#ffd21f", komola: "#fb8c00",
  beguni: "#8e44ad", golapi: "#f48fb1", badami: "#8d5a34", kalo: "#222222", sada: "#ffffff",
};

/** The child figure for শরীর: one drawing, two views. Brown skin, yellow shirt, blue shorts, bare feet. */
export const BODY = `${limb("M40 80 27 119", "#c68a5e", 9)}${limb("M80 80 93 119", "#c68a5e", 9)}
<circle cx="25.5" cy="123" r="6.5" fill="#c68a5e" ${o}/><circle cx="94.5" cy="123" r="6.5" fill="#c68a5e" ${o}/>
<rect x="47" y="130" width="10.5" height="54" rx="4" fill="#c68a5e" ${o}/><rect x="62.5" y="130" width="10.5" height="54" rx="4" fill="#c68a5e" ${o}/>
<path d="M50 157q2 2 4 0M66 157q2 2 4 0" fill="none" stroke="#8a5a3a" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="48" cy="186" rx="9.5" ry="5" fill="#c68a5e" ${o}/><ellipse cx="72" cy="186" rx="9.5" ry="5" fill="#c68a5e" ${o}/>
<path d="M44 116h32v26H62l-2-10-2 10H44z" fill="#1e63d6" ${o}/>
<rect x="54" y="60" width="12" height="14" fill="#c68a5e" ${o}/>
<path d="M38 74q22-6 44 0l7 18-8 2v24H39V94l-8-2z" fill="#f9a825" ${o}/>
<path d="M52 72q8 5 16 0" fill="none" stroke="#e08e0b" stroke-width="2"/>
<circle cx="35.5" cy="42" r="5.5" fill="#c68a5e" ${o}/><circle cx="84.5" cy="42" r="5.5" fill="#c68a5e" ${o}/>
<circle cx="60" cy="40" r="24" fill="#c68a5e" ${o}/>
<path d="M36 38q0-24 24-24t24 24q-6-12-24-12-18 0-24 12z" fill="#2b1d16" ${o}/>
${eye(51, 40, 2.9)}${eye(69, 40, 2.9)}<path d="M47 34q4-2 8 0M65 34q4-2 8 0" fill="none" stroke="#2b1d16" stroke-width="1.8" stroke-linecap="round"/>
<path d="M60 42q-3 6 0 7" fill="none" stroke="#8a5a3a" stroke-width="2" stroke-linecap="round"/>
<path d="M53 54q7 5 14 0" fill="none" stroke="#8a3a2a" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="47" cy="49" r="3.4" fill="#e57373" opacity=".3"/><circle cx="73" cy="49" r="3.4" fill="#e57373" opacity=".3"/>`;

/** The two views of the figure: the face close up, or the whole child. */
export const VIEWS = { face: "26 8 68 68", body: "0 0 120 200" } as const;
export type View = keyof typeof VIEWS;

/** The inner markup for a picture id; a colour id is the splat in that colour. */
export const artMarkup = (id: string) => ART[id] ?? (SPLAT[id] ? ART.splat.replace("var(--splat)", SPLAT[id]) : "");

/** A standalone SVG document for one picture (for the card's data: URL). */
export function svgDocument(id: string, size = 400) {
  const art = artMarkup(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${art}</svg>`;
}

export const bodyDocument = (scale = 5) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" width="${120 * scale}" height="${200 * scale}">${BODY}</svg>`;
