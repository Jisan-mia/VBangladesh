import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { SnakeGame } from "./components/snake-game";

export default function JhalmuriSapPage() {
  return (
    <GamePage site={site} kicker="পুরোনো দিনের সাপের গেম, এবার ঠোঙায়" title={<>সাপটা ঝালমুড়ি খাবে, <span>তুমি চালাও</span></>}>
      <SnakeGame />
    </GamePage>
  );
}
