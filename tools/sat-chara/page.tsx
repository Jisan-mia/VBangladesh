import "./product.css";
import { GamePage } from "../../shared/game-player";
import { SatCharaGame } from "./components/game";
import { site } from "./content";

export default function SatCharaPage() {
  return (
    <GamePage site={site} kicker="গলির পুরোনো খেলা, বল আর সাতটা চাড়া" title={site.headline}>
      <SatCharaGame />
    </GamePage>
  );
}
