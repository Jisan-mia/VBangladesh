import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { CodeGame } from './components/code-game';
import { site } from './content';

export default function PakaKanchaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pk-page">
        <section className="pk-hero container" aria-labelledby="pk-title">
          <h1 id="pk-title"><span className="pk-hero-kicker">সংখ্যার ধাঁধা · রোজ নতুন কোড</span> {site.headline}</h1>
          <p className="pk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="পাকা-কাঁচা খেলো"><CodeGame /></section>
        <section className="container section pk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
