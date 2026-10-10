import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { MoodBoard } from "./components/mood-board";

export default function MatcherMonPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="matcher">
        <section className="matcher-hero container" aria-labelledby="matcher-title">
          <p className="matcher-kicker">ক্রিকেট আর ফুটবল · গ্রাফ খাতায় মনের ওয়ার্ম</p>
          <h1 id="matcher-title">{site.headline}</h1>
          <p className="matcher-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মনের গ্রাফ আঁকো"><MoodBoard /></section>
        <section className="container section matcher-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="matcher-note">এখানে কোনো লাইভ স্কোর, দলের নাম, লোগো বা জার্সি নেই, শুধু তোমার মন। বাজি বা জুয়ার সাথে এর কোনো সম্পর্ক নেই।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section matcher-suggest" aria-label="মনের পরামর্শ"><SuggestBox tool="matcher-mon" question="আর কোন মন থাকা উচিত ছিল?" placeholder="যেমন: রাগ, অবিশ্বাস, হাসি" /></section>
      </div>
    </PageFrame>
  );
}
