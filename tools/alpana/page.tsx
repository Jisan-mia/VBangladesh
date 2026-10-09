import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { AlpanaPattern } from "./components/alpana-pattern";
import { AlpanaStudio } from "./components/alpana-studio";
import { defaultSettings } from "./lib/pattern";

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site} /><div className="alpana">
    <section className="alpana-hero container alpana-screen" aria-labelledby="alpana-title">
      <div className="alpana-hero-copy"><p className="eyebrow">ফুল, পাতা আর বাংলার নকশা</p><h1 id="alpana-title">রঙ বাছুন,<br /><span>আলপনা সাজান।</span></h1><p className="alpana-lead">{site.lead}</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="alpana-hero-note">বিনামূল্যে · আঁকা না জানলেও হবে</p></div>
      <figure className="alpana-hero-art"><AlpanaPattern settings={defaultSettings} /><figcaption><span>মাটির রঙে সাদা নকশা</span><span>একটি নমুনা</span></figcaption></figure>
    </section>
    <section className="alpana-studio-section container" id="tool" aria-labelledby="studio-heading"><div className="alpana-tool-heading alpana-screen"><div><p className="eyebrow">আপনার পছন্দে নতুন বিন্যাস</p><h2 id="studio-heading">এবার আপনার আলপনা</h2></div><p>নকশা বেছে সাজান, অথবা নিজে আঁকুন।<br />ভুল হলে আগের ধাপে ফিরে যান।</p></div><AlpanaStudio /></section>
    <section className="alpana-use container section alpana-screen" aria-labelledby="use-heading"><div><p className="eyebrow">পর্দা থেকে কাগজে</p><h2 id="use-heading">ছবি রাখুন।<br />হাতে আঁকুন।</h2></div><div className="alpana-use-copy"><p><strong>ছবি হিসেবে</strong> — ফোনে রাখুন, কাউকে পাঠান বা নিজের কোনো ডিজাইনে ব্যবহার করুন। পিএনজিতে আপনার বেছে নেওয়া রঙ থাকবে।</p><p><strong>হাতে আঁকার জন্য</strong> — একই নকশার কালো রেখা এক পাতায় প্রিন্ট করুন। দেখে দেখে আঁকুন, অথবা ট্রেস করুন। বড় মেঝেতে একই মাপ পাওয়ার গাইড এটি নয়।</p><p><strong>একসঙ্গে কাজ করতে</strong> — স্কুল, পরিবার বা পাড়ার কাজে নকশা নিয়ে বসতে পারেন। জায়গায় আঁকার অনুমতি ও উপকরণ আগে ঠিক করে নিন।</p></div></section>
    <section className="alpana-origin container alpana-screen" aria-labelledby="origin-heading"><div className="alpana-origin-mark" aria-hidden="true"><svg viewBox="-38 -69 76 76" stroke="currentColor" fill="none" strokeWidth="1.4"><path d="M0 0C-27-13-31-41 0-62C31-41 27-13 0 0ZM0-4V-54M0-17l-14-13M0-28l14-13" /></svg></div><div><h2 id="origin-heading">ঐতিহ্য থেকে ধারণা, নতুন করে আঁকা</h2><p>বাংলার আলপনায় ফুল, পাতা ও জ্যামিতিক বিন্যাসের নানা ব্যবহার আছে। এই সাইটের মোটিফগুলো নতুন করে আঁকা; কোনো নির্দিষ্ট আচার বা শিল্পীর নকশার অনুলিপি নয়। আলপনার ইতিহাস জানতে <a href="https://en.banglapedia.org/index.php?title=Alpana" rel="external">বাংলাপিডিয়া পড়ুন ↗</a>।</p></div></section>
    <Faq items={site.faq} />
  </div></PageFrame>;
}
