import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { JoraGame } from "./components/jora-game";

export default function JoraMelaoPage() {
  return (
    <GamePage site={site} kicker="মেমোরি গেম · একা বা দুজনে" title={site.headline}>
      <JoraGame />
    </GamePage>
  );
}
