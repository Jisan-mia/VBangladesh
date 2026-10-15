import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { SurGame } from "./components/sur-game";
import { site } from "./content";

const bn = new Intl.NumberFormat("bn-BD");

export default function SurBanaiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sb-page">
        <section className="sb-hero container" aria-labelledby="sb-title">
          <h1 id="sb-title">{site.headline}</h1>
          <ParentNote slug={site.slug}
            learns="নকশা আর তাল চেনা, শুনে মনে রাখা, আর নিজে কিছু বানানো। নোট মাত্র পাঁচটা, সা রে গা পা ধা, তাই কোনো সুরই বেসুরো শোনায় না। শব্দ থাকলে মজা বেশি, তবে শব্দ বন্ধ থাকলেও আলো জ্বলে, খেলা চলে।"
            age="৩–১২ বছর"
            together="তুমি চার ঘরের একটা ছোট সুর বানাও, ওকে বলো শুনে মিলিয়ে দেখাতে। তারপর পালা বদল: ও বানাবে, তুমি মেলাবে।" />
        </section>
        <section className="container" id="tool" aria-label="সুর বানাই খেলো"><SurGame /></section>
        <section className="container section sb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn.format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="sb-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
