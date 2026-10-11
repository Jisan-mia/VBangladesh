import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 24;
/** Below this many votes a percentage is noise ("১০০% আর্জেন্টিনা" after one vote), same bar as the flagship. */
export const SPLIT_MIN = 20;

// Generic national-flag colours only: no federation crests, kits or sponsor marks.
// `glow` is the team colour tuned to read on the dark dusk sky of the card.
export const teams = [
  { id: "arg", label: "আর্জেন্টিনা", glow: "#8fc6f2", chip: "#74acdf", ink: "#13406b" },
  { id: "bra", label: "ব্রাজিল", glow: "#ffe033", chip: "#ffdf00", ink: "#00602a" },
  { id: "esp", label: "স্পেন", glow: "#ffc61a", chip: "#c60b1e", ink: "#ffffff" },
  { id: "ger", label: "জার্মানি", glow: "#ffce00", chip: "#1b1b1b", ink: "#ffce00" },
  { id: "por", label: "পর্তুগাল", glow: "#ff8a70", chip: "#046a38", ink: "#ffffff" },
  { id: "fra", label: "ফ্রান্স", glow: "#9dbaff", chip: "#002654", ink: "#ffffff" },
  { id: "eng", label: "ইংল্যান্ড", glow: "#ff8e95", chip: "#ffffff", ink: "#ce1124" },
] as const;

/** World Cup years someone could have started supporting from (men's tournament, every four years). */
export const years = [1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026] as const;

// Fixed ids only, so the area split can never carry free text. "bidesh" is for the diaspora.
export const divisions = [
  { id: "dhaka", label: "ঢাকা" },
  { id: "chattogram", label: "চট্টগ্রাম" },
  { id: "rajshahi", label: "রাজশাহী" },
  { id: "khulna", label: "খুলনা" },
  { id: "barishal", label: "বরিশাল" },
  { id: "sylhet", label: "সিলেট" },
  { id: "rangpur", label: "রংপুর" },
  { id: "mymensingh", label: "ময়মনসিংহ" },
  { id: "bidesh", label: "বিদেশে" },
] as const;

export type Team = (typeof teams)[number];
export type TeamId = Team["id"];
export type Year = (typeof years)[number];
export type DivisionId = (typeof divisions)[number]["id"];
/** The আসল ফ্যান test: which of the 3 shown options was tapped, per question (so the score is always recomputed). */
export type Pick = 0 | 1 | 2;
export type Roof = { team: TeamId; year: Year | null; name: string; quiz?: Pick[] };
/** A card: your roof, and (when you came from a friend's link) the house next door. `seed` orders the fan test; quiz keys only travel with it. */
export type Shared = { own: Roof; neighbour: Roof | null; seed?: number };
export type Tally = { total: number; counts: Record<string, number> };
export type Split = { arg: number; bra: number; other: number; total: number };

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

export const isTeamId = (id: unknown): id is TeamId => teams.some(team => team.id === id);
export const isDivisionId = (id: unknown): id is DivisionId => divisions.some(division => division.id === id);
const toYear = (value: string | null): Year | null => years.find(year => String(year) === value) ?? null;
export const teamOf = (id: TeamId) => teams.find(team => team.id === id)!;

/** Only the two big teams have a fan test. */
export const FAN_ROUNDS = 8;
export const isFanTeam = (id: TeamId): id is "arg" | "bra" => id === "arg" || id === "bra";
const toSeed = (value: string | null) => value && /^\d{1,4}$/.test(value) ? Number(value) : null;

export function cleanName(name: string) {
  // NFC so one name has one spelling; strip control and bidi-override characters so a link can't scramble the card.
  const flat = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

function readRoof(params: URLSearchParams, prefix: "" | "f", seeded: boolean): Roof | null {
  const team = params.get(prefix + "t");
  if (!isTeamId(team)) return null;
  const roof: Roof = { team, year: toYear(params.get(prefix + "y")), name: cleanName(params.get(prefix + "n") ?? "") };
  const quiz = params.get(prefix + "q") ?? "";
  if (seeded && isFanTeam(team) && new RegExp(`^[012]{${FAN_ROUNDS}}$`).test(quiz)) roof.quiz = [...quiz].map(Number) as Pick[];
  return roof;
}

function writeRoof(params: URLSearchParams, roof: Roof, prefix: "" | "f", seeded: boolean) {
  params.set(prefix + "t", roof.team);
  if (roof.year) params.set(prefix + "y", String(roof.year));
  const name = cleanName(roof.name);
  if (name) params.set(prefix + "n", name);
  if (seeded && roof.quiz?.length === FAN_ROUNDS && isFanTeam(roof.team)) params.set(prefix + "q", roof.quiz.join(""));
}

// Fan-test keys (q, fq, s) are optional and appended, so every pre-test link (t, y, n, ft, fy, fn) reads exactly as before.
export function shareHash({ own, neighbour, seed }: Shared) {
  const params = new URLSearchParams();
  const seeded = seed !== undefined;
  writeRoof(params, own, "", seeded);
  if (neighbour) writeRoof(params, neighbour, "f", seeded);
  if (seeded && (params.has("q") || params.has("fq"))) params.set("s", String(seed));
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 2000) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const seed = toSeed(params.get("s"));
  const own = readRoof(params, "", seed !== null);
  if (!own) return null;
  const neighbour = readRoof(params, "f", seed !== null);
  return seed !== null && (own.quiz || neighbour?.quiz) ? { own, neighbour, seed } : { own, neighbour };
}

/** The warm line under the headline, from how long they've flown this flag. */
export function supportLine(year: Year | null, now = new Date().getFullYear()) {
  if (!year) return "যত দিন ছাদ আছে, তত দিন এই পতাকা।";
  const span = Math.max(now - year, 0);
  if (year <= 1990) return `${bn(span)} বছর, একবারও দল বদলাইনি।`;
  if (year <= 1998) return `${bn(span)} বছর ধরে একই ছাদ, একই পতাকা।`;
  if (year <= 2014) return "বড় হয়েছি এই পতাকার নিচে।";
  if (year <= 2018) return `${bn(span)} বছরে টানটা শুধু বেড়েছে।`;
  return "নতুন প্রেম, পুরো জোর।";
}

/** "রাফির ছাদে ২০০২ থেকে আর্জেন্টিনা": spoken by the person who made the card. */
export function roofParts(roof: Roof): [string, string] {
  const whose = roof.name ? `${possessive(roof.name)} ছাদে` : "আমার ছাদে";
  const team = teamOf(roof.team).label;
  return [whose, roof.year ? `${bn(roof.year)} থেকে ${team}` : `${possessive(team)} পতাকা`];
}
export const roofTitle = (roof: Roof) => roofParts(roof).join(" ");

export const laneLine = (own: Roof, neighbour: Roof) => own.team === neighbour.team ? "একই গলিতে, একই পতাকা। এবার জোর দ্বিগুণ।" : "একই গলিতে দুই পতাকা। খেলা শেষে চা কিন্তু একসাথেই।";

/** "রাফি আর্জেন্টিনা, মিম ব্রাজিল": the neighbour (who sent the link) first, then you. */
export function laneTitle(own: Roof, neighbour: Roof) {
  const me = own.name || "আমি";
  const them = neighbour.name || "পাশের বাসা";
  if (own.team === neighbour.team) return `${them} আর ${me}, দুই ছাদেই ${teamOf(own.team).label}`;
  return `${them} ${teamOf(neighbour.team).label}, ${me} ${teamOf(own.team).label}`;
}

export function previewTitle({ own, neighbour }: Shared) {
  if (neighbour) return `${laneTitle(own, neighbour)}, একই গলিতে। তোমার ছাদে কোনটা?`;
  const whose = own.name ? possessive(own.name) : "এক বন্ধুর";
  return `${whose} ছাদে ${possessive(teamOf(own.team).label)} পতাকা। তোমার ছাদে কোনটা?`;
}

export function caption({ own, neighbour }: Shared) {
  if (neighbour) return `${laneTitle(own, neighbour)}, একই গলিতে! তোমার ছাদে কোন পতাকা?`;
  return `${roofTitle(own)}। ${supportLine(own.year)} তোমার ছাদে কোন পতাকা?`;
}

// Tally ids: a team id for the national count, and "<division>-<team>" for the area count.
export const tallyIds = [...teams.map(team => team.id), ...divisions.flatMap(division => teams.map(team => `${division.id}-${team.id}`))];

export function voteItems(team: TeamId, division: DivisionId | null) {
  return division ? [team, `${division}-${team}`] : [team];
}

function toSplit(count: (team: TeamId) => number): Split | null {
  const total = teams.reduce((sum, team) => sum + count(team.id), 0);
  if (total < SPLIT_MIN) return null;
  const arg = Math.round((count("arg") / total) * 100);
  const bra = Math.round((count("bra") / total) * 100);
  return { arg, bra, other: Math.max(100 - arg - bra, 0), total };
}

/** Share of votes per side, or null below the minimum sample. */
export const nationalSplit = (tally: Tally | null) => tally ? toSplit(team => tally.counts[team] ?? 0) : null;
export const divisionSplit = (tally: Tally | null, division: DivisionId) => tally ? toSplit(team => tally.counts[`${division}-${team}`] ?? 0) : null;

export const splitText = (split: Split) => `আর্জেন্টিনা ${bn(split.arg)}% · ব্রাজিল ${bn(split.bra)}% · অন্য ${bn(split.other)}%`;

export { possessive };
