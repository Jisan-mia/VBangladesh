import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { NightRoom } from "./components/night-room";

export default function RaatJagaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="raat">
        <section className="raat-hero container" aria-labelledby="raat-title">
          <p className="raat-kicker">বিশ্বকাপ · ১৯৯০–২০২৬ · মাঝরাতের ২০টা ম্যাচ</p>
          <h1 id="raat-title">বিশ্বকাপের কয় রাত <span>জেগেছ?</span></h1>
          <p className="raat-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="রাত দাগাও"><NightRoom /></section>
        <section className="container section raat-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section raat-suggest" aria-label="ম্যাচের পরামর্শ"><SuggestBox tool="raat-jaga" question="কোন রাতটা থাকা উচিত ছিল?" placeholder="যেমন: ২০১০ উরুগুয়ে-ঘানা, রাত সাড়ে ১২টা" /></section>
      </div>
    </PageFrame>
  );
}
