export const plants = [
  { id: 'vine', name: 'মানিপ্ল্যান্ট', detail: 'লতানো পাতার গাছ' },
  { id: 'basil', name: 'তুলসী', detail: 'ছোট সবুজ ঝোপ' },
  { id: 'marigold', name: 'গাঁদা', detail: 'হলুদ-কমলা ফুল' },
  { id: 'aloe', name: 'অ্যালোভেরা', detail: 'লম্বা মোটা পাতা' },
  { id: 'hibiscus', name: 'জবা', detail: 'লাল ফুলের গাছ' },
] as const;
export type PlantId = typeof plants[number]['id'];
export const slots = [
  { x: 276, y: 324, size: .8, label: 'বাঁ দিকের তাক' },
  { x: 392, y: 356, size: .8, label: 'ডান দিকের তাক' },
  { x: 213, y: 464, size: 1.05, label: 'মেঝের বাঁ কোণ' },
  { x: 362, y: 502, size: .95, label: 'মেঝের মাঝখান' },
  { x: 514, y: 535, size: 1.1, label: 'মেঝের ডান কোণ' },
  { x: 671, y: 415, size: 1.05, label: 'জানালার পাশে' },
] as const;
export const initialGarden: Array<PlantId | null> = ['vine', 'basil', 'hibiscus', null, 'aloe', 'marigold'];
export function replacePlant(garden: Array<PlantId | null>, index: number, plant: PlantId | null) {
  if (!Number.isInteger(index) || index < 0 || index >= slots.length || garden.length !== slots.length) return garden;
  return garden.map((item, position) => position === index ? plant : item);
}
export function gardenList(garden: Array<PlantId | null>) {
  return plants.map(plant => ({ ...plant, count: garden.filter(id => id === plant.id).length })).filter(plant => plant.count > 0);
}

export function swapPlants(garden: Array<PlantId | null>, from: number, to: number) {
  if (garden.length !== slots.length || ![from, to].every(index => Number.isInteger(index) && index >= 0 && index < slots.length) || from === to || garden[from] === garden[to]) return garden;
  return garden.map((plant, index) => index === from ? garden[to] : index === to ? garden[from] : plant);
}

export type GardenPoint = { x: number; y: number };

export function draggedPotPosition(origin: GardenPoint, start: GardenPoint, current: GardenPoint): GardenPoint {
  return { x: origin.x + current.x - start.x, y: origin.y + current.y - start.y };
}

export function nearestSlot(point: GardenPoint): number | null {
  let nearest: number | null = null;
  let distance = 80;
  slots.forEach((slot, index) => {
    const nextDistance = Math.hypot(point.x - slot.x, point.y - slot.y);
    if (nextDistance < distance) { nearest = index; distance = nextDistance; }
  });
  return nearest;
}
