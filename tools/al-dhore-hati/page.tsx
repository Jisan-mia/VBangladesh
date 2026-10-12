import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { AlGame } from "./components/al-game";
import { site } from "./content";

export default function AlDhoreHatiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="al-page">
        <section className="al-hero container" aria-labelledby="al-title">
          <h1 id="al-title">{site.headline}</h1>
          <p className="al-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="আল ধরে হাঁটি খেলো"><AlGame /></section>
        <section className="container section al-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
