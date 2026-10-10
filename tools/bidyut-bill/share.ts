import type { ToolShare } from "../../shared/share-types";
import { applianceIds, homeHash, parseHome, previewTitle } from "./lib/meter";

export const share: ToolShare = {
  normalize(state) {
    const home = parseHome(state);
    return home ? homeHash(home) : null;
  },
  preview(state) {
    const home = parseHome(state);
    return {
      title: home ? previewTitle(home) : "কোন যন্ত্রে কত বিল আসে?",
      description: "ফ্যান, বাতি, ফ্রিজ, এসি… কোন যন্ত্রে মাসে কত ইউনিট আর আনুমানিক কত টাকা বিল আসে, পুরোনো মিটারে দেখো। তোমার বাসায় কোনটা সবচেয়ে বেশি খায়?",
    };
  },
  // Only the id of the appliance that uses the most in a home; never hours, bills or names.
  tally: applianceIds,
};
