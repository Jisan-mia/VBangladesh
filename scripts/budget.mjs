#!/usr/bin/env node
// First-load JS budgets per route, checked after `next build`.
//
// Next 16 dropped the "First Load JS" column from the build log and the app-build-manifest,
// so this reads what a browser really downloads: the <script> tags in each prerendered page
// under .next/server/app/**/*.html. Each chunk is gzipped (level 9) and summed per route.
// noModule polyfills are left out (modern browsers skip them). Dynamic routes (ƒ, such as
// /s/[id]) have no prerendered HTML and are listed as unmeasured.
//
//   node scripts/budget.mjs            check every route against scripts/budget.json
//   node scripts/budget.mjs --all      print every route, not only the ones over or near budget
//   node scripts/budget.mjs --json     machine-readable output
//   node scripts/budget.mjs --seed     rewrite budget.json from the current sizes + 10% (say why)
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT = join(ROOT, ".next");
const APP = join(NEXT, "server", "app");
const BUDGET_FILE = join(ROOT, "scripts", "budget.json");
const KB = 1024;
const HEADROOM = 1.1;

const argv = process.argv.slice(2);
const flag = name => argv.includes(name);

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function routeOf(file) {
  const rel = relative(APP, file).split(sep).join("/").replace(/\.html$/, "");
  if (rel === "index") return "/";
  return "/" + rel.replace(/\/index$/, "");
}

/** JS URLs a browser fetches on first load: script src and preload hrefs, minus noModule polyfills. */
function firstLoadScripts(html) {
  const urls = new Set();
  for (const tag of html.match(/<(script|link)\b[^>]*>/g) ?? []) {
    if (/\bnoModule\b/i.test(tag)) continue;
    if (tag.startsWith("<link") && !/\bas="script"/.test(tag) && !/rel="modulepreload"/.test(tag)) continue;
    const url = tag.match(/\b(?:src|href)="(\/_next\/static\/[^"?#]+\.js)/)?.[1];
    if (url) urls.add(url);
  }
  return [...urls];
}

const gzCache = new Map();
function gzipBytes(url) {
  if (!gzCache.has(url)) {
    const file = join(NEXT, decodeURIComponent(url.replace(/^\/_next\//, "")));
    gzCache.set(url, existsSync(file) ? gzipSync(readFileSync(file), { level: 9 }).length : NaN);
  }
  return gzCache.get(url);
}

/** Tool slugs per catalog category, so a new game picks up the games budget on its own. */
function catalogCategories() {
  const file = join(ROOT, "lib", "catalog.ts");
  const bySlug = new Map();
  if (!existsSync(file)) return bySlug;
  for (const m of readFileSync(file, "utf8").matchAll(/slug:\s*"([^"]+)"[^\n]*?category:\s*"([^"]+)"/g)) bySlug.set(m[1], m[2]);
  return bySlug;
}

function measure() {
  if (!existsSync(APP)) {
    console.error("budget: no .next/server/app. Run `npm run build` first.");
    process.exit(2);
  }
  const routes = [];
  for (const file of htmlFiles(APP)) {
    const route = routeOf(file);
    if (route.startsWith("/_global-error")) continue;
    const scripts = firstLoadScripts(readFileSync(file, "utf8"));
    const missing = scripts.filter(url => Number.isNaN(gzipBytes(url)));
    if (missing.length) {
      console.error(`budget: ${route} references chunks missing from .next/static (stale build?): ${missing.join(", ")}`);
      process.exit(2);
    }
    routes.push({ route, scripts, bytes: scripts.reduce((sum, url) => sum + gzipBytes(url), 0) });
  }
  if (!routes.length) {
    console.error("budget: no prerendered pages in .next/server/app (the last build failed?). Run `npm run build` first.");
    process.exit(2);
  }
  // "Own" JS: chunks no other route loads, i.e. what this page adds on top of the shared app shell.
  const users = new Map();
  for (const r of routes) for (const url of r.scripts) users.set(url, (users.get(url) ?? 0) + 1);
  for (const r of routes) r.own = r.scripts.filter(url => users.get(url) === 1).reduce((sum, url) => sum + gzipBytes(url), 0);
  routes.sort((a, b) => a.route.localeCompare(b.route));

  const prerender = existsSync(join(NEXT, "prerender-manifest.json")) ? JSON.parse(readFileSync(join(NEXT, "prerender-manifest.json"), "utf8")) : {};
  const appPaths = existsSync(join(NEXT, "app-path-routes-manifest.json")) ? Object.values(JSON.parse(readFileSync(join(NEXT, "app-path-routes-manifest.json"), "utf8"))) : [];
  const measured = new Set(routes.map(r => r.route));
  const dynamicParents = Object.keys(prerender.dynamicRoutes ?? {});
  const unmeasured = appPaths.filter(p => !measured.has(p) && !dynamicParents.includes(p) && !/\.(txt|xml|webmanifest)$/.test(p) && !p.startsWith("/api/") && p !== "/_global-error");
  return { routes, unmeasured };
}

const toKb = bytes => Math.round((bytes / KB) * 10) / 10;
const ceilKb = bytes => Math.ceil((bytes * HEADROOM) / KB);
const pad = (text, width, right = false) => (right ? String(text).padStart(width) : String(text).padEnd(width));

function groupOf(route, config, categories) {
  for (const [name, group] of Object.entries(config.groups ?? {})) {
    if (group.routes && route in group.routes) return name;
    const slug = route.split("/")[1];
    if (route === "/" + slug && group.categories?.includes(categories.get(slug))) return name;
  }
  return null;
}

/** Budget in KB for a route: explicit route override, then its group (per-route, then default), then the default. */
function budgetFor(route, config, categories) {
  if (config.routes && route in config.routes) return { kb: config.routes[route], source: "route" };
  const group = groupOf(route, config, categories);
  if (group) {
    const g = config.groups[group];
    if (g.routes && route in g.routes) return { kb: g.routes[route], source: `${group}` };
    if (g.default != null) return { kb: g.default, source: `${group} default` };
  }
  return { kb: config.default, source: "default" };
}

function seed({ routes }) {
  const categories = catalogCategories();
  const old = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : {};
  const gameCategories = old.groups?.games?.categories ?? ["গেম", "ছোটদের জন্য"];
  const isTop = r => r.route.split("/").length === 2 && r.route !== "/_not-found";
  const games = {}, pages = {};
  const rest = [];
  for (const r of routes) {
    const slug = r.route.split("/")[1];
    if (r.route !== "/" && isTop(r) && gameCategories.includes(categories.get(slug))) games[r.route] = ceilKb(r.bytes);
    else if (isTop(r)) pages[r.route] = ceilKb(r.bytes);
    else rest.push(r);
  }
  const gameSizes = Object.values(games).sort((a, b) => a - b);
  const p75 = gameSizes[Math.floor(gameSizes.length * 0.75)] ?? 0;
  const config = {
    $comment: "First-load JS budgets in KB (1024 bytes), gzipped, per route. Seeded from the build plus 10% headroom by `node scripts/budget.mjs --seed`. Never raise a number to make a build pass without saying why in the commit and in ai_docs/game-dev/budget.md.",
    toleranceKb: old.toleranceKb ?? 1,
    default: Math.max(...rest.map(r => ceilKb(r.bytes))),
    routes: pages,
    groups: {
      games: {
        $comment: "Every tool in these catalog categories. A new game with no entry gets the default (the 75th percentile of today's games + 10%).",
        categories: gameCategories,
        default: p75,
        routes: games,
      },
    },
  };
  writeFileSync(BUDGET_FILE, JSON.stringify(config, null, 2) + "\n");
  console.log(`budget: seeded ${relative(process.cwd(), BUDGET_FILE)} (${Object.keys(pages).length} pages, ${Object.keys(games).length} games, default ${config.default} KB, games default ${p75} KB)`);
}

function check({ routes, unmeasured }) {
  if (!existsSync(BUDGET_FILE)) {
    console.error("budget: no scripts/budget.json. Run `node scripts/budget.mjs --seed` once.");
    return 2;
  }
  const config = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
  const categories = catalogCategories();
  const tolerance = config.toleranceKb ?? 1;
  const rows = routes.map(r => {
    const { kb, source } = budgetFor(r.route, config, categories);
    const size = r.bytes / KB;
    const status = size > kb + tolerance ? "OVER" : size > kb ? "near" : "ok";
    return { route: r.route, kb: toKb(r.bytes), ownKb: toKb(r.own), budgetKb: kb, source, status, deltaKb: Math.round((size - kb) * 10) / 10 };
  });
  const over = rows.filter(r => r.status === "OVER");

  if (flag("--json")) {
    process.stdout.write(JSON.stringify({ toleranceKb: tolerance, over: over.length, unmeasured, routes: rows }, null, 2) + "\n");
    return over.length ? 1 : 0;
  }
  const shown = flag("--all") ? rows : rows.filter(r => r.status !== "ok");
  if (shown.length) {
    const w = Math.max(5, ...shown.map(r => r.route.length));
    console.log(`${pad("route", w)}  ${pad("first load", 10, true)}  ${pad("own", 7, true)}  ${pad("budget", 7, true)}  ${pad("delta", 7, true)}  status  from`);
    for (const r of shown) {
      const delta = (r.deltaKb > 0 ? "+" : "") + r.deltaKb;
      console.log(`${pad(r.route, w)}  ${pad(r.kb + " KB", 10, true)}  ${pad(r.ownKb, 7, true)}  ${pad(r.budgetKb, 7, true)}  ${pad(delta, 7, true)}  ${pad(r.status, 6)}  ${r.source}`);
    }
    console.log("");
  }
  if (unmeasured.length) console.log(`unmeasured (rendered on demand, no prerendered HTML): ${unmeasured.join(", ")}`);
  const biggest = [...rows].sort((a, b) => b.kb - a.kb)[0];
  console.log(`budget: ${rows.length} routes, ${over.length} over budget (+${tolerance} KB tolerance), largest ${biggest?.route} at ${biggest?.kb} KB gzipped`);
  if (over.length) console.log("Cut the route's JS (lazy-load, drop a dependency, draw in code). Raise a budget only with a reason in ai_docs/game-dev/budget.md.");
  return over.length ? 1 : 0;
}

const result = measure();
if (flag("--seed")) seed(result);
else process.exitCode = check(result);
