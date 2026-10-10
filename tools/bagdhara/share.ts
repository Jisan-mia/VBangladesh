import type { ToolShare } from "../../shared/share-types";
import { bn, parseShareHash, possessive, questionsOf, scoreOf, shareHash, tallyIds } from "./lib/idioms";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  // Spoiler-free: the score and two idioms the friend will meet, never a meaning or which ones were right.
  preview(state) {
    const shared = parseShareHash(state);
    const score = shared ? `${bn(scoreOf(shared.set, shared.answers))}টা` : "কয়টা";
    const [first, second] = questionsOf(shared?.set ?? "s1");
    return {
      title: `${shared?.name || "এক বন্ধু"} ১০টা বাগধারার ${score} পেরেছে — তুমি কয়টা পারবে?`,
      description: `${shared?.name ? possessive(shared.name) : "বন্ধুর"} সাথে একই ১০টা বাগধারা: ${first.idiom}, ${second.idiom}… মজার ছবি দেখে আসল মানে বলো। ফ্রি।`,
    };
  },
  tally: tallyIds,
};
