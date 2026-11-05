import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentGate, ParentNote } from "../../shared/kids-kit";
import { AbcGame } from "./components/game";
import { parentNote, site } from "./content";

export default function AbcBazarPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="ab-more" aria-labelledby="ab-print-title">
        <h3 id="ab-print-title">খাতার পাশে রাখার জন্য</h3>
        <p>A4 পাতায় ২৬টা অক্ষর আর সাদা ছবি, রং করার জন্য। পাতাটা বড়দের জন্য।</p>
        <ParentGate label="বড়দের জন্য">
          <a className="kit-secondary" href="/abc-bazar?print">A–Z রং করার পাতা</a>
        </ParentGate>
      </section>}>
      <AbcGame />
    </GamePage>
  );
}
