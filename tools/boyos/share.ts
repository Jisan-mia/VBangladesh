import type { ToolShare } from "../../shared/share-types";
import { bn, createCard, daysBetween, parseShareHash, possessive, seasons, shareHash, todayInDhaka } from "./lib/boyos";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    if (shared?.view === "ritu") return {
      title: `${shared.name ? possessive(shared.name) : "আমার"} জীবনে ${createCard(shared, todayInDhaka()).rituHeadline}। তোমার কয়টা?`,
      description: "জন্মতারিখ দাও: জন্ম থেকে আজ পর্যন্ত কয়টা ঋতু দেখেছ, কয়টা বর্ষা, কয়টা বসন্ত, ছয় ঋতুর গ্রিডে। সাথে বয়স আর বাংলা জন্মতারিখ।",
    };
    const days = shared ? bn(daysBetween(shared.birth, todayInDhaka())) : "";
    return {
      title: shared ? `${shared.name || "আমি"} আজ ${days} দিনের। তুমি কত দিনের?` : "বয়স কত? — তুমি আজ কত দিনের?",
      description: "জন্মতারিখ দাও: বয়স বছর-মাস-দিনে, মোট কত দিন, বাংলা জন্মতারিখ, জন্মবার আর জন্মঋতু। দেখো কে কত দিনের বড়।",
    };
  },
  tally: seasons.map(season => season.id),
};
