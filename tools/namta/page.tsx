import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { NamtaList } from "./components/namta-list";
import { SlateGame } from "./components/slate-game";

export default function NamtaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="nm-page">
        <section className="nm-hero container" aria-labelledby="nm-title">
          <p className="nm-hero-kicker">২ থেকে ২০-এর নামতা · ১০টা অঙ্ক</p>
          <h1 id="nm-title">নামতা পারো? <span>স্লেটে দেখাও</span></h1>
          <p className="nm-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="নামতা খেলো"><SlateGame /></section>
        <NamtaList />
        <section className="container section nm-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
