import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Games whose square portal tile exists in public/tiles (made by scripts/tile-image.mjs). Read at build time.
export function tileSlugs(): string[] {
  try {
    return readdirSync(join(process.cwd(), 'public', 'tiles')).filter(file => file.endsWith('.webp')).map(file => file.slice(0, -5));
  } catch {
    return [];
  }
}
