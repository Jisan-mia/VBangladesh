export const title = "Golper mor (story turns): reading, read marks across tabs, daily limit and gates";
const turn = (s: number) => (s === 0 ? "turn ১" : "turn ২");
const page = (v: any) => {
  const late = v.late ? " after today's time is up" : "";
  if (v.resting) return v.view === "end" ? "Rest screen after a story" : "Rest screen as the shelf opens";
  if (v.view === "shelf") return v.stage === "open" ? "Shelf, বড়দের জন্য open" : "Shelf";
  if (v.view === "reading") return "Reading up to the মোড়" + late;
  if (v.view === "path") return `Reading ${turn(v.side)}` + late;
  return v.show ? "আব্বু-আম্মুকে দেখাও" : "End page";
};
const marks = (set: number[]) => set.length === 2 ? "both turns" : set.length === 1 ? turn(set[0]) : "nothing";
export const state = (v: any) => {
  const finished = new Set<number>([...v.mem, ...(v.other ? [1] : [])]);
  const lost = [...finished].some(s => !v.saved.includes(s));
  return {
    Story: page(v),
    Marks: (lost ? "A turn you read lost its mark. " : "") + "Saved: " + marks(v.saved) + (marks(v.mem) === marks(v.saved) ? "" : `, this tab shows ${marks(v.mem)}`),
    Today: v.due ? "Today's time is up" : "Time left today",
  };
};
const labels: Record<string, string> = {
  YouOpenTheStory: "you open the story or press আবার পড়ো",
  YouChooseATurn: "you pick a turn at the মোড়",
  YouFinishTheStory: "you press গল্প শেষ",
  YouTryTheOtherTurn: "you press অন্যটা বেছে দেখো",
  YouGoToTheShelf: "you press ← সব গল্প or শেষ",
  AnotherTabFinishesTurnOne: "in another tab you finish turn ২",
  YouReload: "you open or reload the page",
  TodaysTimeRunsOut: "today's time runs out",
  AGrownUpGivesTenMore: "a grown-up gives ১০ more minutes",
  AGrownUpOpensTheShelfGate: "a grown-up opens বড়দের জন্য",
  YouCloseTheGate: "you press বন্ধ করো",
  YouShowAGrownUp: "you press আব্বু-আম্মুকে দেখাও",
  YouCloseShowParent: "you press দেখানো শেষ",
};
// Hidden: reloads that land on the shelf with time left (back to the shelf from every page).
export const step = (action: string, from: any, to: any) => action === "YouReload" && !to.resting ? null : labels[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.view === "end" || v.view === "shelf" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
