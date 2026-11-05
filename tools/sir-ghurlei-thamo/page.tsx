import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ClassGame } from "./components/class-game";
import { site } from "./content";

export default function ChitPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <ClassGame />
    </GamePage>
  );
}
