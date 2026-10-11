import { crossSite, fail, rateLimited, readJson } from '../../../../lib/server/guard';
import { readTally, recordTally } from '../../../../lib/server/store';
import { toolShare } from '../../../../lib/share-registry';

type Context = { params: Promise<{ tool: string }> };

const prefixOf = (request: Request) => (new URL(request.url).searchParams.get('prefix') ?? '').slice(0, 40);

// Anonymous "compare with everyone" counts. No name, photo or IP is stored, only a hashed random browser token.
export async function GET(request: Request, { params }: Context) {
  const { tool } = await params;
  if (!toolShare(tool)?.tally) return fail('unknown-tool', 404);
  return Response.json(readTally(tool, prefixOf(request)), { headers: { 'Cache-Control': 'public, max-age=30' } });
}

export async function POST(request: Request, { params }: Context) {
  const { tool } = await params;
  const allowed = toolShare(tool)?.tally;
  if (!allowed) return fail('unknown-tool', 404);
  if (crossSite(request)) return fail('cross-site', 403);
  if (rateLimited(request, 'tally', 20)) return fail('slow-down', 429);
  const body = await readJson(request);
  const token = typeof body?.token === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(body.token) ? body.token : '';
  const items = Array.isArray(body?.items) ? body.items : null;
  const group = typeof body?.group === 'string' ? body.group : '';
  if (!token || !items || items.length > allowed.length || !items.every(item => typeof item === 'string' && allowed.includes(item)) || !/^[A-Za-z0-9_.:-]{0,40}$/.test(group)) return fail('invalid', 400);
  return Response.json(recordTally(tool, token, [...new Set(items as string[])], prefixOf(request), group), { headers: { 'Cache-Control': 'no-store' } });
}
