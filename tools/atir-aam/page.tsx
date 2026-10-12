import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { MangoGame } from "./components/mango-game";

export default function AtirAamPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="aa-page">
        <section className="aa-hero container" aria-labelledby="aa-title">
          <h1 id="aa-title">{site.headline}</h1>
          <p className="aa-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="আঁটি থেকে আম খেলো"><MangoGame /></section>
        <section className="container section aa-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
