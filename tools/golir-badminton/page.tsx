import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { BadmintonGame } from "./components/badminton-game";
import { site } from "./content";

export default function GolirBadmintonPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gb-page">
        <section className="gb-hero container" aria-labelledby="gb-title">
          <h1 id="gb-title">{site.headline}</h1>
          <p className="gb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="গলির ব্যাডমিন্টন খেলো"><BadmintonGame /></section>
        <section className="container section gb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
