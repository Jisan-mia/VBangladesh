import type { ToolShare } from "../../shared/share-types";
import { bn, decodeOrder, encodeOrder, orderText, possessive, tallyIds } from "./lib/order";

export const share: ToolShare = {
  normalize(state) {
    const lines = decodeOrder(state);
    return lines ? encodeOrder(lines) : null;
  },
  preview(state) {
    const lines = decodeOrder(state) ?? [];
    const names = lines.map(line => line.name).filter(Boolean);
    if (lines.length > 1) {
      const rest = lines.length - Math.min(names.length, 3);
      const who = names.length ? `${names.slice(0, 3).join(", ")}${rest ? ` আর ${bn(rest)} জন` : ""}` : `${bn(lines.length)} জনের অর্ডার`;
      return { title: `আড্ডার চিরকুটে ${who} — তোমারটা যোগ করো`, description: `চিরকুটে এখন ${bn(lines.length)} কাপ চা। দুধ চা না রং চা, সাথে বিস্কুট না সিঙ্গারা? নিজের লাইনটা লিখে দাও।` };
    }
    const line = lines[0];
    const who = line?.name ? possessive(line.name) : "এক বন্ধুর";
    return {
      title: line ? `${who} টং-এর অর্ডার: ${orderText(line).split(" · ").slice(0, 2).join(", ")} — মামা, তোমারটা কী?` : "টং-এর অর্ডার — মামা, তোমারটা কী?",
      description: "দুধ চা না রং চা, চিনি কম না বেশি, সাথে বিস্কুট না সিঙ্গারা? টং-এর চিরকুটে নিজের অর্ডার লেখো।",
    };
  },
  tally: tallyIds,
};
