import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PosterBuilder } from "./components/poster-builder";

export default function CinemaPosterPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cp">
        <section className="cp-hero container" aria-labelledby="cp-title">
          <p className="cp-kicker">হাতে আঁকা সিনেমা হলের পোস্টার</p>
          <h1 id="cp-title"><span>আসিতেছে!</span> তোমার নামে সিনেমা</h1>
        </section>
        <section className="container" id="tool" aria-label="সিনেমার পোস্টার বানাও"><PosterBuilder /></section>
        <section className="container section cp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.lead}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
