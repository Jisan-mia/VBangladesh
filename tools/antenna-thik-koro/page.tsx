import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { AntennaGame } from "./components/antenna-game";
import { site } from "./content";

export default function AntennaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="at-page">
        <section className="at-hero container" aria-labelledby="at-title">
          <p className="at-hero-kicker">{site.name} · ৯০-এর ছাদ, ৫টা চ্যানেল</p>
          <h1 id="at-title">{site.headline}</h1>
          <p className="at-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="অ্যান্টেনা ঘুরিয়ে খেলো"><AntennaGame /></section>
        <section className="container section at-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
