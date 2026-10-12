import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BangleGame } from "./components/bangle-game";

export default function ChurirBazarPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cb-page">
        <section className="cb-hero container" aria-labelledby="cb-title">
          <h1 id="cb-title">{site.headline}</h1>
          <p className="cb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="চুড়ির বাজার খেলো"><BangleGame /></section>
        <section className="container section cb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
