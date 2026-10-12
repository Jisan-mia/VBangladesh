import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PoneroGame } from "./components/ponero-game";

export default function PoneroGhorPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pg-page">
        <section className="pg-hero container" aria-labelledby="pg-title">
          <h1 id="pg-title">{site.headline}</h1>
          <p className="pg-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="১৫ ঘরের ধাঁধা খেলো"><PoneroGame /></section>
        <section className="container section pg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
