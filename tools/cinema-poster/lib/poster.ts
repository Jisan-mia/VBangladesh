import { possessive } from "../../../shared/bangla";

// Every title, line and credit here is invented for this tool: no real films, actors, studios or cinema halls.
// Titles were checked by hand against well-known Dhallywood titles; keep new ones specific and silly so they can't collide.
export const MAX_NAME_LENGTH = 20;

export const genres = [
  {
    id: "prem", chip: "প্রেম", label: "প্রেমের ছবি",
    ribbon: "শুভমুক্তি!", stamp: "সারা দেশে একযোগে",
    // Share links store the title as an index: only append, never reorder or delete.
    titles: ["লোডশেডিংয়ে প্রেম", "রিকশায় প্রথম দেখা", "টিউশনির পথে প্রেম", "ফুচকার দোকানে মন", "সিন হলো, রিপ্লাই এলো না", "বৃষ্টিভেজা বাসস্ট্যান্ড", "তোমার জন্য এক প্লেট বিরিয়ানি", "লাইব্রেরির শেষ বেঞ্চ", "দুই ছাদের প্রেম", "মেট্রোতে দেখা হয়েছিল", "চিঠি এলো না কেন", "টংয়ের চায়ে প্রেম"],
    line: "এমন প্রেম আগে দেখেনি ঢাকাই সিনেমা!",
    pair: "এক রিকশায় দুই হৃদয়!",
    credits: "কাহিনি: টিউশনির পথ · গান: রেডিওর অনুরোধের আসর",
  },
  {
    id: "action", chip: "অ্যাকশন", label: "অ্যাকশন ছবি",
    ribbon: "আসিতেছে!", stamp: "সারা দেশে একযোগে",
    titles: ["জ্যামের রাজা", "লাস্ট বাস মিস", "মশার বিরুদ্ধে যুদ্ধ", "গরম চায়ের প্রতিশোধ", "ভাড়া কত মামা?", "লোডশেডিং এক্সপ্রেস", "ইলিশ মিশন চাঁদপুর", "বাজারের ব্যাগ হাতে বীর", "ছাদের ঘুড়ির লড়াই", "লিফট নষ্ট, সিঁড়িই ভরসা", "শেষ বলে ছক্কা", "ঢিশুম ঢিশুম মহল্লা"],
    line: "এক হাতে বাজারের ব্যাগ, অন্য হাতে ন্যায়বিচার!",
    pair: "দুই বন্ধু, এক মিশন!",
    credits: "স্টান্ট: পাড়ার ছাদ · অ্যাকশন: গলির ক্রিকেট দল",
  },
  {
    id: "family", chip: "পারিবারিক", label: "পারিবারিক ছবি",
    ribbon: "ব্যাপক সাফল্যের পর", stamp: "সপরিবারে দেখুন",
    titles: ["আম্মার হাতের রান্না", "নানাবাড়ির ঈদ", "ছোট বোনের সালামি", "আব্বার রিমোট", "যৌথ পরিবারের ফ্রিজ", "দাদির পানের বাটা", "শ্বশুরবাড়ির দাওয়াত", "বড় ভাইয়ের সাইকেল", "সেমাইয়ের হাঁড়ি", "সবাই মিলে পিকনিক", "ঈদের আগের রাত", "চাচাতো ভাইয়ের বিয়ে"],
    line: "সপরিবারে দেখার মতো ছবি।",
    pair: "এক ছাদের নিচে হাসি-কান্না!",
    credits: "রান্না: আম্মা · পরিবেশনা: নানাবাড়ি ফিল্মস",
  },
  {
    id: "comedy", chip: "কমেডি", label: "হাসির ছবি",
    ribbon: "হাউসফুল!", stamp: "সপরিবারে দেখুন",
    titles: ["ওয়াইফাই পাসওয়ার্ড কত?", "চার্জারটা কে নিলো?", "মামা, হাফ ভাড়া!", "বিয়েবাড়ির রোস্ট শেষ", "অফিসে আবার লেট", "পরীক্ষার আগের রাত", "গ্রুপ স্টাডির নামে আড্ডা", "টং দোকানের বাকির খাতা", "দাওয়াতে গিয়ে না খেয়ে ফেরা", "রিমোটের দখল", "পাশের বাসার আন্টি সব জানে", "ব্যাচেলর মেসের ডাল"],
    line: "হাসতে হাসতে পেট ব্যথা হলে আমরা দায়ী না।",
    pair: "দুজন মিলে হাসির তুফান!",
    credits: "সংলাপ: চায়ের দোকান · হাসি: পুরো মহল্লা",
  },
] as const;

export type Genre = (typeof genres)[number];
export type GenreId = Genre["id"];
/** What a share link carries. The photo never goes in here. */
export type PosterState = { genre: GenreId; title: number; name: string; costar: string };
export type Poster = { genre: GenreId; ribbon: string; stamp: string; title: string; name: string; costar: string; line: string; credits: string };

export const DEFAULT_STATE: PosterState = { genre: "prem", title: 0, name: "", costar: "" };
/** The classic credit for an unknown cast; shown until a name is typed. */
export const NEW_FACES = "একঝাঁক নতুন মুখ";

export const genreById = (id: GenreId): Genre => genres.find(genre => genre.id === id)!;
const isGenreId = (id: string | null): id is GenreId => genres.some(genre => genre.id === id);

// shortcut: a small Bangla + Banglish blocklist (same idea as amar-jersey's); move to shared/ if a third tool needs it.
const blockedParts = ["চোদ", "চুদ", "খানকি", "খাংকি", "মাগি", "মাগী", "হারামি", "হারামজাদ", "বেশ্যা", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "শুয়রেরবাচ্চা", "গান্ডু", "ভোদা", "fuck", "bitch", "pussy", "porn", "khanki", "khangki", "harami", "haramjada", "haramzada", "madarchod", "bokachod", "choda", "chodi", "chudi", "gandu", "kuttarbach", "bainchod", "behenchod"];
const blockedWords = new Set(["বাল", "bal", "baal", "chod", "chud", "chodu", "shit", "magi", "randi", "besha", "dick", "sex", "nude", "cock", "ass"]);

export function isBlocked(text: string) {
  const lower = text.normalize("NFC").toLowerCase().replace(/[‌‍]/g, "");
  const squeezed = lower.replace(/[^ঀ-৿a-z]/g, "");
  return blockedParts.some(part => squeezed.includes(part)) || lower.split(/[^ঀ-৿a-z]+/).some(word => blockedWords.has(word));
}

/** NFC, no control or bidi-override characters (ZWJ/ZWNJ stay for Bangla shaping), single spaces, capped; blocked names become "". */
export function cleanName(raw: string) {
  const flat = raw.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  const name = Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
  return isBlocked(name) ? "" : name;
}

const wrap = (index: number, length: number) => ((Math.trunc(index) % length) + length) % length;

export function nextTitle(state: PosterState): PosterState {
  return { ...state, title: wrap(state.title + 1, genreById(state.genre).titles.length) };
}

export function createPoster(state: PosterState): Poster {
  const genre = genreById(state.genre);
  const name = cleanName(state.name);
  // A co-star without a lead would read as the lead; and the same name twice is just one person.
  const costar = name ? cleanName(state.costar) : "";
  const pair = costar && costar !== name;
  return {
    genre: genre.id,
    ribbon: genre.ribbon,
    stamp: genre.stamp,
    title: genre.titles[wrap(state.title, genre.titles.length)],
    name,
    costar: pair ? costar : "",
    line: pair ? `${name}-${costar} জুটি: ${genre.pair}` : genre.line,
    credits: genre.credits,
  };
}

export function shareHash(state: PosterState) {
  const params = new URLSearchParams({ g: state.genre, t: String(wrap(state.title, genreById(state.genre).titles.length)) });
  const name = cleanName(state.name);
  const costar = name ? cleanName(state.costar) : "";
  if (name) params.set("n", name);
  if (costar && costar !== name) params.set("c", costar);
  return "#" + params.toString();
}

/** A shared poster from a #hash, or null when the hash isn't one (e.g. an in-page anchor). */
export function parseShareHash(hash: string): PosterState | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const genre = params.get("g");
  if (!isGenreId(genre)) return null;
  const title = Number(params.get("t"));
  const count = genreById(genre).titles.length;
  const name = cleanName(params.get("n") ?? "");
  return {
    genre,
    title: Number.isInteger(title) && title >= 0 && title < count ? title : 0,
    name,
    costar: name ? cleanName(params.get("c") ?? "") : "",
  };
}

/** "আসিতেছে! রাফির নতুন ছবি “লোডশেডিংয়ে প্রেম”" for link previews. */
export function previewTitle(state: PosterState) {
  const poster = createPoster(state);
  return poster.name ? `আসিতেছে! ${possessive(poster.name)} নতুন ছবি “${poster.title}”` : `আসিতেছে! নতুন ছবি “${poster.title}”`;
}

export { possessive };
