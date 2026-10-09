import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { ChildhoodSketch } from "./components/memory-sketch";
import { PostcardBuilder } from "./components/postcard-builder";

export default function HomePage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="childhood">
        <section className="childhood-hero container" aria-labelledby="childhood-title">
          <div className="childhood-hero-copy"><p className="eyebrow"><span className="childhood-ink-line" aria-hidden="true" />ছোটবেলার স্মৃতি দিয়ে পোস্টকার্ড</p><h1 id="childhood-title">ছোটবেলার স্মৃতি,<br /><span>নিজের পোস্টকার্ডে।</span></h1><p className="childhood-lead">{site.lead}</p><a className="button childhood-hero-cta" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="childhood-hero-note">বিনামূল্যে · নাম না দিলেও হবে · ছবি ডাউনলোড করুন</p></div>
          <div className="childhood-hero-art"><ChildhoodSketch /><p>কাগজের নৌকা ভাসানো<br />মনে পড়ে?</p></div>
        </section>
        <section className="container childhood-tool-section" id="tool" aria-labelledby="tool-title"><div className="childhood-section-heading"><div><p className="eyebrow">এক পাতায় আপনার ছোটবেলা</p><h2 id="tool-title">আপনার স্মৃতিগুলো বেছে নিন</h2></div><p>সবার ছোটবেলা এক নয়।<br />শুধু নিজের সঙ্গে মেলে, এমনগুলো রাখুন।</p></div><PostcardBuilder /></section>
        <section className="container section childhood-guide" id="guide" aria-labelledby="guide-title"><div><p className="eyebrow">কার্ড বানানোর নিয়ম</p><h2 id="guide-title">{site.guideTitle}</h2><p>{site.guideIntro}</p></div><ol>{site.steps.map((step, index) => <li key={step}><span>{new Intl.NumberFormat("bn-BD").format(index + 1).padStart(2, "০")}</span><p>{step}</p></li>)}</ol></section>
        <section className="container section childhood-privacy" id="privacy" aria-labelledby="privacy-title"><div><p className="eyebrow">আপনার তথ্য</p><h2 id="privacy-title">নাম ও পছন্দ কোথায় থাকে</h2></div><div>{site.privacy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
