export const title = "ভাংতি নাই!: the shop day, the window and the clock";
const shop = (v: any) => {
  if (v.phase === "ready") return "Shop not open yet";
  if (v.phase === "over") return "Card shows";
  if (v.phase === "paused") return v.linger ? "Paused, a customer is leaving" : "Paused";
  return v.linger ? "Customer leaving" : "Customer waits for change";
};
export const state = (v: any) => ({
  Shop: shop(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "You're at the counter" : "Counter scrolled away",
  Clock: v.relaxed ? "No clock (সময় নিয়ে)" : "Clock on",
});
const STEPS: Record<string, string | null> = {
  YouOpenShop: "you tap শুরু করো",
  YouGiveRightChange: "you hand over the right change",
  ClockRunsOut: "the customer's time runs out",
  NextCustomerStepsUp: "the next customer steps up",
  ShopCloses: "the shop closes and the card shows",
  FanfareFires: null,
  YouPause: "you press pause",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the counter away",
  ScrollBack: "you scroll the counter back",
  YouSwitchTheClock: null,
  PlayAgain: "you press আবার খেলো",
  YouPickADay: null,
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
