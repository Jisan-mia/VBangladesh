import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { GhuriGame } from "./components/ghuri-game";
import { site } from "./content";

export default function PrithibiGhuriPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pg-page">
        <section className="pg-hero container" aria-labelledby="pg-title">
          <h1 id="pg-title">{site.headline}</h1>
          <p className="pg-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="ছয় মহাদেশের ১৮টা দেশ: ম্যাপে কোথায়, রাজধানী, সেখানে হ্যালো কীভাবে বলে, একটা খাবার, একটা জায়গা, একটা প্রাণী। আর অন্য দেশের মানুষও আমাদের মতো, এই বোধটা।"
            age="৬–১২ বছর। ৬–৭ বছরে কার্ডগুলো পড়ে শোনাও।"
            together="প্রবাসে কোনো আত্মীয় থাকলে আগে সেই দেশে যাও, তারপর ছোটজনকে জিজ্ঞেস করো, মামা ওখানে কী খায়? ভিডিও কলে ওই ভাষায় একটা হ্যালো বলিয়ে দেখো।"
            school="প্রাথমিক বাংলাদেশ ও বিশ্বপরিচয়: মহাদেশ, প্রতিবেশী দেশ। তথ্য: Britannica, CIA World Factbook ও দেশগুলোর পর্যটন সাইট, অক্টোবর ২০২৬।" />
        </section>
        <section className="container" id="tool" aria-label="পৃথিবী ঘুরি খেলো"><GhuriGame /></section>
        <section className="container section pg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="pg-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
