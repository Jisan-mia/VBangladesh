import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium } from '/Users/jisanmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const require = createRequire('/Users/jisanmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { PDFDocument } = require('pdf-lib');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3100';
const output = process.env.QA_OUTPUT || '/tmp/ektukhani-navigation-qa';
const tools = ['amar-chhotobela', 'bazar-note', 'ek-ghonta', 'deadline', 'rannakhata', 'cholo-kheli', 'bhara', 'free-afternoon', 'chhotto-para', 'alpana', 'kagojer-mela', 'bhashar-chhobi', 'sobuj-kon','riksharong','nokshar-khata','lekhar-poster','chhobi-jora','shobdo-khela','soptaher-chhok','bhagabhagi'];
const artworkSelectors = {
  'chhotto-para': '.para-canvas',
  alpana: '.alpana-stage-art > svg',
  'kagojer-mela': '.paper-bird-preview > svg',
  'bhashar-chhobi': '.language-preview > svg',
  'sobuj-kon': '.garden-stage > svg',
  riksharong: '.studio-art',
  'nokshar-khata': '.studio-art',
  'lekhar-poster': '.studio-art',
  'chhobi-jora': '.studio-art',
  'soptaher-chhok': '.studio-art',
};
const printSelectors = {
  'kagojer-mela': '.paper-print-sheet',
  alpana: '.alpana-print-sheet',
  'bhashar-chhobi': '.language-preview',
  'sobuj-kon': '.garden-stage',
  'soptaher-chhok': '.week-preview',
};
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const context = await browser.newContext({ viewport: { width: 320, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
const badResponses = [];
const results = [];
page.on('pageerror', error => errors.push({ url: page.url(), error: error.message }));
page.on('console', message => { if (message.type() === 'error') errors.push({ url: page.url(), error: message.text(), location: message.location() }); });
page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) badResponses.push({ status: response.status(), url: response.url() }); });
await mkdir(output, { recursive: true });

async function ready() {
  await page.locator('h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function clickRoute(selector, pathname) {
  const marker = await page.evaluate(() => window.__ektukhaniNavigationMarker);
  await page.locator(selector).first().click();
  await page.waitForURL(url => url.pathname === pathname);
  await ready();
  assert.equal(await page.evaluate(() => window.__ektukhaniNavigationMarker), marker, `Expected soft navigation to ${pathname}`);
}

async function enterTool(slug) {
  assert.equal(new URL(page.url()).pathname, '/', 'Tool navigation begins at the hub');
  await clickRoute(`a[href="/${slug}"]`, `/${slug}`);
}

async function returnToHub() {
  await clickRoute('header a[href="/#tools"]', '/');
  assert.equal(new URL(page.url()).hash, '#tools');
  await page.locator('#tools').waitFor();
}

async function checkPage(slug, width) {
  assert.equal(await page.locator('h1').count(), 1, `${slug} has one H1`);
  const invalidLinks = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => ['/guide', '/#tool', '/#questions'].includes(href)));
  assert.deepEqual(invalidLinks, [], `${slug} has no stale standalone-app links`);
  const overflow = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].filter(element => { const bounds = element.getBoundingClientRect(); return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1); }).slice(0, 10).map(element => ({ tag: element.tagName, className: element.getAttribute('class') })) }));
  assert.ok(overflow.document <= width + 1, `${slug}: horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
}

async function checkMainCta(slug) {
  await page.locator('a.button[href="#tool"]').first().click();
  await page.waitForFunction(() => {
    const top = document.querySelector('#tool')?.getBoundingClientRect().top;
    return location.hash === '#tool' && top !== undefined && top >= -2 && top < innerHeight;
  });
  assert.equal(new URL(page.url()).pathname, `/${slug}`);
}

async function downloadArtwork(slug, suffix = '') {
  if (slug === 'kagojer-mela') {
    const details = page.locator('.paper-image-downloads');
    if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  }
  if(slug === 'chhobi-jora'){await page.locator('input[type=file]').setInputFiles(['/Users/jisanmia/Documents/ChatGPT/VBangladesh/public/previews/chhotto-para.png','/Users/jisanmia/Documents/ChatGPT/VBangladesh/public/previews/sobuj-kon.png']);await page.getByRole('button',{name:'ছবি ডাউনলোড করুন',exact:true}).waitFor();}
  const bounds = await page.locator(artworkSelectors[slug]).evaluate(svg => ({ width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height }));
  const waiting = page.waitForEvent('download', { timeout: 30000 });
  await page.getByRole('button', { name: 'ছবি ডাউনলোড করুন', exact: true }).click();
  const file = await waiting;
  assert.equal(await file.failure(), null, `${slug}: PNG download completed`);
  const destination = `${output}/${slug}${suffix}.png`;
  await file.saveAs(destination);
  const bytes = await readFile(destination);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${slug}: real PNG`);
  const scale = Math.min(2, 2400 / Math.max(bounds.width, bounds.height));
  assert.equal(bytes.readUInt32BE(16), Math.round(bounds.width * scale), `${slug}: PNG width matches live SVG`);
  assert.equal(bytes.readUInt32BE(20), Math.round(bounds.height * scale), `${slug}: PNG height matches live SVG`);
  assert.ok(bytes.length > 4000, `${slug}: nonempty PNG artwork`);
  results.push({ slug, check: 'png', file: destination, bytes: bytes.length });
}

async function checkPrint(slug) {
  await page.emulateMedia({ media: 'print' });
  await page.locator(printSelectors[slug]).waitFor({ state: 'visible' });
  const namedPage = await page.locator(`.tool-${slug}`).evaluate(element => getComputedStyle(element).getPropertyValue('page'));
  assert.ok(namedPage && namedPage !== 'auto', `${slug}: named page is selected`);
  const bytes = await page.pdf({ path: `${output}/${slug}.pdf`, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1, `${slug}: exactly one printed sheet after all other styles loaded`);
  const size = pdf.getPage(0).getSize();
  assert.ok(Math.abs(size.width - 595.28) < 2 && Math.abs(size.height - 841.89) < 2, `${slug}: A4 paper, got ${JSON.stringify(size)}`);
  results.push({ slug, check: 'print', pageCount: pdf.getPageCount(), namedPage, size });
  await page.emulateMedia({ media: 'screen' });
}

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await ready();
  await page.evaluate(() => { window.__ektukhaniNavigationMarker = `same-document-${Date.now()}`; });
  assert.equal(await page.locator('h1').count(), 1, 'Hub has one H1');
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of tools) {
      await enterTool(slug);
      await checkPage(slug, width);
      await checkMainCta(slug);
      if (width === 320) {
        await page.screenshot({ path: `${output}/${slug}-mobile.png`, fullPage: true });
        await clickRoute(`.tool-navigation a[href="/${slug}/guide"]`, `/${slug}/guide`);
        await checkPage(`${slug}/guide`, width);
        await clickRoute(`footer a[href="/${slug}/privacy"]`, `/${slug}/privacy`);
        await checkPage(`${slug}/privacy`, width);
      }
      await returnToHub();
      console.log(`${slug}: ${width}px, soft navigation, H1, links and CTA passed`);
      results.push({ slug, width, check: 'navigation' });
    }
  }
  for (const slug of Object.keys(artworkSelectors)) {
    await enterTool(slug);
    await downloadArtwork(slug);
    if (slug === 'chhotto-para') {
      await page.getByRole('button', { name: 'স্টোরি ৯:১৬', exact: true }).click();
      await downloadArtwork(slug, '-story');
    }
    await returnToHub();
  }
  for (const slug of Object.keys(printSelectors)) {
    await enterTool(slug);
    await checkPrint(slug);
    await returnToHub();
  }
  assert.deepEqual(badResponses, [], 'No new HTTP errors, including assets or prefetched routes');
  assert.deepEqual(errors, [], 'No browser errors');
  console.log(`PASS: all 20 tools, guide/privacy pages, 320/1280px, 11 PNG exports and five single-page A4 prints. Results: ${output}`);
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify({ base, results, errors, badResponses }, null, 2));
  await browser.close();
}
