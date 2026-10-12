import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { GhotokFile } from "./components/ghotok-file";

export default function BiyeKobePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bk-page">
        <section className="bk-hero container" aria-labelledby="bk-title">
          <p className="bk-kicker"><span>বিয়ে কবে হবে</span> ৬টা প্রশ্ন · এক মিনিট</p>
          <h1 id="bk-title">ঘটক কী বলে, <span>বিয়ে কবে?</span></h1>
          <p className="bk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ঘটকের প্রশ্নের উত্তর দাও"><GhotokFile /></section>
        <section className="container section bk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section bk-suggest" aria-label="প্রশ্নের পরামর্শ"><SuggestBox tool="biye-kobe" question="ঘটকের ফাইলে আর কোন মজার প্রশ্ন থাকা উচিত?" placeholder="যেমন: চায়ে কয় চামচ চিনি খাও?" /></section>
      </div>
    </PageFrame>
  );
}
