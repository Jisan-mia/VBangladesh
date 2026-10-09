const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(readFileSync(__dirname + '/model.js', 'utf8'), context);
const { cardContent, priorityScore } = context;
test('empty selections produce an invitation, not a fabricated memory', () => {
  const result = cardContent('', []);
  assert.equal(result.title, 'আমার ছোটবেলা');
  assert.equal(result.lines.length, 0);
  assert.equal(result.caption, 'আপনার স্মৃতিগুলো বেছে নিন');
});
test('personal names remain text and selected memories retain their order', () => {
  const result = cardContent('  <Jisan>  ', ['ঘুড়ি', 'বৃষ্টিতে ভেজা']);
  assert.equal(result.title, '<Jisan> · আমার ছোটবেলা');
  assert.deepEqual(Array.from(result.lines), ['ঘুড়ি', 'বৃষ্টিতে ভেজা']);
  assert.equal(result.caption, '২টি স্মৃতি, একটুকরো আমি');
});
test('a different priority changes the comparison in the expected direction', () => {
  const fun = { scores: { share: 5, utility: 2, impact: 2, ease: 5, evidence: 3 } };
  const useful = { scores: { share: 2, utility: 5, impact: 4, ease: 4, evidence: 4 } };
  assert.ok(priorityScore(fun, 'share') > priorityScore(useful, 'share'));
  assert.ok(priorityScore(useful, 'utility') > priorityScore(fun, 'utility'));
});
test('unknown priorities fail explicitly', () => {
  assert.throws(() => priorityScore({scores: {}}, 'unknown'), /Unknown priority/);
});

test('card content owns its selected memories without modifying form values', () => {
  const memories = ['ঘুড়ি', 'বৃষ্টিতে ভেজা'];
  const result = cardContent('জিসান', memories);
  result.lines.pop();
  assert.deepEqual(memories, ['ঘুড়ি', 'বৃষ্টিতে ভেজা']);
});

test('all priority modes keep uniformly scored ideas on the same five-point scale', () => {
  for (const score of [1, 5]) {
    const idea = { scores: { share: score, utility: score, impact: score, ease: score, evidence: score } };
    for (const priority of ['balanced', 'share', 'utility', 'impact']) {
      assert.ok(Math.abs(priorityScore(idea, priority) - score) < 1e-10, priority);
    }
  }
});

const evidence = JSON.parse(readFileSync(__dirname + '/evidence.json', 'utf8'));
test('the offline report includes every idea, source and its current data', () => {
  const html = readFileSync(__dirname + '/index.html', 'utf8');
  const embedded = html.match(/<script id="idea-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.deepEqual(JSON.parse(embedded[1]), evidence.ideas);
  for (const idea of evidence.ideas) assert.ok(html.includes('id="idea-' + idea.id + '"'), idea.id);
  for (const source of evidence.sources) assert.ok(html.includes('id="source-' + source.id + '"'), source.id);
  for (const id of ['priority', 'track', 'idea-grid', 'memory-form', 'download-card', 'print-report']) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
});
test('every ranked idea cites an existing source and has complete bounded scores', () => {
  const sourceIds = new Set(evidence.sources.map(source => source.id));
  assert.equal(sourceIds.size, evidence.sources.length, 'source IDs must be unique');
  assert.equal(new Set(evidence.ideas.map(idea => idea.id)).size, evidence.ideas.length, 'idea IDs must be unique');
  for (const idea of evidence.ideas) {
    assert.ok(idea.sources.length > 0, idea.id + ' needs evidence');
    for (const source of idea.sources) assert.ok(sourceIds.has(source), idea.id + ' references ' + source);
    for (const key of ['share', 'utility', 'impact', 'ease', 'evidence']) {
      assert.ok(Number.isInteger(idea.scores[key]) && idea.scores[key] >= 1 && idea.scores[key] <= 5, idea.id + ': ' + key);
    }
  }
});

test('downloadable trend rows exactly match the evidence data and retain partial-week labels', () => {
  const lines = readFileSync(__dirname + '/trends-12-months.csv', 'utf8').trim().split(/\r?\n/);
  assert.deepEqual(lines.shift().split(','), ['week_start_utc', ...evidence.trends.terms, 'partial_week']);
  const expected = evidence.trends.rows.map(row => [row.week, ...row.values, row.partial].join(','));
  assert.deepEqual(lines, expected);
  for (const [index, row] of evidence.trends.rows.entries()) {
    assert.equal(row.values.length, evidence.trends.terms.length, row.week);
    for (const value of row.values) assert.ok(Number.isInteger(value) && value >= 0 && value <= 100, row.week);
    if (index) assert.equal(Date.parse(row.week) - Date.parse(evidence.trends.rows[index - 1].week), 7 * 86400000, 'weekly continuity');
    assert.equal(row.partial, index === evidence.trends.rows.length - 1, 'only the current final week is partial');
  }
});
