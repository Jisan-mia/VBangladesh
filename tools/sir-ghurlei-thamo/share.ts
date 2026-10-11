import type { ToolShare } from "../../shared/share-types";
import { site } from "./content";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : site.headline ?? site.name,
      description: "স্যার বোর্ডে লিখলে চিরকুট চালাও, ঘুরলেই থামো। একই ক্লাস, একই শিক্ষক। কত সেকেন্ডে শেষ বেঞ্চে পৌঁছাও দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
