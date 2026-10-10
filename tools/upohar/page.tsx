import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { EnvelopeBuilder } from "./components/envelope-builder";
import { bn, GUIDE_UPDATED } from "./lib/upohar";

export default function UpoharPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="upohar">
        <section className="upohar-hero container" aria-labelledby="upohar-title">
          <p className="upohar-kicker">বিয়ের দাওয়াত · খামের মজার হিসাব</p>
          <h1 id="upohar-title">{site.headline}</h1>
          <p className="upohar-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="খামের হিসাব করো"><EnvelopeBuilder /></section>

        <section className="container section upohar-method" aria-labelledby="method-title">
          <h2 id="method-title">এই আন্দাজ কোথা থেকে?</h2>
          <ul>
            <li><strong>নিয়ম না, আন্দাজ:</strong> শহরের একটা সাধারণ বিয়ের দাওয়াতের কথা ভেবে আমরা নিজেরাই একটা ছোট টেবিল বানিয়েছি। এটা কোনো জরিপ না, কেউ এটা মানতে বাধ্যও না।</li>
            <li><strong>যেভাবে বদলায়:</strong> সম্পর্ক যত কাছের, আন্দাজ তত ওপরে। কাচ্চি থাকলে এক ধাপ ওপরে, চা-মিষ্টির ঘরোয়া আয়োজনে দুই ধাপ নিচে। অন্য শহর থেকে গেলে যাতায়াতটাও উপহার, তাই এক ধাপ নিচে।</li>
            <li><strong>তোমার হাতে:</strong> ‘একটু কম’ বা ‘একটু বেশি’ চেপে নিজের মতো ঠিক করো, অথবা ‘সামর্থ্য অনুযায়ী’ বেছে নাও, তখন খামে কোনো অঙ্কই থাকে না।</li>
          </ul>
          <p className="upohar-dated">আন্দাজ হালনাগাদ: {GUIDE_UPDATED}। এলাকা, পরিবার আর সময় ভেদে অঙ্ক আলাদা হয়।</p>
        </section>

        <section className="container section upohar-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <p className="container upohar-end">উপহার মানে ভালোবাসা, অঙ্ক না।</p>
      </div>
    </PageFrame>
  );
}
