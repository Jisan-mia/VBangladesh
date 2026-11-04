import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { PhotaoGame } from "./components/photao-game";

export default function ChhobiPhotaoPage() {
  return (
    <GamePage site={site} kicker="ননোগ্রাম ধাঁধা · ৩০টা ছবি">
      <PhotaoGame />
    </GamePage>
  );
}
