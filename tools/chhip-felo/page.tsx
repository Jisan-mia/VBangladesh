import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { FishingGame } from "./components/fishing-game";
import { site } from "./content";

export default function ChhipFeloPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cf-page">
        <section className="cf-hero container" aria-labelledby="cf-title">
          <h1 id="cf-title">{site.headline}</h1>
          <p className="cf-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ছিপ ফেলে মাছ ধরো"><FishingGame /></section>
        <section className="container section cf-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
