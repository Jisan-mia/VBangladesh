#!/usr/bin/env node
// Static checks for the game rules in .claude/skills/game-engineering/SKILL.md.
// Parses tools/** and shared/** with the TypeScript compiler API (no extra dependencies).
//
//   node scripts/lint-games.mjs                  report new violations, exit 1 on new errors
//   node scripts/lint-games.mjs --all            also print violations already in the baseline
//   node scripts/lint-games.mjs --json           machine-readable output
//   node scripts/lint-games.mjs --no-baseline    ignore scripts/lint-games.baseline.json
//   node scripts/lint-games.mjs --prune-baseline lower baseline counts that the code has paid down
//   node scripts/lint-games.mjs --write-baseline rewrite the baseline from the current code (say why)
//   node scripts/lint-games.mjs --root <dir>     lint another tree (used by the tests)
//
// A comment `// lint-games-allow: <reason>` on the line before a violation allows it.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep, basename, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SOUND_KIT = "shared/game-sound.ts";
const KIDS_CATEGORY = "ছোটদের জন্য";

export const RULES = {
  "hot-alloc": { severity: "error", summary: "allocation or closure inside a function in a *.hot.ts file" },
  "audio-outside-kit": { severity: "error", summary: "AudioContext created outside shared/game-sound.ts" },
  "direct-vibrate": { severity: "error", summary: "navigator.vibrate outside shared/game-sound.ts (use buzz)" },
  "sim-nondeterminism": { severity: "error", summary: "Math.random or Date.now() in tools/*/lib (use makeRng)" },
  "nukta-in-regex-class": { severity: "error", summary: "literal ড় ঢ় য় inside a regex character class" },
  "kids-network": { severity: "error", summary: "network or share code in a ছোটদের জন্য tool" },
  "uncleared-timer": { severity: "warning", summary: "setTimeout/setInterval result discarded in a component" },
};

const ALLOW_RE = /\/\/\s*lint-games-allow:\s*\S/;
const SOURCE_EXT = /\.(ts|tsx|mts|mjs|js|jsx)$/;

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Tests stub browser APIs and build fixtures on purpose.
      if (entry.name === "tests" || entry.name === "__tests__") continue;
      walk(full, out);
    } else if (SOURCE_EXT.test(entry.name) && !/\.(test|spec)\.[a-z]+$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function parse(file, text) {
  const kind = file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

/** Slugs of tools in the kids category, from lib/catalog.ts and any tools/<slug>/content.ts with a category field. */
export function kidsSlugs(root) {
  const slugs = new Set();
  const collect = (file, fallbackSlug) => {
    if (!existsSync(file)) return;
    const sf = parse(file, readFileSync(file, "utf8"));
    const visit = node => {
      if (ts.isObjectLiteralExpression(node)) {
        let slug = fallbackSlug, category;
        for (const prop of node.properties) {
          if (!ts.isPropertyAssignment(prop) || !prop.name || !ts.isStringLiteralLike(prop.initializer)) continue;
          const key = prop.name.getText(sf).replace(/['"]/g, "");
          if (key === "slug") slug = prop.initializer.text;
          if (key === "category") category = prop.initializer.text;
        }
        if (slug && category === KIDS_CATEGORY) slugs.add(slug);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  };
  collect(join(root, "lib", "catalog.ts"));
  const toolsDir = join(root, "tools");
  if (existsSync(toolsDir)) {
    for (const slug of readdirSync(toolsDir)) collect(join(toolsDir, slug, "content.ts"), slug);
  }
  return slugs;
}

// ড় ঢ় য় as precomposed code points or as NFC base + nukta (U+09BC).
const NUKTA_RE = /[ড়ঢ়য়]|[ডঢয]়/;

/** Bodies of [...] classes in a regex source, skipping escapes. */
function regexClasses(source) {
  const classes = [];
  let inClass = false, start = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\\") { i++; continue; }
    if (!inClass && ch === "[") { inClass = true; start = i + 1; }
    else if (inClass && ch === "]") { inClass = false; classes.push(source.slice(start, i)); }
  }
  return classes;
}

const isFunctionLike = node =>
  ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node);

const ARRAY_ALLOC_METHODS = new Set(["map", "filter", "reduce", "forEach"]);

function calleeName(expr) {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return "";
}

function isMember(expr, object, prop) {
  return ts.isPropertyAccessExpression(expr) && expr.name.text === prop &&
    ((ts.isIdentifier(expr.expression) && expr.expression.text === object) ||
      (ts.isPropertyAccessExpression(expr.expression) && expr.expression.name.text === object));
}

/** Lint one file. `rel` is the repo-relative path with forward slashes. */
export function lintSource(rel, text, { kids = new Set() } = {}) {
  const sf = parse(rel, text);
  const lines = text.split("\n");
  const found = [];
  const report = (node, rule, message) => {
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    if (line > 0 && ALLOW_RE.test(lines[line - 1])) return;
    found.push({ file: rel, line: line + 1, col: character + 1, rule, severity: RULES[rule].severity, message });
  };

  const isHot = /\.hot\.[a-z]+$/.test(rel);
  const isKit = rel === SOUND_KIT;
  const libMatch = /^tools\/[^/]+\/lib\//.test(rel);
  const simExempt = /link|share|seed/i.test(basename(rel));
  const isComponent = /^tools\/[^/]+\/components\//.test(rel);
  const toolSlug = rel.startsWith("tools/") ? rel.split("/")[1] : null;
  const isKids = toolSlug !== null && kids.has(toolSlug);

  // Inline callbacks already reported through their .map/.forEach call.
  const skipNodes = new Set();

  const checkNukta = (node, source) => {
    if (regexClasses(source).some(cls => NUKTA_RE.test(cls))) {
      report(node, "nukta-in-regex-class", "ড়/ঢ়/য় inside [...] is two code points in NFC; use an alternation like (?:ড়|ঢ়) or \\u escapes");
    }
  };

  const visit = (node, fnDepth) => {
    const inFn = fnDepth > 0;

    if (isHot && inFn && !skipNodes.has(node)) {
      if (ts.isObjectLiteralExpression(node)) report(node, "hot-alloc", "object literal inside a hot function; preallocate at setup and mutate");
      else if (ts.isArrayLiteralExpression(node) && !(ts.isBinaryExpression(node.parent) && node.parent.left === node)) report(node, "hot-alloc", "array literal inside a hot function; use a preallocated typed array or pool");
      else if (ts.isNewExpression(node)) report(node, "hot-alloc", `new ${node.expression.getText(sf)} inside a hot function; create it once at setup`);
      else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) report(node, "hot-alloc", "closure created inside a hot function; hoist it to module scope");
      else if (ts.isFunctionDeclaration(node)) report(node, "hot-alloc", "nested function inside a hot function; hoist it to module scope");
      else if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) report(node, "hot-alloc", "spread inside a hot function allocates a copy");
      else if (ts.isTemplateExpression(node)) report(node, "hot-alloc", "template literal inside a hot function builds a string per call; cache it");
      else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ARRAY_ALLOC_METHODS.has(node.expression.name.text)) {
        const method = node.expression.name.text;
        const callback = node.arguments[0];
        const inline = callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback));
        if (method !== "forEach" || inline) {
          report(node, "hot-alloc", method === "forEach" ? ".forEach with an inline callback allocates a closure; use a for loop" : `.${method} allocates a new array per call; use a for loop`);
          if (inline) skipNodes.add(callback);
        }
      }
    }

    if (!isKit) {
      if (ts.isNewExpression(node) && /(^|\.)(webkit)?AudioContext$/.test(node.expression.getText(sf))) {
        report(node, "audio-outside-kit", "create sound through shared/game-sound.ts (sfx, tone, hiss, loop)");
      } else if ((ts.isIdentifier(node) && node.text === "webkitAudioContext" && !ts.isPropertyAccessExpression(node.parent)) ||
        (ts.isPropertyAccessExpression(node) && node.name.text === "webkitAudioContext" && !(ts.isNewExpression(node.parent) && node.parent.expression === node))) {
        report(node, "audio-outside-kit", "webkitAudioContext belongs in shared/game-sound.ts only");
      }
      if (ts.isPropertyAccessExpression(node) && node.name.text === "vibrate" && ts.isIdentifier(node.expression) && node.expression.text === "navigator") {
        report(node, "direct-vibrate", "call buzz() from shared/game-sound.ts instead of navigator.vibrate");
      }
    }

    if (libMatch && !simExempt && ts.isPropertyAccessExpression(node)) {
      if (isMember(node, "Math", "random")) report(node, "sim-nondeterminism", "Math.random in simulation; use makeRng(seed) from shared/game-core.ts");
      else if (isMember(node, "Date", "now") && ts.isCallExpression(node.parent) && node.parent.expression === node) report(node, "sim-nondeterminism", "Date.now() in simulation; pass time in through stepGame(state, input, dt)");
    }

    if (ts.isRegularExpressionLiteral(node)) {
      const source = node.text.slice(1, node.text.lastIndexOf("/"));
      checkNukta(node, source);
    } else if ((ts.isNewExpression(node) || ts.isCallExpression(node)) && ts.isIdentifier(node.expression) && node.expression.text === "RegExp") {
      const first = node.arguments?.[0];
      if (first && ts.isStringLiteralLike(first)) checkNukta(first, first.text);
    }

    if (isKids) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "fetch") {
        report(node, "kids-network", "fetch() in a kids' tool; kids' pages send nothing");
      } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "fetch" &&
        ts.isIdentifier(node.expression.expression) && ["window", "globalThis", "self"].includes(node.expression.expression.text)) {
        report(node, "kids-network", "fetch() in a kids' tool; kids' pages send nothing");
      }
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier) && /share-client(\.[a-z]+)?$/.test(node.moduleSpecifier.text)) {
        report(node, "kids-network", "share-client import in a kids' tool; use ShareToolLink from shared/kids-kit.tsx");
      }
      if (ts.isIdentifier(node) && node.text === "ShareBar" && !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) {
        // Report the JSX use or import specifier once, not every identifier position inside it.
        if (ts.isJsxOpeningElement(node.parent) || ts.isJsxSelfClosingElement(node.parent) || ts.isImportSpecifier(node.parent)) {
          report(node, "kids-network", "ShareBar in a kids' tool; use ShareToolLink from shared/kids-kit.tsx");
        }
      }
      if (ts.isStringLiteralLike(node) && node.text.includes("/api/") && !(ts.isImportDeclaration(node.parent))) {
        report(node, "kids-network", "an /api/ path in a kids' tool; kids' pages call no server");
      }
    }

    if (isComponent && ts.isCallExpression(node) && ["setTimeout", "setInterval"].includes(calleeName(node.expression))) {
      const callee = node.expression;
      const global = ts.isIdentifier(callee) || (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && ["window", "globalThis", "self"].includes(callee.expression.text));
      let parent = node.parent;
      while (ts.isParenthesizedExpression(parent)) parent = parent.parent;
      const discarded = ts.isExpressionStatement(parent) || ts.isVoidExpression(parent) ||
        (ts.isArrowFunction(parent) && parent.body === node && ts.isCallExpression(parent.parent));
      if (global && discarded) {
        report(node, "uncleared-timer", `${calleeName(callee)} return value is discarded; keep the id and clear it on unmount, pause and restart`);
      }
    }

    const nextDepth = isFunctionLike(node) ? fnDepth + 1 : fnDepth;
    ts.forEachChild(node, child => visit(child, nextDepth));
  };
  visit(sf, 0);
  return found;
}

export function lintRepo(root) {
  const kids = kidsSlugs(root);
  const files = [...walk(join(root, "tools"), []), ...walk(join(root, "shared"), [])].sort();
  const violations = [];
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    violations.push(...lintSource(rel, readFileSync(file, "utf8"), { kids }));
  }
  return { files: files.length, violations };
}

/** Baseline shape: { "<file>": { "<rule>": count } }. */
export function countByFileRule(violations) {
  const counts = {};
  for (const v of violations) {
    counts[v.file] ??= {};
    counts[v.file][v.rule] = (counts[v.file][v.rule] ?? 0) + 1;
  }
  return counts;
}

/**
 * Mark violations covered by the baseline. A file and rule may keep up to its baseline count;
 * anything beyond is new. Line numbers shift as code changes, so the last ones in a file count as new.
 */
export function applyBaseline(violations, baseline) {
  const seen = {};
  for (const v of violations) {
    const key = v.file + "\0" + v.rule;
    seen[key] = (seen[key] ?? 0) + 1;
    v.baselined = seen[key] <= (baseline[v.file]?.[v.rule] ?? 0);
  }
  return violations;
}

function sortedBaseline(counts) {
  const out = {};
  for (const file of Object.keys(counts).sort()) {
    out[file] = {};
    for (const rule of Object.keys(counts[file]).sort()) out[file][rule] = counts[file][rule];
  }
  return out;
}

function main(argv) {
  const flag = name => argv.includes(name);
  const option = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const root = resolve(option("--root") ?? join(SCRIPT_DIR, ".."));
  const baselinePath = resolve(option("--baseline") ?? join(SCRIPT_DIR, "lint-games.baseline.json"));
  const { files, violations } = lintRepo(root);

  if (flag("--write-baseline")) {
    writeFileSync(baselinePath, JSON.stringify(sortedBaseline(countByFileRule(violations)), null, 2) + "\n");
    console.log(`wrote ${relative(process.cwd(), baselinePath)}: ${violations.length} violations in ${files} files`);
    return 0;
  }

  const baseline = !flag("--no-baseline") && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
  applyBaseline(violations, baseline);
  const current = countByFileRule(violations);

  // Baseline entries the code has paid down: the baseline should shrink with it.
  const stale = [];
  for (const [file, rules] of Object.entries(baseline)) {
    for (const [rule, count] of Object.entries(rules)) {
      const now = current[file]?.[rule] ?? 0;
      if (now < count) stale.push({ file, rule, baseline: count, now });
    }
  }

  if (flag("--prune-baseline")) {
    const pruned = {};
    for (const [file, rules] of Object.entries(baseline)) {
      for (const [rule, count] of Object.entries(rules)) {
        const now = Math.min(count, current[file]?.[rule] ?? 0);
        if (now > 0) { pruned[file] ??= {}; pruned[file][rule] = now; }
      }
    }
    writeFileSync(baselinePath, JSON.stringify(sortedBaseline(pruned), null, 2) + "\n");
    console.log(`pruned ${stale.length} baseline entries`);
    return 0;
  }

  const fresh = violations.filter(v => !v.baselined);
  const newErrors = fresh.filter(v => v.severity === "error").length;
  const newWarnings = fresh.length - newErrors;
  const byRule = {};
  for (const rule of Object.keys(RULES)) byRule[rule] = { total: 0, new: 0 };
  for (const v of violations) { byRule[v.rule].total++; if (!v.baselined) byRule[v.rule].new++; }

  if (flag("--json")) {
    process.stdout.write(JSON.stringify({ files, newErrors, newWarnings, baselined: violations.length - fresh.length, byRule, stale, violations: flag("--all") ? violations : fresh }, null, 2) + "\n");
  } else {
    for (const v of flag("--all") ? violations : fresh) {
      console.log(`${v.file}:${v.line} ${v.rule} ${v.severity === "warning" ? "(warning) " : ""}${v.baselined ? "(baselined) " : ""}${v.message}`);
    }
    if (stale.length) console.log(`\n${stale.length} baseline entries are lower now. Run npm run lint:games -- --prune-baseline to lock in the gains.`);
    console.log(`\nlint:games: ${files} files, ${newErrors} new errors, ${newWarnings} new warnings, ${violations.length - fresh.length} baselined`);
  }
  return newErrors > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
