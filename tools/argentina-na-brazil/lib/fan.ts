// The আসল ফ্যান test: 8 questions on your own team's football history, offered after the roof is up.
// Well-known facts only, both sets on the same eight themes (titles, first title, a legend, a record, a lost
// final, a won final, a final's star, a Copa final against the rival). Every answer checked October 2026 on the
// Wikipedia match article named beside it; 2026 facts also against NBC Sports and The Irish Times.
// Share links store taps by shown position and replay the order from the seed: once links are public, never
// edit, reorder or remove these questions or their options. options[0] is the right answer in the data.
import { possessive } from "../../../shared/bangla";
import { bn, FAN_ROUNDS, teamOf, type Pick, type Roof, type Shared, type TeamId } from "./roof";

export type FanTeam = "arg" | "bra";
export type FanQuestion = {
  id: string;
  /** What's asked, for "শুধু <topic> প্রশ্নটা ফসকেছে". Never gives the answer away. */
  topic: string;
  ask: string;
  options: readonly [string, string, string];
  /** One line shown after the tap. */
  fact: string;
  source: string;
};

const WIKI = "উইকিপিডিয়া";

export const fanSets: Record<FanTeam, readonly FanQuestion[]> = {
  arg: [
    // https://en.wikipedia.org/wiki/Argentina_national_football_team ("won three FIFA World Cups, in 1978, 1986 and 2022") · 2026 final lost 1–0 to Spain: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
    { id: "a-kap", topic: "বিশ্বকাপ সংখ্যার", ask: "আর্জেন্টিনা এখন পর্যন্ত কয়টা বিশ্বকাপ জিতেছে?", options: ["৩টা", "২টা", "৪টা"], fact: "৩টা: ১৯৭৮, ১৯৮৬ আর ২০২২। ২০২৬-এও ফাইনালে উঠেছিল, অতিরিক্ত সময়ে স্পেনের কাছে ১-০।", source: WIKI },
    // https://en.wikipedia.org/wiki/1978_FIFA_World_Cup_final (Argentina 3–1 Netherlands a.e.t., Estadio Monumental, Buenos Aires; neither had won before)
    { id: "a-prothom", topic: "প্রথম বিশ্বকাপের", ask: "আর্জেন্টিনা প্রথম বিশ্বকাপ জেতে কোন সালে?", options: ["১৯৭৮", "১৯৩০", "১৯৮৬"], fact: "১৯৭৮, নিজের দেশে। বুয়েনস আইরেসের ফাইনালে নেদারল্যান্ডসকে ৩-১ গোলে হারিয়ে।", source: WIKI },
    // https://en.wikipedia.org/wiki/Hand_of_God_goal (1986 quarter-final v England, 22 June 1986, Estadio Azteca, 2–1; "Goal of the Century" four minutes later)
    { id: "a-hand", topic: "হ্যান্ড অব গডের", ask: "ম্যারাডোনার ‘হ্যান্ড অব গড’ গোলটা কোন দলের বিপক্ষে?", options: ["ইংল্যান্ড", "পশ্চিম জার্মানি", "ইতালি"], fact: "ইংল্যান্ড, ১৯৮৬ বিশ্বকাপের কোয়ার্টার ফাইনালে। চার মিনিট পরেই শতাব্দীর সেরা গোলটাও।", source: WIKI },
    // https://en.wikipedia.org/wiki/Copa_Am%C3%A9rica (Argentina 16 titles, the most) · https://en.wikipedia.org/wiki/2024_Copa_Am%C3%A9rica_final ("a record-breaking 16th Copa América title")
    { id: "a-copa", topic: "কোপা রেকর্ডের", ask: "আর্জেন্টিনা কতবার কোপা আমেরিকা জিতেছে?", options: ["১৬ বার", "১২ বার", "৯ বার"], fact: "১৬ বার, সবচেয়ে বেশি। ১৬তমটা ২০২৪-এ, ফাইনালে কলম্বিয়াকে ১-০ গোলে হারিয়ে।", source: WIKI },
    // https://en.wikipedia.org/wiki/2014_FIFA_World_Cup_final (Germany 1–0 Argentina a.e.t., Götze 113', Maracanã)
    { id: "a-2014", topic: "২০১৪ ফাইনালের", ask: "২০১৪ বিশ্বকাপ ফাইনালে আর্জেন্টিনা কার কাছে হারে?", options: ["জার্মানি", "নেদারল্যান্ডস", "স্পেন"], fact: "জার্মানি, অতিরিক্ত সময়ে মারিও গোৎসের গোলে ১-০। খেলা ছিল রিওর মারাকানায়।", source: WIKI },
    // https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final (Argentina v France, 3–3 a.e.t., 4–2 on penalties, Lusail Stadium)
    { id: "a-2022", topic: "২০২২ ফাইনালের", ask: "২০২২ বিশ্বকাপ ফাইনালে আর্জেন্টিনা কোন দলকে হারায়?", options: ["ফ্রান্স", "ক্রোয়েশিয়া", "ব্রাজিল"], fact: "ফ্রান্স। ৩-৩ গোলের পর টাইব্রেকারে ৪-২, কাতারের লুসাইলে।", source: WIKI },
    // https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final (Golden Ball: Messi, "the first (and so far only) player to receive the award twice") · 2026 Golden Ball went to Rodri: https://www.irishtimes.com/sport/soccer/2026/07/20/rodri-wins-world-cup-golden-ball-as-kylian-mbappe-wins-second-golden-boot/
    { id: "a-ball", topic: "গোল্ডেন বলের", ask: "২০২২ বিশ্বকাপে সেরা খেলোয়াড়ের গোল্ডেন বল কে পান?", options: ["লিওনেল মেসি", "কিলিয়ান এমবাপে", "লুকা মদরিচ"], fact: "মেসি। ২০১৪-তেও পেয়েছিলেন। দুবার গোল্ডেন বল পাওয়া একমাত্র খেলোয়াড়।", source: WIKI },
    // https://en.wikipedia.org/wiki/2021_Copa_Am%C3%A9rica_final (Argentina 1–0 Brazil, Di María 22', Maracanã; Messi's first senior international trophy)
    { id: "a-2021", topic: "২০২১ কোপার", ask: "২০২১ কোপা আমেরিকার ফাইনালে আর্জেন্টিনা কাকে হারায়?", options: ["ব্রাজিল", "উরুগুয়ে", "কলম্বিয়া"], fact: "ব্রাজিল, মারাকানায় দি মারিয়ার গোলে ১-০। সিনিয়র দলের হয়ে মেসির প্রথম ট্রফি।", source: WIKI },
  ],
  bra: [
    // https://en.wikipedia.org/wiki/Brazil_national_football_team ("five times: 1958, 1962, 1970, 1994 and 2002"); Spain won 2026: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
    { id: "b-kap", topic: "বিশ্বকাপ সংখ্যার", ask: "ব্রাজিল এখন পর্যন্ত কয়টা বিশ্বকাপ জিতেছে?", options: ["৫টা", "৪টা", "৬টা"], fact: "৫টা: ১৯৫৮, ১৯৬২, ১৯৭০, ১৯৯৪ আর ২০০২। এখনো সবচেয়ে বেশি।", source: WIKI },
    // https://en.wikipedia.org/wiki/1958_FIFA_World_Cup_final (Brazil 5–2 Sweden, Råsunda, Solna; Pelé 17, two goals; first title)
    { id: "b-prothom", topic: "প্রথম বিশ্বকাপের", ask: "ব্রাজিল প্রথম বিশ্বকাপ জেতে কোন সালে?", options: ["১৯৫৮", "১৯৫০", "১৯৭০"], fact: "১৯৫৮, সুইডেনে। ফাইনালে স্বাগতিক সুইডেনকে ৫-২, ১৭ বছরের পেলের দুই গোল।", source: WIKI },
    // https://en.wikipedia.org/wiki/Pel%C3%A9 ("three FIFA World Cup titles – in 1958, 1962, and 1970 – becoming the only player to do so")
    { id: "b-pele", topic: "পেলের", ask: "খেলোয়াড় হিসেবে পেলে কয়টা বিশ্বকাপ জিতেছেন?", options: ["৩টা", "২টা", "৪টা"], fact: "৩টা: ১৯৫৮, ১৯৬২ আর ১৯৭০। তিনটা বিশ্বকাপ জেতা একমাত্র খেলোয়াড়।", source: WIKI },
    // https://en.wikipedia.org/wiki/1970_FIFA_World_Cup_final (Brazil 4–1 Italy, Azteca; "the right to retain the Jules Rimet Trophy permanently")
    { id: "b-rimet", topic: "১৯৭০-এর ট্রফির", ask: "১৯৭০-এ তৃতীয় বিশ্বকাপ জিতে ব্রাজিল কোন ট্রফি চিরদিনের জন্য রেখে দেয়?", options: ["জুলে রিমে ট্রফি", "কোপা আমেরিকা ট্রফি", "কনফেডারেশনস কাপ"], fact: "জুলে রিমে ট্রফি। তৃতীয়বার জেতায় আসল ট্রফিটাই ব্রাজিলের হয়ে যায়।", source: WIKI },
    // https://en.wikipedia.org/wiki/Maracanazo (16 July 1950, Uruguay 2–1 Brazil at the Maracanã; the deciding match of a final round, Brazil needed a draw)
    { id: "b-1950", topic: "মারাকানার", ask: "১৯৫০ বিশ্বকাপের শেষ ম্যাচে মারাকানায় ব্রাজিলকে হারিয়ে কাপ নেয় কোন দল?", options: ["উরুগুয়ে", "আর্জেন্টিনা", "ইতালি"], fact: "উরুগুয়ে, ২-১ গোলে। ব্রাজিলের ড্র হলেই চলত। এর নামই ‘মারাকানাজো’।", source: WIKI },
    // https://en.wikipedia.org/wiki/1994_FIFA_World_Cup_final (Brazil v Italy 0–0 a.e.t., 3–2 on penalties, Rose Bowl, Pasadena; Baggio missed; fourth title)
    { id: "b-1994", topic: "১৯৯৪ ফাইনালের", ask: "১৯৯৪ বিশ্বকাপ ফাইনালে ব্রাজিল কোন দলকে হারায়?", options: ["ইতালি", "নেদারল্যান্ডস", "ফ্রান্স"], fact: "ইতালি। ০-০ গোলের পর টাইব্রেকারে ৩-২, শেষ শটটা মিস করেন রবার্তো বাজ্জো।", source: WIKI },
    // https://en.wikipedia.org/wiki/2002_FIFA_World_Cup_final (Brazil 2–0 Germany, Yokohama; Ronaldo 67' and 79'; fifth title)
    { id: "b-2002", topic: "২০০২ ফাইনালের", ask: "২০০২ বিশ্বকাপ ফাইনালে ব্রাজিলের দুটো গোলই কার?", options: ["রোনালদো (নাজারিও)", "রিভালদো", "রোনালদিনহো"], fact: "রোনালদো নাজারিও, জাপানের ইয়োকোহামায় জার্মানির বিপক্ষে। ব্রাজিলের পঞ্চম বিশ্বকাপ।", source: WIKI },
    // https://en.wikipedia.org/wiki/2007_Copa_Am%C3%A9rica_final (Brazil 3–0 Argentina, 15 July 2007, Maracaibo, Venezuela)
    { id: "b-2007", topic: "২০০৭ কোপার", ask: "২০০৭ কোপা আমেরিকার ফাইনালে ব্রাজিল কাকে ৩-০ গোলে হারায়?", options: ["আর্জেন্টিনা", "উরুগুয়ে", "মেক্সিকো"], fact: "আর্জেন্টিনা, ভেনেজুয়েলার মারাকাইবোতে। জুলিও বাপতিস্তা আর দানি আলভেসের গোল, একটা আত্মঘাতী।", source: WIKI },
  ],
};

export const rivalOf = (team: FanTeam): FanTeam => team === "arg" ? "bra" : "arg";

/** Small seeded generator (mulberry32), so a link's seed always replays the same order. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], next: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type FanRound = { question: FanQuestion; options: string[]; right: Pick };

/** The test as shown: question order and option order both come from the seed (different per team for one seed). */
export function fanTest(team: FanTeam, seed: number): FanRound[] {
  const next = seeded(seed * 2 + (team === "bra" ? 1 : 0));
  return shuffle(fanSets[team].slice(0, FAN_ROUNDS), next).map(question => {
    const order = shuffle([0, 1, 2], next);
    return { question, options: order.map(index => question.options[index]), right: order.indexOf(0) as Pick };
  });
}

export const newSeed = () => Math.floor(Math.random() * 10000);

/** Recomputed from the taps every time; a link never carries a score. */
export function fanScore(team: TeamId, seed: number, picks: readonly Pick[]) {
  if (team !== "arg" && team !== "bra") return 0;
  const rounds = fanTest(team, seed);
  return picks.filter((pick, index) => rounds[index]?.right === pick).length;
}

export const scoreLine = (score: number) => `${bn(FAN_ROUNDS)}-এ ${bn(score)}`;

export function fanBadge(team: TeamId, score: number) {
  const label = teamOf(team).label;
  if (score >= 7) return `খাঁটি ${label} ভক্ত`;
  if (score >= 5) return `মনেপ্রাণে ${label} ভক্ত`;
  if (score >= 3) return `বিশ্বকাপের ${label} ভক্ত`;
  return `নতুন ${label} ভক্ত`;
}

/** "রাফি ৮-এ ৭": spoken by whoever took the test. */
export const fanWho = (roof: Roof, fallback: string, seed: number) => `${roof.name || fallback} ${scoreLine(fanScore(roof.team, seed, roof.quiz ?? []))}`;

/** The human line on a solo card: from the score, and when only one slipped, from which one. First person, like the roof card. */
export function fanLine(team: FanTeam, seed: number, picks: readonly Pick[]) {
  const rounds = fanTest(team, seed);
  const missed = rounds.filter((round, index) => round.right !== picks[index]);
  const score = FAN_ROUNDS - missed.length;
  if (score === FAN_ROUNDS) return "আটে আট। দলের ইতিহাসটা আমার মুখস্থ।";
  if (missed.length === 1) return `শুধু ${missed[0].question.topic} প্রশ্নটা ফসকেছে, বাকিটা মুখস্থ।`;
  if (score >= 5) return "ইতিহাস প্রায় পুরোটা জানা, ভালোবাসা পুরোটাই।";
  if (score >= 3) return "খেলা দেখি মন দিয়ে, ইতিহাসটা এবার পড়ে নেব।";
  return "ভালোবাসা দিয়ে শুরু, ইতিহাস শিখে নেব।";
}

/** Two houses, two scores. Banter stays on the tea, never on the team. */
export function fanLaneLine(own: Roof, neighbour: Roof, seed: number) {
  const mine = fanScore(own.team, seed, own.quiz ?? []);
  const theirs = fanScore(neighbour.team, seed, neighbour.quiz ?? []);
  const them = neighbour.name || "পাশের বাসা";
  if (own.team === neighbour.team) return mine === theirs ? "একই পতাকা, সমান নম্বর। দুজনেই খাঁটি।" : `${mine > theirs ? (own.name || "আমি") : them} একটু বেশি জানে, পতাকা কিন্তু দুজনেরই।`;
  if (mine === theirs) return "সমানে সমান। আজকের চা ভাগাভাগি করে।";
  return mine > theirs ? `এই রাউন্ড ${possessive(teamOf(own.team).label)}। আজকের চা ${them} খাওয়াবে।` : `এই রাউন্ড ${possessive(teamOf(neighbour.team).label)}। আজকের চা আমার পক্ষ থেকে।`;
}

/** Both houses took the test. */
export const fanPair = ({ own, neighbour, seed }: Shared) => Boolean(seed !== undefined && own.quiz && neighbour?.quiz);

/** "রাফি আর্জেন্টিনা ৮-এ ৭, মিম ব্রাজিল ৮-এ ৮": the neighbour (who sent the link) first, then you. */
export function fanLaneTitle({ own, neighbour, seed = 0 }: Shared) {
  if (!neighbour) return "";
  const score = (roof: Roof) => scoreLine(fanScore(roof.team, seed, roof.quiz ?? []));
  return `${neighbour.name || "পাশের বাসা"} ${teamOf(neighbour.team).label} ${score(neighbour)}, ${own.name || "আমি"} ${teamOf(own.team).label} ${score(own)}`;
}

/** "রাফি ৮-এ ৭, খাঁটি আর্জেন্টিনা ভক্ত" */
export function fanTitle(roof: Roof, seed: number) {
  return `${fanWho(roof, "আমি", seed)}, ${fanBadge(roof.team, fanScore(roof.team, seed, roof.quiz ?? []))}`;
}

export function fanPreviewTitle(shared: Shared) {
  const seed = shared.seed ?? 0;
  if (fanPair(shared)) return `${fanLaneTitle(shared)}। তুমি কয়টা পারবে?`;
  return `${fanWho(shared.own, "এক বন্ধু", seed)}, ${fanBadge(shared.own.team, fanScore(shared.own.team, seed, shared.own.quiz ?? []))}। তুমি নিজের দলকে কতটা চেনো?`;
}

export function fanCaption(shared: Shared) {
  const seed = shared.seed ?? 0;
  if (fanPair(shared)) return `আসল ফ্যান পরীক্ষা: ${fanLaneTitle(shared)}! তুমি নিজের দলকে কতটা চেনো?`;
  const team = shared.own.team as FanTeam;
  const score = fanScore(team, seed, shared.own.quiz ?? []);
  return `আসল ফ্যান পরীক্ষায় আমি ${scoreLine(score)}, ${fanBadge(team, score)}। ${teamOf(rivalOf(team)).label} ভক্তরা, নিজের দলকে কতটা চেনো?`;
}
