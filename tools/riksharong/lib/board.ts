// The rickshaw back-board: what the person picks, and how it travels in a share link.
export const MAX_LINE = 28;
export const MAX_NAME = 20;
export const MAX_AREA = 20;

export const motifs = [
  { id: "peacock", label: "ময়ূর" },
  { id: "swans", label: "রাজহাঁস" },
  { id: "flower", label: "ফুল" },
  { id: "boat", label: "নদী-নৌকা" },
] as const;

export const regions = [
  { id: "sky", label: "আকাশ" },
  { id: "border", label: "পাড়" },
  { id: "leaf", label: "লতাপাতা" },
  { id: "motif", label: "মাঝের ছবি" },
  { id: "banner", label: "লেখার পটি" },
] as const;

// Enamel-paint colours. Share links store indexes into this list: only append, never reorder.
export const swatches = [
  { hex: "#e0262f", label: "লাল" },
  { hex: "#ec4a8f", label: "গোলাপি" },
  { hex: "#f77f00", label: "কমলা" },
  { hex: "#ffc61a", label: "হলুদ" },
  { hex: "#1f9a4e", label: "সবুজ" },
  { hex: "#86c440", label: "টিয়া" },
  { hex: "#0f9aa8", label: "ফিরোজা" },
  { hex: "#9fdcf5", label: "আকাশি" },
  { hex: "#1d4fbf", label: "নীল" },
  { hex: "#16306e", label: "রাতের নীল" },
  { hex: "#6a2c91", label: "বেগুনি" },
  { hex: "#fff1d6", label: "ঘিয়ে" },
  { hex: "#ffd3e4", label: "হালকা গোলাপি" },
] as const;

/** Ready colour sets, in region order: sky, border, leaf, motif, banner. */
export const palettes = [
  { label: "ঢাকাই লাল", colors: [3, 0, 4, 1, 8] },
  { label: "ফিরোজা", colors: [11, 6, 4, 2, 10] },
  { label: "গোলাপি", colors: [7, 1, 4, 3, 10] },
  { label: "রাতের নীল", colors: [9, 3, 5, 1, 0] },
  { label: "কমলা", colors: [12, 2, 4, 8, 0] },
] as const;

export const lineIdeas = ["ভালো থাকুক সবাই", "মায়ের দোয়া", "ঢাকা আমার শহর", "জীবন একটাই"] as const;

export type MotifId = (typeof motifs)[number]["id"];
export type RegionId = (typeof regions)[number]["id"];
export type Board = { motif: MotifId; colors: number[]; line: string; name: string; area: string };

export const defaultBoard: Board = { motif: "peacock", colors: [...palettes[0].colors], line: "ভালো থাকুক সবাই", name: "", area: "" };

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

const isMotif = (id: string): id is MotifId => motifs.some(motif => motif.id === id);
const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });

/** NFC, no control or bidi-override characters, single spaces, capped by whole letters so a conjunct is never cut in half. */
export function cleanText(text: string, max: number) {
  const plain = text.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(segmenter.segment(plain), part => part.segment).slice(0, max).join("").trim();
}

export const colorOf = (board: Board, region: RegionId) => swatches[board.colors[regions.findIndex(item => item.id === region)]]?.hex ?? swatches[0].hex;

export function paint(board: Board, region: RegionId, swatch: number): Board {
  if (!swatches[swatch]) throw new RangeError("এই রংটা তালিকায় নেই।");
  const colors = [...board.colors];
  colors[regions.findIndex(item => item.id === region)] = swatch;
  return { ...board, colors };
}

export function shareHash(board: Board) {
  const params = new URLSearchParams({ b: board.motif, c: board.colors.map(index => index.toString(36)).join("") });
  const line = cleanText(board.line, MAX_LINE), name = cleanText(board.name, MAX_NAME), area = cleanText(board.area, MAX_AREA);
  if (line) params.set("t", line);
  if (name) params.set("n", name);
  if (area) params.set("a", area);
  return "#" + params.toString();
}

/** A shared board, or null for anything that isn't one (in-page anchors like #result included). */
export function parseShareHash(hash: string): Board | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const motif = params.get("b") ?? "";
  if (!isMotif(motif)) return null;
  const code = params.get("c") ?? "";
  const colors = [...code].map(char => parseInt(char, 36));
  const valid = colors.length === regions.length && colors.every(index => swatches[index]);
  return {
    motif,
    colors: valid ? colors : [...defaultBoard.colors],
    line: cleanText(params.get("t") ?? "", MAX_LINE),
    name: cleanText(params.get("n") ?? "", MAX_NAME),
    area: cleanText(params.get("a") ?? "", MAX_AREA),
  };
}

/** A stable four-digit plate number that belongs to the name and area, so a shared card shows the same plate. */
export function plateNumber(board: Pick<Board, "name" | "area">) {
  let hash = 2166136261;
  for (const char of `${board.name}|${board.area}`) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619);
  return bn(1000 + ((hash >>> 0) % 9000));
}

export const plateOwner = (board: Pick<Board, "name" | "area">) => [board.name, board.area].filter(Boolean).join(" · ") || "ঢাকা";

const lines: Record<MotifId, string> = {
  peacock: "পেখম মেলে ময়ূর চলবে গুলিস্তান থেকে মিরপুর।",
  swans: "দুই রাজহাঁস ঘুরে বেড়াবে পুরান ঢাকার গলিতে।",
  flower: "ধুলোর শহরে চাকার ওপর এক বাগান ফুল।",
  boat: "শহরের রাস্তায় চলবে এক টুকরো গ্রাম।",
};
export const boardLine = (board: Pick<Board, "motif">) => lines[board.motif];

// Bangla possessive: vowel endings take "র" (রাফির), consonants "এর" (জাহিদের), Latin names "-এর".
export function possessive(name: string) {
  if (!/[ঀ-৿]$/.test(name)) return name + "-এর";
  if (name.endsWith("ৎ")) return name.slice(0, -1) + "তের";
  return /[অ-ঔা-ৌৗ]$/.test(name) ? name + "র" : name + "ের";
}
