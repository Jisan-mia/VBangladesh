'use client';
import { useState } from 'react';
import { bn, calculateBudget, ideas, invitation, itinerary, settings, wholeNumber, type Setting } from '../lib/plans';
export function OutingPlanner(){
 const [setting,setSetting]=useState<Setting>('nearby');const [minutes,setMinutes]=useState<60|120>(60);const [place,setPlace]=useState('');
 const [values,setValues]=useState({people:'২',budget:'২০০',travel:'০',food:'০',entry:'০'});const [message,setMessage]=useState('');
 const amounts={people:wholeNumber(values.people,12),budget:wholeNumber(values.budget,100000),travel:wholeNumber(values.travel,100000),food:wholeNumber(values.food,100000),entry:wholeNumber(values.entry,100000)};
 const valid=Object.values(amounts).every(value=>value!==null)&&amounts.people!==0;
 const budget=valid?calculateBudget(amounts as {people:number;budget:number;travel:number;food:number;entry:number}):null;
 const plan=ideas[setting];const text=budget?invitation({setting,place,minutes,people:amounts.people!,total:budget.total}):'';
 async function copy(){try{await navigator.clipboard.writeText(text);setMessage('আমন্ত্রণটি কপি হয়েছে। দিন ও শুরুর সময় যোগ করে পাঠান।');}catch{setMessage('কপি করা যায়নি। নিচে “আমন্ত্রণের লেখা দেখুন” খুলে লেখাটি বেছে কপি করুন।');}}
 function download(){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='আমাদের-বিকেল.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('ফাইল তৈরি হয়েছে। ব্রাউজারের ডাউনলোড তালিকায় দেখুন।');}
 function change(key:keyof typeof values,value:string){setValues({...values,[key]:value});setMessage('');}
 return <div className="outing-workbench"><div className="outing-controls">
 <fieldset><legend>কোথায় সময় কাটাবেন?</legend><div className="outing-options">{settings.map(item=><label key={item.id} className={setting===item.id?'selected':''}><input type="radio" name="setting" value={item.id} checked={setting===item.id} onChange={()=>{setSetting(item.id);setMessage('');}}/>{item.label}</label>)}</div></fieldset>
 <div className="outing-input-row"><label>কতক্ষণ সময় আছে<select value={minutes} onChange={event=>{setMinutes(Number(event.target.value) as 60|120);setMessage('');}}><option value={60}>১ ঘণ্টা</option><option value={120}>২ ঘণ্টা</option></select></label><label>কতজন থাকবেন<input value={values.people} onChange={event=>change('people',event.target.value)} maxLength={2} inputMode="numeric" aria-invalid={amounts.people===null||amounts.people===0}/></label></div>
 <label>জায়গার নাম <span className="outing-optional">(চাইলে)</span><input value={place} maxLength={80} placeholder="যেমন: বাসার পাশের মাঠ" onChange={event=>{setPlace(event.target.value);setMessage('');}}/></label>
 <div className="outing-budget-input"><h3>সবার মোট খরচ</h3><p>প্রতিটি ঘরে সবার মোট টাকা লিখুন, জনপ্রতি নয়।</p><label>সবার মোট বাজেট<input inputMode="numeric" value={values.budget} maxLength={6} onChange={event=>change('budget',event.target.value)} aria-invalid={amounts.budget===null}/></label>
 <div className="outing-costs">{([{key:'travel',label:'সবার যাওয়া-আসা'},{key:'food',label:'সবার খাবার'},{key:'entry',label:'প্রবেশমূল্য ও অন্য খরচ'}] as const).map(item=><label key={item.key}>{item.label}<input inputMode="numeric" maxLength={6} value={values[item.key]} onChange={event=>change(item.key,event.target.value)} aria-invalid={amounts[item.key]===null}/></label>)}</div>
 <p className="outing-small">শুরুতে দেওয়া অঙ্কগুলো শুধু উদাহরণ। খরচ জেনে লিখুন। বাংলা বা ইংরেজি অঙ্কে পূর্ণ টাকা দিন।</p>{!valid&&<p className="outing-error" role="alert">লোকসংখ্যা ১–১২ জন হতে হবে। টাকার প্রতিটি ঘরে ০–১,০০,০০০ পর্যন্ত পূর্ণ সংখ্যা দিন।</p>}</div></div>
 <div className="outing-plan"><p className="eyebrow">আপনাদের পরিকল্পনা</p><h3>{plan.title}</h3><p>{plan.intro}</p><div className="outing-budget-result" aria-live="polite">{budget?<><div><span>সবার আনুমানিক খরচ</span><strong>{bn(budget.total)} টাকা</strong></div><p className={budget.remaining<0?'outing-over':''}>{budget.remaining<0?`বাজেটের চেয়ে ${bn(-budget.remaining)} টাকা বেশি`:`বাজেট থেকে বাকি ${bn(budget.remaining)} টাকা`}</p><p>সমান ভাগে জনপ্রতি প্রায় {bn(budget.perPerson)} টাকা। এই হিসাব আপনার দেওয়া খরচ অনুযায়ী।</p></>:<p>খরচের হিসাব দেখতে ঘরগুলোতে সঠিক অঙ্ক দিন।</p>}</div>
 <ol className="outing-steps">{plan.steps.map(step=><li key={step}>{step}</li>)}</ol>
 <div className="outing-timeline" aria-label="কোন কাজে কত সময়">{itinerary(minutes).map(item=><div key={item.title}><strong>{bn(item.minutes)} মিনিট</strong><span>{item.title}</span></div>)}</div><p className="outing-small">সময়গুলো একটি ধারণা মাত্র। যাতায়াতে বেশি সময় লাগলে সেই অনুযায়ী পরিকল্পনা বদলান।</p>
 <p className="outing-check">{plan.check}</p><div className="outing-actions"><button className="button" disabled={!valid} onClick={copy}>আমন্ত্রণ কপি করুন</button><button className="button-secondary" disabled={!valid} onClick={download}>লেখা ডাউনলোড করুন</button></div><p className="outing-status" role="status">{message}</p>{valid&&<details className="outing-invitation"><summary>আমন্ত্রণের লেখা দেখুন</summary><pre>{text}</pre></details>}
 </div></div>;
}
