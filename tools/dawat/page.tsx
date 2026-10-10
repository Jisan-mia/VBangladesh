import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { InviteBuilder } from "./components/invite-builder";

export default function DawatPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dw-page">
        <section className="dw-hero container" aria-labelledby="dw-title">
          <p className="dw-kicker">বিয়ে · হলুদ · বৌভাত · আকিকা · জন্মদিন · খেলা দেখা</p>
          <h1 id="dw-title">দাওয়াতটা <span>সুন্দর করে</span> দাও</h1>
          <p className="dw-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দাওয়াত কার্ড বানাও"><InviteBuilder /></section>
        <section className="container section dw-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          {/* Bangla dates follow Bangladesh's 2019 revised calendar: https://en.wikipedia.org/wiki/Bengali_calendars */}
          <p className="dw-source">সূত্র: বাংলা তারিখ মেলানো হয় বাংলাদেশের সংশোধিত বাংলা পঞ্জিকা (২০১৯) ধরে, যেখানে ১৬ ডিসেম্বর = ১ পৌষ আর ২১ ফেব্রুয়ারি = ৮ ফাল্গুন। পাঠানোর আগে একবার মিলিয়ে নিও।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
