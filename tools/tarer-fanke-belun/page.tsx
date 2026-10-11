import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BalloonGame } from "./components/balloon-game";

export default function TarerFankeBelunPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="tb-page">
        <section className="tb-hero container" aria-labelledby="tb-title">
          <p className="tb-hero-kicker">{site.name} · এক আঙুলের খেলা</p>
          <h1 id="tb-title">{site.headline}</h1>
          <p className="tb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="তারের ফাঁকে বেলুন খেলো"><BalloonGame /></section>
        <section className="container tb-street-note" aria-label="সত্যিকারের তারের কাছে">
          <p><b>রাস্তায় মনে রেখো:</b> তারে আটকানো ঘুড়ি বা বেলুন কখনো টেনে নামাতে যেয়ো না, ওতে বিদ্যুৎ থাকতে পারে। ঘুড়ি ওড়াও খোলা মাঠে, তারের কাছে না।</p>
        </section>
        <section className="container section tb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
