import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { CountdownBuilder, HolidayTable } from "./components/countdown-builder";
import { sources } from "./lib/countdown";

export default function KotoDinBakiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="kdb">
        <section className="kdb-hero container" aria-labelledby="kdb-title">
          <p className="kdb-kicker">ঈদ · পূজা · বড়দিন · বুদ্ধ পূর্ণিমা · বৈশাখ · জাতীয় দিবস</p>
          <h1 id="kdb-title">পরের উৎসব <span>আর কত দিন?</span></h1>
          <p className="kdb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="দিন গোনো"><CountdownBuilder /></section>
        <section className="container section kdb-holidays" aria-labelledby="kdb-holidays-title">
          <h2 id="kdb-holidays-title">২০২৬–২০২৭ সালের ছুটি আর উৎসব</h2>
          <p>২০২৬ সালের তারিখ <a href={sources.gov.url} target="_blank" rel="noopener noreferrer">সরকারি ছুটির তালিকা</a> (জনপ্রশাসন মন্ত্রণালয়ের প্রজ্ঞাপন, ৯ নভেম্বর ২০২৫) থেকে। ২০২৭ সালের সরকারি তালিকা এখনো আসেনি, তাই চাঁদ আর তিথির তারিখগুলো ‘সম্ভাব্য’; তালিকা এলে মিলিয়ে নেব। ঈদ আর রমজানের ঠিক দিন জানায় জাতীয় চাঁদ দেখা কমিটি।</p>
          <HolidayTable />
          <p className="kdb-checked">যাচাই করা: ১০ অক্টোবর ২০২৬। ভুল চোখে পড়লে নিচে জানাও।</p>
        </section>
        <section className="container section kdb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section kdb-suggest" aria-label="দিনের পরামর্শ"><SuggestBox tool="koto-din-baki" question="কোন দিনটা থাকা উচিত ছিল, বা কোন তারিখ ভুল?" placeholder="যেমন: শবে বরাত, লক্ষ্মীপূজা" /></section>
      </div>
    </PageFrame>
  );
}
