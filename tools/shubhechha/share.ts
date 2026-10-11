import type { ToolShare } from "../../shared/share-types";
import { frameHash, framePreviewTitle, occasionById, parseFrameHash, parseShareHash, previewTitle, shareHash } from "./lib/greeting";

// A frame link (fr=…) never carries o=, but if both appear the frame wins, same as the page.
export const share: ToolShare = {
  normalize(state) {
    const frame = parseFrameHash(state);
    if (frame) return frameHash(frame).slice(1);
    const wish = parseShareHash(state);
    return wish ? shareHash(wish).slice(1) : null;
  },
  preview(state) {
    const frame = parseFrameHash(state);
    if (frame) return { title: framePreviewTitle(frame), description: "ফ্রেমের ভেতরে নিজের ছবি দাও, তারপর প্রোফাইল ছবি করে দাও। ছবি তোমার ফোনেই থাকে। ফ্রি, অ্যাকাউন্ট লাগে না।" };
    const wish = parseShareHash(state);
    if (!wish) return { title: "তোমার জন্য একটা শুভেচ্ছা কার্ড এসেছে", description: "কার্ডটা খুলে দেখো। চাইলে নিজের নামে একটা বানিয়ে তুমিও পাঠাও, ফ্রি।" };
    return {
      title: previewTitle(wish),
      description: `${occasionById(wish.occasion).title}। কার্ডটা খুলে দেখো, তারপর নিজের নামে একটা বানিয়ে তুমিও পাঠাও। ফ্রি, অ্যাকাউন্ট লাগে না।`,
    };
  },
};
