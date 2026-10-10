import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { MagicPot } from "./components/hari";
import { bn, MAKEABLE } from "./lib/game";
import { site } from "./content";

export default function MishronPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ms-site">
        <section className="container ms-hero" aria-labelledby="ms-title">
          <p className="ms-kicker">নানির জাদুর হাঁড়ি · {bn(MAKEABLE)}টা জিনিস লুকানো</p>
          <h1 id="ms-title">পানি আর চাল মেশালে ভাত।<br /><span>আর কী কী বানাতে পারবে?</span></h1>
        </section>
        <section className="container" id="tool" aria-label="দেশি মিশ্রণ খেলা"><MagicPot /></section>
        <section className="container section ms-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="ms-note">সব জিনিস আর মেশানোর নিয়ম আমাদের হাতে লেখা, তাই কোনটা কী দিয়ে হয় তা একটু খেয়ালি হতে পারে, যেমন লোহা + চাল = টিনের চাল! নির্বাচন কমিশনের প্রতীকের তালিকার কোনো জিনিস, ধর্মীয় কিছু বা খারাপ কিছু রাখিনি।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section ms-suggest" aria-label="নতুন জিনিসের পরামর্শ"><SuggestBox tool="mishron" question="কোন জিনিসটা হাঁড়িতে থাকা উচিত ছিল?" placeholder="যেমন: চানাচুর, পেঁয়াজু, কাগজের ফুল…" /></section>
      </div>
    </PageFrame>
  );
}
