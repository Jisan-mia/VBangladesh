import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { TangramGame } from "./components/game";
import { parentNote, site } from "./content";

export default function SatTukroPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="st-more" aria-labelledby="st-print-title">
        <h3 id="st-print-title">কেটে খেলার পাতা</h3>
        <p>সাত টুকরোর বর্গ আর ছয়টা ছবির ছায়া, A4 কাগজে। শক্ত কাগজে প্রিন্ট করে দাগ ধরে কাটো। কাঁচিটা বড়রা ধরবে।</p>
        <a href="/sat-tukro?print">কাটার পাতা প্রিন্ট করো</a>
      </section>}>
      <TangramGame />
    </GamePage>
  );
}
