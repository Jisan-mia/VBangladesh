import { possessive } from "../../../shared/bangla";
import { players, type Era, type Line, type Player } from "./players";

export { players, possessive, type Line, type Player };
export const SLOTS = 11;
export const MAX_NAME_LENGTH = 20;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const lineLabels: Record<Line, string> = { gk: "গোলকিপার", df: "ডিফেন্ডার", mf: "মিডফিল্ডার", fw: "ফরোয়ার্ড" };
export const eraLabels: Record<Era, string> = { "60": "পঞ্চাশ-ষাটের দশক", "80": "সত্তর-আশির দশক", "00": "নব্বই-দুই হাজারের দশক", "20": "২০১০-এর পর" };

type Spot = { line: Line; x: number; y: number };
const gk: Spot = { line: "gk", x: 50, y: 89 };
const row = (line: Line, spots: Array<[number, number]>) => spots.map(([x, y]) => ({ line, x, y }));

/** x, y are % of the pitch with our goal at the bottom. Slots run goalkeeper, then each line from left to right; links rely on that order. */
export const formations = {
  "433": { label: "৪-৩-৩", spots: [gk, ...row("df", [[13, 71], [38, 73], [62, 73], [87, 71]]), ...row("mf", [[24, 50], [50, 53], [76, 50]]), ...row("fw", [[17, 27], [50, 22], [83, 27]])] },
  "442": { label: "৪-৪-২", spots: [gk, ...row("df", [[13, 71], [38, 73], [62, 73], [87, 71]]), ...row("mf", [[13, 47], [38, 50], [62, 50], [87, 47]]), ...row("fw", [[33, 23], [67, 23]])] },
  "352": { label: "৩-৫-২", spots: [gk, ...row("df", [[22, 72], [50, 74], [78, 72]]), ...row("mf", [[10, 45], [30, 52], [50, 47], [70, 52], [90, 45]]), ...row("fw", [[33, 23], [67, 23]])] },
} satisfies Record<string, { label: string; spots: Spot[] }>;
export type FormationId = keyof typeof formations;
// Integer-like keys would sort 352 first; the chips read in this order.
export const formationIds: FormationId[] = ["433", "442", "352"];
const isFormation = (id: string): id is FormationId => formationIds.includes(id as FormationId);

export type Team = { formation: FormationId; players: string[]; captain: string; name: string };

/** Four eras, two Argentines and two Brazilians, so the first board already reads like someone's real XI. */
export const defaultTeam: Team = {
  formation: "433",
  players: ["yashin", "maldini", "beckenbauer", "baresi", "cafu", "xavi", "zidane", "maradona", "cristiano", "pele", "messi"],
  captain: "beckenbauer",
  name: "",
};

const byId = new Map(players.map(player => [player.id, player]));
export const playerById = (id: string) => byId.get(id);
const get = (id: string) => byId.get(id)!;
export const canPlay = (player: Player, line: Line) => player.line === line || player.alt === line;
export const spotOf = (team: Team, slot: number) => formations[team.formation].spots[slot];

const eraOrder: Era[] = ["60", "80", "00", "20"];
/** The short list for one slot: players who play that line, oldest era first, and within an era their main position first. */
export function choicesFor(line: Line) {
  return players.filter(player => canPlay(player, line))
    .sort((a, b) => eraOrder.indexOf(a.era) - eraOrder.indexOf(b.era) || Number(a.line !== line) - Number(b.line !== line));
}

/** Puts a player in a slot. If they're already on the board, the two swap places; the armband follows the player, or passes to whoever replaces the captain. */
export function placePlayer(team: Team, slot: number, id: string): Team {
  const player = byId.get(id);
  const spot = formations[team.formation].spots[slot];
  if (!player || !spot || !canPlay(player, spot.line)) throw new RangeError("এই খেলোয়াড় এই জায়গায় খেলেন না।");
  const existing = team.players.indexOf(id);
  if (existing === slot) return team;
  const outgoing = team.players[slot];
  const next = [...team.players];
  if (existing >= 0) next[existing] = outgoing;
  next[slot] = id;
  return { ...team, players: next, captain: team.captain === outgoing && existing < 0 ? id : team.captain };
}

const depth: Record<Line, number> = { gk: -1, df: 0, mf: 1, fw: 2 };

/** Re-lays the same eleven for another shape: when a line shrinks, whoever leans that way (Beckenbauer back, a winger forward) moves. */
export function changeFormation(team: Team, to: FormationId): Team {
  if (to === team.formation) return team;
  const from = formations[team.formation].spots;
  const outfield = team.players.slice(1).map((id, index) => {
    const spot = from[index + 1], player = get(id), here = depth[spot.line];
    const lean = 0.3 * (depth[player.line] - here) + 0.2 * (depth[player.alt ?? player.line] - here);
    return { id, key: here + lean, x: spot.x };
  }).sort((a, b) => a.key - b.key || a.x - b.x);
  const next = [team.players[0]];
  for (const line of ["df", "mf", "fw"] as const) {
    const count = formations[to].spots.filter(spot => spot.line === line).length;
    next.push(...outfield.splice(0, count).sort((a, b) => a.x - b.x).map(entry => entry.id));
  }
  return { ...team, formation: to, players: next };
}

// Control and direction-override characters out, so a shared link can't scramble the card. ZWJ/ZWNJ stay for Bangla shaping.
const UNSAFE = /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;
export function cleanName(text: string) {
  const flat = text.normalize("NFC").replace(UNSAFE, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

/** "#f=433&p=yashin,maldini,…&c=2&n=রাফি" — ids are plain ASCII, so only the name needs encoding. */
export function shareHash(team: Team) {
  const name = cleanName(team.name);
  return `#f=${team.formation}&p=${team.players.join(",")}&c=${Math.max(0, team.players.indexOf(team.captain))}${name ? `&n=${encodeURIComponent(name)}` : ""}`;
}

/** Eleven different listed players, a goalkeeper in goal and nowhere else, or null. A bad captain or name falls back quietly. */
export function parseShareHash(hash: string): Team | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const formation = params.get("f") ?? "";
  const raw = params.get("p") ?? "";
  if (!isFormation(formation) || raw.length > 200) return null;
  const ids = raw.split(",");
  if (ids.length !== SLOTS || new Set(ids).size !== SLOTS) return null;
  const roster = ids.map(id => byId.get(id));
  if (roster.some((player, slot) => !player || (player.line === "gk") !== (slot === 0))) return null;
  const captain = params.get("c") ?? "";
  return { formation, players: ids, captain: ids[/^(10|\d)$/.test(captain) ? Number(captain) : 0], name: cleanName(params.get("n") ?? "") };
}

export function teamTitle(team: Pick<Team, "name">) {
  const name = cleanName(team.name);
  return `${name ? possessive(name) : "আমার"} স্বপ্নের একাদশ`;
}
export const captainOf = (team: Team) => get(team.captain);

/** The human line, chosen by the mix of eras (and the Argentina–Brazil split every Bangladeshi para knows). */
export function teamLine(ids: readonly string[]) {
  const picked = ids.map(get);
  const count = (test: (player: Player) => boolean) => picked.filter(test).length;
  const argentina = count(player => player.nation === "আর্জেন্টিনা"), brazil = count(player => player.nation === "ব্রাজিল");
  if (argentina >= 4 && brazil >= 4) return "আকাশি-সাদা আর হলুদ-সবুজ এক দলে, পাড়ায় আজ ঝগড়া নেই!";
  if (argentina >= 6) return "এই দল মাঠে নামলে পাড়ার সব ছাদে আকাশি-সাদা পতাকা।";
  if (brazil >= 6) return "এই দলের পায়ে সাম্বার তাল, ছাদে হলুদ-সবুজ পতাকা।";
  const era = (id: Era) => count(player => player.era === id);
  if (era("60") >= 5) return "সাদাকালো যুগের দল, তবু খেলাটা পুরো রঙিন।";
  if (era("80") >= 5) return "সত্তর-আশির দল, ভিসিআরে রেকর্ড করে রাখার মতো খেলা।";
  if (era("00") >= 5) return "নব্বইয়ের দল, বিশ্বকাপ মানেই পাড়ার টিভির সামনে ভিড়।";
  if (era("20") >= 5) return "এই যুগের তারকারা, খেলা থাকলে রাত জাগতেই হবে।";
  if ((["60", "80", "00", "20"] as const).every(id => era(id) > 0)) return "চার যুগের তারকা এক মাঠে, এমন দল শুধু স্বপ্নেই নামে।";
  return "যুগ মিলিয়ে, নিজের চোখে সেরা এগারো জন।";
}

/** Players on both boards, wherever they stand. */
export const commonIds = (own: readonly string[], friend: Team | null) => friend ? own.filter(id => friend.players.includes(id)) : [];
export const matchLine = (own: readonly string[], friend: Team | null) => friend ? `দুজনের মিল ${bn(commonIds(own, friend).length)}/${bn(SLOTS)}` : "";

/** The XI read out the way it's written on a team sheet: goalkeeper first, forwards last. */
export const lineupText = (team: Team) => team.players.map(id => get(id).short).join(", ");

export function caption(team: Team, friend: Team | null) {
  const match = friend ? `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে ${matchLine(team.players, friend)}! ` : "";
  return `${match}${teamTitle(team)} (${formations[team.formation].label}): ${lineupText(team)}। অধিনায়ক: ${captainOf(team).short}। তোমার একাদশে কে কে?`;
}

export function previewTitle(team: Team) {
  return `${team.name ? possessive(team.name) : "এক বন্ধুর"} স্বপ্নের একাদশ · অধিনায়ক: ${captainOf(team).short}। তোমার একাদশে কে কে?`;
}

export function previewDescription(team: Team) {
  return `${team.players.slice(-3).map(id => get(id).short).join(", ")}… পেলে থেকে মেসি, ${bn(players.length)} জন কিংবদন্তি থেকে নিজের একাদশ সাজাও, বন্ধুর দলের সাথে মিলিয়ে দেখো।`;
}

/** Anonymous tally ids: one per listed player. Names are never counted. */
export const tallyIds: string[] = players.map(player => player.id);

/** Everyone's XI in a 4-3-3: the most-picked players at each main position. */
export function crowdXI(counts: Readonly<Record<string, number>>) {
  const top = (line: Line, size: number) => players.filter(player => player.line === line).map(player => ({ id: player.id, count: counts[player.id] ?? 0 }))
    .sort((a, b) => b.count - a.count).slice(0, size).map(entry => entry.id);
  return [["gk", top("gk", 1)], ["df", top("df", 4)], ["mf", top("mf", 3)], ["fw", top("fw", 3)]] as const;
}
