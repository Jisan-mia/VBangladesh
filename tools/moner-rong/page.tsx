import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { MonerGame } from "./components/moner-game";
import { site } from "./content";

export default function MonerRongPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mr-page">
        <section className="mr-hero container" aria-labelledby="mr-title">
          <h1 id="mr-title">{site.headline}</h1>
          <p className="mr-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মনের রং খেলো">
          <ParentNote slug={site.slug}
            learns="অনুভূতির নাম: খুশি, মন খারাপ, রাগ, ভয়, অবাক, লজ্জা। মুখ দেখে মন বোঝা, আর কী করলে ভালো লাগে।"
            age="৪–৯ বছর। পড়তে জানতে হয় না, লাইনটা তুমি পড়ে শোনাও।"
            together="প্রতিটা ছবির শেষের প্রশ্নটা জিজ্ঞেস করো: ‘তোমার কখনো এমন হয়েছে?’ তারপর তুমিও নিজের একটা গল্প বলো।" />
          <MonerGame />
        </section>
        <section className="container section mr-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
