import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { AgeBuilder } from "./components/age-builder";
import { bnPlain } from "./lib/boyos";

export default function BoyosPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="boyos">
        <section className="boyos-hero container" aria-labelledby="boyos-title">
          <p className="boyos-kicker">বয়স ক্যালকুলেটর · বাংলা জন্মতারিখসহ</p>
          <h1 id="boyos-title">{site.headline}</h1>
          <p className="boyos-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বয়স বের করো"><AgeBuilder /></section>

        <section className="container section boyos-method" aria-labelledby="method-title">
          <h2 id="method-title">বাংলা তারিখ যে নিয়মে হিসাব হয়</h2>
          <p>বাংলাদেশের সরকারি বাংলা পঞ্জিকায় পহেলা বৈশাখ সবসময় ১৪ এপ্রিল। মাসের দৈর্ঘ্য দুবার ঠিক করা হয়েছে, আর প্রতিটা তারিখ তখন যে নিয়ম চালু ছিল সেই নিয়মে হিসাব হয়:</p>
          <ul>
            <li><strong>১৪২৬ বঙ্গাব্দ (১৪ এপ্রিল ২০১৯) থেকে:</strong> বৈশাখ থেকে আশ্বিন ৩১ দিন, কার্তিক থেকে মাঘ ৩০ দিন, ফাল্গুন ২৯ দিন (লিপ ইয়ারে ৩০), চৈত্র ৩০ দিন। এতে ২১ ফেব্রুয়ারি হয় ৮ ফাল্গুন, ১৬ ডিসেম্বর ১ পৌষ।</li>
            <li><strong>১৩৯৫ থেকে ১৪২৫ বঙ্গাব্দ (১৯৮৮–২০১৯):</strong> বাংলা একাডেমির নিয়ম, যা সরকার ১৯৮৭ সালে গ্রহণ করে। বৈশাখ থেকে ভাদ্র ৩১ দিন, বাকি মাস ৩০ দিন, লিপ ইয়ারে ফাল্গুন ৩১ দিন।</li>
            <li><strong>১৯৮৮-র আগে:</strong> সরকারি সংশোধিত পঞ্জিকা ছিল না, বেশিরভাগ পঞ্জিকায় নববর্ষ হতো ১৪ বা ১৫ এপ্রিল। এই তারিখগুলো ১৯৬৬ সালের বাংলা একাডেমির নিয়মে হিসাব, তাই এক দিন এদিক-ওদিক হতে পারে।</li>
          </ul>
          <p className="boyos-source">
            সূত্র/যাচাই: ২০১৯-এর সংশোধন (<a href="https://www.dhakatribune.com/bangladesh/191106/ashshin-in-31-days-in-revised-bangla-calendar" rel="noopener" target="_blank">ঢাকা ট্রিবিউন</a>, <a href="https://en.wikipedia.org/wiki/Bangladeshi_national_calendar" rel="noopener" target="_blank">উইকিপিডিয়া</a>), আগের নিয়ম (<a href="https://en.banglapedia.org/index.php?title=Panjika" rel="noopener" target="_blank">বাংলাপিডিয়া</a>, <a href="https://www.tbsnews.net/thoughts/saga-bangla-calendar-403202" rel="noopener" target="_blank">টিবিএস</a>)। হিসাবটা প্রথম আলোর ছাপা তারিখের সাথে মিলিয়ে দেখা: ১৫ মার্চ ২০১৬ = ১ চৈত্র ১৪২২, ১৯ ডিসেম্বর ২০১৮ = ৫ পৌষ ১৪২৫, ১৬ ডিসেম্বর ২০১৯ = ১ পৌষ ১৪২৬, ২১ ফেব্রুয়ারি ২০২০ = ৮ ফাল্গুন ১৪২৬। হিজরি তারিখ চাঁদ দেখার ওপর নির্ভর করে বলে এখানে রাখিনি।
          </p>
        </section>

        <section className="container section boyos-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bnPlain(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
