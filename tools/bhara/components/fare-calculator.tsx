'use client';
import { useState } from 'react';
import { banglaNumber, metroFare, passengerCount, stations, tripTotal } from '../lib/fares';
export function FareCalculator() {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(15);
  const [people, setPeople] = useState('১');
  const [journeys, setJourneys] = useState<1 | 2>(1);
  const [message, setMessage] = useState('');
  const fare = metroFare(from, to);
  const count = passengerCount(people);
  const total = fare !== null && count !== null ? tripTotal({ fare, passengers: count, journeys }) : null;
  const summary = total === null ? '' : `ভাড়া কত?\n${stations[from]} → ${stations[to]}\nএকক যাত্রার টিকিট, একজনের একবারের ভাড়া: ${banglaNumber(fare!)} টাকা\n${banglaNumber(count!)} জন · ${journeys === 2 ? 'যাওয়া-আসা' : 'শুধু যাওয়া'}\nমোট ${banglaNumber(total)} টাকা\nপাসের বা অন্য কোনো ছাড়, আর স্টেশন পর্যন্ত যাওয়া-আসার খরচ ধরা নেই। ভাড়া ডিএমটিসিএলের সরকারি নথির সাথে মেলানো: ৯ অক্টোবর ২০২৬। বের হওয়ার আগে ভাড়া বদলেছে কি না দেখে নিও। এটা টিকিট না।`;
  function changeRoute(nextFrom: number, nextTo: number) { setFrom(nextFrom); setTo(nextTo); setMessage(''); }
  async function copy() { try { await navigator.clipboard.writeText(summary); setMessage('কপি হয়ে গেছে! যেখানে খুশি পেস্ট করো।'); } catch { setMessage('কপি হলো না। নিচে “হিসাবের পুরো লেখা” খুলে নিজে বেছে কপি করো।'); } }
  return <div className="fare-workbench">
    <div className="fare-inputs">
      <p className="eyebrow">ঢাকা মেট্রোরেল · একক যাত্রার টিকিট</p>
      <label>কোথা থেকে উঠবে<select value={from} onChange={event => changeRoute(Number(event.target.value), to)}>{stations.map((station,index)=><option key={station} value={index}>{station}</option>)}</select></label>
      <button type="button" className="fare-swap" onClick={()=>changeRoute(to,from)}>⇅ স্টেশন দুটো উল্টে দাও</button>
      <label>কোথায় নামবে<select value={to} onChange={event => changeRoute(from,Number(event.target.value))}>{stations.map((station,index)=><option key={station} value={index}>{station}</option>)}</select></label>
      <div className="fare-row"><label>কয়জন যাবে<input inputMode="numeric" value={people} maxLength={2} aria-invalid={count === null} aria-describedby={count === null ? 'people-error':undefined} onChange={event=>{setPeople(event.target.value);setMessage('');}} /></label><label>যাত্রা<select value={journeys} onChange={event=>{setJourneys(Number(event.target.value) as 1|2);setMessage('');}}><option value={1}>শুধু যাওয়া</option><option value={2}>যাওয়া-আসা</option></select></label></div>
      {count === null && <p className="fare-error" id="people-error">কয়জন যাবে, ১ থেকে ২০-এর মধ্যে পুরো সংখ্যায় লেখো (যেমন ৩)।</p>}
      <p className="fare-small">শুরুতে উত্তরা উত্তর → মতিঝিল বেছে রাখা আছে। তোমার স্টেশন দুটো বেছে নাও।</p>
    </div>
    <div className="fare-ticket" aria-live="polite" aria-atomic="true">
      <div className="fare-ticket-top"><span>তোমার যাত্রার মোট ভাড়া</span><span aria-hidden="true">● ── ●</span></div>
      <h3>{stations[from]}<span className="fare-arrow" aria-hidden="true">↓</span>{stations[to]}</h3>
      {total !== null ? <><p className="fare-total"><strong>{banglaNumber(total)}</strong><span>টাকা</span></p><p>{banglaNumber(count!)} জন · {journeys === 2 ? 'যাওয়া-আসা' : 'শুধু যাওয়া'}</p><div className="fare-breakdown"><span>একজনের একবারের ভাড়া</span><strong>{banglaNumber(fare!)} টাকা</strong></div><p className="fare-small">একক যাত্রার টিকিটের ভাড়া ধরে হিসাব। পাসের বা অন্য কোনো ছাড়, আর স্টেশন পর্যন্ত যাওয়ার খরচ এতে নেই। এটা টিকিট না।</p></> : <p className="fare-empty">{from === to ? 'ওঠা আর নামার স্টেশন একই হয়ে গেছে। আলাদা দুটো স্টেশন বেছে নাও।' : 'কয়জন যাবে, ঠিকমতো লিখলেই মোট ভাড়া দেখাবে।'}</p>}
      <div className="fare-actions"><button className="button" disabled={total===null} onClick={copy}>হিসাব কপি করো</button><button className="button-secondary" disabled={total===null} onClick={()=>window.print()}>প্রিন্ট করো</button></div>
      <p className="fare-status" role="status">{message}</p>
      {total!==null && <details className="fare-copy"><summary>হিসাবের পুরো লেখা</summary><pre>{summary}</pre></details>}
    </div>
  </div>;
}
