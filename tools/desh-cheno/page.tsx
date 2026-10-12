import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { ChartQuiz } from "./components/chart-quiz";

export default function DeshChenoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="desh-page">
        <section className="desh-hero container" aria-labelledby="desh-title">
          <h1 id="desh-title"><span className="desh-kicker">বাংলাদেশ কুইজ · সাধারণ জ্ঞানের ১০টা প্রশ্ন</span> নিজের দেশটা <span>কতটা চেনো?</span></h1>
          <p className="desh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দেশ চেনো কুইজ"><ChartQuiz /></section>
        <section className="container section desh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section desh-suggest" aria-label="প্রশ্নের পরামর্শ"><SuggestBox tool="desh-cheno" question="কোন প্রশ্নটা থাকা উচিত, বা কোথাও ভুল চোখে পড়ল?" placeholder="যেমন: জেলার বিখ্যাত খাবার নিয়ে প্রশ্ন চাই" /></section>
      </div>
    </PageFrame>
  );
}
