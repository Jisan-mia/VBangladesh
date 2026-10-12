import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { site } from './content';
import { FordoBuilder } from './components/fordo-builder';

export default function BazarNotePage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="bazar">
      <section className="bazar-hero container" aria-labelledby="bazar-title">
        <h1 id="bazar-title"><span className="bazar-kicker">বাজারের লিস্ট · সাপ্তাহিক, মাসের, রোজার, ঈদের</span> বাজারে কী কী আনতে হবে?<br /><span>ফর্দটা লিখে পাঠাও</span></h1>
        <p className="bazar-lead">{site.lead}</p>
      </section>
      <section className="container" id="tool" aria-label="বাজারের ফর্দ"><FordoBuilder /></section>
      <section className="container section bazar-guide" id="guide" aria-labelledby="guide-title">
        <h2 id="guide-title">{site.guideTitle}</h2>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
