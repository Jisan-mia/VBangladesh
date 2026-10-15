import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { SafeGame } from "./components/safe-game";
import { SETS } from "./lib/sets";
import { site } from "./content";

export default function NirapodeThakiPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="nt-page">
        <section className="nt-hero container" aria-labelledby="nt-title">
          <h1 id="nt-title">{site.headline}</h1>
          <p className="nt-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="রাস্তা, পুকুর, চুলা, ঘুড়ি, মেলা আর ঝড়ের দিনে কী করতে হয়। শুধু ঠিক কাজটা দেখায়।"
            age="৬ থেকে ১০ বছর। ৬–৭ বছরে প্রশ্নটা পড়ে শোনাও।"
            together="খেলা শেষে বাসার সামনের রাস্তায় হাত ধরে দাঁড়াও। ও জোরে বলুক: ডানে, বামে, আবার ডানে।"
            school="প্রাথমিকের বিজ্ঞানে দুর্যোগ আর বিদ্যুতের নিরাপত্তার পাঠ।" />
        </section>
        <section className="container" id="tool" aria-label="নিরাপদে থাকি খেলো"><SafeGame /></section>
        <section className="container section nt-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <h3>বড়দের জন্য: প্রতিটা দৃশ্যে একটা তথ্য, একটা কাজ</h3>
          <dl className="nt-facts">{SETS.map(item => <div key={item.id}><dt>{item.bn}</dt><dd>{item.parent.fact} {item.parent.action} <small>সূত্র: {item.parent.source}</small></dd></div>)}</dl>
          <p className="nt-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
