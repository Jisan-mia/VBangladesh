import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { OjogorGame } from "./components/ojogor-game";
import { site } from "./content";

export default function OTeOjogorPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="oj-page">
        <section className="oj-hero container" aria-labelledby="oj-title">
          <h1 id="oj-title">{site.headline}</h1>
          <p className="oj-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="অ-তে অজগর খেলো"><OjogorGame /></section>
        <section className="container section oj-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
