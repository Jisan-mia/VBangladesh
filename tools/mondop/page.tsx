import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { MondopBuilder } from "./components/mondop-builder";
import { Captions } from "./components/captions";
import { bn, PUJA, pujaSpan, yearLabel } from "./lib/mondop";

export default function MondopPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mondop">
        <section className="mp-hero container" aria-labelledby="mp-title">
          <p className="mp-kicker">দুর্গাপূজা {yearLabel(PUJA.year)} · {pujaSpan()}</p>
          <h1 id="mp-title">এবার কয়টা <span>মণ্ডপ ঘুরলে?</span></h1>
          <p className="mp-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মণ্ডপ গোনো"><MondopBuilder /></section>
        <section className="container section mp-captions-wrap" aria-labelledby="captions-title">
          <h2 id="captions-title">পূজার মণ্ডপ নিয়ে ক্যাপশন</h2>
          <p>কার্ডের সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো। শুভ বিজয়ার আলাদা কার্ড চাইলে <a href="/shubhechha">শুভেচ্ছা কার্ড</a> দেখো।</p>
          <Captions />
        </section>
        <section className="container section mp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section mp-suggest" aria-label="নতুন মুহূর্তের পরামর্শ"><SuggestBox tool="mondop" question="পূজার কোন মুহূর্তটা তালিকায় নেই?" placeholder="যেমন: বিসর্জনের শোভাযাত্রা দেখা" /></section>
      </div>
    </PageFrame>
  );
}
