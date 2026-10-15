import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "মঙ্গলে রোভার: তীর সাজিয়ে ছোটদের কোডিং খেলা", description: "তীর দিয়ে প্ল্যান বানাও, রোভার চালাও, গর্তে ঠেকলে ঠিক করো। ৬–১১ বছরের জন্য, সাথে NASA-র মঙ্গলের তথ্য।" }),
};
