import { validateEntries, type Deadline } from './deadlines';
export const STORAGE_KEY = 'shesh-tarikh-entries';
type EntryStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function loadEntries(storage: Pick<Storage, 'getItem'>): Deadline[] | null {
  const stored = storage.getItem(STORAGE_KEY);
  return stored === null ? null : validateEntries(JSON.parse(stored));
}

export function saveEntries(storage: EntryStorage, entries: Deadline[]): void {
  loadEntries(storage);
  storage.setItem(STORAGE_KEY, JSON.stringify(validateEntries(entries)));
}
