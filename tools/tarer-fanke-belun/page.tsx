import "./product.css";
import { GamePage } from "../../shared/game-player";
import { BelunGame } from "./components/belun-game";
import { site } from "./content";

export default function TarerFankeBelunPage() {
  return (
    <GamePage site={site} title={site.headline} more={
      <p className="tb-street-note"><b>রাস্তায় মনে রেখো:</b> তারে আটকানো ঘুড়ি বা বেলুন কখনো টেনে নামাতে যেয়ো না, ওতে বিদ্যুৎ থাকতে পারে। ঘুড়ি ওড়াও খোলা মাঠে, তারের কাছে না।</p>
    }>
      <BelunGame />
    </GamePage>
  );
}
