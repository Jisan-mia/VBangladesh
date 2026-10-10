import assert from 'node:assert/strict';
import { toolSlugs } from '../lib/tool-content.ts';
import { catalog } from '../lib/catalog.ts';
import { publicOrigin } from '../shared/seo.ts';

assert.equal(process.argv.length, 2, 'Use SITE_CHECK_ORIGIN to select the single app origin; command flags are not supported.');
const origin = new URL(process.env.SITE_CHECK_ORIGIN || 'http://127.0.0.1:3100');
assert.ok(['http:', 'https:'].includes(origin.protocol) && origin.pathname === '/' && !origin.search && !origin.hash && !origin.username && !origin.password, 'SITE_CHECK_ORIGIN must be an HTTP(S) origin.');
const publishedOrigin = publicOrigin(process.env.SITE_URL);
const bengali = /[\u0980-\u09ff]/;
const oldToolPort = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):(?:310[1-9]|311[0-3])(?:\/|$)/;
const routes = ['/', '/tools', '/about', '/privacy', ...toolSlugs.flatMap(slug => [`/${slug}`, `/${slug}/guide`, `/${slug}/privacy`])];
const routeSet = new Set(routes);
const uniqueValues = { title: new Map(), description: new Map(), heading: new Map() };
const assets = new Set(['/icon.svg', '/fonts/bangla.woff2', '/fonts/latin.woff2']);

function decodeEntities(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, name) => {
    if (name.startsWith('#')) return String.fromCodePoint(parseInt(name.slice(name[1].toLowerCase() === 'x' ? 2 : 1), name[1].toLowerCase() === 'x' ? 16 : 10));
    return named[name.toLowerCase()] ?? entity;
  });
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(match => [match[1].toLowerCase(), decodeEntities(match[2] ?? match[3])]));
}

function visibleText(html) {
  return decodeEntities(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?\s*>|<\/(?:p|h[1-6]|li|summary|details|section|div)>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function metadata(html) {
  return Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0])).filter(meta => meta.name || meta.property).map(meta => [meta.name || meta.property, meta.content]));
}

function links(html) {
  return [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map(match => ({ ...attributes(match[0].slice(0, match[0].indexOf('>') + 1)), text: visibleText(match[0]) }));
}

function schemaNodes(html) {
  return [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].flatMap(match => {
    const opening = match[0].slice(0, match[0].indexOf('>') + 1);
    if (attributes(opening).type !== 'application/ld+json') return [];
    const value = JSON.parse(match[0].slice(opening.length, -9));
    return value['@graph'] || (Array.isArray(value) ? value : [value]);
  });
}

async function request(path) {
  return fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(60_000) });
}

function checkUniqueText(kind, value, path) {
  assert.ok(value && bengali.test(value), `${path}: Bengali ${kind}`);
  assert.ok(!uniqueValues[kind].has(value), `${path}: ${kind} duplicates ${uniqueValues[kind].get(value)}`);
  uniqueValues[kind].set(value, path);
}

function internalUrl(value, path) {
  assert.ok(!oldToolPort.test(value), `${path}: obsolete tool port in ${value}`);
  if (!value || value.startsWith('#')) return undefined;
  const url = new URL(value, new URL(path, origin));
  return url.origin === origin.origin || url.origin === publishedOrigin ? url : undefined;
}

function collectAssets(html, path) {
  for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*>/gi)) {
    const tag = attributes(match[0]);
    const resource = tag.src || (['stylesheet', 'icon', 'preload'].includes(tag.rel) ? tag.href : undefined);
    if (!resource) continue;
    const url = internalUrl(resource, path);
    if (url) assets.add(url.pathname + url.search);
  }
  const meta = metadata(html);
  if (meta['og:image']) {
    const url = internalUrl(meta['og:image'], path);
    assert.ok(url, `${path}: social preview must belong to this app`);
    assets.add(url.pathname + url.search);
    assert.ok(bengali.test(meta['og:image:alt'] || ''), `${path}: Bengali social preview description`);
  }
}

function checkMetadata(html, path) {
  assert.match(html, /<html\b[^>]*\blang="bn-BD"/, `${path}: document language`);
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  assert.equal(headings.length, 1, `${path}: exactly one H1`);
  const meta = metadata(html);
  checkUniqueText('title', visibleText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''), path);
  checkUniqueText('description', meta.description, path);
  checkUniqueText('heading', visibleText(headings[0][1]), path);
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).find(link => link.rel === 'canonical')?.href;
  if (publishedOrigin) {
    assert.equal(canonical, publishedOrigin + path, `${path}: canonical URL`);
    assert.equal(meta['og:url'], publishedOrigin + path, `${path}: Open Graph URL`);
    assert.ok(!/noindex/i.test(meta.robots || ''), `${path}: published page is indexable`);
  } else {
    assert.equal(canonical, undefined, `${path}: unpublished page must not invent a canonical URL`);
    assert.match(meta.robots || '', /noindex/i, `${path}: unpublished page is not indexed`);
  }
}

function checkLinks(html, path) {
  const anchors = links(html);
  for (const anchor of anchors) {
    const url = internalUrl(anchor.href, path);
    if (url && !/\.[a-z\d]+$/i.test(url.pathname)) assert.ok(routeSet.has(url.pathname), `${path}: unrecognized internal page link ${anchor.href}`);
  }
  const slug = path.split('/')[1];
  if (toolSlugs.includes(slug)) {
    for (const required of [`/${slug}`, `/${slug}/guide`, `/${slug}/privacy`]) {
      assert.ok(anchors.some(anchor => internalUrl(anchor.href, path)?.pathname === required), `${path}: nested navigation to ${required}`);
    }
    if (path.endsWith('/guide') || path.endsWith('/privacy')) assert.ok(anchors.some(anchor => anchor.href === `/${slug}#tool`), `${path}: return to this tool`);
    assert.ok(!anchors.some(anchor => anchor.href === '/guide'), `${path}: no obsolete global guide link`);
  }
  // The homepage shows a selection and links to /tools, which must carry a named card for every tool.
  if (path === '/') assert.ok(anchors.some(anchor => internalUrl(anchor.href, path)?.pathname === '/tools'), 'home links to the full tool list');
  if (path === '/tools') {
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
    const cards = links(main);
    for (const toolSlug of toolSlugs) assert.ok(cards.some(card => internalUrl(card.href, path)?.pathname === `/${toolSlug}` && bengali.test(card.text)), `tools: named card for ${toolSlug}`);
  }
}

function checkToolSchema(html, slug) {
  const path = `/${slug}`;
  assert.match(html, /\bid="tool"/, `${path}: interactive tool section`);
  const nodes = schemaNodes(html);
  const apps = nodes.filter(node => node['@type'] === 'WebApplication');
  assert.equal(apps.length, 1, `${path}: one WebApplication schema`);
  assert.equal(apps[0].url, publishedOrigin ? publishedOrigin + path : undefined, `${path}: application URL`);
  assert.equal(nodes.filter(node => node['@type'] === 'WebSite').length, 0, `${path}: tool is not a separate website`);
  const faq = nodes.find(node => node['@type'] === 'FAQPage');
  assert.ok(faq?.mainEntity?.length >= 4, `${path}: at least four FAQ entries`);
  const section = html.match(/<section\b[^>]*\bid="questions"[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  assert.ok(section, `${path}: visible FAQ section`);
  const questions = [...section.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi)].map(match => visibleText(match[1].replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/gi, '')));
  assert.deepEqual(questions, faq.mainEntity.map(item => item.name), `${path}: visible questions match schema`);
  const answers = [...section.matchAll(/<details\b[^>]*>[\s\S]*?<\/details>/gi)].map(match => visibleText(match[0].replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, '')));
  assert.deepEqual(answers, faq.mainEntity.map(item => item.acceptedAnswer.text.replace(/\s+/g, ' ').trim()), `${path}: visible answers match schema`);
}

assert.deepEqual([...toolSlugs].sort(), catalog.map(tool => tool.slug).sort(), 'every catalog tool has content and a route, and nothing else does');
assert.equal(new Set(toolSlugs).size, toolSlugs.length, 'registry slugs are unique');
for (const path of routes) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path}: HTTP status`);
  const html = await response.text();
  checkMetadata(html, path);
  checkLinks(html, path);
  collectAssets(html, path);
  if (toolSlugs.some(slug => path === `/${slug}`)) checkToolSchema(html, path.slice(1));
  console.log(`${path}: Bengali content, metadata, navigation and schema passed`);
}

for (const path of assets) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path}: shared or page asset`);
  assert.ok(!response.headers.get('content-type')?.includes('text/html'), `${path}: asset must not return an HTML fallback`);
  if (path.endsWith('.woff2')) assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 4).toString(), 'wOF2', `${path}: valid WOFF2 font`);
}

const robotsResponse = await request('/robots.txt');
assert.equal(robotsResponse.status, 200, 'robots.txt exists');
const robots = await robotsResponse.text();
if (publishedOrigin) {
  assert.match(robots, /^Allow:\s*\/\s*$/im, 'published robots allow the site');
  assert.ok(!/^Disallow:\s*\/\s*$/im.test(robots), 'published robots do not block the site');
  assert.ok(robots.includes(`Sitemap: ${publishedOrigin}/sitemap.xml`), 'robots points to the consolidated sitemap');
  const sitemapResponse = await request('/sitemap.xml');
  assert.equal(sitemapResponse.status, 200, 'published sitemap exists');
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decodeEntities(match[1]));
  assert.deepEqual(locations.sort(), routes.map(path => publishedOrigin + path).sort(), 'sitemap lists each public route once');
} else {
  assert.match(robots, /^Disallow:\s*\/\s*$/im, 'unpublished robots block indexing');
  assert.ok(!/^Sitemap:/im.test(robots), 'unpublished robots do not invent a sitemap origin');
}

for (const path of ['/tool-that-does-not-exist', '/tool-that-does-not-exist/guide', `/${toolSlugs[0]}/not-a-page`]) {
  const response = await request(path);
  assert.equal(response.status, 404, `${path}: unknown route`);
  assert.ok(bengali.test(visibleText(await response.text())), `${path}: Bengali not-found page`);
}
console.log(`${origin.origin}: ${routes.length} pages, ${assets.size} assets, robots${publishedOrigin ? '/sitemap' : ''}, and missing routes passed.`);
