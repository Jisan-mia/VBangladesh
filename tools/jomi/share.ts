import type { ToolShare } from "../../shared/share-types";
import { parsePlot, pitchLine, plotHash, previewTitle } from "./lib/plot";

// No tally: there is nothing fixed to count, and land sizes are nobody else's business.
export const share: ToolShare = {
  normalize(state) {
    const plot = parsePlot(state);
    return plot ? plotHash(plot) : null;
  },
  preview(state) {
    const plot = parsePlot(state);
    return {
      title: plot ? previewTitle(plot) : "শতাংশ, কাঠা, বিঘা — কোনটা কত?",
      description: `${plot ? `${pitchLine(plot)}। ` : ""}জমির মাপ লেখো, শতাংশ, কাঠা, বিঘা, একর আর বর্গফুটে কত হয়, দেখে নাও। তোমার বাড়ির উঠোন কত শতাংশ?`,
    };
  },
};
