import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { MarbleGame } from "./components/marble";

export default function MarbleSinriPage() {
  return (
    <GamePage site={site} kicker="ছাদ থেকে গলি · ১২টা তলা" title={site.headline}>
      <MarbleGame />
    </GamePage>
  );
}
