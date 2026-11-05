export const title = "পিয়নের সাইকেল: ride, window, route list, cheer, link and card";
const game = (v: any) => ({ ready: "Waiting at the start", playing: "Riding", paused: "Paused", over: "Bumped, result shows" } as any)[v.phase];
const routeName = (r: string) => r === "theirs" ? "the friend's route" : "another route";
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : v.inView ? "You're on the road" : "Road scrolled away",
  Routes: v.picker ? "সব রুট open" : "সব রুট closed",
  Cheer: v.fanfare ? "Chimes still to come" : "No chimes waiting",
  Route: v.link === "none" ? "No friend's link" : (v.phase === "playing" || v.phase === "paused") && v.lvl !== v.rode ? "Label says the friend's route, you ride another" : `On ${routeName(v.lvl)}`,
  Card: v.card === "none" ? "No result card" : v.link === "friend" ? `Card compares with the friend (${v.card === "theirs" ? "same road" : "a different road"})` : "Card, no comparison",
});
const labels: Record<string, string> = {
  YouStart: "you tap the road or a lane button",
  FanfarePlays: "the chimes play",
  YouPause: "you press থামাও",
  YouResume: "you press চালিয়ে যাও",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouScrollAway: "you scroll the road away",
  YouScrollBack: "you scroll back",
  YouOpenRoutes: "you open সব রুট",
  YouCloseRoutes: "you close সব রুট",
  YouPickRoute: "you pick a route",
  YouGoNextRoute: "you press পরের রুট",
  YouRideAgain: "you press আবার খেলো",
  YouPlayFromCard: "you press আরেকবার খেলো on the card",
  FriendLinkOpens: "a friend's link opens",
};
export const step = (action: string, from: any, to: any) => {
  if (action === "YouBump") return to.fanfare && !from.fanfare ? "you bump past a star mark" : from.fanfare ? "you bump" : "you bump before the goal";
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
