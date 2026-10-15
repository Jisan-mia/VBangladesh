import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { NoukaGame } from "./components/nouka-game";
import { site } from "./content";

export default function DoshGhaterNoukaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dg-page">
        <section className="dg-hero container" aria-labelledby="dg-title">
          <h1 id="dg-title">{site.headline}</h1>
          <p className="dg-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দশ ঘাটের নৌকা খেলো">
          <ParentNote slug={site.slug}
            learns="১ থেকে ১০, পরে ২০: কোনটার পরে কোনটা, কোনটা বড়, আর আগের ঘাট থেকে গুনে এগোনো।"
            age="৩–৬ বছর। পড়তে জানতে হয় না।"
            together="‘বড়রা চালাবে’ বেছে নিচের নৌকাটা তুমি চালাও। প্রতি ঘাটে দুজনে জোরে নম্বর বলো: ‘পাঁচ, ছয়।’"
            school="প্রাক-প্রাথমিক আর প্রথম শ্রেণির সংখ্যা গোনা।" />
          <NoukaGame />
        </section>
        <section className="container section dg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
