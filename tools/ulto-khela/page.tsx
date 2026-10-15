import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { UltoGame } from "./components/ulto-game";
import { site } from "./content";

export default function UltoKhelaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="uk-page">
        <section className="uk-hero container" aria-labelledby="uk-title">
          <h1 id="uk-title">{site.headline}</h1>
          <p className="uk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="উল্টো খেলা খেলো">
          <ParentNote slug={site.slug}
            learns="অভ্যাস থামিয়ে নিয়ম মেনে চাপা, আর নিয়ম বদলালে নতুনটা ধরা। মনোযোগের অনুশীলন, বুদ্ধি বাড়ানোর দাবি নয়। ভিত্তি: হার্ভার্ডের Center on the Developing Child-এর খেলার তালিকা।"
            age="৪–৮ বছর। পড়তে জানতে হয় না: ⇄ মানে উল্টো, = মানে একই, আর আঙুলের ছবি প্রথম চাপটা দেখিয়ে দেয়।"
            together="খেলা শেষে মুখে মুখে খেলো: তুমি বলো ‘দিন’, ও বলবে ‘রাত’। তারপর তালি দাও: এবার তুমি যা বলবে, ও-ও তা-ই।"
            school="বাংলার বিপরীত শব্দ: দিন-রাত, বড়-ছোট, ঠান্ডা-গরম।" />
          <UltoGame />
        </section>
        <section className="container section uk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
