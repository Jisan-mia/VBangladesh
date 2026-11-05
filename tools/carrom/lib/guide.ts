// What each difficulty shows and does. The striker's size is fixed for a whole game (it never changes mid-strike).
import type { Hand } from "./game";

/** The aim snaps to a sure pot line within this many degrees. */
export const SNAP: Record<Hand, number> = { e: 2.5, n: 1, h: 0 };
/** Cushion bounces the striker's line follows. */
export const BOUNCES: Record<Hand, number> = { e: 1, n: 1, h: 0 };

export type GuideLook = {
  /** The striker's dotted line to its first touch, with the ghost striker there. */
  path: boolean;
  /** The touched coin's arrow: "short" (a fixed arrow) or "pocket" (all the way, gold when it drops). */
  coin: "none" | "short" | "pocket";
  /** সহজ also aims each new strike at the easiest pot from where the striker sits. */
  suggest: boolean;
};
export const LOOK: Record<Hand, GuideLook> = {
  e: { path: true, coin: "pocket", suggest: true },
  n: { path: true, coin: "short", suggest: false },
  h: { path: false, coin: "none", suggest: false },
};

export const HANDS: readonly Hand[] = ["e", "n", "h"];
export const HAND_NAME: Record<Hand, string> = { e: "সহজ", n: "মাঝারি", h: "ওস্তাদ" };
/** Each difficulty's promise, in the player's terms. */
export const HAND_LINE: Record<Hand, string> = {
  e: "বড় স্ট্রাইকার। গুটি কোন গর্তে যাবে, পুরোটা দেখায়।",
  n: "স্ট্রাইকার কোথায় লাগবে আর গুটি কোন দিকে যাবে, দেখায়।",
  h: "শুধু একটা ছোট তীর। বাকিটা তোমার হাত।",
};
