import type { ToolShare } from "../../shared/share-types";
import { buckets, moments, parseShareHash, previewTitle, shareHash } from "./lib/mondop";

export const share: ToolShare = {
  normalize(state) {
    const tour = parseShareHash(state);
    return tour ? shareHash(tour).slice(1) : null;
  },
  preview(state) {
    const tour = parseShareHash(state);
    return {
      title: tour ? previewTitle(tour) : "এবার পূজায় কয়টা মণ্ডপ ঘুরলে? — চালচিত্রে প্রদীপ জ্বালাও",
      description: "প্রতিটা মণ্ডপ ঘুরে + চাপো, চালচিত্রে একটা করে প্রদীপ জ্বলবে। অঞ্জলি, ধুনুচি নাচ, প্রসাদ, মেলা টিক দাও, বন্ধুর সাথে মেলাও।",
    };
  },
  // Fixed moment ids and pandal-count ranges only; names and pandal names are never counted.
  tally: [...moments.map(moment => moment.id), ...buckets.map(bucket => bucket.id)],
};
