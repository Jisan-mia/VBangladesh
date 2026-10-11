import type { ToolShare } from '../../shared/share-types';
import { dhakaDate } from './lib/game';
import { parseShare, previewTitle, shareHash } from './lib/result';

// No tally: a link only carries one person's mangoes (or a friend's code), never stored anywhere else.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShare(state, dhakaDate());
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShare(state, dhakaDate());
    return {
      title: shared ? previewTitle(shared) : 'পাকা-কাঁচা: লুকানো ৪ অঙ্কের কোড, ৭ বারে ধরতে পারবে?',
      description: 'চার অঙ্কের লুকানো কোড, ৭ বার সুযোগ। আম দেখে বোঝো কোন অঙ্ক ঠিক ঘরে। ফ্রি, অ্যাকাউন্ট লাগে না।',
    };
  },
};
