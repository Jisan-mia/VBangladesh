"use client";

import { useState } from "react";

const captions = [
  "মন খারাপ? চলো এক কাপ চা খাই। মন ভালো? তাহলে দুই কাপ।",
  "টং-এর বেঞ্চে বসে যে আড্ডা হয়, কোনো ক্যাফেতে সেটা হয় না।",
  "মামা, একটা দুধ চা, চিনি কম। আর একটু গল্প।",
  "বৃষ্টি, টিনের চাল আর মাটির কাপে চা। আর কিছু লাগে?",
  "চায়ের কাপে চুমুক আর বন্ধুদের হাসি, দিনের সেরা দশ মিনিট।",
  "বিস্কুট চায়ে ডোবালাম, তুলতে গিয়ে অর্ধেক কাপেই রয়ে গেল।",
  "সকালের প্রথম চা না হলে আমি এখনো ঘুমিয়েই আছি।",
  "যে বন্ধু বলে ‘চল, এক কাপ চা খাই’, তাকে কখনো হারিয়ো না।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="tong-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
