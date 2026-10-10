import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { JerseyStall } from "./components/jersey-stall";
import { site } from "./content";

export default function AmarJerseyPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jersey-page">
        <section className="container jersey-hero" aria-labelledby="jersey-title">
          <p className="jersey-hero-kicker">ক্রিকেট বা ফুটবল · নাম আর নম্বর ছাপাও</p>
          <h1 id="jersey-title">পিঠে নিজের নাম, <span>পছন্দের নম্বর</span></h1>
          <p className="jersey-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জার্সি বানাও"><JerseyStall /></section>
        <section className="container section jersey-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section jersey-suggest" aria-label="রঙের পরামর্শ"><SuggestBox tool="amar-jersey" question="কোন রঙের জার্সি থাকা উচিত ছিল?" placeholder="যেমন: মেরুন-সাদা, গোলাপি" /></section>
      </div>
    </PageFrame>
  );
}
