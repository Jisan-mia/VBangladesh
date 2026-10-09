export type Setting = 'home' | 'nearby' | 'green';
export const settings: Array<{id:Setting;label:string}> = [{id:'nearby',label:'চেনা পাড়ায়'},{id:'green',label:'পার্ক বা মাঠে'},{id:'home',label:'ঘরেই আড্ডা'}];
export const ideas: Record<Setting,{title:string;intro:string;steps:string[];check:string}> = {
 nearby:{title:'পাড়ায় একটু হাঁটাহাঁটি',intro:'চেনা পাড়ায় হাঁটতে বেরিয়ে তিনটা জিনিস খেয়াল করো: রাস্তার পুরোনো গাছ, নকশা করা দরজা, কিংবা মোড়ের চায়ের দোকানের গল্প। যেটা তোমাদের ভালো লাগে।',steps:['ছোট, চেনা একটা পথ বেছে নাও। কখন ফিরবে, আগেই ঠিক করে নাও।','আস্তে-ধীরে হাঁটো। কারও ছবি বা কারও বাড়ির ছবি তোলার আগে জিজ্ঞেস করে নিও।','বসার মতো একটা জায়গা পেলে একটু বসো, যা দেখলে তা নিয়ে গল্প করো। পানির বোতলটা সাথে রেখো।'],check:'বের হওয়ার আগে আবহাওয়াটা দেখে নিও, পথটা হাঁটার মতো কি না সেটাও। রাস্তার ওপর খেলাধুলা না, আর কারও জমি বা বন্ধ জায়গায় অনুমতি ছাড়া ঢুকো না।'},
 green:{title:'পার্কে বা মাঠে একটা বিকেল',intro:'চেনা কোনো পার্ক বা মাঠে বসে গল্প করো, গাছপালা দেখো, একটু হাঁটো। জায়গাটা খোলা কি না, ঢুকতে দেয় কি না, আগে জেনে নিও।',steps:['যাওয়ার আগে জেনে নাও কখন খোলে, টিকিট লাগে কি না, বসতে দেয় কি না।','পানি আর বসার জন্য একটা চাদর বা কাপড় নিয়ে যাও। গাছপালা দেখো, কিন্তু ফুল-পাতা ছিঁড়ো না।','নিজেদের ময়লা নিজেরাই নিয়ে ফেরো। আলো থাকতে থাকতে চেনা পথে ফেরার ব্যবস্থা রাখো।'],check:'কোন পার্ক এখন খোলা বা ঢুকতে টাকা লাগে কি না, আমরা জানি না। আবহাওয়া, ঢোকার নিয়ম আর সবাই আরামে যেতে পারবে কি না, আগে দেখে নিও।'},
 home:{title:'ঘরে বসে পুরোনো দিনের গল্প',intro:'পুরোনো অ্যালবাম আর ছোটবেলার গল্প নিয়ে ঘরেই জমিয়ে আড্ডা দাও। বাইরে না গিয়েও একসাথে দারুণ একটা বিকেল কাটানো যায়।',steps:['সবাইকে বলো একটা করে পুরোনো ছবি আনতে, বা বলার মতো একটা স্মৃতি ভেবে রাখতে।','পালা করে গল্প বলো। কেউ না চাইলে তার ছবি তুলো না, কথাও রেকর্ড কোরো না।','ঘরে মুড়ি-চানাচুর যা আছে, তা দিয়েই চলবে। কিছু কিনলে খাবারের খরচে যোগ করো।'],check:'যার বাসায় বসবে, আগে তার সাথে কথা বলে নিও। যাতায়াত বা নাশতার খরচ থাকলে হিসাবে যোগ করো।'},
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
export function itinerary(minutes:60|120){return minutes===60?[{minutes:10,title:'পৌঁছে গুছিয়ে বসা'},{minutes:40,title:'আড্ডা বা হাঁটাহাঁটি'},{minutes:10,title:'গুছিয়ে ফেরা'}]:[{minutes:20,title:'পৌঁছে গুছিয়ে বসা'},{minutes:80,title:'আড্ডা বা হাঁটাহাঁটি'},{minutes:20,title:'গুছিয়ে ফেরা'}]}
export const bn=(value:number)=>new Intl.NumberFormat('bn-BD').format(value);
export function invitation(values:{setting:Setting;place:string;minutes:60|120;people:number;total:number}){
 return `এই সপ্তাহে একটা বিকেল একসাথে কাটাই?\n${ideas[values.setting].title}\nজায়গা: ${values.place.trim()||'সবাই মিলে ঠিক করব'}\nসময়: ${bn(values.minutes)} মিনিট · ${bn(values.people)} জন\nসবার মিলিয়ে মোটামুটি খরচ: ${bn(values.total)} টাকা\nকোন দিন, কয়টায় শুরু করব, চলো ঠিক করি। যাওয়া-আসা, খাবার আর টিকিট ধরে হিসাবটা করেছি; এটা আন্দাজ, নিশ্চিত দাম না। কোনো আয়োজকের অনুষ্ঠান না, শুধু আমরাই।`;
}
