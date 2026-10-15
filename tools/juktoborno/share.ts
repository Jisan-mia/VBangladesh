import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "যুক্তবর্ণ ভাঙি-জুড়ি: ক্ষ = ক + ষ",
    description: "ছবির শব্দ দেখে যুক্তবর্ণ ভাঙো, আবার জুড়ে বানাও। জোড়া বর্ণ থেকে ক্ষ, জ্ঞ, রেফ আর য-ফলা পর্যন্ত, ৭–১০ বছরের জন্য, ফ্রি।",
  }),
};
