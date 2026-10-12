import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one maze and the friend's own time, checked against that maze before it's kept.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "গোলকধাঁধা: গলি পেরিয়ে জিলাপির দোকানে যাও",
      description: "বাসা থেকে জিলাপির দোকান, মাঝে পুরান ঢাকার গলির গোলকধাঁধা। একই ধাঁধা খুলবে, দেখো তুমি কত সেকেন্ডে পৌঁছাতে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
