import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { OjogorGame } from "./components/tree-game";
import { site } from "./content";

export default function OTeOjogorPage() {
  return (
    <GamePage site={site} kids note={<ParentNote
      learns="বর্ণের ক্রম আর চেহারা: অ-এর পর আ, ক-এর পর খ। শেষের লেভেলে ছোট শব্দ বানান আর ১ থেকে ২০ গোনা।"
      age="৪–৮ বছর"
      together="ও ফল ছোঁয়াক, তুমি বর্ণটা জোরে বলো। ঝুড়িতে পড়লে ছবির শব্দটা একসাথে বলো: অ-তে অজগর। ৭ বছরের আগে গাছতলাতেই খেলুক, ঝড়ো হাওয়ায় নয়।" />}>
      <OjogorGame />
    </GamePage>
  );
}
