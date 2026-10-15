import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { ChhayaGame } from "./components/chhaya-game";
import { site } from "./content";

export default function ChhayaMelaoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="cm-page">
        <section className="cm-hero container" aria-labelledby="cm-title">
          <h1 id="cm-title">{site.headline}</h1>
          <p className="cm-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="ছায়া দেখে জিনিস চেনা: আকার খেয়াল করে দেখা আর মিলিয়ে নেওয়া। শেষ ধাপে ঘোরানো ছায়া, মনে মনে জিনিস ঘুরিয়ে দেখার অভ্যাস।"
            age="৩–৬ বছর। পড়তে না জানলেও চলে।"
            together="কোলে বসিয়ে খেলো। মিলে গেলে জিজ্ঞেস করো, এটা কী? হাতির শুঁড় কোথায়? তারপর রাতে টর্চ জ্বেলে দেয়ালে আসল ছায়া বানাও।" />
        </section>
        <section className="container" id="tool" aria-label="ছায়া মেলাও খেলো"><ChhayaGame /></section>
        <section className="container section cm-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="cm-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
