import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { GuneGame } from "./components/gune-game";
import { site } from "./content";

export default function GuneDekhiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="gd-page">
        <section className="gd-hero container" aria-labelledby="gd-title">
          <h1 id="gd-title">{site.headline}</h1>
          <p className="gd-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="গুনে দেখি খেলো">
          <ParentNote slug={site.slug}
            learns="মাছ ছুঁয়ে ছুঁয়ে ১ থেকে ২০ গোনা, আর শেষ নম্বরটাই যে মোট। ছয়টা পর্যন্ত জিনিস না গুনে এক নজরে চেনা। দুই দলের কোনটায় বেশি, কতটা বেশি।"
            age="৩–৬ বছর। পড়তে জানতে হয় না, আঙুলের ছবি প্রথম চাপটা দেখিয়ে দেয়।"
            together="মাছে চাপ দেওয়ার সময় দুজনে জোরে গোনো: এক, দুই, তিন। খেলা শেষে টেবিলের চামচগুলো একসাথে গুনে দেখো।"
            school="প্রাক-প্রাথমিকের গোনা (১০ থেকে ২০ পর্যন্ত), আর ‘কোনটা বেশি, কোনটা কম’।" />
          <GuneGame />
        </section>
        <section className="container section gd-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
