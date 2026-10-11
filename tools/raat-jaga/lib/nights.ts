import { possessive } from "../../../shared/bangla";

/*
 * Twenty World Cup nights that Bangladesh stayed up for, 1990–2026.
 *
 * The rule (shown on the page): a match counts as a night only if it kicked off between 11pm and 5am Bangladesh time.
 * Kickoffs are the scheduled local times from each match's football box on English Wikipedia, which cites FIFA's
 * match report; checked Oct 2026. Bangladesh time is UTC+6. Its only daylight saving (UTC+7) ran 19 Jun–31 Dec 2009,
 * when no World Cup was played: https://en.wikipedia.org/wiki/Bangladesh_Standard_Time
 *
 * Why some famous nights are missing: the 2022 final kicked off 18:00 in Qatar = 9pm in Bangladesh, and every 2002
 * match (Korea/Japan, UTC+9) kicked off between 14:30 and 20:30 local = 11:30am–5:30pm in Bangladesh.
 *   https://en.wikipedia.org/wiki/2002_FIFA_World_Cup_knockout_stage (and its Group A–H pages)
 *   https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final
 *
 * Sources, one per night, in order:
 *   1990 final        https://en.wikipedia.org/wiki/1990_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/76/3462/27
 *   1994 NED–BRA      https://en.wikipedia.org/wiki/1994_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/84/796/3098 (14:30 CDT, also https://rsssf.org/wk94/quart.html)
 *   1994 final        https://en.wikipedia.org/wiki/1994_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/84/3459/3104
 *   1998 ARG–ENG      https://en.wikipedia.org/wiki/1998_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/1013/1024/8779
 *   1998 final        https://en.wikipedia.org/wiki/1998_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/1013/1027/8788
 *   2006 ARG–MEX      https://en.wikipedia.org/wiki/2006_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/9741/10162/97410050
 *   2006 final        https://en.wikipedia.org/wiki/2006_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/9741/10166/97410064
 *   2010 final        https://en.wikipedia.org/wiki/2010_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/249715/249721/300061509
 *   2014 BRA–GER      https://en.wikipedia.org/wiki/Brazil_v_Germany_(2014_FIFA_World_Cup) · https://www.fifa.com/en/match-centre/match/17/251164/255955/300186474
 *   2014 NED–ARG      https://en.wikipedia.org/wiki/2014_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/251164/255955/300186490
 *   2014 final        https://en.wikipedia.org/wiki/2014_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/251164/255959/300186501
 *   2018 POR–ESP      https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_Group_B · https://www.fifa.com/en/match-centre/match/17/254645/275073/300331524
 *   2018 NGA–ARG      https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_Group_D · https://www.fifa.com/en/match-centre/match/17/254645/275073/300331519
 *   2018 BRA–BEL      https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/254645/275095/300331538
 *   2022 BRA–SRB      https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_Group_G · https://www.fifa.com/en/match-centre/match/17/255711/285063/400235484
 *   2022 BRA–KOR      https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/255711/285073/400128133
 *   2022 NED–ARG      https://en.wikipedia.org/wiki/Battle_of_Lusail · https://www.fifa.com/en/match-centre/match/17/255711/285074/400128139
 *   2022 FRA–MAR      https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/255711/285075/400128142
 *   2026 BRA–NOR      https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage · https://www.fifa.com/en/match-centre/match/17/285023/289288/400021532
 *                     (4pm ET per https://www.fox.com/soccer/fifa-world-cup/round-of-16-match-91-jul-5-2026 ; result https://www.skysports.com/football/brazil-vs-norway/report/549856)
 *   2026 final        https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final · https://www.fifa.com/en/match-centre/match/17/285023/289292/400021543
 *                     (result https://abcnews4.com/news/nation-world/spain-wins-the-world-cup-by-beating-argentina-1-0-on-ferran-torres-goal-in-extra-time)
 *
 * Spellings of team names follow Prothom Alo's sports pages.
 */

export const teams = {
  ARG: "আর্জেন্টিনা", BRA: "ব্রাজিল", FRG: "পশ্চিম জার্মানি", GER: "জার্মানি", ITA: "ইতালি", NED: "নেদারল্যান্ডস",
  ENG: "ইংল্যান্ড", FRA: "ফ্রান্স", MEX: "মেক্সিকো", ESP: "স্পেন", POR: "পর্তুগাল", NGA: "নাইজেরিয়া",
  BEL: "বেলজিয়াম", SRB: "সার্বিয়া", KOR: "দক্ষিণ কোরিয়া", MAR: "মরক্কো", NOR: "নরওয়ে",
} as const;
type Team = keyof typeof teams;

export const hosts: Record<number, string> = {
  1990: "ইতালি", 1994: "যুক্তরাষ্ট্র", 1998: "ফ্রান্স", 2006: "জার্মানি", 2010: "দক্ষিণ আফ্রিকা",
  2014: "ব্রাজিল", 2018: "রাশিয়া", 2022: "কাতার", 2026: "যুক্তরাষ্ট্র, কানাডা, মেক্সিকো",
};

type Night = {
  id: string;
  /** Scheduled kickoff in the venue's local time, with its UTC offset, exactly as the match report gives it. */
  kickoff: string;
  stage: "ফাইনাল" | "সেমিফাইনাল" | "কোয়ার্টার ফাইনাল" | "শেষ ষোলো" | "গ্রুপ পর্ব";
  home: Team;
  away: Team;
  score: readonly [number, number];
  /** Shootout score, home first. */
  pens?: readonly [number, number];
  aet?: true;
  /** Where on the window's sky this night's star sits (0–1); kept off the grille bars at x = .2/.5/.8 and y ≈ .56. */
  star: readonly [number, number];
};

// Share links store picks as bit positions: once links are public, only append new nights; never reorder or delete.
export const nights = [
  { id: "1990-final", kickoff: "1990-07-08T20:00+02:00", stage: "ফাইনাল", home: "FRG", away: "ARG", score: [1, 0], star: [0.4, 0.08] },
  { id: "1994-qf-ned-bra", kickoff: "1994-07-09T14:30-05:00", stage: "কোয়ার্টার ফাইনাল", home: "NED", away: "BRA", score: [2, 3], star: [0.62, 0.1] },
  { id: "1994-final", kickoff: "1994-07-17T12:30-07:00", stage: "ফাইনাল", home: "BRA", away: "ITA", score: [0, 0], pens: [3, 2], aet: true, star: [0.9, 0.05] },
  { id: "1998-r16-arg-eng", kickoff: "1998-06-30T21:00+02:00", stage: "শেষ ষোলো", home: "ARG", away: "ENG", score: [2, 2], pens: [4, 3], aet: true, star: [0.07, 0.24] },
  { id: "1998-final", kickoff: "1998-07-12T21:00+02:00", stage: "ফাইনাল", home: "BRA", away: "FRA", score: [0, 3], star: [0.3, 0.22] },
  { id: "2006-r16-arg-mex", kickoff: "2006-06-24T21:00+02:00", stage: "শেষ ষোলো", home: "ARG", away: "MEX", score: [2, 1], aet: true, star: [0.93, 0.27] },
  { id: "2006-final", kickoff: "2006-07-09T20:00+02:00", stage: "ফাইনাল", home: "ITA", away: "FRA", score: [1, 1], pens: [5, 3], aet: true, star: [0.68, 0.32] },
  { id: "2010-final", kickoff: "2010-07-11T20:30+02:00", stage: "ফাইনাল", home: "NED", away: "ESP", score: [0, 1], aet: true, star: [0.1, 0.44] },
  { id: "2014-sf-bra-ger", kickoff: "2014-07-08T17:00-03:00", stage: "সেমিফাইনাল", home: "BRA", away: "GER", score: [1, 7], star: [0.38, 0.38] },
  { id: "2014-sf-ned-arg", kickoff: "2014-07-09T17:00-03:00", stage: "সেমিফাইনাল", home: "NED", away: "ARG", score: [0, 0], pens: [2, 4], aet: true, star: [0.9, 0.46] },
  { id: "2014-final", kickoff: "2014-07-13T16:00-03:00", stage: "ফাইনাল", home: "GER", away: "ARG", score: [1, 0], aet: true, star: [0.6, 0.47] },
  { id: "2018-por-esp", kickoff: "2018-06-15T21:00+03:00", stage: "গ্রুপ পর্ব", home: "POR", away: "ESP", score: [3, 3], star: [0.06, 0.7] },
  { id: "2018-nga-arg", kickoff: "2018-06-26T21:00+03:00", stage: "গ্রুপ পর্ব", home: "NGA", away: "ARG", score: [1, 2], star: [0.34, 0.68] },
  { id: "2018-qf-bra-bel", kickoff: "2018-07-06T21:00+03:00", stage: "কোয়ার্টার ফাইনাল", home: "BRA", away: "BEL", score: [1, 2], star: [0.92, 0.72] },
  { id: "2022-bra-srb", kickoff: "2022-11-24T22:00+03:00", stage: "গ্রুপ পর্ব", home: "BRA", away: "SRB", score: [2, 0], star: [0.12, 0.92] },
  { id: "2022-r16-bra-kor", kickoff: "2022-12-05T22:00+03:00", stage: "শেষ ষোলো", home: "BRA", away: "KOR", score: [4, 1], star: [0.38, 0.9] },
  { id: "2022-qf-ned-arg", kickoff: "2022-12-09T22:00+03:00", stage: "কোয়ার্টার ফাইনাল", home: "NED", away: "ARG", score: [2, 2], pens: [3, 4], aet: true, star: [0.64, 0.74] },
  { id: "2022-sf-fra-mar", kickoff: "2022-12-14T22:00+03:00", stage: "সেমিফাইনাল", home: "FRA", away: "MAR", score: [2, 0], star: [0.7, 0.94] },
  { id: "2026-r16-bra-nor", kickoff: "2026-07-05T16:00-04:00", stage: "শেষ ষোলো", home: "BRA", away: "NOR", score: [1, 2], star: [0.93, 0.9] },
  { id: "2026-final", kickoff: "2026-07-19T15:00-04:00", stage: "ফাইনাল", home: "ESP", away: "ARG", score: [1, 0], aet: true, star: [0.88, 0.16] },
] as const satisfies readonly Night[];

export type NightId = (typeof nights)[number]["id"];
export type Shared = { selected: NightId[]; name: string };

// This summer's two nights, one for each big fan base, so the first screen is already a card worth looking at.
export const DEFAULT_PICKS: NightId[] = ["2026-r16-bra-nor", "2026-final"];
export const MAX_NAME_LENGTH = 30;
// Playful constants, labelled "মজার হিসাব" wherever they show.
export const CUPS_PER_NIGHT = 2;
export const SLEEP_HOURS_PER_NIGHT = 5;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
/** Years without the thousands comma ("২০২৬", not "২,০২৬"). */
export const bnYear = new Intl.NumberFormat("bn-BD", { useGrouping: false }).format;
const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BD_OFFSET_MS = 6 * 3600_000;

export const yearOf = (night: Night) => Number(night.kickoff.slice(0, 4));
export const years = [...new Set(nights.map(yearOf))];

/** Kickoff on a Bangladeshi wall clock. */
export function bdClock(kickoff: string) {
  const at = new Date(Date.parse(kickoff) + BD_OFFSET_MS);
  return { hour: at.getUTCHours(), minute: at.getUTCMinutes(), at };
}

export const isLateNight = (kickoff: string) => { const { hour } = bdClock(kickoff); return hour >= 23 || hour < 5; };

/** "রাত দেড়টা" + "৯ জুলাই দিবাগত": after midnight, Bangladeshi papers name the evening before ("দিবাগত রাত"). */
export function bdKickoff(kickoff: string) {
  const { hour, minute, at } = bdClock(kickoff);
  const h = hour % 12 || 12;
  const clock = minute === 30 ? (h === 1 ? "দেড়টা" : h === 2 ? "আড়াইটা" : `সাড়ে ${bn(h)}টা`) : minute ? `${bn(h)}:${bn(minute).padStart(2, "০")}` : `${bn(h)}টা`;
  const day = hour < 12 ? new Date(at.getTime() - 86400_000) : at;
  return { time: `রাত ${clock}`, date: `${bn(day.getUTCDate())} ${months[day.getUTCMonth()]}${hour < 12 ? " দিবাগত" : ""}` };
}

export const scoreLine = (night: Night) => `${teams[night.home]} ${bn(night.score[0])}–${bn(night.score[1])} ${teams[night.away]}`;
export const scoreNote = (night: Night) => night.pens ? `টাইব্রেকারে ${bn(night.pens[0])}–${bn(night.pens[1])}` : night.aet ? "অতিরিক্ত সময়ে" : "";
export const nightTitle = (night: Night) => `${bnYear(yearOf(night))} ${night.stage}`;

const index = new Map<string, number>(nights.map((night, at) => [night.id, at]));
export const isNightId = (id: string): id is NightId => index.has(id);
export const nightById = (id: NightId) => nights[index.get(id)!];
const inOrder = (ids: Iterable<string>) => nights.filter(night => new Set(ids).has(night.id)).map(night => night.id);

export function toggleNight(selected: readonly NightId[], id: string): NightId[] {
  if (!isNightId(id)) throw new RangeError("এই রাতটা তালিকায় নেই।");
  return selected.includes(id) ? selected.filter(item => item !== id) : inOrder([...selected, id]);
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function encodeMask(selected: readonly NightId[]) {
  return selected.reduce((bits, id) => bits | (1 << index.get(id)!), 0).toString(36);
}

export function decodeMask(code: string): NightId[] {
  // 20 nights fit in 4 base-36 digits; anything longer is not ours.
  if (!/^[0-9a-z]{1,4}$/.test(code)) return [];
  const bits = parseInt(code, 36);
  return nights.filter((_, at) => bits & (1 << at)).map(night => night.id);
}

export function shareHash({ selected, name }: Shared) {
  const params = new URLSearchParams({ m: encodeMask(selected) });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const selected = decodeMask(params.get("m") ?? "");
  return selected.length ? { selected, name: cleanName(params.get("n") ?? "") } : null;
}

const involves = (ids: readonly NightId[], team: Team) => ids.filter(id => { const night = nightById(id); return night.home === team || night.away === team; }).length;

/** The human line, chosen by which nights were picked. */
export function nightLine(selected: readonly NightId[]) {
  const count = selected.length;
  if (!count) return "এখনো কোনো রাত দাগানো হয়নি।";
  if (count === nights.length) return "২০টাই! বিশ্বকাপ এলে তোমার ঘুম ছুটিতে যায়।";
  const arg = involves(selected, "ARG"), bra = involves(selected, "BRA");
  if (count >= 3 && yearOf(nightById(selected[0])) <= 1994) return "ছাদে অ্যান্টেনা ঘোরানোর যুগ থেকে রাত জাগা চলছে।";
  if (arg >= 2 && bra >= 2) return "আর্জেন্টিনা হোক বা ব্রাজিল, বিশ্বকাপের রাতে ঘুম নেই।";
  if (arg >= 2 && arg > bra) return "আকাশি-সাদা রাতগুলোয় চোখের পাতা এক হয়নি।";
  if (bra >= 2 && bra > arg) return "হলুদ-সবুজ রাতগুলোয় চোখের পাতা এক হয়নি।";
  if (count <= 2) return "অল্প কয় রাত, কিন্তু প্রতিটার স্কোর এখনো মুখস্থ।";
  return "দল যার-ই হোক, ভালো খেলা মানেই রাত জাগা।";
}

export type CardContent = {
  name: string;
  count: number;
  total: number;
  headline: string;
  line: string;
  cups: number;
  hours: number;
  match: string;
  selected: ReadonlySet<NightId>;
};

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const picked = inOrder(own.selected.filter(isNightId));
  const name = cleanName(own.name);
  const count = picked.length;
  const common = friend ? picked.filter(id => friend.selected.includes(id)) : [];
  const who = friend?.name ? possessive(friend.name) : "বন্ধুর";
  return {
    name,
    count,
    total: nights.length,
    headline: `${bn(nights.length)}-এ ${bn(count)} রাত ${name ? "জেগেছে" : "জেগেছি"}`,
    line: nightLine(picked),
    cups: count * CUPS_PER_NIGHT,
    hours: count * SLEEP_HOURS_PER_NIGHT,
    match: friend && count ? (common.length ? `${who} সাথে ${bn(common.length)} রাত একসাথে · ${nightTitle(nightById(common.at(-1)!))}` : `${who} সাথে একটা রাতও মেলেনি!`) : "",
    selected: new Set(picked),
  };
}

export function previewTitle(shared: Shared | null) {
  if (!shared) return "বিশ্বকাপের কয় রাত জেগেছ? ১৯৯০ থেকে ২০২৬, ২০টা রাত";
  return `${shared.name || "এক বন্ধু"} বিশ্বকাপের ২০-এ ${bn(shared.selected.length)} রাত জেগেছে। তুমি কয় রাত?`;
}

export { possessive };
