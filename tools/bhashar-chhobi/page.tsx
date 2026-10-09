import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { CardBuilder } from './components/card-builder';
import { site } from './content';
export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site}/><section className="container creative-hero language-hero"><div><p className="eyebrow">চেনা ছবি · নিজের মুখের নাম</p><h1>ছবি একটাই।<br/>তোমাদের এলাকায় কী বলে?</h1><p className="intro">{site.lead}</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="creative-note">ফ্রি · অ্যাকাউন্ট লাগে না</p></div><div className="language-heading-art" aria-hidden="true"><span>একেক মুখে</span><strong>একেক নাম</strong><div>শোনো। লেখো। মিলিয়ে দেখো।</div></div></section><section className="container creative-workbench" id="tool" aria-label="ভাষার ছবিকার্ড বানাও"><CardBuilder/></section><section className="container creative-story"><h2>নানা-দাদিকে একবার জিজ্ঞেস করে দেখো</h2><div><p>ছবিটা দেখিয়ে জিজ্ঞেস করো, ছোটবেলায় তাঁরা এটাকে কী বলতেন। তাঁদের মুখের নামটা লিখে কার্ডটা রেখে দাও। বন্ধুকে জিজ্ঞেস করলে হয়তো আরেকটা নাম শুনবে।</p><p>কারও কথা ভুল প্রমাণের জন্য না। “আমাদের এলাকায় এটাকে বলে…” এই গল্পটা করার জন্যই এই ছবিখাতা।</p><a href="/bhashar-chhobi/guide">কার্ড বানানোর নিয়মটা দেখো</a></div></section><Faq items={site.faq}/></PageFrame>;
}
