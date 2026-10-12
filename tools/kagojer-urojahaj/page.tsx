import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { PlaneGame } from "./components/plane-game";
import { site } from "./content";

export default function KagojerUrojahajPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ku-page">
        <section className="ku-hero container" aria-labelledby="ku-title">
          <h1 id="ku-title"><span className="ku-hero-kicker">{site.name} · বর্ষার আকাশের খেলা</span> {site.headline}</h1>
          <p className="ku-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="কাগজের উড়োজাহাজ খেলো"><PlaneGame /></section>
        <section className="container section ku-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
