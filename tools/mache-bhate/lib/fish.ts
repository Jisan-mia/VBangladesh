import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 30;

export const groups = [
  { id: "nodi", label: "নদীর মাছ" },
  { id: "pukur", label: "পুকুর-বিলের মাছ" },
  { id: "sagor", label: "সাগরের মাছ" },
  { id: "chhoto", label: "ছোট মাছ" },
] as const;

/*
 * Names and spellings checked against:
 *  - Banglapedia (Bangla): মাছ https://bn.banglapedia.org/index.php?title=মাছ , কার্পমাছ, টাকিজাতীয় মাছ, বোয়াল, চাপিলা, টেংরা,
 *    চান্দামাছ, ছুরিমাছ, মলামাছ, চিংড়ি, বিদেশী মাছ (same host, ?title=<name>)
 *  - Banglapedia (English): https://en.banglapedia.org/index.php?title=Fish , ?title=Fisheries , ?title=Carp , ?title=Pomfret ,
 *    ?title=Freshwater_Shark , ?title=Tengra , ?title=Chapila , ?title=Snakehead , ?title=Barb
 *  - Bangladesh Fisheries Research Institute scientists via Bangla Tribune (2020), spellings of টেংরা, গুলশা, ঢেলা, খলিশা, পাবদা,
 *    শিং, ফলি, কাকিলা: https://www.banglatribune.com/country/642899/
 *  - Sea fish (Bangla names as listed with DoF album Uddin et al. 2022): https://marinebiodiversity.org.bd/species/<scientific-name>/
 *    e.g. lates-calcarifer, harpadon-nehereus, lepturacanthus-savala, pampus-chinensis, scomberomorus-commerson,
 *    otolithoides-pama, penaeus-monodon, and leptomelanosoma indicum at /species/leptomelalnosoma-indicum/
 * "এখন কম পাওয়া যায়" = threatened (CR/EN/VU) in IUCN Bangladesh (2015) Red List Vol. 5: Freshwater Fishes, as listed at
 *   https://en.bdfish.org/?p=4815 and https://en.bdfish.org/2017/02/list-of-freshwater-fishes-of-bangladesh/
 *
 * Share links store picks as bit positions: once links are public, only append new fish; never reorder or delete.
 */
export const fishes = [
  // নদীর মাছ
  { id: "ilish", group: "nodi", label: "ইলিশ" }, // Tenualosa ilisha, hilsa shad (LC 2015)
  { id: "air", group: "nodi", label: "আইড়", rare: true }, // Sperata aor, long-whiskered catfish (VU 2015)
  { id: "boal", group: "nodi", label: "বোয়াল", rare: true }, // Wallago attu, freshwater shark (VU 2015)
  { id: "baghair", group: "nodi", label: "বাঘাইড়", rare: true }, // Bagarius bagarius, goonch (CR 2015)
  { id: "chitol", group: "nodi", label: "চিতল", rare: true }, // Chitala chitala, clown knifefish (EN 2015)
  { id: "foli", group: "nodi", label: "ফলি", rare: true }, // Notopterus notopterus, bronze featherback (VU 2015)
  // Generic name: শাল বাইম Mastacembelus armatus is EN 2015 but তারা/গুচি বাইম are not, so no mark.
  { id: "baim", group: "nodi", label: "বাইম" }, // Mastacembelus / Macrognathus spp., spiny eels
  { id: "bele", group: "nodi", label: "বেলে" }, // Glossogobius giuris, tank goby (LC)
  { id: "kakila", group: "nodi", label: "কাকিলা" }, // Xenentodon cancila, freshwater garfish (LC); কাইক্কা in many districts
  { id: "golda", group: "nodi", label: "গলদা চিংড়ি" }, // Macrobrachium rosenbergii, giant freshwater prawn (not a fish, sold as one)
  // পুকুর-বিলের মাছ
  { id: "rui", group: "pukur", label: "রুই" }, // Labeo rohita, rohu (LC)
  { id: "katla", group: "pukur", label: "কাতলা" }, // Catla catla, catla (LC)
  { id: "mrigel", group: "pukur", label: "মৃগেল" }, // Cirrhinus cirrhosus (mrigala), mrigal (NT 2015, not threatened)
  { id: "kalbaush", group: "pukur", label: "কালবাউশ" }, // Labeo calbasu, black rohu (LC 2015)
  // The market পাঙ্গাশ is farmed Thai pangas Pangasianodon hypophthalmus (P. sutchi); the native river পাঙ্গাশ P. pangasius (EN) is rarely what people buy, so no mark.
  { id: "pangash", group: "pukur", label: "পাঙ্গাশ" },
  { id: "telapia", group: "pukur", label: "তেলাপিয়া" }, // Oreochromis niloticus / mossambicus, tilapia (introduced)
  { id: "koi", group: "pukur", label: "কই" }, // Anabas testudineus, climbing perch (LC)
  { id: "shing", group: "pukur", label: "শিং" }, // Heteropneustes fossilis, stinging catfish (LC)
  { id: "magur", group: "pukur", label: "মাগুর" }, // Clarias batrachus, walking catfish (LC)
  { id: "shol", group: "pukur", label: "শোল" }, // Channa striata, striped snakehead (LC)
  { id: "taki", group: "pukur", label: "টাকি" }, // Channa punctata, spotted snakehead (LC)
  { id: "pabda", group: "pukur", label: "পাবদা", rare: true }, // Ompok pabda, pabdah catfish (EN 2015)
  // সাগরের মাছ
  { id: "rupchanda", group: "sagor", label: "রূপচাঁদা" }, // Pampus chinensis (Banglapedia); markets also use it for silver pomfret P. argenteus
  { id: "loitta", group: "sagor", label: "লইট্টা" }, // Harpadon nehereus, Bombay duck
  { id: "churi", group: "sagor", label: "ছুরি" }, // Lepturacanthus savala / Trichiurus lepturus, ribbonfish
  { id: "koral", group: "sagor", label: "কোরাল" }, // Lates calcarifer, barramundi / Asian seabass (also called ভেটকি)
  { id: "surma", group: "sagor", label: "সুরমা" }, // Scomberomorus commerson, narrow-barred Spanish mackerel
  { id: "poa", group: "sagor", label: "পোয়া" }, // Sciaenidae croakers, e.g. Otolithoides pama, Panna microdon
  { id: "lakkha", group: "sagor", label: "লাক্ষা" }, // Leptomelanosoma indicum, Indian threadfin
  { id: "bagda", group: "sagor", label: "বাগদা চিংড়ি" }, // Penaeus monodon, giant tiger prawn
  // ছোট মাছ
  { id: "puti", group: "chhoto", label: "পুঁটি" }, // Puntius sophore / P. chola, barbs (LC)
  { id: "mola", group: "chhoto", label: "মলা" }, // Amblypharyngodon mola, mola carplet (LC)
  { id: "dhela", group: "chhoto", label: "ঢেলা" }, // Osteobrama cotio, cotio (NT 2015, not threatened)
  { id: "kachki", group: "chhoto", label: "কাচকি" }, // Corica soborna, Ganges river sprat (LC)
  { id: "chapila", group: "chhoto", label: "চাপিলা", rare: true }, // Gudusia chapra, Indian river shad (VU 2015)
  { id: "tengra", group: "chhoto", label: "টেংরা" }, // Mystus vittatus / M. tengara, striped dwarf catfish (LC)
  { id: "gulsha", group: "chhoto", label: "গুলশা" }, // Mystus cavasius, Gangetic mystus (NT 2015, not threatened)
  { id: "kholisha", group: "chhoto", label: "খলিশা" }, // Trichogaster fasciata, banded gourami (LC); Banglapedia spells খলিসা
  { id: "chanda", group: "chhoto", label: "চান্দা" }, // Chanda nama / Parambassis ranga, glassfish (LC)
  { id: "meni", group: "chhoto", label: "মেনি" }, // Nandus nandus, Gangetic leaffish, also ভেদা (not threatened in 2015)
] as const;

export type Fish = (typeof fishes)[number];
export type FishId = Fish["id"];
export type GroupId = (typeof groups)[number]["id"];
export type Shared = { selected: FishId[]; name: string };

export const DEFAULT_PICKS: FishId[] = ["rui", "ilish", "pangash"];

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const byId = new Map<string, Fish>(fishes.map(fish => [fish.id, fish]));
export const fishById = (id: FishId) => byId.get(id)!;
export const isFishId = (id: string): id is FishId => byId.has(id);
export const isRare = (id: FishId) => "rare" in fishById(id);

export function toggleFish(selected: readonly FishId[], id: string): FishId[] {
  if (!isFishId(id)) throw new RangeError("এই মাছটা তালিকায় নেই।");
  return selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function encodeSelection(selected: readonly FishId[]) {
  let bits = 0n;
  fishes.forEach((fish, index) => { if (selected.includes(fish.id)) bits |= 1n << BigInt(index); });
  return bits.toString(36);
}

// 40 bits fit in 8 base-36 digits; anything longer is not ours.
export function decodeSelection(code: string): FishId[] {
  if (!/^[0-9a-z]{1,8}$/.test(code)) return [];
  const bits = BigInt(parseInt(code, 36));
  return fishes.filter((_, index) => (bits >> BigInt(index)) & 1n).map(fish => fish.id);
}

export function shareHash({ selected, name }: Shared) {
  const params = new URLSearchParams({ f: encodeSelection(selected) });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const selected = decodeSelection(params.get("f") ?? "");
  if (!selected.length) return null;
  return { selected, name: cleanName(params.get("n") ?? "") };
}

/** Fish in list order (not tap order), so cards and captions read the same for everyone. */
export const inOrder = (selected: Iterable<FishId>) => { const set = new Set(selected); return fishes.filter(fish => set.has(fish.id)); };

export function tier(count: number) {
  if (count <= 5) return "মাছের সাথে সবে চেনাজানা";
  if (count <= 12) return "পাতে মাছ না হলে চলে না";
  if (count <= 20) return "বাজারের চেনা খদ্দের";
  if (count <= 30) return "খাঁটি মাছে-ভাতে";
  return "মাছের হাটের ওস্তাদ";
}

const join = (names: string[]) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} আর ${names.at(-1)}`;

/** The warm line on the card, chosen from what the person actually ticked. */
export function fishLine(selected: readonly FishId[]) {
  const picked = inOrder(selected);
  const count = picked.length;
  if (!count) return "ডালা এখনো ফাঁকা। ওপর থেকে চেনা মাছগুলো তুলে নাও।";
  const names = (filter: (fish: Fish) => boolean, max = 3) => picked.filter(filter).slice(0, max).map(fish => fish.label);
  const bony = names(fish => fish.group === "chhoto" || fish.id === "pabda" || fish.id === "shing");
  if (bony.length >= 3 && picked.filter(fish => fish.group === "chhoto").length >= 2) return `${join(bony)}: ছোট মাছের কাঁটা বাছতে জানো, এটা আসল প্রতিভা।`;
  const rare = names(fish => "rare" in fish, 2);
  if (rare.length >= 2) return `${join(rare)}, এখন কম পাওয়া যায় এমন মাছও তোমার পাতে উঠেছে।`;
  const sea = names(fish => fish.group === "sagor");
  if (picked.filter(fish => fish.group === "sagor").length >= 4) return `${join(sea)}: সাগরের মাছেও তোমার জিভ পাকা।`;
  if (picked.filter(fish => fish.group === "nodi").length >= 5) return "নদীর মাছে তোমার জিভ পাকা, ইলিশের কাঁটাও তোমাকে ভয় পায়।";
  if (count <= 3) return "শুরুটা চেনা মাছ দিয়ে। এবার মনে করে দেখো, আর কী কী খেয়েছ?";
  if (count <= 12) return "পাতে একটু মাছ না থাকলে ভাতটাই যেন জমে না।";
  if (count <= 24) return "বাজারে কোন মাছ টাটকা, তুমি চোখ বুজেও ধরে ফেলবে।";
  return "দেশের নদী, বিল আর সাগর, সবখানের মাছ তোমার চেনা।";
}

export type CardContent = {
  title: string;
  count: number;
  total: number;
  tier: string;
  line: string;
  match: string;
  fish: Fish[];
};

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const picked = inOrder(own.selected.filter(isFishId));
  const name = cleanName(own.name);
  const ids = new Set(picked.map(fish => fish.id));
  const common = friend ? friend.selected.filter(id => ids.has(id)).length : 0;
  return {
    title: name ? `${possessive(name)} ডালা` : "আমার ডালা",
    count: picked.length,
    total: fishes.length,
    tier: tier(picked.length),
    line: fishLine(picked.map(fish => fish.id)),
    match: friend && picked.length ? `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে ${bn(common)}টা মিলে গেছে` : "",
    fish: picked,
  };
}

export function previewTitle(shared: Shared) {
  const who = shared.name ? possessive(shared.name) : "এক বন্ধুর";
  return `${who} ডালায় ${bn(fishes.length)}টা দেশি মাছের ${bn(shared.selected.length)}টা — তোমার কয়টা?`;
}

export { possessive };
