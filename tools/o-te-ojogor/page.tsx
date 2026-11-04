import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { OjogorGame } from "./components/ojogor-game";
import { site } from "./content";

export default function OTeOjogorPage() {
  return (
    <GamePage site={site} kids note={<ParentNote
      learns="বর্ণের ক্রম আর চেহারা: অ-এর পর আ, ক-এর পর খ। শেষের লেভেলে ছোট শব্দ বানান আর ১ থেকে ২০ গোনা।"
      age="৪–৮ বছর"
      together="ও ঝুড়ি সরাক, তুমি পরের বর্ণটা জোরে বলো। ধরার পর ছবির শব্দটা একসাথে বলো: অ-তে অজগর। ৪ বছরে ‘ধীরে খেলো’ চালু রাখো।" />}>
      <OjogorGame />
    </GamePage>
  );
}
