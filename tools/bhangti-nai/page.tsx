import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { ShopGame } from './components/shop-game';
import { site } from './content';

export default function BhangtiNaiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bt-page">
        <section className="bt-hero container" aria-labelledby="bt-title">
          <p className="bt-hero-kicker">{site.name} · মুদি দোকানে ভাংতির রাশ</p>
          <h1 id="bt-title">{site.headline}</h1>
          <p className="bt-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ভাংতি নাই! খেলো"><ShopGame /></section>
        <section className="container section bt-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
