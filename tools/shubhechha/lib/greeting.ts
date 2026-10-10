export const MAX_NAME_LENGTH = 30;
export const MAX_MESSAGE_LENGTH = 120;
/** A festival stays "current" this many days after its date: people keep sending বিজয়া and ঈদ wishes for days. */
const GRACE_DAYS = 7;
const DAY = 86_400_000;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

type Occasion = {
  id: string;
  /** Short label on the picker button. */
  chip: string;
  /** Small line under the chip label. */
  when: string;
  /** The big words on the card. */
  title: string;
  /** Line under the title, from the year of the coming occurrence. */
  subtitle: (year: number) => string;
  /** "MM-DD" repeats every year; "YYYY-MM-DD" is one moon-dependent date. */
  dates: readonly string[];
  /** Share links store the preset as an index: only append, never reorder or delete. */
  presets: readonly string[];
  /** The human line shown with the result. */
  line: string;
  /** What a real person writes above the card on Facebook. */
  caption: string;
  /** "রাফি তোমাকে ___ পাঠিয়েছে". */
  gift: string;
};

// Order = calendar order from October, so the server render already matches the picker a visitor sees this season.
// shortcut: moving dates (Puja, Eid) are listed to 2028 and are moon-dependent projections; add the next years each autumn.
export const occasions = [
  {
    id: "bijoya", chip: "শুভ বিজয়া", when: "দুর্গাপূজা", title: "শুভ বিজয়া",
    subtitle: () => "শারদীয় দুর্গোৎসব",
    dates: ["2026-10-21", "2027-10-10", "2028-09-28"],
    presets: [
      "শুভ বিজয়ার প্রীতি, শুভেচ্ছা আর ভালোবাসা রইল।",
      "বড়দের প্রণাম, ছোটদের ভালোবাসা। শুভ বিজয়া!",
      "ঢাকের বোল থামলেও মিষ্টিমুখ আর কোলাকুলি চলুক। শুভ বিজয়া!",
      "আসছে বছর আবার হবে। ততদিন সবাই ভালো থাকুক, সুস্থ থাকুক।",
    ],
    line: "যাঁদের প্রণাম করতে এবার বাড়ি যাওয়া হলো না, কার্ডটা তাঁদের পাঠাও।",
    caption: "সবাইকে শুভ বিজয়ার প্রীতি ও শুভেচ্ছা।",
    gift: "শুভ বিজয়ার শুভেচ্ছা",
  },
  {
    id: "nobanno", chip: "শুভ নবান্ন", when: "১ অগ্রহায়ণ", title: "শুভ নবান্ন",
    subtitle: () => "নতুন ধানের উৎসব · ১ অগ্রহায়ণ",
    dates: ["11-16"],
    presets: [
      "নতুন ধানের ঘ্রাণে ভরে উঠুক সবার ঘর। শুভ নবান্ন!",
      "নতুন চালের পিঠা-পায়েসে মিষ্টি হোক অগ্রহায়ণের দিনগুলো।",
      "মাঠভরা সোনালি ধান আর উঠোনভরা হাসি। নবান্নের শুভেচ্ছা রইল।",
    ],
    line: "নতুন চালের পিঠার দাওয়াতটাও সাথে দিয়ে দিতে পারো।",
    caption: "সবাইকে নবান্নের শুভেচ্ছা।",
    gift: "নবান্নের শুভেচ্ছা",
  },
  {
    id: "bijoy", chip: "বিজয় দিবস", when: "১৬ ডিসেম্বর", title: "মহান বিজয় দিবস",
    subtitle: year => `বিজয়ের ${bn(year - 1971)} বছর · ১৬ ডিসেম্বর`,
    dates: ["12-16"],
    presets: [
      "লাল-সবুজের এই দিনে বিজয় দিবসের শুভেচ্ছা রইল।",
      "লাখো শহিদের ত্যাগে পাওয়া এই বিজয়। গভীর শ্রদ্ধায় তাঁদের স্মরণ করি।",
      "দেশটা ভালো থাকুক, ভালো থাকুক দেশের মানুষ। বিজয় দিবসের শুভেচ্ছা।",
      "ষোলোই ডিসেম্বরের সকালটা কাটুক গর্বে আর ভালোবাসায়।",
    ],
    line: "যাঁর মুখে প্রথম একাত্তরের গল্প শুনেছিলে, কার্ডটা আজ তাঁকেই পাঠাও।",
    caption: "সবাইকে মহান বিজয় দিবসের শুভেচ্ছা।",
    gift: "বিজয় দিবসের শুভেচ্ছা",
  },
  {
    // A day of mourning: nothing here may say "শুভ".
    id: "ekushe", chip: "অমর একুশে", when: "২১ ফেব্রুয়ারি", title: "অমর একুশে",
    subtitle: year => `২১ ফেব্রুয়ারি · ভাষা আন্দোলনের ${bn(year - 1952)} বছর`,
    dates: ["02-21"],
    presets: [
      "মায়ের ভাষায় কথা বলতে পারি তাঁদেরই জন্য। ভাষাশহিদদের প্রতি গভীর শ্রদ্ধা।",
      "বাংলায় হাসি, বাংলায় কাঁদি, বাংলাতেই স্বপ্ন দেখি। একুশের শহিদদের স্মরণ করি।",
      "প্রতিটা বাংলা অক্ষরে লেখা আছে তাঁদের নাম। অমর একুশের শ্রদ্ধাঞ্জলি।",
      "যাঁদের ত্যাগে এই বর্ণমালা আমাদের, তাঁদের কোনোদিন ভুলব না।",
    ],
    line: "যিনি তোমাকে প্রথম অ-আ লিখতে শিখিয়েছিলেন, এটা তাঁর জন্যও।",
    caption: "ভাষাশহিদদের প্রতি গভীর শ্রদ্ধা। অমর একুশে।",
    gift: "একুশের একটা কার্ড",
  },
  {
    id: "eid", chip: "ঈদ মোবারক", when: "চাঁদ দেখে", title: "ঈদ মোবারক",
    subtitle: () => "",
    dates: ["2027-03-10", "2027-05-17", "2028-02-27", "2028-05-05"],
    presets: [
      "ঈদ মোবারক! ঈদের খুশি ছড়িয়ে পড়ুক সবার ঘরে।",
      "পরিবারের সবাইকে নিয়ে ঈদের দিনটা ভালো কাটুক। ঈদ মোবারক।",
      "সেমাইয়ের মিষ্টি ঘ্রাণ আর সবার হাসিমুখে ভরে উঠুক ঈদের সকাল।",
      "দূরে থাকলেও ঈদের দিনে মনটা পড়ে থাকে সবার কাছে। ঈদ মোবারক।",
    ],
    line: "সালামির আবদারের আগে একটা শুভেচ্ছা পাঠিয়ে রাখো।",
    caption: "সবাইকে ঈদ মোবারক।",
    gift: "ঈদের শুভেচ্ছা",
  },
  {
    id: "noboborsho", chip: "শুভ নববর্ষ", when: "পহেলা বৈশাখ", title: "শুভ নববর্ষ",
    // 14 April starts Bangla year (Gregorian − 593).
    subtitle: year => `পহেলা বৈশাখ ${bn(year - 593)}`,
    dates: ["04-14"],
    presets: [
      "শুভ নববর্ষ! নতুন বছর ভরে উঠুক সুখে, শান্তিতে আর আনন্দে।",
      "পুরোনো বছরের ক্লান্তি মুছে যাক, নতুন বছর আসুক নতুন আশা নিয়ে।",
      "হালখাতার মিষ্টির মতো মিষ্টি হোক সারাটা বছর। শুভ নববর্ষ।",
      "বৈশাখের প্রথম সকাল কাটুক লাল-সাদায়, মেলার ভিড়ে আর প্রিয় মানুষদের সাথে।",
    ],
    line: "নতুন বছরের প্রথম শুভেচ্ছাটা যাক সবচেয়ে প্রিয় মানুষটার কাছে।",
    caption: "সবাইকে শুভ নববর্ষ!",
    gift: "নববর্ষের শুভেচ্ছা",
  },
] as const satisfies readonly Occasion[];

export type OccasionId = (typeof occasions)[number]["id"];
/** The card state a link carries. text === null means "use the preset". The photo never goes in here. */
export type Wish = { occasion: OccasionId; preset: number; text: string | null; name: string };
export type Card = { occasion: OccasionId; year: number; title: string; subtitle: string; message: string; name: string };

export const occasionById = (id: OccasionId) => occasions.find(occasion => occasion.id === id)!;

function clean(text: string, max: number) {
  // Control and bidi-override characters could scramble the card; ZWJ/ZWNJ stay because Bangla shaping needs them.
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}
export const cleanName = (name: string) => clean(name, MAX_NAME_LENGTH);
export const cleanMessage = (text: string) => clean(text, MAX_MESSAGE_LENGTH);

export function messageOf(wish: Wish) {
  return wish.text === null ? occasionById(wish.occasion).presets[wish.preset] ?? "" : cleanMessage(wish.text);
}

/** The coming (or just-passed, within the grace days) date of an occasion, or null when the date table has run out. */
export function nextDate(occasion: (typeof occasions)[number], today: Date): Date | null {
  const year = today.getFullYear();
  const from = new Date(year, today.getMonth(), today.getDate()).getTime() - GRACE_DAYS * DAY;
  const dates = occasion.dates.flatMap(spec => {
    const [a, b, c] = spec.split("-").map(Number);
    return c === undefined ? [-1, 0, 1].map(add => new Date(year + add, a - 1, b)) : [new Date(a, b - 1, c)];
  });
  return dates.filter(date => date.getTime() >= from).sort((x, y) => x.getTime() - y.getTime())[0] ?? null;
}

/** Occasions in calendar order from today; the first is the default card. */
export function byNearest(today: Date) {
  const when = (occasion: (typeof occasions)[number]) => nextDate(occasion, today)?.getTime() ?? Infinity;
  return [...occasions].sort((x, y) => when(x) - when(y));
}

export function createCard(wish: Wish, today: Date): Card {
  const occasion = occasionById(wish.occasion);
  const year = (nextDate(occasion, today) ?? today).getFullYear();
  return { occasion: occasion.id, year, title: occasion.title, subtitle: occasion.subtitle(year), message: messageOf(wish), name: cleanName(wish.name) };
}

export function shareHash(wish: Wish) {
  const params = new URLSearchParams({ o: wish.occasion });
  if (wish.text === null) params.set("p", String(wish.preset));
  else params.set("t", cleanMessage(wish.text));
  const name = cleanName(wish.name);
  if (name) params.set("n", name);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Wish | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const occasion = occasions.find(item => item.id === params.get("o"));
  if (!occasion) return null;
  const preset = Number(params.get("p"));
  const text = params.get("t");
  return {
    occasion: occasion.id,
    preset: Number.isInteger(preset) && preset >= 0 && preset < occasion.presets.length ? preset : 0,
    text: text === null ? null : cleanMessage(text),
    name: cleanName(params.get("n") ?? ""),
  };
}

/** "রাফি তোমাকে শুভ বিজয়ার শুভেচ্ছা পাঠিয়েছে" for link previews. */
export function previewTitle(wish: Wish) {
  const { gift } = occasionById(wish.occasion);
  const name = cleanName(wish.name);
  return name ? `${name} তোমাকে ${gift} পাঠিয়েছে` : `তোমার জন্য ${gift} এসেছে`;
}
