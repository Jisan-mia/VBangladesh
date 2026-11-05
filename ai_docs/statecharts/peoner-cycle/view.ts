export const title = "Peoner Cycle after the rewrite: ride, list, window, cheer, loop, link and card";
const game = (v: any) => ({ title: "At the title", story: "First-run story", riding: "Riding", paused: "Paused", over: "Stopped, end screen shows" } as any)[v.phase];
const routeName = (r: string) => r === "theirs" ? "the friend's route" : "another route";
export const state = (v: any) => ({
  Game: v.phase === "paused" && v.picker ? "Paused, the level list is open" : v.phase === "riding" && v.loop ? "Riding, the road loop plays" : game(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : v.inView ? "You're on the road" : "Road scrolled away",
});
const labels: Record<string, string> = {
  YouStart: "you press রওনা দাও",
  StoryEnds: "the story ends",
  FanfarePlays: "the chimes play",
  YouPause: "the menu opens (P or the pause button)",
  YouResume: "you press চালিয়ে যাও",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouScrollAway: "you scroll the road away",
  YouScrollBack: "you scroll back",
  YouOpenList: "you open সব লেভেল",
  YouCloseList: "you close সব লেভেল",
  YouPickRoute: "you pick a level",
  YouGoNextRoute: "you press পরের লেভেল",
  YouRideAgain: "you press আবার খেলো",
  FriendLinkOpens: "a friend's link opens",
};
export const step = (action: string, from: any, to: any) => {
  if (action === "YouFinish") return to.fanfare && !from.fanfare ? "you reach the place" : "the bike stops";
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "title" || v.phase === "story" ? "start" : "play";
export const colors = { start: "tan", play: "teal", held: "yellow", done: "blue" };
