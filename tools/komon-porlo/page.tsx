import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { QuestionPaper } from "./components/question-paper";
import { site } from "./content";

export default function KomonPorloPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="komon-page">
        <section className="container komon-hero" aria-labelledby="komon-title">
          <p className="komon-hero-kicker">১০টা বিষয় · প্রতিটায় ১৬টা প্রশ্ন</p>
          <h1 id="komon-title">আত্মীয়দের প্রশ্ন: <span>কয়টা কমন পড়ল?</span></h1>
          <p className="komon-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="প্রশ্নপত্র দাগাও"><QuestionPaper /></section>
        <section className="container section komon-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section komon-suggest" aria-label="প্রশ্নের পরামর্শ"><SuggestBox tool="komon-porlo" question="কোন প্রশ্নটা থাকা উচিত ছিল?" placeholder="যেমন: “আবার কবে আসবে?”" /></section>
      </div>
    </PageFrame>
  );
}
