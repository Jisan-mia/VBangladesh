import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { HisabGame } from "./components/hisab-game";

export default function MukheMukheHisabPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mh-page-wrap">
        <section className="mh-hero container" aria-labelledby="mh-title">
          <h1 id="mh-title">{site.headline}</h1>
          <p className="mh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মুখে মুখে হিসাব খেলো"><HisabGame /></section>
        <section className="container section mh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
