export const title = "পৃথিবী ঘুরি: screens, the plane, postcards, the stamp question, pause and the daily limit";
const trip = (v: any) => {
  if (v.screen === "title") return "The envelope (উড়াল দাও)";
  if (v.screen === "end") return "The end screen (আবার খেলো / শেষ)";
  if (v.phase === "map") return v.visited ? "The map, pick the next country" : "The map, pick a country";
  if (v.phase === "fly") return v.flight ? "The plane is about to land" : "The plane is flying";
  if (v.phase === "card") return v.card === 0 ? "Postcard 1 (হ্যালো)" : "Last postcard";
  if (v.answered) return v.visited === 2 ? "Last answer right, stars saved, ➜ waits" : "Right answer, the stamp lands, ➜ waits";
  return "The stamp question";
};
export const state = (v: any) => ({
  Trip: trip(v),
  Menu: v.paused ? "Pause menu open" : v.away ? "Window away, everything holds" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end screen" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string, from?: any) =>
  action === "ThePlaneFlies" ? null
  : action === "ThePageOpens" ? (from?.screen === "title" && !from?.resting ? null : "the page opens again")
  : ({
  YouStartATrip: "the child taps উড়াল দাও or আবার খেলো",
  YouTapAPin: "the child taps a country",
  ThePlaneLands: "the plane lands",
  ThePlaneFliesUnderTheMenu: "the plane flies on under the menu (old)",
  YouTapNextOnACard: "the child taps ➜ on a postcard",
  YouTapAWrongPicture: "the child taps a wrong picture",
  YouTapTheRightPicture: "the child taps the right picture",
  YouTapNext: "the child taps ➜",
  YouOpenThePauseMenu: "⏸, P or Esc",
  YouResume: "চালিয়ে যাও",
  WindowBlurs: "the window blurs or the tab hides",
  WindowFocuses: "the window comes back",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  TimeIsUp: "today's play time runs out",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string | null>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
