import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { TeaStallBoard } from "./components/tea-stall-board";

export default function EtaNaOtaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ena-page">
        <section className="ena-hero container" aria-labelledby="ena-title">
          <p className="ena-kicker">চায়ের দোকানের তর্ক · ১২টা টোকা</p>
          <h1 id="ena-title">ফুচকা না চটপটি? <span>দেশ কার পক্ষে?</span></h1>
          <p className="ena-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="এটা না ওটা খেলো"><TeaStallBoard /></section>
        <section className="container section ena-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section ena-suggest" aria-label="তর্কের পরামর্শ"><SuggestBox tool="eta-na-ota" question="কোন তর্কটা বোর্ডে থাকা উচিত ছিল?" placeholder="যেমন: বিরিয়ানি না খিচুড়ি, লুডু না ক্যারম" /></section>
      </div>
    </PageFrame>
  );
}
