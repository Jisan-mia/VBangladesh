'use client';
// The small drawings of the game, all code: a toy, its shadow, the hurricane lamp, the ghost finger, and the tiny wall that
// stands for a level on the title and in the list (the shadows on top, the toys under them).
import type { CSSProperties } from 'react';
import { WALLS, levelOf, type WorldId } from '../lib/levels';
import { shapeOf, silhouette, type Shape } from '../lib/shapes';

/** The world's wall and shadow colours as CSS variables, set on whatever wears them. */
export const worldStyle = (world: WorldId): CSSProperties => ({ '--wall': WALLS[world].wall, '--shade': WALLS[world].shadow } as CSSProperties);

const shades = new Map<string, string>();
/** A shape's flat shadow in the world's dark, built once. */
export function shadeArt(shape: Shape, world: WorldId) {
  const key = `${shape.id}-${world}`;
  let art = shades.get(key);
  if (!art) { art = silhouette(shape.art, WALLS[world].shadow); shades.set(key, art); }
  return art;
}

export function Toy({ shape, className = 'cs-art' }: { shape: Shape; className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: shape.art }} />;
}
export function Shade({ shape, world, className = 'cs-art' }: { shape: Shape; world: WorldId; className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: shadeArt(shape, world) }} />;
}

/** The হারিকেন: cord, brass cap, glass chimney with its wire cage, flame, tank and handle. `lit` lights the flame and the glass. */
export function Lamp({ lit, className = 'cs-lamp' }: { lit: boolean; className?: string }) {
  return <svg className={className} viewBox="0 0 100 150" aria-hidden="true" data-lit={lit || undefined}>
    <path d="M50 0V16" stroke="#4a3a2d" strokeWidth="3" />
    <circle cx="50" cy="19" r="4.5" fill="none" stroke="#4a3a2d" strokeWidth="3" />
    <path d="M32 46Q50 21 68 46Z" fill="#6d5640" />
    <path d="M44 28h12v7H44z" fill="#54422f" />
    <path className="cs-glass" d="M37 46h26l2 22q7 14 2 32H33q-5-18 2-32z" />
    <path d="M37 46l-2 22q-7 14-2 32M63 46l2 22q7 14 2 32M50 46v54" stroke="#6d5640" strokeWidth="1.6" fill="none" opacity=".7" />
    <path className="cs-flame" d="M50 98Q38 86 50 66Q62 86 50 98Z" />
    <path className="cs-flame-core" d="M50 96Q44 88 50 78Q56 88 50 96Z" />
    <path d="M31 100h38q5 17-3 28H34q-8-11-3-28z" fill="#8a6a48" />
    <path d="M34 104h32" stroke="#a98863" strokeWidth="2.5" />
    <path d="M69 108q16 3 14 16" stroke="#6d5640" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>;
}

/** The ghost finger that shows the first drag, so a child who can't read yet knows what to do. */
export function Finger() {
  return <svg className="cs-finger-art" viewBox="0 0 40 52" aria-hidden="true"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2f2a3a" strokeWidth="2.6" strokeLinejoin="round" /></svg>;
}

/** A tiny wall for a level: its shadows above (leaning, turned or flipped when the level turns them), the shelf's toys under them. */
export function MiniWall({ level, className = 'cs-mini' }: { level: number; className?: string }) {
  const spec = levelOf(level), world = spec.world;
  const size = spec.shadows === 1 ? 44 : spec.shadows === 2 ? 34 : 28, toy = spec.toys > 3 ? 22 : 26;
  const turn = (at: number) => spec.turn === 'none' ? '' : spec.turn === 'lean' ? 'rotate(32)' : at % 2 ? 'scale(-1 1)' : 'rotate(90)';
  const row = (count: number, box: number, y: number, art: (index: number) => string, wrap: (index: number) => string) => Array.from({ length: count }, (_, index) => {
    const x = 60 + (index - (count - 1) / 2) * (box + 6) - box / 2;
    return <g key={index} transform={`translate(${x} ${y})`}><g transform={`translate(${box / 2} ${box / 2}) ${wrap(index)} translate(${-box / 2} ${-box / 2})`}>
      <svg width={box} height={box} viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: art(index) }} /></g></g>;
  });
  return <svg className={className} viewBox="0 0 120 92" aria-hidden="true" style={worldStyle(world)}>
    <rect width="120" height="62" fill={WALLS[world].wall} />
    <rect y="62" width="120" height="30" fill="#9a734d" /><rect y="62" width="120" height="4" fill="#6d4f31" />
    {row(spec.shadows, size, 8, index => silhouette(shapeOf(spec.sample[index])!.art, WALLS[world].shadow), turn)}
    {row(spec.toys, toy, 66, index => shapeOf(spec.sample[index])!.art, () => '')}
  </svg>;
}
