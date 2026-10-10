import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { Balcony } from "./components/balcony";
import { site } from "./content";

export default function DaknamPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="daknam-page">
        <section className="container daknam-hero" aria-labelledby="daknam-title">
          <p className="daknam-hero-kicker">তিনটা চাপ · বারান্দা থেকে ডাক</p>
          <h1 id="daknam-title">ছোটবেলায় তোমাকে <span>কী নামে ডাকত?</span></h1>
          <p className="daknam-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ডাকনাম বের করো"><Balcony /></section>
        <section className="container section daknam-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section daknam-suggest" aria-label="ডাকনামের পরামর্শ"><SuggestBox tool="daknam" question="কোন ডাকনামটা তালিকায় থাকা উচিত ছিল?" placeholder="যেমন: তোমার বাড়ির কারও ডাকনাম" /></section>
      </div>
    </PageFrame>
  );
}
