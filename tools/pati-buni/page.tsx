import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { LoomGame } from "./components/loom-game";

export default function PatiBuniPage() {
  return (
    <GamePage site={site} kicker="পুরোনো দিনের ব্লক গেম, এবার বেতের ফালিতে" title={<>সারি ভরাও, <span>শীতলপাটি বোনো</span></>}
      more={<p className="pb-credit">শীতলপাটি বোনা সিলেট অঞ্চলের পাটিকরদের হাতের কাজ। এই খেলা শুধু সেই কাজকে মনে করিয়ে দেয়, কোনো শিল্পী বা সংগঠনের সাথে আমাদের যোগ নেই।</p>}>
      <LoomGame />
    </GamePage>
  );
}
