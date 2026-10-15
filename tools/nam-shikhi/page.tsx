import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { NamGame } from "./components/nam-game";
import { site } from "./content";

export default function NamShikhiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ns-page">
        <section className="ns-hero container" aria-labelledby="ns-title">
          <h1 id="ns-title">{site.headline}</h1>
          <p className="ns-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="পশুপাখি, ফল, সবজি, শরীর, রং আর দেশের প্রতীকের নাম, বাংলা ও ইংরেজিতে।"
            age="৩ থেকে ৭ বছর। ছোটদের নামটা পড়ে শোনাও।"
            together="তুমি নাম বলো, ও ছবিতে চাপুক। পরে উল্টো: তুমি ছবি দেখাও, ও ইংরেজিতে বলুক।"
            school="প্রাক-প্রাথমিকে রং আর শরীর, ক্লাস ৩ থেকে জাতীয় প্রতীক।" />
        </section>
        <section className="container" id="tool" aria-label="নাম শিখি খেলো"><NamGame /></section>
        <section className="container section ns-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="ns-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
