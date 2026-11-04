import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only replays one staircase (its seed and floor) with the friend's own time or steps.
export const share: ToolShare = {
  normalize(state) {
    const card = parseShared(state);
    return card ? sharedHash(card) : null;
  },
  preview(state) {
    const card = parseShared(state);
    return {
      title: card ? previewTitle(card) : "মার্বেল-সিঁড়ি: ছাদ থেকে গলি পর্যন্ত গড়িয়ে নামো",
      description: "কাচের মার্বেল গড়িয়ে নামে সিঁড়ি, ছাদের রেলিং আর বাঁশের মাচা বেয়ে। ওপরে ঠেকো না, ক্যাকটাসের টব এড়াও। একই সিঁড়ি, দেখো তুমি কত তাড়াতাড়ি নামো।",
    };
  },
};
