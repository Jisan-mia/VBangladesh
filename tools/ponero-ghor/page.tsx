import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { PlateGame } from "./components/plate-game";

export default function PoneroGhorPage() {
  return (
    <GamePage site={site} title={<>মেলার টিনের ধাঁধা: <span>ঘুঁটি ঠেলে ১ থেকে সাজাও</span></>}>
      <PlateGame />
    </GamePage>
  );
}
