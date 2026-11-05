// Words, the challenge link (new and old) and the lines around a ride. Server-safe: share.ts (and so the share API)
// imports this file, so it uses game-core, bangla and plain strings only.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { levelOf, isLevel, LEVEL_COUNT, MODES, DEFAULT_MODE } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A ride on the 12 routes: the road's seed and route, the mode, the points and what made them, an optional first name. */
export type Ride = { kind: "ride"; seed: number; level: number; mode: number; score: number; meters: number; delivered: number; picked: number; bumps: number; name: string };
/** A link from the old endless game (`s t m c l n`): its road no longer exists, so its number is the friend's old claim. */
export type OldRide = { kind: "old"; seed: number; route: number; score: number; meters: number; letters: number; name: string };
export type Shared = Ride | OldRide;

const whole = (value: string | null | undefined, digitsMax = 6) => value != null && new RegExp(`^\\d{1,${digitsMax}}$`).test(value) ? Number(value) : -1;

// ---- the new link: v=2 ----
export const MAX_PICKED = 40;
export const maxMeters = (level: number) => Math.ceil(levelOf(level).meters * 1.4);
export const maxBells = (meters: number) => Math.floor(meters / 4) + 4;
export const MIN_METERS = 15;
const NEW_MAX_SCORE = 20000;

function parseRide(hash: string): Ride | null {
  const challenge = readChallenge(hash, { maxTarget: NEW_MAX_SCORE, extraKeys: ["v", "l", "m", "d", "c", "b", "k"] });
  if (!challenge || challenge.extra.v !== "2") return null;
  const rawLevel = challenge.extra.l ?? "", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || !isLevel(level)) return null;
  const meters = whole(challenge.extra.m, 5), delivered = whole(challenge.extra.d, 2), picked = whole(challenge.extra.c, 2), bumps = whole(challenge.extra.b, 1);
  if (meters < MIN_METERS || meters > maxMeters(level)) return null;
  if (delivered < 0 || delivered > levelOf(level).houses || picked < 0 || picked > MAX_PICKED || bumps < 0 || bumps > MODES[0].limit) return null;
  const k = challenge.extra.k, mode = k === undefined ? DEFAULT_MODE : MODES.findIndex(item => item.id === k && item.id !== "n");
  if (mode < 0) return null;
  if (bumps > MODES[mode].limit) return null;
  const rest = challenge.target - meters - 10 * delivered - 5 * picked;
  if (rest < 0 || rest % 5 !== 0 || rest / 5 > maxBells(meters)) return null;
  return { kind: "ride", seed: challenge.seed, level, mode, score: challenge.target, meters, delivered, picked, bumps, name: challenge.name };
}
export const bellsOf = (ride: Pick<Ride, "score" | "meters" | "delivered" | "picked">) => (ride.score - ride.meters - 10 * ride.delivered - 5 * ride.picked) / 5;

// ---- the old link: kept exactly as the old game read it ----
export const OLD_MAX_METERS = 20000;
const oldMaxLetters = (meters: number) => Math.floor(meters / 10) + 2;
const oldMaxBells = (meters: number) => Math.floor(meters / 5) + 4;
const OLD_MAX_SCORE = OLD_MAX_METERS + 10 * oldMaxLetters(OLD_MAX_METERS) + 5 * oldMaxBells(OLD_MAX_METERS);

function parseOld(hash: string): OldRide | null {
  const challenge = readChallenge(hash, { maxTarget: OLD_MAX_SCORE, extraKeys: ["m", "c", "l", "v"] });
  if (!challenge || challenge.extra.v !== undefined) return null;
  const meters = whole(challenge.extra.m), letters = whole(challenge.extra.c);
  if (meters < 20 || meters > OLD_MAX_METERS || letters < 0 || letters > oldMaxLetters(meters)) return null;
  const rest = challenge.target - meters - 10 * letters;
  if (rest < 0 || rest % 5 !== 0 || rest / 5 > oldMaxBells(meters)) return null;
  const rawRoute = challenge.extra.l ?? "1", route = Number(rawRoute);
  if (!/^[1-9]\d?$/.test(rawRoute) || route > 10) return null;
  return { kind: "old", seed: challenge.seed, route, score: challenge.target, meters, letters, name: challenge.name };
}

export const parseShared = (hash: string): Shared | null => parseRide(hash) ?? parseOld(hash);

/** The link's #hash, in a fixed order. An old ride keeps its old form, so a re-shared old link stays the same link. */
export function sharedHash(shared: Shared) {
  if (shared.kind === "old") return challengeHash({ seed: shared.seed, target: shared.score, name: shared.name, extra: { m: shared.meters, c: shared.letters, ...(shared.route > 1 && { l: shared.route }) } });
  return challengeHash({
    seed: shared.seed, target: shared.score, name: shared.name,
    extra: { v: 2, l: shared.level, m: shared.meters, d: shared.delivered, c: shared.picked, b: shared.bumps, ...(shared.mode !== DEFAULT_MODE && { k: MODES[shared.mode].id }) },
  });
}

/** The route a link opens: its own, or for an old link the matching new one (old route r → ⌈1.2 r⌉). */
export const levelOfShared = (shared: Shared) => shared.kind === "ride" ? shared.level : Math.min(LEVEL_COUNT, Math.ceil((shared.route * LEVEL_COUNT) / 10));

// ---- words ----
/** "লেভেল ৩ · ঠেলাগাড়ির সারি" */
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${levelOf(level).name}`;

export function previewTitle(shared: Shared) {
  if (shared.kind === "old" || !shared.delivered) return shared.name ? `${shared.name} ${bn(shared.score)} করেছে। তুমি পারবে?` : `পিয়নের সাইকেলে ${bn(shared.score)}! তুমি পারবে?`;
  return shared.name ? `${shared.name} ${bn(shared.delivered)}টা চিঠি পৌঁছে ${bn(shared.score)} করেছে। তুমি পারবে?` : `পিয়নের সাইকেলে ${bn(shared.delivered)}টা চিঠি, ${bn(shared.score)}! তুমি পারবে?`;
}

export const caption = (ride: Ride) =>
  `পিয়নের সাইকেলে ${levelOf(ride.level).place} পর্যন্ত ${bn(ride.delivered)}টা চিঠি পৌঁছালাম, স্কোর ${bn(ride.score)}। একই রাস্তায় তুমি কত পারো?`;

/** "৩৮৭ মিটার · ১২টা চিঠি · ৪ বার ক্রিং", for an old friend's card. */
export function oldDetail(shared: OldRide) {
  const bells = (shared.score - shared.meters - 10 * shared.letters) / 5;
  return `${bn(shared.meters)} মিটার · ${bn(shared.letters)}টা চিঠি${bells > 0 ? ` · ${bn(bells)} বার ক্রিং` : ""}`;
}
/** "৫টায় ৪টা চিঠি · ২৪০ মিটার · ২ বার ক্রিং" */
export function rideDetail(ride: Ride) {
  const bells = bellsOf(ride);
  return `${bn(levelOf(ride.level).houses)}টায় ${bn(ride.delivered)}টা চিঠি · ${bn(ride.meters)} মিটার${bells > 0 ? ` · ${bn(bells)} বার ক্রিং` : ""}`;
}

/** The card's one human line under the envelope. */
export function summaryLine(ride: Pick<Ride, "level" | "delivered" | "meters">, stars: number) {
  const place = levelOf(ride.level).place;
  if (stars >= 3) return `${place} পৌঁছে সব চিঠি বিলি। কারও হাত খালি থাকেনি!`;
  if (stars) return `${place} পর্যন্ত ${bn(ride.delivered)}টা চিঠি পৌঁছে গেল।`;
  return `${possessive(place)} পথে ${bn(ride.meters)} মিটার, ${bn(ride.delivered)}টা চিঠি বিলি।`;
}

export function friendLine(shared: Shared) {
  const who = shared.name || "তোমার বন্ধু";
  return shared.kind === "old" ? `${who} পুরোনো রাস্তায় ${bn(shared.score)} করেছিল।` : `${who} ${bn(shared.score)} করেছে, ${bn(shared.delivered)}টা চিঠি পৌঁছে।`;
}
export function friendNote(shared: Shared) {
  const whose = shared.name ? possessive(shared.name) : "বন্ধুর";
  return shared.kind === "old" ? "সেই রাস্তা এখন বদলে গেছে, তাই এবার নতুন রুটে খেলো।" : `একই রাস্তা, এবার তোমার পালা। স্কোরটা ${whose} নিজের ফোনের।`;
}

/** After a friend's link, on the same road: exact and kind, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  if (mine > theirs) return `${whose} চেয়ে ${bn(mine - theirs)} বেশি!`;
  if (mine === theirs) return `${who} আর তুমি একদম সমান সমান!`;
  if (theirs - mine <= Math.max(30, theirs * 0.12)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${who} এবার ${bn(theirs - mine)} এগিয়ে। একই রাস্তায় আরেকবার?`;
}

/** The compare line for a finished ride: only against a friend's ride on that very road (same seed and route), never an old link. */
export function versusLine(mine: Pick<Ride, "seed" | "level" | "score">, friend: Shared | null) {
  if (!friend || friend.kind !== "ride" || friend.seed !== mine.seed || friend.level !== mine.level) return "";
  return compareLine(mine.score, friend.score, friend.name);
}

/** What stopped the bike, said kindly. Nobody gets hurt: the bike wobbles and the letters fly. */
export function bumpLine(kind: number) {
  switch (kind) {
    case 0: return "ছপাৎ! কাদায় চাকা পিছলে গেল।";
    case 1: case 6: return "ভ্যা! ছাগলটা একচুলও সরল না।";
    case 2: return "ঠক! ঠেলাগাড়ির সাথে ঠোকাঠুকি।";
    case 3: case 7: return "হাম্বা! গরুটা নড়ার নামই নিল না।";
    case 5: return "প্যাঁ-পোঁ! ভ্যানের সাথে মুখোমুখি।";
    case 8: return "ঘেউ! কুকুরটা চাকার সামনে এসে পড়ল।";
    default: return "উফ, একটুর জন্য!";
  }
}

export type Outcome = { level: number; finished: boolean; meters: number; full: number; delivered: number; houses: number; goal: number; lost: number; hitKind: number };

/** The end screen's main line under the stats. */
export function resultLine(outcome: Outcome) {
  if (!outcome.finished) return bumpLine(outcome.hitKind);
  const left = outcome.houses - outcome.delivered;
  return left === 0 ? "কারও চিঠি বাকি থাকল না।" : `${bn(left)}টা গেটে এবার হাত খালি রইল।`;
}

/** The exact near miss: metres to the place, letters to the next star, and what the bumps cost. */
export function nearMiss(outcome: Outcome) {
  const place = levelOf(outcome.level).place;
  if (!outcome.finished) return `আর ${bn(Math.max(1, outcome.full - outcome.meters))} মিটার গেলেই ${place}।`;
  const lostLine = outcome.lost > 0 ? ` ধাক্কায় ${bn(outcome.lost)}টা চিঠি উড়ে গেছে।` : "";
  if (outcome.delivered < outcome.goal) return `আর ${bn(outcome.goal - outcome.delivered)}টা চিঠি হলেই আরেকটা তারা।${lostLine}`;
  if (outcome.delivered < outcome.houses) return `আর ${bn(outcome.houses - outcome.delivered)}টা চিঠি হলেই তিন তারা।${lostLine}`;
  return "";
}

/** The end screen's heading. */
export function headingFor(outcome: Outcome, firstFinale: boolean) {
  if (!outcome.finished) return "সাইকেল থামল";
  const spec = levelOf(outcome.level);
  if (firstFinale && spec.boss) return `${spec.boss.name} পার!`;
  if (outcome.delivered >= outcome.houses) return "সব চিঠি পৌঁছেছে!";
  return `${spec.place} পৌঁছে গেলে`;
}
