import { crossSite, fail, rateLimited, readJson } from '../../../lib/server/guard';
import { addSuggestion } from '../../../lib/server/store';
import { getToolContent } from '../../../lib/tool-content';

// "What should we add?" notes from visitors; read them with `npm run suggestions`.
export async function POST(request: Request) {
  if (crossSite(request)) return fail('cross-site', 403);
  if (rateLimited(request, 'suggest', 5)) return fail('slow-down', 429);
  const body = await readJson(request, 4096);
  const tool = typeof body?.tool === 'string' && (body.tool === 'site' || getToolContent(body.tool)) ? body.tool : '';
  const text = typeof body?.text === 'string' ? body.text.replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  if (!tool || text.length < 2 || text.length > 300) return fail('invalid', 400);
  addSuggestion(tool, text);
  return Response.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
