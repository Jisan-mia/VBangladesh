export const objects = [
  { id: 'guava', name: 'পেয়ারা', note: 'ফলের নাম' },
  { id: 'kite', name: 'ঘুড়ি', note: 'খেলার সঙ্গী' },
  { id: 'pitcher', name: 'কলস', note: 'ঘরের জিনিস' },
  { id: 'top', name: 'লাটিম', note: 'খেলার সঙ্গী' },
  { id: 'fish', name: 'মাছ', note: 'চেনা প্রাণী' },
  { id: 'lotus', name: 'শাপলা', note: 'চেনা ফুল' },
] as const;
export type ObjectId = typeof objects[number]['id'];
export const palettes = [
  { name: 'নীল খাতা', paper: '#f1f4ff', ink: '#263876', line: '#bdc8e6', seal: '#f1c744' },
  { name: 'লাল খাতা', paper: '#fff3ec', ink: '#8d302a', line: '#e9bcae', seal: '#dfb859' },
  { name: 'সবুজ খাতা', paper: '#eef4e8', ink: '#305443', line: '#bbcfad', seal: '#efbb55' },
] as const;
const segmenter = new Intl.Segmenter('bn', { granularity: 'grapheme' });
export function limitText(text: string, length: number) {
  return Array.from(segmenter.segment(text.replace(/[\u0000-\u001f\u007f]/g, ' ')), part => part.segment).slice(0, length).join('');
}
export function cardLines(text: string) {
  const letters = Array.from(segmenter.segment(text.trim()), part => part.segment);
  return letters.length > 14 ? [letters.slice(0, 14).join(''), letters.slice(14, 28).join('')] : [letters.join('')];
}

export type LanguageCard = { objectId: ObjectId; word: string; area: string; pronunciation: string; paletteIndex: number };
export const defaultCard: LanguageCard = { objectId: 'guava', word: 'পেয়ারা', area: '', pronunciation: '', paletteIndex: 0 };

export function selectCardObject(card: LanguageCard, objectId: ObjectId): LanguageCard {
  if (card.objectId === objectId) return card;
  return { ...card, objectId, word: objects.find(item => item.id === objectId)!.name, pronunciation: '' };
}
