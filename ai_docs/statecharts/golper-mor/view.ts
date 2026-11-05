export const title = "Golper mor (story turns): reading, read marks across tabs, daily limit, pause and gates";
const path = (s: number) => (s === 0 ? "path ১" : "path ২");
const covered = (v: any) => v.resting && v.view === "shelf";
const page = (v: any) => {
  if (covered(v)) return "Rest screen over the shelf";
  const late = v.late ? " after today's time is up" : "";
  if (v.view === "shelf") return v.stage === "open" ? "Shelf, বড়দের জন্য open" : "Shelf";
  if (v.view === "reading") return "Reading up to the মোড়" + late;
  if (v.view === "path") return `Reading ${path(v.side)}` + late;
  if (v.show) return "আব্বু-আম্মুকে দেখাও";
  return v.resting ? "End page, today's time is up (only শেষ)" : "End page";
};
const marks = (set: number[]) => set.length === 2 ? "both paths" : set.length === 1 ? path(set[0]) : "nothing";
export const state = (v: any) => {
  const finished = new Set<number>([...v.mem, ...(v.other ? [1] : [])]);
  const lost = [...finished].some(s => !v.saved.includes(s));
  return {
    Story: page(v),
    Marks: (lost ? "A path you read lost its mark. " : "") + "Saved: " + marks(v.saved),
    Book: v.paused ? "Player menu open" : v.away ? (v.swallow ? "Away, the next tap only wakes the book" : "Away") : v.swallow ? "Next tap only wakes the book" : "Awake",
    Today: v.due ? "Today's time is up" : "Time left today",
  };
};
const labels: Record<string, string> = {
  YouOpenTheStory: "you open a story or press আবার পড়ো",
  YouOpenItPastTheLimit: "you open a story, but today's time is up",
  YouChooseAPath: "you pick a path at the মোড়",
  YouGoBackToTheTurn: "you press ← on the first picture of a path",
  YouFinishTheStory: "you press গল্প শেষ (the mark is saved now)",
  YouTryTheOtherPath: "you press অন্যটা",
  YouGoToTheShelf: "you press the shelf, শেষ or সব লেভেল",
  AnotherTabFinishesPathOne: "in another tab you finish path ২",
  YouReload: "you open or reload the page",
  TodaysTimeRunsOut: "today's time runs out",
  TheShelfNoticesTheTime: "the shelf's one-second check sees the time is up",
  AGrownUpGivesTenMore: "a grown-up gives ১০ more minutes",
  PlayerPauses: "the player's menu opens",
  PlayerResumes: "you press চালিয়ে যাও",
  WindowBlurs: "you click away or hide the tab",
  WindowFocuses: "you come back to the window",
  YouTapToWakeTheBook: "your first tap back only wakes the book",
  AGrownUpOpensTheShelfGate: "a grown-up opens বড়দের জন্য",
  YouCloseTheGate: "you press বন্ধ করো",
  YouShowAGrownUp: "you press আব্বু-আম্মুকে দেখাও",
  YouCloseShowParent: "you press দেখানো শেষ",
};
// Hidden: reloads that land on the shelf with time left, and a blur or a pause on the shelf, which change nothing there.
export const step = (action: string, from: any, to: any) => {
  if (action === "YouReload" && !to.resting) return null;
  if (["PlayerPauses", "PlayerResumes", "WindowBlurs", "WindowFocuses"].includes(action) && from.view === "shelf" && to.view === "shelf") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => covered(v) ? "rest" : v.view === "end" || v.view === "shelf" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
