export const title = "Golper mor (story turns): pause menu and window focus";
export const state = (v: any) => ({
  Child: v.where === "shelf" ? "On the shelf" : v.where === "read" ? "Reading a story" : "End page",
  Book: v.paused ? "Player menu open" : v.away ? (v.swallow ? "Away, the next tap only wakes the book" : "Away") : v.swallow ? "Next tap only wakes the book" : "Awake",
});
const labels: Record<string, string> = {
  YouOpenAStory: "you open a story", YouTapTheBook: "you tap the book (a page, a path or গল্প শেষ; ignored while away)",
  YouGoToTheShelf: "you go to the shelf", PlayerPauses: "the player's menu opens", PlayerResumes: "you press চালিয়ে যাও",
  WindowBlurs: "you click away or hide the tab", WindowFocuses: "you come back to the window",
};
export const step = (action: string) => action === "TheMoveIsSeen" ? null : labels[action] ?? action;
export const group = (v: any) => v.where === "read" ? "play" : "done";
export const colors = { play: "teal", done: "blue" };
