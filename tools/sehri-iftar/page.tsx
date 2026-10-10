import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { PocketCard } from "./components/pocket-card";

export default function SehriIftarPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="si">
        <section className="si-hero container" aria-labelledby="si-title">
          <p className="si-kicker">রমজান ১৪৪৮ · ৬৪ জেলা</p>
          <h1 id="si-title">আজ সেহরি আর <span>ইফতার কখন?</span></h1>
          <p className="si-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জেলার সময় দেখো"><PocketCard /></section>
        <section className="container section si-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section si-suggest" aria-label="ভুল জানাও"><SuggestBox tool="sehri-iftar" question="কোনো সময় বা জেলার নামে ভুল চোখে পড়ল?" placeholder="যেমন: কুমিল্লার ইফতারের সময় মেলে না" /></section>
      </div>
    </PageFrame>
  );
}
