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
  const summary = total === null ? '' : `ভাড়া কত?\n${stations[from]} → ${stations[to]}\nসাধারণ একক যাত্রার টিকিট: ${banglaNumber(fare!)} টাকা\n${banglaNumber(count!)} জন · ${journeys === 2 ? 'যাওয়া-আসা' : 'শুধু যাওয়া'}\nমোট ${banglaNumber(total)} টাকা\nকোনো ছাড় বা স্টেশনে আসা-যাওয়ার অন্য খরচ ধরা হয়নি। ডিএমটিসিএলের সরকারি নথি মিলিয়ে দেখা হয়েছে: ৯ অক্টোবর ২০২৬। যাত্রার আগে সর্বশেষ ভাড়া জেনে নিন। এটি টিকিট নয়।`;
  function changeRoute(nextFrom: number, nextTo: number) { setFrom(nextFrom); setTo(nextTo); setMessage(''); }
  async function copy() { try { await navigator.clipboard.writeText(summary); setMessage('হিসাবটি কপি হয়েছে।'); } catch { setMessage('কপি করা যায়নি। নিচে “হিসাবের পুরো লেখা” খুলে লেখাটি বেছে কপি করুন।'); } }
  return <div className="fare-workbench">
    <div className="fare-inputs">
      <p className="eyebrow">ঢাকা মেট্রোরেল · সাধারণ একক যাত্রা</p>
      <label>কোথা থেকে<select value={from} onChange={event => changeRoute(Number(event.target.value), to)}>{stations.map((station,index)=><option key={station} value={index}>{station}</option>)}</select></label>
      <button type="button" className="fare-swap" onClick={()=>changeRoute(to,from)}>⇅ স্টেশন অদলবদল করুন</button>
      <label>কোথায় যাবেন<select value={to} onChange={event => changeRoute(from,Number(event.target.value))}>{stations.map((station,index)=><option key={station} value={index}>{station}</option>)}</select></label>
      <div className="fare-row"><label>কতজন যাবেন<input inputMode="numeric" value={people} maxLength={2} aria-invalid={count === null} aria-describedby={count === null ? 'people-error':undefined} onChange={event=>{setPeople(event.target.value);setMessage('');}} /></label><label>যাত্রা<select value={journeys} onChange={event=>{setJourneys(Number(event.target.value) as 1|2);setMessage('');}}><option value={1}>শুধু যাওয়া</option><option value={2}>যাওয়া-আসা</option></select></label></div>
      {count === null && <p className="fare-error" id="people-error">যাত্রীসংখ্যা ১ থেকে ২০-এর মধ্যে পূর্ণ সংখ্যায় লিখুন।</p>}
      <p className="fare-small">উদাহরণ হিসেবে উত্তরা উত্তর → মতিঝিল বেছে রাখা আছে। আপনার যাত্রার স্টেশন দিন।</p>
    </div>
    <div className="fare-ticket" aria-live="polite" aria-atomic="true">
      <div className="fare-ticket-top"><span>আপনার যাত্রার মোট ভাড়া</span><span aria-hidden="true">● ── ●</span></div>
      <h3>{stations[from]}<span className="fare-arrow" aria-hidden="true">↓</span>{stations[to]}</h3>
      {total !== null ? <><p className="fare-total"><strong>{banglaNumber(total)}</strong><span>টাকা</span></p><p>{banglaNumber(count!)} জন · {journeys === 2 ? 'যাওয়া-আসা' : 'শুধু যাওয়া'}</p><div className="fare-breakdown"><span>একজনের একবারের ভাড়া</span><strong>{banglaNumber(fare!)} টাকা</strong></div><p className="fare-small">সাধারণ একক যাত্রার ভাড়া ধরে এই হিসাব করা হয়েছে। এটি টিকিট নয়। কোনো ছাড় বা স্টেশনে আসা-যাওয়ার অন্য খরচ ধরা হয়নি।</p></> : <p className="fare-empty">{from === to ? 'ওঠার ও নামার জন্য আলাদা স্টেশন বেছে নিন। একই স্টেশনে ঢুকে বের হওয়ার নিয়ম এই হিসাবের আওতায় নেই।' : 'মোট ভাড়া দেখতে সঠিক যাত্রীসংখ্যা লিখুন।'}</p>}
      <div className="fare-actions"><button className="button" disabled={total===null} onClick={copy}>হিসাব কপি করুন</button><button className="button-secondary" disabled={total===null} onClick={()=>window.print()}>প্রিন্ট করুন</button></div>
      <p className="fare-status" role="status">{message}</p>
      {total!==null && <details className="fare-copy"><summary>হিসাবের পুরো লেখা</summary><pre>{summary}</pre></details>}
    </div>
  </div>;
}
