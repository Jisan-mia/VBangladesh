// Milestones kept on this phone and printed on the card. The ids are the old game's, so saved badges and old links still read.
export type Badge = "t10" | "t20" | "t30" | "palm" | "combo5" | "still";
export const BADGES: Record<Badge, string> = {
  t10: "১০ সেকেন্ড", t20: "২০ সেকেন্ড", t30: "৩০ সেকেন্ড",
  palm: "হাতে তোলা", combo5: "টানা ৫ টোকা", still: "হাত না লাগিয়ে ১০ সেকেন্ড",
};
export const BADGE_IDS = Object.keys(BADGES) as Badge[];
/** The palm bonus in tenths of a second. */
export const BONUS = 50;

/** Milestones from one spin: time (in tenths, without the bonus), the palm trick, the best run of good taps, and taps used. */
export function badgesOf(spun: number, palm: boolean, bestCombo: number, nudges: number): Badge[] {
  const won: Badge[] = [];
  if (spun >= 100) won.push("t10");
  if (spun >= 200) won.push("t20");
  if (spun >= 300) won.push("t30");
  if (palm) won.push("palm");
  if (bestCombo >= 5) won.push("combo5");
  if (spun >= 100 && nudges === 0) won.push("still");
  return won;
}

/** Badges kept on this phone (fixed ids only; anything else is dropped). */
export function readBadges(raw: string | null): Badge[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? BADGE_IDS.filter(id => list.includes(id)) : [];
  } catch { return []; }
}
