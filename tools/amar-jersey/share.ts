import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/jersey";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "পিঠে নিজের নাম, পছন্দের নম্বর, লাল-সবুজ থেকে আকাশি-সাদা ডোরা। ক্রিকেট বা ফুটবলের জার্সি বানাও, প্রোফাইল ছবিও করে নাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  tally: tallyIds,
};
