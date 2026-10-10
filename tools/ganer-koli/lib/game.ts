export const MAX_NAME = 20;
export const MAX_ROUNDS = 99;
export const ROUND_SECONDS = 30;
export const defaultTeams: [string, string] = ["দল ক", "দল খ"];

/**
 * Letters a Bangla song can start with, weighted by how many well-known songs open with them (3 = easy, 1 = hard but doable).
 * Left out on purpose: ঙ ঞ ং ঃ ৎ ণ ঢ ঋ ঐ ঔ ঈ ঊ and the nukta letters (ড় ঢ় য়), which almost no song starts with.
 */
export const letterWeights: Readonly<Record<string, number>> = {
  "আ": 3, "এ": 3, "ও": 3, "ক": 3, "চ": 3, "জ": 3, "ত": 3, "দ": 3, "ন": 3, "প": 3, "ব": 3, "ভ": 3, "ম": 3, "য": 2, "র": 3, "শ": 3, "স": 3, "হ": 3,
  "অ": 2, "ই": 2, "উ": 2, "খ": 2, "গ": 2, "ছ": 2, "ধ": 2, "ফ": 2, "ল": 2, "ঘ": 1, "ঝ": 1, "ট": 1, "ঠ": 1, "ড": 1, "থ": 1,
};
export const letters = Object.keys(letterWeights);

export const occasions = [
  { id: "aj", label: "আজকের" },
  { id: "eid", label: "ঈদের রাতের" },
  { id: "puja", label: "পূজার ছুটির" },
  { id: "sheet", label: "শীতের রাতের" },
  { id: "load", label: "লোডশেডিংয়ের" },
  { id: "picnic", label: "পিকনিকের" },
] as const;
export type OccasionId = (typeof occasions)[number]["id"];
export const occasionLabel = (id: OccasionId) => occasions.find(item => item.id === id)!.label;

/** One drawn letter and who sang it: team 0 or 1, or null when nobody could. */
export type Round = { letter: string; team: 0 | 1 | null };
export type Game = { teams: [string, string]; rounds: Round[]; occasion: OccasionId };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

/** Picks a weighted letter, skipping the last few so the same chit doesn't come out twice in a row. `random` is in [0, 1). */
export function drawLetter(recent: readonly string[], random = Math.random) {
  const skip = new Set(recent.slice(-4));
  const pool = letters.filter(letter => !skip.has(letter));
  const total = pool.reduce((sum, letter) => sum + letterWeights[letter], 0);
  let pick = random() * total;
  for (const letter of pool) { pick -= letterWeights[letter]; if (pick < 0) return letter; }
  return pool[pool.length - 1];
}

export function scores(rounds: readonly Round[]): [number, number] {
  return [rounds.filter(round => round.team === 0).length, rounds.filter(round => round.team === 1).length];
}

/** Rounds alternate between the teams, so the next letter goes to whoever didn't get the last one. */
export const turnOf = (rounds: readonly Round[]) => (rounds.length % 2) as 0 | 1;

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards matches; strip control and bidi characters so a link can't scramble the card, and commas, which separate the two names in the link.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩,]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

export const teamName = (teams: readonly string[], index: 0 | 1) => cleanName(teams[index]) || defaultTeams[index];

// Rounds travel as letter + who sang: "ক1ম2আ0" (1 = first team, 2 = second, 0 = nobody).
const teamCode = { 0: "1", 1: "2" } as const;
export function shareHash({ teams, rounds, occasion }: Game) {
  const params = new URLSearchParams({ t: `${teamName(teams, 0)},${teamName(teams, 1)}`, r: rounds.slice(-MAX_ROUNDS).map(round => round.letter + (round.team === null ? "0" : teamCode[round.team])).join("") });
  if (occasion !== "aj") params.set("o", occasion);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Game | null {
  if (hash.length > 3000) return null;
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const names = params.get("t")?.split(",");
  const code = params.get("r")?.normalize("NFC");
  if (!names || names.length !== 2 || code === undefined) return null;
  const chars = [...code];
  if (chars.length % 2 || chars.length / 2 > MAX_ROUNDS) return null;
  const rounds: Round[] = [];
  for (let index = 0; index < chars.length; index += 2) {
    const letter = chars[index], who = chars[index + 1];
    if (!Object.hasOwn(letterWeights, letter) || !["0", "1", "2"].includes(who)) return null;
    rounds.push({ letter, team: who === "0" ? null : who === "1" ? 0 : 1 });
  }
  const occasionId = params.get("o") ?? "aj";
  const occasion = occasions.find(item => item.id === occasionId)?.id;
  if (!occasion) return null;
  return { teams: [teamName(names, 0), teamName(names, 1)], rounds, occasion };
}

export function gameTitle(game: Game) {
  return `${occasionLabel(game.occasion)} গানের কলি`;
}

export function scoreLine(game: Game) {
  const [a, b] = scores(game.rounds);
  return `${teamName(game.teams, 0)} ${bn(a)} — ${teamName(game.teams, 1)} ${bn(b)}`;
}

export function leader(game: Game): 0 | 1 | null {
  const [a, b] = scores(game.rounds);
  return a === b ? null : a > b ? 0 : 1;
}

/** The human line on the card, chosen from how the game went. */
export function humanLine(game: Game) {
  const [a, b] = scores(game.rounds);
  const lead = leader(game);
  if (a + b === 0) return game.rounds.length ? "অক্ষর কঠিন পড়েছে, গলা এখনো গরম হচ্ছে।" : "প্রথম অক্ষরটা তোলো, গলা খোলো!";
  if (lead === null) return "সমান সমান — শেষ গানটা কে গাইবে?";
  const winner = teamName(game.teams, lead), loser = teamName(game.teams, lead === 0 ? 1 : 0);
  const gap = Math.abs(a - b);
  if (gap === 1) return "এক গানের ব্যবধান — আবার খেলা হবে!";
  if (gap <= 3) return `অল্পের জন্য। পরের বার ${loser} শোধ নেবে।`;
  return `আজ ${winner} যেন গানের ঝুলি নিয়েই এসেছিল।`;
}

export function caption(game: Game) {
  return `${gameTitle(game)}: ${scoreLine(game)}। তোমাদের বাসায় কে জেতে? অক্ষর তোলো, খেলো:`;
}

export function previewTitle(game: Game) {
  const lead = leader(game);
  const [a, b] = scores(game.rounds);
  const tally = `${bn(Math.max(a, b))}—${bn(Math.min(a, b))}`;
  return lead === null
    ? `${gameTitle(game)}: ${scoreLine(game)}, সমান সমান! তোমাদের বাসায় কে জেতে?`
    : `${gameTitle(game)}তে জিতল ${teamName(game.teams, lead)} (${tally}) — তোমাদের বাসায় কে জেতে?`;
}
