import "./product.css";
import Link from "next/link";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { ChitGame } from "./components/chit-game";

export default function ChorPolicePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cp-page">
        <section className="cp-hero container" aria-labelledby="cp-title">
          <p className="cp-hero-kicker">{site.name} · এক ফোনে চারজন</p>
          <h1 id="cp-title">{site.headline}</h1>
          <p className="cp-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="চোর-ডাকাত-পুলিশ-বাবু খেলো"><ChitGame /></section>
        <section className="container section cp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <Link href="/cholo-kheli">মাঠের দেশি খেলার নিয়ম চাও? চলো খেলি →</Link>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
