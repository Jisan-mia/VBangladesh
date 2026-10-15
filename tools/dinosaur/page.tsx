import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { DinoGame } from "./components/dino-game";
import { site } from "./content";

export default function DinosaurPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dn-page">
        <section className="dn-hero container" aria-labelledby="dn-title">
          <h1 id="dn-title">{site.headline}</h1>
          <p className="dn-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="জীবাশ্ম কী, ১২টা ডাইনোসরের নাম আর মাপ, কে কবে ছিল, কে তৃণভোজী কে মাংসাশী। ধৈর্য ধরে খোঁড়াও একটা শেখা।"
            age="৪–৯ বছর। ৪–৫ বছরে প্রথম দুই লেভেলই যথেষ্ট, পড়তে হয় না।"
            together="ডাইনোসর বেরোলে জিজ্ঞেস করো, ‘ও কি একটা বাসের চেয়ে লম্বা?’ পরে রাস্তায় একটা পাখি দেখিয়ে বলো, ‘এটাও ডাইনোসর।’"
            school="প্রাথমিক বিজ্ঞানে প্রাণীর খাবার: তৃণভোজী আর মাংসাশী। তথ্য: Natural History Museum, London (nhm.ac.uk), অক্টোবর ২০২৬।" />
        </section>
        <section className="container" id="tool" aria-label="ডাইনোসর খুঁজি খেলো"><DinoGame /></section>
        <section className="container section dn-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
