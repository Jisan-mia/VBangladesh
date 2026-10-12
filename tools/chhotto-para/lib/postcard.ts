import { boundPosition, MAX_OBJECTS, objects, type ObjectKind, type SceneObject, type Setting } from './scene';
import { possessive } from '../../../shared/bangla';

export const MAX_PLACE_LENGTH = 24;
export const MAX_DISTRICT_LENGTH = 16;
export const MAX_NAME_LENGTH = 30;

export type Postcard = { setting: Setting; items: SceneObject[]; place: string; district: string; name: string };

const numbers = new Intl.NumberFormat('bn-BD');
export const bn = (value: number) => numbers.format(value);

export function cleanText(value: string, max: number) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return value.normalize('NFC').replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, '').trim().replace(/\s+/g, ' ').slice(0, max);
}


// The most recently placed object with a memory decides the card's line, so it follows what the person added.
const memories: Partial<Record<ObjectKind, string>> = {
  kite: 'বিকেল হলেই আকাশে ঘুড়ি, নাটাই হাতে ছুটোছুটি।',
  tubewell: 'টিউবওয়েলের ঠান্ডা পানি আর উঠোনভরা রোদ।',
  cricket: 'উঠোনেই চলত বিকেলের ক্রিকেট, জানালার কাচ সাবধান!',
  tea: 'সন্ধ্যা নামলে চায়ের কাপে জমত আড্ডা।',
  mat: 'শীতলপাটিতে শুয়ে দুপুরের গল্প।',
  tree: 'আমগাছের ছায়ায় কাটত লম্বা দুপুর।',
  cat: 'বিড়ালটাও জানত, উঠোনের কোথায় রোদ পড়ে।',
  clothesline: 'রোদে শুকাত কাপড়, বাতাসে দুলত দড়ি।',
  bicycle: 'সাইকেলের বেল শুনলেই বুঝতাম, কে এল।',
  stool: 'মোড়ায় বসে মুড়ি-চানাচুরের আড্ডা।',
  tank: 'পানির ট্যাংকের ছায়ায় লুকোচুরি।',
  chair: 'বেতের চেয়ারে বসে বিকেলের খবরের কাগজ।',
  plant: 'টবের ফুলে রোজ সকালে পানি দিতাম।',
};

export function memoryLine(items: readonly SceneObject[], setting: Setting) {
  const kind = items.findLast(item => memories[item.kind])?.kind;
  return kind ? memories[kind]! : setting === 'rooftop' ? 'ছাদে উঠলেই বিকেলটা লম্বা হয়ে যেত।' : 'উঠোনে পা দিলেই রোদ গায়ে লাগত।';
}

export function cardText(card: Postcard) {
  const place = cleanText(card.place, MAX_PLACE_LENGTH);
  const name = cleanText(card.name, MAX_NAME_LENGTH);
  return {
    place: place || 'আমার পাড়া',
    district: cleanText(card.district, MAX_DISTRICT_LENGTH),
    greeting: `${place || 'আমার পাড়া'} থেকে`,
    line: memoryLine(card.items, card.setting),
    signature: name ? `ইতি, ${name}` : '',
  };
}

// Objects travel as five characters: kind, then x and y as two base-64 digits each (whole scene units).
// The kind order and the alphabet are link codes: add new objects at the end of `objects`, never reorder.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const kinds = Object.keys(objects) as ObjectKind[];

export function encodeItems(items: readonly SceneObject[]) {
  const digits = (value: number) => B64[Math.round(value) >> 6] + B64[Math.round(value) & 63];
  return items.slice(0, MAX_OBJECTS).map(item => B64[kinds.indexOf(item.kind)] + digits(item.x) + digits(item.y)).join('');
}

export function decodeItems(code: string): SceneObject[] {
  if (!code || code.length % 5 || code.length > MAX_OBJECTS * 5 || /[^A-Za-z0-9_-]/.test(code)) return [];
  const value = (at: number) => B64.indexOf(code[at]) * 64 + B64.indexOf(code[at + 1]);
  return Array.from({ length: code.length / 5 }, (_, index) => ({ kind: kinds[B64.indexOf(code[index * 5])], x: value(index * 5 + 1), y: value(index * 5 + 3), index }))
    .filter(item => item.kind)
    .map(({ kind, x, y, index }) => ({ id: `shared-${index}`, kind, ...boundPosition({ x, y }) }));
}

export function shareHash(card: Postcard) {
  const params = new URLSearchParams({ s: card.setting === 'rooftop' ? 'r' : 'c', o: encodeItems(card.items) });
  const place = cleanText(card.place, MAX_PLACE_LENGTH), district = cleanText(card.district, MAX_DISTRICT_LENGTH), name = cleanText(card.name, MAX_NAME_LENGTH);
  if (place) params.set('p', place);
  if (district) params.set('z', district);
  if (name) params.set('n', name);
  return params.toString();
}

export function parseShareHash(hash: string): Postcard | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const items = decodeItems(params.get('o') ?? '');
  if (!items.length) return null;
  return {
    setting: params.get('s') === 'r' ? 'rooftop' : 'courtyard',
    items,
    place: cleanText(params.get('p') ?? '', MAX_PLACE_LENGTH),
    district: cleanText(params.get('z') ?? '', MAX_DISTRICT_LENGTH),
    name: cleanText(params.get('n') ?? '', MAX_NAME_LENGTH),
  };
}

export { possessive };
