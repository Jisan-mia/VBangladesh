import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { LatimGame } from "./components/latim-game";

export default function LatimPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="lt-page">
        <section className="lt-hero container" aria-labelledby="lt-title">
          <h1 id="lt-title"><span className="lt-hero-kicker">{site.name} · উঠানের দেশি খেলা</span> {site.headline}</h1>
          <p className="lt-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="লাটিম খেলো"><LatimGame /></section>
        <section className="container lt-field-note" aria-label="আসল লাটিম খেললে">
          <p><b>আসল লাটিম খেলবে?</b> লাটিমের নিচে লোহার পেরেক থাকে। ছোড়ার সময় সামনে যেন কেউ না থাকে, বিশেষ করে ছোট বাচ্চা। আর আসল টিনের চালে উঠে খেলবে না।</p>
        </section>
        <section className="container section lt-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
