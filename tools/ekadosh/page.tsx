import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { CoachBoard } from "./components/coach-board";
import { site } from "./content";
import { bn, players } from "./lib/ekadosh";

export default function EkadoshPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ekadosh">
        <section className="ek-hero container" aria-labelledby="ek-title">
          <p className="ek-hero-kicker">পেলে থেকে মেসি · {bn(players.length)} জন কিংবদন্তি</p>
          <h1 id="ek-title">সর্বকালের সেরা একাদশ, <span>তোমার চোখে</span></h1>
          <p className="ek-hero-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="একাদশ সাজাও"><CoachBoard /></section>
        <section className="container section ek-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section" aria-label="খেলোয়াড়ের পরামর্শ"><SuggestBox tool="ekadosh" question="কোন কিংবদন্তি তালিকায় থাকা উচিত ছিল?" placeholder="যেমন: খেলোয়াড়ের নাম আর দেশ" /></section>
      </div>
    </PageFrame>
  );
}
