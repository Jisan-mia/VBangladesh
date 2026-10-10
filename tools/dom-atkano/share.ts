import type { ToolShare } from "../../shared/share-types";
import { bn, parseShareHash, possessive, scoreOf, shareHash, tallyIds } from "./lib/quiz";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const score = shared ? bn(scoreOf(shared.set, shared.answers)) : "কয়টা";
    return {
      title: shared?.name ? `${shared.name} ১০-এ ${score} পেয়েছে — দম আটকানো ম্যাচগুলো তোমার মনে আছে?` : `এক বন্ধু ১০-এ ${score} পেয়েছে — দম আটকানো ম্যাচগুলো তোমার মনে আছে?`,
      description: `${shared?.name ? possessive(shared.name) : "বন্ধুর"} সাথে একই ১০টা প্রশ্ন: ১৯৯৭-এর শেষ বল, কার্ডিফ, বেঙ্গালুরুর সেই ১ রান… বাংলাদেশ ক্রিকেটের সেরা আর কষ্টের মুহূর্তের কুইজ। ফ্রি।`,
    };
  },
  tally: tallyIds,
};
