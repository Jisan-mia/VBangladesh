import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { MosharGame } from "./components/moshar-game";
import { site } from "./content";

export default function MosharRaatPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mr-page">
        <section className="mr-hero container" aria-labelledby="mr-title">
          <h1 id="mr-title">{site.headline}</h1>
          <p className="mr-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মশার রাত খেলো"><MosharGame /></section>
        <section className="container section mr-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
