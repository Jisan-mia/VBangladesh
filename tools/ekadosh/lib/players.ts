export type Line = "gk" | "df" | "mf" | "fw";
/** When they were at their best: "60" = ১৯৫০-৬০, "80" = ৭০-৮০, "00" = ৯০-২০০০, "20" = ২০১০-এর পর. */
export type Era = "60" | "80" | "00" | "20";

export type Player = {
  /** Fixed link and tally id: once links are public, never rename or delete one. */
  id: string;
  /** Full name, spelled the way Prothom Alo's sports pages spell it. */
  name: string;
  /** What goes on the board: the name people actually say. */
  short: string;
  line: Line;
  /** A second line their Wikipedia infobox also lists (e.g. Beckenbauer: sweeper and defensive midfielder). */
  alt?: Line;
  nation: string;
  era: Era;
};

/*
 * Names only: no photos, likenesses, crests, kits, club or sponsor logos.
 *
 * Positions: the "Position(s)" line of each player's English Wikipedia infobox (checked Oct 2026),
 *   https://en.wikipedia.org/wiki/<Player_name>, folded into four lines: winger → fw, sweeper/full-back → df,
 *   attacking/defensive midfielder → mf. `alt` only where the infobox names a position on a second line.
 *   Cross-checked with France Football's Ballon d'Or Dream Team (2020): https://en.wikipedia.org/wiki/Ballon_d%27Or_Dream_Team
 *
 * Bangla spellings follow Prothom Alo (BBC Bangla where it agrees):
 *   ইয়াশিন, ব্যাঙ্কস, জফ, বুফন, ক্যাসিয়াস, নয়্যার, ক্লোসা, গারিঞ্চা, জিদান, রোনালদো নাজারিও:
 *     https://www.prothomalo.com/sports/football/বিশ্বকাপের-সেরা-গোলরক্ষকেরা
 *   মেসি, পেলে, ডিয়েগো ম্যারাডোনা, ক্রিস্টিয়ানো রোনালদো, ইয়োহান ক্রুইফ, ফ্রাঞ্জ বেকেনবাওয়ার, রোনালদিনিও:
 *     https://www.prothomalo.com/sports/football/6wup4h83e6
 *   জিনেদিন জিদান, ইউসেবিও, মিশেল প্লাতিনি, পাওলো মালদিনি, ফাবিও কানাভারো:
 *     https://www.prothomalo.com/sports/football/পেলে-না-ম্যারাডোনা-মেসি-না-রোনালদো—সর্বকালের-সেরা
 *   রোনালদিনিও: https://www.prothomalo.com/sports/football/8fre3ya7x0
 *   এমিলিয়ানো মার্তিনেজ: https://www.prothomalo.com/sports/football/8sqd5vd8h6
 *   আনহেল দি মারিয়া: https://www.prothomalo.com/sports/football/wuh8wa1x72
 *   গার্ড মুলার: https://www.prothomalo.com/sports/football/অভিষেকেই-অপ্রতিরোধ্য-বেকেনবাওয়ার-মুলারের-জার্মানি
 *   রামোস: https://www.prothomalo.com/sports/cyzlgmgh8b · অঁরি: https://www.prothomalo.com/sports/football/9h3njc42br
 *   ফেরেঙ্ক পুসকাস, ববি মুর, কাফু, রবার্তো কার্লোস, জিকো, আলফ্রেদো দি স্তেফানো: https://bangla.thedailystar.net/node/93412
 *   Not yet matched to a saved article (Prothom Alo's usual pronunciation-led spelling, worth a second look):
 *   বারেসি, পাসারেলা, ম্যাথাউস, জানেত্তি, জাভি, ইনিয়েস্তা, পিরলো, মদরিচ, রিকেলমে, মাচেরানো, বাতিস্তুতা, কেম্পেস,
 *   রোমারিও, বাজ্জো, ফন বাস্তেন, ফন ডাইক, এমবাপ্পে, সালাহ, আলিসন, বেকহাম.
 *
 * The Bangladesh cricket XI is left out on purpose (fan factions); a women's pack waits until its Bangla spellings can be checked as well.
 */
export const players: readonly Player[] = [
  // গোলকিপার
  { id: "yashin", name: "লেভ ইয়াশিন", short: "ইয়াশিন", line: "gk", nation: "সোভিয়েত ইউনিয়ন", era: "60" },
  { id: "banks", name: "গর্ডন ব্যাঙ্কস", short: "ব্যাঙ্কস", line: "gk", nation: "ইংল্যান্ড", era: "60" },
  { id: "zoff", name: "দিনো জফ", short: "জফ", line: "gk", nation: "ইতালি", era: "80" },
  { id: "buffon", name: "জিয়ানলুইজি বুফন", short: "বুফন", line: "gk", nation: "ইতালি", era: "00" },
  { id: "casillas", name: "ইকার ক্যাসিয়াস", short: "ক্যাসিয়াস", line: "gk", nation: "স্পেন", era: "20" },
  { id: "neuer", name: "ম্যানুয়েল নয়্যার", short: "নয়্যার", line: "gk", nation: "জার্মানি", era: "20" },
  { id: "alisson", name: "আলিসন বেকার", short: "আলিসন", line: "gk", nation: "ব্রাজিল", era: "20" },
  { id: "emartinez", name: "এমিলিয়ানো মার্তিনেজ", short: "মার্তিনেজ", line: "gk", nation: "আর্জেন্টিনা", era: "20" },
  // ডিফেন্ডার
  { id: "beckenbauer", name: "ফ্রাঞ্জ বেকেনবাওয়ার", short: "বেকেনবাওয়ার", line: "df", alt: "mf", nation: "পশ্চিম জার্মানি", era: "80" },
  { id: "maldini", name: "পাওলো মালদিনি", short: "মালদিনি", line: "df", nation: "ইতালি", era: "00" },
  { id: "baresi", name: "ফ্রাঙ্কো বারেসি", short: "বারেসি", line: "df", nation: "ইতালি", era: "00" },
  { id: "cafu", name: "কাফু", short: "কাফু", line: "df", nation: "ব্রাজিল", era: "00" },
  { id: "rcarlos", name: "রবার্তো কার্লোস", short: "রবার্তো কার্লোস", line: "df", nation: "ব্রাজিল", era: "00" },
  { id: "calberto", name: "কার্লোস আলবার্তো", short: "কার্লোস আলবার্তো", line: "df", nation: "ব্রাজিল", era: "80" },
  { id: "moore", name: "ববি মুর", short: "ববি মুর", line: "df", nation: "ইংল্যান্ড", era: "60" },
  { id: "cannavaro", name: "ফাবিও কানাভারো", short: "কানাভারো", line: "df", nation: "ইতালি", era: "00" },
  { id: "ramos", name: "সের্হিও রামোস", short: "রামোস", line: "df", nation: "স্পেন", era: "20" },
  { id: "vandijk", name: "ভার্জিল ফন ডাইক", short: "ফন ডাইক", line: "df", nation: "নেদারল্যান্ডস", era: "20" },
  { id: "passarella", name: "দানিয়েল পাসারেলা", short: "পাসারেলা", line: "df", nation: "আর্জেন্টিনা", era: "80" },
  { id: "zanetti", name: "হাভিয়ের জানেত্তি", short: "জানেত্তি", line: "df", alt: "mf", nation: "আর্জেন্টিনা", era: "00" },
  // মিডফিল্ডার
  { id: "zidane", name: "জিনেদিন জিদান", short: "জিদান", line: "mf", nation: "ফ্রান্স", era: "00" },
  { id: "xavi", name: "জাভি হার্নান্দেজ", short: "জাভি", line: "mf", nation: "স্পেন", era: "20" },
  { id: "iniesta", name: "আন্দ্রেস ইনিয়েস্তা", short: "ইনিয়েস্তা", line: "mf", nation: "স্পেন", era: "20" },
  { id: "pirlo", name: "আন্দ্রেয়া পিরলো", short: "পিরলো", line: "mf", nation: "ইতালি", era: "00" },
  { id: "matthaus", name: "লোথার ম্যাথাউস", short: "ম্যাথাউস", line: "mf", alt: "df", nation: "জার্মানি", era: "80" },
  { id: "charlton", name: "ববি চার্লটন", short: "ববি চার্লটন", line: "mf", alt: "fw", nation: "ইংল্যান্ড", era: "60" },
  { id: "zico", name: "জিকো", short: "জিকো", line: "mf", nation: "ব্রাজিল", era: "80" },
  { id: "socrates", name: "সক্রেটিস", short: "সক্রেটিস", line: "mf", nation: "ব্রাজিল", era: "80" },
  { id: "platini", name: "মিশেল প্লাতিনি", short: "প্লাতিনি", line: "mf", nation: "ফ্রান্স", era: "80" },
  { id: "maradona", name: "ডিয়েগো ম্যারাডোনা", short: "ম্যারাডোনা", line: "mf", alt: "fw", nation: "আর্জেন্টিনা", era: "80" },
  { id: "ronaldinho", name: "রোনালদিনিও", short: "রোনালদিনিও", line: "mf", alt: "fw", nation: "ব্রাজিল", era: "00" },
  { id: "kaka", name: "কাকা", short: "কাকা", line: "mf", nation: "ব্রাজিল", era: "00" },
  { id: "riquelme", name: "হুয়ান রোমান রিকেলমে", short: "রিকেলমে", line: "mf", nation: "আর্জেন্টিনা", era: "00" },
  { id: "beckham", name: "ডেভিড বেকহাম", short: "বেকহাম", line: "mf", nation: "ইংল্যান্ড", era: "00" },
  { id: "modric", name: "লুকা মদরিচ", short: "মদরিচ", line: "mf", nation: "ক্রোয়েশিয়া", era: "20" },
  { id: "mascherano", name: "হাভিয়ের মাচেরানো", short: "মাচেরানো", line: "mf", alt: "df", nation: "আর্জেন্টিনা", era: "20" },
  // ফরোয়ার্ড
  { id: "pele", name: "পেলে", short: "পেলে", line: "fw", nation: "ব্রাজিল", era: "60" },
  { id: "garrincha", name: "গারিঞ্চা", short: "গারিঞ্চা", line: "fw", nation: "ব্রাজিল", era: "60" },
  { id: "puskas", name: "ফেরেঙ্ক পুসকাস", short: "পুসকাস", line: "fw", nation: "হাঙ্গেরি", era: "60" },
  { id: "distefano", name: "আলফ্রেদো দি স্তেফানো", short: "দি স্তেফানো", line: "fw", nation: "আর্জেন্টিনা ও স্পেন", era: "60" },
  { id: "eusebio", name: "ইউসেবিও", short: "ইউসেবিও", line: "fw", nation: "পর্তুগাল", era: "60" },
  { id: "cruyff", name: "ইয়োহান ক্রুইফ", short: "ক্রুইফ", line: "fw", alt: "mf", nation: "নেদারল্যান্ডস", era: "80" },
  { id: "gmuller", name: "গার্ড মুলার", short: "গার্ড মুলার", line: "fw", nation: "পশ্চিম জার্মানি", era: "80" },
  { id: "kempes", name: "মারিও কেম্পেস", short: "কেম্পেস", line: "fw", nation: "আর্জেন্টিনা", era: "80" },
  { id: "vanbasten", name: "মার্কো ফন বাস্তেন", short: "ফন বাস্তেন", line: "fw", nation: "নেদারল্যান্ডস", era: "80" },
  { id: "romario", name: "রোমারিও", short: "রোমারিও", line: "fw", nation: "ব্রাজিল", era: "00" },
  { id: "r9", name: "রোনালদো নাজারিও", short: "রোনালদো নাজারিও", line: "fw", nation: "ব্রাজিল", era: "00" },
  { id: "rivaldo", name: "রিভালদো", short: "রিভালদো", line: "fw", alt: "mf", nation: "ব্রাজিল", era: "00" },
  { id: "batistuta", name: "গাব্রিয়েল বাতিস্তুতা", short: "বাতিস্তুতা", line: "fw", nation: "আর্জেন্টিনা", era: "00" },
  { id: "baggio", name: "রবার্তো বাজ্জো", short: "বাজ্জো", line: "fw", alt: "mf", nation: "ইতালি", era: "00" },
  { id: "henry", name: "থিয়েরি অঁরি", short: "অঁরি", line: "fw", nation: "ফ্রান্স", era: "00" },
  { id: "klose", name: "মিরোস্লাভ ক্লোসা", short: "ক্লোসা", line: "fw", nation: "জার্মানি", era: "00" },
  { id: "messi", name: "লিওনেল মেসি", short: "মেসি", line: "fw", nation: "আর্জেন্টিনা", era: "20" },
  { id: "cristiano", name: "ক্রিস্টিয়ানো রোনালদো", short: "রোনালদো", line: "fw", nation: "পর্তুগাল", era: "20" },
  { id: "neymar", name: "নেইমার", short: "নেইমার", line: "fw", nation: "ব্রাজিল", era: "20" },
  { id: "dimaria", name: "আনহেল দি মারিয়া", short: "দি মারিয়া", line: "fw", alt: "mf", nation: "আর্জেন্টিনা", era: "20" },
  { id: "salah", name: "মোহাম্মদ সালাহ", short: "সালাহ", line: "fw", nation: "মিসর", era: "20" },
  { id: "mbappe", name: "কিলিয়ান এমবাপ্পে", short: "এমবাপ্পে", line: "fw", nation: "ফ্রান্স", era: "20" },
];
