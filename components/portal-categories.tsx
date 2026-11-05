import Link from 'next/link';
import type { ReactNode } from 'react';
import { gameFilters, games, gameTags, kidsGames } from '../lib/portal';
import { hubs } from '../lib/hubs';

const bn = new Intl.NumberFormat('bn-BD');

// Simple drawn marks, one per category, so each tile reads at a glance without emoji.
const marks: Record<string, ReactNode> = {
  dhadha: <path d="M9 7h7a3 3 0 1 1 6 0h7v8a3 3 0 1 0 0 6v8h-8a3 3 0 1 1-6 0H9v-8a3 3 0 1 0 0-6Z" />,
  deshi: <><path d="M20 5 31 16 20 27 9 16Z" /><path d="M20 27c0 4-3 5-2 8M9 16h22M20 5v22" /></>,
  arcade: <><rect x="6" y="20" width="28" height="12" rx="4" /><path d="M20 20v-8" /><circle cx="20" cy="9" r="4" /><path d="M12 26h4M14 24v4" /><circle cx="27" cy="26" r="1.6" /></>,
  dujone: <><circle cx="13" cy="13" r="5" /><circle cx="27" cy="13" r="5" /><path d="M4 33c0-6 4-10 9-10s9 4 9 10M18 33c0-6 4-10 9-10s9 4 9 10" /></>,
  chhotoder: <text x="20" y="29" textAnchor="middle" fontSize="23" fontWeight="700" stroke="none" fill="currentColor">অআ</text>,
  quiz: <><path d="M7 9h26v17H18l-7 6v-6H7Z" /><path d="M17 14a3 3 0 1 1 4 3c-1 .5-1 1-1 2M20 22.5v.5" /></>,
};

type Category = { id: string; name: string; href: string; count: number };

export function portalCategories(): Category[] {
  const quiz = hubs.find(hub => hub.slug === 'quiz')!;
  return [
    ...gameFilters.map(filter => ({ id: filter.id, name: filter.name, href: `/games#${filter.id}`, count: games.filter(game => gameTags[game.slug]?.includes(filter.id)).length })),
    { id: 'chhotoder', name: 'ছোটদের', href: '/chhotoder', count: kidsGames.length },
    { id: 'quiz', name: 'কুইজ', href: '/quiz', count: quiz.tools.length },
  ];
}

/** One coloured tile per category. Used on the home page and inside the /games grid. */
export function CategoryTile({ category }: { category: Category }) {
  return <li className={`pc pc-${category.id}`}>
    <Link href={category.href} prefetch={false}>
      <svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{marks[category.id]}</svg>
      <span className="pc-name">{category.name}</span>
      <span className="pc-count">{bn.format(category.count)}টা</span>
    </Link>
  </li>;
}
