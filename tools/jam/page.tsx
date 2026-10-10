import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { JamCalculator } from "./components/jam-calculator";

export default function JamPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jam-page">
        <section className="jam-hero container" aria-labelledby="jam-title">
          <p className="jam-hero-kicker">লোকাল বাসের রুট বোর্ডে নিজের হিসাব</p>
          <h1 id="jam-title">জ্যামে জীবনের <span>কত দিন গেল?</span></h1>
          <p className="jam-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জ্যামের হিসাব করো"><JamCalculator /></section>
        <section className="container section jam-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
