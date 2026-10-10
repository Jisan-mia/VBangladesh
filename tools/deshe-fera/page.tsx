import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { TagBuilder } from "./components/tag-builder";
import { bn } from "./lib/deshe";

// Original lines for people searching "প্রবাস জীবন নিয়ে ক্যাপশন" / "দেশে যাওয়ার স্ট্যাটাস".
const captions = [
  "শরীরটা প্রবাসে, মনটা পড়ে আছে মায়ের রান্নাঘরে।",
  "ভিডিও কলে ঈদ হয়, কিন্তু কোলাকুলি হয় না।",
  "ব্যাগ গোছানো শুরু। এবার ফেরার পালা।",
  "যত দূরেই থাকি, বাড়ির পথটা মুখস্থ।",
  "টিকিট কাটা হয়ে গেছে, এখন শুধু দিন গোনা।",
  "প্রবাসের রাত লম্বা, কিন্তু দেশের ভোরটা আসবেই।",
];

export default function DesheFeraPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="deshe">
        <section className="deshe-hero container" aria-labelledby="deshe-title">
          <p className="deshe-kicker">প্রবাসের হিসাব · দেশে ফেরার কাউন্টডাউন</p>
          <h1 id="deshe-title">{site.headline}</h1>
          <p className="deshe-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="লাগেজ ট্যাগ বানাও"><TagBuilder /></section>

        <section className="container section deshe-captions" aria-labelledby="captions-title">
          <h2 id="captions-title">প্রবাস জীবন নিয়ে ক্যাপশন</h2>
          <p>ট্যাগের ছবির সাথে পোস্টে লিখে দিতে পারো। চেপে ধরে কপি করে নাও।</p>
          <ul>{captions.map(caption => <li key={caption}>{caption}</li>)}</ul>
        </section>

        <section className="container section deshe-method" aria-labelledby="method-title">
          <h2 id="method-title">ঈদ আর সময় যেভাবে হিসাব হয়</h2>
          <ul>
            <li><strong>ঈদ:</strong> যে মাসে দেশ ছেড়েছ তার পরের মাস থেকে আজ পর্যন্ত বাংলাদেশে যতগুলো ঈদুল ফিতর আর ঈদুল আজহা হয়েছে, তা গোনা হয়। অনেকে ঈদের পরপরই ফেরেন বলে যাওয়ার মাসের ঈদটা ধরা হয় না। মাঝে দেশে এসে ঈদ করলেও সেটা এই হিসাবে থাকে।</li>
            <li><strong>সময়:</strong> প্রতিটা দেশের সময় তার নিজের ঘড়ির নিয়ম ধরে দেখানো হয়, তাই লন্ডন-আমেরিকায় ঘড়ি আগে-পিছে হলেও পার্থক্য ঠিক থাকে। বাংলাদেশের ঘড়ি সারা বছর একই।</li>
            <li><strong>দিন গোনা:</strong> বাংলাদেশের তারিখ ধরে, যাতে বাড়ির সবাই যেদিন দেখে সেদিনের হিসাবটাই পায়।</li>
          </ul>
          <p className="deshe-source">
            সূত্র/যাচাই: ২০০৯ থেকে ২০২৬ পর্যন্ত ঈদের তারিখ জাতীয় চাঁদ দেখা কমিটির ঘোষণা আর সরকারি ছুটির তালিকা থেকে, যেমন ২০২৬-এর ঈদুল ফিতর ২১ মার্চ (<a href="https://www.dhakatribune.com/bangladesh/405939/eid-ul-fitr-being-celebrated-in-bangladesh-with" rel="noopener" target="_blank">ঢাকা ট্রিবিউন</a>) আর ঈদুল আজহা ২৮ মে (<a href="https://en.ittefaq.com.bd/16594/bangladesh-to-celebrate-eid-ul-azha-on-may-28" rel="noopener" target="_blank">ইত্তেফাক</a>)। ২০০৯-এর আগের তারিখ উম্মুল কুরা পঞ্জিকার চেয়ে এক দিন পরে ধরে আনুমানিক, আর ২০২৭ থেকে সামনের তারিখগুলো সম্ভাব্য। চাঁদ দেখার ওপর নির্ভর করে বলে ঈদের সংখ্যার পাশে ‘প্রায়’ লেখা থাকে।
          </p>
        </section>

        <section className="container section deshe-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
