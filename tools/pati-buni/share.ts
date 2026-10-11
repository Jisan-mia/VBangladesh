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
      title: shared ? previewTitle(shared) : "সারি ভরাও, শীতলপাটি বোনো",
      description: "বেতের ফালি সাজিয়ে সারি ভরাও, ভরা সারি বুনে গুটিয়ে যায়। একই বেতের গোছা, একই ক্রমে। দেখো তুমি কয় সারি বুনতে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
