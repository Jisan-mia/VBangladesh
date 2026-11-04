import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { NameBook } from "./components/name-book";
import { site } from "./content";

export default function NamShikhiPage() {
  return (
    <GamePage site={site} kids note={<ParentNote
      learns="পশুপাখি, ফল, সবজি, শরীর, রং আর দেশের প্রতীকের নাম, বাংলা ও ইংরেজিতে। প্রথম লেভেলগুলোতে পড়তে হয় না: ছবি দেখে স্টিকার মেলায়, নামটা আসে পুরস্কার হয়ে।"
      age="৩–৭ বছর"
      together="স্টিকার বসলে নামটা জোরে পড়ে শোনাও, ও তোমার সাথে বলুক। পরে উল্টো খেলো: তুমি ঘরের একটা জিনিস দেখাও, ও ইংরেজি নামটা বলুক।"
      school="প্রাক-প্রাথমিকে রং আর শরীর, ক্লাস ৩ থেকে জাতীয় প্রতীক।" />}>
      <NameBook />
    </GamePage>
  );
}
