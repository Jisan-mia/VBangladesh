import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { ShelfBuilder } from "./components/shelf-builder";
import { Captions } from "./components/captions";
import { bn } from "./lib/shelf";

export default function HimuPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="humayun">
        <section className="hm-hero container" aria-labelledby="hm-title">
          <p className="hm-hero-kicker">১৩ নভেম্বর তাঁর জন্মদিন · ৩০টা চেনা বই</p>
          <h1 id="hm-title">হুমায়ূন আহমেদের <span>কয়টা বই পড়েছ?</span></h1>
          <p className="hm-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বইয়ের তাক মেলাও"><ShelfBuilder /></section>
        <section className="container section hm-captions-wrap" aria-labelledby="captions-title">
          <h2 id="captions-title">হুমায়ূন আহমেদকে নিয়ে ক্যাপশন</h2>
          <p>কার্ডের সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section hm-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section hm-suggest" aria-label="বইয়ের পরামর্শ"><SuggestBox tool="himu" question="কোন বইটা তাকে থাকা উচিত ছিল?" placeholder="যেমন: অপেক্ষা, মেঘ বলেছে যাব যাব" /></section>
      </div>
    </PageFrame>
  );
}
