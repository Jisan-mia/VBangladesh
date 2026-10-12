import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { QuiltGame } from "./components/quilt-game";

export default function ChhokJoraPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cj-page">
        <section className="cj-hero container" aria-labelledby="cj-title">
          <h1 id="cj-title"><span className="cj-hero-kicker">খাতার পাতার ডট-বক্স খেলা, এবার নকশিকাঁথায়</span> {site.headline}</h1>
          <p className="cj-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ছক-জোড়া খেলো"><QuiltGame /></section>
        <section className="container section cj-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
