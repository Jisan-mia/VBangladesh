import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { CoverBuilder } from "./components/cover-builder";
import { bn, daysIn, fridaysIn, EDITION } from "./lib/barshiki";

const firstDay = new Intl.DateTimeFormat("bn-BD", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(EDITION, 0, 1)));

export default function AmarBochhorPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="by-page">
        <section className="by-hero container" aria-labelledby="by-title">
          <p className="by-kicker">বছর শেষের বার্ষিকী · এক মিনিট</p>
          <h1 id="by-title">তোমার {bn(EDITION)}, <span>এক প্রচ্ছদে</span></h1>
          <p className="by-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বার্ষিকীর প্রচ্ছদ বানাও"><CoverBuilder /></section>
        <section className="container section by-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          {/* Days and Fridays are computed from the Gregorian calendar (lib/barshiki daysIn, fridaysIn); 1 Jan 2026 was a Thursday: https://www.timeanddate.com/calendar/?year=2026&country=60 */}
          <p className="by-source">যাচাই: প্রচ্ছদের দিন আর শুক্রবারের সংখ্যা ক্যালেন্ডার থেকে হিসাব করা। {bn(EDITION)} সালে {bn(daysIn(EDITION))} দিন, ১ জানুয়ারি ছিল {firstDay}, তাই শুক্রবার {bn(fridaysIn(EDITION))}টা।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
