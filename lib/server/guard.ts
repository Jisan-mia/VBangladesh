// Request hygiene shared by every API route: same-origin writes, small bodies, per-client rate limits.
const hits = new Map<string, number[]>();

function clientKey(request: Request) {
  // Behind a reverse proxy the first forwarded address is the visitor; without one every request shares a bucket.
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
}

/** shortcut: limits live in this process's memory, so they reset on restart and aren't shared across instances; move to Redis/SQLite when running more than one server. */
export function rateLimited(request: Request, bucket: string, max: number, windowMs = 60_000) {
  const key = `${bucket}:${clientKey(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(time => now - time < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [entry, times] of hits) if (now - (times.at(-1) ?? 0) > windowMs) hits.delete(entry);
  return recent.length > max;
}

/** Blocks other sites from posting into our tallies from a visitor's browser. Requests without Origin (curl, old browsers) pass. */
export function crossSite(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try { return new URL(origin).host !== host; } catch { return true; }
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
