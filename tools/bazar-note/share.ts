import type { ToolShare } from "../../shared/share-types";
import { bn, fordoHash, fordoTitle, parseFordo } from "./lib/fordo";

export const share: ToolShare = {
  normalize(state) {
    const fordo = parseFordo(state);
    return fordo ? fordoHash(fordo) : null;
  },
  preview(state) {
    const fordo = parseFordo(state);
    return {
      title: fordo ? `${fordoTitle(fordo)}, ${bn(fordo.items.length)}টা জিনিস` : "বাজারের ফর্দ",
      description: "আসার সময় এগুলো এনো 🙂 লিংক খুলে কেনা জিনিসে টিক দাও, কী বাকি থাকল দেখে নাও।",
    };
  },
};
