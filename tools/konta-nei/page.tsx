import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { KontaGame } from "./components/konta-game";

export default function KontaNeiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="kn-page">
        <section className="kn-hero container" aria-labelledby="kn-title">
          <h1 id="kn-title">{site.headline}</h1>
          <p className="kn-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="কোনটা নেই? খেলো"><KontaGame /></section>
        <section className="container section kn-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
