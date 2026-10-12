import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;
export const PER_SET = 10;

/** "everyday" = the pitha on a winter street corner; "festive" = made for guests, fairs or one region. Drives the human line. */
export type Kind = "everyday" | "festive";
export type PithaId =
  | "bhapa" | "chitoi" | "patishapta" | "dudh-chitoi" | "nakshi" | "puli" | "teler" | "chhita" | "chunga" | "jhinuk"
  | "malpoa" | "lobongo" | "golap" | "mera" | "bibikhana" | "pata" | "dim-chitoi" | "dudh-puli" | "mug-pakon" | "kholajali";
export type Question = {
  id: PithaId;
  name: string;
  kind: Kind;
  /** Shown before the answer: a fair nudge, never the name itself. */
  clue: string;
  options: readonly [string, string, string];
  answer: 0 | 1 | 2;
  /** Shown after the answer. */
  about: string;
  /** Regional or other names, accepted as the same pitha ("অন্য নামে: …"). */
  alt?: string;
  source: string;
};

// Sources (checked Oct 2026). Names and regional names vary; we use the most common Bangladeshi name and list the others.
// Banglapedia "পিঠা": https://bn.banglapedia.org/index.php/পিঠা · https://en.banglapedia.org/index.php/Pitha
// Banglapedia "Nakshi Pitha": https://en.banglapedia.org/index.php/Nakshi_Pitha
// Prothom Alo, "হিম শীতে গরম পিঠার খোঁজে" (Sylhet: "তেলের পিঠা বা সন্দেশ"; ডিম/দুধ চিতই; মুগ পাকন): https://www.prothomalo.com/bangladesh/dff9eu22x2
// Prothom Alo recipe page (সিলেটের ম্যারা, ফরিদপুরের দুধ-চিতই, নরসিংদীর নকশি, ময়মনসিংহের মসলা পিঠা, নোয়াখালীর পানতোয়া): https://www.prothomalo.com/lifestyle/recipe/গরম-গরম-পিঠা
// Samakal, Sylhet's হান্দেশ = তেলের পিঠা: https://samakal.com/bangladesh/article/140775604/হান্দেশ-ও-নুনগড়ার-স্বাদে-ঈদ-আনন্দ
// TBS, "Delish winter pithas from around the country" (Bikrampur bibikhana, Noakhali mug pakon, Sylhet mera, Chattogram chitka): https://www.tbsnews.net/node/552978
// Financial Express, chhita pitha / chhit ruti with duck: https://thefinancialexpress.com.bd/others/chhita-pitha-from-rural-households-to-restaurants-in-dhaka-1669544881
// bdnews24, গোলাপ আর ঝিনুক পিঠা: https://bangla.bdnews24.com/lifestyle/dj8xir49cp
// The Daily Star, dudh puli: https://www.thedailystar.net/lifestyle/deshi-mix/winter-pitha-176893
// Wikipedia: https://bn.wikipedia.org/wiki/ভাপা_পিঠা · https://bn.wikipedia.org/wiki/চিতই_পিঠা · https://bn.wikipedia.org/wiki/চুঙ্গা_পিঠা · https://bn.wikipedia.org/wiki/পিঠা · https://en.wikipedia.org/wiki/Kholajali_Pitha
// Nabanna is 1 Agrahayan, 16 November in Bangladesh's revised calendar (a solar date, not lunar): https://bangla.bdnews24.com/campus/fdbe7b2775a9
// Share links store answers by position: once links are public, never edit, reorder or swap a set's questions or options. Add new sets instead.
export const sets = [
  {
    id: "w1", label: "শীতের ভোর",
    questions: [
      { id: "bhapa", name: "ভাপা পিঠা", kind: "everyday", clue: "ধোঁয়া ওঠা হাঁড়ির মুখ থেকে সোজা হাতে।", options: ["চিতই পিঠা", "ভাপা পিঠা", "পাকন পিঠা"], answer: 1, about: "চালের গুঁড়ার মাঝে খেজুর গুড় আর নারকেল, ফুটো করা হাঁড়ির মুখে কাপড়ে বসিয়ে ভাপে সেদ্ধ। শীতের ভোরে মোড়ের দোকানের প্রথম পিঠা।", alt: "ধুপি পিঠা, ধুকি পিঠা", source: "https://bn.wikipedia.org/wiki/ভাপা_পিঠা" },
      { id: "chitoi", name: "চিতই পিঠা", kind: "everyday", clue: "মাটির খোলায় ঢেকে সেঁকা, পাশে তিন রকম ভর্তা।", options: ["পাটিসাপটা", "খোলাজালি", "চিতই পিঠা"], answer: 2, about: "শুধু চালের গুঁড়া, পানি আর লবণ। ওপরটা ঝাঁঝরি, তলাটা মসৃণ। শুঁটকি, সরিষা, ধনেপাতার ভর্তা দিয়ে খাও, নয়তো গুড় বা হাঁসের মাংস দিয়ে।", alt: "চিতুই পিঠা, চিতল পিঠা, সরা পিঠা", source: "https://bn.wikipedia.org/wiki/চিতই_পিঠা" },
      { id: "patishapta", name: "পাটিসাপটা", kind: "everyday", clue: "পাতলা রুটি, ভেতরে মিষ্টি পুর, গোল করে মোড়ানো।", options: ["পাটিসাপটা", "লবঙ্গ লতিকা", "পুলি পিঠা"], answer: 0, about: "পাতলা গোলা তাওয়ায় ছড়িয়ে, ভেতরে ক্ষীর বা গুড়-নারকেলের পুর দিয়ে পাটির মতো মুড়ে নেওয়া। ঘ্রাণটা আসে খেজুর গুড় থেকে।", source: "https://www.prothomalo.com/bangladesh/dff9eu22x2" },
      { id: "dudh-chitoi", name: "দুধ চিতই", kind: "everyday", clue: "রাতভর ডুবে থাকে খেজুর গুড়ের দুধে।", options: ["দুধ পুলি", "দুধ চিতই", "মালপোয়া"], answer: 1, about: "চিতই পিঠা দুধ আর খেজুর গুড়ের রসে এক রাত ভিজিয়ে রাখা। সকালে নরম তুলতুলে, ওপরে নারকেল কোরা।", source: "https://www.prothomalo.com/lifestyle/recipe/গরম-গরম-পিঠা" },
      { id: "nakshi", name: "নকশি পিঠা", kind: "festive", clue: "খেজুরের কাঁটায় আঁকা ফুল-লতা, তারপর ভেজে রসে।", options: ["ঝিনুক পিঠা", "মুগ পাকন", "নকশি পিঠা"], answer: 2, about: "আতপ চালের রুটিতে খেজুর কাঁটা বা সুঁই দিয়ে পদ্ম, লতা, পাতার নকশা, তারপর ভেজে রসে ডোবানো। ময়মনসিংহের মেয়েদের নকশার নামডাক আছে।", alt: "ফুল পিঠা", source: "https://en.banglapedia.org/index.php/Nakshi_Pitha" },
      { id: "puli", name: "পুলি পিঠা", kind: "everyday", clue: "আধখানা চাঁদের মতো, কিনারায় আঙুলে কাটা ঢেউ।", options: ["পুলি পিঠা", "গোলাপ পিঠা", "চুঙ্গা পিঠা"], answer: 0, about: "ভেতরে গুড়-নারকেলের পুর, কিনারা মুড়ে আধখানা চাঁদ। কেউ ভাপে সেদ্ধ করে, কেউ তেলে ভাজে, কেউ দুধে জ্বাল দিয়ে বানায় দুধ পুলি।", alt: "নারকেল পুলি, ভাজা পুলি", source: "https://www.prothomalo.com/bangladesh/dff9eu22x2" },
      { id: "teler", name: "তেলের পিঠা", kind: "everyday", clue: "গুড় মেশানো গোলা, ডুবো তেলে ফুলে ওঠে।", options: ["মালপোয়া", "চুঙ্গা পিঠা", "তেলের পিঠা"], answer: 2, about: "চালের গুঁড়ায় খেজুর বা আখের গুড় গুলে ডুবো তেলে ভাজা, ফুলে ওঠা বাদামি পিঠা। সিলেটে একে বলে সন্দেশ, মুখের ভাষায় হান্দেশ।", alt: "তেল পিঠা, পোয়া পিঠা; সিলেটে সন্দেশ বা হান্দেশ", source: "https://samakal.com/bangladesh/article/140775604/হান্দেশ-ও-নুনগড়ার-স্বাদে-ঈদ-আনন্দ" },
      { id: "chhita", name: "ছিটা পিঠা", kind: "everyday", clue: "আঙুলে গোলা ছিটিয়ে জালের মতো, সাথে হাঁসের ঝোল।", options: ["চিতই পিঠা", "ছিটা পিঠা", "খোলাজালি"], answer: 1, about: "পাতলা গোলা আঙুলে তাওয়ায় ছিটিয়ে বানানো জালির মতো রুটি, চার ভাঁজ করে হাঁস বা গরুর মাংসের ঝোলের সাথে।", alt: "ছিটা রুটি, ছিট রুটি; চট্টগ্রামে চিটকা পিঠা", source: "https://thefinancialexpress.com.bd/others/chhita-pitha-from-rural-households-to-restaurants-in-dhaka-1669544881" },
      { id: "chunga", name: "চুঙ্গা পিঠা", kind: "festive", clue: "বাঁশের চোঙায় বিন্নি চাল, খড়ের আগুনে পোড়ানো।", options: ["চুঙ্গা পিঠা", "পাতা পিঠা", "ম্যারা পিঠা"], answer: 0, about: "সিলেট-মৌলভীবাজারের ঢলু বাঁশের চোঙায় বিন্নি চাল ভরে খড়ের আগুনে পোড়ানো। বাঁশ চিরলে মোমবাতির মতো বেরিয়ে আসে।", alt: "চুঙ্গাপুড়া পিঠা", source: "https://bn.wikipedia.org/wiki/চুঙ্গা_পিঠা" },
      { id: "jhinuk", name: "ঝিনুক পিঠা", kind: "festive", clue: "চিরুনি চেপে ঢেউ তোলা, ভেজে রসে ডোবানো।", options: ["মুগ পাকন", "ঝিনুক পিঠা", "লবঙ্গ লতিকা"], answer: 1, about: "মুগ ডাল আর চালের গুঁড়ার লেচি দুটো চিরুনিতে চেপে ঝিনুকের খোলের মতো দাগ, তারপর ভেজে চিনির রসে।", source: "https://bangla.bdnews24.com/lifestyle/dj8xir49cp" },
    ],
  },
  {
    id: "w2", label: "নবান্নের মেলা",
    questions: [
      { id: "malpoa", name: "মালপোয়া", kind: "everyday", clue: "গোল করে ভাজা, কিনারা মচমচে, গা ভেজা রসে।", options: ["মালপোয়া", "তেলের পিঠা", "বিবিখানা"], answer: 0, about: "ময়দার গোলা তেলে বা ঘিয়ে গোল করে ভেজে চিনির রসে ডোবানো। কিনারা লালচে মচমচে, মাঝখান নরম।", source: "https://bn.wikipedia.org/wiki/পিঠা" },
      { id: "lobongo", name: "লবঙ্গ লতিকা", kind: "festive", clue: "চার ভাঁজের খাম, মাঝখানে একটা মসলা গাঁথা।", options: ["পাটিসাপটা", "লবঙ্গ লতিকা", "পুলি পিঠা"], answer: 1, about: "ময়দার খামিরে মিষ্টি পুর, চারদিক ভাঁজ করে মাঝখানে একটা লবঙ্গ গেঁথে আটকানো। ভেজে রসে ডোবানো।", source: "https://bn.wikipedia.org/wiki/পিঠা" },
      { id: "golap", name: "গোলাপ পিঠা", kind: "festive", clue: "লেচি গড়ে ফুলের পাপড়ি, ভেজে রসে।", options: ["ঝিনুক পিঠা", "নকশি পিঠা", "গোলাপ পিঠা"], answer: 2, about: "মুগ ডাল আর চালের গুঁড়ার লেচি গোলাপ ফুলের মতো পাপড়ি করে গড়া, তারপর ভেজে চিনির রসে জ্বাল।", source: "https://bangla.bdnews24.com/lifestyle/dj8xir49cp" },
      { id: "mera", name: "ম্যারা পিঠা", kind: "festive", clue: "হাতে গড়া সাদা পিঠা, ভাপে সেদ্ধ, ভেতরে পুর নেই।", options: ["ম্যারা পিঠা", "ভাপা পিঠা", "দুধ পুলি"], answer: 0, about: "ভাজা চালের গুঁড়া গরম পানিতে মেখে হাতে গড়ে ভাপে সেদ্ধ। সিলেট আর আশপাশের জেলায় মাংস বা তরকারির সাথে খায়।", alt: "মেরা পিঠা", source: "https://www.tbsnews.net/node/552978" },
      { id: "bibikhana", name: "বিবিখানা", kind: "festive", clue: "ডিম, দুধ, নারকেল, নলেন গুড়; দেখতে প্রায় কেক।", options: ["মালপোয়া", "বিবিখানা", "পাতা পিঠা"], answer: 1, about: "চালের গুঁড়া টেলে ডিম, দুধ, নারকেল, নলেন গুড় আর ঘি মিশিয়ে সেঁকা। বিক্রমপুরের নাম করা পিঠা।", alt: "বিবিখানা পিঠা", source: "https://www.tbsnews.net/node/552978" },
      { id: "pata", name: "পাতা পিঠা", kind: "festive", clue: "গাছের পাতায় মুড়ে রান্না, খুললে পাতার ঘ্রাণ।", options: ["চুঙ্গা পিঠা", "ভাপা পিঠা", "পাতা পিঠা"], answer: 2, about: "চালের গুঁড়ার পিঠা গাছের পাতায় মুড়ে রান্না করা হয়, তাই নাম পাতা পিঠা। কলাপাতা বা হলুদপাতা, এলাকা বুঝে।", source: "https://en.banglapedia.org/index.php/Pitha" },
      { id: "dim-chitoi", name: "ডিম চিতই", kind: "everyday", clue: "চিতইয়ের খোলাতেই বানানো, তবে ওপরটা হলুদ।", options: ["ডিম চিতই", "দুধ চিতই", "খোলাজালি"], answer: 0, about: "চিতইয়ের মতোই মাটির খোলায় ঢেকে বানানো, শুধু গোলার ওপর একটা ডিম ভেঙে দেওয়া। মোড়ের চিতইয়ের দোকানে প্রায়ই পাবে।", source: "https://www.prothomalo.com/bangladesh/dff9eu22x2" },
      { id: "dudh-puli", name: "দুধ পুলি", kind: "everyday", clue: "ছোট ছোট আধখানা চাঁদ ভাসছে এলাচ দেওয়া দুধে।", options: ["দুধ চিতই", "ম্যারা পিঠা", "দুধ পুলি"], answer: 2, about: "চালের গুঁড়ার ছোট পুলিতে নারকেলের পুর, তারপর এলাচ-দারুচিনি দেওয়া দুধে জ্বাল।", alt: "দুধপুলি", source: "https://www.thedailystar.net/lifestyle/deshi-mix/winter-pitha-176893" },
      { id: "mug-pakon", name: "মুগ পাকন", kind: "festive", clue: "ফুলের মতো কিনারা, ভেজে রসে। অনেকে নকশির সাথে গুলিয়ে ফেলে।", options: ["নকশি পিঠা", "মুগ পাকন", "গোলাপ পিঠা"], answer: 1, about: "ভাজা মুগ ডাল সেদ্ধ করে ময়দা, ডিম, ঘিয়ে মেখে নকশা করে গড়া, ভেজে এলাচ-দারুচিনির রসে। নকশি পিঠায় কিন্তু মুগ ডাল থাকে না।", alt: "পাকন পিঠা, পাকান", source: "https://www.tbsnews.net/node/552978" },
      { id: "kholajali", name: "খোলাজালি", kind: "festive", clue: "মাটির খোলায় পাতলা, গায়ে অসংখ্য ছোট ফুটো।", options: ["চিতই পিঠা", "খোলাজালি", "ছিটা পিঠা"], answer: 1, about: "নোয়াখালীর পিঠা। চিতইয়ের চেয়ে পাতলা, মাটির খোলায় বানানো, গায়ে অসংখ্য ছোট ফুটো, দেখতে জালের মতো।", alt: "খোলাজা পিঠা, খোলা পিঠা", source: "https://en.wikipedia.org/wiki/Kholajali_Pitha" },
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; questions: readonly Question[] }>;

/** Ten more names for the static "৩০টা পিঠার নাম" list (no drawing, no quiz). Sources as above. */
export const moreNames: ReadonlyArray<{ name: string; note: string }> = [
  { name: "হাঁড়ি পিঠা", note: "বড়সড় পিঠা, আকারের জন্যই নাম (বাংলাপিডিয়া)।" },
  { name: "খেজুর পিঠা", note: "খেজুরের মতো ছোট আকারের পিঠা (বাংলাপিডিয়া)।" },
  { name: "জামাই ভুলানো পিঠা", note: "নতুন জামাইয়ের জন্য রঙিন নকশার পিঠা, আরেক নাম বিবিয়ানা (বাংলাপিডিয়া)।" },
  { name: "রস চিতই", note: "খেজুরের রসে রাতভর ভেজানো চিতই।" },
  { name: "মসলা পিঠা", note: "ময়মনসিংহের ঝাল পিঠা, ভুনা মাংস বা কলিজার সাথে।" },
  { name: "পানতোয়া (ডিম পিঠা)", note: "নোয়াখালীর পিঠা: ভাজা ডিম ঝাল গোলায় ডুবিয়ে ভাজা।" },
  { name: "সবজি পুলি", note: "মিষ্টির বদলে সবজির পুর দেওয়া পুলি।" },
  { name: "মাংস পাটিসাপটা", note: "ঝাল মাংসের পুরে পাটিসাপটা (বাংলাপিডিয়া)।" },
  { name: "গোকুল পিঠা", note: "ময়দার মিষ্টি পিঠা, দেশজুড়ে চেনা।" },
  { name: "তিলের পিঠা", note: "তিল আর গুড়ের শীতের পিঠা।" },
];

export type SetId = (typeof sets)[number]["id"];
export type Answer = 0 | 1 | 2;
export type Shared = { set: SetId; answers: Answer[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const isSetId = (id: string): id is SetId => sets.some(item => item.id === id);
export const setById = (id: SetId) => sets.find(item => item.id === id)!;
export const questionsOf = (id: SetId): readonly Question[] => setById(id).questions;
export const allPithas: readonly Question[] = sets.flatMap((item): readonly Question[] => item.questions);

/** Anonymous tally ids: "seen:<set>" counts finished sets, each pitha id counts a right answer. */
export const tallyIds = sets.flatMap(item => [`seen:${item.id}`, ...item.questions.map(question => question.id)]);

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Which answers were right, recomputed from the questions; a passed score is never trusted. */
export function marks(set: SetId, answers: readonly Answer[]) {
  return questionsOf(set).map((question, index) => answers[index] === undefined ? null : answers[index] === question.answer);
}

export const scoreOf = (set: SetId, answers: readonly Answer[]) => marks(set, answers).filter(Boolean).length;

export function rank(score: number) {
  if (score >= 8) return "পিঠার ওস্তাদ";
  if (score >= 5) return "পিঠার সমঝদার";
  if (score >= 3) return "পিঠার ভক্ত";
  return "পিঠার নতুন ভক্ত";
}

export function humanLine(set: SetId, answers: readonly Answer[]) {
  const right = marks(set, answers);
  const score = right.filter(Boolean).length;
  const all = (kind: Kind) => questionsOf(set).every((question, index) => question.kind !== kind || right[index]);
  if (score === PER_SET) return "১০-এ ১০! নানি-দাদির সব পিঠাই চেনো।";
  if (score <= 3) return "এবার শীতে মোড়ের পিঠার দোকানে দাঁড়াও, চেখে চেখেই চিনে যাবে।";
  if (all("everyday")) return "রোজের পিঠা চেনো, উৎসবেরটা এবার শিখে নাও।";
  if (all("festive")) return "উৎসবের পিঠা চেনো, মোড়েরগুলোয় ভুল। কাল ভোরে মোড়ের দোকানে যাও।";
  return "চুলার পাশে আরেকটু বসো, বাকিগুলোও চিনে যাবে।";
}

export function shareHash({ set, answers, name }: Shared) {
  const params = new URLSearchParams({ set, a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Only a finished set (10 digits 0–2) from the fixed list counts as a shared result. */
export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const set = params.get("set") ?? "";
  const code = params.get("a") ?? "";
  if (!isSetId(set) || !/^[0-2]{10}$/.test(code)) return null;
  return { set, answers: [...code].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

export function caption(shared: Shared, friend?: Shared | null) {
  const score = scoreOf(shared.set, shared.answers);
  const vs = friend && friend.set === shared.set ? ` ${friend.name ? possessive(friend.name) : "বন্ধুর"} ${bn(scoreOf(friend.set, friend.answers))}।` : "";
  return `শীতের ১০টা পিঠার ছবি দেখে আমি চিনেছি ${bn(score)}টা, ${rank(score)}!${vs} তুমি কয়টা চিনবে?`;
}

export { possessive };
