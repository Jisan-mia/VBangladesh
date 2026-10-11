import type { ToolShare } from "../../shared/share-types";
import { books, parseShareHash, previewTitle, shareHash } from "./lib/shelf";

export const share: ToolShare = {
  normalize(state) {
    const shelf = parseShareHash(state);
    return shelf ? shareHash(shelf).slice(1) : null;
  },
  preview(state) {
    const shelf = parseShareHash(state);
    return {
      title: shelf ? previewTitle(shelf) : "হুমায়ূন আহমেদের কয়টা বই পড়েছ?",
      description: "হিমু, মিসির আলি, শুভ্র আর চেনা সব উপন্যাস… হুমায়ূন আহমেদের ৩০টা বইয়ের কয়টা তোমার পড়া? মিলিয়ে দেখো, নিজের তাক বানাও।",
    };
  },
  // Book ids only; names never get counted.
  tally: books.map(book => book.id),
};
