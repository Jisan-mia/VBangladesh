import type { ToolShare } from "../../shared/share-types";
import { bn, countOf, packById, parseShareHash, possessive, shareHash, tallyIds } from "./lib/paper";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const pack = packById(shared?.pack ?? "relatives");
    const who = shared?.name ? possessive(shared.name) : "এক বন্ধুর";
    return {
      title: `${pack.title}: ${who} ${shared ? `${bn(countOf(shared.mask))}টা` : "কয়টা"} কমন পড়েছে — তোমার কয়টা?`,
      description: `${pack.squares.slice(0, 3).map(square => square.replace(/[“”]/g, "")).join(", ")}… ১৬টা ঘরের কয়টা তোমার কমন পড়ে? দাগিয়ে দেখো, এক লাইন মিললেই বিঙ্গো! ফ্রি, অ্যাকাউন্ট লাগে না।`,
    };
  },
  tally: tallyIds,
};
