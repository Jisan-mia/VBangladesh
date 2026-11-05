import { clearLine, finaleLine, STAR_LINES } from "../lib/words";
export const CLEAR_TEXT = [...Array.from({ length: 40 }, (_, i) => clearLine(i + 1)), ...[10, 20, 30, 40].map(finaleLine), ...STAR_LINES];
