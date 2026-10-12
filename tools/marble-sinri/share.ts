import type { ToolShare } from "../../shared/share-types";
import { cardHash, parseCard, previewTitle } from "./lib/result";

// No tally: a link only replays one staircase (its seed) with the friend's own score.
export const share: ToolShare = {
  normalize(state) {
    const card = parseCard(state);
    return card ? cardHash(card) : null;
  },
  preview(state) {
    const card = parseCard(state);
    return {
      title: card ? previewTitle(card) : "মার্বেল-সিঁড়ি: ছাদ থেকে গলি পর্যন্ত গড়িয়ে নামো",
      description: "কাচের মার্বেল গড়িয়ে নামে সিঁড়ি, ছাদের রেলিং আর বাঁশের মাচা বেয়ে। ওপরে ঠেকো না, ক্যাকটাসের টব এড়াও। একই সিঁড়ি, দেখো তুমি কত ধাপ নামো।",
    };
  },
};
