import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { RecipeEditor } from "./components/recipe-editor";

export default function RannakhataPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="rannakhata">
        <section className="ranna-hero container" aria-labelledby="ranna-title">
          <p className="ranna-kicker">মায়ের রান্নাখাতা · নমুনাটা বদলে লেখো</p>
          <h1 id="ranna-title">মায়ের হাতের রান্না,<br /><span>খাতায় থাকুক</span></h1>
          <p className="ranna-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="রেসিপি লেখো"><RecipeEditor /></section>
        <section className="container section ranna-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
