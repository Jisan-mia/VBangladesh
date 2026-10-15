import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { KarGame } from "./components/kar-game";
import { parentNote, site } from "./content";

export default function KarChinhoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="kc-page">
        <section className="kc-hero container" aria-labelledby="kc-title">
          <h1 id="kc-title">{site.headline}</h1>
          <ParentNote slug={site.slug} {...parentNote} />
        </section>
        <section className="container" id="tool" aria-label="কার-চিহ্ন বসাও খেলো"><KarGame /></section>
        <section className="container section kc-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
