import "./product.css";
import { GamePage } from "../../shared/game-player";
import { BadmintonGame } from "./components/game";
import { site } from "./content";

export default function GolirBadmintonPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <BadmintonGame />
    </GamePage>
  );
}
