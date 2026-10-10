import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { WeighingMachine } from "./components/weighing-machine";
import { site } from "./content";

export default function MonerBoyosPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mb-page">
        <section className="container mb-hero" aria-labelledby="mb-title">
          <p className="mb-hero-kicker">মেলার মেশিন · ৮টা চাপ · শুধু মজার জন্য</p>
          <h1 id="mb-title">শরীরের বয়স জানো, <span>মনের বয়স কত?</span></h1>
          <p className="mb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মনের বয়স মাপো"><WeighingMachine /></section>
        <section className="container section mb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
