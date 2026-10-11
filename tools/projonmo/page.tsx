import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { GenerationDictionary } from "./components/dictionary-page";
import { allEntries, bn, type Kind } from "./lib/words";
import { site } from "./content";

export default function ProjonmoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pj-site">
        <section className="container pj-hero" aria-labelledby="pj-title">
          <p className="pj-kicker">প্রজন্মের অভিধান · ২০২৭ সংস্করণ · ১০টা শব্দ</p>
          <h1 id="pj-title"><mark>জেন-জির ভাষা</mark> বোঝো, না <span>আব্বুর কথা?</span></h1>
        </section>
        <section className="container" id="tool" aria-label="জেন-জি না আব্বু-আম্মু খেলা"><GenerationDictionary /></section>
        <section className="container section pj-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <h3>শতাংশটা কীভাবে হিসাব হয়</h3>
          <p>প্রতি পাতায় ৫টা জেন-জির শব্দ, ৫টা আব্বু-আম্মুর কথা। জেন-জির যতগুলো পেরেছ (জ), আর আব্বু-আম্মুর যতগুলো পেরেছ (আ):</p>
          <p className="pj-formula">জেন-জি % = জ ÷ (জ + আ) × ১০০ · বাকিটা আব্বু-আম্মু %</p>
          <p>যেমন জেন-জির ৪টা আর আব্বু-আম্মুর ২টা পারলে ৬৭% জেন-জি, ৩৩% আব্বু-আম্মু। দুই দিকেই একটাও না পারলে ৫০-৫০। লিংকে কোনো শতাংশ থাকে না। খুললেই উত্তর থেকে নতুন করে গোনা হয়।</p>
          <p className="pj-sources">সূত্র ও যাচাই: আব্বু-আম্মুর কথাগুলোর অর্থ বাংলা একাডেমির অভিধানের সাথে মিলিয়ে লেখা (সরকারের <a href="https://accessibledictionary.gov.bd/" target="_blank" rel="noopener noreferrer">অ্যাক্সেসিবল ডিকশনারি</a>, যার ভিত্তি বাংলা একাডেমির অভিধান)। “টাকা কি গাছে ধরে?” ঘরোয়া কথা। জেন-জির শব্দের মানে সাধারণ ব্যবহার ধরে লেখা, যেখানে পাওয়া গেছে প্রথম আলো, ডেইলি স্টার বাংলা ও আজকের পত্রিকার লেখার সাথে মেলানো। স্ল্যাং দ্রুত বদলায়, তাই এগুলো অভিধানের রায় না। বাক্যে প্রয়োগগুলো আমাদের লেখা। অশ্লীল, প্রেমের ইঙ্গিতওয়ালা, কাউকে খোঁচা দেওয়া বা রাজনীতির শব্দ রাখিনি।</p>
        </section>
        <section className="container section pj-list" aria-labelledby="list-title">
          <h2 id="list-title">২০টা শব্দ ও অর্থ</h2>
          <p>খেলার আগে খুললে উত্তর জেনে যাবে কিন্তু!</p>
          <details>
            <summary>অভিধানের তালিকা দেখো</summary>
            <div className="pj-columns">
              {(["genz", "elder"] as Kind[]).map(kind => (
                <div key={kind} data-kind={kind}>
                  <h3>{kind === "genz" ? "জেন-জির শব্দ" : "আব্বু-আম্মুর কথা"}</h3>
                  <dl>
                    {allEntries.filter(entry => entry.kind === kind).map(entry => (
                      <div key={entry.id}>
                        <dt>{entry.word}</dt>
                        <dd>{entry.meaning} <small>{kind === "genz" ? "আব্বু-আম্মুর ভাষায়" : "জেন-জির ভাষায়"}: {entry.bridge}{entry.source && <> <a href={entry.source.url} target="_blank" rel="noopener noreferrer">{entry.source.label}</a></>}</small></dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </details>
        </section>
        <Faq items={site.faq} />
        <section className="container section pj-suggest" aria-label="শব্দের পরামর্শ"><SuggestBox tool="projonmo" question="কোন শব্দটা অভিধানে থাকা উচিত ছিল?" placeholder="যেমন: ভাইব, চিল, নবাবজাদা…" /></section>
      </div>
    </PageFrame>
  );
}
