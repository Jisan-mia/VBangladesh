import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { AlpanaPattern } from "./components/alpana-pattern";
import { AlpanaStudio } from "./components/alpana-studio";
import { defaultSettings } from "./lib/pattern";

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site} /><div className="alpana">
    <section className="alpana-hero container alpana-screen" aria-labelledby="alpana-title">
      <div className="alpana-hero-copy"><p className="eyebrow">পহেলা বৈশাখ, একুশে, গায়ে হলুদ</p><h1 id="alpana-title">আলপনা আঁকতে<br /><span>হাত পাকা লাগবে না।</span></h1><p className="alpana-lead">{site.lead}</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="alpana-hero-note">ফ্রি · অ্যাকাউন্ট লাগে না</p></div>
      <figure className="alpana-hero-art"><AlpanaPattern settings={defaultSettings} /><figcaption><span>মাটির রঙে সাদা নকশা</span><span>একটা নমুনা</span></figcaption></figure>
    </section>
    <section className="alpana-studio-section container" id="tool" aria-labelledby="studio-heading"><div className="alpana-tool-heading alpana-screen"><div><p className="eyebrow">ফুল, পাতা আর বাংলার নকশা</p><h2 id="studio-heading">এবার তোমার আলপনা</h2></div><p>মোটিফ বেছে সাজাও, নয়তো নিজে আঁকো।<br />ভুল হলে এক ধাপ ফিরে যাও।</p></div><AlpanaStudio /></section>
    <section className="alpana-use container section alpana-screen" aria-labelledby="use-heading"><div><p className="eyebrow">পর্দা থেকে কাগজে</p><h2 id="use-heading">ছবি রাখো।<br />হাতে আঁকো।</h2></div><div className="alpana-use-copy"><p><strong>ছবি হিসেবে</strong> — ফোনে রাখো, স্টোরিতে দাও, দাওয়াতের কার্ডে বসাও। তোমার বাছা রংগুলোই ছবিতে থাকবে।</p><p><strong>হাতে আঁকার জন্য</strong> — একই নকশার কালো রেখা এক পাতায় প্রিন্ট করো। পাশে রেখে দেখে দেখে আঁকো, নয়তো ট্রেস করো। বড় মেঝেতে একই মাপে আঁকার মাপজোখ এতে নেই।</p><p><strong>সবাই মিলে আঁকতে</strong> — বৈশাখের আগের রাতে স্কুল, পাড়া বা বাড়ির সবাই নকশাটা দেখে ভাগ করে আঁকতে পারো। কোথায় আঁকবে তার অনুমতি, আর রং-তুলি আগেই জোগাড় করে রেখো।</p></div></section>
    <section className="alpana-origin container alpana-screen" aria-labelledby="origin-heading"><div className="alpana-origin-mark" aria-hidden="true"><svg viewBox="-38 -69 76 76" stroke="currentColor" fill="none" strokeWidth="1.4"><path d="M0 0C-27-13-31-41 0-62C31-41 27-13 0 0ZM0-4V-54M0-17l-14-13M0-28l14-13" /></svg></div><div><h2 id="origin-heading">ঐতিহ্য থেকে ধারণা, নতুন করে আঁকা</h2><p>বাংলার আলপনায় ফুল, পাতা আর জ্যামিতিক নকশার নানা রকম ব্যবহার আছে। এখানকার মোটিফগুলো সেখান থেকে ধারণা নিয়ে নতুন করে আঁকা, কোনো নির্দিষ্ট আচার বা শিল্পীর নকশার কপি না। আলপনার ইতিহাস জানতে <a href="https://en.banglapedia.org/index.php?title=Alpana" rel="external">বাংলাপিডিয়া পড়ো ↗</a>।</p></div></section>
    <Faq items={site.faq} />
  </div></PageFrame>;
}
