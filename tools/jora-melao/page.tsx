import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PairsGame } from "./components/pairs-game";

export default function JoraMelaoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jm-page">
        <section className="jm-hero container" aria-labelledby="jm-title">
          <h1 id="jm-title"><span className="jm-hero-kicker">মেমোরি গেম · একা বা দুজনে</span> {site.headline}</h1>
          <p className="jm-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জোড়া মেলাও খেলো"><PairsGame /></section>
        <section className="container section jm-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
