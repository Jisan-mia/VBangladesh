import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ChitGame } from "./components/chit-game";
import { site } from "./content";

export default function ChitPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sg-page">
        <section className="sg-hero container" aria-labelledby="sg-title">
          <p className="sg-hero-kicker">{site.name} · ক্লাসে চিরকুট চালাচালি</p>
          <h1 id="sg-title">{site.headline}</h1>
          <p className="sg-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="চিরকুট চালিয়ে খেলো"><ChitGame /></section>
        <section className="container section sg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
