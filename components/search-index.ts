// Loaded only when someone focuses the header search, so the catalog stays out of every page's first bundle.
import { catalog } from '../lib/catalog';
import { isAnyGame } from '../lib/portal';
import { makeSearch } from '../lib/search';
import { searchKeywords } from '../lib/search-keywords';

export type Hit = { slug: string; name: string; label: string; game: boolean };

const ranked = makeSearch(catalog, searchKeywords);

export function findTools(query: string, limit = 6): Hit[] {
  const typed = query.trim().normalize('NFC');
  if (!typed) return [];
  // The phonetic match folds ব/ভ and গ/ঘ together, so "বাঘ" also finds "ভাগ". A name with the exact
  // letters typed goes first; the sort is stable, so the rest keep their rank.
  const exact = (name: string) => (name.normalize('NFC').includes(typed) ? 0 : 1);
  return ranked(query).sort((a, b) => exact(a.name) - exact(b.name)).slice(0, limit).map(tool => ({ slug: tool.slug, name: tool.name, label: tool.category, game: isAnyGame(tool) }));
}
