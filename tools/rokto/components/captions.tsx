"use client";

import { useState } from "react";

const captions = [
  "আজ রক্ত দিলাম। কার কাছে যাবে জানি না, শুধু জানি কারও কাজে লাগবে।",
  "সুঁইয়ের খোঁচা একটুখানির। কারও পরিবারের স্বস্তি অনেক দিনের।",
  "যে মানুষটা আমার রক্ত পাবে, সে হয়তো কখনো আমার নাম জানবে না। তাতে কী?",
  "রক্ত দিতে টাকা লাগে না, লাগে একটু সাহস। আর পরে এক গ্লাস জুস।",
  "আবার দিতে পারব কবে, কার্ডে লিখে রাখলাম। দরকার হলে মনে করিয়ে দিও।",
  "শেষ কবে রক্ত দিয়েছ? চলো, এবার একসাথে যাই।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="rk-captions">{captions.map((text, index) => <li key={text}>
    <p>{text}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${text}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
