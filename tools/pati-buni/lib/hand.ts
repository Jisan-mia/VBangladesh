// Everything a player can be holding: a key, one of the four buttons, a finger on the frame. Pure, so the statechart's
// input rule replays in node: blur, a hidden tab, the frame scrolled off, a pause and every choice screen call letGo().
export type Hand = {
  keyDir: number; btnDir: number; das: number;
  softKey: boolean; softBtn: boolean; softAt: number; softStrip: number; softTouch: boolean;
  touch: number; startX: number; startY: number; startAt: number; cols: number; dragged: boolean; down: boolean;
};

export const makeHand = (): Hand => ({ keyDir: 0, btnDir: 0, das: 0, softKey: false, softBtn: false, softAt: 0, softStrip: -1, softTouch: false,
  touch: -1, startX: 0, startY: 0, startAt: 0, cols: 0, dragged: false, down: false });

export function letGo(hand: Hand) {
  hand.keyDir = 0; hand.btnDir = 0; hand.softKey = false; hand.softBtn = false; hand.softTouch = false;
  hand.touch = -1; hand.dragged = false; hand.down = false;
}

/** The strip falls fast while any of these is held. */
export const fastFall = (hand: Hand) => hand.softKey || hand.softBtn || hand.softTouch;
/** The way a held arrow or button slides the strip (−1, 0, 1). */
export const slideDir = (hand: Hand) => hand.keyDir || hand.btnDir;
/** Nothing is held. */
export const empty = (hand: Hand) => !slideDir(hand) && !fastFall(hand) && hand.touch === -1;
