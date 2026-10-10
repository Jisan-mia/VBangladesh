import type { ToolShare } from "../../shared/share-types";
import { chainText, parseShareHash, shareHash, tallyIds } from "./lib/kin";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  // Spoiler-free: the preview asks the question, the answer waits behind the friend's guess.
  preview(state) {
    const shared = parseShareHash(state);
    const question = shared ? chainText(shared.chain, shared.style) : "আব্বুর বোনের স্বামী";
    return {
      title: `${shared?.name || "এক বন্ধু"} জানতে চায়: ${question} তোমার কী হয়?`,
      description: "চাচা না কাকা, খালা না মাসি? আগে আন্দাজ করো, তারপর নিজের আত্মীয়দের নাম খুঁজে দেখো। দুই ঘরের ডাক পাশাপাশি, অভিধানে মেলানো।",
    };
  },
  tally: tallyIds,
};
