import { validateBasket, type Basket } from './basket';
export const STORAGE_KEY = 'bazar-note-basket';

type BasketStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function loadBasket(storage: Pick<Storage, 'getItem'>): Basket | null {
  const stored = storage.getItem(STORAGE_KEY);
  return stored === null ? null : validateBasket(JSON.parse(stored));
}

export function saveBasket(storage: BasketStorage, basket: Basket): void {
  loadBasket(storage);
  storage.setItem(STORAGE_KEY, JSON.stringify(validateBasket(basket)));
}

// Who the list is from and which starter it came from; kept apart so old saved baskets stay valid.
export const META_KEY = 'bazar-note-meta';

export function loadMeta(storage: Pick<Storage, 'getItem'>): { name: string; preset: string } {
  try {
    const value: unknown = JSON.parse(storage.getItem(META_KEY) ?? '{}');
    const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
    return { name: typeof record.name === 'string' ? record.name : '', preset: typeof record.preset === 'string' ? record.preset : '' };
  } catch { return { name: '', preset: '' }; }
}
