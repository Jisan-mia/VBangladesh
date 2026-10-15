import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { AbcGame } from "./components/abc-game";
import { site } from "./content";

export default function AbcBazarPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ab-page">
        <section className="ab-hero container" aria-labelledby="ab-title">
          <h1 id="ab-title">{site.headline}</h1>
          <p className="ab-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="ইংরেজি ২৬টা অক্ষর, বড় হাতের আর ছোট হাতের রূপ, প্রথম অক্ষর, আর b d p q আলাদা করা। শব্দগুলো চেনা জিনিসের: Mango, Boat।"
            age="৪–৭ বছর। ৪–৫ বছরে প্রথম দুই লেভেলই যথেষ্ট, পড়তে জানতে হয় না।"
            together="খেলার পর রান্নাঘর থেকে একটা ডিম বা লেবু হাতে নাও। জিজ্ঞেস করো, ‘ইংরেজিতে এটা কী? কোন অক্ষর দিয়ে শুরু?’"
            school="প্রথম-দ্বিতীয় শ্রেণির ইংরেজি বর্ণমালা।" />
        </section>
        <section className="container" id="tool" aria-label="এবিসি বাজার খেলো"><AbcGame /></section>
        <section className="container section ab-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="ab-print-link">খাতার পাশে রাখার জন্য: <a href="/abc-bazar?print">A–Z রং করার পাতা</a> (A4), ২৬টা অক্ষর আর ছবি।</p>
          <p className="ab-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
