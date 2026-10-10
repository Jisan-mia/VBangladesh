import { possessive } from "../../../shared/bangla";

/*
 * GPA rules for the general education boards' SSC and HSC (checked 2026-10-10):
 * - Grade table and "Highest G.P.A. is 5.0": Board of Intermediate and Secondary Education, Dhaka, rules page
 *   http://www.educationboard.gov.bd/dhaka/rules_business.php and the boards' computer centre table
 *   http://www.educationboard.gov.bd/computer/grading_system.php (A+ 80–100 = 5, A 70–79 = 4, A- 60–69 = 3.5,
 *   B 50–59 = 3, C 40–49 = 2, D 33–39 = 1, F 0–32 = 0).
 * - 4th subject: only grade points above 2 are added; the total is divided by the compulsory subjects only and capped at 5.00.
 *   An F in the 4th subject does not fail the exam. Verified against the Dhaka board's published re-scrutiny results:
 *   HSC 2025 https://dhakaeducationboard.gov.bd/data/20251116123034975415.pdf (Higher Math F→C leaves the GPA unchanged,
 *   F→B adds 0.17 = 1/6, English C→A goes 4.83→5.00 so the cap applies) and
 *   SSC 2026 https://dhakaeducationboard.gov.bd/site/Sresc_result_final_ssc_2026.pdf (one grade point = 1/9 of the GPA).
 *   The 2-point deduction is also described in Prothom Alo: https://www.prothomalo.com/education/study/%E0%A6%8F%E0%A6%95-%E0%A6%B8%E0%A6%BF%E0%A6%A6%E0%A7%8D%E0%A6%A7%E0%A6%BE%E0%A6%A8%E0%A7%8D%E0%A6%A4%E0%A7%87%E0%A6%87-%E0%A6%95%E0%A6%AE%E0%A7%87%E0%A6%9B%E0%A7%87-%E0%A6%B2%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%A7%E0%A6%BF%E0%A6%95-%E0%A6%9C%E0%A6%BF%E0%A6%AA%E0%A6%BF%E0%A6%8F%E2%80%93%E0%A7%AB
 * - Two-paper subjects (Bangla, English, all HSC subjects) get one grade from both papers together, so they are one row here.
 * - Board GPAs are rounded to 2 decimals (4.1667 shows as 4.17 in the HSC 2025 list).
 */

export const MAX_NAME_LENGTH = 24;

export const grades = [
  { id: "AP", label: "A+", point: 5 },
  { id: "A", label: "A", point: 4 },
  { id: "AM", label: "A-", point: 3.5 },
  { id: "B", label: "B", point: 3 },
  { id: "C", label: "C", point: 2 },
  { id: "D", label: "D", point: 1 },
  { id: "F", label: "F", point: 0 },
] as const;

export const exams = [
  { id: "ssc", label: "এসএসসি" },
  { id: "hsc", label: "এইচএসসি" },
] as const;

export const groups = [
  { id: "sci", label: "বিজ্ঞান" },
  { id: "hum", label: "মানবিক" },
  { id: "bus", label: "ব্যবসায় শিক্ষা" },
] as const;

export type GradeId = (typeof grades)[number]["id"];
export type ExamId = (typeof exams)[number]["id"];
export type GroupId = (typeof groups)[number]["id"];
export type Subject = { name: string; hint?: string };
export type ThanksId = (typeof thanks)[number]["id"];

export type Result = {
  exam: ExamId;
  group: GroupId;
  /** One grade per compulsory subject, in subjectsFor(exam, group) order. */
  grades: GradeId[];
  fourth: GradeId;
  name: string;
  year: number | null;
  thanks: ThanksId | "";
};

// Compulsory (GPA) subjects. SSC counts 9 and HSC counts 6 in every group, matching the board divisors above.
const common: Record<ExamId, Subject[]> = {
  ssc: [{ name: "বাংলা", hint: "১ম + ২য় পত্র" }, { name: "ইংরেজি", hint: "১ম + ২য় পত্র" }, { name: "গণিত" }, { name: "ধর্ম ও নৈতিক শিক্ষা" }, { name: "তথ্য ও যোগাযোগ প্রযুক্তি" }],
  hsc: [{ name: "বাংলা", hint: "১ম + ২য় পত্র" }, { name: "ইংরেজি", hint: "১ম + ২য় পত্র" }, { name: "তথ্য ও যোগাযোগ প্রযুক্তি" }],
};

const groupSubjects: Record<ExamId, Record<GroupId, Subject[]>> = {
  ssc: {
    sci: [{ name: "বাংলাদেশ ও বিশ্বপরিচয়" }, { name: "পদার্থবিজ্ঞান" }, { name: "রসায়ন" }, { name: "জীববিজ্ঞান", hint: "বা উচ্চতর গণিত, যেটা ৪র্থ না" }],
    hum: [{ name: "বিজ্ঞান" }, { name: "ভূগোল ও পরিবেশ" }, { name: "পৌরনীতি ও নাগরিকতা" }, { name: "ইতিহাস ও বিশ্বসভ্যতা", hint: "বা অর্থনীতি" }],
    bus: [{ name: "বিজ্ঞান" }, { name: "হিসাববিজ্ঞান" }, { name: "ফিন্যান্স ও ব্যাংকিং" }, { name: "ব্যবসায় উদ্যোগ" }],
  },
  hsc: {
    sci: [{ name: "পদার্থবিজ্ঞান", hint: "১ম + ২য় পত্র" }, { name: "রসায়ন", hint: "১ম + ২য় পত্র" }, { name: "জীববিজ্ঞান", hint: "বা উচ্চতর গণিত, যেটা ৪র্থ না" }],
    hum: [{ name: "বিভাগের ১ম বিষয়", hint: "যেমন অর্থনীতি" }, { name: "বিভাগের ২য় বিষয়", hint: "যেমন পৌরনীতি ও সুশাসন" }, { name: "বিভাগের ৩য় বিষয়", hint: "যেমন ইতিহাস, সমাজকর্ম, যুক্তিবিদ্যা" }],
    bus: [{ name: "হিসাববিজ্ঞান", hint: "১ম + ২য় পত্র" }, { name: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা" }, { name: "ফিন্যান্স, ব্যাংকিং ও বিমা", hint: "বা উৎপাদন ব্যবস্থাপনা ও বিপণন" }],
  },
};

const fourthHints: Record<ExamId, Record<GroupId, string>> = {
  ssc: { sci: "যেমন উচ্চতর গণিত বা কৃষিশিক্ষা", hum: "যেমন কৃষিশিক্ষা বা গার্হস্থ্য বিজ্ঞান", bus: "যেমন কৃষিশিক্ষা বা গার্হস্থ্য বিজ্ঞান" },
  hsc: { sci: "যেমন উচ্চতর গণিত বা জীববিজ্ঞান", hum: "যেমন ভূগোল, মনোবিজ্ঞান বা অর্থনীতি", bus: "যেমন উৎপাদন ব্যবস্থাপনা ও বিপণন বা পরিসংখ্যান" },
};

export const thanks = [
  { id: "parents", label: "ধন্যবাদ আম্মু-আব্বু" },
  { id: "teachers", label: "ধন্যবাদ স্যার-ম্যাডাম" },
  { id: "dua", label: "সবাই দোয়া রেখো" },
] as const;

export const subjectsFor = (exam: ExamId, group: GroupId) => [...common[exam], ...groupSubjects[exam][group]];
export const fourthHint = (exam: ExamId, group: GroupId) => fourthHints[exam][group];
export const examLabel = (exam: ExamId) => exams.find(item => item.id === exam)!.label;
export const groupLabel = (group: GroupId) => groups.find(item => item.id === group)!.label;
export const gradeLabel = (id: GradeId) => grades.find(grade => grade.id === id)!.label;
const point = (id: GradeId) => grades.find(grade => grade.id === id)!.point;

const isIn = <T extends string>(list: readonly { id: T }[], id: string): id is T => list.some(item => item.id === id);
const round2 = (value: number) => Math.round(value * 100 + 1e-9) / 100;

export function defaultResult(exam: ExamId = "hsc", group: GroupId = "sci", year: number | null = null): Result {
  return { exam, group, grades: subjectsFor(exam, group).map(() => "AP"), fourth: "AP", name: "", year, thanks: "" };
}

/** Switching exam or group keeps the grades already tapped for the rows that still line up. */
export function switchTrack(result: Result, exam: ExamId, group: GroupId): Result {
  const next = subjectsFor(exam, group).map((_, index) => result.grades[index] ?? "AP");
  return { ...result, exam, group, grades: next };
}

/** bonus is what the 4th subject actually adds to the GPA, after the 5.00 cap. */
export type Score = { failed: boolean; gpa: number; without: number; bonus: number };

export function score(result: Result): Score {
  const count = subjectsFor(result.exam, result.group).length;
  const failed = result.grades.length !== count || result.grades.includes("F");
  const base = result.grades.reduce((total, id) => total + point(id), 0);
  const bonus = Math.max(0, point(result.fourth) - 2);
  if (failed) return { failed, gpa: 0, without: 0, bonus: 0 };
  const gpa = Math.min(5, round2((base + bonus) / count)), without = round2(base / count);
  return { failed, gpa, without, bonus: round2(gpa - without) };
}

const decimals = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plain = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bnGpa = (value: number) => decimals.format(value);
export const bn = (value: number) => plain.format(value);

/** The warm line under the number; never a judgement. */
export function humanLine(value: Score) {
  if (value.failed) return "এবার হয়নি। আবার হবে।";
  if (value.gpa >= 5) return "সব রাত জাগার দাম আজ মিলল।";
  if (value.gpa >= 4) return "দারুণ! পরের ধাপে আরও ভালো হবে।";
  return "নম্বর একটা সংখ্যা। তুমি তার চেয়ে অনেক বড়।";
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function resultHash(result: Result) {
  const params = new URLSearchParams({ e: result.exam, g: result.group, r: result.grades.join(","), f: result.fourth });
  const name = cleanName(result.name);
  if (name) params.set("n", name);
  if (result.year) params.set("y", String(result.year));
  if (result.thanks) params.set("t", result.thanks);
  return params.toString();
}

export function parseResult(hash: string): Result | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const exam = params.get("e") ?? "", group = params.get("g") ?? "", fourth = params.get("f") ?? "";
  if (!isIn(exams, exam) || !isIn(groups, group) || !isIn(grades, fourth)) return null;
  const picked = (params.get("r") ?? "").split(",");
  if (picked.length !== subjectsFor(exam, group).length || !picked.every(id => isIn(grades, id))) return null;
  const year = Number(params.get("y"));
  const thanksId = params.get("t") ?? "";
  return {
    exam, group, fourth,
    grades: picked as GradeId[],
    name: cleanName(params.get("n") ?? ""),
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null,
    thanks: isIn(thanks, thanksId) ? thanksId : "",
  };
}

/** "রাফি · এইচএসসি ২০২৬ · বিজ্ঞান" — the chit's top line. */
export function chitHeading(result: Result) {
  return [examLabel(result.exam) + (result.year ? ` ${bn(result.year)}` : ""), groupLabel(result.group)].join(" · ");
}

export function previewTitle(result: Result) {
  const value = score(result);
  const who = result.name ? possessive(result.name) : "বন্ধুর";
  if (value.failed) return `${result.name || "বন্ধু"} বলছে: পরের বার দেখিয়ে দেব`;
  return `${who} জিপিএ ${bnGpa(value.gpa)} — তোমারটা হিসাব করো`;
}

export { possessive };
