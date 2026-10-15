import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { GhoriGame } from "./components/ghori-game";
import { site } from "./content";

export default function GhoriDekhiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gd-page">
        <section className="gd-hero container" aria-labelledby="gd-title">
          <h1 id="gd-title">{site.headline}</h1>
          <p className="gd-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="কাঁটাওয়ালা ঘড়ি দেখা: ঠিক ঘণ্টা, সাড়ে, সোয়া, পৌনে, তারপর ৫ মিনিট করে। আর সকাল, দুপুর, বিকেল, সন্ধ্যা, রাত।"
            age="৫–৯ বছর। ৫–৬ বছরে প্রথম দুই লেভেলই যথেষ্ট।"
            together="বাসার দেয়ালঘড়ির সামনে দাঁড়াও। জিজ্ঞেস করো, ‘বড় কাঁটা কোথায়? তাহলে কয়টা বাজে?’"
            school="প্রাথমিকের গণিতে সময় আর ঘড়ি দেখা।" />
        </section>
        <section className="container" id="tool" aria-label="ঘড়ি দেখি খেলো"><GhoriGame /></section>
        <section className="container section gd-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="gd-print-link">খাতায় অনুশীলনের জন্য: <a href="/ghori-dekhi?print">ছয়টা খালি ঘড়ি প্রিন্ট করো</a> (A4), কাঁটা এঁকে দেবে।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
