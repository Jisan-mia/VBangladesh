import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { GamePicker } from "./components/game-picker";
import { PlaygroundArt } from "./components/playground-art";
import { site } from "./content";

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site} />
    <div className="play-page">
      <section className="container play-hero" aria-labelledby="play-title"><div className="play-hero-copy"><p className="eyebrow"><span aria-hidden="true" /> ফোন রেখে, সবাই মিলে</p><h1 id="play-title">সবাই একসাথে?<br />তাহলে <span>কী খেলবে?</span></h1><p className="play-lead">{site.lead}</p><a href="#tool" className="button play-hero-button">{site.cta}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" /></svg></a><p className="play-hero-footnote">ফ্রি · অ্যাকাউন্ট লাগে না · ঘরে বসে বা মাঠে</p></div><div className="play-hero-art"><PlaygroundArt /><span className="play-art-caption">এক্কাদোক্কার ঘর মনে আছে?</span></div></section>
      <section className="play-tool-section section" id="tool" aria-labelledby="picker-title"><div className="container"><div className="section-heading play-tool-heading"><div><p className="eyebrow">তিনটা প্রশ্ন, তারপর খেলা</p><h2 id="picker-title">তোমাদের জন্য কোন খেলা?</h2></div><p>কয়জন, কোথায়, কী আছে, বলো। নিয়ম নিচেই পাবে।</p></div><GamePicker /></div></section>
      <section className="container play-before" aria-labelledby="before-title"><div className="play-before-label"><p className="eyebrow">সবাই যেন খেলতে পারে</p><h2 id="before-title">শুরুর আগে একটু ঠিক করে নাও</h2></div><div className="play-before-copy"><p><strong>কোন নিয়মে খেলবে, সবাই মিলে ঠিক করো।</strong> এক এলাকার গোল্লাছুট আরেক এলাকায় একটু আলাদা। এখানে প্রতিটা খেলার একটা সহজ রূপ দেওয়া আছে।</p><p><strong>জায়গাটা আর সবার সুবিধা দেখো।</strong> রাস্তায় বা ছাদে খেলো না। ছোটদের সাথে দেখেশুনে রাখার মতো বড় কেউ থাকুক। কেউ দৌড়াতে না চাইলে বসে খেলার কোনোটা বাছো।</p><p><strong>সময়টা মোটামুটি হিসাব।</strong> যতক্ষণ ভালো লাগে খেলো। যে কেউ যখন খুশি একটু জিরিয়ে নিতে বা থামতে পারে।</p></div></section>
    </div><Faq items={site.faq} />
  </PageFrame>;
}
