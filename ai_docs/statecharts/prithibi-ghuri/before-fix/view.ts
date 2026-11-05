export const title = "পৃথিবী ঘুরি: a trip, its postcards, the daily limit and the parent gate";
const trip = (v: any) => ({
  map: "Map: pick a country",
  fly: "Plane flying",
  visit: v.card === 0 ? "Postcard 1 (হ্যালো)" : "Last postcard",
  ask: "Stamp question",
  solved: "Right picture, stamp in 0.7 s",
  stamp: "Stamp page (সফর শেষ)",
  done: "Done screen (আবার খেলো / শেষ)",
  idle: "আজকের মতো হলো",
  adultPage: "Left for আমার ছোটবেলা (a grown-up's tool)",
} as any)[v.phase];
export const state = (v: any) => ({
  Trip: trip(v),
  Key: v.held ? (v.skipped ? "Enter held, a postcard flipped past unseen" : "Enter held") : v.skipped ? "A postcard was skipped" : "Keys up",
  Today: (v.resting ? "Rest screen (আজ এটুকুই)" : v.overLimit ? "Today's time is up" : "Time left today")
    + (v.begun === "late" && !["done", "idle", "adultPage"].includes(v.phase) ? ", and this trip started after it ran out" : ""),
  Gate: v.gate === "closed" ? "Gate closed" : v.gate === "parent" ? "Gate left open by a parent" : "Gate opened by the child",
});
// Hidden: the trip-number grid mid-trip (it resets from every state), and the reload and the flagship card from every
// state but the map and the আমার ছোটবেলা page (and the rest screen, for the reload), where the bug paths use them.
export const step = (action: string, from?: any) =>
  action === "YouPickATrip" ? (["map", "done", "idle"].includes(from?.phase) ? "you tap a trip number" : null)
  : action === "ThePageOpens" ? (["map", "adultPage"].includes(from?.phase) || from?.resting ? "you reload the page or come back to it" : null)
  : action === "YouTapTheFlagshipCard" ? (from?.phase === "map" ? "you tap the আমার ছোটবেলা card under the game" : null)
  : ({
  YouTapACountry: "you tap a country",
  ThePlaneLands: "the plane lands",
  YouPressNext: "you tap পরেরটা",
  YouHoldEnterOnNext: "you hold Enter on পরেরটা",
  TheKeyRepeats: "the held key repeats",
  YouLetGo: "you let go",
  YouTapTheRightPicture: "you tap the right picture",
  TheStampComes: "the stamp comes",
  YouFinishTheTrip: "you tap সফর শেষ",
  YouPlayAgain: "you tap আবার খেলো",
  YouPressShesh: "you tap শেষ",
  YouPickATrip: "you tap a trip number",
  TimeIsUp: "today's time runs out",
  AParentGivesTenMinutes: "a parent gives ১০ more minutes",
  AParentUsesTheGate: "a parent opens বড়দের জন্য and hands the phone back untouched",
  TheChildMashesTheGate: "the child keeps holding বড়দের জন্য and mashing the pad",
  SomeoneClosesTheGate: "the gate closes (বন্ধ করো, 60 s, or the tab hides)",
  YouTapTheFlagshipCard: "you tap the আমার ছোটবেলা card under the game",
} as Record<string, string | null>)[action] ?? action;
export const group = (v: any) => v.phase === "adultPage" ? "out" : v.resting ? "held" : ["done", "idle"].includes(v.phase) ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", out: "orange" };
