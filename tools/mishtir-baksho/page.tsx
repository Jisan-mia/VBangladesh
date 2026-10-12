import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { BoxBuilder } from "./components/box-builder";
import { bn, isGi, placeOf, sweets, total } from "./lib/box";

const known = sweets.filter(sweet => placeOf(sweet));

export default function MishtirBakshoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mishti">
        <section className="mishti-hero container" aria-labelledby="mishti-title">
          <p className="mishti-kicker">দেশের {bn(total)}টা নামকরা মিষ্টি · এক মিনিট</p>
          <h1 id="mishti-title">তোমার মিষ্টির<br /><span>বাক্সে কয়টা?</span></h1>
          <p className="mishti-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মিষ্টির বাক্স সাজাও"><BoxBuilder /></section>

        <section className="container section mishti-places" aria-labelledby="places-title">
          <h2 id="places-title">কোন জেলার কোন মিষ্টি বিখ্যাত</h2>
          <p>তালিকার যে মিষ্টিগুলো কোনো জায়গার নামে পরিচিত, সেগুলো এখানে। <b className="mishti-gi">জিআই</b> মানে ভৌগোলিক নির্দেশক পণ্য। পেটেন্ট, শিল্প-নকশা ও ট্রেডমার্কস অধিদপ্তর (ডিপিডিটি) মিষ্টিটাকে ওই জায়গার বলে নিবন্ধন দিয়েছে।</p>
          <ul>
            {known.map(sweet => <li key={sweet.id}><strong>{"known" in sweet ? sweet.known : sweet.label}</strong><span>{placeOf(sweet)}</span>{isGi(sweet) && <b className="mishti-gi">জিআই</b>}</li>)}
            <li><strong>গোপালগঞ্জের রসগোল্লা</strong><span>গোপালগঞ্জ · তালিকায় ‘রসগোল্লা’ নামে</span><b className="mishti-gi">জিআই</b></li>
          </ul>
          <p className="mishti-source">
            সূত্র/যাচাই: জিআই তালিকা শিল্পমন্ত্রীর সংসদে দেওয়া হিসাব (২ সেপ্টেম্বর ২০২৬, <a href="https://www.tbsnews.net/bangladesh/bangladesh-now-has-64-gi-products-industries-minister-1531481" rel="noopener" target="_blank">টিবিএস</a>) আর আলাদা আলাদা নিবন্ধনের খবর (<a href="https://www.prothomalo.com/bangladesh/aad1ilork6" rel="noopener" target="_blank">প্রথম আলো</a>, <a href="https://bangla.thedailystar.net/news/bangladesh/news-670026" rel="noopener" target="_blank">দ্য ডেইলি স্টার</a>) মিলিয়ে। জিআই নয় এমন মিষ্টির জায়গা লেখা হয়েছে মিষ্টিটা যেখানকার বলে পরিচিত, সেই হিসাবে (<a href="https://www.prothomalo.com/opinion/column/8e7gb82xac" rel="noopener" target="_blank">প্রথম আলো</a>)। প্যারা সন্দেশের মতো যে মিষ্টি নিয়ে একাধিক জায়গার দাবি আছে, সেগুলোর পাশে জায়গা লিখিনি। কোনো মিষ্টির দোকান বা ব্র্যান্ডের নাম নেই, ছবিগুলোও আমাদের আঁকা।
          </p>
        </section>

        <section className="container section mishti-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section mishti-suggest" aria-label="মিষ্টির পরামর্শ"><SuggestBox tool="mishtir-baksho" question="কোন মিষ্টিটা বাক্সে থাকা উচিত ছিল?" placeholder="যেমন: রাজবাড়ীর চমচম, নওগাঁর প্যারা সন্দেশ" /></section>
      </div>
    </PageFrame>
  );
}
