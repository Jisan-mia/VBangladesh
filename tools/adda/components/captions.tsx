"use client";

import { useState } from "react";

const captions = [
  "চা ঠান্ডা হয়ে যায়, আড্ডা ঠান্ডা হয় না।",
  "বন্ধু মানে এক কাপ চা, কয়েকটা মুখ আর শেষ না হওয়া গল্প।",
  "টং দোকানের বেঞ্চে যত গল্প জমা আছে, কোনো ডায়েরিতে নেই।",
  "আড্ডায় কেউ কুইন, কেউ স্ট্রাইকার, কিন্তু বোর্ডটা আমাদের সবার।",
  "শহর বদলায়, ফোন বদলায়, এই কয়টা মুখ বদলায় না।",
  "ক্লাস মিস হলে চলে, বিকেলের আড্ডা মিস হলে চলে না।",
  "‘আর পাঁচ মিনিট’ বলে তিন ঘণ্টার আড্ডা। এটাই আমরা।",
  "দূরে থাকি, তবু ভিডিও কলে আড্ডাটা ঠিকই জমে।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="adda-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
