import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { CardBuilder } from './components/card-builder';
import { site } from './content';
export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site}/><section className="container creative-hero language-hero"><div><p className="eyebrow">চেনা ছবি · নিজের বলা নাম</p><h1>ছবি এক।<br/>এটিকে আপনারা কী বলেন?</h1><p className="intro">{site.lead}</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="creative-note">বাংলায় লিখুন · ছবি রাখুন · নিবন্ধন লাগে না</p></div><div className="language-heading-art" aria-hidden="true"><span>একেক মুখে</span><strong>একেক নাম</strong><div>শুনুন। লিখুন। মিলিয়ে দেখুন।</div></div></section><section className="container creative-workbench" id="tool" aria-label="ভাষার ছবিকার্ড তৈরি"><CardBuilder/></section><section className="container creative-story"><h2>বাড়ির বড়দের জিজ্ঞেস করে দেখুন</h2><div><p>একই ছবি দেখিয়ে জানতে পারেন, ছোটবেলায় তাঁরা কী বলতেন। তাঁদের বলা নাম লিখে কার্ডটি রেখে দিন। বন্ধুদের কাছে জানতে চাইলে হয়তো আরেকটি নাম শুনবেন।</p><p>কারও কথাকে ভুল বলার জন্য নয়। পরিচিত জিনিসের আলাদা নাম নিয়ে কথা বলার জন্য এই ছবিখাতা।</p><a href="/bhashar-chhobi/guide">ছবিকার্ড বানানোর নিয়ম পড়ুন</a></div></section><Faq items={site.faq}/></PageFrame>;
}
