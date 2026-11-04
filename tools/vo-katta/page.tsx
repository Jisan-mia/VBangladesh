import "./product.css";
import { GamePage } from "../../shared/game-player";
import { VoKattaGame } from "./components/vo-katta";
import { site } from "./content";

export default function VoKattaPage() {
  return (
    <GamePage site={site} kicker="ঘুড়ি কাটাকাটির খেলা · পুরান ঢাকার সাকরাইন" title={site.headline}>
      <VoKattaGame />
    </GamePage>
  );
}
