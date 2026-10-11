import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { CarromGame } from "./components/carrom-game";

export default function CarromPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cr-page">
        <section className="cr-hero container" aria-labelledby="cr-title">
          <p className="cr-kicker">ক্লাবঘরের সেই বোর্ড, এখন ফোনে · একা বা দুজনে</p>
          <h1 id="cr-title">{site.headline}</h1>
          <p className="cr-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ক্যারম খেলো"><CarromGame /></section>
        <section className="container section cr-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
