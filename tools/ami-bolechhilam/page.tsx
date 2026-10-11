import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { Envelope } from "./components/envelope";

export default function AmiBolechhilamPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bolechhi">
        <section className="bolechhi-hero container" aria-labelledby="bolechhi-title">
          <p className="bolechhi-kicker">ক্রিকেট আর ফুটবল · সিল করা খাম</p>
          <h1 id="bolechhi-title">{site.headline}</h1>
          <p className="bolechhi-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ভবিষ্যদ্বাণী লিখে সিল করো"><Envelope /></section>

        <section className="container section bolechhi-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="bolechhi-note">দলের তালিকা আমরা নিজেরা লিখেছি। সময়সূচি, লাইভ স্কোর, লোগো বা জার্সি, কিছুই নেই। ক্রিকেটের দেশগুলো আইসিসির সদস্য তালিকা ধরে, নামের বানান বাংলা সংবাদমাধ্যমের মতো।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section bolechhi-suggest" aria-label="দলের পরামর্শ"><SuggestBox tool="ami-bolechhilam" question="কোন দলটা থাকা উচিত ছিল?" placeholder="যেমন: ক্রিকেটে হংকং, ফুটবলে কোরিয়া" /></section>
      </div>
    </PageFrame>
  );
}
