import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;

export const shelves = [
  { id: "himu", label: "হিমু" },
  { id: "misir", label: "মিসির আলি" },
  { id: "shubhro", label: "শুভ্র" },
  { id: "uponnash", label: "উপন্যাস" },
] as const;
export type ShelfId = (typeof shelves)[number]["id"];

// Titles only, each checked against two bibliographies (series as they list them):
//   Banglapedia, "আহমেদ, হুমায়ূন": https://bn.banglapedia.org/index.php/আহমেদ,_হুমায়ূন
//   Wikipedia, "হুমায়ূন আহমেদের গ্রন্থতালিকা": https://bn.wikipedia.org/wiki/হুমায়ূন_আহমেদের_গ্রন্থতালিকা
// Birth date (13 Nov 1948): https://en.wikipedia.org/wiki/Humayun_Ahmed
// Years differ between sources, so the tool shows none. `short` is the card's spine label.
// Share links store picks as bit positions: only append new books; never reorder or delete.
export const books = [
  { id: "moyurakkhi", shelf: "himu", title: "ময়ূরাক্ষী", short: "ময়ূরাক্ষী" },
  { id: "dorjar-opashe", shelf: "himu", title: "দরজার ওপাশে", short: "দরজার ওপাশে" },
  { id: "himu", shelf: "himu", title: "হিমু", short: "হিমু" },
  { id: "parapar", shelf: "himu", title: "পারাপার", short: "পারাপার" },
  { id: "nilpodmo", shelf: "himu", title: "হিমুর হাতে কয়েকটি নীলপদ্ম", short: "নীলপদ্ম" },
  { id: "ditiyo-prohor", shelf: "himu", title: "হিমুর দ্বিতীয় প্রহর", short: "দ্বিতীয় প্রহর" },
  { id: "rupali-ratri", shelf: "himu", title: "হিমুর রূপালী রাত্রি", short: "রূপালী রাত্রি" },
  { id: "himur-biye", shelf: "himu", title: "আজ হিমুর বিয়ে", short: "হিমুর বিয়ে" },
  { id: "holud-himu", shelf: "himu", title: "হলুদ হিমু কালো র‍্যাব", short: "হলুদ হিমু" },
  { id: "debi", shelf: "misir", title: "দেবী", short: "দেবী" },
  { id: "nishithini", shelf: "misir", title: "নিশীথিনী", short: "নিশীথিনী" },
  { id: "nishad", shelf: "misir", title: "নিষাদ", short: "নিষাদ" },
  { id: "onnobhubon", shelf: "misir", title: "অন্যভুবন", short: "অন্যভুবন" },
  { id: "brihonnola", shelf: "misir", title: "বৃহন্নলা", short: "বৃহন্নলা" },
  { id: "amii-misir", shelf: "misir", title: "আমিই মিসির আলি", short: "আমিই মিসির আলি" },
  { id: "omimangsito", shelf: "misir", title: "মিসির আলির অমীমাংসিত রহস্য", short: "অমীমাংসিত রহস্য" },
  { id: "daruchini", shelf: "shubhro", title: "দারুচিনি দ্বীপ", short: "দারুচিনি দ্বীপ" },
  { id: "rupali-dwip", shelf: "shubhro", title: "রূপালী দ্বীপ", short: "রূপালী দ্বীপ" },
  { id: "shubhro", shelf: "shubhro", title: "শুভ্র", short: "শুভ্র" },
  { id: "shubhro-bone", shelf: "shubhro", title: "শুভ্র গেছে বনে", short: "শুভ্র গেছে বনে" },
  { id: "nondito-noroke", shelf: "uponnash", title: "নন্দিত নরকে", short: "নন্দিত নরকে" },
  { id: "shonkhonil", shelf: "uponnash", title: "শঙ্খনীল কারাগার", short: "শঙ্খনীল কারাগার" },
  { id: "kothao-keu-nei", shelf: "uponnash", title: "কোথাও কেউ নেই", short: "কোথাও কেউ নেই" },
  { id: "aguner-poroshmoni", shelf: "uponnash", title: "আগুনের পরশমণি", short: "আগুনের পরশমণি" },
  { id: "srabon-megh", shelf: "uponnash", title: "শ্রাবণ মেঘের দিন", short: "শ্রাবণ মেঘের দিন" },
  { id: "jochona-jononi", shelf: "uponnash", title: "জোছনা ও জননীর গল্প", short: "জোছনা ও জননী" },
  { id: "lilaboti", shelf: "uponnash", title: "লীলাবতী", short: "লীলাবতী" },
  { id: "moddhanno", shelf: "uponnash", title: "মধ্যাহ্ন", short: "মধ্যাহ্ন" },
  { id: "badshah-namdar", shelf: "uponnash", title: "বাদশাহ নামদার", short: "বাদশাহ নামদার" },
  { id: "deyal", shelf: "uponnash", title: "দেয়াল", short: "দেয়াল" },
] as const satisfies ReadonlyArray<{ id: string; shelf: ShelfId; title: string; short: string }>;

export type Book = (typeof books)[number];
export type BookId = Book["id"];
export type Shared = { read: BookId[]; name: string };

/** Three widely read books, pre-ticked so the first screen shows how it works. */
export const sample: BookId[] = ["moyurakkhi", "debi", "kothao-keu-nei"];

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const bookIds = new Set<string>(books.map(book => book.id));
export const isBookId = (id: string): id is BookId => bookIds.has(id);
const order = (ids: Iterable<BookId>) => { const set = new Set(ids); return books.filter(book => set.has(book.id)).map(book => book.id); };

export function toggleBook(read: readonly BookId[], id: string): BookId[] {
  if (!isBookId(id)) throw new RangeError("এই বইটা তাকে নেই।");
  return read.includes(id) ? read.filter(item => item !== id) : order([...read, id]);
}

export function cleanName(name: string) {
  // NFC first so the same name typed on two keyboards counts the same; then strip control and bidi characters.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH).trim();
}

const LIMIT = 2 ** books.length;

export function encodeRead(read: readonly BookId[]) {
  return books.reduce((bits, book, index) => read.includes(book.id) ? bits + 2 ** index : bits, 0).toString(36);
}

export function decodeRead(code: string): BookId[] | null {
  if (!/^[0-9a-z]{1,7}$/.test(code)) return null;
  const bits = parseInt(code, 36);
  if (!(bits < LIMIT)) return null;
  return books.filter((_, index) => Math.floor(bits / 2 ** index) % 2 === 1).map(book => book.id);
}

export function shareHash({ read, name }: Shared) {
  const params = new URLSearchParams({ b: encodeRead(read) });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

/** A shared shelf, or null for anything that isn't one (including in-page anchors like #result). Zero books read is a valid shelf. */
export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const read = decodeRead(params.get("b") ?? "");
  return read ? { read, name: cleanName(params.get("n") ?? "") } : null;
}

export function tierFor(count: number) {
  if (count <= 5) return "সবে হাঁটা শুরু";
  if (count <= 15) return "জোছনাপ্রেমী";
  if (count <= 25) return "হিমু হতে চাওয়া";
  return "পকেটহীন পাঞ্জাবি";
}

const onShelf = (read: ReadonlySet<BookId>, shelf: ShelfId) => {
  const all = books.filter(book => book.shelf === shelf);
  return { read: all.filter(book => read.has(book.id)).length, total: all.length };
};

/** The card's human line: what the picks say about the reader, not just how many. */
export function readerLine(ids: readonly BookId[]) {
  const read = new Set(ids);
  const count = read.size;
  const full = (shelf: ShelfId) => { const { read: done, total } = onShelf(read, shelf); return done === total; };
  if (count === 0) return "তাকটা এখনো খালি। ময়ূরাক্ষী দিয়ে শুরু করো, এক বিকেলেই শেষ।";
  if (count === books.length) return "পুরো তাকটাই পড়া! এবার একটা ধার দাও, ফেরত না-ও আসতে পারে।";
  if (full("misir")) return "যুক্তি আর রহস্য, দুটোই তোমার।";
  if (full("himu")) return "জোছনা দেখলে তোমারও খালি পায়ে হাঁটতে ইচ্ছে করে, তাই না?";
  if (full("shubhro")) return "চশমার আড়ালের শুভ্রকে তুমি পুরোটাই চেনো।";
  const novels = onShelf(read, "uponnash").read;
  if (novels >= 6 && novels > count - novels) return "হিমু-মিসির আলির বাইরের হুমায়ূনকেও তুমি চেনো।";
  if (count <= 5) return "শুরুটা হয়ে গেছে। পরেরটা বইমেলা থেকেই হোক।";
  if (count <= 15) return "এক বসায় শেষ করা রাতগুলোর কথা তোমার মনে আছে।";
  if (count <= 25) return "লোডশেডিংয়ের রাতে মোমের আলোয় পড়া, তোমারও ছিল।";
  return "আর মাত্র কয়েকটা, তারপর পুরো তাকটাই তোমার।";
}

export const titleOf = (id: BookId) => books.find(book => book.id === id)!.title;

/** "দেবী, হিমু +৩টা" — the books both people read, kept short enough for one line. */
export function commonLine(own: readonly BookId[], friend: readonly BookId[], show = 2) {
  const both = order(own.filter(id => friend.includes(id)));
  const named = both.slice(0, show).map(titleOf).join(", ");
  return { count: both.length, text: both.length > show ? `${named} +${bn(both.length - show)}টা` : named };
}

export type CardContent = {
  name: string;
  count: number;
  total: number;
  tier: string;
  line: string;
  match: string;
  read: ReadonlySet<BookId>;
};

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const read = new Set(own.read.filter(isBookId));
  const name = cleanName(own.name);
  let match = "";
  if (friend) {
    const who = friend.name ? possessive(friend.name) : "বন্ধুর";
    const common = commonLine([...read], friend.read);
    match = common.count ? `${who} সাথে দুজনেরই পড়া ${bn(common.count)}টা` : `${who} সাথে একটাও মেলেনি, বই অদলবদল করো!`;
  }
  return { name, count: read.size, total: books.length, tier: tierFor(read.size), line: readerLine([...read]), match, read };
}

/** Link-preview and card heading: "রাফি · ৩০-এ ১৯টা". */
export const scoreText = (count: number) => `${bn(books.length)}-এ ${bn(count)}টা`;

export function previewTitle({ read, name }: Shared) {
  return `${name || "এক বন্ধু"} হুমায়ূন আহমেদের ${bn(books.length)}টা বইয়ের ${bn(read.length)}টা পড়েছে। তুমি কয়টা?`;
}

export { possessive };
