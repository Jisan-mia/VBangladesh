import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

// Supply PLAYWRIGHT_MODULE when using a shared Playwright installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.SITE_CHECK_ORIGIN || 'http://127.0.0.1:3100';
const output = resolve(process.env.ART_CHECK_OUTPUT || 'artifacts/interactive-expansion/export-regression');
const source = await readFile(new URL('../shared/art-export.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const tools = [
  ['soptaher-chhok', '.week-art'],
  ['chhotto-para', '.para-canvas'],
  ['sobuj-kon', '.garden-stage > svg'],
  ['kagojer-mela', '.paper-bird-preview > svg'],
  ['bhashar-chhobi', '.language-preview > svg'],
  ['alpana', '.alpana-stage-art svg[role="img"]'],
  ['lekhar-poster', '.studio-art'],
  ['riksharong', '.studio-art'],
  ['nokshar-khata', '.studio-art'],
  ['chhobi-jora', '.studio-art'],
];
await mkdir(output, { recursive: true });
const results = [];
for (const [slug, selector] of [...tools, tools[0], tools[0]]) {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/${slug}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const data = await page.locator(selector).first().evaluate(async (svg, code) => {
      const moduleUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      const { svgPngBlob } = await import(moduleUrl);
      URL.revokeObjectURL(moduleUrl);
      const blob = await svgPngBlob(svg);
      const blank = svg.cloneNode(true);
      blank.querySelectorAll('text').forEach(text => text.remove());
      const blankBlob = await svgPngBlob(blank);
      const pixels = async imageBlob => {
        const image = await createImageBitmap(imageBlob);
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        image.close();
        return { width: canvas.width, height: canvas.height, bytes: context.getImageData(0, 0, canvas.width, canvas.height).data };
      };
      const actual = await pixels(blob);
      const withoutText = await pixels(blankBlob);
      const scale = actual.width / svg.viewBox.baseVal.width;
      const rootInverse = svg.getScreenCTM().inverse();
      const labels = [...svg.querySelectorAll('text')].filter(text => text.textContent.trim() && !text.closest('[data-export-ignore]')).map(text => {
        const bounds = text.getBBox();
        const matrix = rootInverse.multiply(text.getScreenCTM());
        const points = [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y], [bounds.x, bounds.y + bounds.height], [bounds.x + bounds.width, bounds.y + bounds.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
        const left = Math.max(0, Math.floor(Math.min(...points.map(p => p.x)) * scale));
        const top = Math.max(0, Math.floor(Math.min(...points.map(p => p.y)) * scale));
        const right = Math.min(actual.width, Math.ceil(Math.max(...points.map(p => p.x)) * scale));
        const bottom = Math.min(actual.height, Math.ceil(Math.max(...points.map(p => p.y)) * scale));
        let changedPixels = 0;
        for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
          const offset = (y * actual.width + x) * 4;
          if ([0, 1, 2, 3].some(channel => Math.abs(actual.bytes[offset + channel] - withoutText.bytes[offset + channel]) > 20)) changedPixels++;
        }
        return { text: text.textContent, changedPixels };
      });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
      return { png: btoa(binary), width: actual.width, height: actual.height, labels };
    }, javascript);
    assert.deepEqual(errors, [], `${slug}: browser errors`);
    for (const label of data.labels) assert.ok(label.changedPixels > 10, `${slug}: missing export text ${JSON.stringify(label)}`);
    if (slug === 'soptaher-chhok') assert.ok(data.labels.length >= 20, 'routine fixture includes headers, days, cells and footer');
    await writeFile(resolve(output, `${slug}.png`), Buffer.from(data.png, 'base64'));
    const result = { slug, width: data.width, height: data.height, labels: data.labels };
    results.push(result);
    console.log(`${slug}: ${data.labels.length} labels contain text pixels`);
  } finally { await browser.close(); }
}
await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
