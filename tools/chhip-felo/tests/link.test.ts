import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { parseShared, sharedHash, type Shared } from "../lib/challenge";
import { caption, compareLine, feat, friendClaim, humanLine, MISS_LINES, nearLine, previewTitle, weightText } from "../lib/lines";
import { BOSSES, FISH, parseAlbum, parseTrophies, addCatch, albumCount } from "../lib/species";

test("old links (before the rewrite) still parse by the old rules and write back unchanged", () => {
  // Made by the old game: level 7 (a বিল level then), 3 fish, biggest গজার.
  const old = "s=4321&t=1240&l=7&c=3&b=12&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  const parsed = parseShared(`#${old}`)!;
  assert.ok(parsed && parsed.old);
  assert.deepEqual({ ...parsed }, { seed: 4321, level: 7, grams: 1240, catches: 3, big: 12, name: "রাফি", mode: "n", lost: 0, won: false, boss: false, old: true });
  assert.equal(sharedHash(parsed), old);
  assert.equal(share.normalize(old), old);
  // Old level 15 had 6 casts; old level 1 only 3.
  assert.ok(parseShared("s=9&t=600&l=15&c=6&b=16"));
  assert.equal(parseShared("s=9&t=300&l=1&c=4&b=0"), null);
  assert.equal(parseShared("s=9&t=300&l=16&c=1&b=0"), null, "there was no old level 16");
  assert.ok(parseShared("s=9&t=0&l=2&c=0"), "an empty old basket");
});

test("new links carry the mode and the baits lost, and only a possible trip parses", () => {
  const mine: Omit<Shared, "won" | "boss"> = { seed: 77, level: 9, grams: 2400, catches: 3, big: 7, name: "মিম", mode: "h", lost: 1, old: false };
  const hash = sharedHash(mine);
  assert.match(hash, /v=2/); assert.match(hash, /d=h/); assert.match(hash, /k=1/);
  assert.deepEqual(parseShared(hash), { ...mine, won: true, boss: false });
  assert.equal(share.normalize(hash), hash);
  // A finale cleared: the boss is the biggest and its weight counts.
  const boss = BOSSES[0], finale = sharedHash({ seed: 5, level: 4, grams: 7000 + 120, catches: 2, big: boss.fish, name: "", mode: "n", lost: 0, old: false });
  const read = parseShared(finale)!;
  assert.ok(read.won && read.boss);
  assert.match(previewTitle(read), /বুড়ো রুই/);
  // A trip that ran out of baits.
  assert.ok(parseShared(sharedHash({ seed: 5, level: 9, grams: 300, catches: 1, big: 16, name: "", mode: "n", lost: 3, old: false })));
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ l: "17" }), variant({ l: "0" }), variant({ l: "09" }), variant({ v: "3" }), variant({ d: "x" }), variant({ k: "9" }), variant({ k: null }),
    variant({ c: "4" }), variant({ c: "2" }), variant({ b: "19" }), variant({ b: "99" }), variant({ t: "40" }), variant({ t: "999999" }),
    variant({ s: "0" }), variant({ k: "2" }), "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
    sharedHash({ seed: 5, level: 4, grams: 900, catches: 2, big: 0, name: "", mode: "n", lost: 0, old: false }),
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("the album keeps the heaviest of each fish; trophies keep the bosses", () => {
  let album = parseAlbum(null);
  assert.equal(albumCount(album), 0);
  let step = addCatch(album, 0, 50);
  assert.ok(step.isNew && !step.isRecord);
  album = step.album;
  step = addCatch(album, 0, 70);
  assert.ok(!step.isNew && step.isRecord);
  album = addCatch(step.album, 0, 40).album;
  assert.equal(album.punti, 70);
  assert.deepEqual(parseAlbum('{"punti":1.5,"koi":0,"rui":99999,"shark":5,"__proto__":3,"telapia":"200"}'), { telapia: 200 });
  for (const junk of ["[1,2]", "null", "{", '"x"', "42"]) assert.deepEqual(parseAlbum(junk), {});
  assert.deepEqual(parseTrophies('{"buro-rui":7000,"raja-air":5,"x":1}'), { "buro-rui": 7000 });
  assert.equal(new Set(FISH.map(fish => fish.id)).size, 20);
});

test("words: weights, misses, the near line, the card line, a friend's claim", () => {
  assert.equal(weightText(850), "৮৫০ গ্রাম");
  assert.equal(weightText(1240), "১ কেজি ২৪০ গ্রাম");
  assert.equal(weightText(2000), "২ কেজি");
  for (const line of Object.values(MISS_LINES)) assert.ok(line.length < 70 && line.normalize("NFC") === line);
  assert.equal(nearLine(2, true, 3, 1, "n"), "একটাও টোপ না হারালে ৩ তারা।");
  assert.equal(nearLine(2, true, 3, 0, "n"), "");
  assert.equal(nearLine(2, false, 1, 3, "n"), "আর ২টা মাছ হলেই পার।");
  assert.match(nearLine(2, true, 3, 0, "e"), /সহজে বড়জোর ২ তারা/);
  const base = { level: 5, catches: 3, big: 0, won: true, lost: 0, boss: false, mode: "n" as const };
  assert.equal(humanLine(base), "একটা টোপও নষ্ট হয়নি।");
  assert.match(humanLine({ ...base, big: 7 }), /ছিপে রুই উঠেছে/);
  assert.match(humanLine({ ...base, level: 4, boss: true }), /বুড়ো রুই উঠেছে/);
  assert.match(humanLine({ ...base, won: false, catches: 0 }), /ছুটিতে/);
  assert.equal(compareLine(1500, 1200, "রাফি"), "রাফির চেয়ে ৩০০ গ্রাম বেশি!");
  assert.equal(compareLine(1100, 1200, "রাফি"), "আর একটু হলেই! মাত্র ১০০ গ্রাম কম।");
  assert.match(friendClaim({ name: "রাফি", old: false }), /রাফির নিজের ফোনের হিসাব/);
  assert.match(friendClaim({ name: "", old: true }), /পুরোনো খেলার হিসাব/);
  assert.equal(feat({ level: 1, grams: 90, name: "", boss: false }), "এক বন্ধু লেভেল ১-এ ছিপ ফেলে ৯০ গ্রাম মাছ তুলেছে");
  assert.match(caption({ level: 12, grams: 9000, catches: 2, big: 18, boss: true }), /নদীতে কুঁজো চিতল তুললাম/);
  assert.match(caption({ level: 9, grams: 3200, catches: 3, big: 7, boss: false }), /নদীতে ৩টা মাছ, মোট ৩ কেজি ২০০ গ্রাম। সবচেয়ে বড়টা রুই/);
});

test("content meets the SEO limits, keeps its title and H1, and speaks তুমি", () => {
  assert.equal(site.title, "মাছ ধরার গেম: ছিপ ফেলো, ফাতনা দেখো");
  assert.equal(site.headline, "ছিপ ফেলো, ফাতনা ডুবলেই টান");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.match(site.description, /১৬টা লেভেল/);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  for (const word of ["নাম", "লেভেল", "ওজন"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const text = JSON.stringify(site);
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|জিতে নাও|টাকা জিত/);
  assert.equal(text.normalize("NFC"), text);
});
