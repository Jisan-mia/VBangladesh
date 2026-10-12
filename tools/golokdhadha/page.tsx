import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { MazeGame } from "./components/maze-game";

export default function GolokdhadhaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gd-page">
        <section className="gd-hero container" aria-labelledby="gd-title">
          <h1 id="gd-title">{site.headline}</h1>
          <p className="gd-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="গোলকধাঁধা খেলো"><MazeGame /></section>
        <section className="container section gd-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
