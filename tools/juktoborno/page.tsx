import "./product.css";
import { ParentNote } from "../../shared/kids-kit";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { JuktobornoGame } from "./components/juktoborno-game";
import { site } from "./content";

export default function JuktobornoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jb-page">
        <section className="jb-hero container" aria-labelledby="jb-title">
          <h1 id="jb-title">{site.headline}</h1>
          <p className="jb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="যুক্তবর্ণ ভাঙি-জুড়ি খেলো">
          <ParentNote slug={site.slug}
            learns="যুক্তবর্ণ ভাঙা আর জোড়া: ল্ল থেকে ক্ষ, জ্ঞ, শেষে রেফ আর ফলা।"
            age="৭–১০ বছর। বর্ণ আর কার-চিহ্ন চিনলেই হবে।"
            together="জুড়ি ধাপে ছবির নামটা দুজনে ধীরে বলো। কোন বর্ণ আগে কানে আসে, ও-ই বেছে নিক।"
            school="দ্বিতীয়–তৃতীয় শ্রেণির ‘যুক্তবর্ণ ভেঙে শব্দ গঠন’। র আগে বসলে রেফ (র্য), পরে বসলে র-ফলা (ট্র); য পরে বসলে য-ফলা (ব্য)।" />
          <JuktobornoGame />
        </section>
        <section className="container section jb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
