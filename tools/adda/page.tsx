import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { Carrom } from "./components/carrom";
import { Captions } from "./components/captions";

export default function AddaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="adda-page">
        <section className="adda-hero container" aria-labelledby="adda-title">
          <p className="adda-kicker">ক্যারম বোর্ড · ৭টা প্রশ্ন · এক মিনিট</p>
          <h1 id="adda-title">আড্ডায় তুমি <span>কোন গুটি?</span></h1>
          <p className="adda-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="আড্ডার ক্যারম বোর্ড"><Carrom /></section>
        <section className="container section adda-captions-section" aria-labelledby="captions-title">
          <h2 id="captions-title">বন্ধুদের নিয়ে ক্যাপশন</h2>
          <p>বোর্ডের ছবির সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section adda-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
