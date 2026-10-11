"use client";

import { useState } from "react";

const captions = [
  "প্রথম বেতনের খামটা হাতে নিয়ে মনে হয়েছিল, পুরো দুনিয়াটা কিনে ফেলতে পারব।",
  "প্রথম আয়ে আম্মুর জন্য শাড়ি। দাম কম ছিল, কিন্তু আম্মুর হাসিটা ছিল অমূল্য।",
  "টিউশনির প্রথম টাকা দিয়ে মিষ্টি কিনে বাসায় ঢুকেছিলাম। সেই দিনটা এখনো মনে আছে।",
  "যারা আমাকে বড় করেছে, প্রথম আয়টা তাদের হাতেই তুলে দিলাম।",
  "খামটা ছোট ছিল, কিন্তু ভেতরে ছিল অনেক বছরের অপেক্ষা।",
  "প্রথম আয় মানে টাকা না, প্রথমবার নিজের পায়ে দাঁড়ানোর গর্ব।",
  "আব্বু কিছু বলেনি, শুধু পিঠে একটা হাত রেখেছিল। ওইটুকুই অনেক ছিল।",
  "বন্ধুরা বলত ‘ট্রিট কবে?’ প্রথম আয়েই ধার শোধ করে দিলাম!",
];

export function Captions() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(captions[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="pa-captions">{captions.map((caption, index) => <li key={caption}>
    <p>{caption}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`ক্যাপশনটা কপি করো: ${caption}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
