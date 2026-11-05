export const title = "Nodi Par after the rewrite: the crossing, the list, the window and a link";
const game = (v: any) => v.picking ? (v.phase === "paused" ? "সব নদী open, crossing paused" : "সব নদী open")
  : ({ title: "Title (লাফ দাও)", story: "The story (first run)", playing: v.touch ? "Crossing, a finger on the river" : "Crossing (water sound on)", paused: "Paused", over: "Card shows: across, bell rings" } as any)[v.phase];
const link = (v: any) => v.link === "none" ? "No friend's link" : v.link === "other" ? "Friend's link, another river picked" : "Friend's river";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Link: link(v),
});
export const step = (action: string, _from: any, to: any) => ({
  YouStart: "you press লাফ দাও",
  YouFinishTheStory: "you finish the story",
  YouTouchTheRiver: "your finger goes down on the river",
  YouLiftYourFinger: "your finger lifts or swipes (a hop)",
  YouTapWhilePaused: "you tap the river while paused",
  YouReachTheGhat: "you reach the far ghat",
  CheerFires: "the cheer timer fires",
  YouPause: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouOpenRivers: "you open সব নদী",
  YouCloseRivers: "you close সব নদী",
  YouPickARiver: "you pick a river",
  YouPlayAgain: "you press আবার খেলো",
  YouGoOn: "you press পরের নদী",
  YouRestart: "you press নতুন করে শুরু",
  FriendLinkOpens: "a friend's link opens",
  YouHoldSpace: "you hold Space for a hop",
  SpaceRepeats: "Space, still held, repeats on the card",
  YouLetGoOfSpace: "you let go of Space",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? (to ? action : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.picking ? "held" : v.phase === "title" || v.phase === "story" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
