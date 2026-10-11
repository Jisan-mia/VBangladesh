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
      title: shared ? previewTitle(shared) : "সাকরাইনের ছাদে কয়টা ঘুড়ি কাটতে পারবে?",
      description: "পুরান ঢাকার সাকরাইন, শীতের সন্ধ্যা, ছাদে ছাদে ঘুড়ি। প্যাঁচ লাগাও, মাপমতো টান দাও, বলো ভো-কাট্টা! একই আকাশ, একই বাতাস। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
