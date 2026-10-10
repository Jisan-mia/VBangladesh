import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { LastBall } from "./components/last-ball";

export default function SheshBolPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="shesh-page">
        <section className="shesh-hero container" aria-labelledby="shesh-title">
          <p className="shesh-hero-kicker">এক ট্যাপের ক্রিকেট · ফ্লাডলাইটের নিচে</p>
          <h1 id="shesh-title">শেষ বল, দরকার ৫। <span>পারবে?</span></h1>
          <p className="shesh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="শেষ বলে ছয় খেলো"><LastBall /></section>
        <section className="container section shesh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
