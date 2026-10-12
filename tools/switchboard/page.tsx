import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SwitchGame } from "./components/switch-game";
import { site } from "./content";

export default function SwitchboardPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sb-page">
        <section className="sb-hero container" aria-labelledby="sb-title">
          <h1 id="sb-title"><span className="sb-hero-kicker">বাতি জ্বালানোর ধাঁধা · ৩০টা লেভেল</span> {site.headline}</h1>
          <p className="sb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সুইচবোর্ড খেলো"><SwitchGame /></section>
        <section className="container section sb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
