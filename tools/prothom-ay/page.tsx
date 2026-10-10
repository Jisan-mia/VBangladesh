import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { FirstPayBuilder } from "./components/first-pay-builder";
import { Captions } from "./components/captions";
import { bn } from "./lib/first-pay";

export default function ProthomAyPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="prothom">
        <section className="prothom-hero container" aria-labelledby="prothom-title">
          <p className="prothom-kicker">বাদামি বেতনের খাম · তিন ছোঁয়ায়</p>
          <h1 id="prothom-title">প্রথম আয়ের টাকায় <span>কী করেছিলে?</span></h1>
          <p className="prothom-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="প্রথম আয়ের খাম বানাও"><FirstPayBuilder /></section>
        <section className="container section prothom-captions" aria-labelledby="captions-title">
          <h2 id="captions-title">প্রথম আয় নিয়ে ক্যাপশন</h2>
          <p>কার্ডের সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section prothom-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section prothom-suggest" aria-label="নতুন কিছুর পরামর্শ"><SuggestBox tool="prothom-ay" question="প্রথম আয়ে এমন কী করেছিলে, যা তালিকায় নেই?" placeholder="যেমন: দাদির জন্য জায়নামাজ, ছোট বোনের সাইকেল" /></section>
      </div>
    </PageFrame>
  );
}
