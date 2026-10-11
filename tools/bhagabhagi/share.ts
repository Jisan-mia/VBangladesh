import { MAX_SHARE_STATE, type ToolShare } from "../../shared/share-types";
import { calculateLedger, formatTaka, ledgerHash, parseLedgerHash, perPerson } from "./lib/ledger";
import { formatMeals, messHash, parseMessHash } from "./lib/meal-rate";

const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export const share: ToolShare = {
  normalize(state) {
    const ledger = parseLedgerHash(state);
    const mess = !ledger && parseMessHash(state);
    const normalized = ledger ? ledgerHash(ledger).slice(1) : mess && messHash(mess).slice(1);
    return normalized && normalized.length <= MAX_SHARE_STATE ? normalized : null;
  },
  preview(state) {
    const ledger = parseLedgerHash(state);
    const mess = !ledger && parseMessHash(state);
    // Mess previews carry no member names or money: those stay on the card and in the link.
    if (mess) return {
      title: `${mess.title ? `${mess.title}: ` : ""}${bn(mess.members.length)} জনের মিলের হিসাব`,
      description: `মোট ${formatMeals(mess.members.reduce((sum, member) => sum + member.halfMeals, 0))} মিল। মিল রেট কত, কার ভাগে কত আর কে কত দেবে বা পাবে, খুলে মিলিয়ে নাও।`,
    };
    if (!ledger) return { title: "ভাগাভাগি — ট্যুরের হিসাব মিলেছে", description: "কে কত দিয়েছে আর কে কাকে কত দেবে, খুলে মিলিয়ে নাও।" };
    const { total, transfers } = calculateLedger(ledger);
    const count = ledger.people.length;
    return {
      title: ledger.trip ? `${ledger.trip}: ${bn(count)} জনের হিসাব মিলেছে` : `${bn(count)} জনের খরচের হিসাব মিলেছে`,
      description: `মোট ${formatTaka(total)}, জনপ্রতি ${perPerson(total, count, formatTaka)}। ${transfers.length ? `${bn(transfers.length)}টা লেনদেনেই সব শোধ।` : "কারও কাছে কারও পাওনা নেই।"} কে কাকে কত দেবে, খুলে মিলিয়ে নাও।`,
    };
  },
};
