import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { BaghGame } from "./components/bagh-game";

export default function BaghbandiPage() {
  return (
    <GamePage site={site} kicker="বাঘবন্দি খেলা · উঠোনের দাগ, নুড়ি আর তেঁতুলের বিচি" title={site.headline}>
      <BaghGame />
    </GamePage>
  );
}
