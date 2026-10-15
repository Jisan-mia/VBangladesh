import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { BhagGame } from "./components/bhag-game";
import { site } from "./content";

export default function ShomanBhagPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sb-page">
        <section className="sb-hero container" aria-labelledby="sb-title">
          <h1 id="sb-title">{site.headline}</h1>
          <p className="sb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সমান ভাগ খেলো">
          <ParentNote slug={site.slug}
            learns="সবাইকে সমান করে দেওয়া, মানে ভাগ অঙ্কের শুরু। তারপর অর্ধেক, তিন ভাগের এক ভাগ আর চার ভাগের এক ভাগ চেনা। শেষ টুকরোটা নিয়ে কার মনে কী হয়, সেটাও দেখে।"
            age="৫–১০ বছর। ছোটরা প্লেটে সমান করে দেয়, বড়রা রুটি কাটে আর ভাগের নাম বলে।"
            together="খেলা শেষে এক বাটি মুড়ি বা কয়েকটা বিস্কুট দাও, বাসার সবাইকে সমান ভাগ করতে বলো। শেষেরটা কে পাবে, সেটা ও-ই ঠিক করুক।"
            school="প্রাথমিকের ভাগ অঙ্ক আর ভগ্নাংশের শুরু: ১/২, ১/৩, ১/৪।" />
          <BhagGame />
        </section>
        <section className="container section sb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
