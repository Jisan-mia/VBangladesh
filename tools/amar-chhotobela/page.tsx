import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PostcardBuilder } from "./components/postcard-builder";
import { Captions } from "./components/captions";
import { SuggestBox } from "../../shared/share-kit";

export default function ChhotobelaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="childhood">
        <section className="childhood-hero container" aria-labelledby="childhood-title">
          <p className="childhood-kicker">৩৬টা চেনা স্মৃতি · এক মিনিট</p>
          <h1 id="childhood-title">তোমার ছোটবেলার<br /><span>কয়টা মেলে?</span></h1>
          <p className="childhood-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="স্মৃতি মেলাও"><PostcardBuilder /></section>
        <section className="container section childhood-captions" aria-labelledby="captions-title">
          <h2 id="captions-title">ছোটবেলা নিয়ে ক্যাপশন</h2>
          <p>খাতার ছবির সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section childhood-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section childhood-suggest" aria-label="স্মৃতির পরামর্শ"><SuggestBox tool="amar-chhotobela" question="কোন স্মৃতিটা থাকা উচিত ছিল?" placeholder="যেমন: মার্বেল খেলা, বিটিভির শুক্রবারের সিনেমা" /></section>
      </div>
    </PageFrame>
  );
}
