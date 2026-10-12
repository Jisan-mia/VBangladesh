import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { SudokuGame } from "./components/sudoku-game";

export default function SudokuPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sd-page">
        <section className="sd-hero container" aria-labelledby="sd-title">
          <h1 id="sd-title">{site.headline}</h1>
          <p className="sd-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সুডোকু খেলো"><SudokuGame /></section>
        <section className="container section sd-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
