import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PowerLog } from "./components/power-log";

export default function CurrentGeloPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cg-page">
        <section className="cg-hero container" aria-labelledby="cg-title">
          <h1 id="cg-title"><span className="cg-hero-kicker">লোডশেডিংয়ের খাতা · শুধু তোমার হিসাব</span> আজ কত ঘণ্টা <span>কারেন্ট ছিল না?</span></h1>
          <p className="cg-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="লোডশেডিংয়ের হিসাব রাখো"><PowerLog /></section>
        <section className="container section cg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="cg-honest">এখানে কোনো লোডশেডিংয়ের সূচি, পূর্বাভাস বা অফিশিয়াল তথ্য নেই। সব সংখ্যা তোমার নিজের, আর গড়টা শুধু যারা নিজে থেকে জানিয়েছে তাদের।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
