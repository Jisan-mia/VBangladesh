import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BoxBuilder } from "./components/box-builder";
import { bn, CHECKED } from "./lib/bhori";

const table = [
  ["১ ভরি", "১৬ আনা = ৯৬ রতি = ৯৬০ পয়েন্ট", "১১.৬৬৪ গ্রাম"],
  ["১ আনা", "৬ রতি = ৬০ পয়েন্ট", "০.৭২৯ গ্রাম"],
  ["১ রতি", "১০ পয়েন্ট", "০.১২১৫ গ্রাম"],
  ["১ পয়েন্ট", "", "০.০১২১৫ গ্রাম"],
] as const;

export default function BhoriPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bhori">
        <section className="bhori-hero container" aria-labelledby="bhori-title">
          <p className="bhori-kicker">পুরোনো গয়নার ওজন · দাম ছাড়া</p>
          <h1 id="bhori-title">{site.headline}</h1>
          <p className="bhori-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ভরি থেকে গ্রাম হিসাব করো"><BoxBuilder /></section>

        <section className="container section bhori-source" aria-labelledby="source-title">
          <h2 id="source-title">হিসাবের মাপ, সূত্র আর যাচাই</h2>
          <table>
            <caption className="screen-reader-only">ভরি, আনা, রতি আর পয়েন্ট গ্রামে কত</caption>
            <thead><tr><th scope="col">একক</th><th scope="col">ভাগে</th><th scope="col">গ্রামে</th></tr></thead>
            <tbody>{table.map(([unit, parts, grams]) => <tr key={unit}><th scope="row">{unit}</th><td>{parts || "সবচেয়ে ছোট ভাগ"}</td><td>{grams}</td></tr>)}</tbody>
          </table>
          <ul>
            <li><strong>সূত্র:</strong> বাংলাদেশ জুয়েলার্স সমিতি (বাজুস) সোনার দামের প্রতিটা ঘোষণায় ‘প্রতি ভরি (১১ দশমিক ৬৬৪ গ্রাম)’ ধরে। ১ ভরি = ১৬ আনা = ৯৬ রতি = ৯৬০ পয়েন্ট, স্বর্ণকারদের প্রচলিত হিসাব।</li>
            <li><strong>গোল করা:</strong> সব হিসাব হয় পুরো পয়েন্টে (১ পয়েন্ট = ০.০১২১৫ গ্রাম)। মেমোতে পুরো অঙ্কটা লেখা থাকে, কার্ডে গ্রাম দুই ঘর দশমিকে গোল করা।</li>
            <li><strong>দোকানভেদে আলাদা:</strong> কোনো কোনো লেখায় বা দোকানে আনা-রতির ভাগ অন্যভাবে ধরা হয় (যেমন ১ আনা = ৮ রতি)। কেনাবেচার আগে রসিদে গ্রামের অঙ্কটাই মিলিয়ে নাও।</li>
            <li><strong>দাম নেই:</strong> সোনার দাম প্রায় রোজ বদলায়, তাই এখানে কোনো দাম নেই। দাম জানতে বাজুসের সর্বশেষ ঘোষণা দেখো। এটা কেনাবেচা বা বিনিয়োগের কোনো পরামর্শ না।</li>
          </ul>
          <p className="bhori-dated">যাচাই করা: {CHECKED}।</p>
        </section>

        <section className="container section bhori-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
