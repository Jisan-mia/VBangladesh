import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { RiverGame } from "./components/river-game";
import { site } from "./content";

export default function NodiParPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="np-page">
        <section className="np-hero container" aria-labelledby="np-title">
          <h1 id="np-title"><span className="np-hero-kicker">লাফের গেম · ৩০টা নদী</span> {site.headline}</h1>
          <p className="np-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="নদী পার খেলো"><RiverGame /></section>
        <section className="container section np-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
