import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { ChakGame } from "./components/chak-game";

export default function BhimrulerChakPage() {
  return (
    <GamePage site={site} kicker="আমবাগানের সংখ্যার ধাঁধা · ৩০টা লেভেল" title={site.headline}>
      <ChakGame />
    </GamePage>
  );
}
