import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { GolperGame } from "./components/golper-game";
import { parentNote, site } from "./content";

export default function GolperMorPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gm-page">
        <section className="gm-hero container" aria-labelledby="gm-title">
          <h1 id="gm-title">{site.headline}</h1>
          <ParentNote slug={site.slug} {...parentNote} />
        </section>
        <section className="container" id="tool" aria-label="গল্পের মোড় পড়ো"><GolperGame /></section>
        <section className="container section gm-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map(step => <li key={step}>{step}</li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
