import { crossSite, fail, rateLimited, readJson } from '../../../lib/server/guard';
import { createShare } from '../../../lib/server/store';
import { toolShare } from '../../../lib/share-registry';
import { MAX_SHARE_STATE } from '../../../shared/share-types';

// Turns a tool's card state into a short /s/<id> link whose preview shows the sharer's own result.
export async function POST(request: Request) {
  if (crossSite(request)) return fail('cross-site', 403);
  if (rateLimited(request, 'share', 30)) return fail('slow-down', 429);
  const body = await readJson(request);
  const tool = typeof body?.tool === 'string' ? body.tool : '';
  const raw = typeof body?.state === 'string' ? body.state.replace(/^#/, '') : '';
  const share = toolShare(tool);
  if (!share || !raw || raw.length > MAX_SHARE_STATE) return fail('invalid', 400);
  const state = share.normalize(raw);
  if (!state || state.length > MAX_SHARE_STATE) return fail('invalid', 400);
  const id = createShare(tool, state);
  return Response.json({ id, path: `/s/${id}` }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
