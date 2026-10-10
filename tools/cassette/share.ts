import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewDescription, previewTitle, shareHash, tallyIds } from "./lib/cassette";

export const share: ToolShare = {
  normalize(state) {
    const tape = parseShareHash(state);
    return tape ? shareHash(tape).slice(1) : null;
  },
  preview(state) {
    const tape = parseShareHash(state);
    return tape
      ? { title: previewTitle(tape), description: previewDescription(tape) }
      : { title: "আমার ক্যাসেট — তোমার ক্যাসেটে কোন দশটা গান?", description: "ব্যান্ড, লোকগান, রবীন্দ্র-নজরুল আর সিনেমার গান থেকে সাইড A আর সাইড B সাজাও, হাতে লেখা জে-কার্ডের ছবি বানাও।" };
  },
  // Listed song ids only; the tape's name is never counted.
  tally: tallyIds,
};
