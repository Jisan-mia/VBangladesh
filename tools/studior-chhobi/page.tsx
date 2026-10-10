import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { StudioBuilder } from "./components/studio-builder";

export default function StudioPhotoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sc-page">
        <section className="sc-hero container" aria-labelledby="sc-title">
          <p className="sc-kicker">৯০-এর পাড়ার ফটো স্টুডিও</p>
          <h1 id="sc-title">চলো, স্টুডিওতে <span>একটা ছবি তুলি</span></h1>
        </section>
        <section className="container" id="tool" aria-label="স্টুডিওর ছবি বানাও"><StudioBuilder /></section>
        <section className="container section sc-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.lead}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section sc-suggest" aria-label="ব্যাকড্রপের পরামর্শ"><SuggestBox tool="studior-chhobi" question="তোমাদের পাড়ার স্টুডিওতে আর কোন ব্যাকড্রপ ছিল?" placeholder="যেমন: ঝরনা, চাঁদ-তারার রাত, লাল গাড়ি" /></section>
      </div>
    </PageFrame>
  );
}
