import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { PlateBuilder } from "./components/plate-builder";
import { art } from "./lib/art";
import { bn, items } from "./lib/plate";

export default function IftarPlatePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="iftar">
        <section className="iftar-hero container" aria-labelledby="iftar-title">
          <p className="iftar-kicker">ইফতারির প্লেট · এক মিনিটে</p>
          <h1 id="iftar-title">আজ তোমার <span>প্লেটে কী?</span></h1>
          <p className="iftar-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ইফতারির প্লেট সাজাও"><PlateBuilder /></section>

        <section className="container section iftar-list" aria-labelledby="list-title">
          <h2 id="list-title">ইফতার আইটেমের নাম ও ছবি</h2>
          <p>দেশের ঘরোয়া ইফতারের চেনা {bn(items.length)}টা আইটেম। ছবিগুলো আমাদের আঁকা, কোনো দোকান বা ব্র্যান্ডের না।</p>
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: art[item.id] }} />
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="container section iftar-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section iftar-suggest" aria-label="ইফতার আইটেমের পরামর্শ"><SuggestBox tool="iftar-plate" question="কোন আইটেমটা থাকা উচিত ছিল?" placeholder="যেমন: ঘুগনি, পাকোড়া, ফিরনি" /></section>
      </div>
    </PageFrame>
  );
}
