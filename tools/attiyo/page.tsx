import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { Album } from "./components/album";
import { bn, chainText, dictionaryUrl, terms, type Kind, type Step } from "./lib/kin";
import { site } from "./content";

const groups: Array<[Kind, string]> = [
  ["core", "নিজের পরিবার"],
  ["grand", "দাদা-দাদি, নানা-নানি"],
  ["elder", "চাচা-ফুপু, মামা-খালা"],
  ["cousin", "কাজিন"],
  ["young", "ছোটরা"],
  ["inlaw", "বিয়ের সূত্রে"],
  ["bond", "দুই পরিবারের বাঁধন"],
];
const total = Object.keys(terms).length;
const shown = (term: string) => term ? term.replace(/ \/ /g, " বা ") : "—";

export default function AttiyoPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="at-site">
        <section className="container at-hero" aria-labelledby="at-title">
          <p className="at-hero-kicker">পারিবারিক অ্যালবাম · চাচা-ফুপু, কাকা-পিসি দুটোই</p>
          <h1 id="at-title">কে কী হয়? <span>সম্পর্কের নাম খুঁজে দেখো</span></h1>
        </section>
        <section className="container" id="tool" aria-label="সম্পর্কের নাম খোঁজো"><Album /></section>

        <section className="container section at-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="at-sources">সূত্র ও যাচাই: প্রতিটা নাম বাংলা একাডেমির অভিধানের সাথে মিলিয়ে লেখা (সরকারের <a href="https://accessibledictionary.gov.bd/" target="_blank" rel="noopener noreferrer">অ্যাক্সেসিবল ডিকশনারি</a>, যার ভিত্তি বাংলা একাডেমির অভিধান)। হিন্দু আর মুসলিম পরিবারের ডাকের ভাগ মেলানো হয়েছে মিশিগান স্টেট ইউনিভার্সিটির <a href="https://openbooks.lib.msu.edu/basicbangla/chapter/5-1-kinship-terms-in-bangla/" target="_blank" rel="noopener noreferrer">Basic Bangla</a> বইয়ের সাথে। পরিবার আর এলাকাভেদে ডাক বদলায়; এখানে কোনো ডাককে একমাত্র ঠিক বলা হয়নি। সৎ-সম্পর্ক বা দ্বিতীয় বিয়ের হিসাব এখানে নেই।</p>
        </section>

        <section className="container section at-list" aria-labelledby="list-title">
          <h2 id="list-title">সব সম্পর্কের নাম, এক জায়গায়</h2>
          <p>এখানে যে {bn(total)}টা সম্পর্কের নাম আছে, সবগুলো হাতে মিলিয়ে দেখা। এর বাইরে যেকোনো সম্পর্কে টুলটা নাম বানায় না, মানুষ যেভাবে বলে সেভাবে লেখে।</p>
          <details>
            <summary>পুরো তালিকা দেখো</summary>
            {groups.map(([kind, label]) => (
              <table key={kind} className="at-group">
                <caption>{label}</caption>
                <thead><tr><th scope="col">সম্পর্ক</th><th scope="col">চাচা-ফুপুর ঘরে</th><th scope="col">কাকা-পিসির ঘরে</th></tr></thead>
                <tbody>
                  {Object.entries(terms).filter(([, entry]) => entry.kind === kind).map(([key, entry]) => (
                    <tr key={key}>
                      <th scope="row">{chainText(key.split(".") as Step[], "k")} <a href={dictionaryUrl(entry.head)} target="_blank" rel="noopener noreferrer" aria-label={`${shown(entry.c || entry.k)}: অভিধানে দেখো`}>↗</a></th>
                      <td>{shown(entry.c)}</td>
                      <td>{shown(entry.k)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </details>
        </section>

        <Faq items={site.faq} />
        <section className="container section at-suggest" aria-label="সম্পর্কের নামের পরামর্শ"><SuggestBox tool="attiyo" question="তোমাদের এলাকায় অন্য কোনো ডাক চলে?" placeholder="যেমন: আমাদের বাসায় ফুপুকে ফুপি ডাকে…" /></section>
      </div>
    </PageFrame>
  );
}
