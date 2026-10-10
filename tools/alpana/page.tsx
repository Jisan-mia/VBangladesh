import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { AlpanaStudio } from "./components/alpana-studio";

const bn = new Intl.NumberFormat("bn-BD");

export default function AlpanaPage() {
  return <PageFrame site={site}><JsonLd site={site} /><div className="alpana">
    <section className="alp-hero container alp-screen" aria-labelledby="alpana-title">
      <p className="alp-kicker">আলপনা ডিজাইন · বৈশাখ, একুশে, পূজা, গায়ে হলুদ</p>
      <h1 id="alpana-title">আজ উঠোনে আলপনা দেবে?<br /><span>ডিজাইন তৈরিই আছে।</span></h1>
      <p className="alp-lead">{site.lead}</p>
    </section>
    <section className="container alp-tool" id="tool" aria-label="আলপনা আঁকো"><AlpanaStudio /></section>
    <section className="container section alp-guide alp-screen" aria-labelledby="alpana-guide-title">
      <h2 id="alpana-guide-title">{site.guideTitle}</h2>
      <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn.format(index + 1)}</span><p>{step}</p></li>)}</ol>
      <p className="alp-origin">মোটিফগুলো বাংলার আলপনার ফুল, পাতা আর জ্যামিতিক নকশা থেকে ধারণা নিয়ে নতুন করে আঁকা, কোনো নির্দিষ্ট আচার বা শিল্পীর নকশার কপি না। আলপনার ইতিহাস জানতে <a href="https://en.banglapedia.org/index.php?title=Alpana" rel="external">বাংলাপিডিয়া পড়ো ↗</a></p>
    </section>
    <div className="alp-screen"><Faq items={site.faq} /></div>
  </div></PageFrame>;
}
