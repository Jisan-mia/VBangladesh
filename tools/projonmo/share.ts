import type { ToolShare } from "../../shared/share-types";
import { entriesOf, parseShareHash, shareHash, split, splitText, tallyIds } from "./lib/words";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  // Spoiler-free: the rescored split and three words the friend will meet, never a meaning or which ones were right.
  preview(state) {
    const shared = parseShareHash(state);
    const words = entriesOf(shared?.set ?? "s1").slice(0, 3).map(entry => entry.word).join(", ");
    return {
      title: shared ? `${shared.name || "এক বন্ধু"} ${splitText(split(shared.set, shared.answers))} — তুমি কোন দলে?` : "জেন-জি না আব্বু-আম্মু? — তুমি কোন দলে?",
      description: `প্রজন্মের অভিধানের একই ১০টা শব্দ: ${words}… জেন-জির শব্দ আর আব্বু-আম্মুর কথা, কোনটা তুমি বেশি বোঝো? ফ্রি।`,
    };
  },
  tally: tallyIds,
};
