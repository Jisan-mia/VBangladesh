import type { ToolShare } from '../../shared/share-types';
import { parseShared, previewTitle, sharedHash } from './lib/link';

// No tally: a link carries one person's score, never stored anywhere else.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : 'খদ্দের দাঁড়িয়ে, ভাংতি দিতে পারবে?',
      description: 'মুদি দোকানের কাউন্টারে দশজন খদ্দের, সবার হাতে বড় নোট। ঝটপট হিসাব করে ঠিক ভাংতি ফেরত দাও। ফ্রি, অ্যাকাউন্ট লাগে না।',
    };
  },
};
