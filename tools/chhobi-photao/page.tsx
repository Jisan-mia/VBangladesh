import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { PictureGame } from "./components/picture-game";
import { site } from "./content";

export default function ChhobiPhotaoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cp-page">
        <section className="cp-hero container" aria-labelledby="cp-title">
          <h1 id="cp-title"><span className="cp-hero-kicker">ননোগ্রাম ধাঁধা · ৩০টা ছবি</span> {site.headline}</h1>
          <p className="cp-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ছবি ফোটাও খেলো"><PictureGame /></section>
        <section className="container section cp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
