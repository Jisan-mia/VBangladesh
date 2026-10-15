import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { HatDhuiGame } from "./components/hat-dhui-game";
import { FACTS } from "./lib/facts";
import { MODES } from "./lib/routines";
import { site } from "./content";

export default function HatDhuiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="hd-page">
        <section className="hd-hero container" aria-labelledby="hd-title">
          <h1 id="hd-title">{site.headline}</h1>
          <p className="hd-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="WHO-র ৬ ধাপে ২০ সেকেন্ড হাত ধোয়া, ২ মিনিট দাঁত মাজা, আর কখন হাত ধুতে হয়। icddr,b-র গবেষণায়, খাওয়ার আগে আর টয়লেটের পরে সাবানে হাত ধুলে শিশুদের ডায়রিয়া কমে।"
            age="৩–৮ বছর। পড়তে না জানলেও চলে।"
            together="ফোনটা বেসিনের পাশে রেখে পাশাপাশি হাত ধোও, ধাপ মিলিয়ে। কে আগে নখ ঘষে, দেখো।" />
        </section>
        <section className="container" id="tool" aria-label="হাত ধুই, দাঁত মাজি খেলো"><HatDhuiGame /></section>
        <section className="container section hd-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <h3>বড়দের জন্য: একটা তথ্য, একটা কাজ</h3>
          <dl className="hd-facts">{MODES.map(mode => <div key={mode.id}><dt>{mode.bn}</dt><dd>{FACTS[mode.id].fact} {FACTS[mode.id].action} <small>সূত্র: {FACTS[mode.id].source}</small></dd></div>)}</dl>
          <p className="hd-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
