// Every object, drawn as our own flat SVG in a 100×100 box. The shadow on the wall is the same drawing turned black,
// so a shadow always matches its object exactly. Families group shapes that look alike, for the "look closely" level.

export type Family = "animal" | "wing" | "ride" | "home" | "outside";
export type Shape = { id: string; bn: string; family: Family; art: string };

const D = "#2f2a3a"; // eyes and small dark details

export const SHAPES: readonly Shape[] = [
  // Animals: legs, necks, humps and ears make each outline its own.
  { id: "hati", bn: "হাতি", family: "animal", art:
    `<ellipse cx="58" cy="52" rx="30" ry="22" fill="#8e9aaf"/><rect x="34" y="62" width="12" height="28" rx="4" fill="#8e9aaf"/><rect x="50" y="64" width="11" height="26" rx="4" fill="#7d889c"/><rect x="66" y="64" width="11" height="26" rx="4" fill="#7d889c"/><rect x="77" y="60" width="12" height="30" rx="4" fill="#8e9aaf"/>`
    + `<path d="M87 46 Q96 52 94 64" stroke="#8e9aaf" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="28" cy="42" r="16" fill="#8e9aaf"/><path d="M16 44 Q8 66 18 82" stroke="#8e9aaf" stroke-width="10" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="40" cy="44" rx="11" ry="15" fill="#a9b3c6"/><path d="M22 56 q4 5 10 2" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="23" cy="38" r="2.2" fill="${D}"/>` },
  { id: "jirafa", bn: "জিরাফ", family: "animal", art:
    `<rect x="18" y="58" width="6" height="34" rx="2" fill="#e0a23b"/><rect x="28" y="60" width="6" height="32" rx="2" fill="#e0a23b"/><rect x="46" y="60" width="6" height="32" rx="2" fill="#e0a23b"/><rect x="56" y="58" width="6" height="34" rx="2" fill="#e0a23b"/>`
    + `<ellipse cx="40" cy="56" rx="24" ry="12" fill="#efb54c"/><path d="M15 54 Q8 60 10 70" stroke="#efb54c" stroke-width="3" fill="none"/><path d="M52 52 L60 54 L76 18 L68 14 Z" fill="#efb54c"/>`
    + `<ellipse cx="77" cy="16" rx="11" ry="6.5" fill="#efb54c" transform="rotate(14 77 16)"/><line x1="72" y1="10" x2="70" y2="3" stroke="#b5702c" stroke-width="3" stroke-linecap="round"/><line x1="78" y1="10" x2="78" y2="3" stroke="#b5702c" stroke-width="3" stroke-linecap="round"/>`
    + `<circle cx="30" cy="54" r="4" fill="#b5702c"/><circle cx="42" cy="50" r="3.5" fill="#b5702c"/><circle cx="50" cy="60" r="3.5" fill="#b5702c"/><circle cx="64" cy="36" r="3" fill="#b5702c"/><circle cx="68" cy="26" r="2.5" fill="#b5702c"/><circle cx="80" cy="15" r="1.8" fill="${D}"/>` },
  { id: "ut", bn: "উট", family: "animal", art:
    `<rect x="24" y="58" width="6" height="34" rx="2" fill="#b98247"/><rect x="34" y="60" width="6" height="32" rx="2" fill="#b98247"/><rect x="54" y="60" width="6" height="32" rx="2" fill="#b98247"/><rect x="64" y="58" width="6" height="34" rx="2" fill="#b98247"/>`
    + `<path d="M18 62 Q16 46 30 44 Q38 26 48 40 Q56 30 64 42 Q72 46 72 58 Q46 70 18 62 Z" fill="#c8955a"/><path d="M19 52 Q10 58 12 68" stroke="#c8955a" stroke-width="3" fill="none"/>`
    + `<path d="M66 52 Q80 50 80 30" stroke="#c8955a" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="86" cy="28" rx="10" ry="6" fill="#c8955a"/><circle cx="86" cy="26" r="1.6" fill="${D}"/>` },
  { id: "biral", bn: "বিড়াল", family: "animal", art:
    `<path d="M64 84 Q90 80 84 56 Q82 48 76 50" stroke="#f0a35e" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="68" rx="19" ry="22" fill="#f0a35e"/>`
    + `<path d="M37 34 L38 14 L50 26 Z" fill="#f0a35e"/><path d="M63 34 L62 14 L50 26 Z" fill="#f0a35e"/><circle cx="50" cy="38" r="15" fill="#f0a35e"/>`
    + `<path d="M40 76 v14 M60 76 v14" stroke="#d98a45" stroke-width="3"/><circle cx="44" cy="36" r="2.2" fill="${D}"/><circle cx="56" cy="36" r="2.2" fill="${D}"/><path d="M47 43 q3 3 6 0" stroke="${D}" stroke-width="1.6" fill="none"/>` },
  { id: "chhagol", bn: "ছাগল", family: "animal", art:
    `<rect x="34" y="60" width="6" height="30" rx="2" fill="#a8774b"/><rect x="44" y="62" width="6" height="28" rx="2" fill="#a8774b"/><rect x="64" y="62" width="6" height="28" rx="2" fill="#a8774b"/><rect x="74" y="60" width="6" height="30" rx="2" fill="#a8774b"/>`
    + `<ellipse cx="57" cy="54" rx="26" ry="13" fill="#b9875a"/><path d="M80 46 L88 36 L90 40 Z" fill="#b9875a"/><path d="M36 50 L28 34 L38 32 L44 48 Z" fill="#b9875a"/>`
    + `<ellipse cx="26" cy="36" rx="11" ry="7" fill="#b9875a" transform="rotate(-20 26 36)"/><path d="M30 30 Q34 16 46 22" stroke="#7a5230" stroke-width="4" fill="none" stroke-linecap="round"/>`
    + `<path d="M33 34 L44 38 L36 40 Z" fill="#a8774b"/><path d="M20 40 L18 50 L24 43 Z" fill="#a8774b"/><circle cx="24" cy="33" r="1.8" fill="${D}"/>` },
  { id: "khorgosh", bn: "খরগোশ", family: "animal", art:
    `<ellipse cx="44" cy="70" rx="24" ry="17" fill="#c9c3bd"/><circle cx="20" cy="66" r="7" fill="#f4f1ed"/><ellipse cx="56" cy="86" rx="14" ry="4.5" fill="#b5aea7"/>`
    + `<ellipse cx="58" cy="24" rx="5.5" ry="18" fill="#c9c3bd" transform="rotate(-12 58 24)"/><ellipse cx="70" cy="26" rx="5.5" ry="18" fill="#b5aea7" transform="rotate(14 70 26)"/>`
    + `<circle cx="66" cy="50" r="13" fill="#c9c3bd"/><circle cx="71" cy="47" r="2" fill="${D}"/><circle cx="78" cy="53" r="2" fill="#e88a9a"/>` },

  // Birds, a fish and a butterfly.
  { id: "has", bn: "হাঁস", family: "wing", art:
    `<path d="M28 62 Q28 84 54 84 Q82 84 86 62 L94 52 Q80 58 70 56 Q48 52 28 62 Z" fill="#f7f4ec" stroke="#cbbf9f" stroke-width="2"/><path d="M24 40 L36 40 L42 62 L28 64 Z" fill="#f7f4ec"/>`
    + `<circle cx="30" cy="36" r="11" fill="#f7f4ec" stroke="#cbbf9f" stroke-width="2"/><ellipse cx="15" cy="39" rx="9" ry="4" fill="#f39c12"/><circle cx="28" cy="33" r="2" fill="${D}"/><path d="M52 66 Q64 74 76 64" stroke="#cbbf9f" stroke-width="2.5" fill="none"/>` },
  { id: "morog", bn: "মোরগ", family: "wing", art:
    `<line x1="46" y1="72" x2="44" y2="90" stroke="#e6a817" stroke-width="3.5"/><line x1="58" y1="72" x2="60" y2="90" stroke="#e6a817" stroke-width="3.5"/><path d="M36 91 h14 M54 91 h14" stroke="#e6a817" stroke-width="3" stroke-linecap="round"/>`
    + `<ellipse cx="76" cy="38" rx="9" ry="22" fill="#2c6e49" transform="rotate(30 76 38)"/><ellipse cx="82" cy="48" rx="8" ry="20" fill="#1d4e89" transform="rotate(55 82 48)"/>`
    + `<ellipse cx="52" cy="58" rx="22" ry="17" fill="#c0392b"/><path d="M32 52 L30 34 L42 34 L46 50 Z" fill="#d35400"/><circle cx="34" cy="32" r="10" fill="#d35400"/>`
    + `<path d="M27 25 q2 -9 6 -2 q3 -8 6 0 q4 -6 5 3 Z" fill="#e74c3c"/><ellipse cx="29" cy="43" rx="3" ry="5" fill="#e74c3c"/><path d="M25 31 L15 35 L25 38 Z" fill="#f1c40f"/><circle cx="32" cy="30" r="1.8" fill="${D}"/>` },
  { id: "penguin", bn: "পেঙ্গুইন", family: "wing", art:
    `<ellipse cx="40" cy="91" rx="9" ry="4" fill="#f39c12"/><ellipse cx="60" cy="91" rx="9" ry="4" fill="#f39c12"/><ellipse cx="27" cy="58" rx="6" ry="20" fill="#263238" transform="rotate(16 27 58)"/><ellipse cx="73" cy="58" rx="6" ry="20" fill="#263238" transform="rotate(-16 73 58)"/>`
    + `<ellipse cx="50" cy="54" rx="21" ry="34" fill="#263238"/><ellipse cx="50" cy="62" rx="14" ry="24" fill="#fafafa"/><circle cx="43" cy="32" r="2.4" fill="#fff"/><circle cx="57" cy="32" r="2.4" fill="#fff"/><path d="M45 38 L55 38 L50 45 Z" fill="#f39c12"/>` },
  { id: "doyel", bn: "দোয়েল", family: "wing", art:
    `<rect x="8" y="80" width="84" height="7" rx="3.5" fill="#6d4c41"/><path d="M44 62 L42 80 M54 62 L56 80" stroke="#455a64" stroke-width="3"/><path d="M64 50 L82 18 L90 23 L72 58 Z" fill="#263238"/><path d="M82 18 L90 23 L88 27 L80 22 Z" fill="#fafafa"/>`
    + `<ellipse cx="50" cy="54" rx="22" ry="12" fill="#263238" transform="rotate(-12 50 54)"/><ellipse cx="50" cy="60" rx="15" ry="5.5" fill="#fafafa"/><path d="M42 50 Q54 46 64 50" stroke="#fafafa" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    + `<circle cx="29" cy="43" r="10" fill="#263238"/><path d="M21 41 L9 44 L21 47 Z" fill="#37474f"/><circle cx="27" cy="41" r="2" fill="#fff"/>` },
  { id: "ilish", bn: "ইলিশ মাছ", family: "wing", art:
    `<path d="M70 48 L92 30 L86 50 L92 70 L70 54 Z" fill="#90a4ae"/><path d="M8 50 Q36 26 74 46 L74 54 Q36 74 8 50 Z" fill="#b0bec5"/><path d="M40 34 L50 24 L56 36 Z" fill="#90a4ae"/>`
    + `<path d="M26 40 Q30 50 26 60" stroke="#78909c" stroke-width="2" fill="none"/><circle cx="18" cy="48" r="2.4" fill="${D}"/><path d="M34 50 Q52 44 68 50" stroke="#eceff1" stroke-width="2" fill="none"/>` },
  { id: "projapoti", bn: "প্রজাপতি", family: "wing", art:
    `<ellipse cx="30" cy="34" rx="20" ry="16" fill="#ff9800" transform="rotate(-25 30 34)"/><ellipse cx="70" cy="34" rx="20" ry="16" fill="#ff9800" transform="rotate(25 70 34)"/>`
    + `<ellipse cx="34" cy="66" rx="14" ry="12" fill="#ffc107" transform="rotate(25 34 66)"/><ellipse cx="66" cy="66" rx="14" ry="12" fill="#ffc107" transform="rotate(-25 66 66)"/>`
    + `<rect x="46.5" y="28" width="7" height="50" rx="3.5" fill="#4e342e"/><path d="M48 30 Q40 12 34 12 M52 30 Q60 12 66 12" stroke="#4e342e" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="28" cy="32" r="5" fill="#fff3e0"/><circle cx="72" cy="32" r="5" fill="#fff3e0"/>` },

  // Things that carry us: wheels, a sail, wings and fins.
  { id: "riksha", bn: "রিকশা", family: "ride", art:
    `<circle cx="70" cy="72" r="16" fill="none" stroke="#37474f" stroke-width="4"/><path d="M70 56 V88 M54 72 H86 M59 61 L81 83 M81 61 L59 83" stroke="#90a4ae" stroke-width="1.5"/><circle cx="20" cy="80" r="10" fill="none" stroke="#37474f" stroke-width="4"/>`
    + `<path d="M20 80 L34 56 L58 62 L70 72" stroke="#1e88e5" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M34 56 L30 46 M26 46 H36" stroke="#37474f" stroke-width="4" stroke-linecap="round"/><path d="M28 50 h8" stroke="#37474f" stroke-width="5"/>`
    + `<rect x="54" y="52" width="32" height="10" rx="3" fill="#2e7d32"/><path d="M52 54 Q50 18 86 22 L90 54 Z" fill="#e53935"/><path d="M58 30 Q72 22 86 26" stroke="#ffd54f" stroke-width="4" fill="none"/><circle cx="70" cy="40" r="5" fill="#ffd54f"/><circle cx="58" cy="44" r="3" fill="#4fc3f7"/><circle cx="82" cy="44" r="3" fill="#4fc3f7"/>` },
  { id: "saikel", bn: "সাইকেল", family: "ride", art:
    `<circle cx="22" cy="68" r="17" fill="none" stroke="#37474f" stroke-width="4"/><circle cx="78" cy="68" r="17" fill="none" stroke="#37474f" stroke-width="4"/>`
    + `<path d="M22 68 L42 68 L64 42 L36 42 Z M42 68 L34 34 M64 42 L78 68" stroke="#1e88e5" stroke-width="4.5" fill="none" stroke-linejoin="round"/>`
    + `<path d="M28 33 H42" stroke="#37474f" stroke-width="6" stroke-linecap="round"/><path d="M64 42 L62 30 Q62 26 70 26" stroke="#37474f" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="42" cy="68" r="4" fill="#37474f"/>` },
  { id: "nouka", bn: "নৌকা", family: "ride", art:
    `<line x1="52" y1="70" x2="52" y2="8" stroke="#6d4c41" stroke-width="3.5"/><path d="M55 10 L86 54 L55 58 Z" fill="#f4d35e"/><path d="M30 68 Q44 50 58 68 Z" fill="#d7a86e"/>`
    + `<path d="M4 62 Q12 64 18 68 L82 68 Q88 64 96 62 Q86 86 50 88 Q14 86 4 62 Z" fill="#8d5524"/><path d="M14 74 H86" stroke="#c48a4a" stroke-width="2.5"/>` },
  { id: "urojahaj", bn: "উড়োজাহাজ", family: "ride", art:
    `<path d="M44 46 L28 10 L38 10 L62 46 Z" fill="#64b5f6"/><path d="M44 54 L28 90 L38 90 L62 54 Z" fill="#64b5f6"/><path d="M14 47 L6 32 L13 32 L24 47 Z M14 53 L6 68 L13 68 L24 53 Z" fill="#64b5f6"/>`
    + `<path d="M8 44 L80 44 Q96 50 80 56 L8 56 Z" fill="#e3f2fd" stroke="#90caf9" stroke-width="2"/><circle cx="40" cy="50" r="2" fill="#1e88e5"/><circle cx="50" cy="50" r="2" fill="#1e88e5"/><circle cx="60" cy="50" r="2" fill="#1e88e5"/><path d="M82 46 Q88 50 82 54" fill="#1e88e5"/>` },
  { id: "rocket", bn: "রকেট", family: "ride", art:
    `<path d="M42 72 Q50 98 58 72 Z" fill="#ff9800"/><path d="M36 50 L22 74 L36 70 Z M64 50 L78 74 L64 70 Z" fill="#ef5350"/>`
    + `<path d="M50 4 Q68 22 65 72 L35 72 Q32 22 50 4 Z" fill="#eceff1" stroke="#b0bec5" stroke-width="2"/><path d="M50 4 Q60 12 63 24 L37 24 Q40 12 50 4 Z" fill="#ef5350"/><circle cx="50" cy="42" r="8" fill="#4fc3f7" stroke="#90a4ae" stroke-width="3"/>` },

  // Things at home.
  { id: "cup", bn: "কাপ-পিরিচ", family: "home", art:
    `<ellipse cx="50" cy="80" rx="36" ry="7" fill="#e1f5fe" stroke="#81d4fa" stroke-width="2"/><circle cx="76" cy="56" r="9" fill="none" stroke="#29b6f6" stroke-width="6"/>`
    + `<path d="M24 40 L76 40 L70 72 Q50 80 30 72 Z" fill="#4fc3f7"/><path d="M28 50 H72" stroke="#fff" stroke-width="3"/><circle cx="50" cy="61" r="4" fill="#fff"/>` },
  { id: "hariken", bn: "হারিকেন", family: "home", art:
    `<path d="M30 40 Q50 0 70 40" stroke="#5d4037" stroke-width="4" fill="none"/><rect x="34" y="34" width="32" height="8" rx="3" fill="#c62828"/>`
    + `<ellipse cx="50" cy="60" rx="17" ry="19" fill="#fff3c4" stroke="#c62828" stroke-width="2.5"/><path d="M50 50 Q57 60 50 68 Q43 60 50 50 Z" fill="#ff9800"/><path d="M33 42 V78 M67 42 V78" stroke="#c62828" stroke-width="3"/>`
    + `<rect x="28" y="76" width="44" height="14" rx="5" fill="#c62828"/>` },
  { id: "ketli", bn: "কেটলি", family: "home", art:
    `<path d="M32 46 Q50 16 68 46" stroke="#6d4c41" stroke-width="5" fill="none"/><path d="M30 66 L8 46 L13 43 L34 56 Z" fill="#ff7043"/>`
    + `<path d="M26 84 Q20 48 50 44 Q80 48 74 84 Z" fill="#ff8a65"/><ellipse cx="50" cy="45" rx="14" ry="4" fill="#f4511e"/><circle cx="50" cy="39" r="4" fill="#f4511e"/><path d="M30 70 H70" stroke="#ffccbc" stroke-width="3"/>` },
  { id: "chabi", bn: "চাবি", family: "home", art:
    `<circle cx="26" cy="50" r="15" fill="none" stroke="#fbc02d" stroke-width="9"/><rect x="40" y="45" width="50" height="10" rx="3" fill="#fbc02d"/>`
    + `<rect x="70" y="53" width="7" height="14" rx="2" fill="#fbc02d"/><rect x="81" y="53" width="7" height="10" rx="2" fill="#fbc02d"/><circle cx="26" cy="50" r="3" fill="#f9a825"/>` },
  { id: "choshma", bn: "চশমা", family: "home", art:
    `<path d="M8 52 L4 30 M92 52 L96 30" stroke="#6d4c41" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="56" r="16" fill="#e1f5fe" stroke="#6d4c41" stroke-width="6"/>`
    + `<circle cx="71" cy="56" r="16" fill="#e1f5fe" stroke="#6d4c41" stroke-width="6"/><path d="M45 54 Q50 46 55 54" stroke="#6d4c41" stroke-width="5" fill="none"/><path d="M22 50 l6 -5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` },

  // Outside: an umbrella, a kite, a palm, a pineapple and a water lily.
  { id: "chhata", bn: "ছাতা", family: "outside", art:
    `<path d="M50 46 L50 82 Q50 92 41 92 Q34 92 34 85" stroke="#4e342e" stroke-width="4.5" fill="none" stroke-linecap="round"/><line x1="50" y1="12" x2="50" y2="4" stroke="#4e342e" stroke-width="3"/>`
    + `<path d="M6 50 Q50 0 94 50 Q83 41 72 50 Q61 41 50 50 Q39 41 28 50 Q17 41 6 50 Z" fill="#7e57c2"/><path d="M50 12 Q36 26 28 50 M50 12 Q64 26 72 50" stroke="#b39ddb" stroke-width="2" fill="none"/>` },
  { id: "ghuri", bn: "ঘুড়ি", family: "outside", art:
    `<path d="M50 72 Q40 80 50 86 Q60 92 52 98" stroke="#5d4037" stroke-width="2.5" fill="none"/><path d="M42 80 L50 84 L42 88 Z M58 88 L50 92 L58 96 Z" fill="#26a69a"/>`
    + `<path d="M50 6 L80 38 L50 74 L20 38 Z" fill="#ff7043"/><path d="M50 6 L50 74 M20 38 L80 38" stroke="#ffe0b2" stroke-width="2.5"/><path d="M50 6 L80 38 L50 38 Z" fill="#ffca28"/>` },
  { id: "talgach", bn: "তালগাছ", family: "outside", art:
    `<path d="M50 94 Q46 64 50 34" stroke="#795548" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M44 94 H56" stroke="#795548" stroke-width="6" stroke-linecap="round"/>`
    + `<g fill="#2e7d32"><path d="M50 30 L18 14 L24 24 L12 26 L46 34 Z"/><path d="M50 30 L82 14 L76 24 L88 26 L54 34 Z"/><path d="M50 30 L30 4 L42 12 L44 2 Z"/><path d="M50 30 L70 4 L58 12 L56 2 Z"/>`
    + `<path d="M48 32 L14 44 L26 46 L20 54 Z"/><path d="M52 32 L86 44 L74 46 L80 54 Z"/></g><circle cx="46" cy="36" r="4" fill="#3e2723"/><circle cx="54" cy="37" r="4" fill="#3e2723"/>` },
  { id: "anaros", bn: "আনারস", family: "outside", art:
    `<path d="M50 42 L40 10 L48 26 L50 2 L54 26 L62 8 L58 42 Z" fill="#43a047"/><path d="M46 42 L28 22 L48 36 Z M54 42 L72 22 L52 36 Z" fill="#2e7d32"/>`
    + `<ellipse cx="50" cy="66" rx="20" ry="26" fill="#f9a825"/><path d="M36 50 L64 82 M32 64 L54 90 M46 42 L68 68 M64 50 L36 82 M68 64 L46 90 M54 42 L32 68" stroke="#e08a00" stroke-width="2"/>` },
  { id: "shapla", bn: "শাপলা", family: "outside", art:
    `<ellipse cx="50" cy="80" rx="44" ry="10" fill="#43a047"/><path d="M50 80 L62 70" stroke="#2e7d32" stroke-width="2"/>`
    + `<g fill="#f48fb1"><path d="M50 74 Q20 66 14 46 Q38 50 50 74 Z"/><path d="M50 74 Q80 66 86 46 Q62 50 50 74 Z"/><path d="M50 74 Q26 52 32 26 Q48 44 50 74 Z"/><path d="M50 74 Q74 52 68 26 Q52 44 50 74 Z"/></g>`
    + `<path d="M50 74 Q40 44 50 16 Q60 44 50 74 Z" fill="#f8bbd0"/><circle cx="50" cy="62" r="5" fill="#ffd54f"/>` },
];

export const FAMILIES: readonly Family[] = ["animal", "wing", "ride", "home", "outside"];
export const shapeOf = (id: string) => SHAPES.find(shape => shape.id === id);

/** A whole SVG document for one object (for the card, drawn from a data: URL, so nothing is fetched). */
export const svgDocument = (art: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">${art}</svg>`;
