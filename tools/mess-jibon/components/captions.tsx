"use client";

import { useState } from "react";

// Originals, written for this page: fond and funny, never at anyone's expense.
const captions = [
  "ডাইনিংয়ের পাতলা ডাল আর বন্ধুদের জমাট আড্ডা, দুটোই মিস করি।",
  "মেস লাইফ মানে মাসের শেষে পকেট ফাঁকা, কিন্তু রুমভরা মানুষ।",
  "রাত দুটোর ম্যাগি আর সকাল আটটার ক্লাস। মাঝখানে ঘুম বলে কিছু ছিল না।",
  "বাড়ি থেকে আসা আচারের বয়াম কখনো এক দিনের বেশি টেকেনি।",
  "রুমমেট মানে যার চার্জার, জামা আর গল্প, সবই আমার।",
  "বাজার ম্যানেজারের মাসে বুঝেছি, এক হালি ডিমেরও হিসাব লাগে।",
  "হোস্টেলের ছাদে মাঝরাতের আড্ডা। বিষয় কিছু ছিল না, তবু উঠতে ইচ্ছে করত না।",
  "রুম ছাড়ার দিন বুঝলাম, চারটা দেয়ালেও মায়া জমে।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="mj-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
