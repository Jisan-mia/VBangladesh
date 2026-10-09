import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { GamePicker } from "./components/game-picker";
import { PlaygroundArt } from "./components/playground-art";
import { site } from "./content";

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site} />
    <div className="play-page">
      <section className="container play-hero" aria-labelledby="play-title"><div className="play-hero-copy"><p className="eyebrow"><span aria-hidden="true" /> সবাই মিলে খেলার সময়</p><h1 id="play-title">সবাই একসঙ্গে?<br />এবার <span>কী খেলবেন?</span></h1><p className="play-lead">{site.lead}</p><a href="#tool" className="button play-hero-button">{site.cta}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6" /></svg></a><p className="play-hero-footnote">নিবন্ধন লাগে না · বসে ও মাঠে খেলার বিকল্প</p></div><div className="play-hero-art"><PlaygroundArt /><span className="play-art-caption">নিয়ম দেখে পরিচিতদের সঙ্গে খেলা শুরু করুন।</span></div></section>
      <section className="play-tool-section section" id="tool" aria-labelledby="picker-title"><div className="container"><div className="section-heading play-tool-heading"><div><p className="eyebrow">দলের সঙ্গে মিলিয়ে নিন</p><h2 id="picker-title">আপনাদের জন্য কোন খেলা?</h2></div><p>কতজন, কোথায় আর কী আছে জানান। নিচে নিয়ম দেখুন।</p></div><GamePicker /></div></section>
      <section className="container play-before" aria-labelledby="before-title"><div className="play-before-label"><p className="eyebrow">সবাই যেন খেলতে পারেন</p><h2 id="before-title">শুরুর আগে ঠিক করে নিন</h2></div><div className="play-before-copy"><p><strong>কোন নিয়মে খেলবেন, সবাই মিলে ঠিক করুন।</strong> এলাকাভেদে নিয়ম আলাদা হতে পারে। এখানে ছোট দলের জন্য প্রতিটি খেলার একটি সহজ রূপ দেওয়া আছে।</p><p><strong>জায়গা ও সবার সুবিধা দেখুন।</strong> চলাচলের রাস্তা বা ছাদে খেলবেন না। শিশুদের সঙ্গে দায়িত্বশীল বড় কেউ থাকুন। কেউ দৌড়াতে না চাইলে বসে খেলার বিকল্প বেছে নিন।</p><p><strong>দেখানো সময় আনুমানিক।</strong> যতক্ষণ ভালো লাগে খেলুন। যে কেউ বিরতি চাইতে বা থামতে পারেন।</p></div></section>
    </div><Faq items={site.faq} />
  </PageFrame>;
}
