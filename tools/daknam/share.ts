import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/daknam";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "বাড়ির বড় না ছোট, চঞ্চল না শান্ত, ভোরের পাখি না রাতজাগা: তিনটা চাপে দেখো ছোটবেলায় তোমার ডাকনাম কী হতো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  tally: tallyIds,
};
