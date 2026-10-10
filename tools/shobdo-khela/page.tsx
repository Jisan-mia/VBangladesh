import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { Shobdojot } from './components/shobdojot';
import { site } from './content';

export default function ShobdojotPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jot-page">
        <section className="container jot-hero" aria-labelledby="jot-title">
          <p className="jot-hero-kicker">রোজ ৫টা নতুন শব্দ · দুই মিনিটের খেলা</p>
          <h1 id="jot-title">আজকের শব্দজট, <span>তুমি কয়টা পারো?</span></h1>
          <p className="jot-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="আজকের শব্দজট খেলো"><Shobdojot /></section>
        <section className="container section jot-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
