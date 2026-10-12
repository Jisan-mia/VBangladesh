import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SatCharaGame } from "./components/sat-chara-game";
import { site } from "./content";

export default function SatCharaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sc-page">
        <section className="sc-hero container" aria-labelledby="sc-title">
          <h1 id="sc-title">{site.headline}</h1>
          <p className="sc-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সাত চাড়া খেলো"><SatCharaGame /></section>
        <section className="container section sc-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
