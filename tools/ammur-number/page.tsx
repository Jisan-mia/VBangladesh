import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { NumberGame } from "./components/number-game";
import { site } from "./content";

export default function AmmurNumberPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="an-page">
        <section className="an-hero container" aria-labelledby="an-title">
          <h1 id="an-title">{site.headline}</h1>
          <p className="an-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="আম্মুর নম্বর খেলো">
          <ParentNote slug={site.slug}
            learns="আম্মু বা আব্বুর মোবাইল নম্বর মুখস্থ বলা, টুকরো টুকরো করে। মেলায় বা ঈদের বাজারে হারিয়ে গেলে এই নম্বরই ওকে বাসায় ফেরায়। সাথে মনে রাখার অভ্যাসও হয়।"
            age="৪–৮ বছর। ছোটরা দেখে দেখে চাপে, বড়রা পুরোটা মনে থেকে।"
            together="খেলা শেষে ফোন সরিয়ে রাখো, ওকে নম্বরটা সুর করে বলতে বলো: ‘শূন্য-এক-সাত…’। তারপর বলো, হারিয়ে গেলে এক জায়গায় দাঁড়াবে, আর বাচ্চা সাথে আছে এমন কোনো আম্মু বা দোকানের কাউকে নম্বরটা বলবে।" />
          <NumberGame />
        </section>
        <section className="container section an-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
