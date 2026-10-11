import type { ToolShare } from "../../shared/share-types";
import { cardHash, parseCard, previewTitle } from "./lib/result";

// No tally: a link only reopens one game and its result.
export const share: ToolShare = {
  normalize(state) {
    const result = parseCard(state);
    return result ? cardHash(result.card, result.game) || null : null;
  },
  preview(state) {
    const result = parseCard(state);
    return {
      title: result ? previewTitle(result) : "সাপলুডু: লুডু বোর্ডের উল্টো পিঠের সেই খেলা, এবার ফোনে",
      description: "ছক্কা চাপো, সিঁড়িতে ওঠো, সাপ এড়াও। এক ফোনে ২–৪ জন, বা একা খেলে বন্ধুকে একই ছক্কা পাঠাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
