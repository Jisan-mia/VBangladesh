import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { KitchenSketch } from "./components/kitchen-sketch";
import { RecipeEditor } from "./components/recipe-editor";

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site} /><div className="rannakhata">
    <section className="container ranna-hero" aria-labelledby="ranna-title"><div><p className="eyebrow">মা-নানির রান্না, তোমার খাতায়</p><h1 id="ranna-title">মায়ের হাতের রান্না<br /><span>খাতায় তুলে রাখো।</span></h1><p className="ranna-lead">{site.lead}</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="ranna-hero-note">বাংলায় লেখো · ফ্রি · অ্যাকাউন্ট লাগে না</p></div><div className="ranna-hero-art"><KitchenSketch /><p>হাতের আন্দাজটাও লিখে রাখো।</p></div></section>
    <section className="container ranna-tool" id="tool" aria-labelledby="ranna-tool-title"><div className="ranna-tool-heading"><div><p className="eyebrow">তোমার রেসিপি</p><h2 id="ranna-tool-title">রান্নাটা যেভাবে করো</h2></div><p>লিখলেই কার্ডে সেজে যাবে।<br />উপকরণ বা মাপ আমরা একটুও বদলাই না।</p></div><RecipeEditor /></section>
    <section className="container section ranna-notes" aria-labelledby="ranna-notes-title"><div><p className="eyebrow">অন্য কেউ যেন পড়েই রাঁধতে পারে</p><h2 id="ranna-notes-title">যেভাবে লিখলে বুঝতে সুবিধা</h2></div><div><p><strong>কোন মাপে কতটুকু, লেখো।</strong> কাপ, চামচ, গ্রাম না মুঠো, যে মাপে রাঁধো সেটাই লেখো। দরকার হলে কোন কাপ বা কোন চামচ, সেটাও বলে দাও।</p><p><strong>এক ধাপে একটা কাজ।</strong> কখন কী দেবে, কতক্ষণ চুলায় রাখবে, কী দেখে বুঝবে হয়ে গেছে, জানা থাকলে লিখে দাও।</p><p><strong>গল্পটাও লিখে রাখো।</strong> একই রান্না একেক বাড়িতে একেক রকম। তুমি যেভাবে শিখেছ, সেটাই লেখো। কারো নাম বা গল্প থাকলে অন্যকে পাঠানোর আগে তাকে জিজ্ঞেস করে নিও।</p></div></section>
    <Faq items={site.faq} />
  </div></PageFrame>;
}
