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
