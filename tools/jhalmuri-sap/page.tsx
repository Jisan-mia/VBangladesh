import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { SnakeGame } from "./components/snake-game";

export default function JhalmuriSapPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="js-page">
        <section className="js-hero container" aria-labelledby="js-title">
          <h1 id="js-title"><span className="js-hero-kicker">পুরোনো দিনের সাপের গেম, এবার ঠোঙায়</span> সাপটা ঝালমুড়ি খাবে, <span>তুমি চালাও</span></h1>
          <p className="js-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ঝালমুড়ি সাপ খেলো"><SnakeGame /></section>
        <section className="container section js-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
