export const days = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'] as const;
export const parts = ['সকাল', 'দুপুর', 'বিকেল', 'রাত'] as const;
export const colors = [
  { id: 'blue', name: 'নীল', fill: '#e2eafa' },
  { id: 'green', name: 'সবুজ', fill: '#e1eee4' },
  { id: 'yellow', name: 'হলুদ', fill: '#fbefce' },
  { id: 'pink', name: 'গোলাপি', fill: '#f4e2e5' },
] as const;
export type ColorId = typeof colors[number]['id'];
export type Cell = { text: string; color: ColorId };
export type Routine = { title: string; cells: Cell[] };
export const CELL_COUNT = days.length * parts.length;
export const grid = { x: 192, y: 216, width: 204, height: 114, gap: 8 } as const;

export function limitText(text: string, count: number): string {
  return Array.from(new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(text.replace(/[\r\n\t]/g, ' ')), part => part.segment).slice(0, count).join('');
}

export function cellName(index: number): string {
  return `${days[Math.floor(index / parts.length)]}, ${parts[index % parts.length]}`;
}

export function presetCells(preset: 'study' | 'home' | 'empty'): Cell[] {
  const cells: Cell[] = Array.from({ length: CELL_COUNT }, () => ({ text: '', color: 'blue' }));
  if (preset === 'study') {
    [0, 4, 8, 12, 16].forEach(index => { cells[index] = { text: 'নিজের পড়া', color: 'blue' }; });
    [2, 10, 18].forEach(index => { cells[index] = { text: 'হাঁটা ও বিরতি', color: 'green' }; });
    cells[23] = { text: 'বই ও খাতা গুছানো', color: 'yellow' };
    cells[26] = { text: 'পরিবারের সময়', color: 'pink' };
  } else if (preset === 'home') {
    cells[0] = { text: 'ঘর গুছানো', color: 'yellow' };
    cells[5] = { text: 'বাজারের তালিকা', color: 'blue' };
    cells[10] = { text: 'গাছে পানি', color: 'green' };
    cells[15] = { text: 'কাপড় গুছানো', color: 'pink' };
    cells[24] = { text: 'সকালের নাশতা', color: 'yellow' };
    cells[26] = { text: 'সবাই মিলে আড্ডা', color: 'green' };
  }
  return cells;
}

export function editCell(cells: Cell[], index: number, change: Partial<Cell>): Cell[] {
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT || cells.length !== CELL_COUNT) return cells;
  return cells.map((cell, position) => position === index ? { ...cell, ...change, text: limitText(change.text ?? cell.text, 32) } : cell);
}

export function swapCells(cells: Cell[], from: number, to: number): Cell[] {
  if (cells.length !== CELL_COUNT || ![from, to].every(index => Number.isInteger(index) && index >= 0 && index < CELL_COUNT) || from === to) return cells;
  return cells.map((cell, index) => index === from ? cells[to] : index === to ? cells[from] : cell);
}

export function cellPosition(index: number) {
  return { x: grid.x + (index % parts.length) * (grid.width + grid.gap), y: grid.y + Math.floor(index / parts.length) * (grid.height + grid.gap) };
}

export function cellAt(point: { x: number; y: number }): number | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  const x = point.x - grid.x;
  const y = point.y - grid.y;
  if (x < 0 || y < 0) return null;
  const column = Math.floor(x / (grid.width + grid.gap));
  const row = Math.floor(y / (grid.height + grid.gap));
  if (column >= parts.length || row >= days.length || x % (grid.width + grid.gap) >= grid.width || y % (grid.height + grid.gap) >= grid.height) return null;
  return row * parts.length + column;
}

export function cellLines(text: string): string[] {
  const graphemes = Array.from(new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(text), part => part.segment);
  return [graphemes.slice(0, 16).join(''), graphemes.slice(16).join('')].filter(Boolean);
}
