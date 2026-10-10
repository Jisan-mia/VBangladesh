import { MAX_SHARE_STATE, type ToolShare } from "../../shared/share-types";
import { calculateLedger, formatTaka, ledgerHash, parseLedgerHash, perPerson } from "./lib/ledger";

const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export const share: ToolShare = {
  normalize(state) {
    const ledger = parseLedgerHash(state);
    const normalized = ledger && ledgerHash(ledger).slice(1);
    return normalized && normalized.length <= MAX_SHARE_STATE ? normalized : null;
  },
  preview(state) {
    const ledger = parseLedgerHash(state);
    if (!ledger) return { title: "ভাগাভাগি — ট্যুরের হিসাব মিলেছে", description: "কে কত দিয়েছে আর কে কাকে কত দেবে, খুলে মিলিয়ে নাও।" };
    const { total, transfers } = calculateLedger(ledger);
    const count = ledger.people.length;
    return {
      title: ledger.trip ? `${ledger.trip}: ${bn(count)} জনের হিসাব মিলেছে` : `${bn(count)} জনের খরচের হিসাব মিলেছে`,
      description: `মোট ${formatTaka(total)}, জনপ্রতি ${perPerson(total, count, formatTaka)}। ${transfers.length ? `${bn(transfers.length)}টা লেনদেনেই সব শোধ।` : "কারও কাছে কারও পাওনা নেই।"} কে কাকে কত দেবে, খুলে মিলিয়ে নাও।`,
    };
  },
};
