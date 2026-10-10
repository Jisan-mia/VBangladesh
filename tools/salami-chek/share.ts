import type { ToolShare } from "../../shared/share-types";
import { amountFigures, giverLabel, givers, parseShareHash, possessive, previewTitle, shareHash } from "./lib/cheque";

export const share: ToolShare = {
  normalize(state) {
    const cheque = parseShareHash(state);
    return cheque ? shareHash(cheque).slice(1) : null;
  },
  preview(state) {
    const cheque = parseShareHash(state);
    if (!cheque) return { title: "ঈদ সালামির চেক — নিজের নামে চেক বানাও", description: "কার কাছে, কত টাকা, বেছে নাও। খেলনা চেক, টাকা যায় না, শুধু ঈদের মজা।" };
    return {
      title: previewTitle(cheque),
      description: cheque.ok
        ? `${amountFigures(cheque.amount)} টাকার খেলনা চেকে ${possessive(giverLabel(cheque.giver))} সই পড়েছে। তুমিও কারও কাছে সালামি চাও, নিজের চেক বানাও।`
        : `${amountFigures(cheque.amount)} টাকার খেলনা চেক, শুধু সইটা বাকি। এক চাপে সই করে ফেরত পাঠাও। টাকা যায় না, শুধু ঈদের মজা।`,
    };
  },
  // Giver ids only; names and amounts are never counted.
  tally: givers.map(giver => giver.id),
};
