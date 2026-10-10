import type { ToolShare } from "../../shared/share-types";
import { dhakaToday, parseShareHash, previewTitle, shareHash } from "./lib/timetable";

export const share: ToolShare = {
  normalize(state) {
    const district = parseShareHash(state);
    return district ? shareHash(district).slice(1) : null;
  },
  preview(state) {
    const district = parseShareHash(state);
    return {
      title: district ? previewTitle(district, dhakaToday(new Date())) : "সেহরি-ইফতারের সময় — তোমার জেলায় ইফতার কখন?",
      description: "৬৪ জেলার সেহরির শেষ সময় আর ইফতার, শুধু ইসলামিক ফাউন্ডেশনের সময়সূচি থেকে। সাথে রমজানের দিন গোনা কার্ড।",
    };
  },
};
