import './product.css';
import { PageFrame, Faq, JsonLd } from '../../shared/site-shell';
import { BirdPortrait } from './components/bird-art';
import { InstructionDrawing } from './components/print-sheet';
import { ToyStudio } from './components/toy-studio';
import { site } from './content';
import { assemblySteps, defaultDesign } from './lib/bird';

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site}/><div className="paper-page">
    <section className="container paper-hero paper-screen" aria-labelledby="paper-title"><div className="paper-hero-copy"><p className="eyebrow"><span aria-hidden="true"/> ছোট্ট একটা কাগজের খেলনা</p><h1 id="paper-title">রং দিন।<br/>কাগজে <span>পাখি বানান।</span></h1><p>{site.lead}</p><a className="button paper-hero-button" href="#tool">{site.cta}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg></a><div className="paper-hero-note"><span>এক পাতা কাগজ</span><span>দুই পিঠ</span><span>আপনার রং</span></div></div><div className="paper-hero-art"><div className="paper-loose-sheet" aria-hidden="true"/><div className="paper-hero-picture"><BirdPortrait design={{ ...defaultDesign, paletteId: 'sun', name: 'রোদপাখি' }} prefix="hero-bird" /></div><div className="paper-ticket"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true"><path d="M8 3h8l5 5v13H3V3h5Zm8 0v6h5M7 13h10M7 17h7" stroke="currentColor" strokeWidth="1.5"/></svg><span>সাজান → প্রিন্ট করুন → বানান</span></div></div></section>
    <ToyStudio />
    <section className="container paper-assembly section paper-screen" aria-labelledby="assembly-heading"><div className="paper-assembly-heading"><p className="eyebrow">টেবিলে একটু জায়গা করে নিন</p><h2 id="assembly-heading">তিন ধাপে জোড়া দিন</h2><p>লাগবে কাগজ, কাঁচি ও কাগজের আঠা।<br/>শিশুদের সঙ্গে বড় কেউ থাকুন।</p></div><div className="paper-instruction-grid">{assemblySteps.map((step, index) => <article key={step.title}><div className="paper-instruction-picture"><svg viewBox="0 0 120 80" aria-hidden="true"><InstructionDrawing step={index + 1}/></svg><span>{new Intl.NumberFormat('bn-BD').format(index + 1)}</span></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
    <section className="container paper-material-note paper-screen"><div aria-hidden="true">এ৪</div><p><strong>প্রিন্টের মাপ আগে মিলিয়ে নিন।</strong> ছকের ৫ সেমি রেখাটি স্কেল দিয়ে মাপুন। সাইট ও ফাইল বিনামূল্যে; কাগজ, প্রিন্ট ও সরঞ্জামের খরচ আপনার।</p></section>
  </div><Faq items={site.faq}/></PageFrame>;
}
