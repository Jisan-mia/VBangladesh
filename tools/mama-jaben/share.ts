import type { ToolShare } from "../../shared/share-types";
import { bn, parseShareHash, possessive, routeById, shareHash, tallyIds } from "./lib/haggle";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    if (!shared) return { title: "মামা, যাবেন? — দরদাম করে দেখো", description: "রিকশার মামার সাথে তিন দফায় দরদাম। ন্যায্য ভাড়ায় রাজি করাতে পারো কি না দেখো।" };
    const route = routeById(shared.route);
    const description = `${route.from} → ${route.to}, ${bn(shared.rounds)} দফার দরদাম। রিকশার মামার সাথে ছোট্ট দরদামের খেলা; একই রাস্তায় তুমিও চেষ্টা করো।`;
    return {
      title: shared.fare
        ? `${shared.name || "এক বন্ধু"} ${bn(shared.fare)} টাকায় মামাকে রাজি করিয়েছে — তুমি পারবে?`
        : `মামা ${shared.name ? possessive(shared.name) : "এক বন্ধুর"} দরদামে রাজি হননি! তুমি পারবে?`,
      description,
    };
  },
  tally: tallyIds,
};
