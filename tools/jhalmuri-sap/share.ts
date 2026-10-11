import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "সাপটা ঝালমুড়ি খাবে, তুমি চালাও",
      description: "পুরোনো দিনের সাপের খেলা, এবার ঝালমুড়ির ঠোঙায়। একই ঠোঙা, একই খাবারের ক্রম। দেখো তুমি কত খেতে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
