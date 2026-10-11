import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { MilkGame } from "./components/milk-game";

export default function DudhUthlanoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="du-page">
        <section className="du-hero container" aria-labelledby="du-title">
          <p className="du-kicker">৫টা পাতিল · আধা মিনিটের খেলা</p>
          <h1 id="du-title">দুধটা দেখিস! <span>উথলানোর আগে নামাও</span></h1>
          <p className="du-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দুধ উথলানোর খেলা"><MilkGame /></section>
        <section className="container section du-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
