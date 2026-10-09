export const palettes = [
  { id: 'leaf', label: 'পাতার সবুজ', body: '#188577', wing: '#f0b947', beak: '#e07645', detail: '#fff3cb', backdrop: '#e6efe6' },
  { id: 'sun', label: 'রোদেলা হলুদ', body: '#edb848', wing: '#b94750', beak: '#a74732', detail: '#fff6d9', backdrop: '#f8ecd1' },
  { id: 'berry', label: 'জামের বেগুনি', body: '#775484', wing: '#e3a250', beak: '#cd6e4d', detail: '#fce6da', backdrop: '#eee3ee' },
  { id: 'sky', label: 'আকাশের নীল', body: '#428fa4', wing: '#eca098', beak: '#c66f3b', detail: '#eef5db', backdrop: '#dfeef0' },
] as const;

export const patterns = [
  { id: 'flowers', label: 'ফুল' },
  { id: 'dots', label: 'ফোঁটা' },
  { id: 'stripes', label: 'ডোরা' },
  { id: 'plain', label: 'সাদামাটা' },
] as const;

export type Palette = typeof palettes[number];
export type BirdDesign = { paletteId: Palette['id']; pattern: typeof patterns[number]['id']; name: string; finish: 'color' | 'outline' };
export const birdPresets = [
  { label: 'ফুলে সবুজ', paletteId: 'leaf', pattern: 'flowers' },
  { label: 'হলুদে ফোঁটা', paletteId: 'sun', pattern: 'dots' },
  { label: 'নীলে ডোরা', paletteId: 'sky', pattern: 'stripes' },
] as const;
export const defaultDesign: BirdDesign = { paletteId: 'leaf', pattern: 'flowers', name: '', finish: 'color' };
export const drawingName = (name: string) => name.trim().slice(0, 24) || 'আমার কাগজের পাখি';
export const paletteFor = (design: BirdDesign): Palette => palettes.find(palette => palette.id === design.paletteId) ?? palettes[0];

export const paper = { width: 210, height: 297, margin: 12 };
export const foot = { left: 30, right: 67, foldY: 77, bottom: 92 };
export const templateFaces = [{ x: 8, y: 49, direction: 1 }, { x: 202, y: 49, direction: -1 }] as const;
type PathCommand = readonly ['M' | 'L', number, number] | readonly ['C', number, number, number, number, number, number] | readonly ['Z'];
export const outline: readonly PathCommand[] = [
  ['M', 30, 77], ['L', 30, 92], ['L', 67, 92], ['L', 67, 77],
  ['C', 82, 71, 86, 57, 80, 43], ['L', 95, 36], ['L', 79, 29],
  ['C', 79, 12, 66, 4, 54, 7], ['C', 42, 8, 36, 17, 35, 30],
  ['L', 32, 42], ['L', 11, 28], ['L', 6, 44], ['L', 20, 54],
  ['C', 17, 66, 22, 74, 30, 77], ['Z'],
];
export const birdPath = outline.map(command => command.join(' ')).join(' ');

export function outlineCoordinates(): Array<{ x: number; y: number }> {
  return outline.flatMap(command => {
    const values = command.slice(1) as number[];
    return Array.from({ length: values.length / 2 }, (_, index) => ({ x: values[index * 2], y: values[index * 2 + 1] }));
  });
}

export function printedBounds(face: typeof templateFaces[number]) {
  const points = outlineCoordinates().map(point => ({ x: face.x + point.x * face.direction, y: face.y + point.y }));
  return { left: Math.min(...points.map(point => point.x)), right: Math.max(...points.map(point => point.x)), top: Math.min(...points.map(point => point.y)), bottom: Math.max(...points.map(point => point.y)) };
}

export const assemblySteps = [
  { title: 'দুটো অংশ কাটো', text: 'বাইরের টানা দাগ ধরে দুটো পাখি কাটো। নিচের চারকোনা পায়ের অংশটাও রেখো। ভাঙা ভাঙা দাগে কেটো না।' },
  { title: 'উল্টো পিঠে জোড়া দাও', text: 'দুটো পাখির সাদা পিঠে আঠা দিয়ে মিলিয়ে লাগাও, রঙিন পিঠ থাকবে বাইরে। পায়ের অংশে আঠা দিয়ো না।' },
  { title: 'পা দুদিকে ভাঁজ করো', text: 'আঠা শুকালে ভাঙা ভাঙা দাগ ধরে একটা পা সামনে, আরেকটা পেছনে সমকোণে ভাঁজ করো। সমান জায়গায় রাখো।' },
];
