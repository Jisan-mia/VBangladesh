export const title = "জ্যাম ছাড়াও: the jam, the pause, the window and your finger";
export const state = (v: any) => ({
  Jam: v.won ? "CNG is out, result shows" : (v.paused ? "Paused, " : "") + ["no moves yet", "one move made", "two moves made"][v.moves],
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Finger: v.drag ? "Dragging a car" : "Finger off",
});
const STEPS: Record<string, string | null> = {
  YouGrabACar: "you press on a car",
  YouDropIt: "you lift your finger",
  TheDragCancels: null,
  YouSlideACar: "you slide a car with the arrows or a hint",
  YouTakeBack: "you press ফিরিয়ে আনো",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ChimesPlay: null,
  YouStartAJam: "you start a jam",
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.won ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
