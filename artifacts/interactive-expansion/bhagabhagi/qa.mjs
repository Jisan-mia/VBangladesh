import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '/Users/jisanmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const evidence = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const checks = [];
try {
  for (const width of [320, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3100/bhagabhagi');
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.split-people-list > li').count(), 2);
    assert.equal(await page.getByRole('button', { name: 'হিসাব কপি করুন', exact: true }).isDisabled(), true);
    for (const [oldName, name] of [['ব্যক্তি ১', 'আকাশ'], ['ব্যক্তি ২', 'বেলা']]) {
      await page.getByRole('button', { name: `${oldName}-এর নাম বদলান`, exact: true }).click();
      await page.getByRole('textbox', { name: 'নতুন নাম', exact: true }).fill(name);
      await page.getByRole('button', { name: 'নাম রাখুন', exact: true }).click();
    }
    await page.getByRole('textbox', { name: 'আরেকজনের নাম', exact: true }).fill('চয়ন');
    await page.getByRole('button', { name: 'যোগ করুন', exact: true }).click();
    assert.equal(await page.locator('.split-people-list > li').count(), 3);
    await page.getByRole('textbox', { name: 'আরেকজনের নাম', exact: true }).fill('বেলা');
    await page.getByRole('button', { name: 'যোগ করুন', exact: true }).click();
    assert.match(await page.locator('.split-name-form [role="alert"]').textContent(), /একই নাম দুবার/);
    await page.getByRole('textbox', { name: 'আরেকজনের নাম', exact: true }).fill('');
    const form = page.getByRole('form', { name: 'নতুন খরচ', exact: true });
    async function addExpense(label, amount, payer) {
      await form.getByRole('textbox', { name: 'কিসের খরচ?', exact: true }).fill(label);
      await form.getByRole('textbox', { name: 'কত টাকা?', exact: true }).fill(amount);
      await form.getByRole('combobox', { name: 'কে দিয়েছেন?', exact: true }).selectOption({ label: payer });
      await form.getByRole('button', { name: 'খরচ যোগ করুন', exact: true }).click();
    }
    await addExpense('খাবার', '১০০.০০১', 'আকাশ');
    assert.match(await form.getByRole('alert').textContent(), /সর্বোচ্চ দুই ঘর/);
    assert.equal(await page.locator('.split-expense-list > li').count(), 0);
    await addExpense('খাবার', '১০০.০১', 'আকাশ');
    await addExpense('চা', '২০.০২', 'বেলা');
    assert.match(await page.locator('.split-total').textContent(), /১২০\.০৩/);
    const settlements = await page.locator('.split-transfers').textContent();
    assert.match(settlements, /বেলা.*আকাশ.*১৯\.৯৯/);
    assert.match(settlements.normalize('NFC'), new RegExp('চয়ন.*আকাশ.*৪০\\.০১'.normalize('NFC')));
    await page.getByRole('button', { name: 'আকাশ-কে তালিকা থেকে বাদ দিন', exact: true }).click();
    assert.match(await page.locator('.split-notice').textContent(), /এই নামে খরচ আছে/);
    assert.equal(await page.locator('.split-people-list > li').count(), 3);
    await page.getByRole('button', { name: 'খাবার খরচ বদলান', exact: true }).click();
    const edit = page.getByRole('form', { name: 'খাবার বদলান', exact: true });
    assert.equal(await edit.getByRole('textbox', { name: 'কত টাকা?', exact: true }).inputValue(), '১০০.০১');
    await edit.getByRole('textbox', { name: 'কত টাকা?', exact: true }).fill('১০০.০২');
    await edit.getByRole('button', { name: 'বদল রাখুন', exact: true }).click();
    assert.match(await page.locator('.split-total').textContent(), /১২০\.০৪/);
    assert.match(await page.locator('.split-balances').textContent(), /ভাগ ৪০\.০২/);
    await page.getByRole('button', { name: '↶ আগের অবস্থায়', exact: true }).click();
    assert.match(await page.locator('.split-total').textContent(), /১২০\.০৩/);
    await page.getByRole('button', { name: '↷ আবার করুন', exact: true }).click();
    assert.match(await page.locator('.split-total').textContent(), /১২০\.০৪/);
    await page.getByRole('button', { name: '↶ আগের অবস্থায়', exact: true }).click();
    await page.getByRole('button', { name: 'চা খরচ বাদ দিন', exact: true }).click();
    assert.match(await page.locator('.split-total').textContent(), /১০০\.০১/);
    await page.getByRole('button', { name: '↶ আগের অবস্থায়', exact: true }).click();
    assert.match(await page.locator('.split-total').textContent(), /১২০\.০৩/);
    await page.getByRole('button', { name: new RegExp('চয়ন-কে তালিকা থেকে বাদ দিন'.normalize('NFC')) }).click();
    assert.equal(await page.locator('.split-people-list > li').count(), 2);
    assert.match(await page.locator('.split-balances').textContent(), /ভাগ ৬০\.০২/);
    await page.getByRole('button', { name: '↶ আগের অবস্থায়', exact: true }).click();
    await page.getByRole('button', { name: 'হিসাব কপি করুন', exact: true }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /মোট খরচ: ১২০\.০৩ টাকা/);
    assert.match(copied, /বেলা → আকাশ: ১৯\.৯৯ টাকা/);
    const downloadPending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ফাইল রাখুন', exact: true }).click();
    const download = await downloadPending;
    assert.equal(download.suggestedFilename(), 'ভাগাভাগি-হিসাব.txt');
    const reportPath = `${evidence}report-${width}.txt`;
    await download.saveAs(reportPath);
    assert.equal(await readFile(reportPath, 'utf8'), copied);
    await page.getByRole('button', { name: 'খাতা খালি করুন', exact: true }).click();
    assert.equal(await page.locator('.split-people-list > li').count(), 2);
    assert.equal(await page.locator('.split-expense-list > li').count(), 0);
    await page.getByRole('button', { name: '↶ আগের অবস্থায়', exact: true }).click();
    assert.match(await page.locator('.split-total').textContent(), /১২০\.০৩/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('.split-result').screenshot({ path: `${evidence}result-${width}.png` });
    await page.locator('.split-editor').screenshot({ path: `${evidence}editor-${width}.png` });
    assert.deepEqual(errors, []);
    checks.push({ width, status: 'pass', assertions: 'names, duplicate validation, Bengali decimals, rounding, payer protection, edit, remove, undo/redo, clipboard, download equality, reset/undo, no overflow, no runtime errors' });
    await context.close();
  }
  await writeFile(`${evidence}result.json`, JSON.stringify({ checkedAt: new Date().toISOString(), origin: 'http://127.0.0.1:3100', checks }, null, 2));
  console.log(JSON.stringify(checks, null, 2));
} finally { await browser.close(); }
