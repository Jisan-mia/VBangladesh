import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { SplitModes } from './components/split-modes';
import { site } from './content';
import './product.css';

export default function BhagabhagiPage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="bhagabhagi">
      <section className="split-hero container" aria-labelledby="split-title">
        <h1 id="split-title"><span className="split-kicker">খরচ ভাগাভাগির হিসাব · কক্সবাজার, সাজেক, মেসের মিল রেট</span> ট্যুর শেষ, হিসাব বাকি?<br /><span>এক মিনিটে মিলিয়ে ফেলো</span></h1>
        <p className="split-lead">{site.lead}</p>
      </section>
      <section className="container" id="tool" aria-label="খরচের হিসাব"><SplitModes /></section>
      <section className="container section split-guide" id="guide" aria-labelledby="guide-title">
        <h2 id="guide-title">{site.guideTitle}</h2>
        <p>{site.guideIntro}</p>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
