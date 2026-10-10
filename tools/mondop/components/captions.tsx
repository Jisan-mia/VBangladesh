"use client";

import { useState } from "react";

const captions = [
  "ঢাকের শব্দ, ধুনুচির ধোঁয়া আর বন্ধুদের হাসি। এবার পূজাটা জমে গেছে।",
  "মণ্ডপ থেকে মণ্ডপে হেঁটে পা ব্যথা, কিন্তু মনটা ভরা। শুভ শারদীয়া!",
  "বন্ধুর হাত ধরে মণ্ডপে মণ্ডপে, এই আনন্দটুকুই পূজা।",
  "প্রসাদের খিচুড়ি আর নাড়ুর স্বাদ সারা বছর মনে থাকে।",
  "আলো, ঢাক, মেলা আর ভিড়। বছরে এই কয়টা দিনের জন্যই অপেক্ষা।",
  "ঢাকের বোল থামলেও মনটা মণ্ডপেই পড়ে থাকে। শুভ বিজয়া!",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="mp-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
