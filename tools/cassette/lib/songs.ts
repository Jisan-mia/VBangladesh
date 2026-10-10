export type Song = {
  title: string;
  /** The band or singer; for folk, Tagore and Nazrul songs (role "kotha-sur") the songwriter. */
  by: string;
  kind: "band" | "lok" | "kobi" | "chobi";
  /** First release: "old" up to 1989, then by decade, "new" from 2010; "chirokal" for folk, Tagore and Nazrul. */
  era: "chirokal" | "old" | "90" | "00" | "new";
  role?: "kotha-sur";
  /** An extra verified credit, e.g. the band behind a singer or the songwriter of a film song. */
  also?: string;
};

const SOULS = "সোল্‌স";
const LRB = "এলআরবি";
const LALON = "লালন", HASON = "হাছন রাজা", KARIM = "শাহ আবদুল করিম", TAGORE = "রবীন্দ্রনাথ ঠাকুর", NAZRUL = "কাজী নজরুল ইসলাম";

/*
 * Titles and credits only: no lyrics, audio, album art, logos or photos.
 * Every title + credit below was checked (Oct 2026) on a page that names the song with that artist; spelling follows that page.
 * Titles shared with tools/char-priyo keep its spelling. Links store a song's position: once public, only append; never reorder or delete.
 *
 * Bands
 *   আজম খান: https://bn.wikipedia.org/wiki/আজম_খান · https://bn.wikipedia.org/wiki/বাংলা_ব্যান্ড_সঙ্গীত
 *   সোল্‌স: https://bn.wikipedia.org/wiki/তপন_চৌধুরী_(গায়ক) · https://bn.wikipedia.org/wiki/সোলস · https://bangla.thedailystar.net/entertainment/music/news-729791
 *   চাইম: https://bn.wikipedia.org/wiki/চাইম_(ব্যান্ড) · https://bangla.thedailystar.net/entertainment/music/news-568476
 *   ফিডব্যাক (মেলা, 1990): https://www.prothomalo.com/entertainment/song/kxbdg26sp3 · https://bn.wikipedia.org/wiki/ফিডব্যাক_(ব্যান্ড)
 *   ডিফারেন্ট টাচ: https://bn.wikipedia.org/wiki/ডিফারেন্ট_টাচ · https://prothomalo.com/entertainment/song/zt0dkkww9d
 *   অবসকিউর: https://bangla.thedailystar.net/node/199153 · https://en.wikipedia.org/wiki/Obscure_(band)
 *   রেনেসাঁ: https://bangla.thedailystar.net/entertainment/music/news-710026 · https://bangla.bdnews24.com/glitz/ebaaafd256f9
 *   মাইলস (প্রতিশ্রুতি 1991, প্রত্যাশা 1993, প্রত্যয় 1996): https://bn.wikipedia.org/wiki/মাইলস
 *   আইয়ুব বাচ্চু / এলআরবি (এল আর বি ১ 1992, সুখ 1993, solo কষ্ট 1995, ফেরারী মন live 1996): https://bn.wikipedia.org/wiki/আইয়ুব_বাচ্চু · https://bn.wikipedia.org/wiki/এলআরবি · https://bangla.thedailystar.net/entertainment/music/news-383061
 *   ওয়ারফেজ: https://bn.wikipedia.org/wiki/ওয়ারফেজ · https://en.wikipedia.org/wiki/Warfaze
 *   জেমস: https://bn.wikipedia.org/wiki/জেমস-এর_গাওয়া_গানের_তালিকা
 *   আর্ক: https://bangla.bdnews24.com/glitz/a9e4e26ac8e3
 *   দলছুট (হৃদয়পুর, 2000): https://bangla.thedailystar.net/entertainment/music/news-730346
 *   অর্থহীন: https://en.wikipedia.org/wiki/Aurthohin · https://www.prothomalo.com/entertainment/song/bhvk1h3i9p
 *   আর্টসেল: https://bn.wikipedia.org/wiki/আর্টসেল · ব্ল্যাক: https://www.prothomalo.com/entertainment/song/yvz3w8yfnx
 *   শিরোনামহীন: https://bn.wikipedia.org/wiki/শিরোনামহীন · নেমেসিস: https://bn.wikipedia.org/wiki/নেমেসিস_(বাংলাদেশী_ব্যান্ড)
 *   চিরকুট: https://bn.wikipedia.org/wiki/আয়নাবাজি · https://www.prothomalo.com/entertainment/song/y2ai3b2bkp · https://bn.wikipedia.org/wiki/ডুব_(চলচ্চিত্র)
 * Folk and baul (কথা-সুর = the songwriter; a plain name = the singer)
 *   https://bn.wikipedia.org/wiki/লালন · https://bn.wikipedia.org/wiki/হাছন_রাজা · https://bn.wikipedia.org/wiki/শাহ_আবদুল_করিম
 *   https://bn.wikipedia.org/wiki/রাধারমণ_দত্ত · https://bn.wikipedia.org/wiki/আব্বাসউদ্দীন_আহমদ · https://bn.wikipedia.org/wiki/আব্দুল_আলীম
 *   https://bn.wikipedia.org/wiki/বারী_সিদ্দিকী · https://en.wikipedia.org/wiki/Srabon_Megher_Din · https://www.prothomalo.com/onnoalo/treatise/ym1v6uh9kl
 *   https://bn.wikipedia.org/wiki/শাহ_আলম_সরকার (মমতাজ) · https://bn.wikipedia.org/wiki/কাঙ্গালিনী_সুফিয়া · https://bn.wikipedia.org/wiki/কুদ্দুস_বয়াতী
 * Tagore and Nazrul: https://bn.wikisource.org/wiki/গীতবিতান · https://bn.wikipedia.org/wiki/রবীন্দ্রসংগীত · https://bn.wikipedia.org/wiki/নজরুলগীতি
 * Film and modern
 *   https://bn.wikipedia.org/wiki/ময়নামতি_(বাংলা_চলচ্চিত্র) · https://bangla.thedailystar.net/entertainment/tv-movies/news-715711 (বশির আহমেদ)
 *   https://bn.wikipedia.org/wiki/তুমি_কি_দেখেছ_কভু_জীবনের_পরাজয় · https://bn.wikipedia.org/wiki/ওরে_নীল_দরিয়া_আমায়_দে_রে_দে_ছাড়িয়া · https://bn.wikipedia.org/wiki/সালাম_সালাম_হাজার_সালাম
 *   https://www.prothomalo.com/entertainment/song/34dse11t5q (ফেরদৌসী রহমান) · https://bn.wikipedia.org/wiki/সাবিনা_ইয়াসমিন · https://bn.wikipedia.org/wiki/সব_ক’টা_জানালা_খুলে_দাও_না
 *   https://bn.wikipedia.org/wiki/সেই_রেললাইনের_ধারে_মেঠোপথটার_পারে_দাঁড়িয়ে · https://bn.wikipedia.org/wiki/শাহনাজ_রহমতুল্লাহ · https://bn.wikipedia.org/wiki/মাহমুদুন্নবী
 *   https://bn.wikipedia.org/wiki/বন্ধু_তিন_দিন_তোর_বাড়ি_গেলাম_দেখা_পাইলাম_না · https://bn.wikipedia.org/wiki/শ্রেষ্ঠ_নারী_কণ্ঠশিল্পী_বিভাগে_জাতীয়_চলচ্চিত্র_পুরস্কার_(বাংলাদেশ)
 *   https://bangla.thedailystar.net/entertainment/news-592291 (রুনা লায়লা) · https://bn.wikipedia.org/wiki/আছেন_আমার_মোক্তার · https://bn.wikipedia.org/wiki/সূর্যোদয়ে_তুমি_সূর্যাস্তেও_তুমি
 *   https://bn.wikipedia.org/wiki/এন্ড্রু_কিশোর · https://bn.wikipedia.org/wiki/হায়রে_মানুষ_রঙ্গীন_ফানুস · https://bn.wikipedia.org/wiki/ডাক_দিয়াছেন_দয়াল_আমারে
 *   https://bn.wikipedia.org/wiki/সুবীর_নন্দী · https://bn.wikipedia.org/wiki/একটা_ছিল_সোনার_কন্যা · https://bn.wikipedia.org/wiki/মায়ের_একধার_দুধের_দাম
 *   https://bangla.thedailystar.net/entertainment/music/news-671056 (খুরশিদ আলম) · https://bn.wikipedia.org/wiki/আনন্দ_অশ্রু (কনকচাঁপা) · https://bn.wikipedia.org/wiki/খালিদ_হাসান_মিলু
 *   https://bn.wikipedia.org/wiki/আসিফ_আকবর · https://bn.wikipedia.org/wiki/মনির_খান · https://www.prothomalo.com/entertainment/song/yvz3w8yfnx (তাহসান)
 *   https://bn.wikipedia.org/wiki/অর্ণব · https://bn.wikipedia.org/wiki/হাবিব_ওয়াহিদ · https://bn.wikipedia.org/wiki/হৃদয়ের_কথা · https://bn.wikipedia.org/wiki/মিনার_রহমান
 *   https://bn.wikipedia.org/wiki/হাওয়া_(চলচ্চিত্র) (sung by এরফান মৃধা শিবলু; words and tune হাশিম মাহমুদ)
 *   https://bn.wikipedia.org/wiki/কোক_স্টুডিও_বাংলা_(মৌসুম_১) · https://bn.wikipedia.org/wiki/কোক_স্টুডিও_বাংলা_(মৌসুম_২) · https://bn.wikipedia.org/wiki/তুফান_(২০২৪-এর_চলচ্চিত্র)
 */
export const songs: readonly Song[] = [
  // bands, oldest first
  { title: "রেল লাইনের ঐ বস্তিতে", by: "আজম খান", kind: "band", era: "old" },
  { title: "ওরে সালেকা ওরে মালেকা", by: "আজম খান", kind: "band", era: "old" },
  { title: "আলাল ও দুলাল", by: "আজম খান", kind: "band", era: "old" },
  { title: "মন শুধু মন ছুঁয়েছে", by: SOULS, kind: "band", era: "old" },
  { title: "কলেজের করিডোরে", by: SOULS, kind: "band", era: "old" },
  { title: "ফরেস্ট হিলের এক দুপুরে", by: SOULS, kind: "band", era: "old" },
  { title: "নাতি খাতি বেলা গেল", by: "চাইম", kind: "band", era: "old" },
  { title: "স্টেশন রোড", by: "জেমস", kind: "band", era: "old" },
  { title: "হৃদয় কাদামাটির কোনো মূর্তি নয়", by: "রেনেসাঁ", kind: "band", era: "old" },
  { title: "ভালো লাগে জোছনা রাতে", by: "রেনেসাঁ", kind: "band", era: "old" },
  { title: "মাঝ রাতে চাঁদ যদি আলো না বিলায়", by: "অবসকিউর", kind: "band", era: "old" },
  { title: "মেলায় যাই রে", by: "ফিডব্যাক", kind: "band", era: "90" },
  { title: "শ্রাবণের মেঘগুলো জড়ো হলো আকাশে", by: "ডিফারেন্ট টাচ", kind: "band", era: "90" },
  { title: "চাঁদ তারা", by: "মাইলস", kind: "band", era: "90" },
  { title: "প্রথম প্রেমের মতো", by: "মাইলস", kind: "band", era: "90" },
  { title: "ফিরিয়ে দাও", by: "মাইলস", kind: "band", era: "90" },
  { title: "জ্বালা জ্বালা", by: "মাইলস", kind: "band", era: "90" },
  { title: "ফেরারি মন", by: "আইয়ুব বাচ্চু", also: LRB, kind: "band", era: "90" },
  { title: "চলো বদলে যাই", by: "আইয়ুব বাচ্চু", also: LRB, kind: "band", era: "90" },
  { title: "কষ্ট কাকে বলে", by: "আইয়ুব বাচ্চু", kind: "band", era: "90" },
  { title: "এখন অনেক রাত", by: "আইয়ুব বাচ্চু", also: LRB, kind: "band", era: "90" },
  { title: "বসে আছি", by: "ওয়ারফেজ", kind: "band", era: "90" },
  { title: "একটি ছেলে", by: "ওয়ারফেজ", kind: "band", era: "90" },
  { title: "অবাক ভালোবাসা", by: "ওয়ারফেজ", kind: "band", era: "90" },
  { title: "জননী", by: "ওয়ারফেজ", kind: "band", era: "90" },
  { title: "আজ যে শিশু", by: "রেনেসাঁ", kind: "band", era: "90" },
  { title: "জেল থেকে বলছি", by: "জেমস", kind: "band", era: "90" },
  { title: "তারায় তারায়", by: "জেমস", kind: "band", era: "90" },
  { title: "লেইস ফিতা লেইস", by: "জেমস", kind: "band", era: "90" },
  { title: "সুইটি", by: "আর্ক", kind: "band", era: "90" },
  { title: "তোমাকেই বলে দেবো", by: "দলছুট", kind: "band", era: "00" },
  { title: "অদ্ভুত সেই ছেলেটি", by: "অর্থহীন", kind: "band", era: "00" },
  { title: "চাইতে পারো", by: "অর্থহীন", kind: "band", era: "00" },
  { title: "পথ চলা", by: "আর্টসেল", kind: "band", era: "00" },
  { title: "ধূসর সময়", by: "আর্টসেল", kind: "band", era: "00" },
  { title: "এখনো", by: "ব্ল্যাক", kind: "band", era: "00" },
  { title: "হাসিমুখ", by: "শিরোনামহীন", kind: "band", era: "00" },
  { title: "পাখি", by: "শিরোনামহীন", kind: "band", era: "00" },
  { title: "বন্ধ জানালা", by: "শিরোনামহীন", kind: "band", era: "00" },
  { title: "কবে", by: "নেমেসিস", kind: "band", era: "new" },
  { title: "দুনিয়া", by: "চিরকুট", kind: "band", era: "new" },
  { title: "আহারে জীবন", by: "চিরকুট", kind: "band", era: "new" },
  // folk and baul
  { title: "খাঁচার ভিতর অচিন পাখি", by: LALON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "আমি অপার হয়ে বসে আছি", by: LALON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "সব লোকে কয় লালন কি জাত সংসারে", by: LALON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "বাড়ির কাছে আরশিনগর", by: LALON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "মিলন হবে কত দিনে", by: LALON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "লোকে বলে, বলেরে", by: HASON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "মাটির পিঞ্জিরার মাঝে বন্দী হইয়ারে", by: HASON, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "আগে কি সুন্দর দিন কাটাইতাম", by: KARIM, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "বন্দে মায়া লাগাইছে, পিরিতি শিখাইছে", by: KARIM, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "গাড়ি চলে না", by: KARIM, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "বসন্ত বাতাসে সইগো", by: KARIM, role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "ভ্রমর কইয়ো গিয়া", by: "রাধারমণ দত্ত", role: "kotha-sur", kind: "lok", era: "chirokal" },
  { title: "ওকি গাড়িয়াল ভাই", by: "আব্বাসউদ্দীন আহমদ", kind: "lok", era: "chirokal" },
  { title: "ফান্দে পড়িয়া বগা কান্দে", by: "আব্বাসউদ্দীন আহমদ", kind: "lok", era: "chirokal" },
  { title: "সর্বনাশা পদ্মা নদী", by: "আব্দুল আলীম", kind: "lok", era: "chirokal" },
  { title: "পরের জায়গা পরের জমি", by: "আব্দুল আলীম", kind: "lok", era: "chirokal" },
  { title: "কে যাও ভাটির দেশের নাইয়া", by: "আব্দুল আলীম", kind: "lok", era: "chirokal" },
  { title: "শুয়া চান পাখি", by: "বারী সিদ্দিকী", kind: "lok", era: "chirokal" },
  { title: "আমার গায়ে যত দুঃখ সয়", by: "বারী সিদ্দিকী", kind: "lok", era: "chirokal" },
  { title: "বুকটা ফাইট্টা যায়", by: "মমতাজ", kind: "lok", era: "chirokal" },
  { title: "কোনবা পথে নিতাইগঞ্জে যাই", by: "কাঙ্গালিনী সুফিয়া", kind: "lok", era: "chirokal" },
  { title: "এই দিন, দিন না আরো দিন আছে", by: "কুদ্দুস বয়াতী", kind: "lok", era: "chirokal" },
  // Tagore and Nazrul
  { title: "এসো হে বৈশাখ", by: TAGORE, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "পুরানো সেই দিনের কথা", by: TAGORE, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "আজি ঝরঝর মুখর বাদর-দিনে", by: TAGORE, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "পাগলা হাওয়ার বাদল-দিনে", by: TAGORE, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "আমরা সবাই রাজা", by: TAGORE, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "মেঘের কোলে রোদ হেসেছে", by: TAGORE, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "ও মন রমজানের ঐ রোজার শেষে", by: NAZRUL, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "কারার ওই লৌহকপাট", by: NAZRUL, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "বাগিচায় বুলবুলি তুই", by: NAZRUL, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "শুকনো পাতার নূপুর পায়ে", by: NAZRUL, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  { title: "দূর দ্বীপ-বাসিনী", by: NAZRUL, role: "kotha-sur", kind: "kobi", era: "chirokal" },
  // film and modern, oldest first
  { title: "তুমি কি দেখেছ কভু জীবনের পরাজয়", by: "আব্দুল জব্বার", kind: "chobi", era: "old" },
  { title: "অনেক সাধের ময়না আমার", by: "বশির আহমেদ", kind: "chobi", era: "old" },
  { title: "যার ছায়া পড়েছে মনেরও আয়নাতে", by: "ফেরদৌসী রহমান", kind: "chobi", era: "old" },
  { title: "সালাম সালাম হাজার সালাম", by: "আব্দুল জব্বার", kind: "chobi", era: "old" },
  { title: "শুধু গান গেয়ে পরিচয়", by: "সাবিনা ইয়াসমিন", kind: "chobi", era: "old" },
  { title: "একবার যেতে দে না আমার ছোট্ট সোনার গাঁয়", by: "শাহনাজ রহমতুল্লাহ", kind: "chobi", era: "old" },
  { title: "আমি সাত সাগর পাড়ি দিয়ে", by: "মাহমুদুন্নবী", kind: "chobi", era: "old" },
  { title: "চঞ্চলা হাওয়ারে", by: "রুনা লায়লা", kind: "chobi", era: "old" },
  { title: "যখন থামবে কোলাহল", by: "রুনা লায়লা", kind: "chobi", era: "old" },
  { title: "বন্ধু তিন দিন তোর বাড়ি গেলাম দেখা পাইলাম না", by: "রুনা লায়লা", kind: "chobi", era: "old" },
  { title: "মায়ের একধার দুধের দাম", by: "ফকির আলমগীর", kind: "chobi", era: "old" },
  { title: "ওরে নীল দরিয়া", by: "আব্দুল জব্বার", kind: "chobi", era: "old" },
  { title: "আছেন আমার মোক্তার", by: "সৈয়দ আব্দুল হাদী", kind: "chobi", era: "old" },
  { title: "সূর্যোদয়ে তুমি সূর্যাস্তেও তুমি", by: "সৈয়দ আব্দুল হাদী", kind: "chobi", era: "old" },
  { title: "ডাক দিয়াছেন দয়াল আমারে", by: "এন্ড্রু কিশোর", kind: "chobi", era: "old" },
  { title: "চুমকি চলেছে একা পথে", by: "খুরশিদ আলম", kind: "chobi", era: "old" },
  { title: "হায়রে মানুষ রঙিন ফানুস", by: "এন্ড্রু কিশোর", kind: "chobi", era: "old" },
  { title: "সব ক’টা জানালা খুলে দাও না", by: "সাবিনা ইয়াসমিন", kind: "chobi", era: "old" },
  { title: "আমার সারা দেহ খেয়ো গো মাটি", by: "এন্ড্রু কিশোর", kind: "chobi", era: "old" },
  { title: "আমার এ দুটি চোখ পাথর তো নয়", by: "সুবীর নন্দী", kind: "chobi", era: "old" },
  { title: "সেই রেললাইনের ধারে মেঠোপথটার পারে দাঁড়িয়ে", by: "সাবিনা ইয়াসমিন", kind: "chobi", era: "old" },
  { title: "সবাই তো ভালোবাসা চায়", by: "এন্ড্রু কিশোর", kind: "chobi", era: "old" },
  { title: "ভালবাসা ভালবাসা মানে না কোন পরাজয়", by: "খালিদ হাসান মিলু", kind: "chobi", era: "90" },
  { title: "তুমি আমার এমনই একজন", by: "কনকচাঁপা", kind: "chobi", era: "90" },
  { title: "একটা ছিল সোনার কন্যা", by: "সুবীর নন্দী", kind: "chobi", era: "90" },
  { title: "ও প্রিয়া তুমি কোথায়", by: "আসিফ আকবর", kind: "chobi", era: "00" },
  { title: "সে আমার ভালবাসার আয়না", by: "মনির খান", kind: "chobi", era: "00" },
  { title: "ঈর্ষা", by: "তাহসান", kind: "chobi", era: "00" },
  { title: "সে যে বসে আছে", by: "অর্ণব", kind: "chobi", era: "00" },
  { title: "ময়না গো", by: "হাবিব ওয়াহিদ", kind: "chobi", era: "00" },
  { title: "আলো", by: "তাহসান", kind: "chobi", era: "00" },
  { title: "ভালোবাসবো বাসবো রে বন্ধু তোমায় যতনে", by: "হাবিব ওয়াহিদ", kind: "chobi", era: "00" },
  { title: "আহারে", by: "মিনার রহমান", kind: "chobi", era: "new" },
  { title: "সাদা সাদা কালা কালা", by: "এরফান মৃধা শিবলু", also: "কথা-সুর: হাশিম মাহমুদ", kind: "chobi", era: "new" },
  { title: "নাসেক নাসেক", by: "অনিমেষ রায় ও পান্থ কানাই", kind: "chobi", era: "new" },
  { title: "দেওড়া", by: "প্রীতম হাসান, ফজলু মাঝি, ইসলাম উদ্দিন পালাকার ও ঘাসফড়িং কয়্যার", kind: "chobi", era: "new" },
  { title: "লাগে উরা ধুরা", by: "প্রীতম হাসান ও দেবশ্রী অন্তরা", kind: "chobi", era: "new" },
];
