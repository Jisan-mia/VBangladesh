import assert from "node:assert/strict";
import test from "node:test";
import { borderPositions, defaultSettings, densities, motifExtent, patternRings, printLayout, radialPositions, symmetries } from "../lib/pattern";

test("radial copies lie on the requested circle and leave no duplicated closing point", () => {
  const points = radialPositions(12, 187, -90);
  assert.ok(points.every(point => Math.abs(Math.hypot(point.x, point.y) - 187) < 0.001)
    && new Set(points.map(point => point.x.toFixed(6) + "," + point.y.toFixed(6))).size === 12);
});

test("each outward motif points along its radius", () => {
  assert.ok(radialPositions(8, 120, -90).every(point => {
    const angle = (point.rotation - 90) * Math.PI / 180;
    return Math.abs(point.x - Math.cos(angle) * 120) < 0.001 && Math.abs(point.y - Math.sin(angle) * 120) < 0.001;
  }));
});

test("invalid counts and radii cannot create a broken SVG", () => {
  for (const [count, radius] of [[0, 10], [2.5, 10], [145, 10], [8, -1], [8, Infinity]]) {
    assert.throws(() => radialPositions(count, radius), RangeError);
  }
});

test("every density preserves the selected rotational symmetry", () => {
  assert.ok(symmetries.every(symmetry => densities.every(density =>
    patternRings({ symmetry, density: density.id }).every(ring => ring.count % symmetry === 0))));
});

test("all radial motifs stay inside the outer boundary at every allowed density", () => {
  assert.ok(symmetries.every(symmetry => densities.every(density =>
    patternRings({ symmetry, density: density.id }).every(ring => ring.radius + motifExtent * ring.size / 62 < 341))));
});

test("denser patterns add motif copies instead of merely changing their labels", () => {
  const totals = densities.map(density => patternRings({ ...defaultSettings, density: density.id }).reduce((sum, ring) => sum + ring.count, 0));
  assert.ok(totals[0] < totals[1] && totals[1] < totals[2]);
});

test("square-border positions repeat under a quarter turn", () => {
  assert.ok(symmetries.every(symmetry => {
    const positions = borderPositions(symmetry);
    const quarter = positions.length / 4;
    return positions.every((position, index) => {
      const rotated = positions[(index + quarter) % positions.length];
      return Math.abs(rotated.x - (800 - position.y)) < 0.001 && Math.abs(rotated.y - position.x) < 0.001;
    });
  }));
});

test("border motifs have room around all four canvas edges", () => {
  const extent = motifExtent * 0.76;
  assert.ok(symmetries.every(symmetry => borderPositions(symmetry).every(position =>
    position.x - extent > 0 && position.y - extent > 0 && position.x + extent < 800 && position.y + extent < 800)));
});

test("the 180 mm artwork fits within the declared A4 print margins", () => {
  assert.ok(printLayout.artworkMm <= printLayout.pageWidthMm - 2 * printLayout.marginMm
    && printLayout.artworkMm + 75 <= printLayout.pageHeightMm - 2 * printLayout.marginMm
    && printLayout.calibrationMm === 50);
});

test("unsupported settings are rejected instead of rendering a different density", () => {
  assert.throws(() => patternRings({ symmetry: 7 as 8, density: "full" }), RangeError);
});

test("radial and border coordinates use at most three decimal places without negative zero", () => {
  const positions = [
    ...radialPositions(7, 329, -90.123456),
    ...symmetries.flatMap(symmetry => [
      ...radialPositions(symmetry * 6, 365, -90),
      ...radialPositions(symmetry * 3, 329, -90),
      ...borderPositions(symmetry),
      ...densities.flatMap(density => patternRings({ symmetry, density: density.id })
        .flatMap(ring => radialPositions(ring.count, ring.radius, ring.phase))),
    ]),
  ];
  assert.ok(positions.every(position => Object.values(position).every(value =>
    /^-?\d+(?:\.\d{1,3})?$/.test(String(value)) && !Object.is(value, -0))));
});

test("the known hydration mismatch is serialized as a stable three-decimal coordinate", () => {
  assert.equal(radialPositions(24, 329, -90)[2].y, -284.922);
});
