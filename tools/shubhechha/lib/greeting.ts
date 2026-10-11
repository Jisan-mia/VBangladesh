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
  /** Days without a fixed date (জন্মদিন, বিবাহবার্ষিকী) ask who the card is for; the first is the neutral default. */
  recipients?: readonly Recipient[];
};

type Recipient = {
  /** Links store this id: only append, never rename or delete. */
  id: string;
  chip: string;
  /** The line under the title when no name is typed; empty draws the plain divider. */
  to: string;
  /** Same rule as Occasion.presets: append only. */
  presets: readonly string[];
};

// Wishes that fit anyone; no relation, gender or faith assumed. দোয়া is one choice, never the default.
const anyoneBirthday = [
  "শুভ জন্মদিন! নতুন বছরটা ভরে উঠুক হাসি, সুস্থতা আর ভালোবাসায়।",
  "তুমি আছ বলে চারপাশটা একটু বেশি সুন্দর। শুভ জন্মদিন!",
  "আজ কেক কাটো, মোমবাতি নেভাও, আর জেনে রাখো, তুমি অনেকের খুব প্রিয়।",
  "অনেক দোয়া আর শুভকামনা রইল। ভালো থেকো, সুস্থ থেকো সবসময়।",
];
const siblingBirthday = [
  "শুভ জন্মদিন! ঝগড়া যতই করি, তুমি ছাড়া বাসাটা ফাঁকা লাগে।",
  "রিমোট নিয়ে কাড়াকাড়ি থেকে সব গোপন কথা, সবকিছুর সঙ্গী তুমি। শুভ জন্মদিন!",
  "যত বড়ই হই, তুমি সবসময় আমার সবচেয়ে কাছের মানুষ। শুভ জন্মদিন!",
];
const anyoneAnniversary = [
  "শুভ বিবাহবার্ষিকী! তোমাদের দুজনের পথচলা হোক আরও লম্বা, আরও সুন্দর।",
  "একসাথে হাসি, একসাথে খুনসুটি, আবার একসাথে চা। এভাবেই থেকো সারাজীবন।",
  "তোমাদের দেখলে ভালোবাসায় বিশ্বাস ফিরে আসে। শুভ বিবাহবার্ষিকী!",
  "দুজনের জন্য অনেক দোয়া আর শুভকামনা। ভালো থেকো একসাথে।",
];
const elderCoupleAnniversary = [
  "শুভ বিবাহবার্ষিকী! তোমাদের জুটিটা এমনই মিষ্টি থাকুক সারাজীবন।",
  "তোমাদের দুজনের হাসি আর দাওয়াত, দুটোই চলুক বছরের পর বছর।",
  "অনেক ভালোবাসা আর দোয়া রইল দুজনের জন্য। ভালো থেকো একসাথে।",
];

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
  {
    // No date: sorts after every festival, so it is never the default card.
    id: "jonmodin", chip: "শুভ জন্মদিন", when: "প্রিয়জনের দিন", title: "শুভ জন্মদিন",
    subtitle: () => "",
    dates: [],
    presets: anyoneBirthday,
    line: "কেক কাটার আগেই কার্ডটা পৌঁছে যাক।",
    caption: "শুভ জন্মদিন! অনেক ভালোবাসা রইল।",
    gift: "জন্মদিনের শুভেচ্ছা",
    recipients: [
      { id: "priyo", chip: "প্রিয়জন", to: "", presets: anyoneBirthday },
      { id: "ammu", chip: "আম্মু", to: "প্রিয় আম্মু", presets: [
        "তোমার হাসিটা যেন সারাজীবন এমনই থাকে। শুভ জন্মদিন, অনেক ভালোবাসি।",
        "সবার জন্মদিনে পায়েস রাঁধো তুমি, আজ তোমার দিন। অনেক ভালোবাসি, আম্মু।",
        "তোমার দোয়াতেই আমরা ভালো আছি। অনেক বছর সুস্থ থাকো, আম্মু।",
      ] },
      { id: "abbu", chip: "আব্বু", to: "প্রিয় আব্বু", presets: [
        "তুমি আমার প্রথম হিরো, আজও তাই। শুভ জন্মদিন!",
        "সব আবদার হাসিমুখে মেনে নেওয়া মানুষটার আজ জন্মদিন। অনেক ভালোবাসি, আব্বু।",
        "তোমার মতো করে কেউ আগলে রাখে না। অনেক বছর সুস্থ থাকো, আব্বু।",
      ] },
      { id: "bhai", chip: "ভাই", to: "প্রিয় ভাই", presets: siblingBirthday },
      { id: "bon", chip: "বোন", to: "প্রিয় বোন", presets: siblingBirthday },
      { id: "bondhu", chip: "বন্ধু", to: "প্রিয় বন্ধু", presets: [
        "শুভ জন্মদিন, দোস্ত! ট্রিটটা কিন্তু পাওনা রইল।",
        "বয়স বাড়ছে, কিন্তু আড্ডায় তুই চিরকাল সেই আগের মতোই। শুভ জন্মদিন!",
        "এতগুলো বছর পাশে থাকার জন্য ধন্যবাদ। ভালো থাকিস সবসময়।",
      ] },
      { id: "songi", chip: "জীবনসঙ্গী", to: "প্রিয় জীবনসঙ্গী", presets: [
        "শুভ জন্মদিন! সকালের প্রথম চা-টা সারাজীবন তোমার সাথেই খেতে চাই।",
        "তুমি আছ বলেই ঘরটা ঘর লাগে। শুভ জন্মদিন, প্রিয় মানুষ।",
        "আরও অনেক জন্মদিন একসাথে কাটাতে চাই। অনেক ভালোবাসি।",
      ] },
      { id: "sonamoni", chip: "সোনামণি", to: "আমাদের সোনামণি", presets: [
        "হাসতে হাসতে বড় হও, আর সবাইকে এভাবেই হাসাও। শুভ জন্মদিন!",
        "তুমি আসার পর থেকে আমাদের ঘরটা হাসিতে ভরা। শুভ জন্মদিন!",
        "অনেক আদর আর দোয়া রইল। বড় হও, ভালো মানুষ হও।",
      ] },
    ],
  },
  {
    id: "bibahobarshiki", chip: "বিবাহবার্ষিকী", when: "দুজনের দিন", title: "শুভ বিবাহবার্ষিকী",
    subtitle: () => "",
    dates: [],
    presets: anyoneAnniversary,
    line: "দিনটা যে মনে রেখেছ, এটুকুতেই খুশি হবে দুজন।",
    caption: "শুভ বিবাহবার্ষিকী! অনেক ভালোবাসা রইল।",
    gift: "বিবাহবার্ষিকীর শুভেচ্ছা",
    recipients: [
      { id: "priyo", chip: "প্রিয় দুজন", to: "", presets: anyoneAnniversary },
      { id: "ammu-abbu", chip: "আম্মু-আব্বু", to: "প্রিয় আম্মু-আব্বু", presets: [
        "তোমাদের দেখেই শিখেছি ভালোবাসা কাকে বলে। শুভ বিবাহবার্ষিকী!",
        "তোমাদের খুনসুটি আর ভালোবাসা দিয়েই আমাদের ঘরটা গড়া। শুভ বিবাহবার্ষিকী!",
        "এত বছর ধরে একে অপরের হাত ধরে আছ। এভাবেই থেকো, আমাদের মাথার ওপর।",
      ] },
      { id: "songi", chip: "জীবনসঙ্গী", to: "প্রিয় জীবনসঙ্গী", presets: [
        "শুভ বিবাহবার্ষিকী! তোমার সাথে আরও অনেক বছর, অনেক কাপ চা।",
        "সেদিন হাত ধরেছিলাম, আজও ছাড়িনি, ছাড়বও না। শুভ বিবাহবার্ষিকী।",
        "মান-অভিমান সব পেরিয়ে তুমিই আমার সবচেয়ে কাছের মানুষ।",
      ] },
      { id: "bhaiya-bhabi", chip: "ভাইয়া-ভাবি", to: "প্রিয় ভাইয়া-ভাবি", presets: elderCoupleAnniversary },
      { id: "apu-dulabhai", chip: "আপু-দুলাভাই", to: "প্রিয় আপু-দুলাভাই", presets: elderCoupleAnniversary },
    ],
  },
] as const satisfies readonly Occasion[];

export type OccasionId = (typeof occasions)[number]["id"];
/**
 * The card state a link carries. text === null means "use the preset". The photo never goes in here.
 * `to`/`toName` exist only on occasions with recipients, so a pre-change festival link parses to exactly the same object.
 */
export type Wish = { occasion: OccasionId; preset: number; text: string | null; name: string; to?: string; toName?: string };
export type Card = { occasion: OccasionId; year: number; title: string; subtitle: string; message: string; name: string };

export const occasionById = (id: OccasionId) => occasions.find(occasion => occasion.id === id)!;
export const recipientsOf = (id: OccasionId): readonly Recipient[] => (occasionById(id) as Occasion).recipients ?? [];
/** The chosen recipient, the default one for an unknown id, or undefined for festivals. */
export function recipientOf(wish: Pick<Wish, "occasion" | "to">) {
  const list = recipientsOf(wish.occasion);
  return list.find(recipient => recipient.id === wish.to) ?? list[0];
}
export const presetsOf = (wish: Pick<Wish, "occasion" | "to">) => recipientOf(wish)?.presets ?? occasionById(wish.occasion).presets;

function clean(text: string, max: number) {
  // Control and bidi-override characters could scramble the card; ZWJ/ZWNJ stay because Bangla shaping needs them.
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}
export const cleanName = (name: string) => clean(name, MAX_NAME_LENGTH);
export const cleanMessage = (text: string) => clean(text, MAX_MESSAGE_LENGTH);

export function messageOf(wish: Wish) {
  return wish.text === null ? presetsOf(wish)[wish.preset] ?? "" : cleanMessage(wish.text);
}

/** "প্রিয় নাদিয়া" when a name is typed, else the recipient's own line ("প্রিয় আম্মু"), else "" (festivals and the neutral default). */
export function toLine(wish: Wish) {
  const recipient = recipientOf(wish);
  if (!recipient) return "";
  const name = cleanName(wish.toName ?? "");
  return name ? `প্রিয় ${name}` : recipient.to;
}

/** What a real person writes above the card: "শুভ জন্মদিন, প্রিয় আম্মু! অনেক ভালোবাসা রইল।" */
export function captionOf(wish: Wish) {
  const occasion = occasionById(wish.occasion);
  const to = toLine(wish);
  return to ? `${occasion.title}, ${to}! অনেক ভালোবাসা রইল।` : occasion.caption;
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
  const subtitle = recipientOf(wish) ? toLine(wish) : occasion.subtitle(year);
  return { occasion: occasion.id, year, title: occasion.title, subtitle, message: messageOf(wish), name: cleanName(wish.name) };
}

export function shareHash(wish: Wish) {
  const params = new URLSearchParams({ o: wish.occasion });
  if (wish.text === null) params.set("p", String(wish.preset));
  else params.set("t", cleanMessage(wish.text));
  const name = cleanName(wish.name);
  if (name) params.set("n", name);
  const recipient = recipientOf(wish);
  if (recipient) {
    params.set("r", recipient.id);
    const toName = cleanName(wish.toName ?? "");
    if (toName) params.set("rn", toName);
  }
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Wish | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const occasion = occasions.find(item => item.id === params.get("o"));
  if (!occasion) return null;
  const recipient = recipientOf({ occasion: occasion.id, to: params.get("r") ?? undefined });
  const presets = recipient?.presets ?? occasion.presets;
  const preset = Number(params.get("p"));
  const text = params.get("t");
  return {
    occasion: occasion.id,
    preset: Number.isInteger(preset) && preset >= 0 && preset < presets.length ? preset : 0,
    text: text === null ? null : cleanMessage(text),
    name: cleanName(params.get("n") ?? ""),
    ...(recipient ? { to: recipient.id, toName: cleanName(params.get("rn") ?? "") } : {}),
  };
}

/** "রাফি তোমাকে শুভ বিজয়ার শুভেচ্ছা পাঠিয়েছে" for link previews. */
export function previewTitle(wish: Wish) {
  const { gift } = occasionById(wish.occasion);
  const name = cleanName(wish.name);
  const toName = recipientOf(wish) ? cleanName(wish.toName ?? "") : "";
  return (toName ? `${toName}, ` : "") + (name ? `${name} তোমাকে ${gift} পাঠিয়েছে` : `তোমার জন্য ${gift} এসেছে`);
}

// ---- প্রোফাইল ফ্রেম: a square photo frame for days people change their profile picture ----

// Order is the built-in picker order; `frameOrder` sorts by the coming date. Links store the id: append only.
export const frames = [
  {
    id: "bijoy", chip: "বিজয় দিবস", when: "১৬ ডিসেম্বর",
    /** Ribbon text; links store the index, so append only. */
    ribbons: ["মহান বিজয় দিবস", "লাল-সবুজ আমার গর্ব", "ভালোবাসি বাংলাদেশ"],
    line: "১৬ ডিসেম্বর সকালে প্রোফাইলটাও থাকুক লাল-সবুজে।",
    gift: "বিজয় দিবসের প্রোফাইল ফ্রেম",
  },
  {
    // A day of mourning: nothing here may say "শুভ".
    id: "ekushe", chip: "অমর একুশে", when: "২১ ফেব্রুয়ারি",
    ribbons: ["অমর একুশে", "ভাষাশহিদদের স্মরণ করি", "বাংলা আমার অহংকার"],
    line: "প্রভাতফেরির দিনে প্রোফাইলেও থাকুক শ্রদ্ধা।",
    gift: "একুশের প্রোফাইল ফ্রেম",
  },
  {
    // Generic red-green and a plain ball: no team crest, logo or sponsor.
    id: "khela", chip: "খেলার দিন", when: "ক্রিকেট-ফুটবল",
    ribbons: ["জিতবে বাংলাদেশ", "সাবাশ বাংলাদেশ", "খেলবে টাইগার, জিতবে বাংলাদেশ"],
    line: "খেলার আগের রাতেই প্রোফাইল ছবিটা বদলে ফেলো।",
    gift: "খেলার দিনের প্রোফাইল ফ্রেম",
  },
] as const;

export type FrameId = (typeof frames)[number]["id"];
/** What a frame link carries: never the photo. */
export type FramePick = { frame: FrameId; ribbon: number };
export type FrameCard = { frame: FrameId; ribbon: string; sub: string };

export const frameById = (id: FrameId) => frames.find(frame => frame.id === id)!;
const occasionOfFrame = (id: FrameId) => occasions.find(occasion => occasion.id === id);

/** Dated frames by their coming day; খেলার দিন has no date and stays last. */
export function frameOrder(today: Date) {
  const when = (frame: (typeof frames)[number]) => { const occasion = occasionOfFrame(frame.id); return (occasion && nextDate(occasion, today)?.getTime()) || Infinity; };
  return [...frames].sort((x, y) => when(x) - when(y));
}

/** The small line under the ribbon reuses the card subtitle, so the year count ("বিজয়ের ৫৫ বছর") has one source. */
export function createFrame(pick: FramePick, today: Date): FrameCard {
  const frame = frameById(pick.frame);
  const occasion = occasionOfFrame(frame.id);
  const sub = occasion ? occasion.subtitle((nextDate(occasion, today) ?? today).getFullYear()) : "";
  return { frame: frame.id, ribbon: frame.ribbons[pick.ribbon] ?? frame.ribbons[0], sub };
}

export const frameHash = (pick: FramePick) => "#" + new URLSearchParams({ fr: pick.frame, l: String(pick.ribbon) }).toString();

export function parseFrameHash(hash: string): FramePick | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const frame = frames.find(item => item.id === params.get("fr"));
  if (!frame) return null;
  const ribbon = Number(params.get("l"));
  return { frame: frame.id, ribbon: Number.isInteger(ribbon) && ribbon >= 0 && ribbon < frame.ribbons.length ? ribbon : 0 };
}

export const frameCaption = (pick: FramePick) => `প্রোফাইল ছবি বদলালাম। ${frameById(pick.frame).ribbons[pick.ribbon] ?? ""}। তুমিও বানাতে পারো:`;
export const framePreviewTitle = (pick: FramePick) => `${frameById(pick.frame).gift}: নিজের ছবি বসিয়ে নাও`;
