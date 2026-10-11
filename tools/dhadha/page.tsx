import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { SuggestBox } from '../../shared/share-kit';
import { KupiNight } from './components/kupi-night';
import { site } from './content';

export default function DhadhaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dh-page">
        <section className="container dh-hero" aria-labelledby="dh-title">
          <p className="dh-hero-kicker">রোজ একটা পুরোনো শোলক · রাত ১২টায় নতুন</p>
          <h1 id="dh-title">নানির ধাঁধা, <span>আজকেরটা পারবে?</span></h1>
        </section>
        <section className="container" id="tool" aria-label="আজকের ধাঁধা খেলো"><KupiNight /></section>
        <section className="container section dh-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="dh-source"><strong>সূত্র:</strong> ধাঁধাগুলো মুখে মুখে চলে আসা লোকজ শোলক। শব্দ আর উত্তর মিলিয়ে দেখা হয়েছে বাংলাপিডিয়ার “ধাঁধা” ভুক্তি, প্রথম আলোর দুটো লেখা (এপ্রিল ২০২৩) আর কয়েকটা জনপ্রিয় সংকলনের সাথে। যেখানে উত্তর নিয়ে মতভেদ, সেই ধাঁধা বাদ দেওয়া হয়েছে। অঞ্চলভেদে শব্দ একটু আলাদা হতে পারে।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section dh-suggest" aria-label="ধাঁধার পরামর্শ"><SuggestBox tool="dhadha" question="তোমার নানি-দাদির কোন ধাঁধাটা থাকা উচিত?" placeholder="ধাঁধা আর উত্তর দুটোই লিখো" /></section>
      </div>
    </PageFrame>
  );
}
