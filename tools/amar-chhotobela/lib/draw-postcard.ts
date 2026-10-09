import type { PostcardContent } from "./postcard";

const WIDTH = 1200;
const HEIGHT = 1420;
const INK = "#292722";
const TERRACOTTA = "#a63d29";
const FONT = '"Bangla"';

type FittedLine = { x: number; y: number; size: number; width: number; weight?: number };

function fittedText(context: CanvasRenderingContext2D, text: string, line: FittedLine) {
  let size = line.size;
  context.font = `${line.weight ?? 400} ${size}px ${FONT}`;
  while (context.measureText(text).width > line.width && size > 16) {
    context.font = `${line.weight ?? 400} ${--size}px ${FONT}`;
  }
  context.fillText(text, line.x, line.y);
}

function drawStationery(context: CanvasRenderingContext2D) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.strokeStyle = "#dedbd3";
  context.lineWidth = 2;
  context.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);
  context.strokeStyle = "#e9e6df";
  for (let y = 418; y < 1170; y += 170) {
    context.beginPath();
    context.moveTo(82, y);
    context.lineTo(1118, y);
    context.stroke();
  }
  context.fillStyle = "#d8ad39";
  context.fillRect(82, 76, 90, 8);
  context.strokeStyle = TERRACOTTA;
  context.lineWidth = 4;
  context.strokeRect(992, 85, 111, 130);
  context.save();
  context.translate(1004, 100);
  context.scale(2.05, 2.05);
  context.lineWidth = 1.4;
  context.stroke(new Path2D("M5 24 16 34h17l10-10H5Zm11 0 8-16 9 16M24 8v16M7 39c5-4 10 4 15 0s10 4 17 0"));
  context.restore();
}

function drawMemories(context: CanvasRenderingContext2D, postcard: PostcardContent) {
  postcard.memories.forEach((memory, index) => {
    const x = 88 + (index % 2) * 540;
    const y = 506 + Math.floor(index / 2) * 170;
    context.save();
    context.translate(x, y - 42);
    context.scale(1.2, 1.2);
    context.strokeStyle = TERRACOTTA;
    context.lineWidth = 1.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke(new Path2D(memory.drawing));
    context.restore();
    context.fillStyle = INK;
    fittedText(context, memory.label, { x: x + 78, y, size: 37, width: 420 });
  });
  if (!postcard.memories.length) {
    context.fillStyle = "#8c8982";
    fittedText(context, "তালিকা থেকে স্মৃতি বেছে নিন", { x: 90, y: 531, size: 34, width: 1000 });
  }
}

export function drawPostcard(canvas: HTMLCanvasElement, postcard: PostcardContent) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ছবিটি তৈরি করা যাচ্ছে না।");
  drawStationery(context);
  context.fillStyle = "#787168";
  fittedText(context, postcard.name || "স্মৃতির পোস্টকার্ড", { x: 86, y: 153, size: 34, width: 850 });
  context.fillStyle = TERRACOTTA;
  fittedText(context, postcard.title, { x: 82, y: 290, size: 98, width: 1020, weight: 700 });
  context.fillStyle = INK;
  fittedText(context, postcard.caption, { x: 88, y: 365, size: 34, width: 1020 });
  drawMemories(context, postcard);
  context.strokeStyle = TERRACOTTA;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(85, 1224);
  context.lineTo(1115, 1224);
  context.stroke();
  context.fillStyle = TERRACOTTA;
  fittedText(context, postcard.invitation, { x: 88, y: 1292, size: 43, width: 1020, weight: 600 });
  context.fillStyle = "#787168";
  fittedText(context, "আমার ছোটবেলা · স্মৃতি দিয়ে তৈরি পোস্টকার্ড", { x: 88, y: 1360, size: 25, width: 1020 });
}

export async function loadPostcardFont() {
  await document.fonts.load('700 48px "Bangla"', "আমার ছোটবেলা");
  await document.fonts.ready;
}

export async function postcardBlob(postcard: PostcardContent): Promise<Blob> {
  await loadPostcardFont();
  const canvas = document.createElement("canvas");
  drawPostcard(canvas, postcard);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("ছবিটি তৈরি করা যায়নি।"));
    }, "image/png");
  });
}
