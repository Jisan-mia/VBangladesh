import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { PassportBuilder } from "./components/passport-builder";
import { Captions } from "./components/captions";
import { bn } from "./lib/probash";

export default function ProbashPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="probash">
        <section className="pb-hero container" aria-labelledby="pb-title">
          <p className="pb-hero-kicker">৪০টা মুহূর্ত · পাসপোর্টের পাতায় সিল</p>
          <h1 id="pb-title">প্রবাস জীবনের <span>কয়টা মুহূর্ত তোমার?</span></h1>
          <p className="pb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="প্রবাস জীবনের মুহূর্ত মেলাও"><PassportBuilder /></section>
        <section className="container section pb-captions-section" aria-labelledby="captions-title">
          <h2 id="captions-title">প্রবাস জীবন নিয়ে ক্যাপশন</h2>
          <p>পাসপোর্টের ছবির সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section pb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section pb-suggest" aria-label="নতুন মুহূর্তের পরামর্শ"><SuggestBox tool="probash" question="কোন মুহূর্তটা তালিকায় থাকা উচিত ছিল?" placeholder="যেমন: বিদেশে প্রথম বৃষ্টির দিন" /></section>
      </div>
    </PageFrame>
  );
}
