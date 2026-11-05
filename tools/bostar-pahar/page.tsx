import "./product.css";
import { GamePage } from "../../shared/game-player";
import { CraneGame } from "./components/crane-game";
import { site } from "./content";

export default function BostarPaharPage() {
  return (
    <GamePage site={site} kicker="নদীঘাটের ক্রেন, এক চাপের খেলা" title={site.headline}>
      <CraneGame />
    </GamePage>
  );
}
