import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { SolarGame } from "./components/game";
import { parentNote, site } from "./content";

export default function SourojogotPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<p className="sj-print-more">স্কুলের প্রজেক্টের জন্য: <a href="/sourojogot?print">আট গ্রহের কাট-আউট প্রিন্ট করো</a> (A4, আসল অনুপাতে)।</p>}>
      <SolarGame />
    </GamePage>
  );
}
