import type { ToolShare } from "../../shared/share-types";
import { bn, daysBetween, parseShareHash, seasons, shareHash, todayInDhaka } from "./lib/boyos";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const days = shared ? bn(daysBetween(shared.birth, todayInDhaka())) : "";
    return {
      title: shared ? `${shared.name || "আমি"} আজ ${days} দিনের — তুমি কত দিনের?` : "বয়স কত? — তুমি আজ কত দিনের?",
      description: "জন্মতারিখ দাও: বয়স বছর-মাস-দিনে, মোট কত দিন, বাংলা জন্মতারিখ, জন্মবার আর জন্মঋতু। দেখো কে কত দিনের বড়।",
    };
  },
  tally: seasons.map(season => season.id),
};
