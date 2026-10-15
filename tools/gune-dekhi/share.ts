import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "গুনে দেখি: পুকুরে কয়টা মাছ?",
    description: "মাছ গুনে, এক নজরে দেখে আর দুই পুকুর মিলিয়ে সংখ্যা শেখার খেলা। ৩–৬ বছরের জন্য, ফ্রি।",
  }),
};
