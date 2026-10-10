// Line drawings on a 100×100 grid, one per game: the same path data draws the SVG on the page and the poster on canvas.
export type Drawing = { path: string; labels?: Array<{ text: string; x: number; y: number; size: number }> };

const dot = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0 ${r} ${r} 0 1 0 ${-r * 2} 0`;
// Seven children sitting in a ring, as seen from above, with a gap where the runner left.
const ring = Array.from({ length: 7 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  return dot(Math.round(44 + Math.cos(angle) * 26), Math.round(56 + Math.sin(angle) * 26), 5);
}).join('');

export const drawings: Record<string, Drawing> = {
  'word-relay': {
    path: 'M16 14h38a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H30l-10 9v-9h-4a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6ZM46 54h38a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-4v9l-10-9H46a6 6 0 0 1-6-6V60a6 6 0 0 1 6-6ZM66 30c10 0 14 6 14 18m-5-4 5 5 5-5',
    labels: [{ text: 'কলম', x: 35, y: 34, size: 13 }, { text: 'মাছ', x: 65, y: 74, size: 13 }],
  },
  'name-place': {
    path: 'M10 12h62v80H10ZM10 28h62M25.5 12v80M41 12v80M56.5 12v80M10 46h62M10 64h62M10 82h62M74 82l12-44 7 2-12 44-6 4ZM86 38l2-7 7 2-2 7',
    labels: [{ text: 'নাম', x: 17.75, y: 24, size: 7 }, { text: 'দেশ', x: 33.25, y: 24, size: 7 }, { text: 'ফুল', x: 48.75, y: 24, size: 7 }, { text: 'ফল', x: 64.25, y: 24, size: 7 }],
  },
  'twenty-questions': {
    path: `${dot(28, 66, 11)}M10 98c2-12 9-17 18-17s16 5 18 17${dot(44, 52, 3)}${dot(51, 42, 4.5)}M52 34c-9 0-11-13-2-15 1-10 15-12 19-5 7-7 21-3 19 7 8 3 6 14-3 13ZM62 19c0-6 11-6 11 0 0 5-6 5-6 9M67 32v1`,
  },
  'silent-acting': {
    path: `${dot(40, 50, 24)}M31 43v3M49 43v3M33 58h14M40 50v26M33 78c0-6 14-6 14 0v14H33ZM68 12h26v18H82l-6 6v-6h-8ZM66 36l30-28`,
  },
  kitkit: {
    path: 'M38 94V40h24v54ZM38 76h24M38 58h24M26 40V22h48v18M50 22v18M38 22V4h24v18M78 84c3-3 9-2 10 2 1 4-5 6-9 5-3-1-3-5-1-7Z',
    labels: [{ text: '১', x: 50, y: 90, size: 12 }, { text: '২', x: 50, y: 72, size: 12 }, { text: '৩', x: 50, y: 54, size: 12 }, { text: '৪', x: 38, y: 36, size: 12 }, { text: '৫', x: 62, y: 36, size: 12 }, { text: '৬', x: 50, y: 18, size: 12 }],
  },
  gollachhut: {
    path: `M4 92h92M8 84a14 6 0 1 0 28 0 14 6 0 1 0-28 0M22 84V72${dot(20, 48, 5)}M20 53v14l-5 12M20 67l5 12M20 57l-6 9M20 57l10 3${dot(58, 34, 5)}M58 39l-3 15-8 11M55 54l9 8 3 10M57 44l-10 5M57 44l9-7M88 92V40l-12 7 12 7M42 44h-9M44 54h-9`,
  },
  kanamachhi: {
    path: `${dot(50, 24, 11)}M38 22h24M62 22l8-5M62 22l8 4M50 35v27l-11 28M50 62l11 28M50 43l-24-6M50 43l24-6M14 30c-5 5-5 12 0 17M86 30c5 5 5 12 0 17M7 25c-8 8-8 19 0 27M93 25c8 8 8 19 0 27`,
  },
  'rumal-churi': {
    path: `${ring}M72 22l12-3 3 12-12 3ZM75 26l8-2${dot(88, 50, 4)}M88 54l-2 12-6 8M86 66l6 6 2 8M87 58l-7-2M87 58l7-5M66 84c8 2 14-4 16-10`,
  },
  lukochuri: {
    path: `M64 94V58M76 94V58M50 60c-9-2-9-16 1-18 0-12 16-16 22-8 8-6 22 0 20 10 9 7 4 18-5 17-6 5-29 5-38-1Z${dot(83, 70, 5)}M78 78h-2${dot(22, 40, 7)}M15 40h14M22 47v22l-7 21M22 69l7 21M22 52l-6-10M22 52l6-10M6 92h92`,
    labels: [{ text: '১, ২, ৩…', x: 22, y: 22, size: 9 }],
  },
  dariabandha: {
    path: `M20 8h60v84H20ZM50 8v84M20 36h60M20 64h60${dot(35, 8, 4)}M29 8h12${dot(65, 36, 4)}M59 36h12${dot(35, 64, 4)}M29 64h12${dot(65, 92, 4)}M59 92h12M34 98c-2-14 12-16 10-28s-12-16-6-28M34 48l4-6 3 6`,
  },
};
