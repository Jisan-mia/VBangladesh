// Our own flat SVG art: one picture each for every country's food, place and animal (64×64), the flags simple enough to draw
// exactly (from each flag's official construction), and a hand-drawn world map. One source for the page and the card canvas.

export const INK = "#2b2433";
const SKY = `<rect width="64" height="64" fill="#cfe6f2" stroke="none"/>`;
const WARM = `<rect width="64" height="64" fill="#fbe7bf" stroke="none"/>`;
const dot = (x: number, y: number, r = 1.6, fill = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="none"/>`;

/** Points of a five-pointed star: outer radius r, the first point at `angle` degrees (−90 = straight up). */
export function starPoints(cx: number, cy: number, r: number, angle = -90) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((angle + i * 36) * Math.PI) / 180, radius = i % 2 ? r * 0.381966 : r;
    points.push(`${+(cx + Math.cos(a) * radius).toFixed(3)},${+(cy + Math.sin(a) * radius).toFixed(3)}`);
  }
  return points.join(" ");
}
const star = (cx: number, cy: number, r: number, fill: string, angle = -90) => `<polygon points="${starPoints(cx, cy, r, angle)}" fill="${fill}"/>`;

/** The hedgehog's back: a dome of alternating spike tips. */
function spikes(cx: number, cy: number, rx: number, ry: number, count: number) {
  const points: string[] = [];
  for (let i = 0; i <= count * 2; i++) {
    const a = Math.PI + (i / (count * 2)) * Math.PI, k = i % 2 ? 1.18 : 1;
    points.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="#7a5534"/>`;
}

/** The lion's mane: a ring of soft points. */
function mane(cx: number, cy: number, r: number, count: number) {
  const points = Array.from({ length: count * 2 }, (_, i) => {
    const a = (i / (count * 2)) * Math.PI * 2, k = i % 2 ? 0.82 : 1;
    return `${(cx + Math.cos(a) * r * k).toFixed(1)},${(cy + Math.sin(a) * r * k).toFixed(1)}`;
  });
  return `<polygon points="${points.join(" ")}" fill="#e2c27a"/>`;
}

/** Food, place and animal pictures, keyed `<country>:<kind>`. */
export const PICS: Readonly<Record<string, string>> = {
  "in:food": `<ellipse cx="32" cy="44" rx="28" ry="12" fill="#f4f1ea"/><path d="M8 40 52 29c5 1 6 6 4 9L12 47c-5 0-7-5-4-7z" fill="#e9a948"/>
    <path d="M14 41 52 32" fill="none" stroke="#b9772a"/><ellipse cx="17" cy="51" rx="6" ry="3" fill="#f7f4e8"/><ellipse cx="47" cy="51" rx="6" ry="3" fill="#e0782f"/>`,
  "in:place": `${SKY}<rect x="2" y="54" width="60" height="8" fill="#e8e1d4"/><rect x="6" y="26" width="4" height="28" fill="#fbfaf6"/><rect x="54" y="26" width="4" height="28" fill="#fbfaf6"/>
    <path d="M6 26l2-5 2 5zM54 26l2-5 2 5z" fill="#fbfaf6"/><rect x="16" y="34" width="32" height="20" fill="#fbfaf6"/><path d="M28 54v-9a4 4 0 0 1 8 0v9z" fill="#d7cdbd"/>
    <path d="M18 34c-2-9 6-15 14-19 8 4 16 10 14 19z" fill="#fbfaf6"/><path d="M32 15V8" fill="none"/><path d="M16 34c0-4 2-6 4-6s4 2 4 6zM40 34c0-4 2-6 4-6s4 2 4 6z" fill="#fbfaf6"/>`,
  "in:animal": `<path d="M8 52C3 30 18 10 40 12c18 2 22 22 17 40z" fill="#2e9d6a"/>
    ${[[16, 32], [24, 21], [36, 16], [48, 21], [54, 34], [12, 44], [55, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#1f5fae" stroke="#e8b83a" stroke-width="1.6"/>`).join("")}
    <path d="M30 58c-6 0-8-8-6-16 2-6 2-14 6-20 3-4 8-2 8 2 0 6-4 10-2 16 2 8 0 18-6 18z" fill="#2266c4"/>${dot(35, 22, 1.4)}<path d="M38 22l5 1-5 2z" fill="#e8b83a"/>
    <path d="M33 18l-2-5M35 18l1-5M34 18v-6" fill="none"/><path d="M28 58v4M33 58v4" fill="none"/>`,

  "np:food": `<ellipse cx="32" cy="45" rx="28" ry="12" fill="#dfe9ef"/><ellipse cx="53" cy="24" rx="6" ry="3.5" fill="#d9472b"/>
    <path d="M23 39c0-9 6-14 10-14s10 5 10 14z" fill="#fbf4e4"/><path d="M29 30l4-5 4 5M33 25v-2" fill="none"/>
    <path d="M9 45c0-9 6-14 10-14s10 5 10 14z" fill="#fbf4e4"/><path d="M15 36l4-5 4 5M19 31v-2" fill="none"/>
    <path d="M35 46c0-9 6-14 10-14s10 5 10 14z" fill="#fbf4e4"/><path d="M41 37l4-5 4 5M45 32v-2" fill="none"/>`,
  "np:place": `${SKY}<path d="M0 64V52l14-22 6 6 12-22 10 14 4-4 18 30v10z" fill="#7d8ea3"/><path d="M27 21l5-7 6 8-3 2-3-3-3 3z" fill="#fff"/>
    <path d="M11 35l3-5 4 4-2 1-2-2z" fill="#fff"/><path d="M50 32l-4-4-3 3 2 1z" fill="#fff"/><path d="M4 56c10-5 18-7 28-6" fill="none" stroke-width="1"/>
    ${["#3a6fd8", "#ffffff", "#d93a2b", "#3a9a3a", "#f2c230"].map((c, i) => `<path d="M${7 + i * 5} ${55.2 - i * 1.1}l2.2 4 1.6-4.3z" fill="${c}" stroke-width="0.8"/>`).join("")}`,
  "np:animal": `<path d="M44 46c8 0 14 4 14 10-4 4-12 2-16-2z" fill="#c45a20"/><path d="M48 47l2 7M53 47l1 7" fill="none" stroke="#7a2f10" stroke-width="2"/>
    <ellipse cx="30" cy="47" rx="16" ry="12" fill="#a8441a"/><path d="M18 20l-3-9 10 5zM42 20l3-9-10 5z" fill="#f4f1ea"/><circle cx="30" cy="29" r="14" fill="#c9581f"/>
    <ellipse cx="22" cy="33" rx="5" ry="4" fill="#fbf6ee"/><ellipse cx="38" cy="33" rx="5" ry="4" fill="#fbf6ee"/><path d="M23 24c1-2 4-2 5 0zM32 24c1-2 4-2 5 0z" fill="#fbf6ee"/>
    ${dot(25.5, 28.5, 2)}${dot(34.5, 28.5, 2)}<ellipse cx="30" cy="35" rx="2.2" ry="1.6" fill="${INK}" stroke="none"/>`,

  "bt:food": `<path d="M8 30h48c0 14-10 24-24 24S8 44 8 30z" fill="#7a4b2a"/><ellipse cx="32" cy="30" rx="24" ry="6" fill="#f3e3a2"/>
    <path d="M14 29c4-3 10-3 14 0M30 32c4-3 10-2 14 1" fill="none" stroke="#3a9a3a" stroke-width="4"/><path d="M38 27c3-2 7-2 10 0" fill="none" stroke="#c9302c" stroke-width="4"/>`,
  "bt:place": `${SKY}<path d="M36 0h28v64H42c-6-12-10-36-6-64z" fill="#8c8478"/><path d="M40 10c2 4 2 8 0 12" fill="none" stroke="#6e675d" stroke-width="1"/>
    <rect x="22" y="26" width="16" height="10" fill="#fbfaf6"/><path d="M20 26l10-5 10 5z" fill="#c9302c"/><rect x="26" y="29" width="3" height="4" fill="#5a2d1a" stroke="none"/>
    <rect x="28" y="36" width="10" height="7" fill="#fbfaf6"/><path d="M27 36l6-3 6 3z" fill="#e2a32b"/>
    <path d="M0 64V58c4-8 8-8 10-4 2-6 8-6 10 0 4-4 8-2 10 4v6z" fill="#3e8f3a"/>`,
  "bt:animal": `<ellipse cx="40" cy="42" rx="20" ry="13" fill="#c9a050"/><path d="M28 54v8M38 54v8M48 54v8M56 50v8" fill="none" stroke="#5a3a1a" stroke-width="3"/>
    <path d="M19 20c-6 0-9 5-9 13 0 10 4 19 10 19s10-7 10-15c0-9-5-17-11-17z" fill="#d8b060"/>
    <path d="M14 23c-6-4-10-2-12 2 4-1 7 0 9 3M25 22c4-6 8-6 12-4-4 1-7 3-8 6" fill="none" stroke="#3a2a1a" stroke-width="3"/>
    ${dot(15.5, 31)}${dot(23.5, 31)}<ellipse cx="20" cy="45" rx="6" ry="4" fill="#7a5a30"/>`,

  "mm:food": `<path d="M6 28h52c0 15-12 26-26 26S6 43 6 28z" fill="#f4f1ea"/><ellipse cx="32" cy="28" rx="26" ry="7" fill="#e9a23b"/>
    <path d="M12 28c4-3 8 3 12 0s8 3 12 0 8 3 12 0" fill="none" stroke="#fff3d6"/><circle cx="42" cy="27" r="4" fill="#fff"/>${dot(42, 27, 1.8, "#f2c230")}
    <path d="M20 25l2-3M25 26l3-2" fill="none" stroke="#3a9a3a"/>`,
  "mm:place": `${SKY}<rect x="8" y="52" width="48" height="12" fill="#e7d3a1"/><path d="M14 52c0-8 6-12 18-14 12 2 18 6 18 14z" fill="#f2b51f"/>
    <path d="M24 38c2-8 5-14 8-26 3 12 6 18 8 26z" fill="#f5c331"/><path d="M32 12V5M26 34h12M27 29h10" fill="none"/>${dot(32, 5, 1.6, "#fff")}`,
  "mm:animal": `<ellipse cx="38" cy="36" rx="20" ry="14" fill="#9aa3ad"/><path d="M24 44h6v14h-6zM44 44h6v14h-6z" fill="#9aa3ad"/><path d="M57 33c3 2 4 6 2 9" fill="none"/>
    <circle cx="21" cy="29" r="12" fill="#a7b0ba"/><path d="M11 33c-2 8-2 14 2 18 2 2 5 0 4-2-3-3-2-8 0-14z" fill="#a7b0ba"/>
    <path d="M23 24c4-6 12-4 12 4s-8 10-12 6z" fill="#8c95a0"/>${dot(17, 27)}`,

  "my:food": `<path d="M2 40c10-16 50-16 60 0-10 16-50 16-60 0z" fill="#4a9c3f"/><path d="M4 40h56" fill="none" stroke="#2f6e28"/>
    <path d="M12 40c0-10 6-14 12-14s12 4 12 14z" fill="#fbfaf4"/><ellipse cx="45" cy="35" rx="7" ry="5" fill="#fff"/>${dot(45, 35, 3, "#f2b62a")}
    <path d="M38 45c3-3 9-3 12 0z" fill="#c9302c"/><circle cx="22" cy="46" r="3" fill="#bfe08a"/><circle cx="29" cy="47" r="3" fill="#bfe08a"/>`,
  "my:place": `${SKY}<path d="M12 64V20l3-4 3-4 3 4 3 4v44z" fill="#c4ccd6"/><path d="M40 64V20l3-4 3-4 3 4 3 4v44z" fill="#c4ccd6"/>
    <path d="M18 12V3M46 12V3" fill="none"/><rect x="24" y="32" width="16" height="3" fill="#8e99a6"/>
    <path d="M15 24v38M21 24v38M43 24v38M49 24v38" fill="none" stroke="#8e99a6" stroke-width="1"/>`,
  "my:animal": `<path d="M12 40c-4 4-6 10-6 16M52 40c4 4 6 10 6 16" fill="none" stroke="#d06a2a" stroke-width="5"/>
    <path d="M10 40c0-16 10-28 22-28s22 12 22 28c0 10-8 18-22 18S10 50 10 40z" fill="#d06a2a"/>
    <path d="M18 35c0-8 6-12 14-12s14 4 14 12c0 10-6 16-14 16s-14-6-14-16z" fill="#c08a5e"/>${dot(26, 33, 2)}${dot(38, 33, 2)}
    <ellipse cx="32" cy="39" rx="3" ry="1.6" fill="#7a4a2a" stroke="none"/><path d="M27 44c3 2 7 2 10 0" fill="none"/>`,

  "sg:food": `<ellipse cx="32" cy="42" rx="28" ry="13" fill="#e6eef2"/><path d="M9 41c0-10 7-15 14-15s14 5 14 15z" fill="#fbfaf4"/>
    <path d="M31 46l8-13 6 3-6 13zM38 48l9-12 6 4-7 10z" fill="#f1d7a0"/><circle cx="51" cy="48" r="3" fill="#bfe08a"/><circle cx="19" cy="48" r="3" fill="#bfe08a"/>`,
  "sg:place": `${SKY}<rect y="54" width="64" height="10" fill="#7fb6d9" stroke="none"/><path d="M14 26c-6 4-9 12-8 26" fill="none" stroke="#7fb6d9" stroke-width="3"/>
    <path d="M24 56c-4-6-4-16 2-22h12c6 6 6 14 2 20 4 0 8-2 10-6 0 6-4 10-10 10z" fill="#f4f1ea"/><path d="M28 42c2 1 4 1 6 0M28 47c2 1 4 1 6 0M29 37c2 1 4 1 6 0" fill="none"/>
    ${mane(31, 22, 13, 12)}<circle cx="29" cy="23" r="8" fill="#fbfaf4"/>${dot(27, 20, 1.3)}<path d="M21 25c2 2 4 2 6 0" fill="#e8848a"/>`,
  "sg:animal": `<path d="M2 52c8-4 14-2 20 0s12 4 20 0 14-4 20 0v12H2z" fill="#7fc0e0"/><path d="M20 54c-2-12 2-26 12-28 10 2 14 16 12 28z" fill="#8a5a33"/>
    <circle cx="23" cy="15" r="2.6" fill="#8a5a33"/><circle cx="41" cy="15" r="2.6" fill="#8a5a33"/><ellipse cx="32" cy="22" rx="10" ry="9" fill="#8a5a33"/>
    <ellipse cx="32" cy="26" rx="6" ry="4" fill="#e3c7a1"/>${dot(28, 20)}${dot(36, 20)}<ellipse cx="32" cy="24" rx="1.8" ry="1.2" fill="${INK}" stroke="none"/>
    <path d="M24 26h-7M24 28l-6 2M40 26h7M40 28l6 2" fill="none" stroke-width="0.8"/><path d="M26 37c2-2 4-2 5 0M33 37c1-2 3-2 5 0" fill="#e3c7a1"/>`,

  "cn:food": `<ellipse cx="32" cy="40" rx="28" ry="14" fill="#d9a85b"/><ellipse cx="32" cy="38" rx="24" ry="10" fill="#f1d89b"/>
    <path d="M22 33c2-8 16-8 18 0-6 3-12 3-18 0z" fill="#fbf4e4"/><path d="M11 39c2-8 16-8 18 0-6 3-12 3-18 0z" fill="#fbf4e4"/><path d="M33 40c2-8 16-8 18 0-6 3-12 3-18 0z" fill="#fbf4e4"/>
    <path d="M46 4 36 27M54 6 40 28" fill="none" stroke="#8a5a2b" stroke-width="2.5"/>`,
  "cn:place": `${SKY}<path d="M0 46c10-10 20-12 30-4s20 4 34-6v28H0z" fill="#6fae5a"/>
    <path d="M0 48c10-10 20-12 30-4s20 4 34-6" fill="none" stroke="#b9a07a" stroke-width="6"/><path d="M0 45c10-10 20-12 30-4s20 4 34-6" fill="none" stroke-width="1" stroke-dasharray="2 2"/>
    <rect x="11" y="31" width="7" height="10" fill="#cdb48a"/><rect x="45" y="34" width="7" height="10" fill="#cdb48a"/>`,
  "cn:animal": `<circle cx="20" cy="12" r="5" fill="${INK}"/><circle cx="44" cy="12" r="5" fill="${INK}"/><ellipse cx="32" cy="46" rx="18" ry="14" fill="#fbfaf6"/>
    <path d="M14 42c-2 6 0 12 6 12 2-4 2-8 0-12zM50 42c2 6 0 12-6 12-2-4-2-8 0-12z" fill="${INK}"/><circle cx="32" cy="24" r="14" fill="#fbfaf6"/>
    <ellipse cx="26" cy="24" rx="3.6" ry="5" fill="${INK}" transform="rotate(-25 26 24)"/><ellipse cx="38" cy="24" rx="3.6" ry="5" fill="${INK}" transform="rotate(25 38 24)"/>
    ${dot(26.5, 23, 1.2, "#fff")}${dot(37.5, 23, 1.2, "#fff")}<ellipse cx="32" cy="31" rx="2.4" ry="1.6" fill="${INK}"/>
    <path d="M50 62 58 24" fill="none" stroke="#5aa03a" stroke-width="4"/><path d="M56 34l6-4M54 44l-6-2" fill="none" stroke="#5aa03a" stroke-width="2"/>`,

  "jp:food": `<rect x="4" y="44" width="56" height="8" rx="2" fill="#c98b4a"/><rect x="8" y="32" width="22" height="12" rx="6" fill="#fbfaf4"/>
    <path d="M6 34c0-6 6-8 13-8s13 2 13 8c-8 2-18 2-26 0z" fill="#f28c5a"/><path d="M12 29l3 3M18 28l3 3M24 29l3 3" fill="none" stroke="#fff"/>
    <circle cx="47" cy="35" r="9" fill="#2b3a2f"/><circle cx="47" cy="35" r="6" fill="#fbfaf4"/>${dot(47, 35, 2.5, "#f28c5a")}`,
  "jp:place": `${SKY}${dot(50, 12, 5, "#e8483c")}<path d="M2 64 24 22h16l22 42z" fill="#5b7fb0"/><path d="M24 22h16l5 9-4-2-3 3-3-3-3 3-3-3-4 2z" fill="#fff"/>
    <path d="M2 8c6 2 10 4 14 10" fill="none" stroke="#7a4b2a" stroke-width="1.5"/>${[[6, 10], [11, 13], [15, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#f7b6c8" stroke-width="0.8"/>`).join("")}`,
  "jp:animal": `<circle cx="32" cy="34" r="16" fill="#b9b2a8"/><path d="M22 34c0-6 4-10 10-10s10 4 10 10-4 10-10 10-10-4-10-10z" fill="#e8848a"/>
    ${dot(28, 32)}${dot(36, 32)}<path d="M29 38c2 1 4 1 6 0" fill="none"/><path d="M4 46h56v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#8cc6e0"/>
    <path d="M12 16c-2-4 2-6 0-10M52 16c-2-4 2-6 0-10" fill="none" stroke="#9fb4c2" stroke-width="2"/>`,

  "au:food": `<path d="M30 34l12-5 14 5-12 5z" fill="#8a5230"/><path d="M30 34l14 5v14l-14-5zM44 39l12-5v14l-12 5z" fill="#6b3d22"/>
    <path d="M6 30l16-7 18 7-18 7z" fill="#8a5230"/><path d="M6 30l16 7v18L6 48zM22 37l18-7v18l-18 7z" fill="#6b3d22"/>
    ${[[12, 36], [16, 44], [10, 42], [28, 40], [34, 44], [30, 48], [20, 28], [26, 30], [16, 29], [48, 44], [52, 40], [38, 35]].map(([x, y]) => dot(x, y, 1, "#fff")).join("")}`,
  "au:place": `${SKY}<rect y="52" width="64" height="12" fill="#4f8fc0" stroke="none"/><rect x="6" y="46" width="52" height="6" fill="#d9c7a4"/>
    <path d="M10 46c2-12 8-18 16-20-2 8-2 14 2 20z" fill="#fbfaf6"/><path d="M22 46c2-14 10-22 20-24-4 8-4 16 0 24z" fill="#fbfaf6"/><path d="M38 46c2-10 8-16 14-16-2 6-2 12 2 16z" fill="#fbfaf6"/>`,
  "au:animal": `<path d="M24 52c-8 2-14 6-20 10" fill="none" stroke="#c98a4a" stroke-width="6"/><path d="M20 58h22" fill="none" stroke="#a86a30" stroke-width="4"/>
    <path d="M18 52c-2-12 4-24 14-28 8-2 12 6 10 16-2 8-6 14-12 16-6 2-11 0-12-4z" fill="#c98a4a"/><ellipse cx="26" cy="48" rx="8" ry="9" fill="#c98a4a"/>
    <path d="M36 14l-2-11 6 8zM41 13l2-10 3 9z" fill="#d39a5a"/><ellipse cx="41" cy="17" rx="8" ry="6" fill="#d39a5a"/>${dot(43, 16, 1.4)}<ellipse cx="48.5" cy="18.5" rx="1.4" ry="1" fill="${INK}" stroke="none"/>
    <path d="M32 44c2 5 9 5 11 0z" fill="#e8c08a"/><circle cx="37.5" cy="42" r="3" fill="#d39a5a"/><path d="M40 30l6 4" fill="none" stroke="#a86a30" stroke-width="2"/>`,
  "sa:food": `<ellipse cx="32" cy="45" rx="29" ry="12" fill="#c9cfd6"/><path d="M8 43c2-12 12-18 24-18s22 6 24 18c-14 4-34 4-48 0z" fill="#e8a33c"/>
    <ellipse cx="31" cy="31" rx="9" ry="6" fill="#a8582a"/><path d="M38 34l7 4" fill="none" stroke="#f4ead6" stroke-width="3.5"/>
    ${[[16, 38], [46, 37], [22, 41], [40, 41]].map(([x, y], i) => dot(x, y, 1.5, i % 2 ? "#5a2d1a" : "#fff")).join("")}`,
  "sa:place": `${WARM}${dot(46, 16, 7, "#f6b73c")}<path d="M0 42c12-10 22-10 34 0s18 0 30-6v28H0z" fill="#e9a65a"/><path d="M0 52c14-8 26-6 36 0s16 2 28-2v14H0z" fill="#d68b3f"/>`,
  "sa:animal": `<path d="M18 36v22M24 36v22M40 38v20M46 38v20" fill="none" stroke="#b07a3a" stroke-width="3"/><path d="M13 37c-2 2-4 6-4 10" fill="none"/>
    <path d="M12 38c0-8 6-16 15-16 6 0 9 7 15 7 6 0 8 4 8 9z" fill="#d7a35e"/><path d="M48 38c4-2 4-10 6-16 1-3 5-3 6 0l1 4-3 2c-2 6-2 10-6 12z" fill="#d7a35e"/>${dot(57, 21, 1)}`,

  "ae:food": `<circle cx="20" cy="30" r="7" fill="#d98a2b"/><circle cx="32" cy="27" r="7" fill="#e39a35"/><circle cx="44" cy="30" r="7" fill="#d98a2b"/>
    <circle cx="26" cy="34" r="6" fill="#e39a35"/><circle cx="38" cy="34" r="6" fill="#d98a2b"/><path d="M14 27c6 4 10-4 16 0s10-4 16 0" fill="none" stroke="#6b3410" stroke-width="2.4"/>
    <path d="M8 36h48c0 12-10 20-24 20S8 48 8 36z" fill="#3f7fbf"/>`,
  "ae:place": `${SKY}<path d="M8 64V50h8v14M48 64V46h8v18" fill="#e1e6ec"/>
    <path d="M24 64V42l3-2V28l2-2V16l2-2V4h2v10l2 2v10l2 2v12l3 2v22z" fill="#c4ccd6"/><path d="M32 18v44" fill="none" stroke="#8e99a6" stroke-width="1"/>`,
  "ae:animal": `<path d="M20 40v18M26 42v16M42 42v16M48 40v18" fill="none" stroke="#3a3330" stroke-width="3"/><path d="M52 36c3 2 4 6 3 10" fill="none" stroke="#3a3330" stroke-width="2"/>
    <ellipse cx="35" cy="38" rx="18" ry="10" fill="#f4f1ea"/><path d="M15 20 21 1M19 20 26 2" fill="none" stroke="#3a3330" stroke-width="2"/>
    <path d="M20 36c-4-4-7-10-5-15 2-3 7-3 9 0 2 4 0 10 0 15z" fill="#f4f1ea"/><path d="M15 24c2 3 6 3 8 0l-1 6h-6z" fill="#3a3330"/>${dot(18, 23, 1)}`,

  "eg:food": `<path d="M6 30h52c0 14-12 24-26 24S6 44 6 30z" fill="#f4f1ea"/><path d="M8 30c4-10 44-10 48 0z" fill="#fbf6e6"/><path d="M14 28c6-6 30-6 36 0z" fill="#8a5a33"/>
    <rect x="14" y="26" width="5" height="2.6" rx="1" fill="#f2cf6b"/><rect x="45" y="26" width="5" height="2.6" rx="1" fill="#f2cf6b"/>
    <path d="M20 25c4-4 20-4 24 0z" fill="#d8362b"/><path d="M24 22l3-2M30 21l3-2M36 22l3-2" fill="none" stroke="#5a2d12" stroke-width="2"/>`,
  "eg:place": `${WARM}${dot(50, 12, 5, "#f6b73c")}<rect y="52" width="64" height="12" fill="#e9c27a" stroke="none"/>
    <path d="M2 54l8-12 8 12z" fill="#e2b062"/><path d="M8 54 26 22l18 32z" fill="#e2b062"/><path d="M26 22l18 32H30z" fill="#c99448"/><path d="M38 54 50 34l12 20z" fill="#e2b062"/>`,
  "eg:animal": `<path d="M48 48c8-2 12 2 12 8-6 2-10 0-12-4z" fill="#ecd3a2"/>${dot(58, 55, 2.5, "#3a2a1a")}<ellipse cx="34" cy="47" rx="16" ry="11" fill="#ecd3a2"/>
    <path d="M14 27 6 4l14 12zM34 27l8-23-14 12z" fill="#ecd3a2"/><path d="M13 22 9 10l7 7zM35 22l4-12-7 7z" fill="#f4b9a8" stroke="none"/>
    <path d="M10 29c0-6 6-10 14-10s14 4 14 10c0 6-8 12-14 12s-14-6-14-12z" fill="#ecd3a2"/>${dot(19, 28, 1.8)}${dot(29, 28, 1.8)}${dot(24, 34, 1.6)}<path d="M22 37c1 1 3 1 4 0" fill="none"/>`,

  "ke:food": `<ellipse cx="32" cy="45" rx="28" ry="12" fill="#e6c48a"/><path d="M10 43c0-12 8-18 15-18s15 6 15 18z" fill="#fbf7ea"/>
    <path d="M38 43c2-6 8-8 16-6-2 6-8 8-16 6z" fill="#3e8f3a"/><path d="M36 47c4-5 10-5 16-2-4 5-10 5-16 2z" fill="#2f7a30"/>`,
  "ke:place": `<rect width="64" height="64" fill="#fde3a7" stroke="none"/>${dot(18, 20, 8, "#f6a23c")}<path d="M0 44c16-4 40-4 64 0v20H0z" fill="#d9b25a"/>
    <path d="M42 44V28" fill="none" stroke="#5a3a1f" stroke-width="2.5"/><path d="M28 28c4-6 24-6 28 0-4 3-24 3-28 0z" fill="#4d8a3a"/>
    <path d="M8 54l2-4 2 4M50 56l2-4 2 4M24 50l2-4 2 4" fill="none" stroke="#a88a3a"/>`,
  "ke:animal": `<path d="M22 58V42M30 58V42M42 58V42M50 58V42" fill="none" stroke="#d9a14a" stroke-width="4"/><path d="M18 40c-4 2-6 6-6 10" fill="none"/>
    <path d="M18 40c0-6 6-8 16-8h12c6 0 8 4 8 8v4H18z" fill="#e8b65a"/><path d="M44 34l4-22h8l-2 22z" fill="#e8b65a"/>
    <path d="M50 6V1M55 5V0" fill="none" stroke="#7a4a1f" stroke-width="2"/><ellipse cx="54" cy="10" rx="8" ry="5" fill="#e8b65a" transform="rotate(20 54 10)"/>${dot(53, 9, 1.2)}
    <path d="M24 36h5v4h-5zM34 34h5v5h-5zM44 36h4v4h-4zM48 24h3v4h-3zM49 16h3v3h-3z" fill="#b06a2a" stroke="none"/>`,

  "it:food": `<circle cx="32" cy="34" r="27" fill="#e1a85a"/><circle cx="32" cy="34" r="22" fill="#d8402e"/>
    <circle cx="24" cy="28" r="5" fill="#fff4d2"/><circle cx="41" cy="30" r="5" fill="#fff4d2"/><circle cx="31" cy="43" r="5" fill="#fff4d2"/>
    <path d="M35 21c2-3 6-3 7 0-2 3-5 3-7 0zM19 39c2-3 6-3 7 0-2 3-5 3-7 0z" fill="#3a9a3a"/>`,
  "it:place": `${SKY}<rect y="56" width="64" height="8" fill="#7fbf6a" stroke="none"/><g transform="rotate(4 32 58)"><rect x="22" y="12" width="20" height="46" fill="#fbfaf6"/>
    <path d="M22 20h20M22 28h20M22 36h20M22 44h20M22 52h20" fill="none"/><rect x="24" y="6" width="16" height="6" fill="#fbfaf6"/>
    ${[22, 30, 38, 46].map(y => `<path d="M26 ${y + 1}v4M30 ${y + 1}v4M34 ${y + 1}v4M38 ${y + 1}v4" fill="none" stroke-width="1.4"/>`).join("")}</g>`,
  "it:animal": `<path d="M44 52c8 0 12 4 14 8-6 0-12-2-14-4z" fill="#9a9590"/><path d="M20 60c-2-10 0-22 8-28h10c8 6 10 18 8 28z" fill="#9a9590"/>
    <path d="M20 24l2-14 8 8zM44 24l-2-14-8 8z" fill="#9a9590"/><path d="M18 26c0-8 6-12 14-12s14 4 14 12c0 6-6 12-14 14-8-2-14-8-14-14z" fill="#a9a49e"/>
    <path d="M26 32c2-2 4-3 6-3s4 1 6 3c-2 4-4 6-6 6s-4-2-6-6z" fill="#efe9e2"/>${dot(26, 24, 1.8)}${dot(38, 24, 1.8)}<ellipse cx="32" cy="31" rx="2" ry="1.4" fill="${INK}"/>
    <path d="M27 60v-8M37 60v-8" fill="none"/>`,

  "gb:food": `<path d="M20 30V14M26 30V10M32 30V13M38 30V11M44 30V15" fill="none" stroke="#e9b23e" stroke-width="5"/><path d="M10 30h44l-6 26H16z" fill="#f4f1ea"/>
    <path d="M18 46h10M20 51h8M36 50h8" fill="none" stroke="#9aa0a6" stroke-width="1.2"/><path d="M6 36c6-10 30-12 40-6l10-6v16l-10-5c-10 6-34 6-40 1z" fill="#d99a3c"/>
    <circle cx="52" cy="50" r="5" fill="#f7e24a"/>`,
  "gb:place": `${SKY}<rect x="24" y="22" width="16" height="42" fill="#d8b878"/><rect x="22" y="18" width="20" height="6" fill="#d8b878"/><path d="M22 18l10-15 10 15z" fill="#3e4a5a"/>
    <circle cx="32" cy="31" r="6" fill="#fbfaf4"/><path d="M32 31v-4M32 31l3 1" fill="none"/><path d="M28 42v20M32 42v20M36 42v20" fill="none" stroke="#a98a52" stroke-width="1"/>`,
  "gb:animal": `${spikes(34, 50, 22, 22, 9)}<path d="M4 50c0-8 6-12 14-12 6 0 10 4 10 12z" fill="#e8d2b0"/>${dot(13, 44)}${dot(5, 48, 2)}
    <path d="M18 50v6M42 50v6" fill="none"/><path d="M2 56h60" fill="none" stroke="#7fbf6a" stroke-width="3"/>`,

  "ca:food": `<ellipse cx="32" cy="51" rx="27" ry="7" fill="#e6eef2"/><ellipse cx="32" cy="46" rx="20" ry="5" fill="#e3a858"/><ellipse cx="32" cy="40" rx="20" ry="5" fill="#e3a858"/>
    <ellipse cx="32" cy="34" rx="20" ry="5" fill="#e3a858"/><path d="M17 33c4 2 22 2 30 0-1 4-2 8-3 12-1-3-2-5-3-6-2 2-3 5-4 8-1-3-1-6-2-7-6 0-14-2-18-7z" fill="#a8541c"/>`,
  "ca:place": `${SKY}<path d="M0 22h64v12H0z" fill="#5a9ad0"/><path d="M8 34h48v20H8z" fill="#cfe9f7"/>
    <path d="M14 34v18M22 34v20M30 34v18M38 34v20M46 34v18" fill="none" stroke="#fff" stroke-width="2"/><path d="M0 34h8v30H0zM56 34h8v30h-8z" fill="#3e8f3a"/>
    <path d="M8 54c6-4 12 0 16-2s10 2 16 0 10-2 16 2v10H8z" fill="#f4fbff"/>
    <path d="M14 22c4-14 32-14 36 0" fill="none" stroke="#e8483c" stroke-width="1.6"/><path d="M17 22c4-10 26-10 30 0" fill="none" stroke="#f2c230" stroke-width="1.6"/><path d="M20 22c4-7 20-7 24 0" fill="none" stroke="#3a86c8" stroke-width="1.6"/>`,
  "ca:animal": `<ellipse cx="44" cy="55" rx="16" ry="6" fill="#5a3a24"/><path d="M34 53l18 2M36 57l18-1" fill="none" stroke="#3a2414" stroke-width="0.8"/>
    <ellipse cx="28" cy="41" rx="16" ry="16" fill="#8a5a33"/><circle cx="15" cy="14" r="3" fill="#9a6a3a"/><circle cx="33" cy="14" r="3" fill="#9a6a3a"/><circle cx="24" cy="22" r="11" fill="#9a6a3a"/>
    ${dot(20, 20)}${dot(28, 20)}<ellipse cx="24" cy="25" rx="2.4" ry="1.6" fill="${INK}"/><path d="M22 28h4v5h-4z" fill="#f2a33a"/><path d="M24 28v5" fill="none" stroke-width="0.8"/>`,

  "us:food": `<path d="M10 30c0-12 10-18 22-18s22 6 22 18z" fill="#d9903c"/>${[[22, 20], [30, 17], [38, 20], [28, 24], [42, 25]].map(([x, y]) => dot(x, y, 1, "#fff4d2")).join("")}
    <path d="M8 30h48v4c-6 3-10-1-16 2s-10-1-16 2-10-1-16-2z" fill="#5ab04a"/><rect x="9" y="35" width="46" height="7" rx="3.5" fill="#6b3a1f"/>
    <path d="M10 42h44l-6 5-4-3z" fill="#f2c230"/><path d="M10 45h44c0 5-4 8-10 8H20c-6 0-10-3-10-8z" fill="#d9903c"/>`,
  "us:place": `${SKY}<rect y="46" width="64" height="18" fill="#4f8fc0" stroke="none"/>
    <path d="M0 30c8 4 14 2 19-16 6 22 22 22 26 0 4 18 11 20 19 16" fill="none" stroke="#d2462b" stroke-width="1.6"/>
    <path d="M26 42V30M32 42V32M38 42V30M8 42V32M56 42V32" fill="none" stroke="#d2462b" stroke-width="0.8"/>
    <path d="M16 62V12M22 62V12M42 62V12M48 62V12" fill="none" stroke="#d2462b" stroke-width="3"/><path d="M15 16h8M15 26h8M41 16h8M41 26h8" fill="none" stroke="#d2462b" stroke-width="2"/>
    <path d="M0 41h64v4H0z" fill="#d2462b"/>`,
  "us:animal": `<path d="M24 46v13M32 46v13M48 46v13M54 46v13" fill="none" stroke="#4a2e1a" stroke-width="4"/><path d="M58 34c3 2 3 6 2 8" fill="none"/>
    <path d="M20 47c0-14 6-27 18-27 10 0 20 8 20 18v9z" fill="#6b4428"/><path d="M8 24c-4-2-4-6-2-8M26 24c3-2 4-6 2-8" fill="none" stroke="#e8e0d0" stroke-width="2.5"/>
    <path d="M6 31c0-6 6-10 12-10s10 6 10 12-4 14-10 14S6 39 6 31z" fill="#4a2e1a"/><path d="M12 45c2 6 8 6 10 0z" fill="#3a2414"/>${dot(12, 30, 1.4, "#f4e8d0")}${dot(22, 30, 1.4, "#f4e8d0")}`,

  "br:food": `<circle cx="18" cy="32" r="8" fill="#f2cf7c"/><circle cx="46" cy="32" r="8" fill="#f2cf7c"/><circle cx="32" cy="28" r="9" fill="#f5d888"/>
    <circle cx="25" cy="36" r="7" fill="#efc76b"/><circle cx="39" cy="36" r="7" fill="#efc76b"/><path d="M6 38h52l-6 18H12z" fill="#b5793d"/><path d="M9 44h46M11 50h42" fill="none" stroke="#8a5528"/>`,
  "br:place": `${SKY}<path d="M0 30c6-6 10-6 14-2 4-8 12-8 16-2 4-6 12-6 16 0 4-6 12-4 18 0v34H0z" fill="#2f8a3a"/>
    <circle cx="10" cy="40" r="5" fill="#3fa04a"/><circle cx="50" cy="38" r="6" fill="#3fa04a"/><circle cx="30" cy="36" r="4" fill="#3fa04a"/>
    <path d="M0 64c10-10 30-6 30-16s20-10 34-12v6c-12 2-26 4-26 12s-20 10-28 10z" fill="#c2a05a"/><path d="M48 14l4-2 4 2M40 18l3-2 3 2" fill="none"/>`,
  "br:animal": `<path d="M4 56h56" fill="none" stroke="#7a4b2a" stroke-width="4"/><path d="M22 52l-4 10h7z" fill="${INK}"/>
    <path d="M26 54c-6-6-8-18-2-28 4-6 12-6 14 2 2 8 0 18-4 26z" fill="${INK}"/><path d="M28 30c4-2 8 0 8 4 0 6-4 8-8 6z" fill="#fbf6e6"/>
    <path d="M36 25c8-4 19-4 25 2-6 4-17 6-25 4z" fill="#f28c28"/><path d="M36 29c8 1 16 0 25-2" fill="none"/>${dot(60, 27, 1.6)}
    <circle cx="31" cy="25" r="3" fill="#7fd0e0" stroke="none"/>${dot(31, 25, 1.4)}`,
};

/** Flags we can draw exactly, each in its own proportions (from the official construction sheets). The rest are left out. */
export type Flag = { w: number; h: number; svg: string };
const usStars = () => {
  const out: string[] = [];
  for (let row = 1; row <= 9; row++) for (let col = row % 2 ? 1 : 2; col <= 11; col += 2) out.push(star(247 * col, 210 * row, 120.12, "#fff"));
  return out.join("");
};
export const FLAGS: Readonly<Record<string, Flag>> = {
  bd: { w: 10, h: 6, svg: `<rect width="10" height="6" fill="#006a4e"/><circle cx="4.5" cy="3" r="2" fill="#f42a41"/>` },
  in: { w: 90, h: 60, svg: `<g transform="translate(45 30)"><rect x="-45" y="-30" width="90" height="60" fill="#fff"/><rect x="-45" y="-30" width="90" height="20" fill="#ff6820"/><rect x="-45" y="10" width="90" height="20" fill="#046a38"/>
    <circle r="8.6" fill="none" stroke="#07038d" stroke-width="1.3"/><circle r="1.6" fill="#07038d"/>${Array.from({ length: 24 }, (_, i) => `<path d="M0 0V-8" stroke="#07038d" stroke-width="0.45" transform="rotate(${i * 15})"/>`).join("")}</g>` },
  mm: { w: 18, h: 12, svg: `<rect width="18" height="12" fill="#fecb00"/><rect y="4" width="18" height="8" fill="#34b233"/><rect y="8" width="18" height="4" fill="#ea2839"/>${star(9, 6.422, 4.422, "#fff")}` },
  my: { w: 28, h: 14, svg: `<rect width="28" height="14" fill="#fff"/>${[0, 2, 4, 6, 8, 10, 12].map(y => `<rect y="${y}" width="28" height="1" fill="#cc0000"/>`).join("")}<rect width="14" height="8" fill="#000066"/>
    <path transform="scale(0.0020833)" fill="#fc0" d="m4200 720 107 732 414-613-222 706 639-373-506 540 738-59-690 267 690 267-738-59 506 540-639-373 222 706-414-613-107 732-107-732-414 613 222-706-639 373 506-540-738 59 690-267-690-267 738 59-506-540 639 373-222-706 414 613zm-600 30a1280 1280 0 1 0 0 2340 1440 1440 0 1 1 0-2340z"/>` },
  sg: { w: 54, h: 36, svg: `<rect width="54" height="36" fill="#fff"/><rect width="54" height="18" fill="#ee2536"/><circle cx="11.405" cy="9" r="6.625" fill="#fff"/><circle cx="15.03" cy="9" r="7.25" fill="#ee2536"/>
    ${[0, 72, 144, 216, 288].map(a => `<path transform="rotate(${a} 15.03 9)" fill="#fff" d="m15.03 3.475-1.01393 3.120554 2.654502-1.928609h-3.281145l2.654502 1.928609z"/>`).join("")}` },
  // China: a 30×20 grid; each small star turns one point toward the big star's centre.
  cn: { w: 30, h: 20, svg: `<rect width="30" height="20" fill="#ee1c25"/>${star(5, 5, 3, "#ffde00")}${[[10, 2], [12, 4], [12, 7], [10, 9]].map(([x, y]) => star(x, y, 1, "#ffde00", (Math.atan2(5 - y, 5 - x) * 180) / Math.PI)).join("")}` },
  jp: { w: 3, h: 2, svg: `<rect width="3" height="2" fill="#fff"/><circle cx="1.5" cy="1" r="0.6" fill="#bc002d"/>` },
  ae: { w: 12, h: 6, svg: `<rect width="12" height="2" fill="#00732f"/><rect y="2" width="12" height="2" fill="#fff"/><rect y="4" width="12" height="2" fill="#000"/><rect width="3" height="6" fill="#ff0000"/>` },
  it: { w: 3, h: 2, svg: `<rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ce2b37"/>` },
  // Union Jack, 60×30: the red diagonals are counterchanged (drawn as four offset bands), as the real flag has them.
  gb: { w: 60, h: 30, svg: `<rect width="60" height="30" fill="#012169"/><path d="M0 0l60 30M60 0 0 30" stroke="#fff" stroke-width="6"/>
    <path fill="#c8102e" d="M0 0l30 15h-4.47L0 2.236zM60 30 30 15h4.47L60 27.764zM60 0 30 15v-2.236L55.53 0zM0 30l30-15v2.236L4.47 30z"/>
    <path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/>` },
  us: { w: 7410, h: 3900, svg: `<rect width="7410" height="3900" fill="#fff"/>${Array.from({ length: 7 }, (_, i) => `<rect y="${i * 600}" width="7410" height="300" fill="#b22234"/>`).join("")}<rect width="2964" height="2100" fill="#3c3b6e"/>${usStars()}` },
};

/** A whole picture as a standalone SVG document, for <img> on the card canvas. */
export function picDocument(key: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${PICS[key] ?? ""}</g></svg>`;
}
export function flagDocument(id: string) {
  const flag = FLAGS[id];
  return flag ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${flag.w} ${flag.h}" preserveAspectRatio="none">${flag.svg}</svg>` : "";
}

/** The plane, nose to the right, centred on 0,0 (unit size ±1). */
export const PLANE = `<path d="M1 0 .55 -.1 .1 -.9 -.12 -.9 .1 -.1 -.55 -.12 -.75 -.42 -.9 -.42 -.8 0 -.9 .42 -.75 .42 -.55 .12 .1 .1 -.12 .9 .1 .9 .55 .1z"/>`;

// ---- The map: hand-drawn outlines in longitude/latitude, shown flat (x = lon + 170, y = 80 − lat). ----
type Ring = readonly (readonly [number, number])[];
const LAND: readonly Ring[] = [
  // Eurasia, from Gibraltar east along the Mediterranean, round Arabia, India and South-East Asia, up the Pacific, back along the Arctic.
  [[-5.5, 36], [-2, 36.7], [0, 38.7], [0.5, 40.5], [3, 42], [3, 43.3], [6, 43.1], [8.5, 44.3], [10.5, 43], [12.5, 41.5], [15.5, 40], [16, 38], [17, 39], [18.5, 40.2], [16, 41.4], [13.5, 43.7], [12.5, 45],
    [13.7, 45.6], [15.5, 44], [19.5, 42], [20, 40], [21, 38], [23, 36.5], [24, 38], [23, 40.5], [26, 40.8], [26.5, 38.5], [27.5, 37], [29, 36.5], [32, 36.2], [36, 36.8], [36, 35], [35, 33], [34.3, 31.3],
    [34.9, 29.5], [37, 26], [39, 22], [41, 18], [43, 13], [45, 12.8], [49, 14], [52, 15.5], [55, 17], [57, 18.8], [59.5, 22], [58, 23.7], [56.4, 24.9], [56.3, 26.2], [55, 25.5], [52, 24], [51.5, 25.5],
    [50.8, 24.7], [50, 26], [48.5, 28], [48, 30], [50, 30], [51, 28], [54, 26.7], [56.5, 27.1], [58, 25.6], [61.5, 25.1], [66, 25.4], [67, 24.8], [68.5, 23], [70, 22.5], [72.5, 21.2], [72.8, 19], [73.5, 16],
    [74.5, 13], [76, 10], [77.5, 8], [78.5, 9], [79.8, 10.3], [80.2, 13.5], [80.3, 15.5], [81.5, 16.5], [82.5, 17], [84.5, 19], [86.5, 20], [87, 21.5], [88.5, 21.8], [89.5, 21.9], [90.5, 22.2], [91.5, 22.5],
    [92, 21], [92.5, 20], [94, 18.5], [94.5, 16], [95.5, 15.8], [97.5, 16.5], [97.7, 15], [98.5, 12], [98.5, 9.5], [98.3, 8], [100, 6.5], [100.4, 4], [101.3, 2.7], [103.5, 1.3], [104.2, 1.4], [103.4, 4],
    [103.2, 5.5], [102, 6.2], [100.8, 7], [100.3, 8.5], [99.2, 10], [99.5, 12], [100, 13.5], [100.5, 12], [102, 12], [103, 10.5], [105, 9], [106.5, 10.5], [109, 11.5], [109, 13], [108, 16], [106, 18],
    [106.5, 20.5], [108, 21.5], [110, 21], [111, 21.5], [114, 22.3], [117, 23.5], [119.5, 26], [121.5, 28.5], [122, 31], [120.5, 33.5], [119, 35], [120, 37], [122.5, 37], [121, 38], [118, 38.5],
    [118, 39.5], [121, 40.5], [124, 40], [125, 38], [126.5, 34.5], [129, 35], [129.5, 37], [128.5, 38.5], [129.5, 41], [130.5, 42.5], [133, 42.8], [135.5, 43.8], [138, 46], [140, 48.5], [141, 53],
    [137, 54], [143, 59], [155, 59.5], [163, 62], [172, 64], [180, 65], [180, 69], [170, 70], [160, 70], [150, 71.5], [140, 72.5], [130, 71], [120, 73], [113, 73.5], [105, 77.5], [100, 76], [90, 75],
    [80, 73], [72, 72.5], [68, 69], [60, 69], [50, 68], [44, 68], [40, 66], [33, 69.5], [28, 71], [22, 70.5], [15, 68.5], [12, 65], [5, 62], [5, 58.5], [8, 58], [10, 59], [11, 58], [12, 56], [10.5, 54.5],
    [8.5, 54], [7, 53.5], [4.5, 52.5], [2, 51], [-1.5, 49.5], [-4.5, 48.5], [-1.5, 46.5], [-1.5, 43.5], [-8.5, 43.5], [-9, 39], [-9, 37], [-7, 37]],
  // Africa, with Sinai.
  [[-6, 35.8], [-2, 35.1], [1, 36.5], [5, 36.8], [10, 37.2], [11, 35.5], [10.3, 33.8], [11.5, 33], [15, 32.3], [19.9, 30.5], [20, 32], [22, 32.9], [25, 31.8], [29, 30.9], [32.5, 31.1], [34.2, 31.3],
    [34.9, 29.5], [34, 27.8], [33, 28.5], [32.5, 30], [33.5, 27], [35.5, 24], [37, 21], [38.5, 18], [39.5, 15.5], [42, 13], [43.3, 11.5], [44, 10.5], [48, 11.2], [51.2, 11.8], [51, 10.5], [49.5, 7],
    [48, 4.5], [46, 2], [43.5, -0.5], [41.5, -1.8], [39.5, -4.8], [39, -6.5], [39.5, -10], [40.5, -11], [40.5, -15], [37, -17.5], [35, -19.5], [35.5, -22.5], [32.8, -26], [32.5, -28.5], [30.5, -31],
    [27, -33.7], [22.5, -34], [20, -34.8], [18.4, -34.2], [18, -32], [16.5, -28.5], [15, -26.5], [14.5, -22.5], [12, -18], [11.8, -16], [13.5, -12], [13, -9], [12, -6], [9.5, -2], [9.3, 1], [9.5, 3.8],
    [8.5, 4.5], [6, 4.3], [4, 6.3], [1.5, 6.2], [-2, 4.8], [-4.5, 5.2], [-7.5, 4.4], [-11.5, 6.8], [-13.2, 8.5], [-15, 11], [-16.8, 12.5], [-17.4, 14.7], [-16.5, 16.5], [-16, 19.5], [-17, 21],
    [-15.8, 23.8], [-13.3, 27.2], [-9.8, 29.5], [-9.5, 32], [-6.8, 34]],
  // North and Central America.
  [[-168, 65.5], [-164, 68], [-157, 71], [-140, 69.7], [-128, 70], [-115, 68.5], [-105, 68], [-95, 68], [-90, 69], [-82, 69.5], [-80, 63], [-87, 64.5], [-93, 61], [-94, 58.8], [-89, 56.8], [-82, 55],
    [-79, 51.5], [-78, 56], [-77, 60], [-72, 61.5], [-65, 60], [-61, 56], [-56, 52], [-60, 49.5], [-65, 49], [-64.5, 47], [-61, 45.3], [-66, 44], [-70, 43.5], [-70, 41.7], [-74, 40.5], [-76, 38],
    [-76, 35], [-78, 33.8], [-81, 31.5], [-80, 27], [-80.3, 25.2], [-81.8, 26.5], [-82.8, 29.5], [-85, 29.7], [-89.5, 30.2], [-90, 29], [-94, 29.6], [-97.4, 27.5], [-97.5, 24], [-97.5, 21.5], [-96, 19],
    [-94, 18.2], [-91, 18.7], [-90.5, 21], [-87, 21.5], [-87.5, 18], [-88.3, 16], [-84, 15.8], [-83.5, 11], [-82, 9], [-79.5, 9.5], [-77.5, 8.5], [-78, 7.2], [-80, 7.5], [-81.5, 8], [-85.5, 10],
    [-87.5, 13], [-91.5, 14], [-94.5, 16.2], [-97, 15.8], [-100, 17], [-105.5, 20], [-105.5, 22.5], [-108, 25.5], [-112.5, 29.5], [-114.5, 31.5], [-112.5, 28.5], [-110, 24], [-109.5, 23.2], [-112, 25],
    [-114, 28], [-115.8, 30], [-117.2, 32.5], [-120.6, 34.5], [-122.5, 37.5], [-124, 40.5], [-124, 46], [-124.7, 48.4], [-127.5, 50.5], [-130.5, 54], [-134, 58], [-140, 60], [-146, 61], [-152, 59],
    [-157, 57.5], [-162, 55], [-158, 58], [-162, 59.5], [-165, 62], [-165, 64.5]],
  // South America.
  [[-77, 7.5], [-76, 9.5], [-74, 11], [-71.5, 12.4], [-68, 10.5], [-63, 10.7], [-60.5, 8.5], [-57, 6], [-52, 5], [-50, 1.8], [-48.5, -1], [-44, -2.5], [-39, -3.5], [-35, -5.5], [-35, -9], [-37, -12.5],
    [-39, -15], [-39.5, -18], [-41, -22], [-44.5, -23.2], [-48.5, -26], [-48.7, -28.5], [-51, -31], [-53.5, -34], [-58, -34.5], [-57, -36.5], [-58.5, -38.5], [-62, -39], [-65, -41], [-63.5, -42.7],
    [-65.5, -45], [-67.5, -46.5], [-69, -51], [-68.5, -53], [-71, -54], [-74, -52.5], [-75.5, -48], [-74, -44], [-73.5, -38], [-71.5, -30], [-70.3, -18.5], [-75, -15.5], [-77.5, -12], [-79.5, -8],
    [-81.2, -6], [-80.5, -2.5], [-80, 0], [-79, 1.5], [-77.5, 4], [-77.3, 6.5]],
  // Australia.
  [[114, -22], [114, -34], [118, -35], [124, -34], [130, -32], [135, -35], [138, -35], [141, -38], [147, -38], [150, -37], [153, -28], [153, -25], [146, -19], [143, -11], [141, -13], [136, -12],
    [136, -15], [131, -12], [126, -14], [122, -18]],
  // Islands: Greenland, Baffin, Iceland, Britain, Ireland, Madagascar, Sri Lanka, Japan, Taiwan, Philippines, Sumatra, Borneo, Java, New Guinea, New Zealand, Cuba.
  [[-73, 78], [-60, 82], [-30, 83.5], [-20, 81], [-18, 77], [-22, 72], [-26, 68.5], [-35, 65.5], [-43, 60], [-50, 62], [-53, 66], [-55, 70], [-60, 75.5]],
  [[-80, 73.5], [-72, 71], [-62, 66.5], [-65, 63], [-72, 63.5], [-78, 64.5], [-81, 70], [-90, 72]],
  [[-24, 64], [-22, 66.3], [-15, 66.5], [-13.5, 65], [-18.5, 63.4]],
  [[-5.7, 50], [-3, 51.4], [-5.2, 51.7], [-4.2, 52.4], [-4.6, 53.3], [-3, 53.4], [-3.2, 54.2], [-4.8, 54.8], [-5.6, 56], [-6.2, 57.5], [-5, 58.6], [-3.5, 58.6], [-1.8, 57.6], [-2, 57], [-1.5, 55],
    [0, 53.5], [1.7, 52.7], [1.5, 51], [-5, 50]],
  [[-10, 52], [-6, 52], [-6, 55], [-8, 55.3], [-10, 54]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[80, 10], [82, 7], [81, 6], [80, 7]],
  [[130, 31], [131, 34], [136, 34], [140, 35], [141, 37], [141, 41], [143, 42], [145, 43.5], [142, 45.5], [140, 42], [139, 39], [137, 37], [133, 35.5], [130, 33]],
  [[120.3, 22.5], [121.9, 25], [121, 25.2], [120, 23.5]],
  [[120, 18], [122, 18], [124, 13], [126, 8], [125, 6], [122, 8], [120, 14]],
  [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [96, 2]],
  [[109, 2], [111, 2], [114, 4], [117, 7], [119, 5], [118, 1], [116, -4], [111, -3], [110, -1]],
  [[105, -6], [114, -7], [114, -8.5], [106, -7.5]],
  [[131, -1], [141, -2], [150, -10], [143, -9], [138, -8]],
  [[172, -34], [178, -38], [175, -41], [171, -45], [167, -46], [172, -41]],
  [[-85, 21.8], [-82, 23.1], [-77, 21.2], [-74.2, 20.2], [-77.5, 19.9], [-80, 21.6]],
];
/** Inland seas drawn back in as water: the Black Sea, the Caspian and the Baltic. */
const LAKES: readonly Ring[] = [
  [[27.5, 42], [28.5, 43.5], [29.7, 45.2], [31, 46.6], [33.5, 46], [33, 45], [36.5, 45.2], [38, 47.1], [39.5, 47], [38, 45.5], [41.6, 41.6], [38, 40.9], [35, 42], [31, 41.1], [29, 41.2]],
  [[47, 45], [49, 46.5], [51.5, 47], [53, 45.5], [51, 44.5], [52.8, 41.5], [54, 40], [53.5, 37.3], [51, 36.7], [49, 37.6], [49.5, 40], [48, 42], [47.5, 43.5]],
  [[13, 54.3], [18, 54.8], [21, 55.3], [21, 57], [24, 57.3], [24, 59.3], [29.5, 59.9], [23, 60], [21.5, 61], [21.3, 64], [25.5, 65.5], [22, 65.8], [17.5, 62.5], [17.3, 60.6], [19, 59.6], [16.5, 57],
    [14.3, 55.5], [12.8, 55.5]],
];
export const WORLD = { width: 350, height: 135 } as const;
export const project = (lon: number, lat: number): [number, number] => [lon + 170, 80 - lat];
const ringPath = (ring: Ring) => "M" + ring.map(([lon, lat]) => project(lon, lat).map(n => +n.toFixed(1)).join(" ")).join("L") + "Z";
export const LAND_PATH = LAND.map(ringPath).join("");
export const LAKE_PATH = LAKES.map(ringPath).join("");
