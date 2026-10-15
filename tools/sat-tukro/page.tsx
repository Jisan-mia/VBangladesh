import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { TangramGame } from "./components/tangram-game";
import { parentNote, site } from "./content";

export default function SatTukroPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="st-page">
        <section className="st-hero container" aria-labelledby="st-title">
          <h1 id="st-title">{site.headline}</h1>
          <ParentNote slug={site.slug} {...parentNote} />
        </section>
        <section className="container" id="tool" aria-label="সাত টুকরো খেলো"><TangramGame /></section>
        <section className="container section st-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
