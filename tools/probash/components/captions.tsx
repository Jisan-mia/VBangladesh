"use client";

import { useState } from "react";

// Originals, written for this page: warm and proud, never pitying.
const captions = [
  "দূরে আছি, ভালো আছি। দোয়া রেখো, প্রবাস জীবন সুখের হোক।",
  "লাগেজে শুঁটকি, ফোনে মায়ের গলা, মনে পুরো একটা দেশ।",
  "যে শহরেই থাকি, ঘুম ভাঙে বাংলাদেশের সময় মিলিয়ে।",
  "ভিডিও কলের ঈদেও সেমাইয়ের গন্ধটা ঠিকই পৌঁছে যায়।",
  "অচেনা রাস্তায় কেউ বাংলা বললেই মনে হয়, বাড়ির কেউ।",
  "পাসপোর্টে সিল বাড়ে, আর বুকের ভেতর দেশটা আরও বড় হয়।",
  "প্রবাসে কাটানো প্রতিটা দিন, বাড়ির হাসিমুখগুলোর জন্য।",
  "ছুটি ফুরালে আবার বিদায়। তবু জানি, আবার ফিরব।",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="pb-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
