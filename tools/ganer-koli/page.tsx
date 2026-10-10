import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { SingingLid } from "./components/singing-lid";

export default function GanerKoliPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="koli-page">
        <section className="koli-hero container" aria-labelledby="koli-title">
          <p className="koli-hero-kicker">হাঁড়ি থেকে অক্ষর · ডালায় চকের স্কোর</p>
          <h1 id="koli-title">গানের কলি খেলা, <span>এক ফোনে</span></h1>
          <p className="koli-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="গানের কলি খেলো"><SingingLid /></section>
        <section className="container section koli-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
