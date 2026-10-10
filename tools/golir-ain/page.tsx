import "./product.css";
import Link from "next/link";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { AinWall } from "./components/ain-wall";
import { bn, rules } from "./lib/ain";
import { site } from "./content";

export default function GolirAinPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ga-page">
        <section className="container ga-hero" aria-labelledby="ga-title">
          <p className="ga-kicker">গলির ক্রিকেট · {bn(rules.length)}টা অলিখিত আইন</p>
          <h1 id="ga-title">তোমার গলিতে <span>কী কী আইন ছিল?</span></h1>
          <p className="ga-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="পাড়ার আইনে টিক দাও"><AinWall /></section>
        <section className="container section ga-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="ga-note">গোল্লাছুট, কানামাছি বা দাঁড়িয়াবান্ধার মতো দেশি খেলার নিয়ম চাইলে দেখো <Link href="/cholo-kheli">চলো খেলি</Link>।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section ga-suggest" aria-label="আইনের পরামর্শ"><SuggestBox tool="golir-ain" question="তোমার গলির কোন আইনটা এখানে নেই?" placeholder="যেমন: পুকুরে বল গেলে যে মেরেছে সে-ই তুলবে" /></section>
      </div>
    </PageFrame>
  );
}
