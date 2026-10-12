import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BaghbandiGame } from "./components/baghbandi-game";

export default function BaghbandiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bb-page">
        <section className="bb-hero container" aria-labelledby="bb-title">
          <h1 id="bb-title"><span className="bb-hero-kicker">বাঘবন্দি খেলা · উঠোনের দাগ, নুড়ি আর তেঁতুলের বিচি</span> {site.headline}</h1>
          <p className="bb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বাঘবন্দি খেলো"><BaghbandiGame /></section>
        <section className="container section bb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
