import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { KitchenSketch } from "./components/kitchen-sketch";
import { RecipeEditor } from "./components/recipe-editor";

export default function HomePage() {
  return <PageFrame site={site}><JsonLd site={site} /><div className="rannakhata">
    <section className="container ranna-hero" aria-labelledby="ranna-title"><div><p className="eyebrow">পরিবারের রান্না লিখে রাখুন</p><h1 id="ranna-title">রেসিপির সঙ্গে<br /><span>রাখুন গল্পটাও।</span></h1><p className="ranna-lead">{site.lead}</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↓</span></a><p className="ranna-hero-note">বাংলায় লিখুন · বিনামূল্যে · অ্যাকাউন্ট লাগে না</p></div><div className="ranna-hero-art"><KitchenSketch /><p>হাতের মাপও লিখে রাখুন।</p></div></section>
    <section className="container ranna-tool" id="tool" aria-labelledby="ranna-tool-title"><div className="ranna-tool-heading"><div><p className="eyebrow">আপনার রেসিপি</p><h2 id="ranna-tool-title">রান্নাটি যেভাবে করেন</h2></div><p>লিখলেই কার্ডে সাজানো দেখতে পাবেন।<br />উপকরণ বা পরিমাণ বদলাবে না।</p></div><RecipeEditor /></section>
    <section className="container section ranna-notes" aria-labelledby="ranna-notes-title"><div><p className="eyebrow">আরেকজনও যেন রান্না করতে পারেন</p><h2 id="ranna-notes-title">যেন পড়ে রান্না করা যায়</h2></div><div><p><strong>কোন মাপে কতটুকু, লিখুন।</strong> কাপ, চামচ বা গ্রাম—যে মাপ ব্যবহার করেন, সেটি লিখুন। প্রয়োজন হলে কাপ বা চামচের আকারও বলে দিন।</p><p><strong>এক ধাপে একটি কাজ।</strong> কখন কী মেশাবেন, কতক্ষণ রাখবেন এবং কী দেখে বুঝবেন—জানা থাকলে লিখে দিন।</p><p><strong>গল্পটাও লিখে রাখুন।</strong> একই রান্না একেক ঘরে একেক রকম। আপনার শেখা পদ্ধতিটিই লিখুন। কারও নাম বা গল্প থাকলে অন্যকে পাঠানোর আগে তাঁর সঙ্গে কথা বলে নিন।</p></div></section>
    <Faq items={site.faq} />
  </div></PageFrame>;
}
