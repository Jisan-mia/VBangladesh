export const objects = {
  house: { label: 'টিনের ঘর', width: 206, height: 171 },
  tree: { label: 'আমগাছ', width: 174, height: 211 },
  tubewell: { label: 'টিউবওয়েল', width: 93, height: 110 },
  mat: { label: 'শীতলপাটি', width: 150, height: 65 },
  stool: { label: 'মোড়া', width: 76, height: 65 },
  kite: { label: 'ঘুড়ি', width: 100, height: 190 },
  plant: { label: 'ফুলের টব', width: 90, height: 105 },
  clothesline: { label: 'কাপড়ের দড়ি', width: 185, height: 155 },
  tank: { label: 'পানির ট্যাংক', width: 132, height: 154 },
  chair: { label: 'বেতের চেয়ার', width: 88, height: 114 },
  cat: { label: 'বিড়াল', width: 83, height: 58 },
  bicycle: { label: 'সাইকেল', width: 172, height: 104 },
  cricket: { label: 'ব্যাট-বল', width: 79, height: 93 },
  tea: { label: 'চায়ের আড্ডা', width: 113, height: 71 },
} as const;
export type ObjectKind = keyof typeof objects;
export type Setting = 'courtyard' | 'rooftop';
export type Position = { x: number; y: number };
export type SceneObject = Position & { id: string; kind: ObjectKind };
export const MAX_OBJECTS = 18;

export function boundPosition(point: Position): Position {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('জায়গাটি বেছে নেওয়া যায়নি। আবার চাপুন।');
  const x = point.x - 480;
  const y = point.y - 425;
  const distance = Math.abs(x) / 355 + Math.abs(y) / 180;
  const divisor = Math.max(1, distance);
  return { x: 480 + x / divisor, y: 425 + y / divisor };
}

export function addObject(items: SceneObject[], object: Pick<SceneObject, 'id' | 'kind'>): SceneObject[] {
  if (items.length >= MAX_OBJECTS) throw new Error('এক দৃশ্যে সর্বোচ্চ ১৮টি জিনিস রাখা যাবে। আগে একটি সরান।');
  if (items.some(item => item.id === object.id)) throw new Error('জিনিসটি যোগ করা যায়নি। আবার চেষ্টা করুন।');
  const position = boundPosition({ x: 480 + ((items.length % 3) - 1) * 42, y: 440 + (Math.floor(items.length / 3) % 3) * 23 });
  return [...items, { ...object, ...position }];
}

export function moveObject(items: SceneObject[], id: string, position: Position): SceneObject[] {
  const bounded = boundPosition(position);
  return items.map(item => item.id === id ? { ...item, ...bounded } : item);
}

export function removeObject(items: SceneObject[], id: string): SceneObject[] {
  return items.filter(item => item.id !== id);
}

export function starterScene(): SceneObject[] {
  return [
    { id: 'starter-1', kind: 'house', x: 355, y: 360 },
    { id: 'starter-2', kind: 'tree', x: 660, y: 370 },
    { id: 'starter-3', kind: 'tubewell', x: 680, y: 455 },
    { id: 'starter-4', kind: 'mat', x: 475, y: 495 },
    { id: 'starter-5', kind: 'cat', x: 535, y: 533 },
    { id: 'starter-6', kind: 'kite', x: 505, y: 365 },
  ];
}
