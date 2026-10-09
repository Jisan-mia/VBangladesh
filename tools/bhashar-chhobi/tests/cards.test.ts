import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCard, selectCardObject, cardLines, limitText, objects } from '../lib/cards';
test('limits preserve complete Bangla graphemes',()=>{
  assert.equal(limitText('ক্ষক্ষক্ষ',2),'ক্ষক্ষ');
  assert.equal(limitText('আমার\nভাষা',20),'আমার ভাষা');
});
test('long captions fit in two bounded lines',()=>{
  const lines=cardLines('ক'.repeat(50));
  assert.deepEqual(lines,['ক'.repeat(14),'ক'.repeat(14)]);
});
test('all illustrated objects have unique IDs and Bangla names',()=>{
  assert.equal(new Set(objects.map(object=>object.id)).size,objects.length);
  assert.ok(objects.every(object=>/[\u0980-\u09ff]/.test(object.name)));
});

test("selecting the current object preserves the person's own word and pronunciation", () => {
  const card = { ...defaultCard, word: "নিজের শব্দ", pronunciation: "নিজের উচ্চারণ" };
  assert.equal(selectCardObject(card, card.objectId), card);
});

test("switching the picture updates its name together and preserves the person's area", () => {
  const card = { ...defaultCard, word: "নিজের শব্দ", area: "কুমিল্লা", pronunciation: "পুরোনো উচ্চারণ" };
  const changed = selectCardObject(card, "kite");
  assert.deepEqual([changed.objectId, changed.word, changed.area, changed.pronunciation, card.word], ["kite", "ঘুড়ি", "কুমিল্লা", "", "নিজের শব্দ"]);
});
