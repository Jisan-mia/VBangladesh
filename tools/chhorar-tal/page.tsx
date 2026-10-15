import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { ParentNote } from "../../shared/kids-kit";
import { ChhorarGame } from "./components/chhorar-game";
import { site } from "./content";

export default function ChhorarTalPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="ct-page">
        <section className="ct-hero container" aria-labelledby="ct-title">
          <h1 id="ct-title">{site.headline}</h1>
          <p className="ct-lead">{site.lead}</p>
          <ParentNote slug={site.slug}
            learns="তাল ধরা আর শেষের মিল শোনা (ধ্বনি-সচেতনতা), পড়তে শেখার আগের ধাপ। বড় অক্ষরে শব্দ বাঁ থেকে ডানে জ্বলে, তাই চোখও লাইন ধরে চলতে শেখে।"
            age="৩–৬ বছর। পড়তে না জানলেও চলে।"
            together="পাশে বসে ছড়াটা জোরে জোরে বলো, ছোটজন ঢোলে চাপ দিক। তারপর ফোন রেখে দুজনে হাতে তালি দিয়ে আরেকবার বলো, প্রতি শব্দে একটা তালি।"
            school="প্রাক-প্রাথমিক আর প্রথম শ্রেণির বাংলায় ছড়া আর অন্ত্যমিল আছে। সব ছড়া লোকছড়া, রবীন্দ্রনাথ (১৮৯৪) আর যোগীন্দ্রনাথ সরকারের (১৮৯৯) সংকলন থেকে।" />
        </section>
        <section className="container" id="tool" aria-label="ছড়ার তালে খেলো"><ChhorarGame /></section>
        <section className="container section ct-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="ct-privacy">{site.privacy[0]}</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
