import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { LetterBuilder } from "./components/letter-builder";
import { bn } from "./lib/chithi";

export default function ChithiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ch-page">
        <section className="ch-hero container" aria-labelledby="ch-title">
          <p className="ch-kicker">হলুদ খাম · নীল প্যাড · ডাকটিকিট</p>
          <h1 id="ch-title">অনেক দিন চিঠি <span>লেখা হয় না</span></h1>
          <p className="ch-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="চিঠি লেখো"><LetterBuilder /></section>
        <section className="container section ch-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
