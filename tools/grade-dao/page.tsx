import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { MarkSheet } from "./components/mark-sheet";

export default function GradeDaoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gd-page">
        <section className="gd-hero container" aria-labelledby="gd-title">
          <p className="gd-kicker">স্কুলের রেজাল্ট শিট · লাল কলম তোমার হাতে</p>
          <h1 id="gd-title">ফুচকাকে <span>কত নম্বর দেবে?</span></h1>
          <p className="gd-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="গ্রেড দাও"><MarkSheet /></section>
        <section className="container section gd-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section gd-suggest" aria-label="নতুন বিষয়ের পরামর্শ"><SuggestBox tool="grade-dao" question="আর কোন বিষয়ের পরীক্ষা নেওয়া উচিত?" placeholder="যেমন: পিঠা, মিষ্টি, ছোটবেলার খেলা" /></section>
      </div>
    </PageFrame>
  );
}
