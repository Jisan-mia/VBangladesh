import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { ChurirGame } from "./components/churir-game";

export default function ChurirBazarPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <ChurirGame />
    </GamePage>
  );
}
