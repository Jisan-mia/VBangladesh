import type { SportId } from "./seal";

// Shapes shared by the on-page envelope (SVG) and the card (canvas Path2D), all in a 100×100 box.

/** The lac seal's lumpy wax edge: a circle with a few uneven drips, smoothed through midpoints. Fixed, so every seal matches. */
export const sealBlob = (() => {
  const points = Array.from({ length: 22 }, (_, index) => {
    const angle = (index / 22) * Math.PI * 2;
    const radius = 44 + 2.6 * Math.sin(angle * 5 + 0.6) + 1.6 * Math.sin(angle * 9 + 2.1);
    return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];
  });
  const mid = (index: number) => {
    const [x1, y1] = points[index % points.length];
    const [x2, y2] = points[(index + 1) % points.length];
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  };
  const fmt = (value: number) => value.toFixed(1);
  let path = `M${mid(0).map(fmt).join(" ")}`;
  for (let index = 1; index <= points.length; index++) {
    const [cx, cy] = points[index % points.length];
    path += `Q${fmt(cx)} ${fmt(cy)} ${mid(index).map(fmt).join(" ")}`;
  }
  return path + "Z";
})();

/** The pressed mark: a cricket ball with its seam, or a football's centre panel. No crests or logos. */
export const sealMark: Record<SportId, string> = {
  c: "M50 31a19 19 0 1 0 .01 0ZM42 33c4.5 6 4.5 28 0 34M58 33c-4.5 6-4.5 28 0 34M44 39h3m-3 7h4m-4 8h4m-3 7h3M56 39h-3m3 7h-4m4 8h-4m3 7h-3",
  f: (() => {
    const corner = (index: number, radius: number) => {
      const angle = (-90 + index * 72) * (Math.PI / 180);
      return `${(50 + radius * Math.cos(angle)).toFixed(1)} ${(50 + radius * Math.sin(angle)).toFixed(1)}`;
    };
    const pentagon = [0, 1, 2, 3, 4].map((index, order) => `${order ? "L" : "M"}${corner(index, 7.5)}`).join("") + "Z";
    const spokes = [0, 1, 2, 3, 4].map(index => `M${corner(index, 7.5)}L${corner(index, 19)}`).join("");
    return `M50 31a19 19 0 1 0 .01 0Z${pentagon}${spokes}`;
  })(),
};
