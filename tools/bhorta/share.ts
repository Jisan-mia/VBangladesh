import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/bhorta";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "আলু, বেগুন, শুঁটকি না টাকি মাছ? ৬টা মজার প্রশ্নে শিলপাটায় বেটে দেখো তুমি কোন ভর্তা। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  tally: tallyIds,
};
