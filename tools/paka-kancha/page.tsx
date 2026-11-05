import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { PakaGame } from "./components/paka-game";

export default function PakaKanchaPage() {
  return (
    <GamePage site={site} kicker="সংখ্যার ধাঁধা · রোজ নতুন কোড" title={site.headline}>
      <PakaGame />
    </GamePage>
  );
}
