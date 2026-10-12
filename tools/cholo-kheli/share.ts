import type { ToolShare } from "../../shared/share-types";
import { gameById, inviteHash, inviteTitle, parseInvite } from "./lib/invite";
import { championTitle, ludoHash, parseLudo } from "./lib/ludo";

export const share: ToolShare = {
  normalize(state) {
    const ludo = parseLudo(state);
    if (ludo) return ludoHash(ludo).slice(1);
    const invite = parseInvite(state);
    return invite ? inviteHash(invite).slice(1) : null;
  },
  preview(state) {
    const ludo = parseLudo(state);
    if (ludo) return { title: championTitle(ludo), description: "লুডুর আসরে কে কয় দান জিতল, দেখে নাও। তোমরাও খেলছ? নিজেদের হিসাব রাখো, চ্যাম্পিয়ন কার্ড বানাও।" };
    const invite = parseInvite(state);
    const game = invite && gameById(invite.game);
    return {
      title: invite && game ? inviteTitle(invite, game) : "চলো খেলি! দেশি খেলার দাওয়াত, আসছ তো?",
      description: "কানামাছি, গোল্লাছুট, লুকোচুরি… নিয়মসহ খেলার দাওয়াত। খুলে নিয়মটা দেখে নাও, বা নিজের পাড়ার জন্য একটা খেলা ঠিক করো।",
    };
  },
};
