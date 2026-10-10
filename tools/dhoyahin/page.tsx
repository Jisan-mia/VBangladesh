import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { TobBuilder } from "./components/tob-builder";
import { bn } from "./lib/dhoyahin";

export default function DhoyahinPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dh-page">
        <section className="dh-hero container" aria-labelledby="dh-title">
          <p className="dh-kicker">টবে চারাগাছ · সিগারেট ছাড়ার দিন গোনা</p>
          <h1 id="dh-title">কত দিন ধোঁয়াহীন, <span>কত টাকা বাঁচল?</span></h1>
          <p className="dh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ধোঁয়াহীন দিন গোনো"><TobBuilder /></section>
        <section className="container section dh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
