import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { site } from './content';
import { SceneComposer } from './components/SceneComposer';

const bn = new Intl.NumberFormat('bn-BD');

export default function ChhottoParaPage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="para-home">
      <section className="para-hero container" aria-labelledby="para-heading">
        <p className="para-kicker">টিনের ঘর · আমগাছ · উঠোনে ঘুড়ি</p>
        <h1 id="para-heading">তোমার পাড়া থেকে<br /><span>একটা পোস্টকার্ড</span></h1>
        <p className="para-lead">{site.lead}</p>
      </section>
      <section className="container" id="tool" aria-label="পাড়া সাজাও"><SceneComposer /></section>
      <section className="container section para-guide" aria-labelledby="para-guide-title">
        <h2 id="para-guide-title">{site.guideTitle}</h2>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn.format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
