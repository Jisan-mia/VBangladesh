import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, possessive, shareHash } from "./lib/postcard";

export const share: ToolShare = {
  normalize(state) {
    const card = parseShareHash(state);
    return card ? shareHash(card) : null;
  },
  preview(state) {
    const card = parseShareHash(state);
    const who = card?.name ? possessive(card.name) : "";
    const title = card?.place
      ? `${card.place} থেকে ${who ? who + " " : "একটা "}পোস্টকার্ড — তোমার পাড়াটা কেমন ছিল?`
      : `${who || "এক বন্ধুর"} পাড়ার পোস্টকার্ড — তোমার পাড়াটা কেমন ছিল?`;
    return {
      title,
      description: "টিনের ঘর, আমগাছ, টিউবওয়েল, উঠোনে ঘুড়ি… নিজের ছোটবেলার পাড়াটা সাজিয়ে পুরোনো দিনের পোস্টকার্ড বানাও, বন্ধুকে পাঠাও। ফ্রি।",
    };
  },
};
