import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { HatDhuiGame } from "./components/game";
import { FACTS } from "./lib/facts";
import { MODES } from "./lib/levels";
import { site } from "./content";

export default function HatDhuiPage() {
  return (
    <GamePage site={site} kids title={site.headline}
      note={<ParentNote slug={site.slug}
        learns="WHO-র ৬ ধাপে ২০ সেকেন্ড হাত ধোয়া, ২ মিনিট দাঁত মাজা, আর কখন হাত ধুতে হয়। icddr,b-র গবেষণায়, খাওয়ার আগে আর টয়লেটের পরে সাবানে হাত ধুলে শিশুদের ডায়রিয়া কমে।"
        age="৩–৮ বছর। পড়তে না জানলেও চলে।"
        together="ফোনটা বেসিনের পাশে রেখে পাশাপাশি হাত ধোও, ধাপ মিলিয়ে। কে আগে নখ ঘষে, দেখো।" />}
      more={<section className="hd-facts-block" aria-labelledby="hd-facts-title">
        <h3 id="hd-facts-title">বড়দের জন্য: একটা তথ্য, একটা কাজ</h3>
        <dl className="hd-facts">{MODES.map(mode => <div key={mode.id}><dt>{mode.bn}</dt><dd>{FACTS[mode.id].fact} {FACTS[mode.id].action} <small>সূত্র: {FACTS[mode.id].source}</small></dd></div>)}</dl>
      </section>}>
      <HatDhuiGame />
    </GamePage>
  );
}
