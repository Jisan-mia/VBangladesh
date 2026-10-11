import type { ToolShare } from "../../shared/share-types";
import { coverTitle, parseShareHash, pickLabel, prompts, stateOf, MOMENT, WORD } from "./lib/barshiki";

export const share: ToolShare = {
  normalize(state) {
    const cover = parseShareHash(state);
    return cover ? stateOf(cover) : null;
  },
  preview(state) {
    const cover = parseShareHash(state);
    if (!cover) return { title: "এক বন্ধুর বছরটা এক প্রচ্ছদে। তোমারটা কেমন গেল?", description: "বছরের খাবার, জায়গা, শব্দ আর সেরা মুহূর্ত বেছে নাও, বানাও নিজের বার্ষিকীর প্রচ্ছদ।" };
    return {
      title: `${coverTitle(cover)} — বছরের শব্দ: ${pickLabel(cover, WORD)}`,
      description: `সেরা মুহূর্ত: ${pickLabel(cover, MOMENT)}। তোমার বছরটাও এক প্রচ্ছদে সাজাও, ফ্রি, অ্যাকাউন্ট লাগে না।`,
    };
  },
  // Only the fixed word ids are countable; names never are.
  tally: prompts[WORD].options.map(option => option.id),
};
