import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { WordSearch } from "./components/word-search";

export default function ShobdoKhojaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sk-page">
        <section className="sk-hero container" aria-labelledby="sk-title">
          <p className="sk-hero-kicker">ফুল, মাছ, পিঠা, নদী… যেটা খুশি</p>
          <h1 id="sk-title">{site.headline}</h1>
          <p className="sk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="শব্দ খোঁজা খেলো"><WordSearch /></section>
        <section className="container section sk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
