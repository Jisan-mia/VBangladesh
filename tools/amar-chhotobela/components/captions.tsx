"use client";

import { useState } from "react";

const captions = [
  "আমাদের ছোটবেলায় ইন্টারনেট ছিল না। বন্ধুকে ডাকতে হলে বাড়ির গেটে গিয়ে হাঁক দিতে হতো।",
  "লোডশেডিংয়ের রাতে হারিকেনের আলোয় পড়া। গরমে ঘামতাম, তবু ওই রাতগুলো মনে পড়ে।",
  "বিকেল মানেই ছিল মাঠ, গোল্লাছুট আর মাগরিবের আগে আম্মুর ডাক।",
  "টিফিনের পরোটা ভাগ করে খাওয়া বন্ধুগুলো এখন কে কোথায়?",
  "ঈদের সালামির হিসাব রাখতাম খাতায়, এখন হিসাব রাখি বাজারের।",
  "নানাবাড়ির পুকুর, আমগাছ আর ছুটির দুপুর। ওই দুপুরগুলো এখন কোথায় গেল?",
  "বইয়ের ভাঁজে রাখা পালকটা সত্যিই বাচ্চা দিত কি না, আজও জানা হলো না।",
  "ছোটবেলাটা ফেরত চাই, সাথে শুক্রবার বিকেলের বিটিভির সিনেমাটাও।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="khata-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
