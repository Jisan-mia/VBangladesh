import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { GhoriGame } from "./components/game";
import { parentNote, site } from "./content";

export default function GhoriDekhiPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="gd-more" aria-labelledby="gd-print-title">
        <h3 id="gd-print-title">প্রিন্টের পাতা</h3>
        <p>খাতায় অনুশীলনের জন্য: <a href="/ghori-dekhi?print">ছয়টা খালি ঘড়ি প্রিন্ট করো</a> (A4), কাঁটা এঁকে দেবে। ব্রাউজারের প্রিন্ট থেকে PDF হিসেবেও রাখা যায়।</p>
      </section>}>
      <GhoriGame />
    </GamePage>
  );
}
