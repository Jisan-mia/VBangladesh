import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { LateGame } from "./components/late-game";

export default function DeriHoyeGeloPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dh-page">
        <section className="dh-hero container" aria-labelledby="dh-title">
          <p className="dh-hero-kicker">স্কুলে দেরি · এক আঙুলের বাংলা গেম</p>
          <h1 id="dh-title">ঘণ্টা বাজছে, <span>জলদি গেটে চলো!</span></h1>
          <p className="dh-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দেরি হয়ে গেল! খেলো"><LateGame /></section>
        <section className="container section dh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
