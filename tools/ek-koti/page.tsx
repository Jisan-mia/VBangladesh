import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { VanBuilder } from "./components/van-builder";
import { PRICE_NOTE, bn, groups, items, taka } from "./lib/van";

export default function EkKotiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="koti">
        <section className="koti-hero container" aria-labelledby="koti-title">
          <p className="koti-kicker">{bn(items.length)}টা জিনিস · দাম আনুমানিক</p>
          <h1 id="koti-title">এক কোটি টাকা পেলে<br /><span>কী করতে?</span></h1>
          <p className="koti-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="এক কোটি টাকা খরচ করো"><VanBuilder /></section>

        <section className="container section koti-prices" aria-labelledby="prices-title">
          <h2 id="prices-title">দামগুলো কোথা থেকে এল?</h2>
          <p>সব দাম {PRICE_NOTE}। বাজারের সাধারণ দাম দেখে গোল করে ধরা, যাতে মুখে মুখে বলা যায়: চা ১৫ টাকা, কাচ্চি ৩৫০, মোটরসাইকেল আড়াই লাখ। আসল দাম জায়গা, মান আর সময়ভেদে কম-বেশি হয়। কোনো দোকান, কোম্পানি বা ব্র্যান্ডের দাম না, কেনাকাটা বা টাকা রাখার পরামর্শও না।</p>
          <p>এখানে কোনো লটারি, পুরস্কার বা বাজি নেই, আসল টাকার লেনদেনও নেই। শেয়ার, সঞ্চয়পত্র বা জমির মতো টাকা খাটানোর জিনিস ইচ্ছা করেই রাখিনি। এটা শুধু ভেবে দেখার খেলা।</p>
          <details>
            <summary>{bn(items.length)}টা জিনিসের পুরো দামের তালিকা</summary>
            {groups.map(group => (
              <div key={group.id} className="koti-price-group">
                <h3>{group.label}</h3>
                <ul>{items.filter(item => item.group === group.id).map(item => <li key={item.id}><span>{item.label}{"note" in item && <small> ({item.note})</small>}</span><b>{taka(item.price)}</b></li>)}</ul>
              </div>
            ))}
          </details>
        </section>

        <section className="container section koti-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section koti-suggest" aria-label="জিনিসের পরামর্শ"><SuggestBox tool="ek-koti" question="কোন জিনিসটা ভ্যানে থাকা উচিত ছিল?" placeholder="যেমন: স্কুলে সোলার প্যানেল, নিজের একটা নৌকা" /></section>
      </div>
    </PageFrame>
  );
}
