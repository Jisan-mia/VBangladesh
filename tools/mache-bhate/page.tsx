import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { DalaBuilder } from "./components/dala-builder";

export default function MacheBhatePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mb-page">
        <section className="mb-hero container" aria-labelledby="mb-title">
          <p className="mb-hero-kicker">৪০টা দেশি মাছ · নদী, বিল আর সাগরের</p>
          <h1 id="mb-title">দেশি মাছ, <span>কয়টা খেয়েছ?</span></h1>
          <p className="mb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মাছের ডালা সাজাও"><DalaBuilder /></section>
        <section className="container section mb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section mb-suggest" aria-label="মাছের পরামর্শ"><SuggestBox tool="mache-bhate" question="কোন মাছটা ডালায় থাকা উচিত ছিল?" placeholder="যেমন: বাটা, তপসে, কাজলি" /></section>
      </div>
    </PageFrame>
  );
}
