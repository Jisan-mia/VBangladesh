import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/typing";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "মিনিটে কয়টা বাংলা শব্দ টাইপ করতে পারো?",
      description: "ফোনের বাংলা কিবোর্ডে ৬০ সেকেন্ডের টাইপিং টেস্ট। একই লেখা টাইপ করে দেখো, তুমি মিনিটে কত শব্দ লেখো, কতটা নির্ভুল। ফ্রি।",
    };
  },
  tally: tallyIds,
};
