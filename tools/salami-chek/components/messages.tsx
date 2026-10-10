"use client";

import { useState } from "react";

const messages = [
  "ঈদ মোবারক! দোয়া তো সবসময় পাই, আজ একটু সালামিও চাই।",
  "সালামি দিলে দোয়া ফ্রি, না দিলে মনে রাখব সারা বছর!",
  "মামা, নতুন জামা হয়েছে, এখন শুধু পকেটটা ভরলেই ঈদ পুরো।",
  "চেক কেটে রেখেছি, শুধু তোমার সইটা বাকি। ঈদ মোবারক!",
  "বয়স যতই হোক, সালামি চাওয়ার বয়স কখনো পার হয় না।",
  "আম্মু, এবারের সালামিটা আমি নিজেই রাখব, প্রমিস খরচ করব না!",
  "ঈদের সকালে সবচেয়ে সুন্দর শব্দ: ‘এই নে, তোর সালামি।’",
  "নতুন নোটের গন্ধ আর তোমার হাসি, এটাই আমার ঈদ।",
];

export function Messages() {
  const [copied, setCopied] = useState(-1);
  async function copy(index: number) {
    try { await navigator.clipboard.writeText(messages[index]); setCopied(index); }
    catch { setCopied(-1); }
  }
  return <ul className="sc-messages">{messages.map((message, index) => <li key={message}>
    <p>{message}</p>
    <button type="button" onClick={() => copy(index)} aria-label={`মেসেজটা কপি করো: ${message}`}>{copied === index ? "কপি হয়েছে" : "কপি"}</button>
  </li>)}</ul>;
}
