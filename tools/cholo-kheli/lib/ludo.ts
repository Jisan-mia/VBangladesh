import { bn, cleanText } from "./invite";

export const MAX_PLAYER_NAME = 16;
const MAX_WINS = 99;
export const MAX_HISTORY = 400;
/** A reload brings the scoreboard back this long after the last tap; after that the page opens on its usual first screen. */
export const RESUME_FOR = 3 * 24 * 60 * 60 * 1000;

/** Board colours in a link's player order. Append-only. */
export const PIECES = [
  { label: "লাল", color: "#d8372f" },
  { label: "সবুজ", color: "#23934a" },
  { label: "হলুদ", color: "#eeb31b" },
  { label: "নীল", color: "#214bb7" },
] as const;
/** Which holiday's champion: the family picks, nothing is assumed. Append-only ids. */
export const OCCASIONS = [{ id: "eid", label: "ঈদের" }, { id: "puja", label: "পূজার" }, { id: "chhuti", label: "ছুটির" }] as const;
export type Occasion = (typeof OCCASIONS)[number]["id"];

/** What a champion link carries: games won per player (its length is the player count), optional names, the holiday. */
export type Ludo = { wins: number[]; names: string[]; occasion: Occasion };
/** The running session kept on this phone: the winner of each game in order, so a wrong tap can be taken back. */
export type Session = { players: number; names: string[]; history: number[]; occasion: Occasion; at: number };

export const emptySession = (players: number): Session => ({ players, names: PIECES.map(() => ""), history: [], occasion: "eid", at: 0 });
const isOccasion = (value: unknown): value is Occasion => OCCASIONS.some(item => item.id === value);

export const playerName = (names: readonly string[], index: number) => cleanText(names[index] ?? "", MAX_PLAYER_NAME) || `${PIECES[index].label} গুটি`;

/** Wins per player. Games won by a player who is no longer at the board stay in the history, hidden, so lowering the count never loses them. */
export function tally(history: readonly number[], players: number) {
  const wins = Array<number>(players).fill(0);
  for (const winner of history) if (winner < players) wins[winner]++;
  return wins;
}

export function champions(wins: readonly number[]) {
  const top = Math.max(...wins);
  return top > 0 ? wins.flatMap((count, index) => count === top ? [index] : []) : [];
}

const listNames = (names: string[]) => names.length > 1 ? `${names.slice(0, -1).join(", ")} আর ${names[names.length - 1]}` : names[0] ?? "";
export const championKicker = (ludo: Ludo) => `${OCCASIONS.find(item => item.id === ludo.occasion)!.label} লুডু চ্যাম্পিয়ন`;
export const championNames = (ludo: Ludo) => listNames(champions(ludo.wins).map(index => playerName(ludo.names, index)));

/** "৫ দানে ৩ জয়", or "৬ দানে ৩টা করে জয়" when the top is shared. */
export function championStats(ludo: Ludo) {
  const total = ludo.wins.reduce((sum, count) => sum + count, 0);
  return `${bn(total)} দানে ${bn(Math.max(...ludo.wins))}${champions(ludo.wins).length > 1 ? "টা করে" : ""} জয়`;
}

/** "ঈদের লুডু চ্যাম্পিয়ন: রাফি · ৫ দানে ৩ জয়" — the only name in it is the champion's. */
export const championTitle = (ludo: Ludo) => `${championKicker(ludo)}: ${championNames(ludo)} · ${championStats(ludo)}`;
export const ludoCaption = (ludo: Ludo) => `${championKicker(ludo)}: ${championNames(ludo)}! ${championStats(ludo)}। তোমাদের বাড়িতে লুডুতে কে জেতে?`;

/** The warm line on the card, picked from how the games went. */
export function ludoLine(wins: readonly number[]) {
  const [top, second = 0] = [...wins].sort((a, b) => b - a);
  const total = wins.reduce((sum, count) => sum + count, 0);
  if (total === 1) return "মাত্র এক দান হলো, আসল লড়াই তো এখনো বাকি!";
  if (top === second) return "সমানে সমান! পরের দানেই ফয়সালা হবে।";
  if (top === total) return "একটা দানও কাউকে ছাড়েনি!";
  if (top - second === 1) return "মাত্র এক দানের ব্যবধান, পরের বার কিন্তু ছাড় নেই!";
  return "এবার ছক্কা যেন তার কথাই শুনছিল!";
}

/** Tally strokes with a slash through every five, as one path on a 110×26 grid; the page and the card draw the same marks.
 * shortcut: shows at most 15 marks, the number beside them tells the rest; widen the grid if families really play more. */
export function tallyPath(count: number) {
  let path = "";
  for (let index = 0; index < Math.min(count, 15); index++) {
    const x = 4 + Math.floor(index / 5) * 38, place = index % 5;
    path += place < 4 ? `M${x + place * 7} 2v22` : `M${x - 3} 20 ${x + 24} 6`;
  }
  return path;
}

/** How wide tallyPath(count) draws on its grid, so the marks can sit centred. */
export function tallyWidth(count: number) {
  const marks = Math.min(count, 15);
  if (!marks) return 8;
  const place = (marks - 1) % 5;
  return 8 + Math.floor((marks - 1) / 5) * 38 + (place < 4 ? place * 7 : 24);
}

/** "#lw=3.1.1&lo=eid&n=রাফি&n=&n=মিম" — kept apart from invitation links, which always start with g=. */
export function ludoHash(ludo: Ludo) {
  const params = new URLSearchParams({ lw: ludo.wins.map(count => Math.min(MAX_WINS, count)).join("."), lo: ludo.occasion });
  const names = ludo.wins.map((_, index) => cleanText(ludo.names[index] ?? "", MAX_PLAYER_NAME));
  while (names.length && !names[names.length - 1]) names.pop();
  for (const name of names) params.append("n", name);
  return "#" + params.toString();
}

export function parseLudo(hash: string): Ludo | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const parts = (params.get("lw") ?? "").split(".");
  if (parts.length < 2 || parts.length > PIECES.length || !parts.every(part => /^\d{1,2}$/.test(part))) return null;
  const wins = parts.map(Number);
  if (!wins.some(Boolean)) return null;
  const names = params.getAll("n");
  const occasion = params.get("lo");
  return { wins, names: wins.map((_, index) => cleanText(names[index] ?? "", MAX_PLAYER_NAME)), occasion: isOccasion(occasion) ? occasion : "eid" };
}

/** Reads the saved session back from localStorage, keeping only what makes sense. */
export function parseSession(raw: string | null): Session | null {
  let data;
  try { data = JSON.parse(raw ?? ""); } catch { return null; }
  if (!data || !Number.isInteger(data.players) || data.players < 2 || data.players > PIECES.length || !Array.isArray(data.history)) return null;
  return {
    players: data.players,
    names: PIECES.map((_, index) => typeof data.names?.[index] === "string" ? cleanText(data.names[index], MAX_PLAYER_NAME) : ""),
    history: data.history.filter((winner: unknown) => Number.isInteger(winner) && (winner as number) >= 0 && (winner as number) < PIECES.length).slice(-MAX_HISTORY),
    occasion: isOccasion(data.occasion) ? data.occasion : "eid",
    at: Number.isFinite(data.at) ? data.at : 0,
  };
}
