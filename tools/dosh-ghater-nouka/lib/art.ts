// One নৌকা drawing (viewBox 0 0 100 60) shared by the page's SVG and the card's canvas, so both look the same.
export const BOAT = {
  hull: "M2 26 Q12 36 50 38 Q88 36 98 26 Q92 52 50 54 Q8 52 2 26Z",
  roof: "M32 37 Q32 16 50 16 Q68 16 68 37Z",
  pole: "M80 36 L80 6",
  flag: "M80 6 L95 11 L80 16Z",
} as const;

export const BOATS = [
  { hull: "#b5562b", roof: "#e9b949", flag: "#e63946" },
  { hull: "#2f5d8a", roof: "#c9a66b", flag: "#2a9d8f" },
] as const;

export function drawBoat(c: CanvasRenderingContext2D, cx: number, bottom: number, width: number, player: 0 | 1) {
  const scale = width / 100, colors = BOATS[player];
  c.save();
  c.translate(cx - width / 2, bottom - 56 * scale);
  c.scale(scale, scale);
  c.fillStyle = colors.roof; c.fill(new Path2D(BOAT.roof));
  c.fillStyle = colors.hull; c.fill(new Path2D(BOAT.hull));
  c.strokeStyle = "#5b4636"; c.lineWidth = 2.5; c.stroke(new Path2D(BOAT.pole));
  c.fillStyle = colors.flag; c.fill(new Path2D(BOAT.flag));
  c.restore();
}
