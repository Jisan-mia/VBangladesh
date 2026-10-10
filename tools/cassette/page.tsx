import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { TapeBuilder } from "./components/tape-builder";
import { bn } from "./lib/cassette";

export default function CassettePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cassette">
        <section className="cs-hero container" aria-labelledby="cs-title">
          <p className="cs-hero-kicker">সাইড A, সাইড B · হাতে লেখা জে-কার্ড</p>
          <h1 id="cs-title">দশ গানের একটা <span>ক্যাসেট বানাও</span></h1>
          <p className="cs-hero-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ক্যাসেট বানাও"><TapeBuilder /></section>
        <section className="container section cs-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section" aria-label="গানের পরামর্শ"><SuggestBox tool="cassette" question="কোন গানটা তালিকায় থাকা উচিত ছিল?" placeholder="যেমন: গানের নাম আর শিল্পী বা ব্যান্ডের নাম" /></section>
      </div>
    </PageFrame>
  );
}
