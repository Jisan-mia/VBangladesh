import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { GrammarBook } from "./components/grammar-book";
import { idiomSvg } from "./lib/art";
import { allIdioms, bn, dictionaryUrl } from "./lib/idioms";
import { site } from "./content";

export default function BagdharaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bg-site">
        <section className="container bg-hero" aria-labelledby="bg-title">
          <p className="bg-kicker">বাগধারা কুইজ · ছবি দেখে মানে বলো · ১০টা</p>
          <h1 id="bg-title">ছবি দেখে <span>বাগধারা বলো</span></h1>
        </section>
        <section className="container" id="tool" aria-label="বাগধারার ছবির খেলা"><GrammarBook /></section>
        <section className="container section bg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="bg-sources">সূত্র ও যাচাই: প্রতিটা বাগধারার অর্থ বাংলা একাডেমির অভিধানের সাথে মিলিয়ে লেখা (সরকারের <a href="https://accessibledictionary.gov.bd/" target="_blank" rel="noopener noreferrer">অ্যাক্সেসিবল ডিকশনারি</a>, যার ভিত্তি বাংলা একাডেমির অভিধান)। বাক্যে প্রয়োগগুলো আমাদের লেখা। জাত, পেশা, জাতিগোষ্ঠী, লিঙ্গ, শরীর বা প্রতিবন্ধিতা নিয়ে খোঁচা দেয় এমন বাগধারা রাখিনি।</p>
        </section>
        <section className="container section bg-list" aria-labelledby="list-title">
          <h2 id="list-title">২০টা বাগধারা ও অর্থ</h2>
          <p>খেলার আগে খুললে উত্তর জেনে যাবে কিন্তু!</p>
          <details>
            <summary>বাগধারার তালিকা দেখো</summary>
            <ul className="bg-grid">
              {allIdioms.map(item => (
                <li key={item.id}>
                  <span className="bg-thumb" aria-hidden="true" dangerouslySetInnerHTML={{ __html: idiomSvg(item.id) }} />
                  <strong>{item.idiom}</strong>
                  <p>{item.meaning}</p>
                  <small>{item.example} <a href={dictionaryUrl(item.head)} target="_blank" rel="noopener noreferrer">অভিধানে দেখো</a></small>
                </li>
              ))}
            </ul>
          </details>
        </section>
        <Faq items={site.faq} />
        <section className="container section bg-suggest" aria-label="বাগধারার পরামর্শ"><SuggestBox tool="bagdhara" question="কোন বাগধারার ছবি দেখতে চাও?" placeholder="যেমন: ঘোড়ার ডিম, কুমিরের কান্না…" /></section>
      </div>
    </PageFrame>
  );
}
