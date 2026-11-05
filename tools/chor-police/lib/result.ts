// The scoreboard link, the lines on the card and the link preview. Server-safe (share.ts imports it).
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { BABU, CHOR, DAKAT, DEFAULT_POINTS, MAX_POINTS, MAX_ROUNDS, PLAYERS, POLICE, bn, cleanPlayer, deals, nameOf, occasionLabel, occasions, standings, type Game, type Role } from "./game";

/**
 * `s` seed (the chit shuffle), `t` the winner's total, `g` one digit per round (1 = thief caught), `p` the four names,
 * `v` the house points when they differ from the usual, `o` the occasion. The scoreboard is rebuilt from these,
 * so `t` must match it. Roles are never written in the link.
 */
export function gameHash(game: Game) {
  const extra: Record<string, string> = { g: game.caught.map(caught => caught ? "1" : "0").join("") };
  const names = game.names.map(cleanPlayer);
  if (names.some(Boolean)) extra.p = names.join(",");
  if (game.points.some((value, role) => value !== DEFAULT_POINTS[role])) extra.v = game.points.join("-");
  if (game.occasion !== "aj") extra.o = game.occasion;
  return challengeHash({ seed: game.seed, target: standings(game)[0].total, extra });
}

/** Reads a saved game or a shared link. `minRounds` is 1 for links (an empty scoreboard isn't worth a link). */
export function parseGame(hash: string, minRounds = 1): Game | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_ROUNDS * MAX_POINTS, extraKeys: ["g", "p", "v", "o"] });
  if (!challenge) return null;
  const { g = "", p, v, o = "aj" } = challenge.extra;
  if (!/^[01]*$/.test(g) || g.length < minRounds || g.length > MAX_ROUNDS) return null;
  if (v !== undefined && !/^\d{1,4}(-\d{1,4}){3}$/.test(v)) return null;
  const occasion = occasions.find(item => item.id === o)?.id;
  if (!occasion) return null;
  const names = p === undefined ? ["", "", "", ""] : p.split(",");
  if (names.length !== PLAYERS) return null;
  const game: Game = { seed: challenge.seed, names: names.map(cleanPlayer), points: v ? v.split("-").map(Number) : [...DEFAULT_POINTS], caught: [...g].map(digit => digit === "1"), occasion };
  return standings(game)[0].total === challenge.target ? game : null;
}

export const gameTitle = (game: Game) => `${occasionLabel(game.occasion)} চোর-পুলিশ`;
export const scoreLine = (game: Game, separator = " · ") => standings(game).map(row => `${row.name} ${bn(row.total)}`).join(separator);
const isTie = (game: Game) => { const [first, second] = standings(game); return first.total === second.total; };

/** The human line on the card, from how the evening went. */
export function humanLine(game: Game) {
  const rounds = game.caught.length, [first, second] = standings(game), caught = game.caught.filter(Boolean).length;
  const gap = first.total - second.total, top = Math.max(...game.points);
  if (gap === 0) return "সমান সমান! শেষ দানটা কে জিতবে?";
  if (rounds === 1) return "মাত্র এক দান! আসল মজা তো সামনে।";
  if (gap <= top) return "এক দানের ব্যবধান!";
  if (rounds >= 3 && caught === rounds) return "একটা চোরও পালাতে পারেনি!";
  if (rounds >= 3 && caught === 0) return "চোরেরা আজ খুব চালাক, একবারও ধরা পড়েনি!";
  if (gap >= top * 3) return `আজ ভালো চিরকুটগুলো সব ${possessive(first.name)} হাতেই উঠেছে!`;
  return "জমজমাট খেলা! পরের দানে কে বাবু হয়, দেখা যাক।";
}

export function winnerLine(game: Game) {
  const [first, second] = standings(game);
  return first.total === second.total ? `${first.name} আর ${second.name} সমান, ${bn(first.total)} করে!` : `জিতেছে ${first.name}, ${bn(first.total)} পয়েন্ট!`;
}

/** What the reveal screen says after the police points at someone. */
export function roundNews(game: Game, roles: readonly Role[], caught: boolean) {
  const chor = nameOf(game.names, roles.indexOf(CHOR)), dakat = nameOf(game.names, roles.indexOf(DAKAT));
  return caught
    ? { title: `ঠিক ধরেছে! চোর ছিল ${chor}।`, sub: "পুলিশ পেল পুরো নম্বর, চোরের ঘরে শূন্য।" }
    : { title: `ফসকে গেল! ${dakat} তো ডাকাত, চোর ছিল ${chor}।`, sub: `ভুলের দাম: পুলিশের ${bn(game.points[POLICE])} এবার চোরের ঘরে।` };
}

/** Under the final scores when no record fell: the record, and the exact gap when one more round could have beaten it. */
export function recordLine(game: Game, best: number) {
  const gap = best - standings(game)[0].total + 1;
  // gap 1 is a tie with the record, which on a first evening is this evening itself.
  return gap > 1 && gap <= Math.max(...game.points)
    ? `এই ফোনের রেকর্ড ${bn(best)}। আর ${bn(gap)} পয়েন্ট হলেই নতুন রেকর্ড হতো।`
    : `এই ফোনে এক খেলায় সবচেয়ে বেশি: ${bn(best)}`;
}

export function caption(game: Game) {
  return `${gameTitle(game)}: ${scoreLine(game, ", ")}। তোমাদের বাসায় কে চোর হয়? চিরকুট তোলো, খেলো:`;
}

export function previewTitle(game: Game) {
  const [first, second] = standings(game);
  return isTie(game)
    ? `${gameTitle(game)}: ${first.name} আর ${second.name} সমান সমান! তোমাদের বাসায় কে চোর হয়?`
    : `${gameTitle(game)}ে জিতল ${first.name} (${bn(first.total)})। তোমাদের বাসায় কে চোর হয়?`;
}

export function friendBanner(game: Game) {
  const [first, second] = standings(game);
  return isTie(game) ? `${gameTitle(game)}: ${first.name} আর ${second.name} সমান সমান!` : `${gameTitle(game)}ে জিতেছে ${first.name}, ${bn(first.total)}!`;
}

/** A kind comparison with the family who sent the link, only when both played the same number of rounds and points. */
export function versusLine(mine: Game, theirs: Game) {
  if (mine.caught.length !== theirs.caught.length || mine.points.join() !== theirs.points.join()) return "";
  const me = standings(mine)[0], them = standings(theirs)[0], diff = Math.abs(me.total - them.total);
  if (me.total > them.total) return `তোমাদের ${me.name} ওদের ${possessive(them.name)} চেয়েও ${bn(diff)} বেশি!`;
  if (diff === 0) return `ওদের ${them.name} আর তোমাদের ${me.name}, দুজনেই ${bn(me.total)}!`;
  if (diff <= Math.max(...mine.points)) return `আর একটু হলেই! ওদের ${them.name} মাত্র ${bn(diff)} এগিয়ে।`;
  return `ওদের ${them.name} এবার এগিয়ে, ${bn(diff)} বেশি। আরেকবার হোক!`;
}

export type EveningStats = { rounds: number; caught: number; escaped: number; babu: { name: string; times: number } | null; police: { name: string; caught: number } | null };
/** Real numbers for the end screen, rebuilt from the deal and the guesses: how often the thief was caught, who was বাবু most, the best police. */
export function eveningStats(game: Game): EveningStats {
  const all = deals(game.seed, game.caught.length), babu = [0, 0, 0, 0], catches = [0, 0, 0, 0];
  game.caught.forEach((caught, round) => {
    babu[all[round].indexOf(BABU)]++;
    if (caught) catches[all[round].indexOf(POLICE)]++;
  });
  const top = (counts: number[]) => {
    const most = Math.max(...counts);
    // A tie names nobody: "সবচেয়ে বেশি" should mean one person.
    return most > 0 && counts.filter(count => count === most).length === 1 ? counts.indexOf(most) : -1;
  };
  const babuSeat = top(babu), policeSeat = top(catches), caught = game.caught.filter(Boolean).length;
  return {
    rounds: game.caught.length, caught, escaped: game.caught.length - caught,
    babu: babuSeat >= 0 && babu[babuSeat] > 1 ? { name: nameOf(game.names, babuSeat), times: babu[babuSeat] } : null,
    police: policeSeat >= 0 ? { name: nameOf(game.names, policeSeat), caught: catches[policeSeat] } : null,
  };
}
