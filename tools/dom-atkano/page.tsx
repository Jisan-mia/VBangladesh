import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { Scoreboard } from "./components/scoreboard";
import { site } from "./content";

export default function DomAtkanoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dom-page">
        <section className="container dom-hero" aria-labelledby="dom-title">
          <h1 id="dom-title"><span className="dom-kicker">বাংলাদেশ ক্রিকেট কুইজ · ১০টা প্রশ্ন · জয় আর কষ্টের দিন</span> দম আটকানো সেই ম্যাচগুলো <span>কতটা মনে আছে?</span></h1>
        </section>
        <section className="container" id="tool" aria-label="ক্রিকেট কুইজ খেলো"><Scoreboard /></section>
        <section className="container section dom-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="dom-sources">সূত্র ও যাচাই: প্রতিটা প্রশ্নের তারিখ, মাঠ, স্কোর আর ব্যবধান ESPNcricinfo-র ম্যাচের স্কোরকার্ডের সাথে মিলিয়ে দেখা। উত্তর দেওয়ার পর প্রতিটা প্রশ্নের নিচে সেই স্কোরকার্ডের লিংক আছে।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section dom-suggest" aria-label="ম্যাচের পরামর্শ"><SuggestBox tool="dom-atkano" question="কোন ম্যাচটা থাকা উচিত ছিল?" placeholder="যেমন: যে ম্যাচটা রেডিওতে কান পেতে শুনেছিলে" /></section>
      </div>
    </PageFrame>
  );
}
