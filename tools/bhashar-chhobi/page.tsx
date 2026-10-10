import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { CardBuilder } from './components/card-builder';
import { site } from './content';

export default function BhasharChhobiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bc-page">
        <section className="bc-hero container" aria-labelledby="bc-title">
          <p className="bc-hero-kicker">আঞ্চলিক ভাষা · ৬৪ জেলা</p>
          <h1 id="bc-title">তোমাদের এলাকায় <span>এটাকে কী বলে?</span></h1>
          <p className="bc-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="নিজের এলাকার শব্দে কার্ড বানাও"><CardBuilder /></section>
        <section className="container section bc-story" aria-labelledby="bc-story-title">
          <h2 id="bc-story-title">নানা-দাদিকে একবার জিজ্ঞেস করে দেখো</h2>
          <p>ছবিটা দেখিয়ে জিজ্ঞেস করো, ছোটবেলায় তাঁরা এটাকে কী বলতেন। তাঁদের মুখের নামটা লিখে কার্ডটা রেখে দাও। অন্য জেলার বন্ধুকে জিজ্ঞেস করলে হয়তো একদম আলাদা একটা নাম শুনবে।</p>
          <p>কারও কথা ভুল প্রমাণের জন্য না। “আমাদের এলাকায় এটাকে বলে…” এই গল্পটা করার জন্যই এই ছবিখাতা।</p>
        </section>
        <section className="container section bc-guide" aria-labelledby="bc-guide-title">
          <h2 id="bc-guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
