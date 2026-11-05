// The games portal: which games go where on the home page, /games and /chhotoder.
// Pure data and helpers, no file system, so client components and tests can import it.
import { catalog, type ToolListing } from './catalog';

export const isGame = (tool: ToolListing) => tool.category === 'গেম';
export const isKidsGame = (tool: ToolListing) => tool.category === 'ছোটদের জন্য';
export const isAnyGame = (tool: ToolListing) => isGame(tool) || isKidsGame(tool);

export const games = catalog.filter(isGame);
export const kidsGames = catalog.filter(isKidsGame);
export const allGames = catalog.filter(isAnyGame);
/** Quizzes, calculators, card makers: everything that isn't a game. */
export const otherTools = catalog.filter(tool => !isAnyGame(tool));

export type GameTag = 'dhadha' | 'deshi' | 'arcade' | 'dujone';
export type KidsTag = 'borno' | 'onko' | 'prithibi' | 'mon';
export type Filter<T extends string> = { id: T; name: string };

/** Filters on /games and the category tiles on the home page. */
export const gameFilters: Filter<GameTag>[] = [
  { id: 'dhadha', name: 'ধাঁধা' },
  { id: 'deshi', name: 'দেশি খেলা' },
  { id: 'arcade', name: 'আর্কেড' },
  { id: 'dujone', name: 'দুজনে খেলো' },
];

export const kidsFilters: Filter<KidsTag>[] = [
  { id: 'borno', name: 'বর্ণ আর শব্দ' },
  { id: 'onko', name: 'গোনা আর অঙ্ক' },
  { id: 'prithibi', name: 'বিজ্ঞান আর পৃথিবী' },
  { id: 'mon', name: 'মন আর অভ্যাস' },
];

// Deduced from each game: ধাঁধা = think before you move (levels, logic, memory); দেশি = a game played in
// Bangladeshi yards and streets; আর্কেড = timing and reflexes; দুজনে = two or more people on one phone.
export const gameTags: Record<string, readonly GameTag[]> = {
  'kalbaishakhi-aam': ['arcade'],
  'dudh-uthlano': ['arcade'],
  'jhalmuri-sap': ['arcade'],
  'danguli': ['deshi', 'arcade'],
  'antenna-thik-koro': ['arcade'],
  'sir-ghurlei-thamo': ['arcade'],
  'deri-hoye-gelo': ['arcade'],
  'chor-police': ['deshi', 'dujone'],
  'bostar-pahar': ['arcade'],
  'tarer-fanke-belun': ['arcade'],
  'paka-kancha': ['dhadha'],
  'jora-melao': ['dhadha', 'dujone'],
  'chhok-jora': ['dhadha', 'dujone'],
  'churui-tarao': ['arcade'],
  'handi-bhanga': ['arcade'],
  'peoner-cycle': ['arcade'],
  'sap-ludu': ['deshi', 'dujone'],
  'baghbandi': ['deshi', 'dhadha', 'dujone'],
  'baicher-nouka': ['deshi', 'arcade'],
  'vo-katta': ['deshi', 'arcade'],
  'bhangti-nai': ['dhadha'],
  'jam-chharao': ['dhadha'],
  'shobdo-khoja': ['dhadha'],
  'carrom': ['deshi', 'dujone'],
  'pati-buni': ['dhadha'],
  'sudoku': ['dhadha'],
  'switchboard': ['dhadha'],
  'golokdhadha': ['dhadha'],
  'ponero-ghor': ['dhadha'],
  'chhobi-photao': ['dhadha'],
  'ghontar-sur': ['dhadha'],
  'konta-nei': ['dhadha'],
  'bhul-kothay': ['dhadha'],
  'atir-aam': ['dhadha'],
  'bhimruler-chak': ['dhadha'],
  'churir-bazar': ['dhadha'],
  'mukhe-mukhe-hisab': ['dhadha'],
  'chhobir-tukro': ['dhadha'],
  'sat-chara': ['deshi', 'arcade'],
  'chhip-felo': ['arcade'],
  'latim': ['deshi', 'arcade'],
  'nodi-par': ['arcade'],
  'penalty': ['arcade'],
  'golir-badminton': ['arcade'],
  'kagojer-urojahaj': ['arcade'],
  'marble-sinri': ['deshi', 'arcade'],
  'roshi-tana': ['deshi', 'arcade', 'dujone'],
  'moshar-raat': ['arcade'],
  'al-dhore-hati': ['arcade'],
  'o-te-ojogor': ['arcade'],
};

export const kidsTags: Record<string, KidsTag> = {
  'kar-chinho': 'borno', 'juktoborno': 'borno', 'borno-likhi': 'borno', 'chhorar-tal': 'borno', 'nam-shikhi': 'borno', 'abc-bazar': 'borno',
  'gune-dekhi': 'onko', 'dosh-ghater-nouka': 'onko', 'daripalla': 'onko', 'shoman-bhag': 'onko', 'ghori-dekhi': 'onko', 'sat-tukro': 'onko', 'mongole-rover': 'onko',
  'sourojogot': 'prithibi', 'prithibi-ghuri': 'prithibi', 'dinosaur': 'prithibi', 'ki-hobe': 'prithibi',
  'moner-rong': 'mon', 'nirapode-thaki': 'mon', 'hat-dhui': 'mon', 'golper-mor': 'mon', 'ulto-khela': 'mon', 'chhaya-melao': 'mon', 'sur-banai': 'mon', 'ammur-number': 'mon',
};

/**
 * সেরা বাছাই: an editorial pick, the games that look and play best on a first visit.
 * The full grid slots one of these in every fourth place, so every third one lands 12 tiles apart: those are the big ones.
 */
export const featured = ['kalbaishakhi-aam', 'handi-bhanga', 'baghbandi', 'carrom', 'penalty', 'nodi-par', 'sap-ludu', 'golir-badminton', 'churir-bazar', 'vo-katta', 'deri-hoye-gelo', 'tarer-fanke-belun'];

/** Shown as 2×2 tiles in the full grid. */
export const bigTiles = new Set(['kalbaishakhi-aam', 'carrom', 'sap-ludu', 'vo-katta']);

const bySlug = new Map<string, ToolListing>(catalog.map(tool => [tool.slug, tool]));
export const toolBySlug = (slug: string) => bySlug.get(slug);

/** The catalog grows at the end, so later entries are newer. Newest games first, with a kids' game every third. */
export function newestGames(count = 10): ToolListing[] {
  const plain = [...games].reverse(), kids = [...kidsGames].reverse();
  const out: ToolListing[] = [];
  while (out.length < count && (plain.length || kids.length)) {
    const next = (out.length % 3 === 2 ? kids.shift() ?? plain.shift() : plain.shift() ?? kids.shift())!;
    out.push(next);
  }
  return out;
}

/** The home grid order: every game, newest first, with an editorial pick in every fourth place. */
export function gridOrder(): ToolListing[] {
  const picks = featured.map(toolBySlug).filter(tool => tool !== undefined);
  const rest = [...games].reverse().filter(tool => !featured.includes(tool.slug));
  const out: ToolListing[] = [];
  while (picks.length || rest.length) out.push((out.length % 4 === 0 ? picks.shift() ?? rest.shift() : rest.shift() ?? picks.shift())!);
  return out;
}

export const tagsOf = (slug: string): readonly string[] => gameTags[slug] ?? (kidsTags[slug] ? [kidsTags[slug]] : []);
