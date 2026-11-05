// The suds on the pool: a fixed pool of bubbles and pop rings, set up once. The per-frame code is foam.hot.ts.
// Coordinates are in the pool's own 200 × 200 box, so the drawing scales to any stage.
export const BUBBLES = 40, RINGS = 16;

export type Foam = {
  x: Float32Array; y: Float32Array; vy: Float32Array; r: Float32Array;
  age: Float32Array; life: Float32Array; wob: Float32Array;
  alive: Uint8Array;
  rx: Float32Array; ry: Float32Array; rage: Float32Array;
  carry: number;
  popped: number;
  seed: number;
};

export function createFoam(seed: number): Foam {
  return {
    x: new Float32Array(BUBBLES), y: new Float32Array(BUBBLES), vy: new Float32Array(BUBBLES), r: new Float32Array(BUBBLES),
    age: new Float32Array(BUBBLES), life: new Float32Array(BUBBLES), wob: new Float32Array(BUBBLES),
    alive: new Uint8Array(BUBBLES),
    rx: new Float32Array(RINGS), ry: new Float32Array(RINGS), rage: new Float32Array(RINGS).fill(-1),
    carry: 0, popped: 0, seed: seed >>> 0 || 1,
  };
}
