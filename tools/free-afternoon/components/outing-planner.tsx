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
 async function copy(){try{await navigator.clipboard.writeText(text);setMessage('কপি হয়ে গেছে! দিন আর সময়টা লিখে বন্ধুদের পাঠিয়ে দাও।');}catch{setMessage('কপি হলো না। নিচে “মেসেজটা দেখো” খুলে লেখাটা নিজে কপি করে নাও।');}}
 function download(){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='আমাদের-বিকেল.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('ফাইলটা নেমে গেছে। ডাউনলোড ফোল্ডারে দেখো।');}
 function change(key:keyof typeof values,value:string){setValues({...values,[key]:value});setMessage('');}
 return <div className="outing-workbench"><div className="outing-controls">
 <fieldset><legend>বিকেলটা কোথায় কাটাবে?</legend><div className="outing-options">{settings.map(item=><label key={item.id} className={setting===item.id?'selected':''}><input type="radio" name="setting" value={item.id} checked={setting===item.id} onChange={()=>{setSetting(item.id);setMessage('');}}/>{item.label}</label>)}</div></fieldset>
 <div className="outing-input-row"><label>হাতে কতক্ষণ<select value={minutes} onChange={event=>{setMinutes(Number(event.target.value) as 60|120);setMessage('');}}><option value={60}>১ ঘণ্টা</option><option value={120}>২ ঘণ্টা</option></select></label><label>তোমরা কয়জন<input value={values.people} onChange={event=>change('people',event.target.value)} maxLength={2} inputMode="numeric" aria-invalid={amounts.people===null||amounts.people===0}/></label></div>
 <label>জায়গার নাম <span className="outing-optional">(চাইলে)</span><input value={place} maxLength={80} placeholder="যেমন: বাসার পাশের মাঠ" onChange={event=>{setPlace(event.target.value);setMessage('');}}/></label>
 <div className="outing-budget-input"><h3>সবার মোট খরচ</h3><p>প্রতিটা ঘরে সবার মিলিয়ে মোট টাকা লেখো, একজনেরটা না।</p><label>সবার মিলিয়ে বাজেট<input inputMode="numeric" value={values.budget} maxLength={6} onChange={event=>change('budget',event.target.value)} aria-invalid={amounts.budget===null}/></label>
 <div className="outing-costs">{([{key:'travel',label:'সবার যাওয়া-আসা'},{key:'food',label:'সবার খাবার-নাশতা'},{key:'entry',label:'টিকিট ও অন্য খরচ'}] as const).map(item=><label key={item.key}>{item.label}<input inputMode="numeric" maxLength={6} value={values[item.key]} onChange={event=>change(item.key,event.target.value)} aria-invalid={amounts[item.key]===null}/></label>)}</div>
 <p className="outing-small">শুরুর অঙ্কগুলো শুধু নমুনা, নিজেদের খরচটা বসাও। বাংলা বা ইংরেজি অঙ্কে, পুরো টাকায় লেখো।</p>{!valid&&<p className="outing-error" role="alert">মানুষ ১ থেকে ১২ জনের মধ্যে লেখো। টাকার ঘরে ০ থেকে ১,০০,০০০-এর মধ্যে পুরো টাকা লেখো।</p>}</div></div>
 <div className="outing-plan"><p className="eyebrow">তোমাদের প্ল্যান</p><h3>{plan.title}</h3><p>{plan.intro}</p><div className="outing-budget-result" aria-live="polite">{budget?<><div><span>সবার মিলিয়ে মোটামুটি খরচ</span><strong>{bn(budget.total)} টাকা</strong></div><p className={budget.remaining<0?'outing-over':''}>{budget.remaining<0?`বাজেট ছাড়িয়ে গেছে ${bn(-budget.remaining)} টাকা`:`বাজেটের ${bn(budget.remaining)} টাকা হাতে থাকবে`}</p><p>সমান ভাগ করলে মাথাপিছু প্রায় {bn(budget.perPerson)} টাকা। হিসাবটা তোমার লেখা খরচ ধরেই।</p></>:<p>ঘরগুলোতে ঠিকঠাক অঙ্ক লিখলেই হিসাবটা দেখাবে।</p>}</div>
 <ol className="outing-steps">{plan.steps.map(step=><li key={step}>{step}</li>)}</ol>
 <div className="outing-timeline" aria-label="কোন কাজে কত সময়">{itinerary(minutes).map(item=><div key={item.title}><strong>{bn(item.minutes)} মিনিট</strong><span>{item.title}</span></div>)}</div><p className="outing-small">সময়গুলো মোটামুটি ধরা। জ্যামে বা যাতায়াতে বেশি লাগলে নিজেদের মতো বদলে নিও।</p>
 <p className="outing-check">{plan.check}</p><div className="outing-actions"><button className="button" disabled={!valid} onClick={copy}>মেসেজ কপি করো</button><button className="button-secondary" disabled={!valid} onClick={download}>ডাউনলোড করো</button></div><p className="outing-status" role="status">{message}</p>{valid&&<details className="outing-invitation"><summary>মেসেজটা দেখো</summary><pre>{text}</pre></details>}
 </div></div>;
}
