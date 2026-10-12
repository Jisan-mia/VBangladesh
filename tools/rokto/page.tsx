import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { RoktoBuilder } from "./components/rokto-builder";
import { Captions } from "./components/captions";
import { bnPlain, VERIFIED } from "./lib/rokto";

export default function RoktoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="rokto">
        <section className="rokto-hero container" aria-labelledby="rokto-title">
          <h1 id="rokto-title"><span className="rokto-kicker">রক্তদাতা কার্ড · তারিখের হিসাব</span> {site.headline}</h1>
          <p className="rokto-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="আবার কবে রক্ত দিতে পারবে"><RoktoBuilder /></section>

        <section className="container section rokto-rule" id="niyom" aria-labelledby="rule-title">
          <h2 id="rule-title">কত দিন পর পর রক্ত দেওয়া যায়?</h2>
          <p>স্বাস্থ্য অধিদপ্তরের নিরাপদ রক্ত পরিসঞ্চালন কর্মসূচির পরামর্শক অধ্যাপক সৈয়দা মাসুমা রহমান লিখেছেন, সুস্থ মানুষ <strong>চার মাস পর পর</strong> রক্ত দিতে পারে, আর মেয়েদের সাধারণত <strong>ছয় মাস পর</strong> দিতে বলা হয়। বিশ্ব স্বাস্থ্য সংস্থার (WHO) নির্দেশিকায় সবচেয়ে কম বিরতি ছেলেদের ১২ সপ্তাহ, মেয়েদের ১৬ সপ্তাহ।</p>
          <p>তাই এখানে বিরতি কখনো ৪ মাসের কম ধরা হয় না, আর শুরুতে ধরা থাকে সবচেয়ে সাবধানী হিসাব, ৬ মাস। তোমার ব্লাড ব্যাংক ৪ মাস বললে ‘৪ মাস’ বেছে নাও। শেষ তারিখের সাথে মাস যোগ হয় বাংলাদেশের সময়ে। ৩১ অক্টোবরের মতো তারিখের পরের মাসে সেই দিন না থাকলে তার পরের মাসের ১ তারিখ ধরা হয়, যাতে কখনো আগেভাগে না দেখায়।</p>
          <p className="rokto-must">রক্ত দেওয়ার আগে ব্লাড ব্যাংক তোমাকে পরীক্ষা করবে। ওজন, বয়স, শরীরের অবস্থা বা ওষুধের ব্যাপারে এই কার্ড কিছু বিচার করে না। ব্লাড ব্যাংক যা বলবে সেটাই চূড়ান্ত।</p>
          <p className="rokto-source">
            সূত্র: <a href="https://www.prothomalo.com/lifestyle/health/khsamqr1co" rel="noopener" target="_blank">প্রথম আলো, “রক্ত দেওয়া–নেওয়ার আগে যে বিষয়গুলো জানা জরুরি”</a> (অধ্যাপক সৈয়দা মাসুমা রহমান, পরামর্শক, নিরাপদ রক্ত পরিসঞ্চালন কর্মসূচি, স্বাস্থ্য অধিদপ্তর; হালনাগাদ ১৩ এপ্রিল ২০২৪), <a href="https://www.who.int/publications/i/item/9789241548519" rel="noopener" target="_blank">WHO, Blood donor selection (২০১২)</a>। যাচাই করা: {VERIFIED}।
          </p>
        </section>

        <section className="container section rokto-captions" aria-labelledby="captions-title">
          <h2 id="captions-title">রক্ত দান নিয়ে ক্যাপশন</h2>
          <p>কার্ডের সাথে পোস্টে লিখে দিতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Captions />
        </section>

        <section className="container section rokto-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bnPlain(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
