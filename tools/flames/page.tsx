import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { KhataPage } from "./components/khata-page";
import { site } from "./content";

export default function FlamesPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="flames-page">
        <section className="container flames-hero" aria-labelledby="flames-title">
          <p className="flames-hero-kicker">খাতার শেষ পাতার খেলা · F L A M E S</p>
          <h1 id="flames-title">দুই নাম, এক খেলা — <span>কী আসে?</span></h1>
          <p className="flames-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ফ্লেমস খেলো"><KhataPage /></section>
        <section className="container section flames-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
