import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { RoverGame } from "./components/rover-game";
import { FACTS, SOURCE } from "./lib/facts";
import { site } from "./content";

const bn = new Intl.NumberFormat("bn-BD");

export default function MongoleRoverPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mr-page">
        <section className="mr-hero container" aria-labelledby="mr-title">
          <h1 id="mr-title">{site.headline}</h1>
          <ParentNote slug={site.slug}
            learns={`ধাপে ধাপে প্ল্যান করা, চালিয়ে দেখা, আর কোন ধাপে ভুল সেটা খুঁজে ঠিক করা। কোডিংয়ের গোড়া এটাই। প্রতি লেভেলের পরে মঙ্গলের একটা সত্যি তথ্য, মিলিয়ে নেওয়া ${SOURCE} থেকে।`}
            age="৬–১১ বছর। ৫ বছরের ছোটরা বড়দের পাশে বসে খেলুক।"
            together="চালাও চাপার আগে ছোটজনকে আঙুল দিয়ে পথটা দেখাতে বলো: “এখান থেকে ওপরে, তারপর ডানে।” গর্তে ঠেকলে জিজ্ঞেস করো, কোন ব্লকে গড়বড় হলো।" />
        </section>
        <section className="container" id="tool" aria-label="মঙ্গলে রোভার খেলো"><RoverGame /></section>
        <section className="container section mr-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn.format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <h3>মঙ্গলের ১২টা কথা</h3>
          <ol className="mr-facts">{FACTS.map(fact => <li key={fact}>{fact}</li>)}</ol>
          <p className="mr-source">সূত্র: {SOURCE}</p>
          <p className="mr-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
