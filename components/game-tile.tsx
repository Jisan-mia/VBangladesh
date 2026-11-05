import Link from 'next/link';
import type { ToolListing } from '../lib/catalog';

const firstLetter = (name: string) => [...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(name)][0]?.segment ?? '';

/**
 * One square game tile: the game's own play area as the picture, its Bangla name below.
 * The image box has a fixed aspect ratio, so nothing shifts while tiles load.
 * `image` is 'tile' (public/tiles), 'preview' (the top of the share card, for non-games) or absent (a letter).
 * `big` makes a 2×2 tile against the left or right edge of the grid.
 */
export function GameTile({ tool, image, eager = false, big, tags }: { tool: ToolListing; image?: 'tile' | 'preview'; eager?: boolean; big?: 'left' | 'right'; tags?: readonly string[] }) {
  return <li className={big ? `gt gt-big gt-big-${big}` : 'gt'} data-tags={tags?.join(' ') || undefined}>
    <Link href={`/${tool.slug}`} prefetch={false} title={tool.description}>
      <span className={image === 'preview' ? 'gt-art gt-art-card' : 'gt-art'}>
        {image
          // A plain img: tiles are already 320px WebP, the image optimiser would only re-encode them.
          ? <img src={`/${image === 'tile' ? 'tiles' : 'previews'}/${tool.slug}.webp`} alt="" width={320} height={image === 'tile' ? 320 : 427} loading={eager ? 'eager' : 'lazy'} decoding="async" />
          : <span className="gt-letter" aria-hidden="true">{firstLetter(tool.name)}</span>}
      </span>
      <span className="gt-name">{tool.name}</span>
    </Link>
  </li>;
}

/** Which picture a tool's tile gets, from the sets of tiles and share-card previews on disk. */
export const tileImage = (slug: string, tiles: Set<string>, previews: Set<string>) => tiles.has(slug) ? 'tile' as const : previews.has(slug) ? 'preview' as const : undefined;
