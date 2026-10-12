export const MAX_NAME = 16;
/** People on one board: the link carries up to five earlier players plus the one who shared it. */
export const MAX_BOARD = 6;

// Four carrom pieces, four adda roles, every one of them a compliment. `code` is the role's letter in group links.
export const roles = [
  { id: "queen", code: "q", piece: "কুইন", tag: "আড্ডার মধ্যমণি", line: "তুমি না এলে আড্ডা শুরুই হয় না। সবাই ঘুরেফিরে তোমার কাছেই আসে, আর তুমি সবাইকে এক বোর্ডে ধরে রাখো।" },
  { id: "striker", code: "s", piece: "স্ট্রাইকার", tag: "আড্ডা জমায় যে", line: "এক টোকায় পুরো আড্ডা নড়ে ওঠে। প্ল্যান, ফোন, ‘চল বের হই’, সব তোমার কাছ থেকেই আসে।" },
  { id: "white", code: "w", piece: "সাদা গুটি", tag: "শান্ত শ্রোতা", line: "সবার কথা তুমি মন দিয়ে শোনো, আর ঠিকঠাক মনে রাখো। তোমার পাশে বসলে সবাই নিজের কথাটা বলে ফেলে।" },
  { id: "black", code: "b", piece: "কালো গুটি", tag: "গোপন মজার মানুষ", line: "চুপচাপ বসে থাকো, কেউ টেরও পায় না। তারপর এক লাইনে পুরো আড্ডা হেসে গড়াগড়ি।" },
] as const;
export type Role = (typeof roles)[number];
export type RoleId = Role["id"];
export const roleById = (id: RoleId) => roles.find(role => role.id === id)!;

// The blend under the result: [main role][second role]. `pure` is for seven answers out of seven.
const blends: Record<RoleId, Record<RoleId | "pure", string>> = {
  queen: { pure: "সাতে সাত! তুমি খাঁটি কুইন, বোর্ডের ঠিক মাঝখানে।", queen: "", striker: "মধ্যমণি তো বটেই, দরকার হলে আড্ডায় আগুনটাও তুমিই জ্বালাও।", white: "সবাই তোমার কাছে আসে, কারণ তুমি সবার কথা শোনো।", black: "সবার মাঝখানে বসে থাকো, আর মাঝে মাঝে এক কথায় সবাইকে হাসিয়ে দাও।" },
  striker: { pure: "সাতে সাত! প্রতিটা চাল তোমার হাত থেকেই শুরু।", striker: "", queen: "আড্ডা শুরু করো তুমি, আর শেষে সবাই তোমাকে ঘিরেই বসে।", white: "সবাইকে ডেকে আনো, তারপর খেয়াল রাখো কেউ বাদ পড়ল কি না।", black: "প্ল্যানটাও তোমার, প্ল্যানের মজার নামটাও তোমার।" },
  white: { pure: "সাতে সাত! তোমার মতো মন দিয়ে কেউ শোনে না।", white: "", queen: "কথা কম বলো, তবু আড্ডাটা ঘোরে তোমাকে ঘিরেই।", striker: "চুপচাপ শোনো, কিন্তু সময় হলে ‘চল!’ বলে সবাইকে তুমিই ওঠাও।", black: "সবার কথা শুনে শেষে এমন এক জবাব দাও, আড্ডা জমে যায়।" },
  black: { pure: "সাতে সাত! শান্ত মুখের আড়ালে আস্ত একটা হাসির কারখানা।", black: "", queen: "হাসির বোমাটা তোমার, আর সবাই সেটার অপেক্ষায় তোমার দিকেই তাকিয়ে থাকে।", striker: "হাসাও তুমি, আড্ডাটাও ডেকে আনো তুমিই।", white: "সবার কথা মন দিয়ে শোনো, তারপর ঠিক সময়ে এক লাইনেই বাজিমাত।" },
};

type Option = { label: string; role: RoleId; line: string };
// Seven everyday adda moments; each question has exactly one option per role, in a different order each time.
// No romance, body, religion or politics. The link stores the shown position (a=0123012): never reorder, only reword in place.
// `line` is the card's "কারণ" when this answer explains the result; it reads after a name ("রাফি …") or on its own.
export const questions = [
  { ask: "টং দোকানে আড্ডা বসেছে। তুমি?", options: [
    { label: "সবাইকে ফোন করে আমিই ডেকেছি", role: "striker", line: "টং-এর আড্ডায় সবাইকে ফোন করে ডেকে আনে" },
    { label: "চায়ে চুমুক দিই, মন দিয়ে শুনি", role: "white", line: "চায়ে চুমুক দিতে দিতে সবার কথা মন দিয়ে শোনে" },
    { label: "বসতেই সবাই আমার দিকে ঘোরে", role: "queen", line: "টং-এ বসলেই সবাই তার দিকে ঘুরে বসে" },
    { label: "চুপ থাকি, পরে এক লাইনে বাজিমাত", role: "black", line: "চুপচাপ বসে থেকে এক লাইনে পুরো টং হাসায়" },
  ] },
  { ask: "ক্লাসের ফাঁকে ক্যাম্পাসে এক ঘণ্টা ফাঁকা।", options: [
    { label: "আমি যেখানে বসি, আড্ডা সেখানেই", role: "queen", line: "ক্যাম্পাসে যেখানে বসে, আড্ডা সেখানেই জমে" },
    { label: "এমন মিম বানাই, সবাই হেসে খুন", role: "black", line: "ক্লাসের ফাঁকে এমন মিম বানায়, সবাই হেসে খুন" },
    { label: "‘চল ফুচকা!’ প্ল্যানটা আমার", role: "striker", line: "ক্লাসের ফাঁকের সব প্ল্যান তার মাথা থেকেই আসে" },
    { label: "কারও মন খারাপ? পাশে গিয়ে বসি", role: "white", line: "কারও মন খারাপ দেখলে চুপচাপ পাশে গিয়ে বসে" },
  ] },
  { ask: "সন্ধ্যায় ছাদে আড্ডা, হঠাৎ কারেন্ট গেল!", options: [
    { label: "তারা দেখি আর সবার গল্প শুনি", role: "white", line: "অন্ধকার ছাদে তারা দেখতে দেখতে সবার গল্প শোনে" },
    { label: "টর্চ জ্বেলে অন্তাক্ষরী শুরু করি", role: "striker", line: "লোডশেডিংয়েও অন্তাক্ষরী শুরু করে আড্ডা জাগিয়ে রাখে" },
    { label: "ভূতের গল্পে মজার টুইস্ট দিই", role: "black", line: "ভূতের গল্পের মাঝে এক কথায় সবার ভয় হাসিতে উড়িয়ে দেয়" },
    { label: "সবাই আমাকে ঘিরে গোল হয়ে বসে", role: "queen", line: "অন্ধকারেও সবাই তাকে ঘিরে গোল হয়ে বসে" },
  ] },
  { ask: "বন্ধুদের গ্রুপ ভিডিও কল চলছে।", options: [
    { label: "ক্যামেরা বন্ধ, চ্যাটে মজার কমেন্ট", role: "black", line: "ক্যামেরা বন্ধ রেখেও চ্যাটে সবচেয়ে মজার কমেন্টটা করে" },
    { label: "আমি ঢুকলেই সবাই বলে ‘এই তো!’", role: "queen", line: "ভিডিও কলে ঢুকলেই সবাই একসাথে ‘এই তো!’ বলে ওঠে" },
    { label: "সবাই বলে, আমি হাসিমুখে শুনি", role: "white", line: "ভিডিও কলে হাসিমুখে সবার কথা শোনে" },
    { label: "কলটা আমিই দিই, সবাইকে ডাকি", role: "striker", line: "গ্রুপ কল দিয়ে সবাইকে টেনে আনে" },
  ] },
  { ask: "সবাই মিলে ঘুরতে যাওয়ার কথা উঠল।", options: [
    { label: "তারিখ-টিকিট আমি দেখছি!", role: "striker", line: "ঘোরার কথা উঠলে তারিখ-টিকিট সব ঠিক করে ফেলে" },
    { label: "আমি রাজি হলেই সবাই রাজি", role: "queen", line: "রাজি হলেই পুরো দল রাজি হয়ে যায়" },
    { label: "গ্রুপের মজার নাম রাখি আমি", role: "black", line: "ঘোরার প্ল্যানে গ্রুপের মজার নাম রেখে সবাইকে হাসায়" },
    { label: "কে কোথায় যেতে চায়, আগে শুনি", role: "white", line: "কে কোথায় যেতে চায়, সবার কথা আগে শুনে নেয়" },
  ] },
  { ask: "আজ এক বন্ধুর জন্মদিন।", options: [
    { label: "মন থেকে লম্বা মেসেজ লিখি", role: "white", line: "জন্মদিনে মন থেকে লম্বা একটা মেসেজ লেখে" },
    { label: "কেকে মজার কিছু লিখিয়ে আনি", role: "black", line: "কেকের ওপর মজার লেখা লিখিয়ে সবাইকে চমকে দেয়" },
    { label: "রাত ১২টার সারপ্রাইজ আমি সাজাই", role: "striker", line: "রাত ১২টার সারপ্রাইজ সাজাতে সবার আগে নামে" },
    { label: "কেক কাটতে সবাই আমাকে খোঁজে", role: "queen", line: "কেক কাটার সময় সবাই আগে তাকেই খোঁজে" },
  ] },
  { ask: "রাত হয়েছে, আড্ডা ভাঙার সময়।", options: [
    { label: "আমি উঠলেই আড্ডা ভাঙে, আগে না", role: "queen", line: "উঠলেই আড্ডা ভাঙে, তার আগে কেউ ওঠে না" },
    { label: "কে বাড়ি পৌঁছাল, খোঁজ নিই", role: "white", line: "আড্ডা শেষে সবাই বাড়ি পৌঁছাল কি না, খোঁজ নেয়" },
    { label: "যাওয়ার মুখে শেষ কৌতুকটা বলি", role: "black", line: "যাওয়ার মুখে শেষ কৌতুকটা বলে সবাইকে হাসিয়ে যায়" },
    { label: "‘আরেক কাপ চা!’ বলে আবার বসাই", role: "striker", line: "‘আরেক কাপ চা’ বলে ভাঙা আড্ডা আবার জমিয়ে দেয়" },
  ] },
] as const satisfies readonly { ask: string; options: readonly [Option, Option, Option, Option] }[];

export const QUESTION_COUNT = questions.length;

export type Answer = 0 | 1 | 2 | 3;
export type Member = { role: RoleId; name: string };
/** A link: the sharer's own answers and name, plus the earlier players on the same board. */
export type Shared = { answers: Answer[]; name: string; group: Member[] };

const bnFormat = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => bnFormat.format(value);

const votesOf = (answers: readonly Answer[]) => answers.map((answer, index) => questions[index].options[answer].role as RoleId);
const codeOf = (answers: readonly Answer[]) => answers.reduce<number>((sum, answer) => sum * 4 + answer, 0);

/**
 * Roles from strongest to weakest. More answers wins; a tie goes to the role picked most recently
 * ("শেষ চালটাই খেলা ঠিক করে"). The rule treats every role alike, so over all answers each comes up exactly a quarter of the time.
 */
export function ranking(answers: readonly Answer[]): RoleId[] {
  const votes = votesOf(answers);
  const score = (id: RoleId) => [votes.filter(vote => vote === id).length, votes.lastIndexOf(id)] as const;
  return roles.map(role => role.id).sort((left, right) => {
    const [a, b] = [score(left), score(right)];
    return b[0] - a[0] || b[1] - a[1];
  });
}

export const roleOf = (answers: readonly Answer[]) => ranking(answers)[0];

export function blendLine(answers: readonly Answer[]) {
  const [first, second] = ranking(answers);
  return votesOf(answers).includes(second) ? blends[first][second] : blends[first].pure;
}

/** The card's "কারণ": one of the person's own answers that voted for their role, picked by the answers so it never changes. */
export function reasonLine(answers: readonly Answer[]) {
  const role = roleOf(answers);
  const votes = votesOf(answers);
  const picks = votes.flatMap((vote, index) => vote === role ? [index] : []);
  const index = picks[codeOf(answers) % picks.length];
  return questions[index].options[answers[index]].line as string;
}

// Copied from tools/bhorta/lib/bhorta.ts (tools don't import each other).
// shortcut: a short public-card blocklist, not a full moderation filter; extend it when reports come in.
const blockedParts = ["চোদা", "চুদি", "চুদ", "চোদন", "মাদারচোদ", "বোকাচোদ", "খানকি", "খাংকি", "মাগি", "মাগী", "হারামি", "হারামজাদ", "বেশ্যা", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "শুয়রেরবাচ্চা", "গান্ডু", "ভোদা",
  "fuck", "bitch", "pussy", "porn", "khanki", "khangki", "harami", "haramjada", "haramzada", "madarchod", "bokachod", "choda", "chodi", "chudi", "chudir", "gandu", "kuttarbacc", "kuttarbach", "shuorerbacc", "bainchod", "behenchod"].map(part => part.normalize("NFC"));
const blockedWords = new Set(["বাল", "চোদ", "bal", "baal", "chod", "chud", "chodu", "fuk", "shit", "magi", "maggi", "randi", "besha", "dick", "sex", "nude", "cock", "ass"]);

export function isBlocked(text: string) {
  const lower = text.normalize("NFC").toLowerCase().replace(/[‌‍]/g, "");
  const squeezed = lower.replace(/[^ঀ-৿a-z]/g, "");
  return blockedParts.some(part => squeezed.includes(part)) || lower.split(/[^ঀ-৿a-z]+/).some(word => blockedWords.has(word));
}

/** Bangla, Latin letters, digits and single spaces only (so no link separators, controls or bidi tricks), NFC, capped. Blocked names become "". */
export function cleanName(raw: string) {
  const name = raw.normalize("NFC").replace(/[^ঀ-৿A-Za-z0-9 ‌‍]/g, "").replace(/\s+/g, " ").trim();
  const capped = [...name].slice(0, MAX_NAME).join("").trim();
  return isBlocked(capped) ? "" : capped;
}

const codeToRole = new Map<string, RoleId>(roles.map(role => [role.code, role.id]));

export function shareHash({ answers, name, group }: Shared) {
  const parts = [`a=${answers.join("")}`];
  const shown = cleanName(name);
  if (shown) parts.push(`n=${encodeURIComponent(shown)}`);
  const earlier = group.slice(-(MAX_BOARD - 1));
  if (earlier.length) parts.push(`g=${earlier.map(member => `${roleById(member.role).code}:${encodeURIComponent(cleanName(member.name))}`).join(",")}`);
  return "#" + parts.join("&");
}

/** Null unless the hash holds all seven answers; in-page anchors like #result are ignored. A broken group entry is dropped, not fatal. */
export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 2000) return null;
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const digits = params.get("a") ?? "";
  if (!new RegExp(`^[0-3]{${QUESTION_COUNT}}$`).test(digits)) return null;
  const group = (params.get("g") ?? "").split(",").flatMap((entry): Member[] => {
    const match = /^([a-z]):(.*)$/s.exec(entry);
    const role = match && codeToRole.get(match[1]);
    return role ? [{ role, name: cleanName(match[2]) }] : [];
  }).slice(0, MAX_BOARD - 1);
  return { answers: [...digits].map(Number) as Answer[], name: cleanName(params.get("n") ?? ""), group };
}

/** Everyone a link puts on the board: the earlier players, then the sharer. */
export const linkMembers = (shared: Shared): Member[] => [...shared.group, { role: roleOf(shared.answers), name: shared.name }];
export const boardFull = (shared: Shared) => linkMembers(shared).length >= MAX_BOARD;

export const shownName = (member: Member, self = false) => member.name || (self ? "আমি" : "বন্ধু");

/** "রাফি, মিম আর ২ জন": who is already on a shared board. */
export function whoText(members: readonly Member[]) {
  const named = members.map(member => member.name).filter(Boolean);
  if (!named.length) return members.length > 1 ? `${bn(members.length)} জন বন্ধু` : "তোমার বন্ধু";
  const rest = members.length - Math.min(named.length, 2);
  return rest > 0 ? `${named.slice(0, 2).join(", ")} আর ${bn(rest)} জন` : named.join(" আর ");
}

export function countLine(members: readonly Member[]) {
  return roles.map(role => [role, members.filter(member => member.role === role.id).length] as const)
    .filter(([, count]) => count > 0).map(([role, count]) => `${role.piece} ${bn(count)}`).join(" · ");
}

/** The human line for a group board, chosen from who is on it. First matching rule wins. */
export function groupLine(members: readonly Member[]) {
  const count = (id: RoleId) => members.filter(member => member.role === id).length;
  if (roles.every(role => count(role.id))) return "চার রকম গুটি, এক বোর্ড: পুরো ক্যারম সেট রেডি!";
  if (!count("queen")) return "বোর্ডের মাঝখানটা ফাঁকা! কুইন কে, বলো তো?";
  if (count("queen") > 1) return `${bn(count("queen"))} কুইন এক বোর্ডে, এই আড্ডা জমবেই।`;
  if (count("striker") > 1) return `${bn(count("striker"))}টা স্ট্রাইকার, প্ল্যানের অভাব হবে না।`;
  if (count("black") > 1) return `গোপন মজার মানুষ ${bn(count("black"))} জন, হাসি থামবে না।`;
  if (count("white") > 1) return `শোনার মানুষ ${bn(count("white"))} জন, কারও কথা মাটিতে পড়বে না।`;
  return `${bn(members.length)} জনের আড্ডা, বোর্ড জমে গেছে।`;
}

export type Slot = { member: Member; index: number; x: number; y: number; r: number };
export type Layout = { slots: Slot[]; emptyCentre: boolean };

/**
 * Where each person sits on the playing surface (0–1 on both axes, radius as a share of the side).
 * Alone: big, in the centre. A group: the first queen takes the centre (মধ্যমণি), everyone else sits
 * evenly round a ring. With no queen the centre stays empty and asks for one.
 */
export function layoutBoard(members: readonly Member[]): Layout {
  if (members.length === 1) return { slots: [{ member: members[0], index: 0, x: 0.5, y: 0.5, r: 0.13 }], emptyCentre: false };
  const centre = members.findIndex(member => member.role === "queen");
  const ring = members.map((member, index) => ({ member, index })).filter(({ index }) => index !== centre);
  const slots: Slot[] = ring.map(({ member, index }, step) => {
    const angle = -Math.PI / 2 + (step * 2 * Math.PI) / ring.length;
    return { member, index, x: 0.5 + Math.cos(angle) * 0.3, y: 0.5 + Math.sin(angle) * 0.3, r: 0.068 };
  });
  if (centre >= 0) slots.unshift({ member: members[centre], index: centre, x: 0.5, y: 0.5, r: 0.085 });
  return { slots, emptyCentre: centre < 0 };
}

export function caption(members: readonly Member[], mine: RoleId) {
  const role = roleById(mine);
  return members.length > 1
    ? `আমাদের আড্ডার ক্যারম বোর্ডে এখন ${bn(members.length)} জন, আমি ${role.piece}! তুমি কোন গুটি? খেলে বোর্ডে যোগ হও:`
    : `আড্ডায় আমি ${role.piece}, ${role.tag}! তুমি কোন গুটি? খেলে আমার বোর্ডে যোগ হও:`;
}

export function previewTitle(shared: Shared | null) {
  if (!shared) return "আড্ডায় তুমি কোন গুটি? কুইন, স্ট্রাইকার না গোপন মজার মানুষ";
  const members = linkMembers(shared);
  if (members.length > 1) return `${whoText(members)} এক বোর্ডে বসে গেছে — তুমি কোন গুটি?`;
  const role = roleById(roleOf(shared.answers));
  return shared.name ? `${shared.name} আড্ডার ${role.piece}! তুমি কোন গুটি?` : `আড্ডায় আমি ${role.piece}! তুমি কোন গুটি?`;
}

// Fixed ids only: the result piece, never a name or an answer.
export const tallyIds = roles.map(role => role.id);

