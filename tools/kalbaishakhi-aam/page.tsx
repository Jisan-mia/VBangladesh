import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { MangoGame } from "./components/mango-game";

export default function KalbaishakhiAamPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ka-page">
        <section className="ka-hero container" aria-labelledby="ka-title">
          <p className="ka-hero-kicker">বোশেখের বিকেল · ৪৫ সেকেন্ডের খেলা</p>
          <h1 id="ka-title">ঝড় উঠেছে, <span>আম কুড়াও!</span></h1>
          <p className="ka-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="কালবৈশাখী আম খেলো"><MangoGame /></section>
        <section className="container section ka-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
