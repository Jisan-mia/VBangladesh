import type { ToolShare } from "../../shared/share-types";
import { dateText, inviteTitle, parseShareHash, replyTitle, stateOf } from "./lib/invite";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? stateOf(shared) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    if (!shared) return { title: "তোমার জন্য একটা দাওয়াত এসেছে", description: "দাওয়াত কার্ডটা খুলে দেখো, তারপর ‘আমি আসছি’ জানিয়ে দাও।" };
    const when = dateText(shared.date);
    if (shared.guest !== null) return { title: replyTitle(shared), description: `${when ? `${when}, ` : ""}দেখা হচ্ছে! উত্তরটা খুলে দেখো। তুমিও নিজের দাওয়াত কার্ড বানাতে পারো, ফ্রি।` };
    return { title: inviteTitle(shared), description: `${when ? `${when}। ` : ""}কার্ডটা খুলে দেখো, তারপর এক চাপে ‘আমি আসছি’ জানিয়ে দাও।` };
  },
};
