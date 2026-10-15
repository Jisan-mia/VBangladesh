import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SolarGame } from "./components/solar-game";
import { site } from "./content";

export default function SourojogotPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sj-page">
        <section className="sj-hero container" aria-labelledby="sj-title">
          <h1 id="sj-title">{site.headline}</h1>
          <p className="sj-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="আট গ্রহের নাম আর ক্রম, কোনটা কত বড়, কত দূরে।"
            age="৫–১১ বছর। ৫–৬ বছরে প্রথম দুই লেভেলই যথেষ্ট।"
            together="শেষে জিজ্ঞেস করো, ‘আমরা কোন গ্রহে থাকি? তার আগে কোনটা?’ রাতে একসাথে আকাশটা দেখো।"
            school="শ্রেণি ৪–৫ এর বিজ্ঞানে সৌরজগৎ। তথ্য: NASA (science.nasa.gov), অক্টোবর ২০২৬।" />
        </section>
        <section className="container" id="tool" aria-label="সৌরজগতের সফর খেলো"><SolarGame /></section>
        <section className="container section sj-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="sj-print-link">স্কুলের প্রজেক্টের জন্য: <a href="/sourojogot?print">আট গ্রহের কাট-আউট প্রিন্ট করো</a> (A4, আসল অনুপাতে)।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
