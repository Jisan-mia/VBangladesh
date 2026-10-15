// Our own fish and mango outlines as SVG path data, so the pond on screen and the parent's card draw the same shapes.
// Fish: viewBox 0 0 100 64, facing right. Mango: viewBox 0 0 64 64.
export const FISH_BODY = "M8 32C22 8 62 6 80 32C62 58 22 56 8 32Z";
export const FISH_TAIL = "M76 32L96 14Q90 32 96 50Z";
export const FISH_FIN = "M38 18Q48 6 58 16Z";
export const FISH_EYE = { x: 24, y: 28, r: 5 };
export const MANGO_BODY = "M34 8C52 8 58 30 52 44C46 58 26 60 16 50C6 40 12 24 22 16C26 12 30 8 34 8Z";
export const MANGO_LEAF = "M34 10C38 2 48 0 54 4C48 10 42 12 34 10Z";

/** Pond fish colours (body, belly line): পুঁটির কমলা, রুপালি, লাল, সোনালি. */
export const FISH_TINTS = [["#f28c38", "#c45f12"], ["#9fb6c4", "#5c7b8f"], ["#e2574c", "#a3322a"], ["#f2c230", "#b88a0c"]] as const;
