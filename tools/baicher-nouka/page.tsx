import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BaichGame } from "./components/baich-game";

export default function BaicherNoukaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bn-page">
        <section className="bn-hero container" aria-labelledby="bn-title">
          <p className="bn-hero-kicker">ছোটবেলার রেসিং গেম, এবার নদীতে</p>
          <h1 id="bn-title">ঢোলের তালে বৈঠা, <span>সবার আগে ঘাটে!</span></h1>
          <p className="bn-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বাইচের নৌকা খেলো"><BaichGame /></section>
        <section className="container section bn-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
