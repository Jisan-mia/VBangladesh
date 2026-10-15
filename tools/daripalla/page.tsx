import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { BalanceGame } from "./components/balance-game";
import { site } from "./content";

export default function DaripallaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dp-page">
        <section className="dp-hero container" aria-labelledby="dp-title">
          <h1 id="dp-title">{site.headline}</h1>
          <p className="dp-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দাঁড়িপাল্লা খেলো">
          <ParentNote slug={site.slug}
            learns="সমান চিহ্ন (=) মানে দুই দিক সমান ভারী। ৪-এর সাথে কত দিলে ৭ হয়, সেটা হাতে-কলমে বের করা। পরের ধাপে অজানা ওজন খোঁজা, যা বীজগণিতের প্রথম ভাবনা। প্রথম তিন ধাপ ৬–৭ বছরে, অজানা ফল আর ছবির অঙ্ক ৮ বছর থেকে।"
            age="৬–১১ বছর"
            together="বাটখারা দেওয়ার আগে জিজ্ঞেস করো, ‘আর কত হলে সমান হবে?’ আগে মুখে বলুক, তারপর চাপুক। বাজারে গেলে দোকানির পাল্লাটাও একসাথে দেখো।"
            school="স্কুলের অঙ্কে খালি ঘর পূরণ: ৪ + ☐ = ৭। ওজনগুলো খেলার, কেজি-গ্রাম নয়।" />
          <BalanceGame />
        </section>
        <section className="container section dp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
