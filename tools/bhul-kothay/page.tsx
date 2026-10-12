import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SpotGame } from "./components/spot-game";
import { site } from "./content";

export default function BhulKothayPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bk-page">
        <section className="bk-hero container" aria-labelledby="bk-title">
          <h1 id="bk-title"><span className="bk-hero-kicker">অমিল খোঁজার ধাঁধা · ৩০টা লেভেল</span> {site.headline}</h1>
          <p className="bk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ভুল কোথায়? খেলো"><SpotGame /></section>
        <section className="container section bk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
