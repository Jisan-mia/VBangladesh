import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyWindow } from "./lib/gelo";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "আজ কত ঘণ্টা কারেন্ট ছিল না?",
      description: "কারেন্ট গেলে ‘গেল’, এলে ‘এল’ চাপো। দিনের শেষে দেখো আজ কত ঘণ্টা অন্ধকারে কাটল, মোমবাতির কার্ড বানিয়ে শেয়ার করো। ফ্রি।",
    };
  },
  // A getter on purpose: day-tagged ids, so the accepted set rolls with the Dhaka date (see tallyWindow).
  get tally() { return tallyWindow(); },
};
