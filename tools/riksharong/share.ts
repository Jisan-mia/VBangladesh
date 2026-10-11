import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, possessive, shareHash } from "./lib/board";

export const share: ToolShare = {
  normalize(state) {
    const board = parseShareHash(state);
    return board ? shareHash(board).slice(1) : null;
  },
  preview(state) {
    const board = parseShareHash(state);
    const who = board?.name ? possessive(board.name) : "এক বন্ধুর";
    return {
      title: board?.line ? `${who} রিকশার বোর্ডে লেখা “${board.line}”। তোমারটায় কী লিখতে?` : `${who} রাঙানো রিকশার বোর্ড। তোমারটায় কী লিখতে?`,
      description: "ঢাকার রিকশা পেইন্টিংয়ের ঢঙে নিজের বোর্ড রাঙাও: ময়ূর, রাজহাঁস, ফুল না নদী-নৌকা, আর পটিতে নিজের কথা। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
