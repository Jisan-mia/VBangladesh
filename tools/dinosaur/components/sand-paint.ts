// Sand setup (not per frame): the colours of each world's sand, painting a fresh pit's layers once, and the dust pool.
import { makeRng } from "../../../shared/game-core";
import { PIT, type Pit } from "../lib/pit";
import type { WorldId } from "../lib/worlds";

export type SandLook = { top0: string; top1: string; grain0: string; grain1: string; mid: string; soil: string; halo: string; mound: string; crack: string; dust: string };
// One palette per world: golden sand, wet jungle litter, grey-blue hill scree. The soil under each is darker than the sand over it.
export const LOOKS: Record<WorldId, SandLook> = {
  0: { top0: "#efc977", top1: "#dfae55", grain0: "#c9953e", grain1: "#f9e3a8", mid: "#b07a35", soil: "#8c5e28", halo: "#6e4519", mound: "#d0a04b", crack: "#a8762c", dust: "#e8c77f" },
  1: { top0: "#b9c27d", top1: "#9fa862", grain0: "#7f8a49", grain1: "#d6dca3", mid: "#6c7440", soil: "#4a4a2a", halo: "#363a1e", mound: "#8f9a58", crack: "#6c7640", dust: "#b2bb76" },
  2: { top0: "#cfd3d6", top1: "#b6bcc2", grain0: "#98a0a8", grain1: "#e8ebee", mid: "#8a929b", soil: "#5b636d", halo: "#444b54", mound: "#a7aeb5", crack: "#7d858e", dust: "#c3c8cc" },
};

export const SCALE = 2;

/** Paints a fresh pit: the top layer (gradient, grains, and a mound with a crack over each bone when `marks`), the wet layer under it for deep sand, and the soil. */
export function paintPit(pit: Pit, world: WorldId, marks: boolean, seed: number, top: CanvasRenderingContext2D, mid: CanvasRenderingContext2D | null, halo: CanvasRenderingContext2D) {
  const look = LOOKS[world], rng = makeRng(seed);
  halo.setTransform(1, 0, 0, 1, 0, 0);
  halo.clearRect(0, 0, PIT.width, PIT.height);
  halo.fillStyle = look.soil; halo.fillRect(0, 0, PIT.width, PIT.height);
  halo.fillStyle = look.halo; halo.globalAlpha = 0.55;

  top.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  top.globalCompositeOperation = "source-over";
  top.clearRect(0, 0, PIT.width, PIT.height);
  const sand = top.createLinearGradient(0, 0, 0, PIT.height);
  sand.addColorStop(0, look.top0); sand.addColorStop(1, look.top1);
  top.fillStyle = sand; top.fillRect(0, 0, PIT.width, PIT.height);
  for (let i = 0; i < 520; i++) {
    top.fillStyle = i % 3 ? look.grain0 : look.grain1;
    top.beginPath(); top.arc(rng() * PIT.width, rng() * PIT.height, 0.8 + rng() * 1.8, 0, Math.PI * 2); top.fill();
  }
  if (marks) for (const bone of pit.bones) {
    top.fillStyle = look.mound; top.beginPath(); top.ellipse(bone.x, bone.y + 4, 26, 13, 0, 0, Math.PI * 2); top.fill();
    top.strokeStyle = look.crack; top.lineWidth = 1.8; top.lineCap = "round";
    top.beginPath(); top.moveTo(bone.x - 11, bone.y); top.lineTo(bone.x - 2, bone.y + 4); top.lineTo(bone.x + 6, bone.y - 1); top.lineTo(bone.x + 13, bone.y + 3); top.stroke();
  }
  top.globalCompositeOperation = "destination-out";
  top.fillStyle = "#000";

  if (mid) {
    mid.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    mid.globalCompositeOperation = "source-over";
    mid.clearRect(0, 0, PIT.width, PIT.height);
    mid.fillStyle = look.mid; mid.fillRect(0, 0, PIT.width, PIT.height);
    for (let i = 0; i < 260; i++) { mid.fillStyle = i % 2 ? look.halo : look.grain0; mid.globalAlpha = 0.5; mid.beginPath(); mid.arc(rng() * PIT.width, rng() * PIT.height, 0.7 + rng() * 1.4, 0, Math.PI * 2); mid.fill(); }
    mid.globalAlpha = 1;
    mid.globalCompositeOperation = "destination-out";
    mid.fillStyle = "#000";
  }
}

/** The grains that fly off the brush: a ring of 40, each with a position, a velocity and a life 0..1. */
export type Dust = { n: number; x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array; life: Float32Array; next: number; alive: number; seed: number };
export function makeDust(n = 40): Dust {
  return { n, x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), life: new Float32Array(n), next: 0, alive: 0, seed: 12345 };
}
