import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { ChaBuilder } from "./components/cha-builder";

const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export default function ChaMudraPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cm-wrap">
        <section className="cm-hero container" aria-labelledby="cm-title">
          <p className="cm-kicker">মাটির ভাঁড়ের মিনার · মজার হিসাব</p>
          <h1 id="cm-title">এই দামে <span>কত কাপ চা?</span></h1>
          <p className="cm-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দামকে চায়ের কাপে মাপো"><ChaBuilder /></section>
        <section className="container section cm-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
