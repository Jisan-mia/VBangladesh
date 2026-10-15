import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { KiHobeGame } from "./components/ki-hobe-game";
import { site } from "./content";

export default function KiHobePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ki-page">
        <section className="ki-hero container" aria-labelledby="ki-title">
          <h1 id="ki-title">{site.headline}</h1>
          <p className="ki-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="কী হবে বলো তো? খেলো">
          <ParentNote slug={site.slug}
            learns="আগে আন্দাজ, তারপর দেখা, তারপর কেন: বিজ্ঞানের আসল পথ। ভাসা-ডোবা, রোদ-ছায়া, পড়া, চুম্বক, শব্দ, আকাশ, বৃষ্টি, চাঁদ।"
            age="৫–১০ বছর। ৫–৬ বছরে প্রশ্নটা পড়ে শোনাও, আন্দাজটা ও নিজে বেছে নিক।"
            together="পরীক্ষা চালানোর আগে জিজ্ঞেস করো, ‘কেন এমন মনে হলো?’ তারপর ‘বাসায় করে দেখো’-র একটা আজই একসাথে করো।"
            school="শ্রেণি ৩–৫ এর প্রাথমিক বিজ্ঞান: পানি, বাতাস, আলো, আবহাওয়া। তথ্য মিলিয়েছি NASA Space Place (আকাশ), NASA Science (চাঁদের কলা), NASA NSSDC (অ্যাপোলো ১৫, হাতুড়ি-পালক), USGS Water Science School (পানিচক্র) আর Britannica থেকে, অক্টোবর ২০২৬।" />
          <KiHobeGame />
        </section>
        <section className="container section ki-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
