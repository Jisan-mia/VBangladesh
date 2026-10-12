import type { Item, Unit } from './basket';

type Row = readonly [name: string, quantity: number, unit: Unit];
type Preset = { label: string; chip: string; title: string; line: string; items: readonly Row[] };

// Starter lists only: typical items and amounts for a small family. Prices always stay the person's own.
export const presets = {
  week: {
    label: 'সাপ্তাহিক বাজার', chip: 'সাপ্তাহিক', title: 'বাজারের ফর্দ', line: 'আসার সময় এগুলো এনো।',
    items: [['চাল', 5, 'kg'], ['মসুর ডাল', 1, 'kg'], ['আলু', 2, 'kg'], ['পেঁয়াজ', 2, 'kg'], ['রসুন', 250, 'gram'], ['আদা', 250, 'gram'], ['কাঁচা মরিচ', 250, 'gram'], ['ডিম', 1, 'dozen'], ['মাছ', 1, 'kg'], ['মুরগি', 1, 'piece'], ['লাল শাক', 2, 'aanti'], ['বেগুন', 1, 'kg']],
  },
  month: {
    label: 'মাসের বাজার', chip: 'মাসের', title: 'মাসের বাজারের ফর্দ', line: 'পুরো মাসের বাজার, লিস্ট মিলিয়ে মিলিয়ে নিও।',
    items: [['চাল', 25, 'kg'], ['মসুর ডাল', 2, 'kg'], ['মুগ ডাল', 1, 'kg'], ['আটা', 5, 'kg'], ['সয়াবিন তেল', 5, 'litre'], ['সরিষার তেল', 1, 'litre'], ['চিনি', 2, 'kg'], ['লবণ', 2, 'packet'], ['পেঁয়াজ', 5, 'kg'], ['রসুন', 1, 'kg'], ['আদা', 500, 'gram'], ['হলুদ গুঁড়া', 200, 'gram'], ['মরিচ গুঁড়া', 200, 'gram'], ['ধনিয়া গুঁড়া', 200, 'gram'], ['জিরা', 100, 'gram'], ['চা পাতা', 400, 'gram'], ['গুঁড়া দুধ', 500, 'gram'], ['গোসলের সাবান', 4, 'piece'], ['কাপড় কাচার পাউডার', 1, 'kg'], ['টুথপেস্ট', 1, 'piece']],
  },
  roza: {
    label: 'রোজার বাজার', chip: 'রোজার', title: 'রোজার বাজারের ফর্দ', line: 'ইফতারের আগেই এনো।',
    items: [['ছোলা', 2, 'kg'], ['খেজুর', 1, 'kg'], ['মুড়ি', 2, 'kg'], ['চিড়া', 1, 'kg'], ['বেসন', 1, 'kg'], ['মসুর ডাল', 1, 'kg'], ['চিনি', 2, 'kg'], ['সয়াবিন তেল', 2, 'litre'], ['পেঁয়াজ', 3, 'kg'], ['আলু', 3, 'kg'], ['কাঁচা মরিচ', 250, 'gram'], ['ধনেপাতা', 2, 'aanti'], ['লেবু', 2, 'hali'], ['শসা', 1, 'kg'], ['কলা', 2, 'dozen'], ['ইসবগুলের ভুসি', 100, 'gram']],
  },
  eid: {
    label: 'ঈদের বাজার', chip: 'ঈদের', title: 'ঈদের বাজারের ফর্দ', line: 'ঈদের ভিড় বাড়ার আগেই সেরে ফেলো।',
    items: [['পোলাওয়ের চাল', 2, 'kg'], ['সেমাই', 4, 'packet'], ['চিনি', 2, 'kg'], ['তরল দুধ', 2, 'litre'], ['ঘি', 250, 'gram'], ['মাংস', 2, 'kg'], ['মুরগি', 2, 'piece'], ['পেঁয়াজ', 3, 'kg'], ['আদা', 500, 'gram'], ['রসুন', 500, 'gram'], ['সয়াবিন তেল', 2, 'litre'], ['এলাচ', 50, 'gram'], ['দারচিনি', 50, 'gram'], ['তেজপাতা', 1, 'packet'], ['কিশমিশ', 100, 'gram'], ['কাজুবাদাম', 100, 'gram']],
  },
  guests: {
    label: 'মেহমানদারির বাজার', chip: 'মেহমানদারি', title: 'মেহমানদারির বাজারের ফর্দ', line: 'মেহমান আসছে, একটা জিনিসও যেন বাদ না পড়ে।',
    items: [['পোলাওয়ের চাল', 2, 'kg'], ['মুরগি', 2, 'piece'], ['রুই মাছ', 2, 'kg'], ['ডিম', 1, 'dozen'], ['ঘি', 250, 'gram'], ['পেঁয়াজ', 2, 'kg'], ['আলু', 2, 'kg'], ['শসা', 1, 'kg'], ['টমেটো', 1, 'kg'], ['লেবু', 1, 'hali'], ['দই', 1, 'kg'], ['মিষ্টি', 1, 'kg'], ['বিস্কুট', 2, 'packet'], ['কোমল পানীয়', 2, 'litre']],
  },
} as const satisfies Record<string, Preset>;

export type PresetId = keyof typeof presets;
export const presetIds = Object.keys(presets) as PresetId[];
export const isPreset = (id: string): id is PresetId => Object.hasOwn(presets, id);

export function presetItems(id: PresetId, makeId: () => string = () => crypto.randomUUID()): Item[] {
  return presets[id].items.map(([name, quantity, unit]) => ({ id: makeId(), name, quantity: Math.round(quantity * 100), unit, unitPrice: null }));
}
