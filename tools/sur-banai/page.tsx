import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { SurGame } from "./components/game";
import { parentNote, site } from "./content";
import { WORLDS } from "./lib/levels";

const IDEAS = [
  "শুনে মেলাও: একটা সুর শুনে আলো দেখো, তারপর ঠিক ওই ঘরগুলোতে চাপো। ওপরে ওঠা, নিচে নামা, একই নোট দুবার, পাহাড়। শিশু শেখে মনে রাখতে।",
  "একসাথে দুটো: এক তালে দুটো নোট বাজে, তাই একই সারিতে দুটো ঘর জ্বলে। শিশু শেখে একসাথে দুই জিনিস ধরতে।",
  "ফাঁক ভরো: সুরটা বারবার ফিরে আসে, কিন্তু একটা নোট নেই। শিশু শেখে নকশা দেখে বাকিটা আন্দাজ করতে।",
  "নিজে বানাও: সিঁড়ি, পাহাড়, তারপর যেকোনো গান। এখানে কোনো একটা উত্তর নেই, নিয়ম মানলেই ঠিক।",
];

export default function SurBanaiPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="sb-more" aria-labelledby="sb-ideas-title">
        <h3 id="sb-ideas-title">বড়দের জন্য: চার জায়গায় চারটা জিনিস শেখা</h3>
        <dl className="sb-facts">{WORLDS.map((world, index) => <div key={world.id}><dt>{world.name}</dt><dd>{IDEAS[index]}</dd></div>)}</dl>
      </section>}>
      <SurGame />
    </GamePage>
  );
}
