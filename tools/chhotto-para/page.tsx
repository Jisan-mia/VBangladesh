import './product.css';
import { PageFrame, Faq, JsonLd } from '../../shared/site-shell';
import { site } from './content';
import { SceneComposer } from './components/SceneComposer';

export default function Home() {
  return <PageFrame site={site}>
    <JsonLd site={site}/>
    <div className="para-home">
      <section className="para-hero container" aria-labelledby="para-heading"><div><p className="eyebrow"><span aria-hidden="true"/>চেনা জিনিস, নিজের গল্প</p><h1 id="para-heading">ছোট্ট একটা পাড়া,<br/><span>আপনার মতো করে</span></h1></div><div className="para-hero-right"><p>{site.lead}</p><a href="#tool" className="button">{site.cta}<span aria-hidden="true">↘</span></a><small>বিনামূল্যে · নিজের মতো সাজিয়ে ছবি নামান</small></div></section>
      <SceneComposer/>
      <section className="para-note container" aria-labelledby="para-note-heading"><span className="para-note-mark" aria-hidden="true">“</span><div><p className="eyebrow">একই জিনিস, আলাদা দৃশ্য</p><h2 id="para-note-heading">আপনার বিকেলটা<br/>কেমন ছিল?</h2></div><p>আমগাছের ছায়ায় বসবেন, নাকি ছাদে ঘুড়ি ওড়াবেন? জিনিসগুলো একটু সরালেই গল্প বদলে যায়। সাজানো ছবিটা বন্ধুকে পাঠিয়ে তাঁর দৃশ্যটাও দেখতে চাইতে পারেন।</p></section>
    </div>
    <Faq items={site.faq}/>
  </PageFrame>;
}
