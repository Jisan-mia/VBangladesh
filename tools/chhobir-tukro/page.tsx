import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { JigsawGame } from "./components/jigsaw-game";
import { site } from "./content";

export default function ChhobirTukroPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ct-page">
        <section className="ct-hero container" aria-labelledby="ct-title">
          <h1 id="ct-title"><span className="ct-hero-kicker">জিগস পাজল · ৩০টা লেভেল</span> {site.headline}</h1>
          <p className="ct-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ছবির টুকরো খেলো"><JigsawGame /></section>
        <section className="container section ct-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
