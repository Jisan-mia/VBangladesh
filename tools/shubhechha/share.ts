import type { ToolShare } from "../../shared/share-types";
import { occasionById, parseShareHash, previewTitle, shareHash } from "./lib/greeting";

export const share: ToolShare = {
  normalize(state) {
    const wish = parseShareHash(state);
    return wish ? shareHash(wish).slice(1) : null;
  },
  preview(state) {
    const wish = parseShareHash(state);
    if (!wish) return { title: "তোমার জন্য একটা শুভেচ্ছা কার্ড এসেছে", description: "কার্ডটা খুলে দেখো। চাইলে নিজের নামে একটা বানিয়ে তুমিও পাঠাও, ফ্রি।" };
    return {
      title: previewTitle(wish),
      description: `${occasionById(wish.occasion).title}। কার্ডটা খুলে দেখো, তারপর নিজের নামে একটা বানিয়ে তুমিও পাঠাও। ফ্রি, অ্যাকাউন্ট লাগে না।`,
    };
  },
};
