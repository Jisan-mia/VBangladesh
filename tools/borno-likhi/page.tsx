import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { LikhiGame } from "./components/likhi-game";
import { site } from "./content";

export default function BornoLikhiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bl-page">
        <section className="bl-hero container" aria-labelledby="bl-title">
          <h1 id="bl-title">{site.headline}</h1>
          <p className="bl-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বর্ণ লিখি খেলো">
          <ParentNote slug={site.slug}
            learns="বর্ণের গড়ন আর লেখার ক্রম: কোন দাগ আগে, কোন দিকে টান, মাত্রা কখন। ১১টা স্বরবর্ণ, ৩৯টা ব্যঞ্জনবর্ণ আর ০–৯।"
            age="৪–৭ বছর। ৪ বছরে স্বরবর্ণ আর ০–৪ দিয়ে শুরু করো।"
            together="ও আঙুলে লিখুক, তুমি বর্ণের নামটা জোরে বলো। তারপর একই বর্ণ খাতায় পেনসিলে একবার লিখতে দাও। এটা পেনসিল-খাতার বদলে নয়, পাশাপাশি।"
            school="প্রাক-প্রাথমিক আর প্রথম শ্রেণির বাংলা: বর্ণ চেনা, বর্ণ লেখা, মাত্রা দিয়ে লেখা। দাগের ক্রম আমরা প্রচলিত নিয়মে সাজিয়েছি: ফুটকি বা বাঁক আগে, খাড়া দাগ ওপর থেকে নিচে, মাত্রা সবার শেষে। স্কুলে অন্যভাবে শেখালে সেটাই মানো।" />
          <LikhiGame />
        </section>
        <section className="container section bl-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="bl-print-note">খাতায় অনুশীলনের জন্য: <a href="/borno-likhi?print=1">স্বরবর্ণের পাতা প্রিন্ট করো</a> (A4)। পাতার ওপর থেকে অন্য সেট বেছে নিতে পারো।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
