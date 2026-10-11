import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { CycleGame } from "./components/cycle-game";

export default function PeonerCyclePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pc-page">
        <section className="pc-hero container" aria-labelledby="pc-title">
          <p className="pc-hero-kicker">ছোটবেলার ব্রিক গেমের রেস, এবার গ্রামের পথে</p>
          <h1 id="pc-title">ভোরের পথে চিঠি নিয়ে, <span>ক্রিং ক্রিং!</span></h1>
          <p className="pc-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="পিয়নের সাইকেল খেলো"><CycleGame /></section>
        <section className="container section pc-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
