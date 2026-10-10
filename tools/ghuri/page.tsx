import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { KiteBuilder } from "./components/kite-builder";

const digits = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export default function GhuriPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gh-page">
        <section className="gh-hero container" aria-labelledby="gh-title">
          <p className="gh-kicker">সাকরাইন · পৌষ সংক্রান্তি · ১৪ জানুয়ারি</p>
          <h1 id="gh-title">নিজের ঘুড়ি বানাও, <span>আকাশে ওড়াও</span></h1>
          <p className="gh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ঘুড়ি বানাও"><KiteBuilder /></section>
        <section className="container section gh-guide" id="guide" aria-labelledby="gh-guide-title">
          <h2 id="gh-guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{digits(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="gh-safe">ছাদে সত্যিকারের ঘুড়ি ওড়ালে বিদ্যুতের তার থেকে দূরে থেকো, আর ছাদের কিনারা থেকে সাবধান।</p>
          {/* Sources: https://www.prothomalo.com/bangladesh/capital/wzotxb2r7l and https://www.thedailystar.net/news/old-dhaka-readies-sakrain-kites-lanterns-memories-return-winter-skies-tomorrow-4079976 */}
          <p className="gh-source">সূত্র: সাকরাইন পৌষের শেষ দিন, বাংলাদেশের ক্যালেন্ডারে ১৪ জানুয়ারি। ঘুড়ির নামগুলো পুরান ঢাকার দোকানে চলা নাম (প্রথম আলো, দ্য ডেইলি স্টার); নকশা আমাদের আঁকা।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
