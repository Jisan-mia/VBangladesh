import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { InviteBuilder } from "./components/invite-builder";
import { site } from "./content";

export default function CholoKheliPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="kheli-page">
        <section className="container kheli-hero" aria-labelledby="kheli-title">
          <p className="kheli-hero-kicker">ফোন রেখে, পাড়ার সবাই মিলে</p>
          <h1 id="kheli-title">আজ বিকেলে <span>মাঠে চলো!</span></h1>
          <p className="kheli-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="খেলা বাছো আর দাওয়াত বানাও"><InviteBuilder /></section>
        <section className="container section kheli-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
