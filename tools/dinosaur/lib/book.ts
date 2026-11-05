// The finder's book: ids of every dinosaur found on this phone, in the book's order. Anything unknown is dropped.
import { DINOS } from "./dinos";

export const BOOK_KEY = "ektukhani-dinosaur-book";
export function readBook(raw: string | null): string[] {
  try {
    const saved = JSON.parse(raw ?? "[]");
    if (!Array.isArray(saved)) return [];
    return DINOS.map(dino => dino.id).filter(id => saved.includes(id));
  } catch { return []; }
}
export const addToBook = (book: readonly string[], id: string) => DINOS.map(dino => dino.id).filter(each => each === id || book.includes(each));
