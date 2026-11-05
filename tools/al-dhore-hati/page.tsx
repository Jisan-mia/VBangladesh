import "./product.css";
import { GamePage } from "../../shared/game-player";
import { WalkGame } from "./components/walk-game";
import { site } from "./content";

export default function AlDhoreHatiPage() {
  return (
    <GamePage site={site} kicker="ধানখেতের সরু আল, দুপাশে কাদা" title={site.headline}>
      <WalkGame />
    </GamePage>
  );
}
