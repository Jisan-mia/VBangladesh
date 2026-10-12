import type { ToolShare } from "../../shared/share-types";
import { amountFigures, giverLabel, givers, parseShareHash, possessive, previewTitle, shareHash } from "./lib/cheque";
import { khataHash, khataNames, khataPreviewTitle, parseKhataHash } from "./lib/khata";

export const share: ToolShare = {
  normalize(state) {
    // খাতা links carry k; cheque links (g/a) never did, so every older link takes the cheque path unchanged.
    const khata = parseKhataHash(state);
    if (khata) return khataHash(khata).slice(1);
    const cheque = parseShareHash(state);
    return cheque ? shareHash(cheque).slice(1) : null;
  },
  preview(state) {
    const khata = parseKhataHash(state);
    // The preview names who gave, never how much.
    if (khata) return { title: khataPreviewTitle(khata), description: `${khataNames(khata.rows)}: সবার দোয়া আর সালামি এক পাতায়। এবার তোমাকে কে কে দিল? নিজের সালামি খাতা লেখো।` };
    const cheque = parseShareHash(state);
    if (!cheque) return { title: "ঈদ সালামির চেক — নিজের নামে চেক বানাও", description: "কার কাছে, কত টাকা, বেছে নাও। নিজের নামে ঈদ সালামির চেক কেটে পাঠিয়ে দাও।" };
    return {
      title: previewTitle(cheque),
      description: cheque.ok
        ? `${amountFigures(cheque.amount)} টাকার সালামির চেকে ${possessive(giverLabel(cheque.giver))} সই পড়েছে। তুমিও কারও কাছে সালামি চাও, নিজের চেক বানাও।`
        : `${amountFigures(cheque.amount)} টাকার সালামির চেক, শুধু সইটা বাকি। এক চাপে সই করে ফেরত পাঠাও।`,
    };
  },
  // Cheque giver ids only, counted when an elder signs; names, amounts and খাতা entries are never counted.
  tally: givers.map(giver => giver.id),
};
