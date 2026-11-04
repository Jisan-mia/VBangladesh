export const title = "Bhimruler Chak (after the rewrite): the orchard, what holds it, your finger, the hornets";
// Regions as the player sees them: the orchard, the window and menu, the finger on a bush, the hornets' hum.
export const state = (v: any) => ({
  Orchard: v.screen === "title" ? (v.linked ? "Friend's orchard on the start card" : "Start card")
    : v.screen === "over" ? (v.won ? "Orchard cleared, stars show" : "The swarm: round over")
    : v.sheet ? "সব লেভেল open, orchard held"
    : v.stings ? "Playing, the hornets are awake" : "Playing, clock running",
  Window: v.away ? "You're away, menu up" : v.menu ? "Pause menu" : v.guard ? "Just came back (the next tap only wakes)" : "You're on the page",
  Finger: v.hold ? "Finger held on a bush" : "Hands off",
  Hum: v.hum === "real" ? "Hornets humming" : v.sound ? "Quiet" : "Sound off",
});
// Merged: every way to a fresh start card (নতুন করে শুরু, a picked level, choice ১, a friend's link) is "you start a new orchard".
export const step = (action: string) => ({
  YouEnter: "you press বাগানে ঢোকো",
  YouClearABush: "you clear a bush or tie a গামছা",
  YouStepOnANest: "you tap a nest",
  YouClearTheLastBush: "you clear the last safe bush",
  YouPressAndHold: "you press and hold a bush",
  YouLiftYourFinger: "you lift your finger",
  TheLongPressFires: "the long press runs out",
  YouLeave: "you click away or hide the tab",
  YouComeBack: "you come back",
  YouOpenTheMenu: "you press ⏸ or P",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you start a new orchard",
  GuardPasses: "a moment passes",
  ResultGuardPasses: "a moment passes",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  YouPickALevel: "you start a new orchard",
  YouGoOn: "you start a new orchard",
  FriendLinkOpens: "you open a friend's link",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  ChimesPlay: "the star chimes play",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.away || v.menu || v.sheet ? "held" : v.screen === "title" ? "start" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", start: "purple" };
