import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { SignboardGame } from "./components/signboard-game";

export default function BananPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="banan-page">
        <section className="banan-hero container" aria-labelledby="banan-title">
          <p className="banan-kicker">১০টা সাইনবোর্ড · বাংলা একাডেমির বানান</p>
          <h1 id="banan-title">কোন বানানটা <span>শুদ্ধ?</span></h1>
          <p className="banan-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="শুদ্ধ বানান বেছে নাও"><SignboardGame /></section>
        <section className="container section banan-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section banan-suggest" aria-label="বানানের পরামর্শ"><SuggestBox tool="banan" question="কোন শব্দটা থাকা উচিত, বা কোথাও ভুল চোখে পড়ল?" placeholder="যেমন: আরও কঠিন শব্দ চাই" /></section>
      </div>
    </PageFrame>
  );
}
