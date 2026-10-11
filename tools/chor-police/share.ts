import type { ToolShare } from "../../shared/share-types";
import { gameHash, parseGame, previewTitle } from "./lib/result";

// No tally: the link only rebuilds one family's scoreboard.
export const share: ToolShare = {
  normalize(state) {
    const game = parseGame(state);
    return game ? gameHash(game) : null;
  },
  preview(state) {
    const game = parseGame(state);
    return {
      title: game ? previewTitle(game) : "চোর-ডাকাত-পুলিশ-বাবু: চিরকুট তোলো, চোর ধরো",
      description: "থালায় চারটা চিরকুট, এক ফোনে চারজন। লুকিয়ে চিরকুট দেখো, পুলিশ চোর ধরবে, স্কোর রাখবে ফোন। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
