import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { GpaBoard } from "./components/gpa-board";

export default function GpaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gpa-page">
        <section className="gpa-hero container" aria-labelledby="gpa-title">
          <p className="gpa-kicker">এসএসসি · এইচএসসি · ৪র্থ বিষয়সহ</p>
          <h1 id="gpa-title">তোমার জিপিএ <span>কত হলো?</span></h1>
          <p className="gpa-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জিপিএ হিসাব করো"><GpaBoard /></section>
        <section className="container section gpa-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
