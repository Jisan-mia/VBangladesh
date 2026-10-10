import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { OrderBuilder } from "./components/order-builder";
import { Captions } from "./components/captions";

export default function TongPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="tong-page">
        <section className="tong-hero container" aria-labelledby="tong-title">
          <p className="tong-hero-kicker">চা · বিস্কুট · আড্ডা</p>
          <h1 id="tong-title">মামা, এক কাপ চা —<br /><span>কেমন?</span></h1>
          <p className="tong-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="টং-এর অর্ডার"><OrderBuilder /></section>
        <section className="container section tong-caption-section" aria-labelledby="captions-title">
          <h2 id="captions-title">চা নিয়ে ক্যাপশন</h2>
          <p>চিরকুটের ছবির সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section tong-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section tong-suggest" aria-label="চায়ের পরামর্শ"><SuggestBox tool="tong" question="তোমার এলাকার টং-এ কোন চা বা নাশতাটা নেই?" placeholder="যেমন: গুড়ের চা, পেঁয়াজু" /></section>
      </div>
    </PageFrame>
  );
}
