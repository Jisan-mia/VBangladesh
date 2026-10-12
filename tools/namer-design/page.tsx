import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { NameStudio } from "./components/name-studio";
import { site } from "./content";

export default function NamerDesignPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="namer-page">
        <section className="container namer-hero" aria-labelledby="namer-title">
          <h1 id="namer-title"><span className="namer-hero-kicker">বাংলা নাম স্টাইল · ৮টা ঢং</span> {site.headline}</h1>
          <p className="namer-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="নাম সাজাও"><NameStudio /></section>
        <section className="container section namer-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section namer-suggest" aria-label="নতুন ঢঙের পরামর্শ"><SuggestBox tool="namer-design" question="আর কোন ঢঙে নাম লেখা দেখতে চাও?" placeholder="যেমন: মেহেদির নকশা, পুরনো সাইনবোর্ড" /></section>
      </div>
    </PageFrame>
  );
}
