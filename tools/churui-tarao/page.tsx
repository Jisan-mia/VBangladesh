import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { ChuruiGame } from "./components/churui-game";

export default function ChuruiTaraoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ct-page">
        <section className="ct-hero container" aria-labelledby="ct-title">
          <p className="ct-hero-kicker">সোনালি বিকেলের ধানক্ষেত · ৪৫ সেকেন্ডের খেলা</p>
          <h1 id="ct-title">ধান পেকেছে, <span>চড়ুই এসেছে!</span></h1>
          <p className="ct-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="চড়ুই তাড়াও খেলো"><ChuruiGame /></section>
        <section className="container section ct-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
