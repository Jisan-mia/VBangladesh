import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { TukroGame } from "./components/tukro-game";

export default function ChhobirTukroPage() {
  return (
    <GamePage site={site} kicker="জিগস পাজল · ৩০টা লেভেল">
      <TukroGame />
    </GamePage>
  );
}
