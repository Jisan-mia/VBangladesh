import type { ToolShare } from "../../shared/share-types";
import { bnDate, parseShareHash, possessive, riddleById, shareHash, tallyIds } from "./lib/dhadha";

const RESULT = { 1: "প্রথম চেষ্টায় পেরেছে", 2: "দ্বিতীয় চেষ্টায় পেরেছে", 0: "আটকে গেছে" } as const;

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  // Spoiler-free: the riddle and how the friend did, never the answer.
  preview(state) {
    const shared = parseShareHash(state);
    const riddle = shared ? riddleById(shared.id) : undefined;
    const day = shared ? `${possessive(bnDate(shared.date))} ধাঁধা` : "আজকের ধাঁধা";
    const title = shared?.tries != null
      ? `${shared.name || "এক বন্ধু"} ${day} ${RESULT[shared.tries]} — তুমি পারবে?`
      : `${day}: উত্তরটা জানো?`;
    return {
      title,
      description: `${riddle ? `“${riddle.lines.join(" ")}” ` : ""}নানি-দাদির পুরোনো শোলক। তিনটা উত্তরের একটাই ঠিক, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।`,
    };
  },
  tally: tallyIds,
};
