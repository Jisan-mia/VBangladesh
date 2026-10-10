import { districtName, isDistrictId, type DistrictId } from './districts';

export const MAX_WORD = 20;

export const objects = [
  { id: 'guava', name: 'পেয়ারা', line: 'গাছে উঠে পাড়ার সময় এই নামেই ডাকাডাকি চলত।' },
  { id: 'kite', name: 'ঘুড়ি', line: 'ছাদ থেকে সুতো ছাড়ার সময় মুখে এই নামটাই আসে।' },
  { id: 'pitcher', name: 'কলস', line: 'পুকুরঘাট থেকে পানি আনার দিনে এই নামই শুনেছি।' },
  { id: 'top', name: 'লাটিম', line: 'উঠানে ঘোরানোর সময় এই নামেই হাঁক দিতাম।' },
  { id: 'fish', name: 'মাছ', line: 'ঘাটে জাল টানার সময় এই নামটাই শুনে এসেছি।' },
  { id: 'lotus', name: 'শাপলা', line: 'বর্ষার বিলে এই নামেই ফোটে।' },
] as const;
export type ObjectId = typeof objects[number]['id'];
const isObjectId = (id: string): id is ObjectId => objects.some(object => object.id === id);
export const objectOf = (id: ObjectId) => objects.find(object => object.id === id)!;

export type LanguageCard = { objectId: ObjectId; word: string; district: DistrictId | '' };
export const defaultCard: LanguageCard = { objectId: 'guava', word: '', district: '' };

const numbers = new Intl.NumberFormat('bn-BD');
export const bn = (value: number) => numbers.format(value);

const segmenter = new Intl.Segmenter('bn', { granularity: 'grapheme' });
const unsafe = /[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g;

/** While typing: no control or direction characters, at most `length` whole letters (a conjunct is never cut). */
export function limitText(text: string, length: number) {
  return Array.from(segmenter.segment(text.replace(unsafe, ' ')), part => part.segment).slice(0, length).join('');
}

/** For cards and links: NFC, single spaces, trimmed and capped. */
export const cleanWord = (text: string) => limitText(text.normalize('NFC').replace(unsafe, ' ').replace(/\s+/g, ' ').trim(), MAX_WORD).trim();

/** A new picture starts empty, so the card shows that picture's own name until you type yours. */
export function selectCardObject(card: LanguageCard, objectId: ObjectId): LanguageCard {
  return card.objectId === objectId ? card : { ...card, objectId, word: '' };
}

export function shareHash(card: LanguageCard) {
  const params = new URLSearchParams({ o: card.objectId });
  const word = cleanWord(card.word);
  if (word) params.set('w', word);
  if (card.district) params.set('d', card.district);
  return '#' + params.toString();
}

/** A shared card, or null for anything that isn't one (in-page anchors like #result included). */
export function parseShareHash(hash: string): LanguageCard | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const objectId = params.get('o') ?? '';
  if (!isObjectId(objectId)) return null;
  const district = params.get('d') ?? '';
  return { objectId, word: cleanWord(params.get('w') ?? ''), district: isDistrictId(district) ? district : '' };
}

export type CardText = { word: string; place: string; kicker: string; bookName: string; line: string; match: string };

export function cardText(card: LanguageCard, friend?: LanguageCard | null): CardText {
  const object = objectOf(card.objectId);
  const word = cleanWord(card.word) || object.name;
  const place = card.district ? `${districtName(card.district)} জেলায়` : 'আমাদের এলাকায়';
  let match = '';
  if (friend && friend.objectId === card.objectId) {
    const theirs = cleanWord(friend.word) || object.name;
    match = theirs === word ? 'বন্ধুর ওখানেও ঠিক এই নাম!' : `${friend.district ? `${districtName(friend.district)} জেলায়` : 'বন্ধুর ওখানে'} বলে “${theirs}”`;
  }
  return { word, place, kicker: `${place} এটাকে বলে`, bookName: word === object.name ? '' : object.name, line: object.line, match };
}

export function previewTitle(card: LanguageCard) {
  const { word, place } = cardText(card);
  return `${place} ${objectOf(card.objectId).name}কে বলে “${word}” — তোমাদের ওখানে কী বলে?`;
}
