import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { HandiGame } from "./components/handi-game";

export default function HandiBhangaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="hb-page">
        <section className="hb-hero container" aria-labelledby="hb-title">
          <h1 id="hb-title"><span className="hb-hero-kicker">বল দিয়ে ইট ভাঙার সেই গেম, এবার মেলার হাঁড়িতে</span> {site.headline}</h1>
          <p className="hb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="হাঁড়িভাঙা খেলো"><HandiGame /></section>
        <section className="container section hb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
