import Link from "next/link";
import { brand, homeFaq } from "../lib/brand";
import { ToolDirectory } from "./tool-directory";
import { BrandMark } from "./brand-mark";

function DeskIllustration() {
  return <svg className="home-desk" viewBox="0 0 560 330" fill="none" aria-hidden="true">
    <path d="M34 272H522" stroke="#d9dee9" strokeWidth="2" />
    <path d="M42 299H450" stroke="#e8ebf2" strokeWidth="2" />
    <g transform="translate(119 28) rotate(-8 119 119)">
      <rect x="7" y="8" width="231" height="250" rx="3" fill="#192943" opacity=".08" />
      <rect width="231" height="250" rx="3" fill="#fff" stroke="#192943" strokeWidth="2" />
      <path d="M21 39H210M21 204H133M21 218H97" stroke="#d9dee9" strokeWidth="2" />
      <rect x="20" y="55" width="191" height="131" fill="#e4eeff" />
      <circle cx="169" cy="82" r="16" fill="#ffca54" />
      <path d="m21 174 44-33 44 24 44-26 58 35v12H21Z" fill="#c4d9ba" />
      <path d="m104 78 33 30-25 44-34-33Z" fill="#e44b32" />
      <path d="m104 78 8 74 25-44-59 11Z" fill="#ffca54" />
      <path d="m104 78 8 74m25-44-59 11" stroke="#192943" strokeWidth="1.4" />
      <path d="M112 152c25 15-21 19 0 38" stroke="#192943" strokeWidth="1.5" />
      <path d="m110 164-9 1 10 8m0 5 10 3-9 3" fill="#e44b32" />
      <path d="M20 24h51" stroke="#192943" strokeWidth="4" strokeLinecap="round" />
      <circle cx="203" cy="23" r="5" fill="#5b80d6" />
    </g>
    <g transform="translate(335 114) rotate(9 76 76)">
      <rect x="5" y="6" width="151" height="151" rx="2" fill="#192943" opacity=".1" />
      <rect width="151" height="151" rx="2" fill="#e44b32" />
      <g transform="translate(76 76)" stroke="#fff" strokeWidth="1.4">
        <circle r="54" /><circle r="60" />
        {[0,45,90,135,180,225,270,315].map(angle => <g key={angle} transform={"rotate(" + angle + ")"}>
          <path d="M0-10C-19-26-13-40 0-46C13-40 19-26 0-10Z" />
          <path d="M0-17V-36" /><circle cy="-52" r="2" fill="#fff" />
        </g>)}
        <circle r="7" fill="#ffca54" stroke="none" />
      </g>
    </g>
    <g transform="translate(68 174) rotate(17)">
      <path d="M0 0H17V94L8.5 113 0 94Z" fill="#ffca54" stroke="#192943" strokeWidth="1.5" />
      <path d="M0 13H17M5 13V94M12 13V94" stroke="#192943" strokeWidth="1.5" />
      <path d="m5 104 3.5 9 3.5-9" fill="#192943" /><path d="M0 0h17v13H0Z" fill="#e44b32" />
    </g>
    <path d="M421 76c14-23 33 1 17 11-19 9-4-27 12-14" stroke="#5b80d6" strokeWidth="2" strokeLinecap="round" />
    <path d="M61 101v14m-7-7h14M484 54v14m-7-7h14" stroke="#e44b32" strokeWidth="2" strokeLinecap="round" />
    <circle cx="499" cy="237" r="4" fill="#ffca54" />
    <path d="m389 302 10-10m3 13 9-8m-26-3 8-10" stroke="#5b80d6" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

export function HomePage() {
  return <div className="home-page">
    <a className="home-skip" href="#tools">টুলের তালিকায় যান</a>
    <header className="home-header">
      <div className="home-container home-header-inner">
        <Link className="home-brand" href="/" aria-label={brand.name + " — প্রথম পাতা"}><BrandMark /><span>{brand.name}</span></Link>
        <nav className="home-nav" aria-label="মূল মেনু">
          <Link href="/#tools">সব টুল</Link><Link href="/about">এই উদ্যোগ</Link><Link className="home-nav-privacy" href="/privacy">গোপনীয়তা</Link>
        </nav>
      </div>
    </header>
    <main id="main">
      <section className="home-container home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-kicker"><span aria-hidden="true" />ছোট্ট সব কাজের জায়গা</p>
          <h1 id="home-title">একটু সময়,<br /><span>নিজের মতো কিছু।</span></h1>
          <p className="home-lead">ছবি বানান, স্মৃতি সাজান, রোজকার কাজ গুছিয়ে নিন। ছোট ছোট ২০টি টুল—সব বাংলায়, সব বিনামূল্যে।</p>
          <div className="home-hero-action">
            <a className="home-primary" href="#tools">সবগুলো দেখুন<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><path d="M10 3v13m-5-5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            <span>অ্যাকাউন্ট খুলতে হবে না</span>
          </div>
        </div>
        <div className="home-hero-art"><DeskIllustration /><p>একটু আঁকিবুঁকি। একটু নিজের গল্প।</p></div>
      </section>
      <ToolDirectory />
      <section className="home-container home-note" aria-labelledby="home-note-title">
        <div className="home-note-mark" aria-hidden="true"><svg width="74" height="78" viewBox="0 0 74 78" fill="none"><path d="m6 12 53-6 9 62-53 6Z" fill="#ffca54" /><path d="m24 25 21-3m-19 14 25-3m-23 14 14-2" stroke="#192943" strokeWidth="2" strokeLinecap="round" /><path d="m52 46 9-12 7 5-9 12-10 8Z" fill="#e44b32" stroke="#192943" strokeWidth="1.5" /></svg></div>
        <div><h2 id="home-note-title">বানালেন? রেখে দিন, চাইলে ভাগ করে নিন।</h2><p>টুলভেদে ছবি, লেখা বা প্রিন্ট রাখার ব্যবস্থা আছে। কোনটা কীভাবে রাখবেন, সেই পাতাতেই পাবেন। কাউকে পাঠাবেন কি না, তা আপনার ইচ্ছা।</p></div>
        <Link href="/privacy">আপনার তথ্য নিয়ে জানুন<Arrow /></Link>
      </section>
      <section className="home-container home-faq" aria-labelledby="home-faq-title">
        <div><p className="home-kicker">জেনে রাখুন</p><h2 id="home-faq-title">আর কিছু<br />জানতে চান?</h2><p>শুরু করার আগে<br />কয়েকটি সহজ উত্তর।</p></div>
        <div className="home-faq-list">{homeFaq.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
      </section>
    </main>
    <footer className="home-footer">
      <div className="home-container home-footer-inner">
        <div><Link className="home-brand" href="/"><BrandMark /><span>{brand.name}</span></Link><p>বাংলায় ছোট ছোট কাজ, নিজের মতো করে।</p></div>
        <nav className="home-nav" aria-label="আরও জানুন"><Link href="/#tools">সব টুল</Link><Link href="/about">এই উদ্যোগ</Link><Link href="/privacy">গোপনীয়তা</Link></nav>
      </div>
    </footer>
  </div>;
}

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h11M9 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
