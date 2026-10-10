import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { SlamBook } from "./components/slam-book";

export default function KotoChenoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="kc-page">
        {/* The hero lives inside SlamBook: a friend's link turns it into "তুমি রাফিকে কতটা চেনো?". */}
        <SlamBook />
        <section className="container section kc-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
