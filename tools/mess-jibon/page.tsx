import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { MealCard } from "./components/meal-card";
import { Captions } from "./components/captions";
import { bn } from "./lib/mess";

export default function MessJibonPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mess-jibon">
        <section className="mj-hero container" aria-labelledby="mj-title">
          <p className="mj-hero-kicker">৪০টা মুহূর্ত · মিল কার্ডে ফুটো</p>
          <h1 id="mj-title">হল আর মেসের কয়টা দিন <span>তোমার চেনা?</span></h1>
          <p className="mj-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="হল-মেস জীবনের মুহূর্ত মেলাও"><MealCard /></section>
        <section className="container section mj-captions-section" aria-labelledby="captions-title">
          <h2 id="captions-title">মেস লাইফ নিয়ে স্ট্যাটাস</h2>
          <p>মিল কার্ডের ছবির সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>
        <section className="container section mj-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section mj-suggest" aria-label="নতুন মুহূর্তের পরামর্শ"><SuggestBox tool="mess-jibon" question="কোন মুহূর্তটা কার্ডে থাকা উচিত ছিল?" placeholder="যেমন: শীতের রাতে এক কম্বলে তিনজন" /></section>
      </div>
    </PageFrame>
  );
}
