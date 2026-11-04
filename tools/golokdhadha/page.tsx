import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { GolokdhadhaGame } from "./components/golokdhadha-game";

export default function GolokdhadhaPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <GolokdhadhaGame />
    </GamePage>
  );
}
