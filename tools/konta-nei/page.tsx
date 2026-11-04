import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { ShopGame } from "./components/shop-game";

export default function KontaNeiPage() {
  return (
    <GamePage site={site} kicker="ছোটবেলার ‘কোনটা নেই’ খেলা, পাড়ার মুদি দোকানে" title={site.headline}>
      <ShopGame />
    </GamePage>
  );
}
