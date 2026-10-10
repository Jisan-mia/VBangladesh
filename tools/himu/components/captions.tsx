"use client";

import { useState } from "react";

// Our own lines about reading him; no quotes from the books.
const captions = [
  "হুমায়ূন আহমেদের বই হাতে নিলে এক বসায় শেষ না করে ওঠা যায় না।",
  "লোডশেডিংয়ের রাতে মোমের আলোয় হিমু পড়া। সেই রাতগুলো আর ফেরে না।",
  "জোছনা উঠলেই মনে হয়, আজ একটু খালি পায়ে হাঁটতে বের হই।",
  "মিসির আলি পড়ার পর থেকে সব রহস্যের পেছনে যুক্তি খুঁজি।",
  "বইমেলায় প্রথম কেনা বইটা ছিল হুমায়ূনের। এখনো তাকেই আছে।",
  "কেউ একটা বই ধার নিয়ে আর ফেরত দেয়নি। বইটা হুমায়ূনেরই ছিল।",
  "হলুদ পাঞ্জাবি দেখলে এখনো একবার ফিরে তাকাই।",
  "সবার জীবনে একটা দারুচিনি দ্বীপ থাকা দরকার।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="hm-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
