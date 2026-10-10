import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Tools whose real-card thumbnail exists in public/previews (generated per tool after it's built). Read at build time.
export function previewSlugs(): string[] {
  try {
    return readdirSync(join(process.cwd(), 'public', 'previews')).filter(file => file.endsWith('.webp')).map(file => file.slice(0, -5));
  } catch {
    return [];
  }
}
