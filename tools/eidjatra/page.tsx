import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { JatraBuilder } from "./components/jatra-builder";
import { bn } from "./lib/jatra";

// Original lines for people searching "বাড়ি ফেরার স্ট্যাটাস" / "ঈদযাত্রা নিয়ে ক্যাপশন".
const captions = [
  "শহরের ঠিকানা পেছনে, সামনে শুধু বাড়ির উঠান।",
  "পথ যত লম্বাই হোক, শেষে মায়ের হাতের রান্না।",
  "ব্যাগে নতুন জামা, মনে পুরোনো উঠান। ঈদযাত্রা শুরু।",
  "সুপারভাইজার বলল ‘আর ১০ মিনিট’, তিন ঘণ্টা আগে।",
  "বাড়ি থেকে পাঁচবার ফোন এসেছে: ‘কতদূর এলি?’",
  "জানালার বাইরে ধানখেত, ভেতরে বাড়ি ফেরার তাড়া।",
];

export default function EidjatraPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jatra-page">
        <section className="jatra-hero container" aria-labelledby="jatra-title">
          <p className="jatra-hero-kicker">ঈদে বাড়ি ফেরা · এক কাগজে পথের নকশা</p>
          <h1 id="jatra-title">এবার বাড়ি যেতে <span>কত ঘণ্টা লাগল?</span></h1>
          <p className="jatra-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="পথের নকশা আঁকো"><JatraBuilder /></section>

        <section className="container section jatra-captions" aria-labelledby="captions-title">
          <h2 id="captions-title">বাড়ি ফেরা নিয়ে ক্যাপশন</h2>
          <p>কার্ডের সাথে পোস্টে লিখে দিতে পারো। চেপে ধরে কপি করে নাও।</p>
          <ul>{captions.map(caption => <li key={caption}>{caption}</li>)}</ul>
        </section>

        <section className="container section jatra-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="jatra-note">এখানে কোনো রাস্তার খবর, ম্যাপ বা সময়সূচি নেই; ঘণ্টাটা তোমার নিজের দেওয়া। ‘যারা জানিয়েছে’ গড় শুধু এখানে যোগ করা ঘণ্টা থেকে, একই পথে একই বাহনে অন্তত ৫০ জন হলে।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
