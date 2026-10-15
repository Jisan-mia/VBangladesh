import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "নাম শিখি: ছবি দেখে নাম, বাংলা আর ইংরেজিতে", description: "পশুপাখি, ফল, সবজি, শরীর, রং আর দেশের প্রতীকের নাম। ৩–৭ বছরের ছোটদের জন্য ফ্রি খেলা।" }),
};
