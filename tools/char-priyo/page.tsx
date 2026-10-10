import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { ShelfBuilder } from "./components/shelf-builder";
import { bn } from "./lib/shelf";

export default function CharPriyoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="char-priyo">
        <section className="cp-hero container" aria-labelledby="cp-title">
          <p className="cp-hero-kicker">নীলক্ষেতের তাক · নাটক, সিনেমা, বই, গান</p>
          <h1 id="cp-title">চারটা প্রিয়, <span>এক তাকে</span></h1>
          <p className="cp-hero-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="চার প্রিয় সাজাও"><ShelfBuilder /></section>
        <section className="container section cp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section" aria-label="তালিকার পরামর্শ"><SuggestBox tool="char-priyo" question="কোন নাটক, সিনেমা, বই বা গান তালিকায় থাকা উচিত?" placeholder="যেমন: প্রিয় একটা ঈদের নাটক আর তার নির্মাতার নাম" /></section>
      </div>
    </PageFrame>
  );
}
