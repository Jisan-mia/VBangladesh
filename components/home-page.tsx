import Link from "next/link";
import { brand, homeFaq } from "../lib/brand";
import { memories } from "../tools/amar-chhotobela/lib/postcard";
import { MemorySketch } from "../tools/amar-chhotobela/components/memory-sketch";
import { ToolDirectory } from "./tool-directory";
import { BrandMark } from "./brand-mark";

const heroMemories = ["alif-laila", "hurricane", "kite", "salami", "hawai-mithai", "landphone", "gollachhut", "new-books", "eid-moon", "nokia-snake", "paper-boat", "pitha"];
const heroPicked = new Set(["alif-laila", "hurricane", "salami", "landphone", "new-books", "paper-boat", "eid-moon"]);

function MiniKhata() {
  const shown = heroMemories.map(id => memories.find(memory => memory.id === id)!);
  return <div className="home-khata" aria-hidden="true">
    <div className="home-khata-top"><strong>আমার ছোটবেলা</strong><span>নাম: <i>তুমি</i></span></div>
    <ul>{shown.map((memory, index) => <li key={memory.id} data-chapter={memory.chapter} data-picked={heroPicked.has(memory.id)} style={{ animationDelay: `${0.5 + index * 0.18}s` }}>
      <MemorySketch drawing={memory.drawing} /><span>{memory.label}</span>
    </li>)}</ul>
    <p className="home-khata-foot">তোমার কয়টা মেলে?</p>
  </div>;
}

export function HomePage() {
  return <div className="home-page">
    <a className="home-skip" href="#main">মূল অংশে যাও</a>
    <header className="home-header">
      <div className="home-container home-header-inner">
        <Link className="home-brand" href="/" aria-label={brand.name + ", প্রথম পাতা"}><BrandMark /><span>{brand.name}</span></Link>
        <nav className="home-nav" aria-label="মূল মেনু"><Link href="/tools">সব টুল</Link><Link className="home-nav-wide" href="/about">আমাদের কথা</Link></nav>
      </div>
    </header>
    <main id="main">
      <section className="home-container home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-kicker">নতুন · আমার ছোটবেলা</p>
          <h1 id="home-title">আলিফ লায়লা, হারিকেনের আলো, ঈদের সালামি…<span> মনে আছে?</span></h1>
          <p className="home-lead">৩৬টা চেনা স্মৃতির কয়টা তোমার ছোটবেলায় ছিল? এক মিনিটে মিলিয়ে দেখো। শেষে নিজের ছোটবেলার খাতাটা পাবে, বন্ধুদের সাথে মেলানোর জন্য।</p>
          <Link className="home-primary" href="/amar-chhotobela">আমার ছোটবেলা মেলাই<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
          <p className="home-promise">ফ্রি · অ্যাকাউন্ট লাগে না · ছবি বানিয়ে শেয়ার করো</p>
        </div>
        <MiniKhata />
      </section>
      <ToolDirectory />
      <section className="home-container home-trust" aria-labelledby="home-trust-title">
        <h2 id="home-trust-title">যা বানাও, তা তোমার ফোনেই থাকে</h2>
        <p>কোনো অ্যাকাউন্ট নেই, বিজ্ঞাপন নেই। তুমি শেয়ার না করলে কিছুই আমাদের কাছে আসে না। কাকে পাঠাবে, সেটাও তুমিই ঠিক করবে।</p>
        <Link href="/privacy">তোমার তথ্য কোথায় থাকে</Link>
      </section>
      <section className="home-container home-faq" aria-labelledby="home-faq-title">
        <h2 id="home-faq-title">যা জানতে চাইতে পারো</h2>
        <div className="home-faq-list">{homeFaq.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
      </section>
    </main>
    <footer className="home-footer">
      <div className="home-container home-footer-inner">
        <div><Link className="home-brand" href="/"><BrandMark /><span>{brand.name}</span></Link><p>বাংলায় ছোট ছোট আনন্দের জায়গা।</p></div>
        <nav className="home-nav" aria-label="আরও জানো"><Link href="/amar-chhotobela">আমার ছোটবেলা</Link><Link href="/tools">সব টুল</Link><Link href="/about">আমাদের কথা</Link><Link href="/privacy">গোপনীয়তা</Link></nav>
      </div>
    </footer>
  </div>;
}
