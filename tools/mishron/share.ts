import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/game";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "পানি + চাল = ভাত। নানির জাদুর হাঁড়িতে দুটো জিনিস মেশাও, নতুন কিছু বানাও: পান্তা, পিঠা, বৈশাখী মেলা… ফ্রি বাংলা খেলা।",
    };
  },
  // Item ids only, never names: "how many people made this?"
  tally: tallyIds,
};
