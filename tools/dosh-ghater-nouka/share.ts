import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "দশ ঘাটের নৌকা: ঘাট গুনে গুনে নৌকা চালাও",
    description: "সোজা এক সারিতে ১ থেকে ১০ নম্বর ঘাট। চরকি ঘোরাও, প্রতি ঘাটে নম্বর বলে আব্বুর নৌকার সাথে পাল্লা দাও। ৩–৬ বছরের জন্য, ফ্রি।",
  }),
};
