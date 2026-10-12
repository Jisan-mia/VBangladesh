import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { MarbleGame } from "./components/marble-game";
import { site } from "./content";

export default function MarbleSinriPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ms-page">
        <section className="ms-hero container" aria-labelledby="ms-title">
          <h1 id="ms-title">{site.headline}</h1>
          <p className="ms-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মার্বেল-সিঁড়ি খেলো"><MarbleGame /></section>
        <section className="container section ms-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
