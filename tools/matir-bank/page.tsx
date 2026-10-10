import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BankBuilder } from "./components/bank-builder";

const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export default function MatirBankPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mb-wrap">
        <section className="mb-hero container" aria-labelledby="mb-title">
          <p className="mb-kicker">টাকা জমানোর চার্ট · ঈদে ভাঙব</p>
          <h1 id="mb-title">রোজ একটু, <span>মাটির ব্যাংকে</span></h1>
          <p className="mb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মাটির ব্যাংকে জমাও"><BankBuilder /></section>
        <section className="container section mb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
