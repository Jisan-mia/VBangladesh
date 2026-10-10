import type { ToolShare } from "../../shared/share-types";
import { gameById, inviteHash, inviteTitle, parseInvite } from "./lib/invite";

export const share: ToolShare = {
  normalize(state) {
    const invite = parseInvite(state);
    return invite ? inviteHash(invite).slice(1) : null;
  },
  preview(state) {
    const invite = parseInvite(state);
    const game = invite && gameById(invite.game);
    return {
      title: invite && game ? inviteTitle(invite, game) : "চলো খেলি! দেশি খেলার দাওয়াত — আসছ তো?",
      description: "কানামাছি, গোল্লাছুট, লুকোচুরি… নিয়মসহ খেলার দাওয়াত। খুলে নিয়মটা দেখে নাও, বা নিজের পাড়ার জন্য একটা খেলা ঠিক করো।",
    };
  },
};
