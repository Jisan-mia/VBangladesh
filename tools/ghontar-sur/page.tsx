import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { PotGame } from "./components/pot-game";
import { site } from "./content";

export default function GhontarSurPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gs-page">
        <section className="gs-hero container" aria-labelledby="gs-title">
          <h1 id="gs-title"><span className="gs-hero-kicker">সুর মনে রাখার খেলা · ১০টা লেভেল</span> {site.headline}</h1>
          <p className="gs-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ঘণ্টার সুর খেলো"><PotGame /></section>
        <section className="container section gs-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
