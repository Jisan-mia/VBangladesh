import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { HaggleGame } from "./components/haggle-game";
import { bn, routes } from "./lib/haggle";

export default function MamaJabenPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="mama">
        <section className="mama-hero container" aria-labelledby="mama-title">
          <p className="mama-kicker">{bn(routes.length)}টা রাস্তা · ৩ দফা দরদাম</p>
          <h1 id="mama-title">মামা, যাবেন? <span>দরদাম করে দেখো</span></h1>
          <p className="mama-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="মামার সাথে দরদাম"><HaggleGame /></section>

        <section className="container section mama-note" aria-labelledby="note-title">
          <h2 id="note-title">ভাড়াগুলো কি আসল?</h2>
          <p>না। এখানে যত ভাড়া দেখো, সব খেলার জন্য বানানো গোল সংখ্যা, কোনো ভাড়ার তালিকা না। আসল ভাড়া ঠিক হয় দূরত্ব, সময়, রোদ-বৃষ্টি আর জ্যাম দেখে, মামার সাথে কথা বলে। জায়গার নামগুলো শুধু ঢাকার চেনা মোড় আর এলাকা।</p>
          <p>খেলার মামা চরিত্রটা বানানো হয়েছে ঢাকার রিকশাচালকদের প্রতি ভালোবাসা থেকে। রোদ, বৃষ্টি আর জ্যাম ঠেলে এঁরাই আমাদের রোজ পৌঁছে দেন। তাই এখানে মামা হাসেন, ঠাট্টা করেন, প্রায়ই জেতেন। আর সবচেয়ে ভালো ফল হলো ন্যায্য ভাড়ায় রাজি করানো, যাতে দুজনেই খুশি।</p>
        </section>

        <section className="container section mama-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section mama-suggest" aria-label="রাস্তার পরামর্শ"><SuggestBox tool="mama-jaben" question="কোন রাস্তাটা থাকা উচিত ছিল?" placeholder="যেমন: টিএসসি থেকে চানখারপুল" /></section>
      </div>
    </PageFrame>
  );
}
