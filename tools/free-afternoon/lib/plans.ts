export type Setting = 'home' | 'nearby' | 'green';
export const settings: Array<{id:Setting;label:string}> = [{id:'nearby',label:'চেনা পাড়ায়'},{id:'green',label:'পার্ক বা মাঠে'},{id:'home',label:'ঘরেই আড্ডা'}];
export const ideas: Record<Setting,{title:string;intro:string;steps:string[];check:string}> = {
 nearby:{title:'পাড়ায় একটু হাঁটাহাঁটি',intro:'পরিচিত পাড়ায় হাঁটতে বেরিয়ে তিনটি জিনিস খেয়াল করুন। রাস্তার গাছ, পুরোনো দরজা বা কোনো দোকানের গল্প—যা আপনাদের ভালো লাগে।',steps:['হাঁটার জন্য ছোট, চেনা একটি পথ বেছে নিন। কখন ফিরবেন, ঠিক করে নিন।','সময় নিয়ে হাঁটুন। কারও ছবি তুলতে বা ব্যক্তিগত জায়গার ছবি নিতে আগে অনুমতি নিন।','বসার সুবিধা আছে এমন জায়গায় একটু বসুন, যা দেখলেন তা নিয়ে গল্প করুন। নিজের পানির বোতল নিন।'],check:'হাঁটার জায়গা ও আবহাওয়া উপযোগী কি না দেখে বের হন। রাস্তায় খেলবেন না; অনুমতি ছাড়া ব্যক্তিগত জমি বা বন্ধ জায়গায় ঢুকবেন না।'},
 green:{title:'পার্ক বা মাঠে একটু সময়',intro:'চেনা কোনো পার্ক বা মাঠে বসে গল্প করুন, গাছপালা দেখুন বা একটু হাঁটুন। জায়গাটি খোলা এবং সেখানে প্রবেশের অনুমতি আছে কি না আগে জেনে নিন।',steps:['যাওয়ার আগে খোলার সময়, প্রবেশমূল্য ও বসার নিয়ম জেনে নিন।','পানি ও বসার জন্য ছোট একটি কাপড় সঙ্গে নিন। গাছপালা দেখুন, ফুল বা পাতা ছিঁড়বেন না।','নিজেদের ময়লা সঙ্গে নিয়ে ফিরুন। আলো থাকতে চেনা পথে ফেরার ব্যবস্থা রাখুন।'],check:'কোনো পার্ক এখন খোলা বা সেখানে প্রবেশ বিনামূল্যে, আমরা তা নিশ্চিত করছি না। আবহাওয়া, প্রবেশের নিয়ম ও সবার চলাচলের সুবিধা আগে দেখে নিন।'},
 home:{title:'ঘরে বসে পুরোনো দিনের গল্প',intro:'পুরোনো ছবি বা স্মৃতি নিয়ে ঘরেই আড্ডা দিন। বাইরে বেড়াতে না গিয়েও একসঙ্গে সময় কাটানো যায়।',steps:['সবাই একটি পুরোনো ছবি আনুন বা বলার মতো কোনো স্মৃতি ভেবে রাখুন।','পালা করে গল্প বলুন। কারও আপত্তি থাকলে তাঁর ছবি তুলবেন না বা কথা রেকর্ড করবেন না।','ঘরে যা আছে তা দিয়েই আপ্যায়ন করতে পারেন। কিছু কিনলে খাবারের খরচে যোগ করুন।'],check:'যাঁর বাসায় বসবেন, আগে তাঁর সম্মতি নিন। যাতায়াত ও আপ্যায়নের খরচ থাকলে হিসাবে যোগ করুন।'},
};
export function wholeNumber(input:string,max:number):number|null{
 const value=input.trim().replace(/[০-৯]/g,d=>String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
 if(!/^\d{1,6}$/.test(value))return null;
 const parsed=Number(value);return parsed<=max?parsed:null;
}
export type Budget = { people:number; budget:number; travel:number; food:number; entry:number };
export function calculateBudget(values:Budget){
 if(!Number.isInteger(values.people)||values.people<1||values.people>12)throw new Error('Invalid group size');
 if(![values.budget,values.travel,values.food,values.entry].every(value=>Number.isInteger(value)&&value>=0&&value<=100000))throw new Error('Invalid amount');
 const total=values.travel+values.food+values.entry;
 return {total,remaining:values.budget-total,perPerson:Math.ceil(total/values.people)};
}
export function itinerary(minutes:60|120){return minutes===60?[{minutes:10,title:'পৌঁছানো ও প্রস্তুতি'},{minutes:40,title:'আড্ডা বা হাঁটাহাঁটি'},{minutes:10,title:'ফেরার প্রস্তুতি'}]:[{minutes:20,title:'পৌঁছানো ও প্রস্তুতি'},{minutes:80,title:'আড্ডা বা হাঁটাহাঁটি'},{minutes:20,title:'ফেরার প্রস্তুতি'}]}
export const bn=(value:number)=>new Intl.NumberFormat('bn-BD').format(value);
export function invitation(values:{setting:Setting;place:string;minutes:60|120;people:number;total:number}){
 return `এই সপ্তাহে একসঙ্গে সময় কাটাই\n${ideas[values.setting].title}\nজায়গা: ${values.place.trim()||'আলোচনা করে ঠিক করব'}\nসময়: ${bn(values.minutes)} মিনিট · ${bn(values.people)} জন\nআমাদের হিসাবে আনুমানিক মোট খরচ: ${bn(values.total)} টাকা\nকোন দিন, কখন শুরু করব তা আলোচনা করে ঠিক করি। যাতায়াত, খাবার ও প্রবেশমূল্য ধরে এই হিসাব করেছি; এটি নিশ্চিত মূল্য নয়। এটি কোনো আয়োজকের অনুষ্ঠান নয়।`;
}
