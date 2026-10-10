import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { EidBuilder } from "./components/eid-builder";
import { Captions } from "./components/captions";
import { bn } from "./lib/eid";

export default function EiderDinPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="eid-day">
        <section className="eid-hero container" aria-labelledby="eid-title">
          <p className="eid-kicker">চাঁদরাত থেকে সন্ধ্যা · ২৫টা কাজ</p>
          <h1 id="eid-title">ঈদের দিন <span>কয়টা কাজ হলো?</span></h1>
          <p className="eid-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ঈদের দিনের টিক দাও"><EidBuilder /></section>
        <section className="container section eid-captions" aria-labelledby="captions-title">
          <h2 id="captions-title">ঈদ নিয়ে ক্যাপশন</h2>
          <p>হাতের ছবির সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section eid-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section eid-suggest" aria-label="নতুন কাজের পরামর্শ"><SuggestBox tool="eider-din" question="তোমার ঈদের কোন কাজটা তালিকায় নেই?" placeholder="যেমন: ঈদের দিন বাগানে ছবি তোলা" /></section>
      </div>
    </PageFrame>
  );
}
