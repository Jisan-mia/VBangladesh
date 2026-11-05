export const title = "বড়দের জন্য: the kids' kit parent gate";
export const state = (v: any) => ({
  Gate: v.stage === "closed" ? "Button: চেপে ধরো" : v.stage === "ask" ? "Sum in words, number pad" : v.opener === "child" ? "Open, a child got in" : "Open for a grown-up",
  Hands: v.down === 0 ? "No finger down" : v.down === 1 ? "One finger or key down" : "Two fingers down",
  Timer: v.armed ? "2 s timer running" : "No timer",
  Tries: v.stage === "ask" ? (v.misses ? "One wrong answer" : "No wrong answer yet") : "—",
  Link: v.shared ? (v.opener === "child" ? "A child shared the link" : "Link shared") : "Not shared",
});
export const step = (action: string) => ({
  AFingerGoesDown: "a finger or key goes down on the button",
  TheKeyRepeats: "the held key repeats",
  AFingerLifts: "a finger or key comes up",
  TwoSecondsPass: "two seconds pass",
  AGrownUpAnswers: "a grown-up taps the sum",
  AChildTapsTwoDigits: "a child taps two digits at random",
  SomeoneSharesTheLink: "someone taps খেলাটার লিংক পাঠাও",
  TheGateCloses: "থাক or বন্ধ করো",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.stage === "closed" ? "shut" : v.stage === "ask" ? "ask" : "open";
export const colors = { shut: "teal", ask: "yellow", open: "orange" };
