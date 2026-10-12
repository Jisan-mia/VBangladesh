import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { PithaStall } from "./components/pitha-stall";
import { pithaSvg } from "./lib/art";
import { allPithas, moreNames } from "./lib/pitha";
import { site } from "./content";

const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export default function PithaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pt-page">
        <section className="container pt-hero" aria-labelledby="pt-title">
          <h1 id="pt-title"><span className="pt-kicker">পিঠার কুইজ · ছবি দেখে নাম বলো</span> শীতের পিঠা, <span>কয়টা চেনো?</span></h1>
        </section>
        <section className="container" id="tool" aria-label="পিঠা চেনার খেলা"><PithaStall /></section>
        <section className="container section pt-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="pt-sources">সূত্র ও যাচাই: পিঠার নাম, অন্য নাম আর বানানোর ধরন বাংলাপিডিয়ার “পিঠা” ও “নকশি পিঠা”, প্রথম আলো, সমকাল, দ্য ডেইলি স্টার, টিবিএস, ফিনান্সিয়াল এক্সপ্রেস আর উইকিপিডিয়ার সাথে মিলিয়ে লেখা। প্রতিটা পিঠার উত্তরের নিচে তার সূত্রের লিংক আছে। নবান্ন পহেলা অগ্রহায়ণে, ১৬ নভেম্বর।</p>
        </section>
        <section className="container section pt-list" aria-labelledby="list-title">
          <h2 id="list-title">৩০টা পিঠার নাম, ২০টার ছবিসহ</h2>
          <p>খেলার আগে খুললে উত্তর জেনে যাবে কিন্তু!</p>
          <details>
            <summary>পিঠার নামের তালিকা দেখো</summary>
            <ul className="pt-grid">
              {allPithas.map(question => (
                <li key={question.id}>
                  <span className="pt-thumb" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pithaSvg(question.id) }} />
                  <strong>{question.name}</strong>
                  {question.alt && <small>অন্য নামে: {question.alt}</small>}
                </li>
              ))}
            </ul>
            <ul className="pt-more">{moreNames.map(item => <li key={item.name}><strong>{item.name}</strong> {item.note}</li>)}</ul>
          </details>
        </section>
        <Faq items={site.faq} />
        <section className="container section pt-suggest" aria-label="পিঠার পরামর্শ"><SuggestBox tool="pitha" question="তোমার এলাকার কোন পিঠাটা থাকা উচিত ছিল, বা কোন নামে ডাকো?" placeholder="যেমন: আমাদের ওখানে ভাপাকে বলে…" /></section>
      </div>
    </PageFrame>
  );
}
