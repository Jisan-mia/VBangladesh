import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { PlacesList } from "./components/places-list";
import { TicketCounter } from "./components/ticket-counter";

export default function JibhPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="jb-page">
        <section className="container jb-hero" aria-labelledby="jb-title">
          <p className="jb-hero-kicker">ট্রেনের টিকিট · ৬টা খাবার · ২০টা গন্তব্য</p>
          <h1 id="jb-title">তোমার জিভ কোন জেলার <span>টিকিট কাটবে?</span></h1>
          <p className="jb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="জিভের টিকিট কাটো"><TicketCounter /></section>
        <section className="container section jb-list" id="places" aria-labelledby="places-title">
          <h2 id="places-title">জেলার বিখ্যাত খাবার: ২০টা গন্তব্য</h2>
          <p>যে খাবার যেখানকার বলে পরিচিত, সূত্রসহ। জিআই পণ্যের পাশে সরকারি রেজিস্ট্রেশন নম্বর।</p>
          <PlacesList />
        </section>
        <section className="container section jb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section jb-suggest" aria-label="খাবারের পরামর্শ"><SuggestBox tool="jibh" question="কোন জেলার কোন খাবার থাকা উচিত ছিল?" placeholder="যেমন: রাজশাহীর মিষ্টি পান, মানিকগঞ্জের হাজারী গুড়" /></section>
      </div>
    </PageFrame>
  );
}
