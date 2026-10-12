// Seven hand-composed scenes. Each is built from the drawn parts with seeded choices: names, colours, how many, small shifts.
// Items come back in drawing order (back to front). `can` says what may change about an item to make a difference.
import { pick } from "../../../shared/game-core";
import * as A from "./art";
import { SCENE_H, SCENE_W, type Can, type Item, type Look, type Shape } from "./shapes";

type Rng = () => number;
export type World = 0 | 1 | 2;

const SKIES = [
  ["#bfe0ee", "#cde7f1", "#dbeff4", "#e8f5f4"],
  ["#86c6e6", "#9fd3ec", "#b9dff1", "#d2ebf4"],
  ["#f0a07a", "#f5b78a", "#f8cc9f", "#fbe0bb"],
] as const;
const SUNS = ["#ffd36b", "#ffe14d", "#ff9a52"];
const FAR_TREES = ["#7fae7a", "#6aa55e", "#8c8f62"];
const WATER = [["#7fbcd2", "#8ec6d8", "#a0cfdd"], ["#5aaed0", "#6db9d6", "#86c6de"], ["#9a9cc4", "#a9aacb", "#bcb8d2"]] as const;

const choose = <T,>(rng: Rng, list: readonly T[]) => list[pick(rng, list.length)];
const jitter = (rng: Rng, by: number) => Math.round((rng() * 2 - 1) * by * 10) / 10;
/** A colour from the list, and the rest as what a colour difference may turn it into. */
function paint(rng: Rng, list: readonly string[]): { color: string; can: Can } {
  const color = choose(rng, list);
  return { color, can: { color: list.filter(other => other !== color) } };
}

const item = (id: string, name: string, x: number, y: number, draw: (look: Look) => Shape[], look: Look = {}, can?: Can, s?: number): Item => ({ id, name, x, y, draw, look, can, s });
const scenery = (id: string, draw: (look: Look) => Shape[]): Item => ({ id, name: "", x: 0, y: 0, draw, look: {} });

function sky(rng: Rng, world: World, bottom: number, left: boolean) {
  const sunColor = SUNS[world], x = (at: number) => left ? at : SCENE_W - at;
  const birds = 3 + pick(rng, 2);
  return {
    back: [scenery("sky", A.bands(SCENE_W, 0, bottom, SKIES[world]))],
    sun: item("sun", "সূর্য", x(38 + jitter(rng, 4)), 30 + jitter(rng, 3), A.sun, { color: sunColor }, { missing: true, size: true, color: SUNS.filter(c => c !== sunColor) }),
    cloud: (id: string, at: number, y: number, s = 1) => item(id, "মেঘ", x(at + jitter(rng, 6)), y + jitter(rng, 3), A.cloud, {}, { missing: true, size: true }, s),
    birds: (at: number, y: number) => item("birds", "পাখি", x(at), y + jitter(rng, 4), A.birds, { count: birds }, { count: 2, missing: true }),
    x,
  };
}

const ground = (y: number, fill: string, edge: string) => scenery("ground", () => [A.flat(A.rect(0, y, SCENE_W, SCENE_H - y, fill)), A.flat(A.rect(0, y, SCENE_W, 3, edge))]);

const AWNINGS = ["#d9433b", "#2f8f4e", "#2f6fb2", "#e8a020", "#8e44ad"];
const SIGNS = ["#1f6f5c", "#b03a2e", "#22548f", "#7a3f98", "#c26a1a"];
const CRATES = ["#d9433b", "#2f7fc1", "#3e9e57", "#e0a43a"];
const CATS = ["#e8964a", "#8a8f98", "#f2e6d0", "#4a4a4a"];
const WOODS = ["#a8703f", "#2f8f8a", "#c0392b", "#3e7cc0"];
const BULB_ON = "#ffe066", BULB_OFF = "#d8d4c8";

// ——— বাজার ———

function fruitStall(rng: Rng, world: World): Item[] {
  const s = sky(rng, world, 178, rng() < 0.5);
  const awning = paint(rng, AWNINGS), sign = paint(rng, SIGNS), crate = paint(rng, CRATES);
  const fruits = [
    { id: "mango", name: "আমের ঝুড়ি", draw: A.mango, colors: ["#f2b518", "#8cc63f"] },
    { id: "malta", name: "মাল্টার ঝুড়ি", draw: A.roundFruit, colors: ["#a8c83a", "#f39c33"] },
    { id: "litchi", name: "লিচুর ঝুড়ি", draw: A.litchi, colors: ["#d6453d", "#f0a0a0"] },
    { id: "guava", name: "পেয়ারার ঝুড়ি", draw: A.guava, colors: ["#9ccc4a", "#f2d65a"] },
  ];
  const skip = pick(rng, fruits.length);
  const baskets = fruits.filter((_, index) => index !== skip).map((fruit, index) => {
    const color = paint(rng, fruit.colors);
    return item(fruit.id, fruit.name, 122 + index * 58, 138, A.basket(fruit.draw), { color: color.color, count: 5 + pick(rng, 3) }, { ...color.can, count: 3, missing: true }, 1.12);
  });
  const banana = paint(rng, ["#f4d03f", "#8cbf3f"]);
  return [
    ...s.back,
    scenery("trees", () => A.treeLine(SCENE_W, FAR_TREES[world], [18, 26, 20, 30, 22, 27, 19, 24, 28, 20])().map(shape => move(shape, 0, 162))),
    s.sun, s.cloud("cloud1", 92, 26), s.cloud("cloud2", 300, 30, 0.9), s.birds(318, 66),
    ground(176, "#d8c39b", "#bba57c"),
    item("tree", "গাছ", s.x(36), 182, A.tree, {}, { size: true, missing: true }, 1.25),
    scenery("stall", () => [
      A.rect(84, 64, 192, 76, "#6e4a2e"), A.line("M86 104 L274 104", "#4e3420", 1.4),
      A.rect(80, 40, 6, 146, "#7a4b28"), A.rect(274, 40, 6, 146, "#7a4b28"),
      A.rect(82, 136, 196, 7, "#a8703f"), A.rect(88, 143, 184, 43, "#c08a52"),
      A.line("M88 172 L272 172", "#8a5a2b", 0.8), ...A.flowerStrip(176)().map(shape => move(shape, 180, 157)),
    ]),
    item("awning", "দোকানের ছাউনি", 180, 44, A.awning, { color: awning.color }, awning.can),
    item("sign", "সাইনবোর্ড", 180, 39, A.signboard(signName(rng, "fruit")), { color: sign.color }, sign.can),
    item("bananas", "কলার ছড়ি", 112, 70, A.bananaBunch(6), { color: banana.color, count: 6 + pick(rng, 3) }, { ...banana.can, count: 4, missing: true }),
    item("bulb", "বাল্ব", 180 + jitter(rng, 6), 62, A.bulb(12), { color: BULB_ON }, { color: [BULB_OFF], missing: true }),
    item("scale", "দাঁড়িপাল্লা", 250, 76, A.hangingScale, {}, { missing: true, size: true }, 0.86),
    ...baskets,
    item("watermelon", "তরমুজ", 130 + jitter(rng, 6), 212, A.watermelon, {}, { missing: true, size: true }, 1.1),
    item("jackfruit", "কাঁঠাল", 232 + jitter(rng, 6), 213, A.jackfruit, {}, { missing: true, size: true }, 1.05),
    item("crate", "প্লাস্টিকের ক্যারেট", s.x(322), 206, A.crate, { color: crate.color }, { ...crate.can, missing: true }),
    catItem(rng, s.x(66), 210),
  ];
}

function teaStall(rng: Rng, world: World): Item[] {
  const s = sky(rng, world, 170, rng() < 0.5);
  const roof = paint(rng, ["#9aa7b0", "#c0533a", "#3f7f9c"]), sign = paint(rng, SIGNS), kettle = paint(rng, ["#b8c0c8", "#c27a3e", "#3f7f9c"]);
  const benchWood = paint(rng, WOODS), radio = paint(rng, ["#c0392b", "#2e86de", "#27ae60", "#e8a020"]), clock = paint(rng, ["#2e86de", "#c0392b", "#27ae60"]);
  const lid = paint(rng, ["#e74c3c", "#f1c40f", "#2e86de", "#27ae60"]), lid2 = paint(rng, ["#e74c3c", "#f1c40f", "#2e86de", "#27ae60"]);
  const teaPot = paint(rng, ["#c7653f", "#b8c0c8"]), tea = paint(rng, ["#b5651d", "#e9d3a6"]), calendar = paint(rng, ["#c0392b", "#27ae60", "#2e86de"]);
  const left = s.x(0) === 0;
  return [
    ...s.back,
    scenery("trees", () => [A.flat(A.path(shiftPath("M0 0 L0 -22 Q30 -36 60 -24 Q90 -38 120 -22 Q160 -34 200 -24 Q240 -40 280 -22 Q320 -34 360 -26 L360 0 Z", 0, 158), FAR_TREES[world]))]),
    s.sun, s.cloud("cloud1", 120, 24), s.birds(300, 34),
    ground(166, "#cdb894", "#b09a72"),
    item("tree", "গাছ", s.x(320), 172, A.tree, {}, { size: true, missing: true }, 1.35),
    scenery("shed", () => [
      A.rect(left ? 44 : 76, 66, 240, 100, "#8a5d38"), A.line(left ? "M44 100 L284 100" : "M76 100 L316 100", "#6a4528", 1.2),
      A.rect(left ? 40 : 72, 60, 6, 106, "#6a4528"), A.rect(left ? 282 : 314, 60, 6, 106, "#6a4528"),
      A.rect(left ? 40 : 72, 128, 248, 7, "#b07a44"), A.rect(left ? 48 : 80, 135, 232, 31, "#c99560"), A.line(left ? "M48 150 L280 150" : "M80 150 L312 150", "#8a5a2b", 0.8),
    ]),
    item("roof", "টিনের চাল", left ? 164 : 196, 64, A.tinRoof, { color: roof.color }, roof.can, 1.2),
    item("sign", "সাইনবোর্ড", left ? 150 : 210, 92, A.signboard(signName(rng, "tea"), 96), { color: sign.color }, sign.can),
    item("clock", "দেয়ালঘড়ি", left ? 240 : 120, 86, A.clock, { color: clock.color, flip: rng() < 0.5 }, { ...clock.can, flip: true, missing: true }),
    item("calendar", "ক্যালেন্ডার", left ? 272 : 88, 99, A.calendar, { color: calendar.color }, { ...calendar.can, missing: true }),
    item("packets", "চিপসের প্যাকেট", left ? 210 : 150, 62, A.packets, { count: 4 + pick(rng, 2) }, { count: 3, missing: true }),
    item("radio", "রেডিও", left ? 110 : 250, 126, A.radio, { color: radio.color, flip: rng() < 0.5 }, { ...radio.can, flip: true, missing: true }),
    item("stove", "", left ? 66 : 294, 128, A.stove),
    item("kettle", "কেতলি", left ? 66 : 294, 112, A.kettle, { color: kettle.color }, { ...kettle.can, flip: true }),
    item("steam", "কেতলির ভাপ", left ? 70 : 290, 86, A.steam, {}, { missing: true }),
    item("jar1", "বিস্কুটের বয়াম", left ? 150 : 210, 128, A.jar("#d9a35b"), { color: lid.color, count: 6 + pick(rng, 3) }, { ...lid.can, count: 4 }),
    item("jar2", "বিস্কুটের বয়াম", left ? 180 : 180, 128, A.jar("#8a5a3b"), { color: lid2.color, count: 6 + pick(rng, 3) }, { ...lid2.can, count: 4, missing: true }),
    item("tray", "চায়ের গ্লাস", left ? 236 : 124, 128, A.teaTray, { color: tea.color, count: 4 + pick(rng, 2) }, { ...tea.can, count: 3 }),
    item("mora", "মোড়া", left ? 228 : 132, 214, A.mora, { color: "#c9a05a" }, { missing: true, size: true }, 1.1),
    item("kolshi", "কলসি", left ? 30 : 330, 200, A.kolshi, { color: teaPot.color }, { ...teaPot.can, missing: true }),
    item("bench", "বেঞ্চ", left ? 136 : 224, 200, A.bench, { color: benchWood.color }, benchWood.can, 1.1),
    item("crow", "কাক", left ? 270 : 90, 48, A.crow, { flip: rng() < 0.5 }, { flip: true, missing: true }),
    catItem(rng, left ? 296 : 64, 210),
  ];
}

function vegetableMarket(rng: Rng, world: World): Item[] {
  const s = sky(rng, world, 112, rng() < 0.5);
  const umbrella = paint(rng, ["#d9433b", "#2f6fb2", "#e8a020", "#2f8f4e"]), umbrella2 = paint(rng, ["#d9433b", "#2f6fb2", "#e8a020", "#2f8f4e"]);
  const eggs = paint(rng, ["#6b3a7a", "#9ac25a"]), pumpkin = paint(rng, ["#e8902a", "#7fa040"]), chilli = paint(rng, ["#d63c2f", "#4f9a3a"]);
  const tomato = paint(rng, ["#e04535", "#f08a3a"]), onion = paint(rng, ["#b5486a", "#e8c48a"]), card = paint(rng, ["#f2e2b8", "#ffd23f", "#9fd3ec"]);
  const lemon = paint(rng, ["#9cc83a", "#f2d43a"]), lantern = paint(rng, ["#ffd76a", "#cfd8dc"]), crate = paint(rng, CRATES), flag = paint(rng, ["#ffffff", "#000000", "#ff66cc"]);
  return [
    ...s.back,
    s.sun, s.cloud("cloud1", 140, 24, 0.9),
    scenery("stalls", () => [
      A.flat(A.rect(0, 70, SCENE_W, 44, "#c7a27a")), ...[0, 1, 2, 3, 4, 5].map(index => A.flat(A.rect(index * 64 + 6, 76, 50, 30, index % 2 ? "#9a6a44" : "#b07d52"))),
      ...[0, 1, 2, 3, 4, 5].map(index => A.flat(A.path(`M${index * 64} 76 L${index * 64 + 62} 76 L${index * 64 + 54} 64 L${index * 64 + 8} 64 Z`, ["#c0533a", "#3f7f9c", "#d9a33a"][index % 3]))),
    ]),
    item("bunting", "পতাকার মালা", 180, 18, A.bunting(250, 12), { color: undefined }, { color: [flag.color] }),
    ground(112, "#b99a72", "#9a7c55"),
    item("umbrella", "বড় ছাতা", s.x(92), 176, A.umbrella, { color: umbrella.color }, umbrella.can, 1.05),
    item("umbrella2", "বড় ছাতা", s.x(268), 160, A.umbrella, { color: umbrella2.color }, umbrella2.can, 0.9),
    item("lantern", "হারিকেন", s.x(130), 92, A.lantern, { color: lantern.color }, { ...lantern.can, missing: true }),
    scenery("mats", () => [...A.mat(170, 34)().map(sh => move(sh, 92, 176)), ...A.mat(150, 30)().map(sh => move(sh, 268, 162)), ...A.mat(130, 26)().map(sh => move(sh, 180, 222))]),
    item("tomato", "টমেটোর স্তূপ", s.x(54), 170, A.heap("tomato"), { color: tomato.color, count: 7 + pick(rng, 3) }, { ...tomato.can, count: 5 }),
    item("eggplant", "বেগুন", s.x(112), 168, A.eggplants, { color: eggs.color, count: 4 + pick(rng, 3) }, { ...eggs.can, count: 3 }),
    item("chilli", "মরিচ", s.x(150), 172, A.chillies, { color: chilli.color }, chilli.can, 1.2),
    item("pumpkin", "মিষ্টিকুমড়া", s.x(232), 156, A.pumpkin, { color: pumpkin.color }, { ...pumpkin.can, size: true }),
    item("gourd", "লাউ", s.x(290), 156, A.gourd, { color: "#a9cf6a", flip: rng() < 0.5 }, { flip: true, size: true }),
    item("price", "দামের কার্ড", s.x(326), 150, A.priceCard(`৳${choose(rng, ["২০", "৩০", "৪০", "৫০"])}`), { color: card.color }, { ...card.can, missing: true }),
    item("onion", "পেঁয়াজ", s.x(140), 216, A.heap("onion"), { color: onion.color, count: 7 + pick(rng, 3) }, { ...onion.can, count: 5 }),
    item("cauli", "ফুলকপি", s.x(196), 216, A.cauliflower, {}, { missing: true, size: true }, 1.05),
    item("potato", "আলু", s.x(240), 218, A.heap("potato"), { color: "#c99a5a", count: 6 + pick(rng, 4) }, { count: 4 }),
    item("crate", "প্লাস্টিকের ক্যারেট", s.x(320), 214, A.crate, { color: crate.color }, { ...crate.can, missing: true }),
    item("lemons", "লেবুর ঝুড়ি", s.x(40), 216, A.basket(A.roundFruit), { color: lemon.color, count: 5 + pick(rng, 3) }, { ...lemon.can, count: 3, missing: true }, 1.1),
  ];
}

// ——— গ্রাম ———

function courtyard(rng: Rng, world: World): Item[] {
  const left = rng() < 0.5, s = sky(rng, world, 126, !left);
  const x = (at: number) => left ? at : SCENE_W - at;
  const doorPaint = paint(rng, ["#2f6fb2", "#2f8f4e", "#c0392b", "#7a4b28"]), shutter = paint(rng, ["#2f8f4e", "#2f6fb2", "#c0392b"]);
  const shirt = paint(rng, ["#e74c3c", "#2e86de", "#f1c40f", "#ffffff"]), lungi = paint(rng, ["#2e5e8c", "#2f8f4e", "#8e2d2d"]);
  const gamchha = paint(rng, ["#d63c2f", "#2f8f4e", "#2e86de"]), frock = paint(rng, ["#ff7aa8", "#f1c40f", "#9b59b6"]);
  const hen1 = paint(rng, ["#f4efe2", "#b5651d", "#3b3b3b"]), hen2 = paint(rng, ["#f4efe2", "#b5651d", "#3b3b3b"]);
  const goat = paint(rng, ["#f2ece0", "#3b3b3b", "#a0633a"]), well = paint(rng, ["#2f8f4e", "#c0392b", "#2f6fb2"]), pots = paint(rng, ["#c7653f", "#b8c0c8"]);
  const lineY = 100;
  return [
    ...s.back,
    s.sun, s.cloud("cloud1", 120, 26), s.birds(200, 30),
    scenery("trees", () => [A.flat(A.path(shiftPath("M0 0 L0 -24 Q24 -40 50 -28 Q80 -44 110 -26 Q140 -40 170 -28 Q200 -46 236 -26 Q270 -40 300 -28 Q330 -42 360 -26 L360 0 Z", 0, 130), FAR_TREES[world]))]),
    ground(126, "#e2c48f", "#c9a86e"),
    scenery("hut", () => A.hut(98)().map(sh => move(sh, x(66), 174))),
    item("door", "ঘরের দরজা", x(54), 174, A.door, { color: doorPaint.color }, doorPaint.can),
    item("window", "জানালা", x(90), 150, A.hutWindow, { color: shutter.color }, shutter.can),
    item("bird", "চালে বসা পাখি", x(84), 96, A.crow, { color: "#6b5a4a", flip: rng() < 0.5 }, { flip: true, missing: true }, 0.8),
    scenery("line", () => [A.rect(x(150) - 2, lineY - 6, 4, 82, "#7a4b28"), A.rect(x(326) - 2, lineY - 6, 4, 82, "#7a4b28"), A.line(`M${x(150)} ${lineY} Q${x(238)} ${lineY + 8} ${x(326)} ${lineY}`, "#5a4a3a", 1)]),
    item("bananaTree", "কলাগাছ", x(328), 182, A.bananaTree, { flip: left }, { flip: true, size: true }),
    item("shirt", "জামা", x(172), lineY + 2, A.shirt, { color: shirt.color }, { ...shirt.can, missing: true }),
    item("lungi", "লুঙ্গি", x(212), lineY + 4.5, A.lungi, { color: lungi.color }, lungi.can),
    item("gamchha", "গামছা", x(256), lineY + 4.5, A.gamchha, { color: gamchha.color }, { ...gamchha.can, missing: true }),
    item("frock", "ফ্রক", x(298), lineY + 2.5, A.frock, { color: frock.color }, { ...frock.can, size: true }),
    item("well", "চাপকল", x(160), 210, A.tubeWell, { color: well.color, flip: !left }, { ...well.can, flip: true }),
    item("pots", "কলসি", x(206), 212, A.pots, { color: pots.color, count: 3 + pick(rng, 2) }, { ...pots.can, count: 2 }),
    item("hen1", "মুরগি", x(262), 204, A.hen, { color: hen1.color, flip: rng() < 0.5 }, { ...hen1.can, flip: true, missing: true }),
    item("hen2", "মুরগি", x(310), 214, A.hen, { color: hen2.color, flip: rng() < 0.5 }, { ...hen2.can, flip: true, missing: true }, 0.9),
    item("goat", "ছাগল", x(112), 214, A.goat, { color: goat.color, flip: rng() < 0.5 }, { ...goat.can, flip: true, missing: true }, 1.1),
  ];
}

function paddyField(rng: Rng, world: World): Item[] {
  const left = rng() < 0.5, s = sky(rng, world, 130, left);
  const x = (at: number) => left ? at : SCENE_W - at;
  const fieldGoat = paint(rng, ["#f2ece0", "#3b3b3b", "#a0633a"]), kite = paint(rng, ["#e74c3c", "#f1c40f", "#2e86de", "#9b59b6"]), shirt = paint(rng, ["#c0392b", "#2e86de", "#e8a020"]), cow = paint(rng, ["#a0633a", "#f2ece0", "#5a4636"]);
  return [
    ...s.back,
    s.sun, s.cloud("cloud1", 120, 30), s.cloud("cloud2", 300, 22, 0.8), s.birds(196, 50),
    item("kite", "ঘুড়ি", x(266) + jitter(rng, 6), 54, A.kite, { color: kite.color, flip: rng() < 0.5 }, { ...kite.can, flip: true, missing: true }),
    scenery("trees", () => [A.flat(A.path(shiftPath("M0 0 L0 -12 Q20 -26 44 -16 Q70 -30 96 -14 Q130 -28 160 -16 Q190 -32 220 -14 Q256 -28 290 -16 Q320 -30 360 -14 L360 0 Z", 0, 132), FAR_TREES[world]))]),
    item("farHut", "দূরের ঘর", x(150), 126, A.smallHut, {}, { missing: true }, 1.1),
    scenery("field", () => {
      const out: Shape[] = [A.flat(A.rect(0, 130, SCENE_W, SCENE_H - 130, "#8cc152"))];
      for (let row = 0; row < 9; row++) out.push(A.flat(A.rect(0, 136 + row * 10 + row * row * 0.4, SCENE_W, 2 + row * 0.35, "#6fa83e")));
      out.push(A.flat(A.path(left ? "M150 225 L196 225 L176 130 L170 130 Z" : "M164 225 L210 225 L190 130 L184 130 Z", "#c9a46a")));
      return out;
    }),
    item("palm", "তালগাছ", x(56), 158, A.palm, {}, { size: true, missing: true }, 1.05),
    item("haystack", "খড়ের গাদা", x(316), 158, A.haystack, {}, { size: true, missing: true }, 0.75),
    item("egret", "বক", x(250), 168, A.egret, { flip: rng() < 0.5 }, { flip: true, missing: true }, 1.1),
    item("scarecrow", "কাকতাড়ুয়া", x(108), 206, A.scarecrow, { color: shirt.color, flip: rng() < 0.5 }, { ...shirt.can, flip: true }, 1.15),
    item("cow", "গরু", x(268), 214, A.cow, { color: cow.color, flip: rng() < 0.5 }, { ...cow.can, flip: true }, 1.2),
    item("goat", "ছাগল", x(34), 214, A.goat, { color: fieldGoat.color, flip: rng() < 0.5 }, { ...fieldGoat.can, flip: true, missing: true }, 1.05),
    item("crow", "কাক", x(134), 150, A.crow, { flip: rng() < 0.5 }, { flip: true, missing: true }, 0.8),
  ];
}

function riverGhat(rng: Rng, world: World): Item[] {
  const left = rng() < 0.5, s = sky(rng, world, 96, !left);
  const x = (at: number) => left ? at : SCENE_W - at;
  const sail = paint(rng, ["#f2e6c9", "#e74c3c", "#e8a020", "#2e86de"]), duck = paint(rng, ["#ffffff", "#b5895a"]), lily = paint(rng, ["#ff8fb1", "#ffffff"]);
  const kolshi = paint(rng, ["#c7653f", "#b8c0c8"]), sign = paint(rng, SIGNS);
  const water = WATER[world];
  return [
    ...s.back,
    s.sun, s.cloud("cloud1", 150, 24), s.cloud("cloud2", 290, 36, 0.8), s.birds(220, 52),
    scenery("bank", () => [
      A.flat(A.path(shiftPath("M0 0 L0 -10 Q30 -22 60 -12 Q90 -24 130 -10 Q170 -22 210 -12 Q250 -26 290 -10 Q330 -20 360 -12 L360 0 Z", 0, 100), FAR_TREES[world])),
      A.flat(A.rect(0, 98, SCENE_W, 4, "#c9b48a")),
    ]),
    item("farHut", "ওপারের ঘর", x(250), 98, A.smallHut, {}, { missing: true }, 0.9),
    scenery("water", () => [
      ...water.map((color, index) => A.flat(A.rect(0, 102 + index * 41, SCENE_W, 42, color))),
      ...[[40, 120], [120, 140], [210, 126], [300, 150], [70, 176], [180, 198], [280, 186], [330, 212]].map(([wx, wy]) => A.line(`M${wx} ${wy} Q${wx + 6} ${wy - 3} ${wx + 12} ${wy} Q${wx + 18} ${wy - 3} ${wx + 24} ${wy}`, "#ffffff", 0.9)),
    ]),
    item("smallBoat", "দূরের নৌকা", x(300), 118, A.smallBoat, { flip: rng() < 0.5 }, { flip: true, missing: true }, 1.1),
    item("fish", "লাফানো মাছ", x(172) + jitter(rng, 8), 138, A.fish, { flip: rng() < 0.5 }, { flip: true, missing: true }),
    item("boat", "নৌকা", x(232), 172, A.boat, { color: sail.color, flip: !left }, { ...sail.can, flip: true }, 1.1),
    item("ducks", "হাঁস", x(140), 198, A.ducks, { color: duck.color, count: 3 + pick(rng, 2) }, { ...duck.can, count: 2 }),
    item("lilies", "শাপলা", x(300), 210, A.lilies, { color: lily.color, count: 3 + pick(rng, 2) }, { ...lily.can, count: 2 }),
    scenery("ghat", () => [...A.steps(96)().map(sh => move(sh, x(46), 225)), A.flat(A.rect(left ? 0 : SCENE_W - 6, 150, 6, 75, "#a24a33"))]),
    item("tree", "নারকেল গাছ", x(22), 186, A.coconutTree, { flip: !left }, { flip: true, size: true }, 1.05),
    item("sign", "ঘাটের নাম", x(78), 190, A.postSign(signName(rng, "ghat")), { color: sign.color }, sign.can),
    item("kolshi", "কলসি", x(34), 198, A.kolshi, { color: kolshi.color }, { ...kolshi.can, missing: true }),
  ];
}

// ——— শহর ———

function rickshawLane(rng: Rng, world: World): Item[] {
  const left = rng() < 0.5, s = sky(rng, world, 80, left);
  const x = (at: number) => left ? at : SCENE_W - at;
  const hood = paint(rng, ["#e74c3c", "#2e86de", "#27ae60", "#f1c40f"]), shutter1 = paint(rng, ["#7f8c8d", "#2e86de", "#c0392b"]), shutter2 = paint(rng, ["#7f8c8d", "#27ae60", "#e8a020"]);
  const tank = paint(rng, ["#2b2b2b", "#2e86de", "#e8a020"]), sign = paint(rng, SIGNS), kite = paint(rng, ["#e74c3c", "#f1c40f", "#9b59b6"]);
  const lamp = paint(rng, [BULB_ON, BULB_OFF]), flowers = paint(rng, ["#e74c3c", "#f1c40f", "#ff7aa8"]);
  const wall1 = choose(rng, ["#e8c9a0", "#d9e3c4", "#f0d9c4"]), wall2 = choose(rng, ["#c9d8e4", "#e8d6a0", "#e4c4c4"]);
  return [
    ...s.back,
    s.sun, s.cloud("cloud1", 170, 22, 0.85), s.birds(240, 26),
    scenery("far", () => [A.flat(A.rect(0, 52, SCENE_W, 120, "#b9b2a6")), ...[0, 1, 2, 3, 4, 5, 6].map(index => A.flat(A.rect(index * 54 - 4, 40 + (index % 3) * 8, 46, 130, ["#a9a196", "#c4bcae", "#9e978c"][index % 3])))]),
    item("tank", "পানির ট্যাংক", x(70), 62, A.tank, { color: tank.color }, { ...tank.can, missing: true }),
    item("dish", "ডিশ অ্যান্টেনা", x(286), 66, A.dish, { flip: rng() < 0.5 }, { flip: true, missing: true }, 1.2),
    scenery("buildings", () => [...A.building(124, 120, wall1, 3, 4)().map(sh => move(sh, x(66), 182)), ...A.building(116, 114, wall2, 3, 3)().map(sh => move(sh, x(298), 180))]),
    item("ac", "এসি", x(30), 106, A.acBox, {}, { missing: true }),
    item("balcony", "বারান্দার টব", x(100), 116, A.balconyPots, { color: flowers.color, count: 3 + pick(rng, 2) }, { ...flowers.can, count: 2 }),
    item("shutter1", "দোকানের শাটার", x(44), 182, A.shutter, { color: shutter1.color }, shutter1.can),
    item("sign", "সাইনবোর্ড", x(94), 152, A.signboard(signName(rng, "street"), 80), { color: sign.color }, sign.can),
    item("shutter2", "দোকানের শাটার", x(298), 180, A.shutter, { color: shutter2.color }, shutter2.can),
    scenery("pole", () => A.pole(124)().map(sh => move(sh, x(182), 186))),
    scenery("wires", () => [...A.wires(176, 10)().map(sh => move(sh, left ? 182 : 6, 68)), ...A.wires(182, 8)().map(sh => move(sh, left ? 0 : 178, 68))]),
    item("crow", "তারের কাক", x(232), 70, A.crow, { flip: rng() < 0.5 }, { flip: true, missing: true }),
    item("kite", "তারে আটকানো ঘুড়ি", x(142), 66, A.kite, { color: kite.color }, { ...kite.can, missing: true }, 0.75),
    scenery("road", A.road(SCENE_W, 184, 41)),
    item("lamp", "ল্যাম্পপোস্ট", x(236), 186, A.lampPost, { color: lamp.color }, { ...lamp.can, missing: true }),
    item("rickshaw", "রিকশা", x(150), 216, A.rickshaw, { color: hood.color, flip: rng() < 0.5 }, { ...hood.can, flip: true }, 1.2),
    catItem(rng, x(300), 214, 0.95),
  ];
}

function catItem(rng: Rng, x: number, y: number, scale?: number) {
  const fur = paint(rng, CATS);
  return item("cat", "বিড়াল", x, y, A.cat, { color: fur.color, flip: rng() < 0.5 }, { ...fur.can, flip: true, missing: true }, scale);
}

function move(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.k) {
    case "p": return { ...shape, d: shiftPath(shape.d, dx, dy) };
    default: return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
}

/** Moves every point of an M/L/Q/C/Z path. */
export function shiftPath(dd: string, dx: number, dy: number) {
  let index = 0;
  return dd.replace(/-?(?:\d+\.?\d*|\.\d+)/g, value => String(Math.round((Number(value) + (index++ % 2 ? dy : dx)) * 100) / 100));
}

const SIGN_NAMES = {
  fruit: ["মায়ের দোয়া ফল ভান্ডার", "রহিম ফল বিতান", "তাজা ফল ঘর", "নিউ সততা ফল ঘর", "করিম ফল ভান্ডার"],
  tea: ["মামার চা", "খালেক টি স্টল", "রহমত চা ঘর", "আড্ডা টি স্টল", "জলিলের চা"],
  ghat: ["কদমতলী ঘাট", "সোনাচর ঘাট", "বটতলা ঘাট", "নতুনহাট ঘাট"],
  street: ["হাসি স্টোর", "রুচি হোটেল", "নিউ টেইলার্স", "মিতা স্টোর"],
} as const;
const signName = (rng: Rng, kind: keyof typeof SIGN_NAMES) => choose(rng, SIGN_NAMES[kind]);

export const TEMPLATES = [
  { id: "fruit", name: "ফলের দোকান", build: fruitStall },
  { id: "tea", name: "চায়ের দোকান", build: teaStall },
  { id: "veg", name: "সবজির বাজার", build: vegetableMarket },
  { id: "yard", name: "গ্রামের উঠান", build: courtyard },
  { id: "field", name: "ধানখেত", build: paddyField },
  { id: "ghat", name: "নদীর ঘাট", build: riverGhat },
  { id: "lane", name: "রিকশার গলি", build: rickshawLane },
] as const;
