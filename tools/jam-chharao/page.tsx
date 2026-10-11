import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { JamGame } from "./components/jam-game";

export default function JamChharaoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jc-page">
        <section className="jc-hero container" aria-labelledby="jc-title">
          <h1 id="jc-title">{site.headline}</h1>
          <p className="jc-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জ্যাম ছাড়াও খেলো"><JamGame /></section>
        <section className="container section jc-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
