import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { WishBuilder } from "./components/wish-builder";

export default function ShubhechhaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="wish">
        <section className="wish-hero container" aria-labelledby="wish-title">
          <p className="wish-kicker">উৎসব, জন্মদিন, বিবাহবার্ষিকী আর প্রোফাইল ফ্রেম</p>
          <h1 id="wish-title">এবারের শুভেচ্ছা যাক<br /><span>নিজের নামে</span></h1>
          <p className="wish-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="শুভেচ্ছা কার্ড বানাও"><WishBuilder /></section>
        <section className="container section wish-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
