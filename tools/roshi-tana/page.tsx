import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { RoshiGame } from "./components/roshi-game";
import { site } from "./content";

export default function RoshiTanaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="rt-page">
        <section className="rt-hero container" aria-labelledby="rt-title">
          <h1 id="rt-title">{site.headline}</h1>
          <p className="rt-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="রশি টানাটানি খেলো"><RoshiGame /></section>
        <section className="container section rt-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
