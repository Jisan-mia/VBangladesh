"use client";

import { useState } from "react";

const captions = [
  "নতুন জামা, সেমাইয়ের বাটি আর সালামির খাম। ঈদ মোবারক!",
  "সালামি নিতাম, এখন দিই। ঈদটা একই আছে, শুধু হাতটা বদলেছে।",
  "চাঁদরাতে মেহেদি, সকালে কোলাকুলি, দুপুরে ঘুম। এই তো আমার ঈদ।",
  "যত দূরেই থাকি, ঈদের সকালে প্রথম ফোনটা বাড়িতেই যায়।",
  "আম্মুর হাতের সেমাই ছাড়া ঈদ ঈদই লাগে না।",
  "ফাঁকা শহর, ভরা মন। ঈদের বিকেলের মতো বিকেল আর হয় না।",
  "সবার ঘরে খুশি আসুক, সবার পাতে থাকুক সেমাই। ঈদ মোবারক।",
  "নতুন জামাটা লুকিয়ে রাখার দিনগুলো খুব মনে পড়ে।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="ed-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
