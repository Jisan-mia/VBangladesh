import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { RoverGame } from "./components/game";
import { FACTS, SOURCE } from "./lib/facts";
import { parentNote, site } from "./content";

export default function MongoleRoverPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote(SOURCE)} />}
      more={<section className="mr-more" aria-labelledby="mr-facts-title">
        <h3 id="mr-facts-title">মঙ্গলের ১২টা কথা</h3>
        <ol className="mr-facts">{FACTS.map(fact => <li key={fact}>{fact}</li>)}</ol>
        <p className="mr-source">সূত্র: {SOURCE}</p>
      </section>}>
      <RoverGame />
    </GamePage>
  );
}
