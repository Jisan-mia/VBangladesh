import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ChhipFeloGame } from "./components/chhip-felo";
import { site } from "./content";

export default function ChhipFeloPage() {
  return (
    <GamePage site={site} kicker="বাঁশের ছিপ, শোলার ফাতনা, চার জায়গার মাছ" title={site.headline}>
      <ChhipFeloGame />
    </GamePage>
  );
}
