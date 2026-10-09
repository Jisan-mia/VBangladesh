import './product.css';
import { PageFrame, Faq, JsonLd } from '../../shared/site-shell';
import { site } from './content';
import { SceneComposer } from './components/SceneComposer';

export default function Home() {
  return <PageFrame site={site}>
    <JsonLd site={site}/>
    <div className="para-home">
      <section className="para-hero container" aria-labelledby="para-heading"><div><p className="eyebrow"><span aria-hidden="true"/>চেনা জিনিস, নিজের গল্প</p><h1 id="para-heading">ছোট্ট একটা পাড়া,<br/><span>ঠিক তোমার মতো</span></h1></div><div className="para-hero-right"><p>{site.lead}</p><a href="#tool" className="button">{site.cta}<span aria-hidden="true">↘</span></a><small>ফ্রি · অ্যাকাউন্ট লাগে না</small></div></section>
      <SceneComposer/>
      <section className="para-note container" aria-labelledby="para-note-heading"><span className="para-note-mark" aria-hidden="true">“</span><div><p className="eyebrow">একই জিনিস, আলাদা দৃশ্য</p><h2 id="para-note-heading">তোমার ছোটবেলার<br/>বিকেলটা কেমন ছিল?</h2></div><p>আমগাছের ছায়ায় শীতলপাটি, নাকি ছাদে ঘুড়ি আর চায়ের কাপ? জিনিসগুলো একটু এদিক-ওদিক করলেই গল্প বদলে যায়। ছবিটা বন্ধুকে পাঠাও, তারপর জিজ্ঞেস করো, তার পাড়াটা কেমন ছিল।</p></section>
    </div>
    <Faq items={site.faq}/>
  </PageFrame>;
}
