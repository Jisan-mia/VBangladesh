import type { ToolShare } from "../../shared/share-types";
import { bn, parseShareHash, possessive, scoreOf, shareHash, tallyIds } from "./lib/pitha";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const score = shared ? `${bn(scoreOf(shared.set, shared.answers))}টা` : "কয়টা";
    return {
      title: `${shared?.name || "এক বন্ধু"} ১০টা পিঠার ${score} চিনেছে। তুমি কয়টা চিনবে?`,
      description: `${shared?.name ? possessive(shared.name) : "বন্ধুর"} সাথে একই ১০টা শীতের পিঠা: ভাপা, চিতই, পাটিসাপটা, নকশি… ছবি দেখে নাম বলো, অন্য এলাকার নামও জেনে নাও। ফ্রি।`,
    };
  },
  tally: tallyIds,
};
