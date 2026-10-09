import { BirdFace } from './bird-art';
import { drawingName, foot, paper, templateFaces, type BirdDesign } from '../lib/bird';

export function InstructionDrawing({ step }: { step: number }) {
  if (step === 1) return <g fill="none" stroke="#74614c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M50 12h45v56H50Z" fill="#fffaf0" /><path d="M59 53c-15-9-5-26 8-19 0-12 17-13 20-1l8 3-7 6c2 10-6 15-13 14H59Z" strokeDasharray="4 4" /><circle cx="28" cy="48" r="8" /><circle cx="33" cy="65" r="8" /><path d="m34 43 29-23-19 29 19 16-22-9" /></g>;
  if (step === 2) return <g fill="none" stroke="#74614c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 26h26v41H14Z" fill="#efd2a7" /><path d="M20 17h14v9H20Z" /><path d="M22 10h10v7H22Z" /><path d="m44 40 12 0m-5-5 5 5-5 5" /><path d="M64 54c-17-10-9-27 5-19-1-13 17-15 21-2l11 5-11 5c0 10-7 15-15 15H64Z" fill="#fffaf0" /><path d="m70 37 11 12m-9-17 12 10" stroke="#d09871" /><path d="M69 57v11h14V57" strokeDasharray="3 3" /></g>;
  return <g fill="none" stroke="#74614c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M61 12v41" strokeWidth="5" /><path d="M61 53 37 68H13l26-15Z" fill="#f2d9a6" /><path d="m61 53 24 15h24L84 53Z" fill="#efd2a7" /><path d="M43 18c-17 3-22 14-15 26m-8-5 8 5 4-8M78 18c17 3 22 14 15 26m8-5-8 5-4-8" stroke="#a54531" /><path d="M10 73h102" stroke="#b8a78e" /></g>;
}

export function PrintSheet({ design, prefix }: { design: BirdDesign; prefix: string }) {
  return <svg className="paper-template-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${paper.width} ${paper.height}`} width="210mm" height="297mm" role="img" aria-label="এ৪ পাতায় পাখির দুই পিঠ, কাটার ছক ও ছবিসহ বানানোর নিয়ম" fontFamily="Bangla, sans-serif">
    <rect width="210" height="297" fill="#ffffff" />
    <text x="14" y="21" fontSize="7" fontWeight="650" fill="#443b31">{drawingName(design.name)}</text>
    <text x="14" y="30" fontSize="3.5" fill="#74614c">কাগজের মেলা · এ৪ · এক পাতায় দুই পিঠ</text>
    <path d="M14 39h14" stroke="#343029" strokeWidth="0.5" /><text x="31" y="40.3" fontSize="3.3" fill="#343029">কাটার রেখা</text>
    <path d="M96 39h14" stroke="#343029" strokeWidth="0.5" strokeDasharray="2 1.5" /><text x="113" y="40.3" fontSize="3.3" fill="#343029">ভাঁজের রেখা—কাটবেন না</text>
    {templateFaces.map((face, index) => <g key={index} transform={`translate(${face.x} ${face.y}) scale(${face.direction} 1)`}>
      <BirdFace design={design} prefix={`${prefix}-${index}`} />
      <path d={`M${foot.left} ${foot.foldY}H${foot.right}`} stroke="#343029" strokeWidth="0.6" strokeDasharray="2 1.5" />
    </g>)}
    <text x="52" y="151" textAnchor="middle" fontSize="3.6" fill="#443b31">এক পিঠ</text><text x="158" y="151" textAnchor="middle" fontSize="3.6" fill="#443b31">অন্য পিঠ</text>
    <path d="M19 164v4m0-2h50m0-2v4" stroke="#343029" strokeWidth="0.4" />
    <text x="19" y="175" fontSize="3.2" fill="#343029">এই রেখাটি ৫ সেমি হওয়ার কথা। স্কেল দিয়ে মিলিয়ে নিন।</text>
    <text x="19" y="182" fontSize="3.1" fill="#74614c">প্রিন্টে এ৪, লম্বালম্বি ও ১০০% মাপ রাখুন। হেডার ও ফুটার বন্ধ করুন।</text>
    <path d="M14 190H196" stroke="#d4cbbb" strokeWidth="0.35" />
    {[1, 2, 3].map((step, index) => <g key={step} transform={`translate(${15 + index * 63} 198) scale(.43)`}><InstructionDrawing step={step} /></g>)}
    <g fill="#443b31" fontSize="4.2" fontWeight="600"><text x="16" y="241">১. কাটুন</text><text x="79" y="241">২. জোড়া দিন</text><text x="142" y="241">৩. পা ভাঁজ করুন</text></g>
    <g fill="#514735" fontSize="3.2">
      <text x="16" y="249"><tspan x="16">বাইরের রেখা ধরে কাটুন।</tspan><tspan x="16" dy="5.4">নিচের পায়ের অংশ রাখুন।</tspan></text>
      <text x="79" y="249"><tspan x="79">সাদা পিঠে আঠা দিন।</tspan><tspan x="79" dy="5.4">পায়ের অংশে আঠা নয়।</tspan></text>
      <text x="142" y="249"><tspan x="142">শুকিয়ে গেলে পা দুদিকে</tspan><tspan x="142" dy="5.4">সমকোণে ভাঁজ করুন।</tspan></text>
    </g>
    <text x="14" y="270" fontSize="3.2" fill="#443b31">কাঁচি ও আঠা ব্যবহারে শিশুদের বড় কেউ সাহায্য করুন।</text>
    <text x="14" y="280" fontSize="3.05" fill="#74614c">ডিজিটাল মাপ পরীক্ষা করা হয়েছে; কাগজে বানিয়ে পরীক্ষা করা হয়নি।</text>
  </svg>;
}
