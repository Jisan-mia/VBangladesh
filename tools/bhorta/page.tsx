import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { Shilpata } from "./components/shilpata";
import { site } from "./content";

export default function BhortaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bh-page">
        <section className="container bh-hero" aria-labelledby="bh-title">
          <p className="bh-hero-kicker">শিলপাটা · ৬টা প্রশ্ন · শুধু মজার জন্য</p>
          <h1 id="bh-title">তুমি কোন <span>ভর্তা?</span></h1>
          <p className="bh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="তোমার ভর্তা বাটো"><Shilpata /></section>
        <section className="container section bh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
