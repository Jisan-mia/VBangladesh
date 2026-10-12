import type { ToolShare } from "../../shared/share-types";
import { bank } from "./lib/puzzles";
import { bn, bnDate, parseShareHash, possessive, shareHash, solvedCount } from "./lib/result";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const score = shared ? `${bn(shared.rows.length)}টার মধ্যে ${bn(solvedCount(shared.rows))}টা` : "কয়টা";
    const day = shared ? possessive(bnDate(shared.date)) : "আজকের";
    return {
      title: `${shared?.name || "এক বন্ধু"} ${day} শব্দজটে ${score} পেরেছে। তুমি কয়টা পারো?`,
      description: "রোজ পাঁচটা নতুন বাংলা শব্দের ধাঁধা। সূত্র পড়ে টুকরো জুড়ে শব্দ বানাও, তারপর বন্ধুর সাথে মিলিয়ে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  // Anonymous counts per puzzle: "<id>" = solved, "seen:<id>" = finished (solved or not), so a percentage can be shown.
  tally: [...bank.map(puzzle => puzzle.id), ...bank.map(puzzle => `seen:${puzzle.id}`)],
};
