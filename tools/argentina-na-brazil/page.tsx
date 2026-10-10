import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { RoofBuilder } from "./components/roof-builder";

export default function ArgentinaNaBrazilPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="roof">
        <section className="roof-hero container" aria-labelledby="roof-title">
          <p className="roof-kicker">বিশ্বকাপ · ছাদের পতাকা</p>
          <h1 id="roof-title">তুমি কোন দলের? <span>ছাদে ওঠাও পতাকা</span></h1>
          <p className="roof-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দল বেছে পতাকা তোলো"><RoofBuilder /></section>
        <section className="container section roof-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section roof-suggest" aria-label="দলের পরামর্শ"><SuggestBox tool="argentina-na-brazil" question="আর কোন দলের পতাকা থাকা উচিত?" placeholder="যেমন: নেদারল্যান্ডস, ইতালি" /></section>
      </div>
    </PageFrame>
  );
}
